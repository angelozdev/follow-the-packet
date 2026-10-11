import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import type { AnswerRecord, Device, Network, ServerActor, ServerDns, SoaRecord, Zone } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import { simulateSequence } from '@/engine/simulation/sequence';
import { NAME_SERVERS, OFFICE_FLOORS, allOut, device, dig, officeWithNames, ping, tcpService } from '@/testing';
import { DNS_PORT, MAX_ALIAS_STEPS, resolve, type LookupMode } from './resolve';
import { RECORD_TTL, nsOf, soaOf, zoneOf } from './records';

const { zone: ZONE, downZone: DOWN_ZONE, site, resolver, authoritative, down } = NAME_SERVERS;
const WWW = `www.${ZONE}`;
const BLOG = `blog.${ZONE}`;
const GONE = `noexiste.${ZONE}`;
const OTHER_ZONE = 'tienda.example';
const you = device('your-laptop');

const net = officeWithNames();
const laptop = (world: Network, id = 'your-laptop'): Device => world.devices.find((candidate) => candidate.id === id)!;
const ask = (name: string, world: Network = net, mode: LookupMode = 'system') => resolve(world, laptop(world), name, mode, simulate);
const aRecord = (name: string, value: string = site): AnswerRecord => ({ name, type: 'A', value, ttl: RECORD_TTL });
const cname = (name: string, value: string): AnswerRecord => ({ name, type: 'CNAME', value, ttl: RECORD_TTL });
const codes = (world: Network, name: string) => simulate(world, ping(you, name)).steps.map((step) => step.reason.code);
const dnsOf = (server: ServerActor): ServerDns => server.dns!;
const serverOf = (world: Network, id: string): ServerActor => world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === id)!;

function withAuthoritativeZones(world: Network, ...zones: Zone[]): Network {
  const upstreams = [...(dnsOf(serverOf(world, resolver.id)).upstreams ?? []), ...zones.filter(({ name }) => name !== ZONE).map(({ name }) => ({ zone: name, serverId: authoritative.id }))];
  const configured = applyAction(world, { type: 'setDns', ownerId: authoritative.id, dns: { role: 'authoritative', zones } });
  return applyAction(configured, { type: 'setDns', ownerId: resolver.id, dns: { role: 'resolver', upstreams } });
}

function withLuciaRecords(world: Network, records: AnswerRecord[]): Network {
  return withAuthoritativeZones(world, zoneOf(ZONE, [aRecord(WWW), cname(BLOG, WWW), ...records]));
}

function withSoa(world: Network, patch: Partial<SoaRecord> & { minimum?: number }): Network {
  const base = soaOf(ZONE);
  const soa: SoaRecord = { ...base, ...patch, value: { ...base.value, ...(patch.minimum !== undefined && { minimum: patch.minimum }) } };
  return withAuthoritativeZones(world, { name: ZONE, records: [nsOf(ZONE), soa, aRecord(WWW)] });
}

