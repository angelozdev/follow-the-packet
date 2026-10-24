import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine/simulation/simulate';
import { simulateSequence } from '@/engine/simulation/sequence';
import type { Trace } from '@/engine/simulation/trace';
import { applyAction } from '@/engine/network/actions';
import type { Firewall, Network, PacketSpec, Rule, Service } from '@/engine/network/types';
import type { HttpMethod, Site } from '@/engine/web/schema';
import { NAME_SERVER_PIECES, OFFICE_FLOORS, chapter1Worlds, chapter4Worlds, device, officeWithNames, tcp, withDevice } from '@/testing';

const { floor1, server } = OFFICE_FLOORS;
const { zone } = NAME_SERVER_PIECES;
const LUCIA = 'lucia-laptop';
const APP_PORT = 3000;
const REPORTS_PORT = 3001;
const WEB_PORT = 80;
const SHOP_BODY = 'Welcome to the shop.';
const BLOG_BODY = 'Welcome to the blog.';
const NOT_FOUND_BODY = 'Nothing at that path.';
const SHOP = `www.${zone}`;
const BLOG = `blog.${zone}`;

const you = device('your-laptop');
const HANDSHAKE = ['SYN', 'SYN-ACK', 'ACK'];
const ORDER_HANDLERS = [['GET', 'order-read'], ['POST', 'order-create'], ['PUT', 'order-replace']] as const;

const home = (body: string): Site['pages'] => [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body } }];
const shop: Site = { id: 'shop', names: [SHOP], notFoundBody: NOT_FOUND_BODY, pages: home(SHOP_BODY) };
const blog: Site = { id: 'blog', names: [BLOG], notFoundBody: NOT_FOUND_BODY, pages: home(BLOG_BODY) };
const orders: Site = {
  id: 'orders',
  names: [],
  notFoundBody: NOT_FOUND_BODY,
  orders: { template: 'Order {id}: {content}', start: [{ id: 7, content: '2 coffees.' }, { id: 8, content: '1 tea.' }] },
  pages: ORDER_HANDLERS.map(([method, kind]) => ({ path: '/orders', methods: [method], handler: { kind } })),
};

const ordersService: Service = { protocol: 'tcp', port: APP_PORT, listen: 'all', web: { sites: [orders], defaultSiteId: orders.id } };
const withServices = (net: Network, ownerId: string, ...services: Service[]): Network => applyAction(net, { type: 'setServices', ownerId, services });
const lucia = (...services: Service[]): Network => withDevice(officeWithNames(), LUCIA, { host: { ignoreIcmpEcho: false, services } });
const sites = (...served: Site[]): Network => withServices(officeWithNames(), server.id, { protocol: 'tcp', port: WEB_PORT, listen: 'all', web: { sites: served, defaultSiteId: served[0].id } });

const http = (to: string, port: number, method: HttpMethod, url: string, body?: string): PacketSpec => ({ from: you, to, protocol: 'tcp', port, message: { method, url, ...(body !== undefined && { body }) } });
const ask = (method: HttpMethod, target: string, body?: string): PacketSpec => http(floor1.lucia, APP_PORT, method, `http://${floor1.lucia}:${APP_PORT}${target}`, body);
const toSites = (url: string, to = new URL(url).hostname): PacketSpec => http(to, WEB_PORT, 'GET', url);
const bodiesOf = (net: Network, ...packets: PacketSpec[]): (string | undefined)[] => simulateSequence(net, packets.map((packet, at) => ({ packet, at }))).map((trace) => trace.app?.response?.body);
const kindsOf = (trace: Trace): string[] => trace.exchange?.map(({ kind }) => kind) ?? [];
const appSteps = (trace: Trace) => trace.steps.filter((step) => step.stage === 'app');
const withoutApp = (trace: Trace): Trace => ({ ...trace, app: undefined, steps: trace.steps.filter((step) => step.stage !== 'app') });

const tcpRule = (id: string, peerIp: string): Rule => ({ id, what: { kind: 'tcp', fromPort: APP_PORT, toPort: APP_PORT }, peer: { kind: 'cidr', cidr: `${peerIp}/32` } });
const hostFirewall = (name: string, inbound: Rule[], outbound: Rule[]): Firewall => ({ id: `fw-${name}`, name, kind: 'host-firewall', inbound, outbound });
const guarded = (inbound: Rule[], outbound: Rule[]): Network => {
  const net = withDevice(withDevice(lucia(ordersService), 'your-laptop', { firewallIds: ['fw-you'] }), LUCIA, { firewallIds: ['fw-lucia'] });
  return { ...net, firewalls: [hostFirewall('you', [], [tcpRule('you-out', floor1.lucia)]), hostFirewall('lucia', inbound, outbound)] };
};

