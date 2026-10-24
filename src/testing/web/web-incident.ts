import { applyAction, type Firewall, type Network, type Service, type Site, type SiteContent } from '@/engine';
import type { SendIncident } from '@/levels';
import { EVERY_TERM, NAME_SERVER_PIECES, OFFICE_FLOORS, allOut, device, officeWithNames, withDevice } from '@/testing/fixtures';
import { sendIncident } from '@/testing/incidents';

const { floor1, server } = OFFICE_FLOORS;
const { zone } = NAME_SERVER_PIECES;

export const WEB_PORT = 80;
export const APP_PORT = 3000;
const SSH_PORT = 22;
const LUCIA = 'lucia-laptop';
const NOT_FOUND_BODY = 'No hay nada en esa URL.';
const SHOP_BODY = 'La tienda';
const BLOG_BODY = 'El blog';
const ORDER_PATH = '/pedidos';
const ORDER_KINDS = [['GET', 'order-read'], ['POST', 'order-create'], ['PUT', 'order-replace']] as const;
const ORDER_URL = `http://${floor1.lucia}:${APP_PORT}${ORDER_PATH}`;

const SHOP_NAME = `www.${zone}`;
export const BLOG_NAME = `blog.${zone}`;
const BLOGS_NAME = `blogs.${zone}`;
export const LUCIA_FIREWALL = 'fw-lucia';

const home = (body: string): Site['pages'] => [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body } }];

const ordersSite: Site = {
  id: 'orders',
  names: [],
  notFoundBody: NOT_FOUND_BODY,
  orders: { template: 'Pedido {id}: {content}', start: [{ id: 7, content: '2 cafés' }, { id: 8, content: '1 té' }] },
  pages: ORDER_KINDS.map(([method, kind]) => ({ path: ORDER_PATH, methods: [method], handler: { kind } })),
};

const shopSite: Site = { id: 'shop', names: [SHOP_NAME], notFoundBody: NOT_FOUND_BODY, pages: home(SHOP_BODY) };
export const BLOG_CONTENT: SiteContent = { notFoundBody: NOT_FOUND_BODY, pages: home(BLOG_BODY) };
const SHOP_CONTENT: SiteContent = { notFoundBody: NOT_FOUND_BODY, pages: home(SHOP_BODY) };

const luciaFirewall: Firewall = { id: LUCIA_FIREWALL, name: 'laptop-lucia', kind: 'host-firewall', inbound: [], outbound: [allOut(`${LUCIA_FIREWALL}-out`)] };
const luciaServices: Service[] = [
  { protocol: 'tcp', port: APP_PORT, listen: 'all', web: { sites: [ordersSite], defaultSiteId: ordersSite.id } },
  { protocol: 'tcp', port: SSH_PORT, listen: 'all' },
];

/** Returns the office with names where laptop-lucia has an orders app on port 3000 (orders 7 and 8) and an SSH service on 22 that speaks no HTTP, behind a host firewall with no inbound rules, and the server of the internet has a web service on port 80 with the shop at `www.lucia.example` as its only and default site. */
export function webNet(): Network {
  const office = withDevice(officeWithNames(), LUCIA, { firewallIds: [luciaFirewall.id], host: { ignoreIcmpEcho: false, services: luciaServices } });
  const guarded = { ...office, firewalls: [luciaFirewall] };
  return applyAction(guarded, { type: 'setServices', ownerId: server.id, services: [{ protocol: 'tcp', port: WEB_PORT, listen: 'all', web: { sites: [shopSite], defaultSiteId: shopSite.id } }] });
}

const orderUrl = (query: number) => ({ address: 'localhost', scheme: 'http', port: APP_PORT, path: ORDER_PATH, query: `id=${query}` }) as const;

const PARTS_PORTS = [APP_PORT, WEB_PORT];
const PARTS_PATHS = [ORDER_PATH, '/pedido'];
const PARTS_QUERIES = ['id=7', 'id=8'];
const PARTS_ORDER_7 = `${APP_PORT}${ORDER_PATH}-id=7`;

/** Returns a send incident on `webNet` with every term introduced that offers what the first incident of chapter 3 offers: laptop-lucia as the only origin, the message `curl` alone, and eight address chips given by parts (the scheme `http`, the name `localhost`, the port 3000 or 80, the path `/pedidos` or `/pedido` and the query `id=7` or `id=8`, each combination once). Its one task expects the body of order 7 from the chip of port 3000, path `/pedidos` and query `id=7`. */
export function addressByPartsIncident(): SendIncident {
  const base = webSendIncident();
  return {
    ...base,
    tasks: [{ id: 'order-7', text: 'Que el curl devuelva el pedido 7.', expect: { fromId: 'lucia', toId: PARTS_ORDER_7, messageId: 'curl', outcome: 'replied', body: 'Pedido 7: 2 cafés' } }],
    send: {
      from: [{ id: 'lucia', endpoint: device(LUCIA) }],
      to: PARTS_PORTS.flatMap((port) =>
        PARTS_PATHS.flatMap((path) => PARTS_QUERIES.map((query) => ({ id: `${port}${path}-${query}`, address: 'localhost', scheme: 'http' as const, port, path, query }))),
      ),
      message: [{ id: 'curl', label: 'curl', command: 'curl' }],
    },
    solution: [{ type: 'sendPacket', fromId: 'lucia', toId: PARTS_ORDER_7, messageId: 'curl' }],
  };
}