describe('resolving a name', () => {
  it('an a record gives its ip and its time to live', () => {
    const found = ask(WWW);
    expect(found.answered && found.resolverId).toBe(resolver.id);
    expect(found.dns).toEqual({ name: WWW, status: 'NOERROR', answers: [aRecord(WWW)], fromCache: false, usedHostsFile: false, viaDig: false });
    expect(found.dns.answers[0].ttl).toBe(300);
    expect(found.query?.outcome).toBe('replied');
    expect(found.query?.header?.request).toMatchObject({ source: laptop(net).privateIp, destination: resolver.ip, destinationPort: DNS_PORT });
    expect(found.query?.exchange).toEqual([{ from: 'client', kind: 'query' }, { from: 'server', kind: 'response' }]);
    const trace = simulate(net, ping(you, WWW));
    expect(trace.outcome).toBe('replied');
    expect(trace.resolvedIp).toBe(site);
    expect(trace.dns).toEqual(found.dns);
    expect(trace.steps[0]).toEqual({ stage: 'dns', at: 'your-laptop', verdict: 'info', reason: { code: 'dns-answered', deviceId: 'your-laptop', resolverId: resolver.id, name: WWW, ip: site } });
  });

  it('a lookup made by dig says so and reads the same answer', () => {
    const viaDig = ask(WWW, net, 'dig');
    expect(viaDig.dns).toEqual({ ...ask(WWW).dns, viaDig: true });
  });

  it('the name is not case sensitive', () => {
    expect(ask(WWW.toUpperCase()).dns).toMatchObject({ status: 'NOERROR', answers: [aRecord(WWW)] });
  });

  it('a cname is followed to an a record and the trace says it was an alias', () => {
    const found = ask(BLOG);
    expect(found.dns.status).toBe('NOERROR');
    expect(found.dns.answers).toEqual([cname(BLOG, WWW), aRecord(WWW)]);
    const trace = simulate(net, ping(you, BLOG));
    expect(trace.outcome).toBe('replied');
    expect(trace.resolvedIp).toBe(site);
    expect(trace.dns?.answers.map((record) => record.type)).toEqual(['CNAME', 'A']);
    expect(trace.steps[0].reason).toEqual({ code: 'dns-answered', deviceId: 'your-laptop', resolverId: resolver.id, name: BLOG, ip: site, canonical: WWW });
    expect(ask(WWW).dns.answers.some((record) => record.type === 'CNAME')).toBe(false);
  });

  it('a chain of aliases is followed, also into another zone of the same server', () => {
    const world = withAuthoritativeZones(net, zoneOf(ZONE, [aRecord(WWW), cname(BLOG, `shop.${OTHER_ZONE}`)]), zoneOf(OTHER_ZONE, [cname(`shop.${OTHER_ZONE}`, WWW)]));
    expect(ask(BLOG, world).dns.answers).toEqual([cname(BLOG, `shop.${OTHER_ZONE}`), cname(`shop.${OTHER_ZONE}`, WWW), aRecord(WWW)]);
  });

  it('a loop of aliases ends as SERVFAIL', () => {
    const world = withLuciaRecords(net, [cname(`a.${ZONE}`, `b.${ZONE}`), cname(`b.${ZONE}`, `a.${ZONE}`)]);
    expect(ask(`a.${ZONE}`, world).dns).toMatchObject({ status: 'SERVFAIL', answers: [] });
    const chain = (aliases: number) => [...Array.from({ length: aliases }, (_, index) => cname(`c${index}.${ZONE}`, `c${index + 1}.${ZONE}`)), aRecord(`c${aliases}.${ZONE}`)];
    expect(ask(`c0.${ZONE}`, withLuciaRecords(net, chain(MAX_ALIAS_STEPS))).dns.status).toBe('NOERROR');
    expect(ask(`c0.${ZONE}`, withLuciaRecords(net, chain(MAX_ALIAS_STEPS + 1))).dns).toMatchObject({ status: 'SERVFAIL', answers: [] });
  });

  it('a name that nobody has answers NXDOMAIN', () => {
    const found = ask(GONE);
    expect(found.dns).toMatchObject({ name: GONE, status: 'NXDOMAIN', answers: [] });
    const trace = simulate(net, ping(you, GONE));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.resolvedIp).toBeNull();
    expect(trace.steps).toEqual([{ stage: 'dns', at: 'your-laptop', verdict: 'drop', reason: { code: 'dns-nxdomain', deviceId: 'your-laptop', resolverId: resolver.id, name: GONE } }]);
    expect(trace.tcpdump).toEqual([]);
    expect(trace.dns?.status).toBe('NXDOMAIN');
    expect(trace).not.toHaveProperty('header');
  });

  it('a name outside every zone of the resolver is NXDOMAIN with no SOA, since the root and the top-level domains are not modelled', () => {
    const found = ask('www.nowhere.invalid-zone');
    expect(found.dns).toMatchObject({ status: 'NXDOMAIN', answers: [] });
    expect(found.dns).not.toHaveProperty('soa');
  });

  it('an alias whose target does not exist is NXDOMAIN with the alias in the answer and the SOA of the zone of the target', () => {
    const world = withLuciaRecords(net, [cname(`broken.${ZONE}`, GONE)]);
    const found = ask(`broken.${ZONE}`, world);
    expect(found.dns.status).toBe('NXDOMAIN');
    expect(found.dns.answers).toEqual([cname(`broken.${ZONE}`, GONE)]);
    expect(found.dns.soa?.name).toBe(ZONE);
  });

  it('a name that exists and has no address is NOERROR with no address and the SOA, and the packet ends as unresolved', () => {
    const apex = ask(ZONE);
    expect(apex.dns).toMatchObject({ status: 'NOERROR', answers: [], soa: { name: ZONE, type: 'SOA' } });
    const world = withLuciaRecords(net, [aRecord(`a.b.${ZONE}`)]);
    expect(ask(`b.${ZONE}`, world).dns).toMatchObject({ status: 'NOERROR', answers: [] });
    expect(ask(`b.${ZONE}`, world).dns.soa).toBeDefined();
    const trace = simulate(net, ping(you, ZONE));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.steps.map((step) => step.reason.code)).toEqual(['dns-no-address']);
  });

  it('an NXDOMAIN carries the SOA of the zone that answered, with the smaller of its ttl and its minimum', () => {
    const base = soaOf(ZONE);
    const found = ask(GONE);
    expect(found.dns.soa).toEqual({ ...base, ttl: 300 });
    expect(found.dns.soa?.value).toEqual(base.value);
    expect(ask(GONE, withSoa(net, { ttl: 30 })).dns.soa).toMatchObject({ ttl: 30, value: { minimum: 1200 } });
    expect(ask(GONE, withSoa(net, { minimum: 60 })).dns.soa).toMatchObject({ ttl: 60, value: { minimum: 60 } });
    expect(ask(GONE, withSoa(net, { ttl: 90, minimum: 90 })).dns.soa?.ttl).toBe(90);
    expect(simulate(net, ping(you, GONE)).dns?.soa).toEqual(found.dns.soa);
    expect(ask(WWW).dns).not.toHaveProperty('soa');
  });

  it('an authoritative server that fails makes the resolver answer SERVFAIL', () => {
    const name = `www.${DOWN_ZONE}`;
    const found = ask(name);
    expect(found.dns).toMatchObject({ name, status: 'SERVFAIL', answers: [] });
    expect(found.dns).not.toHaveProperty('soa');
    expect(found.answered && found.serverId).toBe(down.id);
    const trace = simulate(net, ping(you, name));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.steps).toEqual([{ stage: 'dns', at: 'your-laptop', verdict: 'drop', reason: { code: 'dns-servfail', deviceId: 'your-laptop', resolverId: resolver.id, name, serverId: down.id } }]);
    expect(ask(WWW).dns.status).toBe('NOERROR');
    expect(ask(GONE).dns.status).toBe('NXDOMAIN');
    const repaired = applyAction(net, { type: 'setDns', ownerId: down.id, dns: { ...dnsOf(serverOf(net, down.id)), failing: false } });
    expect(ask(name, repaired).dns).toMatchObject({ status: 'NOERROR', answers: [aRecord(name, '198.51.100.55')] });
  });

  it('a server that holds no zone for the name it was asked about answers SERVFAIL, like a lame delegation', () => {
    const lame = applyAction(net, { type: 'setDns', ownerId: authoritative.id, dns: { role: 'authoritative', zones: [zoneOf(OTHER_ZONE, [])] } });
    expect(ask(WWW, lame).dns.status).toBe('SERVFAIL');
  });
});

