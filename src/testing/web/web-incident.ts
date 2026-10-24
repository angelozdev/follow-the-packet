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
const NOT_FOUND_BODY = 'No hay nada en ese camino.';
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