describe('the app stage', () => {
  it('a packet with a message travels in a tcp connection that the greeting opened', () => {
    const net = lucia(ordersService);
    const trace = simulate(net, ask('GET', '/orders?id=7'));
    const bare = simulate(net, tcp(you, floor1.lucia, APP_PORT));
    expect(trace.outcome).toBe('replied');
    expect(kindsOf(trace)).toEqual(HANDSHAKE);
    expect(trace.header?.request).toMatchObject({ destination: floor1.lucia, destinationPort: APP_PORT });
    expect(trace.app?.response).toMatchObject({ statusCode: 200, body: 'Order 7: 2 coffees.' });
    expect(withoutApp(trace)).toEqual(withoutApp(bare));
  });

  it('the web stage writes no step for a packet with no message', () => {
    const net = lucia(ordersService);
    const bare = simulate(net, tcp(you, floor1.lucia, APP_PORT));
    expect(bare).not.toHaveProperty('app');
    expect(appSteps(bare)).toEqual([]);
    const swept = [...chapter1Worlds().flatMap(({ world, packets }) => packets.map((packet) => simulate(world, packet))), ...chapter4Worlds().flatMap(({ world, flows }) => flows.map((packet) => simulate(world, packet)))];
    expect(swept.length).toBeGreaterThan(0);
    for (const trace of swept) {
      expect(trace).not.toHaveProperty('app');
      expect(appSteps(trace)).toEqual([]);
    }
  });

  it('a message of a device to localhost reaches the app of the same device, past its firewall', () => {
    const packet: PacketSpec = { from: device(LUCIA), to: 'localhost', protocol: 'tcp', port: APP_PORT, message: { method: 'GET', url: `http://localhost:${APP_PORT}/orders?id=8` } };
    const trace = simulate(guarded([], []), packet);
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe(LUCIA);
    expect(trace.header?.request).toMatchObject({ source: '127.0.0.1', destination: '127.0.0.1', destinationPort: APP_PORT });
    expect(trace.app?.request.headers).toEqual({ Host: `localhost:${APP_PORT}` });
    expect(trace.app?.response?.body).toBe('Order 8: 1 tea.');
    expect(trace.steps.map((step) => step.stage)).not.toContain('firewall-in');
  });

  it('the stage writes the site it chose and then the answer', () => {
    const trace = simulate(lucia(ordersService), ask('GET', '/orders?id=7'));
    expect(appSteps(trace)).toEqual([
      { stage: 'app', at: LUCIA, verdict: 'info', reason: { code: 'web-default-site', deviceId: LUCIA, name: floor1.lucia } },
      { stage: 'app', at: LUCIA, verdict: 'pass', reason: { code: 'web-answered', deviceId: LUCIA, statusCode: 200 } },
    ]);
    expect(trace.steps.slice(-3).map((step) => step.stage)).toEqual(['app', 'app', 'reply']);
    expect(trace.app?.request).toMatchObject({ startLine: 'GET /orders?id=7 HTTP/1.1', headers: { Host: `${floor1.lucia}:${APP_PORT}` } });
  });

  it('the reply of an http exchange is never stopped by a firewall, outbound or inbound', () => {
    const trace = simulate(guarded([tcpRule('lucia-in', floor1.you)], []), ask('GET', '/orders?id=7'));
    expect(trace.outcome).toBe('replied');
    expect(trace.app?.response?.statusCode).toBe(200);
    const stages = trace.steps.map((step) => step.stage);
    expect(stages.filter((stage) => stage === 'firewall-out' || stage === 'firewall-in')).toEqual(['firewall-out', 'firewall-in']);
    expect(stages.slice(stages.indexOf('host') + 1)).toEqual(['app', 'app', 'reply']);
  });

  it('a message to a closed port ends refused and has no response', () => {
    const trace = simulate(lucia(ordersService), http(floor1.lucia, REPORTS_PORT, 'GET', `http://${floor1.lucia}:${REPORTS_PORT}/`));
    expect(trace.outcome).toBe('refused');
    expect(kindsOf(trace)).toEqual(['SYN', 'RST']);
    expect(trace.app?.request.startLine).toBe('GET / HTTP/1.1');
    expect(trace.app).not.toHaveProperty('response');
    expect(appSteps(trace)).toEqual([]);
  });

  it('a message through a firewall that drops ends in timeout and has no response', () => {
    const trace = simulate(guarded([], []), ask('GET', '/orders?id=7'));
    expect(trace.outcome).toBe('timeout');
    expect(kindsOf(trace)).toEqual(['SYN']);
    expect(trace.app).not.toHaveProperty('response');
    expect(appSteps(trace)).toEqual([]);
  });

  it('a service that accepts and does not speak http ends arrived-no-reply', () => {
    const trace = simulate(lucia({ protocol: 'tcp', port: APP_PORT, listen: 'all' }), ask('GET', '/'));
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(kindsOf(trace)).toEqual(HANDSHAKE);
    expect(trace.app).not.toHaveProperty('response');
    expect(appSteps(trace)).toEqual([]);
    expect(trace.steps.at(-1)?.reason.code).toBe('host-accepts');
  });
});

