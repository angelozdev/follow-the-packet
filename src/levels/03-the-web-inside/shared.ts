import type { NetworkAction, Service, Site, SiteContent } from '@/engine';
import type { AddressChip, MessageChip, OriginChip, PlaceEntryMove, PlaceMove, SendTask, TableSpec } from '@/levels/contract/incident';
import { DEVICE, DOMAIN, FIREWALL, HOSTNAME, IP, ORIGIN, PORT, ROUTER, SERVER, SSH_FROM, SSH_WHAT, sendTaskFrom, tcpChip, tcpService } from '@/levels/02-ports-and-names/shared';

export { DEVICE, HOSTNAME, IP, NAME, ORIGIN, PORT, SERVER, sendMoveFrom, sendTaskFrom } from '@/levels/02-ports-and-names/shared';

export const ORDER_PATH = '/pedidos';
const WRONG_PATH = '/pedido';
const ORDERS_SITE_ID = 'orders';
const LOCALHOST = 'localhost';

const POST_BODY = 'producto=café';
const PUT_BODY = 'producto=té';

/** The body each order answers with, as the order book of the app writes it. The orders 7 and 8 are the ones the app starts with; 9 and 10 are the ones two equal posts create, and `replaced` is the order 7 once a put has changed it. */
export const ORDER_BODY = {
  seven: 'Pedido 7: 2 cafés.',
  eight: 'Pedido 8: 1 té.',
  nine: `Pedido 9: ${POST_BODY}.`,
  ten: `Pedido 10: ${POST_BODY}.`,
  replaced: `Pedido 7: ${PUT_BODY}.`,
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
const CREATE_ORDERS: Site['pages'][number] = { path: ORDER_PATH, methods: ['POST'], handler: { kind: 'order-create' } };
const REPLACE_ORDERS: Site['pages'][number] = { path: ORDER_PATH, methods: ['PUT'], handler: { kind: 'order-replace' } };

const ORDER_PAGES = [READ_ORDERS, CREATE_ORDERS, REPLACE_ORDERS];

/** Returns the web service of the program of laptop-lucia on port 3000 with the orders site, which serves these pages. The site has no name, so it answers to any name: it is the default site of the service. */
function ordersWeb(pages: Site['pages']): NonNullable<Service['web']> {
  const site: Site = { id: ORDERS_SITE_ID, names: [], pages, notFoundBody: NOT_FOUND_BODY, orders: ORDER_BOOK };
  return { sites: [site], defaultSiteId: ORDERS_SITE_ID };
}

/** Returns the action that makes the program of laptop-lucia on port 3000 answer HTTP with the orders site, which serves these pages. */
function ordersApp(pages: Site['pages']): NetworkAction {
  return { type: 'setWebService', ownerId: DEVICE.lucia.id, port: PORT.app, web: ordersWeb(pages) };
}

/** What 03-01 changes on laptop-lucia: the program of port 3000, which since 02-01 only accepted connections, now answers HTTP. A GET of /pedidos with an id gives the order; any other path gives «No hay nada en ese camino.». Nothing else about the laptop changes. */
export const APP_ANSWERS_HTTP: NetworkAction = ordersApp([READ_ORDERS]);

/** What 03-02 changes on laptop-lucia: the same program of port 3000 now also takes orders. A POST to /pedidos creates the next order with the body it carries (a POST to the address of an order, /pedidos?id=<n>, creates nothing), and a PUT to /pedidos?id=<n> replaces the content of that order with its body. Nothing else about the laptop changes. */
export const APP_TAKES_ORDERS: NetworkAction = ordersApp(ORDER_PAGES);

export const REPORTS_PORT = 3001;
const REPORTS_SITE_ID = 'reports';
const REPORTS_WEB: NonNullable<Service['web']> = { sites: [{ id: REPORTS_SITE_ID, names: [], pages: [], notFoundBody: NOT_FOUND_BODY }], defaultSiteId: REPORTS_SITE_ID };

const PROCESS = {
  orders: { id: 'orders-app', name: 'app-pedidos' },
  reports: { id: 'reports-app', name: 'app-reportes' },
} as const;

/** What 03-03 changes on laptop-lucia: her programs are processes. The orders app (port 3000, with the pages 03-02 left it) listens from the process app-pedidos, and a reports app (port 3001, a web app too, with no page yet) from app-reportes; both run. Her database (5432) and SSH (22) keep their services. `setServices` replaces the list, so it holds all four. */
export const APPS_AS_PROCESSES: NetworkAction = {
  type: 'setServices',
  ownerId: DEVICE.lucia.id,
  services: [
    { ...tcpService(PORT.app), processId: PROCESS.orders.id, web: ordersWeb(ORDER_PAGES) },
    tcpService(PORT.database),
    tcpService(PORT.ssh),
    { ...tcpService(REPORTS_PORT), processId: PROCESS.reports.id, web: REPORTS_WEB },
  ],
  processes: [PROCESS.orders, PROCESS.reports].map((process) => ({ ...process, running: true })),
};

/** What 03-03 changes next on laptop-lucia: Lucía closed the terminal where her reports app ran, so the process app-reportes is no longer running and its service on port 3001 no longer listens. The orders app goes on. */
export const REPORTS_CLOSED: NetworkAction = { type: 'setProcess', deviceId: DEVICE.lucia.id, processId: PROCESS.reports.id, running: false };

export const MESSAGE = {
  curl: { id: 'curl', label: '{{curl}}', command: 'curl' },
  curlPost: { id: 'curl-post', label: `{{curl}} -d ${POST_BODY}`, command: 'curl', options: { data: POST_BODY } },
  curlPut: { id: 'curl-put', label: `{{curl}} -X PUT -d ${PUT_BODY}`, command: 'curl', options: { request: 'PUT', data: PUT_BODY } },
  curlTimeout: { id: 'curl-timeout', label: '{{curl}} --connect-timeout 3', command: 'curl', options: { connectTimeout: 3 } },
  curlInclude: { id: 'curl-include', label: '{{curl}} -i', command: 'curl', options: { include: true } },
  browser: { id: 'browser', label: '{{browser}}', command: 'browser' },
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

/** Returns the address chip of 03-02 with this id, given whole: the url of the orders app of laptop-lucia, with this query when there is one. */
function wholeUrl(id: string, query?: string): AddressChip {
  return { id, address: LOCALHOST, url: `http://${LOCALHOST}:${PORT.app}${ORDER_PATH}${query === undefined ? '' : `?${query}`}` };
}

export const ORDER_URL = {
  seven: wholeUrl('url-order-7', 'id=7'),
  eight: wholeUrl('url-order-8', 'id=8'),
  all: wholeUrl('url-orders'),
  nine: wholeUrl('url-order-9', 'id=9'),
} as const;

/** The two urls of laptop-lucia on her network that 03-03 asks for, each given whole: the page of the order 7 of her orders app (port 3000) and the root of her reports app (port 3001). */
export const LUCIA_URL = {
  orders: { id: 'url-lucia-orders', address: IP.lucia, url: `http://${IP.lucia}:${PORT.app}${ORDER_PATH}?id=7` },
  reports: { id: 'url-lucia-reports', address: IP.lucia, url: `http://${IP.lucia}:${REPORTS_PORT}/` },
} as const satisfies Record<string, AddressChip>;

export const TASK = {
  orderSeven: 'curl-order-7',
  orderEight: 'curl-order-8',
  getEight: 'get-order-8',
  posts: 'two-equal-posts',
  puts: 'two-equal-puts',
  page: 'browser-gets-the-page',
  reportsRefused: 'curl-to-reports-is-refused',
  shopByName: 'www-gets-the-shop',
  blogByName: 'blog-gets-the-blog',
  shopByIp: 'the-ip-gets-the-shop',
} as const;

/** Returns the task of a send incident that expects the response to a message of a terminal (the one of laptop-lucia and a plain curl unless it says otherwise) to this address to have exactly this body, in the last send of those chips or in the nth, since the world last changed, when it says `nth`. */
export function bodyTask(id: string, text: string, toId: string, body: string, { origin = ORIGIN.lucia, messageId = MESSAGE.curl.id, nth }: { origin?: OriginChip; messageId?: string; nth?: number } = {}): SendTask {
  const { expect } = sendTaskFrom(origin, id, text, messageId, toId, 'replied');
  return { id, text, expect: { ...expect, body, ...(nth !== undefined && { nth }) } };
}

/** The ids of the pieces 03-01 and 03-02 draw: laptop-lucia, whose firewall is drawn with it. Its own app answers its own curl through the loopback, so nothing else is on the path. */
export const PAGE_PIECES: string[] = [DEVICE.lucia.id];

/** The ids of the pieces 03-03 draws: your laptop, which asks for the page, and laptop-lucia, whose firewall is drawn with it and whose two programs answer or refuse. */
export const LAN_PIECES: string[] = [DEVICE.you.id, DEVICE.lucia.id];

const APP_RULE_TYPE = tcpChip(PORT.app, PORT.app);

/** The chips that write a rule in the firewall of laptop-lucia in 03-03: the Type chips `TCP · 3000`, `TCP · 3001` and `TCP · 1-1023`, and the Source chips of your laptop, of the block of the first floor and of any IP. */
export const LUCIA_RULES = {
  firewallId: FIREWALL.lucia,
  what: [APP_RULE_TYPE, tcpChip(REPORTS_PORT, REPORTS_PORT), SSH_WHAT.wellKnown],
  from: [SSH_FROM.you, SSH_FROM.floor, SSH_FROM.anyone],
};

/** The move that writes the rule the incident asks for: TCP port 3000 from the block of the first floor, which holds your laptop. */
export const OPEN_APP_TO_FLOOR: PlaceMove = { type: 'placeRule', firewallId: FIREWALL.lucia, whatId: APP_RULE_TYPE.id, fromId: SSH_FROM.floor.id };

export const SITE_BODY = { shop: 'La tienda', blog: 'El blog' } as const;
const SHOP_ID = 'shop';

/** Returns what a site of 03-04 serves: its home page with this body, and the 404 body of the app of laptop-lucia for any other path. */
function siteServing(body: string): SiteContent {
  return { notFoundBody: NOT_FOUND_BODY, pages: [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body } }] };
}

