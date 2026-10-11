import { describe, expect, it } from 'vitest';
import { applyAction, networkActionSchema, type NetworkAction } from '@/engine/network/actions';
import { networkSchema } from '@/engine/network/schema';
import type { AnswerRecord, DnsRecord, Network, ServerActor, ServerDns, SoaRecord, Zone } from '@/engine/network/types';
import { NAME_SERVERS, OFFICE_FLOORS, lab03Net, officeWithNames } from '@/testing';
import { RECORD_PROBLEMS, RECORD_TTL, negativeTtl, recordProblem, soaOf } from './records';

const { zone: ZONE, authoritative, resolver, site } = NAME_SERVERS;
const WWW = `www.${ZONE}`;
const BLOG = `blog.${ZONE}`;
const SOA_FIELDS = ['mname', 'rname', 'serial', 'refresh', 'retry', 'expire', 'minimum'];

const aRecord = (name: string, value: string = site): AnswerRecord => ({ name, type: 'A', value, ttl: RECORD_TTL });
const cname = (name: string, value: string): AnswerRecord => ({ name, type: 'CNAME', value, ttl: RECORD_TTL });
const serverOf = (net: Network, id: string): ServerActor => net.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === id)!;
const zonesOf = (net: Network, id: string): Zone[] => serverOf(net, id).dns?.zones ?? [];
const problems = (net: Network): string[] => networkSchema.safeParse(net).error?.issues.map((issue) => issue.message) ?? [];
const soaIn = (zone: Zone): SoaRecord => zone.records.find((record): record is SoaRecord => record.type === 'SOA')!;

function withZones(net: Network, id: string, zones: Zone[]): Network {
  const dns: ServerDns = { ...serverOf(net, id).dns!, zones };
  return applyAction(net, { type: 'setDns', ownerId: id, dns });
}

function withRecords(net: Network, records: DnsRecord[]): Network {
  const [zone] = zonesOf(net, authoritative.id);
  return withZones(net, authoritative.id, [{ ...zone, records: [...zone.records, ...records] }]);
}

const addRecord = (record: AnswerRecord, serverId: string = authoritative.id): NetworkAction => ({ type: 'addRecord', serverId, record });

