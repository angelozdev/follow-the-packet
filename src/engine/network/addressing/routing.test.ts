import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, officeTwoFloorsNet } from '@/testing';
import { bestRoute, facesALan, interfaceTowards, onwardFrom, ownsIp } from './routing';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Router } from '@/engine/network/types';

const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const net = officeTwoFloorsNet();
const routerNamed = (id: string): Router => (net.routers ?? []).find((router) => router.id === id)!;
const sample = (routes: Router['routes']): Router => ({ ...routerNamed(provider.id), routes });

describe('bestRoute', () => {
  it('prefers the most specific range and uses default only when no range covers the IP', () => {
    const router = sample([
      { to: ROUTE_DEFAULT, next: 'a' },
      { to: '198.51.0.0/16', next: 'b' },
      { to: '198.51.100.0/24', next: 'c' },
    ]);
    expect(bestRoute(router, server.ip)?.next).toBe('c');
    expect(bestRoute(router, '198.51.7.7')?.next).toBe('b');
    expect(bestRoute(router, '8.8.8.8')?.next).toBe('a');
    expect(bestRoute(sample([{ to: '10.0.0.0/8', next: 'a' }]), '8.8.8.8')).toBeUndefined();
  });
});

describe('interfaces', () => {
  it('finds the interface that faces a LAN or a router, and the owner of an IP', () => {
    const office = routerNamed(officeRouter.id);
    expect(interfaceTowards(office, floor2.id)).toBe(floor2.gateway);
    expect(interfaceTowards(office, provider.id)).toBe(officeRouter.uplink);
    expect(interfaceTowards(office, 'nowhere')).toBeUndefined();
    expect([ownsIp(office, floor1.gateway), ownsIp(office, provider.towardOffice)]).toEqual([true, false]);
  });

  it('tells a router of the office, which faces a LAN, from one of the road to the internet', () => {
    expect([officeRouter.id, provider.id, backbone.id].map((id) => facesALan(net, routerNamed(id)))).toEqual([true, false, false]);
  });
});

describe('onwardFrom', () => {
  it('delivers to a connected device, a server behind an interface or the router next door that owns the IP', () => {
    expect(onwardFrom(net, routerNamed(officeRouter.id), floor2.andres)).toMatchObject({ kind: 'device', device: { id: 'andres-laptop' } });
    expect(onwardFrom(net, routerNamed(backbone.id), server.ip)).toMatchObject({ kind: 'server', server: { id: server.id } });
    expect(onwardFrom(net, routerNamed(provider.id), backbone.towardProvider)).toMatchObject({ kind: 'router', router: { id: backbone.id }, ingress: backbone.towardProvider });
  });

  it('says there is no host when it has the network connected and nobody has the IP, or the device has no cable', () => {
    expect(onwardFrom(net, routerNamed(officeRouter.id), '192.168.2.99')).toEqual({ kind: 'no-host' });
    expect(onwardFrom(net, routerNamed(officeRouter.id), floor1.guest)).toEqual({ kind: 'no-host' });
    expect(onwardFrom(net, routerNamed(backbone.id), '198.51.100.77')).toEqual({ kind: 'no-host' });
  });

  it('follows the routes, and drops a private IP at a router outside the office only', () => {
    expect(onwardFrom(net, routerNamed(officeRouter.id), server.ip)).toMatchObject({ kind: 'router', router: { id: provider.id }, ingress: provider.towardOffice });
    expect(onwardFrom(net, routerNamed(provider.id), '8.8.8.8')).toEqual({ kind: 'no-route' });
    expect(onwardFrom(net, routerNamed(provider.id), '10.0.0.10')).toEqual({ kind: 'private' });
    expect(onwardFrom(net, routerNamed(officeRouter.id), '10.0.0.10')).toMatchObject({ kind: 'router', router: { id: provider.id } });
  });

  it('treats a route to a router that does not face this one as no route', () => {
    const detached = { ...net, routers: (net.routers ?? []).map((router) => (router.id === backbone.id ? { ...router, interfaces: router.interfaces.filter((face) => face.faces !== provider.id) } : router)) };
    expect(onwardFrom(detached, routerNamed(provider.id), server.ip)).toEqual({ kind: 'no-route' });
  });
});