/** What 03-04 changes on servidor-nuevo: its program on port 80, which since 02-12 only accepted connections, is now a web server with one site, the shop, named www.lucia.example. It is also the default site, the one it serves to a request whose Host names no site. */
export const SHOP_SERVER: NetworkAction = {
  type: 'setWebService',
  ownerId: SERVER.fresh.id,
  port: PORT.web,
  web: { sites: [{ id: SHOP_ID, names: [HOSTNAME.www], ...siteServing(SITE_BODY.shop) }], defaultSiteId: SHOP_ID },
};

/** The three urls 03-04 asks for, each given whole and with no port, so they go to port 80: the shop by its name, the blog by its name (an alias of the shop) and servidor-nuevo by its IP alone. */
export const SITE_URL = {
  www: { id: 'url-www', address: HOSTNAME.www, url: `http://${HOSTNAME.www}/` },
  blog: { id: 'url-blog', address: HOSTNAME.blog, url: `http://${HOSTNAME.blog}/` },
  ip: { id: 'url-ip', address: IP.freshServer, url: `http://${IP.freshServer}/` },
} as const satisfies Record<string, AddressChip>;

const SITES_TABLE_ID = 'sites';
export const BLOGS_NAME = `blogs.${DOMAIN.site}`;
export const SITE_CHIP = {
  name: { blog: 'name-blog', blogs: 'name-blogs' },
  serves: { blog: 'serves-blog' },
} as const;