describe('the question travels as a UDP datagram to port 53', () => {
  it('goes through the routers of the office and the rules of the device like any packet', () => {
    const found = ask(WWW);
    expect(found.query?.hops?.map((hop) => hop.routerId)).toEqual([OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.provider.id, OFFICE_FLOORS.backbone.id]);
    expect(found.query?.destinationId).toBe(resolver.id);
  });

  it('a firewall that stops the datagram leaves the device with no answer: NO-RESOLVER, and the packet ends as unresolved', () => {
    const closed = applyAction(applyAction(net, { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } }), { type: 'setDnsServer', deviceId: 'your-laptop', server: resolver.ip });
    const found = ask(WWW, closed);
    expect(found.answered).toBe(false);
    expect(found.dns).toMatchObject({ status: 'NO-RESOLVER', answers: [] });
    expect(found.query?.outcome).toBe('timeout');
    expect(found).not.toHaveProperty('notAResolver');
    const trace = simulate(closed, ping(you, WWW));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.steps).toEqual([{ stage: 'dns', at: 'your-laptop', verdict: 'drop', reason: { code: 'dns-resolver-silent', deviceId: 'your-laptop', name: WWW, ip: resolver.ip } }]);
    const dug = simulate(closed, dig(you, WWW));
    expect(dug.outcome).toBe('timeout');
    expect(dug.dns).toMatchObject({ status: 'NO-RESOLVER', viaDig: true });
    const open = applyAction(closed, { type: 'addRule', firewallId: 'fw-you', rule: allOut('everything'), direction: 'outbound' });
    expect(ask(WWW, open).dns.status).toBe('NOERROR');
  });

  it('a resolver address with no DNS service behind it is NO-RESOLVER, and a device that warns shows in the datagram', () => {
    const toPrinter = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.floor1.printer });
    const found = ask(WWW, toPrinter);
    expect(found.dns.status).toBe('NO-RESOLVER');
    expect(found.query).toMatchObject({ outcome: 'unreachable', notice: { kind: 'port-unreachable', fromId: 'printer' } });
    expect(found).toMatchObject({ answered: false, notAResolver: 'printer' });
    const noSuchHost = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop', server: '198.51.100.77' });
    expect(ask(WWW, noSuchHost).query?.outcome).toBe('unreachable');
    expect(ask(WWW, noSuchHost).dns.status).toBe('NO-RESOLVER');
    expect(ask(WWW, noSuchHost)).not.toHaveProperty('notAResolver');
    expect(codes(noSuchHost, WWW)).toEqual(['dns-resolver-silent']);
  });

  it('a server that listens on port 53 but is no resolver does not answer a name', () => {
    const plain = applyAction(net, { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [{ protocol: 'udp', port: DNS_PORT, listen: 'all' }] });
    const toServer = applyAction(plain, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.server.ip });
    const found = ask(WWW, toServer);
    expect(found.query?.outcome).toBe('replied');
    expect(found.dns.status).toBe('NO-RESOLVER');
    expect(found).toMatchObject({ answered: false, notAResolver: OFFICE_FLOORS.server.id });
    const authoritativeAsResolver = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop', server: NAME_SERVERS.authoritative.ip });
    expect(ask(WWW, authoritativeAsResolver)).toMatchObject({ answered: false, notAResolver: NAME_SERVERS.authoritative.id });
  });

  it('a resolver whose listening address is the loopback one does not take the question', () => {
    const hidden = applyAction(net, { type: 'setListenAddress', ownerId: resolver.id, protocol: 'udp', port: DNS_PORT, listen: 'loopback' });
    expect(ask(WWW, hidden).dns.status).toBe('NO-RESOLVER');
    expect(ask(WWW, hidden)).toMatchObject({ answered: false, notAResolver: resolver.id });
  });
});