/** Returns a send incident on `webNet` with every term introduced. It offers two origins (your laptop and laptop-lucia), URL chips by parts (the orders 7 and 8 of the app of laptop-lucia through localhost, and its closed port 80) and whole (the orders app by its IP, the shop, the blog and the server by its IP), the messages `curl`, `curl -i`, `curl -d`, `curl -X PUT -d`, `curl --connect-timeout 3` and the browser, the rules card of the firewall of laptop-lucia (TCP 3000 or 3001, from your laptop or from anyone), a table of sites on the server of the internet (the name `blog.lucia.example`, `blogs.lucia.example` or `www.lucia.example`, which the shop already has, serving the blog or the shop) and a clock of one step. Its tasks expect the body of order 7, the blog, and the body of the second post, and its solution places the site, the rule and sends. */
export function webSendIncident(): SendIncident {
  return {
    ...sendIncident(),
    id: '09-02',
    order: 2,
    title: 'Pedir una página',
    introduces: [...EVERY_TERM],
    base: webNet(),
    report: 'Lucía instaló un servidor web.',
    tasks: [
      { id: 'order-7', text: 'Que el curl devuelva el pedido 7.', expect: { fromId: 'lucia', toId: 'app-7', messageId: 'curl', outcome: 'replied', body: 'Pedido 7: 2 cafés' } },
      { id: 'blog', text: 'Que el blog reciba el blog.', expect: { fromId: 'you', toId: 'blog', messageId: 'curl', outcome: 'replied', body: BLOG_BODY } },
      { id: 'second-post', text: 'Que el segundo POST deje el pedido 10.', expect: { fromId: 'you', toId: 'orders', messageId: 'curl-post', outcome: 'replied', nth: 2, body: 'Pedido 10: item=coffee' } },
    ],
    flows: [],
    send: {
      from: [{ id: 'you', endpoint: device('your-laptop') }, { id: 'lucia', endpoint: device(LUCIA) }],
      to: [
        { id: 'app-7', ...orderUrl(7) },
        { id: 'app-8', ...orderUrl(8) },
        { id: 'app-80', ...orderUrl(7), port: WEB_PORT },
        { id: 'orders', address: floor1.lucia, url: ORDER_URL },
        { id: 'shop', address: SHOP_NAME, url: `http://${SHOP_NAME}/` },
        { id: 'blog', address: BLOG_NAME, url: `http://${BLOG_NAME}/` },
        { id: 'ip', address: server.ip, url: `http://${server.ip}/` },
      ],
      message: [
        { id: 'curl', label: 'curl', command: 'curl' },
        { id: 'curl-i', label: 'curl -i', command: 'curl', options: { include: true } },
        { id: 'curl-post', label: 'curl -d item=coffee', command: 'curl', options: { data: 'item=coffee' } },
        { id: 'curl-put', label: 'curl -X PUT -d item=tea', command: 'curl', options: { request: 'PUT', data: 'item=tea' } },
        { id: 'curl-timeout', label: 'curl --connect-timeout 3', command: 'curl', options: { connectTimeout: 3 } },
        { id: 'browser', label: 'Navegador', command: 'browser' },
      ],
      rules: {
        firewallId: LUCIA_FIREWALL,
        what: [
          { id: 'tcp-3000', label: 'TCP · 3000', what: { kind: 'tcp', fromPort: APP_PORT, toPort: APP_PORT } },
          { id: 'tcp-3001', label: 'TCP · 3001', what: { kind: 'tcp', fromPort: 3001, toPort: 3001 } },
        ],
        from: [
          { id: 'you', label: 'tu-laptop', peer: { kind: 'cidr', cidr: `${floor1.you}/32` } },
          { id: 'anyone', label: 'Cualquier IP de origen', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } },
        ],
      },
      tables: [
        {
          id: 'sites',
          kind: 'sites',
          ownerId: server.id,
          port: WEB_PORT,
          trays: {
            name: [{ id: 'blog', label: BLOG_NAME, value: BLOG_NAME }, { id: 'blogs', label: BLOGS_NAME, value: BLOGS_NAME }, { id: 'shop-name', label: SHOP_NAME, value: SHOP_NAME }],
            serves: [{ id: 'serve-blog', label: 'El blog', value: BLOG_CONTENT }, { id: 'serve-shop', label: 'La tienda', value: SHOP_CONTENT }],
          },
        },
      ],
      clock: { steps: [{ id: 'one-minute', label: 'Esperar 1 min', seconds: 60 }] },
    },
    solution: [
      { type: 'placeEntry', tableId: 'sites', picks: { name: 'blog', serves: 'serve-blog' } },
      { type: 'placeRule', firewallId: LUCIA_FIREWALL, whatId: 'tcp-3000', fromId: 'you' },
      { type: 'sendPacket', fromId: 'lucia', toId: 'app-7', messageId: 'curl' },
      { type: 'sendPacket', fromId: 'you', toId: 'blog', messageId: 'curl' },
      { type: 'sendPacket', fromId: 'you', toId: 'orders', messageId: 'curl-post' },
      { type: 'sendPacket', fromId: 'you', toId: 'orders', messageId: 'curl-post' },
    ],
  };
}

