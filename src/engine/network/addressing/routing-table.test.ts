import { describe, expect, it } from 'vitest';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Device, Network, Router } from '@/engine/network/types';
import { OFFICE, OFFICE_FLOORS, officeNet, officeTwoFloorsNet, withDevice } from '@/testing';
import { chooseRoute, routingTableOf } from './routing-table';

const { range, floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const net = officeTwoFloorsNet();
const deviceIn = (world: Network, id: string): Device => world.devices.find((candidate) => candidate.id === id)!;
const deviceNamed = (id: string): Device => deviceIn(net, id);
const routerNamed = (id: string): Router => (net.routers ?? []).find((candidate) => candidate.id === id)!;
const providerWith = (routes: Router['routes']): Router => ({ ...routerNamed(provider.id), routes });
const BROAD_RANGE = '198.51.0.0/16';

describe('routingTableOf', () => {
  it('a device table has its connected route and its default route when it has a gateway', () => {
    expect(routingTableOf(net, deviceNamed('your-laptop'))).toEqual([
      { to: floor1.cidr, kind: 'connected' },
      { to: ROUTE_DEFAULT, kind: 'default', via: floor1.gateway },
    ]);
    expect(routingTableOf(net, deviceNamed('andres-laptop'))).toEqual([
      { to: floor2.cidr, kind: 'connected' },
      { to: ROUTE_DEFAULT, kind: 'default', via: floor2.gateway },
    ]);
  });

  it('a device with no gateway has no default route', () => {
    const noGateway = withDevice(net, 'your-laptop', { gateway: undefined });
    expect(routingTableOf(noGateway, deviceIn(noGateway, 'your-laptop'))).toEqual([{ to: floor1.cidr, kind: 'connected' }]);
    const office = officeNet();
    expect(routingTableOf(office, office.devices[0])).toEqual([{ to: OFFICE.cidr, kind: 'connected' }]);
  });

  it('a router table lists a connected route per interface and its own routes', () => {
    expect(routingTableOf(net, routerNamed(officeRouter.id))).toEqual([
      { to: floor1.cidr, kind: 'connected' },
      { to: floor2.cidr, kind: 'connected' },
      { to: `${provider.towardOffice}/32`, kind: 'connected' },
      { to: ROUTE_DEFAULT, kind: 'default', via: provider.towardOffice },
    ]);
    expect(routingTableOf(net, routerNamed(backbone.id))).toEqual([
      { to: `${provider.towardInternet}/32`, kind: 'connected' },
      { to: server.range, kind: 'connected' },
      { to: range, kind: 'static', via: provider.towardInternet },
    ]);
  });
});

describe('chooseRoute', () => {
  it('the longest prefix wins and the trace lists the routes that also covered the destination', () => {
    const router = providerWith([
      { to: ROUTE_DEFAULT, next: officeRouter.id },
      { to: BROAD_RANGE, next: backbone.id },
      { to: server.range, next: backbone.id },
    ]);
    const viaBackbone = { via: backbone.towardProvider };
    const viaOffice = { via: officeRouter.uplink };
    expect(chooseRoute(net, router, server.ip)).toEqual({
      holderId: provider.id,
      route: { to: server.range, ...viaBackbone },
      kind: 'static',
      alsoCovered: [
        { to: BROAD_RANGE, kind: 'static', ...viaBackbone },
        { to: ROUTE_DEFAULT, kind: 'default', ...viaOffice },
      ],
    });
    expect(chooseRoute(net, router, '198.51.7.7')).toMatchObject({ route: { to: BROAD_RANGE }, alsoCovered: [{ to: ROUTE_DEFAULT }] });
    expect(chooseRoute(net, router, '8.8.8.8')).toMatchObject({ route: { to: ROUTE_DEFAULT, ...viaOffice }, kind: 'default', alsoCovered: [] });
    expect(chooseRoute(net, router, backbone.towardProvider)).toMatchObject({ route: { to: `${backbone.towardProvider}/32` }, kind: 'connected', alsoCovered: [{ to: ROUTE_DEFAULT }] });
  });

  it('a device chooses its connected route inside its LAN and its default route outside it, and the default also covered the first', () => {
    const laptop = deviceNamed('your-laptop');
    expect(chooseRoute(net, laptop, floor1.lucia)).toEqual({
      holderId: laptop.id,
      route: { to: floor1.cidr },
      kind: 'connected',
      alsoCovered: [{ to: ROUTE_DEFAULT, kind: 'default', via: floor1.gateway }],
    });
    expect(chooseRoute(net, laptop, floor2.andres)).toEqual({ holderId: laptop.id, route: { to: ROUTE_DEFAULT, via: floor1.gateway }, kind: 'default', alsoCovered: [] });
  });

  it('a destination that no row covers has no decision', () => {
    expect(chooseRoute(net, providerWith([]), '8.8.8.8')).toBeUndefined();
    const office = officeNet();
    expect(chooseRoute(office, office.devices[0], '8.8.8.8')).toBeUndefined();
  });
});