describe('the CNAME rule', () => {
  it('a name with a cname cannot hold another record', () => {
    const net = officeWithNames();
    expect(problems(net)).toEqual([]);
    expect(problems(withRecords(net, [aRecord(BLOG)]))).toEqual([`${authoritative.id}: ${BLOG} holds a CNAME and another record`]);
    expect(problems(withRecords(net, [cname(BLOG, WWW)]))).toEqual([`${authoritative.id}: ${BLOG} holds a CNAME and another record`]);
    expect(problems(withRecords(net, [cname(WWW, BLOG)]))).toEqual([`${authoritative.id}: ${WWW} holds a CNAME and another record`]);
    expect(problems(withRecords(net, [aRecord(BLOG.toUpperCase())]))).toHaveLength(1);
    expect(problems(withRecords(net, [aRecord(WWW, '198.51.100.51')]))).toEqual([]);
  });

  it('a cname at the top of the zone is rejected because the zone has its own records', () => {
    const net = officeWithNames();
    const alias = cname(ZONE, WWW);
    expect(problems(withRecords(net, [alias]))).toEqual([`${authoritative.id}: ${ZONE} holds a CNAME and another record`]);
    expect(recordProblem(net, authoritative.id, alias)).toBe('cname-at-apex');
    expect(applyAction(net, addRecord(alias))).toBe(net);
    const apexNames = zonesOf(net, authoritative.id)[0].records.filter((record) => record.name === ZONE).map((record) => record.type);
    expect(apexNames).toEqual(['NS', 'SOA']);
  });

  it('addRecord returns the same network when the cname rule forbids it and recordProblem says why', () => {
    const net = officeWithNames();
    const refused: [string, AnswerRecord, string, (typeof RECORD_PROBLEMS)[number]][] = [
      ['an address next to an alias', aRecord(BLOG), authoritative.id, 'name-is-an-alias'],
      ['a second alias at an alias', cname(BLOG, `shop.${ZONE}`), authoritative.id, 'cname-with-other-records'],
      ['an alias next to an address', cname(WWW, BLOG), authoritative.id, 'cname-with-other-records'],
      ['an alias at the top of the zone', cname(ZONE, WWW), authoritative.id, 'cname-at-apex'],
      ['the record the zone already has', aRecord(WWW), authoritative.id, 'already-there'],
      ['a name that no zone of the server holds', aRecord('www.noticias.example'), authoritative.id, 'no-zone'],
      ['a server that is not authoritative', aRecord(WWW, '198.51.100.51'), resolver.id, 'no-zone'],
      ['a server that does not exist', aRecord(WWW, '198.51.100.51'), 'ghost', 'no-zone'],
    ];
    for (const [name, record, serverId, why] of refused) {
      expect(recordProblem(net, serverId, record), name).toBe(why);
      expect(applyAction(net, addRecord(record, serverId)), name).toBe(net);
    }
    expect(new Set(refused.map(([, , , why]) => why))).toEqual(new Set(RECORD_PROBLEMS));
  });

  it('a record that raises no problem is added to the zone that holds its name and leaves the network valid', () => {
    const net = officeWithNames();
    const shop = aRecord(`tienda.${ZONE}`);
    expect(recordProblem(net, authoritative.id, shop)).toBeUndefined();
    const added = applyAction(net, addRecord(shop));
    expect(zonesOf(added, authoritative.id)[0].records.at(-1)).toEqual(shop);
    expect(problems(added)).toEqual([]);
    const second = applyAction(added, addRecord(aRecord(`tienda.${ZONE}`, '198.51.100.51')));
    expect(zonesOf(second, authoritative.id)[0].records.filter((record) => record.name === shop.name)).toHaveLength(2);
    expect(zonesOf(added, NAME_SERVERS.down.id)).toEqual(zonesOf(net, NAME_SERVERS.down.id));
  });

  it('removeRecord removes the record with that name, type and value and returns the same network for one the zone does not hold', () => {
    const net = officeWithNames();
    const removed = applyAction(net, { type: 'removeRecord', serverId: authoritative.id, record: { name: WWW, type: 'A', value: site } });
    expect(zonesOf(removed, authoritative.id)[0].records.map((record) => record.name)).toEqual([ZONE, ZONE, BLOG]);
    const keys = [
      { name: WWW, type: 'A', value: '198.51.100.99' },
      { name: WWW, type: 'CNAME', value: site },
      { name: ZONE, type: 'A', value: `ns1.${ZONE}` },
      { name: 'www.noticias.example', type: 'A', value: '198.51.100.55' },
    ] as const;
    for (const record of keys) expect(applyAction(net, { type: 'removeRecord', serverId: authoritative.id, record })).toBe(net);
    expect(applyAction(net, { type: 'removeRecord', serverId: resolver.id, record: { name: WWW, type: 'A', value: site } })).toBe(net);
  });

  it('the actions take an address or an alias, and the NS and the SOA belong to the zone', () => {
    const parses = (record: unknown) => networkActionSchema.safeParse({ type: 'addRecord', serverId: authoritative.id, record }).success;
    expect(parses(aRecord(WWW))).toBe(true);
    expect(parses(cname(BLOG, WWW))).toBe(true);
    expect(parses({ ...aRecord(WWW), value: 'not-an-ip' })).toBe(false);
    expect(parses({ name: ZONE, type: 'NS', value: `ns2.${ZONE}`, ttl: RECORD_TTL })).toBe(false);
    expect(parses(soaOf(ZONE))).toBe(false);
  });
});

