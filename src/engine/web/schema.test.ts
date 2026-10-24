import { describe, expect, it } from 'vitest';
import { networkSchema, packetSchema, serviceSchema } from '@/engine/network/schema';
import type { Network, PacketSpec, Process } from '@/engine/network/types';
import { OFFICE_FLOORS, device, officeWithNames, tcp, withDevice } from '@/testing';
import { httpMessageSchema, webServiceSchema, type Site } from './schema';

const shop: Site = { id: 'shop', names: ['www.shop.example'], pages: [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body: 'x' } }], notFoundBody: 'y' };
const issuesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }): string[] => result.error?.issues.map((issue) => issue.message) ?? [];

describe('the web service schema', () => {
  it('accepts sites with a default site that is one of them', () => {
    expect(webServiceSchema.safeParse({ sites: [shop], defaultSiteId: 'shop' }).success).toBe(true);
  });

  it('rejects a default site that is not a site of the service, and two sites with one id', () => {
    expect(issuesOf(webServiceSchema.safeParse({ sites: [shop], defaultSiteId: 'blog' }))).toEqual(['the default site blog is not a site of the service']);
    expect(issuesOf(webServiceSchema.safeParse({ sites: [shop, shop], defaultSiteId: 'shop' }))).toEqual(['two sites share an id']);
  });

  it('rejects a page that serves orders on a site with no order book', () => {
    const serving: Site = { ...shop, pages: [{ path: '/orders', methods: ['GET'], handler: { kind: 'order-read' } }] };
    expect(issuesOf(webServiceSchema.safeParse({ sites: [serving], defaultSiteId: 'shop' }))).toEqual(['shop: a page serves orders and the site has no order book']);
    expect(webServiceSchema.safeParse({ sites: [{ ...serving, orders: { template: '{id}: {content}', start: [] } }], defaultSiteId: 'shop' }).success).toBe(true);
  });

  it('rejects a page that asks for a role on a site with no users, and a user name with a colon', () => {
    const accounts = { users: [{ name: 'lucia', password: 'x', role: 'admin' }], realm: 'admin', unauthorizedBody: 'a', forbiddenBody: 'b' };
    const guarded: Site = { ...shop, pages: [{ path: '/admin', methods: ['GET'], role: 'admin', handler: { kind: 'fixed', body: 'x' } }] };
    expect(issuesOf(webServiceSchema.safeParse({ sites: [guarded], defaultSiteId: 'shop' }))).toEqual(['shop: a page asks for a role and the site has no users']);
    expect(webServiceSchema.safeParse({ sites: [{ ...guarded, accounts }], defaultSiteId: 'shop' }).success).toBe(true);
    const colon = { ...accounts, users: [{ name: 'lu:cia', password: 'x', role: 'admin' }] };
    expect(issuesOf(webServiceSchema.safeParse({ sites: [{ ...guarded, accounts: colon }], defaultSiteId: 'shop' }))).toEqual(['a user name has no colon']);
  });

  it('rejects a login page on a site with no users', () => {
    const logging: Site = { ...shop, pages: [{ path: '/login', methods: ['POST'], handler: { kind: 'login', body: 'Signed in.' } }] };
    expect(issuesOf(webServiceSchema.safeParse({ sites: [logging], defaultSiteId: 'shop' }))).toEqual(['shop: a page logs in and the site has no users']);
    const accounts = { users: [{ name: 'lucia', password: 'x', role: 'admin' }], realm: 'admin', unauthorizedBody: 'a', forbiddenBody: 'b' };
    expect(webServiceSchema.safeParse({ sites: [{ ...logging, accounts }], defaultSiteId: 'shop' }).success).toBe(true);
  });

  it('a message may say it comes from a browser, and says nothing else of its client', () => {
    const message = { method: 'GET', url: 'http://www.shop.example/' };
    expect(httpMessageSchema.safeParse({ ...message, browser: true }).success).toBe(true);
    expect(httpMessageSchema.safeParse({ ...message, browser: false }).success).toBe(false);
  });

  it('a service may carry a web service and a network with one still validates', () => {
    const web = { sites: [shop], defaultSiteId: 'shop' };
    expect(serviceSchema.safeParse({ protocol: 'tcp', port: 80, listen: 'all', web }).success).toBe(true);
    const net: Network = withDevice(officeWithNames(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ protocol: 'tcp', port: 3000, listen: 'all', web }] } });
    expect(networkSchema.safeParse(net).success).toBe(true);
  });

  it('rejects a name that is not under .example', () => {
    for (const names of [['www.shop.com'], ['example'], ['shop.example.com'], ['www.shop.example', 'blog.shop.org']]) {
      expect(issuesOf(webServiceSchema.safeParse({ sites: [{ ...shop, names }], defaultSiteId: 'shop' }))).toEqual(['a site name goes under .example']);
    }
    expect(webServiceSchema.safeParse({ sites: [{ ...shop, names: ['WWW.Shop.Example', 'blog.shop.example'] }], defaultSiteId: 'shop' }).success).toBe(true);
  });

  it('rejects a service whose process is not a process of its device', () => {
    const listeningFrom = (processId: string, processes: Process[] | undefined): Network =>
      withDevice(officeWithNames(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ protocol: 'tcp', port: 3000, listen: 'all', processId }], processes } });
    const orders: Process = { id: 'orders', name: 'pedidos', running: true };
    expect(networkSchema.safeParse(listeningFrom('orders', [orders])).success).toBe(true);
    const missing = 'lucia-laptop: the service of tcp 3000 listens from reports, which is not a process of lucia-laptop';
    expect(issuesOf(networkSchema.safeParse(listeningFrom('reports', [orders])))).toEqual([missing]);
    expect(issuesOf(networkSchema.safeParse(listeningFrom('reports', undefined)))).toEqual([missing]);
    const net: Network = officeWithNames();
    const onServer: Network = { ...net, actors: net.actors.map((actor) => (actor.id === OFFICE_FLOORS.server.id && actor.kind === 'server' ? { ...actor, services: [{ protocol: 'tcp', port: 80, listen: 'all', processId: 'orders' }] } : actor)) };
    expect(issuesOf(networkSchema.safeParse(onServer))).toEqual([`${OFFICE_FLOORS.server.id}: the service of tcp 80 listens from orders, which is not a process of ${OFFICE_FLOORS.server.id}`]);
  });

  it('rejects a web service on a udp service', () => {
    const net: Network = withDevice(officeWithNames(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ protocol: 'udp', port: 3000, listen: 'all', web: { sites: [shop], defaultSiteId: 'shop' } }] } });
    expect(issuesOf(networkSchema.safeParse(net))).toEqual(['lucia-laptop: the web service of udp 3000 must be a TCP service']);
  });
});