const ADMIN_PATH = '/admin';
const ADMIN_BODY = 'Panel de administración.';
const ADMIN_URL = `http://${floor1.lucia}:${APP_PORT}${ADMIN_PATH}`;
const SIGNED_IN_BODY = 'Sesión iniciada.';
const LOGIN_PATH = '/login';
const ACCOUNTS: NonNullable<Site['accounts']> = {
  users: [{ name: 'lucia', password: 'clave-lucia', role: 'admin' }, { name: 'marta', password: 'clave-marta', role: 'staff' }],
  realm: 'admin',
  unauthorizedBody: 'Hace falta un usuario y una contraseña válidos.',
  forbiddenBody: 'Ese usuario no tiene permiso para entrar aquí.',
};
const signInSite: Site = {
  ...ordersSite,
  accounts: ACCOUNTS,
  pages: [...ordersSite.pages, { path: LOGIN_PATH, methods: ['POST'], handler: { kind: 'login', body: SIGNED_IN_BODY } }, { path: ADMIN_PATH, methods: ['GET'], role: 'admin', handler: { kind: 'fixed', body: ADMIN_BODY } }],
};

/** Returns `webNet` where the orders app of laptop-lucia also has the `/login` page, the `/admin` page that asks for the `admin` role and two users, Lucía (admin, password `clave-lucia`) and Marta (staff, password `clave-marta`), and where its firewall lets your laptop reach port 3000. */
function signInNet(): Network {
  const net = applyAction(webNet(), { type: 'setWebService', ownerId: LUCIA, port: APP_PORT, web: { sites: [signInSite], defaultSiteId: signInSite.id } });
  const allowYou = { id: 'app-from-you', what: { kind: 'tcp', fromPort: APP_PORT, toPort: APP_PORT }, peer: { kind: 'cidr', cidr: `${floor1.you}/32` } } as const;
  return { ...net, firewalls: net.firewalls.map((firewall) => (firewall.id === LUCIA_FIREWALL ? { ...firewall, inbound: [allowYou] } : firewall)) };
}

const signIn = (id: string, label: string, user: string, password: string) => ({ id, label, command: 'browser', signIn: { path: LOGIN_PATH, user, password } }) as const;

/** Returns `webSendIncident` on `signInNet` with one more address, `/admin` of the orders app by its IP (`admin`), and three more messages: the browser signing in as Lucía (`sign-in-lucia`) or as Marta (`sign-in-marta`) and a `curl -i -b sesion=s1` (`curl-cookie`). Its one task expects the browser to get the page of `/admin`, and its solution signs in as Lucía and opens it. */
export function signInIncident(): SendIncident {
  const base = webSendIncident();
  return {
    ...base,
    id: '09-03',
    order: 3,
    base: signInNet(),
    tasks: [{ id: 'enter', text: 'Que el navegador entre a /admin.', expect: { fromId: 'you', toId: 'admin', messageId: 'browser', outcome: 'replied', body: ADMIN_BODY } }],
    send: {
      ...base.send,
      to: [...base.send.to, { id: 'admin', address: floor1.lucia, url: ADMIN_URL }],
      message: [
        ...base.send.message,
        signIn('sign-in-lucia', 'Lucía', 'lucia', 'clave-lucia'),
        signIn('sign-in-marta', 'Marta', 'marta', 'clave-marta'),
        { id: 'curl-cookie', label: 'curl -i -b sesion=s1', command: 'curl', options: { include: true, cookie: 'sesion=s1' } },
      ],
    },
    solution: [
      { type: 'sendPacket', fromId: 'you', toId: 'admin', messageId: 'sign-in-lucia' },
      { type: 'sendPacket', fromId: 'you', toId: 'admin', messageId: 'browser' },
    ],
  };
}
