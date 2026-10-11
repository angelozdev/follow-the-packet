import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping, withDevice } from '@/testing';
import { applyAction } from '@/engine/network/actions';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import type { Network, Route } from '@/engine/network/types';
import { stopStep } from './checkpoints';
import { simulate } from '@/engine/simulation/simulate';
import { TRACEROUTE_MAX_HOPS, traceroute } from './traceroute';

describe('traceroute', () => {
  const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
  const you = device('your-laptop');
  const floors = (): Network => officeTwoFloorsNet();
  const withRoutes = (net: Network, routerId: string, routes: Route[], sendsUnreachable = true): Network => applyAction(net, { type: 'updateRouter', routerId, routes, sendsUnreachable });
  const loopNet = (): Network => withRoutes(floors(), provider.id, [{ to: ROUTE_DEFAULT, next: officeRouter.id }]);
  const withoutServerRoute = (sendsUnreachable: boolean): Network => withRoutes(floors(), provider.id, [{ to: floors().cidr, next: officeRouter.id }], sendsUnreachable);
  const ipsOf = (net: Network, to: string): (string | undefined)[] => traceroute(net, you, to, TRACEROUTE_MAX_HOPS).lines.map((line) => line.ip);

  it('traceroute lists one line per router, in order, with the IP that warned and its time', () => {
    const { lines, localError } = traceroute(floors(), you, server.ip, TRACEROUTE_MAX_HOPS);
    expect(localError).toBeUndefined();
    expect(lines.slice(0, 3).map((line) => [line.hop, line.ip, line.reached])).toEqual([
      [1, floor1.gateway, false],
      [2, provider.towardOffice, false],
      [3, backbone.towardProvider, false],
    ]);
    expect(lines.slice(0, 3).map((line) => line.rttMs)).toEqual([4, 20, 44]);
    expect(lines.map((line) => line.rttMs)).toEqual([1, 2, 3, 4].map((ttl) => simulate(floors(), { ...ping(you, server.ip), ttl }).rttMs));
  });

  it('traceroute ends with the destination when it answers', () => {
    const { lines } = traceroute(floors(), you, server.ip, TRACEROUTE_MAX_HOPS);
    expect(lines).toHaveLength(4);
    expect(lines.slice(0, 3).some((line) => line.reached)).toBe(false);
    expect(lines[3]).toStrictEqual({ hop: 4, ip: server.ip, rttMs: 84, reached: true });

    expect(traceroute(floors(), you, floor1.lucia, TRACEROUTE_MAX_HOPS).lines).toStrictEqual([{ hop: 1, ip: floor1.lucia, rttMs: 2, reached: true }]);
    expect(ipsOf(floors(), floor2.andres)).toEqual([floor1.gateway, floor2.andres]);
    expect(ipsOf(floors(), 'localhost')).toEqual(['127.0.0.1']);
  });

  it('a router that stays silent gives a line with no IP', () => {
    const { lines } = traceroute(withoutServerRoute(false), you, server.ip, TRACEROUTE_MAX_HOPS);
    expect(lines).toHaveLength(TRACEROUTE_MAX_HOPS);
    expect(lines.slice(0, 2).map((line) => line.ip)).toEqual([floor1.gateway, provider.towardOffice]);
    expect(lines[2]).toStrictEqual({ hop: 3, reached: false });
    expect(lines.slice(2)).toStrictEqual([3, 4, 5, 6, 7, 8].map((hop) => ({ hop, reached: false })));
  });

  it('traceroute in a loop alternates the two routers until the maximum of hops', () => {
    const { lines } = traceroute(loopNet(), you, server.ip, TRACEROUTE_MAX_HOPS);
    expect(lines.map((line) => line.hop)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(lines.map((line) => line.ip)).toEqual([floor1.gateway, provider.towardOffice, floor1.gateway, provider.towardOffice, floor1.gateway, provider.towardOffice, floor1.gateway, provider.towardOffice]);
    expect(lines.some((line) => line.reached)).toBe(false);
  });

  it('traceroute stops at the maximum of hops', () => {
    expect(traceroute(floors(), you, server.ip, 3).lines.map((line) => [line.hop, line.reached])).toEqual([[1, false], [2, false], [3, false]]);
    expect(traceroute(floors(), you, server.ip, 2).lines).toHaveLength(2);
    expect(traceroute(floors(), you, server.ip, 4).lines[3]?.reached).toBe(true);
    expect(traceroute(loopNet(), you, server.ip, 1).lines).toHaveLength(1);
    expect(() => traceroute(floors(), you, server.ip, 0)).toThrow(RangeError);
    expect(() => traceroute(floors(), you, server.ip, 256)).toThrow(RangeError);
    expect(() => traceroute(floors(), you, server.ip, 2.5)).toThrow(RangeError);
  });

  it('traceroute from a device with no gateway gives no lines and the local error', () => {
    const net = withDevice(floors(), 'your-laptop', { gateway: undefined });
    const result = traceroute(net, you, floor2.andres, TRACEROUTE_MAX_HOPS);
    expect(result.lines).toEqual([]);
    expect(result.localError?.outcome).toBe('no-route');
    expect(result.localError && stopStep(result.localError)).toEqual({
      stage: 'route',
      at: 'your-laptop',
      verdict: 'drop',
      reason: { code: 'route-no-gateway', deviceId: 'your-laptop', ip: floor2.andres },
    });
    expect(result.localError).toEqual(simulate(net, { ...ping(you, floor2.andres), ttl: 1 }));
    expect(traceroute(net, you, floor1.lucia, TRACEROUTE_MAX_HOPS).lines).toHaveLength(1);
  });

  it('a device with no cable, an invalid address and a name nobody resolves give the local error too', () => {
    const noCable = traceroute(floors(), device('guest-laptop'), floor1.lucia, TRACEROUTE_MAX_HOPS);
    expect([noCable.lines, noCable.localError?.outcome]).toEqual([[], 'no-route']);
    const invalid = traceroute(floors(), you, '256.1.1.1', TRACEROUTE_MAX_HOPS);
    expect([invalid.lines, invalid.localError?.outcome]).toEqual([[], 'invalid-address']);
    const unresolved = traceroute(floors(), you, 'nobody.example', TRACEROUTE_MAX_HOPS);
    expect([unresolved.lines, unresolved.localError?.outcome]).toEqual([[], 'unresolved']);
  });

  it('a destination that never answers leaves a star at every hop after the last router that warned', () => {
    const net = withDevice(floors(), 'andres-laptop', { firewallIds: ['fw-closed'] });
    const closed: Network = { ...net, firewalls: [{ id: 'fw-closed', name: 'fw-closed', kind: 'host-firewall', inbound: [], outbound: [] }] };
    const { lines } = traceroute(closed, you, floor2.andres, TRACEROUTE_MAX_HOPS);
    expect(lines).toHaveLength(TRACEROUTE_MAX_HOPS);
    expect(lines[0]).toStrictEqual({ hop: 1, ip: floor1.gateway, rttMs: 4, reached: false });
    expect(lines.slice(1)).toStrictEqual([2, 3, 4, 5, 6, 7, 8].map((hop) => ({ hop, reached: false })));
  });

  it('a router that warns it has no route gives one last line with its IP, its time and the kind of warning', () => {
    const { lines } = traceroute(withoutServerRoute(true), you, server.ip, TRACEROUTE_MAX_HOPS);
    expect(lines).toStrictEqual([
      { hop: 1, ip: floor1.gateway, rttMs: 4, reached: false },
      { hop: 2, ip: provider.towardOffice, rttMs: 20, reached: false },
      { hop: 3, ip: provider.towardOffice, rttMs: 20, unreachable: 'net', reached: false },
    ]);
  });

  it('a router that warns nobody has the host gives one last line marked as host unreachable', () => {
    const { lines } = traceroute(floors(), you, '198.51.100.99', TRACEROUTE_MAX_HOPS);
    expect(lines.map((line) => [line.hop, line.ip, line.unreachable])).toEqual([
      [1, floor1.gateway, undefined],
      [2, provider.towardOffice, undefined],
      [3, backbone.towardProvider, undefined],
      [4, backbone.towardProvider, 'host'],
    ]);
    expect(lines[3]?.rttMs).toBe(simulate(floors(), { ...ping(you, '198.51.100.99'), ttl: 4 }).rttMs);
    expect(lines.some((line) => line.reached)).toBe(false);
  });

  it('a warning the sender generates itself is one last line with its IP and no time', () => {
    const { lines, localError } = traceroute(floors(), you, floor1.nobody, TRACEROUTE_MAX_HOPS);
    expect(localError).toBeUndefined();
    expect(lines).toStrictEqual([{ hop: 1, ip: floor1.you, unreachable: 'host', reached: false }]);
  });

  it('the same network and destination give the same lines', () => {
    const net = floors();
    const before = structuredClone(net);
    expect(traceroute(net, you, server.ip, TRACEROUTE_MAX_HOPS)).toEqual(traceroute(net, you, server.ip, TRACEROUTE_MAX_HOPS));
    expect(net).toEqual(before);
  });
});
