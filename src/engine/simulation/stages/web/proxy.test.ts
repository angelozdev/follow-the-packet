import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import type { Network, PacketSpec, ServerActor, Service } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import { simulateSequence } from '@/engine/simulation/sequence';
import type { HttpMessage, Site } from '@/engine/web/schema';
import { OFFICE_FLOORS, device, officeWithNames } from '@/testing';

const { backbone, officeRouter, server: front } = OFFICE_FLOORS;
const ORIGIN = { id: 'origin-server', ip: '198.51.100.61', link: '198.51.100.6', port: 3000 } as const;
const SECOND = { ip: '198.51.100.62', port: 3000 } as const;
const WWW = 'www.lucia.example';
const PAGE_URL = `http://${WWW}/pedidos?id=7`;
const SHOP_BODY = 'Welcome to the shop.';
const PROXY_NOT_FOUND = 'The shop has nothing at that path.';
const ORIGIN_NOT_FOUND = 'The app has nothing at that path.';
const CURL_HEADERS = { 'User-Agent': 'curl/8.21.0', Accept: '*/*' };
const FORWARDED = ['/pedidos', '/admin', '/api'];

const ordersApp: Site = {
  id: 'orders',
  names: [],
  notFoundBody: ORIGIN_NOT_FOUND,
  orders: { template: 'Order {id}: {content}', start: [{ id: 7, content: '2 coffees' }] },
  pages: [
    { path: '/pedidos', methods: ['GET'], handler: { kind: 'order-read' } },
    { path: '/pedidos', methods: ['POST'], handler: { kind: 'order-create' } },
  ],
};
const originService: Service = { protocol: 'tcp', port: ORIGIN.port, listen: 'all', web: { sites: [ordersApp], defaultSiteId: ordersApp.id } };
const origin: ServerActor = { id: ORIGIN.id, name: ORIGIN.id, ip: ORIGIN.ip, kind: 'server', latencyMs: 20, services: [originService] };

const shopSite = (proxy?: Site['proxy']): Site => ({
  id: 'shop',
  names: [WWW],
  notFoundBody: PROXY_NOT_FOUND,
  pages: [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body: SHOP_BODY } }],
  ...(proxy && { proxy }),
});
const toOrigin = { prefixes: FORWARDED, origins: [{ ip: ORIGIN.ip, port: ORIGIN.port }] };

function inFront(proxy: Site['proxy'] | null = toOrigin): Network {
  const base = officeWithNames();
  const wired = { ...base, routers: (base.routers ?? []).map((router) => (router.id === backbone.id ? { ...router, interfaces: [...router.interfaces, { ip: ORIGIN.link, faces: ORIGIN.id }] } : router)) };
  const withOrigin = applyAction(wired, { type: 'addActor', actor: origin });
  const web = { sites: [shopSite(proxy ?? undefined)], defaultSiteId: 'shop' };
  return applyAction(withOrigin, { type: 'setServices', ownerId: front.id, services: [{ protocol: 'tcp', port: 80, listen: 'all', web }] });
}

const request = (message: Partial<HttpMessage> = {}): PacketSpec => ({
  from: device('your-laptop'),
  to: front.ip,
  protocol: 'tcp',
  port: 80,
  message: { method: 'GET', url: PAGE_URL, headers: CURL_HEADERS, ...message },
});
const bodiesOf = (net: Network, ...packets: PacketSpec[]) => simulateSequence(net, packets.map((packet, at) => ({ packet, at }))).map((trace) => trace.app?.response?.body);

