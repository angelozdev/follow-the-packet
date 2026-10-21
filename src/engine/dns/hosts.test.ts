import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import type { Network } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import { simulateSequence } from '@/engine/simulation/sequence';
import { NAME_SERVER_PIECES, OFFICE_FLOORS, device, dig, officeWithNames, ping, tcp } from '@/testing';
import { hostsLine, hostsTrace } from './hosts';

const { zone, site, resolver } = NAME_SERVER_PIECES;
const WWW = `www.${zone}`;
const SHOP = `tienda.${zone}`;
const IN_HOSTS = '198.51.100.51';
const you = device('your-laptop');

const withHosts = (world: Network, hosts: { name: string; ip: string }[]): Network => applyAction(world, { type: 'setHosts', deviceId: 'your-laptop', hosts });
const readsHosts = withHosts(officeWithNames(), [{ name: SHOP, ip: site }]);
const codes = (world: Network, packet: Parameters<typeof simulate>[1]) => simulate(world, packet).steps.map((step) => step.reason.code);

describe('the hosts file of a device', () => {
  it('dig does not read the hosts file and ping does', () => {
    const pinged = simulate(readsHosts, ping(you, SHOP));
    expect(pinged.outcome).toBe('replied');
    expect(pinged.resolvedIp).toBe(site);
    expect(pinged.dns).toEqual(hostsTrace(SHOP));
    expect(pinged.steps[0]).toEqual({ stage: 'dns', at: 'your-laptop', verdict: 'info', reason: { code: 'dns-hosts-file', deviceId: 'your-laptop', name: SHOP, ip: site } });
    const dug = simulate(readsHosts, dig(you, SHOP));
    expect(dug.dns).toMatchObject({ name: SHOP, status: 'NXDOMAIN', usedHostsFile: false, viaDig: true });
    expect(dug.dns?.soa?.name).toBe(zone);
    expect(dug.resolvedIp).toBe(resolver.ip);
    expect(codes(readsHosts, dig(you, SHOP))).not.toContain('dns-hosts-file');
    expect(simulate(readsHosts, tcp(you, SHOP, 80)).dns?.usedHostsFile).toBe(true);
  });

  it('a line of the hosts file answers before any query is sent', () => {
    const shadowing = withHosts(officeWithNames(), [{ name: WWW, ip: IN_HOSTS }]);
    const toHosts = simulate(shadowing, ping(you, WWW));
    expect(toHosts.resolvedIp).toBe(IN_HOSTS);
    expect(codes(shadowing, ping(you, WWW))[0]).toBe('dns-hosts-file');
    expect(simulate(shadowing, dig(you, WWW)).dns).toMatchObject({ status: 'NOERROR', answers: [{ value: site }] });
    const lost = applyAction(shadowing, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.server.nobody });
    const noResolver = applyAction(shadowing, { type: 'setDnsServer', deviceId: 'your-laptop' });
    for (const world of [lost, noResolver]) expect(simulate(world, ping(you, WWW)).resolvedIp, world.devices[0].dnsServer).toBe(IN_HOSTS);
    expect(codes(lost, ping(you, `blog.${zone}`))).toEqual(['dns-resolver-silent']);
  });

  it('a line of the hosts file asks nobody, so no resolver stores anything', () => {
    const traces = simulateSequence(withHosts(officeWithNames(), [{ name: WWW, ip: IN_HOSTS }]), [
      { packet: ping(you, WWW), at: 0 },
      { packet: dig(you, WWW), at: 1 },
    ]);
    expect(traces[0].dns?.usedHostsFile).toBe(true);
    expect(traces[1].dns).toMatchObject({ fromCache: false, usedHostsFile: false });
    expect(traces[1].dns).not.toHaveProperty('ttlLeft');
  });

  it('a name with no line goes on to the resolver, and a device with no hosts file reads none', () => {
    expect(codes(readsHosts, ping(you, WWW))).toEqual(['dns-answered', 'route-leaves-office', 'forward-hop', 'forward-hop', 'forward-hop', 'host-replies', 'reply-stateful']);
    expect(simulate(readsHosts, ping(you, WWW)).dns?.usedHostsFile).toBe(false);
    expect(simulate(officeWithNames(), ping(you, SHOP)).dns?.status).toBe('NXDOMAIN');
    expect(simulate(withHosts(readsHosts, []), ping(you, SHOP)).dns?.status).toBe('NXDOMAIN');
  });
});

describe('hostsLine', () => {
  const laptop = { hosts: [{ name: 'Tienda.Lucia.Example', ip: site }, { name: SHOP, ip: IN_HOSTS }] };

  it('compares names the way DNS names are compared and takes the first line that matches', () => {
    expect(hostsLine(laptop, SHOP)).toEqual({ name: 'Tienda.Lucia.Example', ip: site });
    expect(hostsLine(laptop, `TIENDA.lucia.example.`)).toEqual({ name: 'Tienda.Lucia.Example', ip: site });
  });

  it('finds nothing for a name with no line and for a device with no hosts file', () => {
    expect(hostsLine(laptop, WWW)).toBeUndefined();
    expect(hostsLine({}, SHOP)).toBeUndefined();
    expect(hostsLine({ hosts: [] }, SHOP)).toBeUndefined();
  });
});
