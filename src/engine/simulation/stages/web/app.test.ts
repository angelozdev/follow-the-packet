import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine/simulation/simulate';
import { browserAfter, simulateSequence } from '@/engine/simulation/sequence';
import type { Trace } from '@/engine/simulation/trace';
import { applyAction } from '@/engine/network/actions';
import type { Endpoint, Firewall, Network, PacketSpec, Rule, Service } from '@/engine/network/types';
import { basicAuthorizationHeader } from '@/engine/web/identity/basic-credential';
import type { HttpMessage, HttpMethod, Site } from '@/engine/web/schema';
import { NAME_SERVER_PIECES, OFFICE_FLOORS, chapter1Worlds, chapter2Worlds, chapter4Worlds, device, officeWithNames, tcp, withDevice } from '@/testing';

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

describe('the pages that ask for a role', () => {
  const guardedOrders: Site = {
    ...orders,
    accounts: { users: [{ name: 'lucia', password: 'pw-lucia', role: 'admin' }, { name: 'marta', password: 'pw-marta', role: 'staff' }], realm: 'admin', unauthorizedBody: 'Log in.', forbiddenBody: 'Not allowed.' },
    pages: [...orders.pages, { path: '/admin', methods: ['GET'], role: 'admin', handler: { kind: 'fixed', body: 'Admin panel.' } }],
  };
  const net = lucia({ ...ordersService, web: { sites: [guardedOrders], defaultSiteId: guardedOrders.id } });
  const askAdmin = (credential?: string): PacketSpec => ({ ...ask('GET', '/admin'), message: { method: 'GET', url: `http://${floor1.lucia}:${APP_PORT}/admin`, ...(credential !== undefined && { headers: basicAuthorizationHeader(credential) }) } });

  it('the credential the packet carries decides the code: 401 with none, 403 for a user without the role and 200 with it', () => {
    const traces = [undefined, 'marta:pw-marta', 'lucia:pw-lucia'].map((credential) => simulate(net, askAdmin(credential)));
    expect(traces.map((trace) => trace.app?.response?.statusCode)).toEqual([401, 403, 200]);
    expect(traces.map((trace) => trace.outcome)).toEqual(['replied', 'replied', 'replied']);
    expect(traces[0].app?.response?.headers['WWW-Authenticate']).toBe('Basic realm="admin"');
    expect(traces[1].app?.request.headers.Authorization).toBe(basicAuthorizationHeader('marta:pw-marta').Authorization);
  });

  it('a 401 and a 403 each say why in a step between the site chosen and the answer, and a 200 has no such step', () => {
    const [noCredential, marta, lucia] = [undefined, 'marta:pw-marta', 'lucia:pw-lucia'].map((credential) => appSteps(simulate(net, askAdmin(credential))).map(({ verdict, reason }) => [verdict, reason]));
    expect(noCredential).toEqual([
      ['info', { code: 'web-default-site', deviceId: LUCIA, name: floor1.lucia }],
      ['info', { code: 'web-needs-login', deviceId: LUCIA, path: '/admin' }],
      ['pass', { code: 'web-answered', deviceId: LUCIA, statusCode: 401 }],
    ]);
    expect(marta[1]).toEqual(['info', { code: 'web-forbidden', deviceId: LUCIA, path: '/admin', user: 'marta' }]);
    expect(marta[2]).toEqual(['pass', { code: 'web-answered', deviceId: LUCIA, statusCode: 403 }]);
    expect(lucia.map(([, reason]) => (reason as { code: string }).code)).toEqual(['web-default-site', 'web-answered']);
  });
});