describe('the message of a packet', () => {
  const message = { method: 'GET', url: 'http://localhost:3000/orders?id=7' } as const;

  it('travels in a tcp packet and in no other', () => {
    const withMessage = (packet: PacketSpec): PacketSpec => ({ ...packet, message });
    expect(packetSchema.safeParse(withMessage(tcp(device('your-laptop'), OFFICE_FLOORS.floor1.lucia, 3000))).success).toBe(true);
    const udp: PacketSpec = { from: device('your-laptop'), to: OFFICE_FLOORS.floor1.lucia, protocol: 'udp', port: 3000 };
    expect(issuesOf(packetSchema.safeParse(withMessage(udp)))).toEqual(['a message travels in a TCP connection']);
    const ping: PacketSpec = { from: device('your-laptop'), to: OFFICE_FLOORS.floor1.lucia, protocol: 'icmp', icmpType: 8 };
    expect(packetSchema.safeParse(withMessage(ping)).success).toBe(false);
  });

  it('asks for a method the game serves and an absolute http or https url', () => {
    expect(httpMessageSchema.safeParse(message).success).toBe(true);
    expect(httpMessageSchema.safeParse({ ...message, method: 'DELETE' }).success).toBe(false);
    for (const url of ['localhost:3000', '/orders', 'ftp://localhost/']) expect(httpMessageSchema.safeParse({ ...message, url }).success).toBe(false);
  });
});
