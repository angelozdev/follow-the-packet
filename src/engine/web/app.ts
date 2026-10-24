import { sameName } from '@/engine/dns/records';
import { denialOf, loginUserOf, type Denial } from './identity/access';
import { basicChallenge } from './identity/basic-credential';
import { SET_COOKIE_HEADER } from './identity/cookies';
import { sessionCookieOf, type SessionUsers } from './identity/sessions';
import { responseOf, type AppRequest, type AppResponse } from './messages';
import type { Order, Site, WebService } from './schema';

export type Orders = readonly Order[];

/** The orders of every app after the sends so far, by the key of the app (`appKey`). An app with no entry has its `start` orders. */
export type Apps = Readonly<Record<string, Orders>>;

/** What an app answered and the orders it holds afterwards; `sessions` are the ones it holds afterwards when it opened one, and `denial` says why when a page that asks for a role, or a login, answered 401 or 403. */
interface Answer {
  response: AppResponse;
  orders: Orders;
  sessions?: SessionUsers;
  denial?: Denial;
}

const NO_SESSIONS: SessionUsers = [];

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

function idParamOf(query: string | undefined): string | null {
  return new URLSearchParams(query).get(ORDER_ID_PARAM);
}

function orderIdOf(query: string | undefined): number | undefined {
  const id = idParamOf(query);
  return id !== null && DIGITS.test(id) ? Number(id) : undefined;
}

function misspelledIdBody(site: Site, query: string | undefined): string | undefined {
  const id = idParamOf(query);
  return id !== null && !DIGITS.test(id) ? site.orders?.badIdBody : undefined;
}

function missing(site: Site, orders: Orders): Answer {
  return { response: responseOf(404, site.notFoundBody), orders };
}

function rejected(body: string, orders: Orders): Answer {
  return { response: responseOf(400, body), orders };
}

function denied(accounts: NonNullable<Site['accounts']>, denial: Denial, orders: Orders): Answer {
  const response = denial.kind === 'forbidden' ? responseOf(403, accounts.forbiddenBody) : responseOf(401, accounts.unauthorizedBody, { 'WWW-Authenticate': basicChallenge(accounts.realm) });
  return { response, orders, denial };
}

function served(site: Site, { id, content }: Order, orders: Orders): Answer {
  const body = site.orders!.template.replace(ID_SLOT, () => String(id)).replace(CONTENT_SLOT, () => content);
  return { response: responseOf(200, body), orders };
}

/** Answers a request with the page of the site that has its path and its method, or with its 404 when none does, and returns the orders after it. A get reads the order of the `id` of the query, a post adds the next order with the body, and a put replaces the content of the order of the `id` with the body; an order that does not exist answers 404. A site whose order book has a `badIdBody` checks the `id` where a get or a put reads it: an `id` that is not a number answers 400 with that body, and a request with no `id` still answers 404. A page that asks for a role answers only to a user of the site who has it, by the credential of its Authorization header or by the session its Cookie names: a request with no valid user gets a 401 with WWW-Authenticate and a user without the role a 403, each with the body of the site (`denial` says which). A login page opens a session for the user whose name and password its body gives and answers 200 with the cookie of that session (`sessions` are then the ones the app holds with the new one), or 401 and no cookie. The orders and the sessions it receives are not changed. */
export function answerRequest(site: Site, orders: Orders, { method, path, query, headers, body }: AppRequest, sessions: SessionUsers = NO_SESSIONS): Answer {
  const page = site.pages.find((candidate) => candidate.path === path && candidate.methods.includes(method));
  if (!page) return missing(site, orders);
  const denial = page.role === undefined ? undefined : denialOf(site.accounts!, page.role, headers, sessions);
  if (denial) return denied(site.accounts!, denial, orders);
  const current = orders.find(({ id }) => id === orderIdOf(query));
  const badIdBody = misspelledIdBody(site, query);
  switch (page.handler.kind) {
    case 'fixed':
      return { response: responseOf(200, page.handler.body), orders };
    case 'login': {
      const user = loginUserOf(site.accounts!, body);
      if (user === undefined) return denied(site.accounts!, { kind: 'needs-login' }, orders);
      const opened = [...sessions, user];
      return { response: responseOf(200, page.handler.body, { [SET_COOKIE_HEADER]: sessionCookieOf(opened.length) }), orders, sessions: opened };
    }
    case 'order-read':
      if (badIdBody !== undefined) return rejected(badIdBody, orders);
      return current ? served(site, current, orders) : missing(site, orders);
    case 'order-create': {
      const created = { id: Math.max(0, ...orders.map(({ id }) => id)) + 1, content: body ?? '' };
      return served(site, created, [...orders, created]);
    }
    case 'order-replace': {
      if (badIdBody !== undefined) return rejected(badIdBody, orders);
      const replaced = current && { ...current, content: body ?? '' };
      return replaced ? served(site, replaced, orders.map((order) => (order === current ? replaced : order))) : missing(site, orders);
    }
  }
}