describe('a reverse proxy in front of an app', () => {
  it('a site forwards the paths under a prefix to the first origin of its list by a second connection', () => {
    const net = inFront({ prefixes: FORWARDED, origins: [{ ip: ORIGIN.ip, port: ORIGIN.port }, SECOND] });
    const trace = simulate(net, request());
    expect(trace.outcome).toBe('replied');
    expect(trace.app?.response).toMatchObject({ statusCode: 200, body: 'Order 7: 2 coffees' });
    expect(trace.app?.upstream).toMatchObject({ outcome: 'replied', destinationId: ORIGIN.id, header: { request: { destination: ORIGIN.ip, destinationPort: ORIGIN.port } } });
    expect(trace.app?.upstream?.app?.response).toEqual(trace.app?.response);
  });

  it('the second connection is a tcp packet from the server of the proxy to the origin with the method, path, query and body of the request', () => {
    const post = (body: string) => request({ method: 'POST', url: `http://${WWW}/pedidos?from=shop`, body });
    const [first, second] = simulateSequence(inFront(), [post('2 teas'), post('3 teas')].map((packet, at) => ({ packet, at })));
    const connection = first.app?.upstream;
    expect(connection?.exchange?.map(({ kind }) => kind)).toEqual(['SYN', 'SYN-ACK', 'ACK']);
    expect(connection?.header?.request).toMatchObject({ source: front.ip, destination: ORIGIN.ip, destinationPort: ORIGIN.port });
    expect(connection?.header?.request.sourcePort).toBeTypeOf('number');
    expect(connection?.app?.request).toMatchObject({ startLine: 'POST /pedidos?from=shop HTTP/1.1', method: 'POST', path: '/pedidos', query: 'from=shop', body: '2 teas' });
    expect([first, second].map((trace) => trace.app?.response?.body)).toEqual(['Order 8: 2 teas', 'Order 9: 3 teas']);
    expect(second.app?.upstream?.header?.request.sourcePort).not.toBe(connection?.header?.request.sourcePort);
  });

  it('the second connection keeps the Host, the User-Agent and the Accept of the client and adds X-Forwarded-For', () => {
    const { headers } = simulate(inFront(), request()).app!.upstream!.app!.request;
    expect(headers).toEqual({ Host: WWW, 'User-Agent': CURL_HEADERS['User-Agent'], Accept: CURL_HEADERS.Accept, 'X-Forwarded-For': officeRouter.uplink });
    expect(Object.keys(headers)).toEqual(['Host', 'User-Agent', 'Accept', 'X-Forwarded-For']);
  });

  it('the second connection keeps the Host of the client and not the address of the origin', () => {
    const upstream = simulate(inFront(), request()).app!.upstream!;
    expect(upstream.app?.request.headers.Host).toBe(WWW);
    expect(upstream.app?.request.host).toBe(WWW);
    expect(JSON.stringify(upstream.app?.request)).not.toContain(ORIGIN.ip);
    expect(upstream.steps.find(({ reason }) => reason.code === 'web-default-site')?.reason).toMatchObject({ deviceId: ORIGIN.id, name: WWW });
  });

  it('a server of the internet delivers to another server of the internet with no firewall and no nat in between', () => {
    const upstream = simulate(inFront(), request()).app!.upstream!;
    expect(upstream.outcome).toBe('replied');
    expect(upstream.steps.map(({ stage }) => stage)).toEqual(['host', 'app', 'app', 'reply']);
    expect(upstream).not.toHaveProperty('translation');
    expect(upstream).not.toHaveProperty('hops');
    expect(upstream.tcpdump).toEqual([]);
  });

  it('the origin sees the ip of the proxy as the source of the second connection', () => {
    const upstream = simulate(inFront(), request()).app!.upstream!;
    expect(upstream.effectiveSource).toBe(front.ip);
    expect(upstream.header?.request.source).toBe(front.ip);
    expect(upstream.header?.reply).toMatchObject({ source: ORIGIN.ip, destination: front.ip });
    expect(upstream.app?.request.headers['X-Forwarded-For']).toBe(officeRouter.uplink);
  });

  it('the client sees only the proxy', () => {
    const trace = simulate(inFront(), request());
    expect(trace.destinationId).toBe(front.id);
    expect(trace.header?.request.destination).toBe(front.ip);
    expect(trace.header?.reply?.source).toBe(front.ip);
    expect(trace.steps.filter(({ at }) => at === ORIGIN.id)).toEqual([]);
    expect(JSON.stringify(trace.steps)).not.toContain(ORIGIN.ip);
    expect(trace.app?.request.headers).toEqual({ Host: WWW, ...CURL_HEADERS });
  });

  it('a response of the origin goes through the proxy with the same code and body', () => {
    const missing = simulate(inFront(), request({ url: `http://${WWW}/pedidos?id=99` }));
    expect(missing.app?.response).toMatchObject({ statusCode: 404, body: ORIGIN_NOT_FOUND });
    expect(missing.app?.response).toEqual(missing.app?.upstream?.app?.response);
    expect(missing.steps.filter(({ stage }) => stage === 'app').at(-1)?.reason).toEqual({ code: 'web-answered', deviceId: front.id, statusCode: 404 });
    const found = simulate(inFront(), request());
    expect(found.app?.response).toEqual(found.app?.upstream?.app?.response);
  });

  it('the proxy adds the client ip it sees to X-Forwarded-For', () => {
    const seen = (headers: Record<string, string>) => simulate(inFront(), request({ headers })).app!.upstream!.app!.request.headers['X-Forwarded-For'];
    expect(seen(CURL_HEADERS)).toBe(officeRouter.uplink);
    expect(seen({ ...CURL_HEADERS, 'X-Forwarded-For': '192.0.2.99' })).toBe(`192.0.2.99, ${officeRouter.uplink}`);
  });

  it('a path the proxy does not forward is answered by the site of the proxy itself', () => {
    const net = inFront();
    const home = simulate(net, request({ url: `http://${WWW}/` }));
    expect(home.app?.response).toMatchObject({ statusCode: 200, body: SHOP_BODY });
    expect(home.app).not.toHaveProperty('upstream');
    expect(home.destinationId).toBe(front.id);
    expect(bodiesOf(net, request({ url: `http://${WWW}/pedido` }), request({ url: `http://${WWW}/pedidosx` }), request({ url: `http://${WWW}/api/lista` }))).toEqual([PROXY_NOT_FOUND, PROXY_NOT_FOUND, ORIGIN_NOT_FOUND]);
    expect(bodiesOf(inFront(null), request())).toEqual([PROXY_NOT_FOUND]);
  });

  it('the trace of the second connection is kept in app.upstream', () => {
    const trace = simulate(inFront(), request());
    const { upstream } = trace.app!;
    expect(upstream?.steps.map(({ at }) => at)).toEqual([ORIGIN.id, ORIGIN.id, ORIGIN.id, ORIGIN.id]);
    expect(upstream?.app?.request.startLine).toBe('GET /pedidos?id=7 HTTP/1.1');
    expect(upstream?.app).not.toHaveProperty('upstream');
    expect(trace.steps.map(({ stage }) => stage).slice(-3)).toEqual(['app', 'app', 'reply']);
    expect(trace.steps).not.toEqual(upstream?.steps);
  });

  it('a trace says which device generated the code and whether it was an app or the proxy', () => {
    const net = inFront();
    const forwarded = simulate(net, request());
    expect(forwarded.app?.generatedBy).toEqual({ id: ORIGIN.id, role: 'app' });
    expect(forwarded.app?.upstream?.app?.generatedBy).toEqual({ id: ORIGIN.id, role: 'app' });
    expect(simulate(net, request({ url: `http://${WWW}/` })).app?.generatedBy).toEqual({ id: front.id, role: 'app' });
    const closed = simulate(net, { ...request(), port: 22 });
    expect(closed.app).not.toHaveProperty('generatedBy');
  });
});
