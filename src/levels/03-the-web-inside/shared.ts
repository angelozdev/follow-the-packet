import type { NetworkAction, Site } from '@/engine';
import type { AddressChip, MessageChip, SendTask } from '@/levels/contract/incident';
import { DEVICE, ORIGIN, PORT, sendTaskFrom } from '@/levels/02-ports-and-names/shared';

export { DEVICE, IP, NAME, ORIGIN, PORT, sendMoveFrom } from '@/levels/02-ports-and-names/shared';

export const ORDER_PATH = '/pedidos';
const WRONG_PATH = '/pedido';
const ORDERS_SITE_ID = 'orders';
const LOCALHOST = 'localhost';

/** The body each order answers with, as the order book of the app writes it. The orders 7 and 8 are the ones the app starts with; 9 and 10 are the ones two equal posts create. */
export const ORDER_BODY = {
  seven: 'Pedido 7: 2 cafés.',
  eight: 'Pedido 8: 1 té.',
} as const;

const NOT_FOUND_BODY = 'No hay nada en ese camino.';
const ORDER_BOOK: NonNullable<Site['orders']> = {
  template: 'Pedido {id}: {content}.',
  start: [
    { id: 7, content: '2 cafés' },
    { id: 8, content: '1 té' },
  ],
};

const READ_ORDERS: Site['pages'][number] = { path: ORDER_PATH, methods: ['GET'], handler: { kind: 'order-read' } };

/** Returns the action that makes the program of laptop-lucia on port 3000 answer HTTP with the orders site, which serves these pages. The site has no name, so it answers to any name: it is the default site of the service. */
function ordersApp(pages: Site['pages']): NetworkAction {
  const site: Site = { id: ORDERS_SITE_ID, names: [], pages, notFoundBody: NOT_FOUND_BODY, orders: ORDER_BOOK };
  return { type: 'setWebService', ownerId: DEVICE.lucia.id, port: PORT.app, web: { sites: [site], defaultSiteId: ORDERS_SITE_ID } };
}

/** What 03-01 changes on laptop-lucia: the program of port 3000, which since 02-01 only accepted connections, now answers HTTP. A GET of /pedidos with an id gives the order; any other path gives «No hay nada en ese camino.». Nothing else about the laptop changes. */
export const APP_ANSWERS_HTTP: NetworkAction = ordersApp([READ_ORDERS]);

export const MESSAGE = {
  curl: { id: 'curl', label: '{{curl}}', command: 'curl' },
} as const satisfies Record<string, MessageChip>;

/** Returns the address chip of the url `http://localhost:<port><path>?<query>`, given by parts as the strip of 03-01 draws it. */
function urlByParts(port: number, path: string, query: string): AddressChip {
  return { id: `url-${port}-${path.slice(1)}-${query.replace('=', '-')}`, address: LOCALHOST, scheme: 'http', port, path, query };
}

const PARTS = {
  ports: [PORT.app, PORT.web],
  paths: [ORDER_PATH, WRONG_PATH],
  queries: ['id=7', 'id=8'],
} as const;

/** The eight address chips of 03-01: every combination of the port (3000 or 80), the path (/pedidos or /pedido) and the query string (id=7 or id=8), after the scheme http and the name localhost. The strip needs the whole product, because the url the player writes is the chip whose parts it picks. */
export const URLS_BY_PARTS: AddressChip[] = PARTS.ports.flatMap((port) => PARTS.paths.flatMap((path) => PARTS.queries.map((query) => urlByParts(port, path, query))));

export const ADDRESS = {
  orderSeven: urlByParts(PORT.app, ORDER_PATH, 'id=7'),
  orderEight: urlByParts(PORT.app, ORDER_PATH, 'id=8'),
} as const;

export const TASK = {
  orderSeven: 'curl-order-7',
  orderEight: 'curl-order-8',
} as const;

/** Returns the task of a send incident that expects the response of laptop-lucia to a curl of its own terminal to this address to have exactly this body. */
export function bodyTask(id: string, text: string, toId: string, body: string): SendTask {
  const { expect } = sendTaskFrom(ORIGIN.lucia, id, text, MESSAGE.curl.id, toId, 'replied');
  return { id, text, expect: { ...expect, body } };
}

/** The ids of the pieces 03-01 and 03-02 draw: laptop-lucia, whose firewall is drawn with it. Its own app answers its own curl through the loopback, so nothing else is on the path. */
export const PAGE_PIECES: string[] = [DEVICE.lucia.id];
