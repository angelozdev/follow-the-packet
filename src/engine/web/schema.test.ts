import { describe, expect, it } from 'vitest';
import { networkSchema, packetSchema, serviceSchema } from '@/engine/network/schema';
import type { Network, PacketSpec } from '@/engine/network/types';
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

  it('a service may carry a web service and a network with one still validates', () => {
    const web = { sites: [shop], defaultSiteId: 'shop' };
    expect(serviceSchema.safeParse({ protocol: 'tcp', port: 80, listen: 'all', web }).success).toBe(true);
    const net: Network = withDevice(officeWithNames(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ protocol: 'tcp', port: 3000, listen: 'all', web }] } });
    expect(networkSchema.safeParse(net).success).toBe(true);
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