describe('the sites of a web service', () => {
  it('the site is chosen by the host header and not by the ip', () => {
    const net = sites(shop, blog);
    expect(bodiesOf(net, toSites(`http://${SHOP}/`), toSites(`http://${BLOG}/`), toSites(`http://${BLOG}/`, server.ip), toSites(`http://${SHOP}/`, server.ip))).toEqual([SHOP_BODY, BLOG_BODY, BLOG_BODY, SHOP_BODY]);
    const traces = [SHOP, BLOG].map((name) => simulate(net, toSites(`http://${name}/`)));
    expect(traces.map((trace) => trace.destinationId)).toEqual([server.id, server.id]);
    expect(traces.map((trace) => appSteps(trace)[0].reason.code)).toEqual(['web-site-chosen', 'web-site-chosen']);
  });

  it('a name with no site gets the default site', () => {
    const net = sites(shop, blog);
    const byIp = simulate(net, toSites(`http://${server.ip}/`));
    const byOtherName = simulate(net, toSites(`http://other.${zone}/`, server.ip));
    expect([byIp, byOtherName].map((trace) => trace.app?.response?.body)).toEqual([SHOP_BODY, SHOP_BODY]);
    expect(appSteps(byIp)[0].reason).toEqual({ code: 'web-default-site', deviceId: server.id, name: server.ip });
    expect(appSteps(byOtherName)[0].reason).toEqual({ code: 'web-default-site', deviceId: server.id, name: `other.${zone}` });
  });

  it('a name that went through a cname travels in host as the url wrote it', () => {
    const before = simulate(sites(shop), toSites(`http://${BLOG}/`));
    expect(before.steps.find((step) => step.stage === 'dns')?.reason).toMatchObject({ code: 'dns-answered', name: BLOG, canonical: SHOP });
    expect(before.app?.request.headers.Host).toBe(BLOG);
    expect(before.app?.response?.body).toBe(SHOP_BODY);
    expect(appSteps(before)[0].reason).toMatchObject({ code: 'web-default-site', name: BLOG });
    const after = simulate(sites(shop, blog), toSites(`http://${BLOG}/`));
    expect(after.app?.request.headers.Host).toBe(BLOG);
    expect(after.app?.response?.body).toBe(BLOG_BODY);
  });
});

describe('the orders of an app', () => {
  it('the orders are carried from one send to the next', () => {
    const net = lucia(ordersService);
    expect(bodiesOf(net, ask('POST', '/orders', 'item=coffee'), ask('POST', '/orders', 'item=coffee'), ask('GET', '/orders?id=9'), ask('GET', '/orders?id=10'), ask('GET', '/orders?id=7'))).toEqual([
      'Order 9: item=coffee',
      'Order 10: item=coffee',
      'Order 9: item=coffee',
      'Order 10: item=coffee',
      'Order 7: 2 coffees.',
    ]);
    expect(bodiesOf(net, ask('PUT', '/orders?id=7', 'item=tea'), ask('PUT', '/orders?id=7', 'item=tea'), ask('GET', '/orders?id=7'))).toEqual(['Order 7: item=tea', 'Order 7: item=tea', 'Order 7: item=tea']);
    expect(bodiesOf(net, ask('GET', '/orders?id=9'))).toEqual([NOT_FOUND_BODY]);
  });

  it('a send alone knows nothing of the orders before it', () => {
    const net = lucia(ordersService);
    expect([simulate(net, ask('POST', '/orders', 'x')), simulate(net, ask('POST', '/orders', 'x'))].map((trace) => trace.app?.response?.body)).toEqual(['Order 9: x', 'Order 9: x']);
  });

  it('a send that does not reach the app leaves the orders as they were', () => {
    const toClosedPort = http(floor1.lucia, REPORTS_PORT, 'POST', `http://${floor1.lucia}:${REPORTS_PORT}/orders`, 'x');
    expect(bodiesOf(lucia(ordersService), toClosedPort, ask('POST', '/orders', 'x'))).toEqual([undefined, 'Order 9: x']);
  });
});