describe('a device with no resolver', () => {
  it('sends nothing: NO-RESOLVER, no query and the old step of an office that could not resolve a name', () => {
    const none = applyAction(net, { type: 'setDnsServer', deviceId: 'your-laptop' });
    expect(laptop(none)).not.toHaveProperty('dnsServer');
    const found = ask(WWW, none);
    expect(found).toEqual({ answered: false, dns: { name: WWW, status: 'NO-RESOLVER', answers: [], fromCache: false, usedHostsFile: false, viaDig: false } });
    expect(codes(none, WWW)).toEqual(['dns-unresolved']);
  });
});

describe('the question in a sequence', () => {
  it('does not use up the source port of the sender nor leave a row in the translation table', () => {
    const [byName, byIp] = simulateSequence(net, [
      { packet: { from: you, to: WWW, protocol: 'tcp', port: 80 }, at: 0 },
      { packet: { from: you, to: site, protocol: 'tcp', port: 80 }, at: 0 },
    ]);
    expect(byName.header?.request).toMatchObject({ sourcePort: 51514, destination: site });
    expect(byName.translation?.outside.port).toBe(40001);
    expect(byIp.header?.request).toMatchObject({ sourcePort: 51515 });
    expect(byIp.translation?.outside.port).toBe(40002);
  });

  it('gives the same traces for the same sends', () => {
    const sends = [WWW, BLOG, GONE].map((to) => ({ packet: ping(you, to), at: 0 }));
    expect(simulateSequence(net, sends)).toEqual(simulateSequence(net, sends));
  });
});

describe('the services of the name servers', () => {
  it('listen on port 53 of UDP and of TCP, and the question uses UDP', () => {
    const services = serverOf(net, resolver.id).services;
    expect(services).toEqual([{ protocol: 'udp', port: 53, listen: 'all' }, { protocol: 'tcp', port: 53, listen: 'all' }]);
    expect(tcpService(DNS_PORT)).toEqual(services?.[1]);
    expect(ask(WWW).query?.header?.request).toMatchObject({ destinationPort: DNS_PORT });
    expect(ask(WWW).query?.exchange?.at(0)?.kind).toBe('query');
  });
});