describe('the sessions of an app and the cookie of the browser', () => {
  const loginSite: Site = {
    ...orders,
    accounts: { users: [{ name: 'lucia', password: 'pw-lucia', role: 'admin' }, { name: 'marta', password: 'pw-marta', role: 'staff' }], realm: 'admin', unauthorizedBody: 'Log in.', forbiddenBody: 'Not allowed.' },
    pages: [...orders.pages, { path: '/login', methods: ['POST'], handler: { kind: 'login', body: 'Signed in.' } }, { path: '/admin', methods: ['GET'], role: 'admin', handler: { kind: 'fixed', body: 'Admin panel.' } }],
  };
  const net = lucia({ ...ordersService, web: { sites: [loginSite], defaultSiteId: loginSite.id } });
  const LOGIN_URL = `http://${floor1.lucia}:${APP_PORT}/login`;
  const ADMIN_URL = `http://${floor1.lucia}:${APP_PORT}/admin`;
  const LOOPBACK_ADMIN_URL = `http://localhost:${APP_PORT}/admin`;
  const NOT_ALLOWED = 'Not allowed.';
  const LOG_IN = 'Log in.';

  const send = (from: Endpoint, url: string, message: Partial<HttpMessage> = {}): PacketSpec => ({ from, to: new URL(url).hostname, protocol: 'tcp', port: APP_PORT, message: { method: 'GET', url, ...message } });
  const signIn = (from: Endpoint, user: string, extra: Partial<HttpMessage> = {}): PacketSpec => send(from, LOGIN_URL, { method: 'POST', body: `usuario=${user}&clave=pw-${user}`, ...extra });
  const traceOf = (...packets: PacketSpec[]) => simulateSequence(net, packets.map((packet, at) => ({ packet, at }))).at(-1)!;
  const bodiesAfter = (...packets: PacketSpec[]) => simulateSequence(net, packets.map((packet, at) => ({ packet, at }))).map((trace) => trace.app?.response?.body);
  const memoryOf = (endpoint: Endpoint, ...packets: PacketSpec[]) => browserAfter(net, packets.map((packet, at) => ({ packet, at })), endpoint.id);
  const BROWSER = { browser: true } as const;
  const lucia1 = device(LUCIA);

  it('the browser keeps the cookie of a Set-Cookie and sends it to the same site', () => {
    const asLucia = [signIn(you, 'lucia', BROWSER), send(you, ADMIN_URL, BROWSER)];
    const [login, admin] = simulateSequence(net, asLucia.map((packet, at) => ({ packet, at })));
    expect(login.app?.response?.headers['Set-Cookie']).toBe('sesion=s1');
    expect(login.app?.request.headers).not.toHaveProperty('Cookie');
    expect(admin.app?.request.headers.Cookie).toBe('sesion=s1');
    expect(admin.app?.response).toMatchObject({ statusCode: 200, body: 'Admin panel.' });
    expect(memoryOf(you, ...asLucia)).toEqual([{ site: floor1.lucia, name: 'sesion', value: 's1' }]);
  });

  it('the browser replaces the cookie of the same name and site with the one of the newer login', () => {
    const asMarta = [signIn(you, 'lucia', BROWSER), signIn(you, 'marta', BROWSER), send(you, ADMIN_URL, BROWSER)];
    expect(memoryOf(you, ...asMarta)).toEqual([{ site: floor1.lucia, name: 'sesion', value: 's2' }]);
    expect(traceOf(...asMarta).app?.response?.statusCode).toBe(403);
  });

  it('the browser does not send the cookie of one site to another', () => {
    const own = device(LUCIA);
    const signedInByIp = signIn(own, 'lucia', BROWSER);
    expect(traceOf(signedInByIp, send(own, ADMIN_URL, BROWSER)).app?.response?.statusCode).toBe(200);
    const byName = traceOf(signedInByIp, send(own, LOOPBACK_ADMIN_URL, BROWSER));
    expect(byName.app?.request.headers).not.toHaveProperty('Cookie');
    expect(byName.app?.response?.statusCode).toBe(401);
    expect(memoryOf(own, signedInByIp, send(own, LOOPBACK_ADMIN_URL, BROWSER))).toEqual([{ site: floor1.lucia, name: 'sesion', value: 's1' }]);
  });

  it('the browser of one device does not send the cookie that another device holds', () => {
    const signedIn = signIn(you, 'lucia', BROWSER);
    expect(traceOf(signedIn, send(lucia1, ADMIN_URL, BROWSER)).app?.response?.statusCode).toBe(401);
    expect(memoryOf(lucia1, signedIn)).toEqual([]);
  });

  it('curl sends a cookie only when it is given -b', () => {
    const asLucia = signIn(you, 'lucia');
    expect(bodiesAfter(asLucia, send(you, ADMIN_URL))).toEqual(['Signed in.', LOG_IN]);
    expect(bodiesAfter(asLucia, send(you, ADMIN_URL, { headers: { Cookie: 'sesion=s1' } }))).toEqual(['Signed in.', 'Admin panel.']);
    expect(traceOf(asLucia, send(you, ADMIN_URL, { headers: { Cookie: 'sesion=s1' } })).app?.request.headers.Cookie).toBe('sesion=s1');
  });

  it('curl remembers nothing between two sends', () => {
    const asLucia = signIn(you, 'lucia');
    const after = traceOf(asLucia, send(you, ADMIN_URL));
    expect(after.app?.request.headers).not.toHaveProperty('Cookie');
    expect(after.app?.response?.statusCode).toBe(401);
    expect(memoryOf(you, asLucia, send(you, ADMIN_URL))).toEqual([]);
  });

  it('a cookie of a session opened by another client is the user of that session', () => {
    expect(bodiesAfter(signIn(you, 'marta', BROWSER), send(lucia1, ADMIN_URL, { headers: { Cookie: 'sesion=s1' } }))).toEqual(['Signed in.', NOT_ALLOWED]);
  });

  it('a login with a wrong password writes no step that says the page needs a login, and a page that asks for a role still writes it', () => {
    const failed = traceOf(send(you, LOGIN_URL, { method: 'POST', body: 'usuario=lucia&clave=wrong', ...BROWSER }));
    expect(failed.app?.response?.statusCode).toBe(401);
    expect(appSteps(failed).map(({ reason }) => reason.code)).toEqual(['web-default-site', 'web-answered']);
    expect(appSteps(traceOf(send(you, ADMIN_URL))).map(({ reason }) => reason.code)).toEqual(['web-default-site', 'web-needs-login', 'web-answered']);
  });

  it('the browser keeps nothing from a login that failed or from a send that never reached the app', () => {
    const wrong = send(you, LOGIN_URL, { method: 'POST', body: 'usuario=lucia&clave=wrong', ...BROWSER });
    expect(memoryOf(you, wrong)).toEqual([]);
    const toClosedPort: PacketSpec = { ...signIn(you, 'lucia', BROWSER), port: REPORTS_PORT, message: { method: 'POST', url: `http://${floor1.lucia}:${REPORTS_PORT}/login`, body: 'usuario=lucia&clave=pw-lucia', ...BROWSER } };
    expect(memoryOf(you, toClosedPort)).toEqual([]);
  });
});

describe('the state this chapter adds to Carried', () => {
  it('the sends of chapters 1 and 2 give the same traces with the state this chapter adds to Carried', () => {
    const worlds = [...chapter1Worlds(), ...chapter2Worlds()].flatMap(({ world, packets }) => (packets.length === 0 ? [] : [{ world, sends: packets.map((packet, at) => ({ packet, at })) }]));
    expect(worlds.length).toBeGreaterThan(0);
    for (const { world, sends } of worlds) {
      const traces = simulateSequence(world, sends);
      expect(simulateSequence(world, sends)).toEqual(traces);
      for (const trace of traces) expect(trace).not.toHaveProperty('app');
      for (const { packet } of sends) expect(browserAfter(world, sends, packet.from.id)).toEqual([]);
    }
  });
});