/** The table of sites of servidor-nuevo that 03-04 lets the player edit: the name of the site (blog.lucia.example, or blogs.lucia.example with one letter too many) and what it serves (the blog). */
export const SITES_TABLE: TableSpec = {
  id: SITES_TABLE_ID,
  kind: 'sites',
  ownerId: SERVER.fresh.id,
  port: PORT.web,
  trays: {
    name: [
      { id: SITE_CHIP.name.blog, label: HOSTNAME.blog, value: HOSTNAME.blog },
      { id: SITE_CHIP.name.blogs, label: BLOGS_NAME, value: BLOGS_NAME },
    ],
    serves: [
      { id: SITE_CHIP.serves.blog, label: SITE_BODY.blog, value: siteServing(SITE_BODY.blog) },
    ],
  },
};

/** Returns the move that adds a site to the table of 03-04, with these chips of the name tray and of the tray of what it serves. */
export function siteMove(nameId: string, servesId: string): PlaceEntryMove {
  return { type: 'placeEntry', tableId: SITES_TABLE_ID, picks: { name: nameId, serves: servesId } };
}

/** The ids of the pieces 03-04 draws: your laptop, the resolver that gives the IP of each name, the router between them and servidor-nuevo, which hosts the sites. */
export const SITE_PIECES: string[] = [DEVICE.you.id, SERVER.resolver.id, ROUTER.office.id, SERVER.fresh.id];
