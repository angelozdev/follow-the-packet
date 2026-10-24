import { sameName } from '@/engine/dns/records';
import { responseOf, type AppRequest, type AppResponse } from './messages';
import type { Order, Site, WebService } from './schema';

export type Orders = readonly Order[];

/** The orders of every app after the sends so far, by the key of the app (`appKey`). An app with no entry has its `start` orders. */
export type Apps = Readonly<Record<string, Orders>>;

/** What an app answered and the orders it holds afterwards. */
interface Answer {
  response: AppResponse;
  orders: Orders;
}

const ORDER_ID_PARAM = 'id';
const ID_SLOT = '{id}';
const CONTENT_SLOT = '{content}';
const DIGITS = /^\d+$/;

/** The key under which the orders of a site are carried: the device or server that listens, its port and the site. */
export function appKey(ownerId: string, port: number, siteId: string): string {
  return `${ownerId}:${port}:${siteId}`;
}

/** Picks the site whose names include the host of the request, or else the default site of the service; `named` says which. The IP the request went to plays no part: only the host it carries. */
export function chooseSite(web: WebService, host: string): { site: Site; named: boolean } {
  const site = web.sites.find(({ names }) => names.some((name) => sameName(name, host)));
  return site ? { site, named: true } : { site: web.sites.find(({ id }) => id === web.defaultSiteId)!, named: false };
}

function orderIdOf(query: string | undefined): number | undefined {
  const id = new URLSearchParams(query).get(ORDER_ID_PARAM);
  return id !== null && DIGITS.test(id) ? Number(id) : undefined;
}

function hasOrderId(query: string | undefined): boolean {
  return new URLSearchParams(query).has(ORDER_ID_PARAM);
}

function missing(site: Site, orders: Orders): Answer {
  return { response: responseOf(404, site.notFoundBody), orders };
}

function served(site: Site, { id, content }: Order, orders: Orders): Answer {
  const body = site.orders!.template.replace(ID_SLOT, () => String(id)).replace(CONTENT_SLOT, () => content);
  return { response: responseOf(200, body), orders };
}

/** Answers a request with the page of the site that has its path and its method, or with its 404 when none does, and returns the orders after it. A get reads the order of the `id` of the query, a post adds the next order with the body, and a put replaces the content of the order of the `id` with the body; an order that does not exist answers 404, and so does a post whose query names an order, because a post goes to the orders and not to one of them. The orders it receives are not changed. */
export function answerRequest(site: Site, orders: Orders, { method, path, query, body }: AppRequest): Answer {
  const page = site.pages.find((candidate) => candidate.path === path && candidate.methods.includes(method));
  if (!page) return missing(site, orders);
  const current = orders.find(({ id }) => id === orderIdOf(query));
  switch (page.handler.kind) {
    case 'fixed':
      return { response: responseOf(200, page.handler.body), orders };
    case 'order-read':
      return current ? served(site, current, orders) : missing(site, orders);
    case 'order-create': {
      if (hasOrderId(query)) return missing(site, orders);
      const created = { id: Math.max(0, ...orders.map(({ id }) => id)) + 1, content: body ?? '' };
      return served(site, created, [...orders, created]);
    }
    case 'order-replace': {
      const replaced = current && { ...current, content: body ?? '' };
      return replaced ? served(site, replaced, orders.map((order) => (order === current ? replaced : order))) : missing(site, orders);
    }
  }
}