describe('the SOA of a zone', () => {
  it('every zone has one SOA at its apex with fixed, cited values', () => {
    const net = officeWithNames();
    for (const zone of net.actors.flatMap((actor) => (actor.kind === 'server' ? (actor.dns?.zones ?? []) : []))) {
      const soas = zone.records.filter((record) => record.type === 'SOA');
      expect(soas, zone.name).toHaveLength(1);
      expect(soas[0], zone.name).toEqual(soaOf(zone.name));
      expect(zone.records.map((record) => record.type).slice(0, 2), zone.name).toEqual(['NS', 'SOA']);
    }
    expect(soaOf(ZONE)).toEqual({
      name: ZONE,
      type: 'SOA',
      ttl: 300,
      value: { mname: 'ns1.lucia.example', rname: 'hostmaster.lucia.example', serial: 2026101101, refresh: 1800, retry: 900, expire: 1209600, minimum: 1200 },
    });
    expect(soaOf('noticias.example').value).toMatchObject({ mname: 'ns1.noticias.example', rname: 'hostmaster.noticias.example', serial: 2026101101, minimum: 1200 });
  });

  it('the fixed timers keep what RFC 1912 asks of them: expire above minimum and retry, retry below refresh', () => {
    const { refresh, retry, expire, minimum } = soaOf(ZONE).value;
    expect(expire).toBeGreaterThan(minimum);
    expect(expire).toBeGreaterThan(retry);
    expect(retry).toBeLessThan(refresh);
    expect(minimum).toBeGreaterThan(RECORD_TTL);
  });

  it('the schema asks for exactly one SOA, at the top of the zone', () => {
    const net = officeWithNames();
    const [zone] = zonesOf(net, authoritative.id);
    const without = withZones(net, authoritative.id, [{ ...zone, records: zone.records.filter((record) => record.type !== 'SOA') }]);
    expect(problems(without)).toEqual([`${authoritative.id}: the zone ${ZONE} has 0 SOA records and needs exactly one`]);
    const twice = withZones(net, authoritative.id, [{ ...zone, records: [...zone.records, soaOf(ZONE)] }]);
    expect(problems(twice)).toEqual([`${authoritative.id}: the zone ${ZONE} has 2 SOA records and needs exactly one`]);
    const below = withZones(net, authoritative.id, [{ ...zone, records: zone.records.map((record) => (record.type === 'SOA' ? { ...record, name: WWW } : record)) }]);
    expect(problems(below)).toEqual([`${authoritative.id}: the SOA of ${ZONE} is at ${WWW}, not at the top of the zone`]);
  });

  it('the SOA has the seven fields of RFC 1035 section 3.3.13', () => {
    expect(Object.keys(soaOf(ZONE).value)).toEqual(SOA_FIELDS);
    const net = officeWithNames();
    const [zone] = zonesOf(net, authoritative.id);
    for (const field of SOA_FIELDS) {
      const rest: Record<string, unknown> = { ...soaIn(zone).value };
      delete rest[field];
      const broken = { ...net, actors: net.actors.map((actor) => (actor.id === authoritative.id ? { ...actor, dns: { role: 'authoritative', zones: [{ name: ZONE, records: [{ ...soaIn(zone), value: rest }] }] } } : actor)) };
      expect(networkSchema.safeParse(broken).error?.issues.map((issue) => issue.path.at(-1)), field).toEqual([field]);
    }
    const huge = { ...soaOf(ZONE), value: { ...soaOf(ZONE).value, serial: 2 ** 32 } };
    expect(networkSchema.safeParse(withZones(net, authoritative.id, [{ ...zone, records: [zone.records[0], huge] }])).success).toBe(false);
  });

  it('the TTL of a negative answer is the smaller of the TTL of the SOA and its MINIMUM, whichever is smaller', () => {
    const base = soaOf(ZONE);
    const shorter = { ...base, ttl: 30 };
    const lower = { ...base, value: { ...base.value, minimum: 60 } };
    expect([negativeTtl(base), negativeTtl(shorter), negativeTtl(lower)]).toEqual([300, 30, 60]);
    expect(negativeTtl({ ...base, ttl: 60, value: { ...base.value, minimum: 60 } })).toBe(60);
  });
});

describe('the DNS rules of the network schema', () => {
  it('a resolver names, for each zone, an authoritative server that exists', () => {
    const net = officeWithNames();
    const toGhost = applyAction(net, { type: 'setDns', ownerId: resolver.id, dns: { role: 'resolver', upstreams: [{ zone: ZONE, serverId: 'ghost' }] } });
    expect(problems(toGhost)).toEqual([`${resolver.id}: its server for ${ZONE} is ghost, which is not an authoritative DNS server`]);
    const toResolver = applyAction(net, { type: 'setDns', ownerId: resolver.id, dns: { role: 'resolver', upstreams: [{ zone: ZONE, serverId: resolver.id }] } });
    expect(problems(toResolver)).toHaveLength(1);
    const toPlainServer = applyAction(net, { type: 'setDns', ownerId: resolver.id, dns: { role: 'resolver', upstreams: [{ zone: ZONE, serverId: OFFICE_FLOORS.server.id }] } });
    expect(problems(toPlainServer)).toHaveLength(1);
  });

  it('every record is within the zone that holds it', () => {
    const outside = withRecords(officeWithNames(), [aRecord('www.noticias.example')]);
    expect(problems(outside)).toEqual([`${authoritative.id}: www.noticias.example is not within the zone ${ZONE}`]);
    expect(problems(withRecords(officeWithNames(), [aRecord('www.notlucia.example')]))).toHaveLength(1);
  });

  it('the name servers count for the rule that no IP repeats', () => {
    const net = officeWithNames();
    const clash = applyAction(net, { type: 'addActor', actor: { id: 'copy', name: 'copy', kind: 'server', latencyMs: 1, ip: resolver.ip } });
    expect(problems(clash)).toEqual([`copy: ${resolver.ip} is already the IP of ${resolver.id}`]);
  });

  it('a VPC has no DNS servers and no DNS server setting: its names are the EC2 ones', () => {
    const vpc = lab03Net();
    expect(problems(vpc)).toEqual([]);
    const withServer = applyAction(vpc, { type: 'addActor', actor: { id: 'dns', name: 'dns', kind: 'server', latencyMs: 1, ip: '198.51.100.8', dns: { role: 'resolver' } } });
    expect(problems(withServer)).toEqual(['dns: a VPC has no DNS servers, its names are those of EC2']);
    const withSetting = applyAction(vpc, { type: 'setDnsServer', deviceId: 'servidor1', server: '198.51.100.8' });
    expect(problems(withSetting)).toEqual(['servidor1: a device in a VPC has no DNS server setting']);
  });
});
