import type { AnswerRecord, DnsRecord, Network, ServerActor, SoaRecord, Zone } from '@/engine/network/types';

/** The time to live of every record of the game, in seconds: 300 (decided 25 of chapter 2). It is a number of the game, not a recommendation: real zones use others. */
export const RECORD_TTL = 300;

/** The label of the name server every zone names, so a zone `lucia.example` names `ns1.lucia.example`. The example zone of RFC 2308 §10 (read on 2026-10-11) names its server `NS1.XX.EXAMPLE.`; the word is the game's choice. */
const NAME_SERVER_LABEL = 'ns1';

/** The label of the mailbox of the person responsible for every zone. RFC 1912 §2.2 (read on 2026-10-11) prefers "the generic name `hostmaster`", with a mail alias behind it, and says the `@` of the address "must be replaced by a `.'": `hostmaster@lucia.example` is written `hostmaster.lucia.example` (RNAME, RFC 1035 §3.3.13). The mailbox is fictitious. */
const RESPONSIBLE_LABEL = 'hostmaster';

/** SERIAL, the version of the zone: 2026101101. RFC 1912 §2.2 (read on 2026-10-11) recommends the syntax YYYYMMDDnn, year, month, day and a revision number of two digits. The date, 2026-10-11, and the revision 01 are numbers of the game. */
const SOA_SERIAL = 2026101101;

/** REFRESH, how often a secondary asks whether the zone changed: 1800 seconds, 30 minutes, the value of the example zone of RFC 2308 §10 (read on 2026-10-11) and inside the 20 minutes to 2 hours that RFC 1912 §2.2 suggests. The game has no secondary, so nothing uses it. */
const SOA_REFRESH = 1800;

/** RETRY, how long a secondary waits after a failed refresh: 900 seconds, 15 minutes, the value of the example zone of RFC 2308 §10 (read on 2026-10-11). RFC 1912 §2.2 says it is "typically some fraction of the refresh interval": here, a half. */
const SOA_RETRY = 900;

/** EXPIRE, how long a secondary keeps answering without reaching the primary: 1209600 seconds, 2 weeks, the low end of the "2-4 weeks" that RFC 1912 §2.2 (Informational, read on 2026-10-11) suggests. RFC 1912 §2.2 says it "must be greater than the minimum and retry intervals", and it is. */
const SOA_EXPIRE = 1209600;

/** MINIMUM: 1200 seconds, 20 minutes, the value of the example zone of RFC 2308 §10 (read on 2026-10-11). Since RFC 2308 §4 it is the TTL of a negative answer: its old meaning in RFC 1035 §3.3.13, a lower bound on the TTL of every record of the zone, "has never in practice been used and is hereby deprecated". The game does not apply the old meaning, so MINIMUM is greater than `RECORD_TTL` on purpose and no record is raised to it. */
const SOA_MINIMUM = 1200;

/** Returns the name the way two names are compared: DNS names are not case sensitive, and a trailing dot only marks the root. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\.$/, '');
}

export function sameName(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

/** True when the name is the zone itself or a name below it: `www.lucia.example` is within `lucia.example`, and `notlucia.example` is not. */
export function isWithin(name: string, zoneName: string): boolean {
  const [child, zone] = [normalizeName(name), normalizeName(zoneName)];
  return child === zone || child.endsWith(`.${zone}`);
}

/** Returns the zone that holds the name: the one with the longest name that the name is within. */
export function zoneHolding(zones: readonly Zone[], name: string): Zone | undefined {
  return zones.filter((zone) => isWithin(name, zone.name)).sort((a, b) => b.name.length - a.name.length).at(0);
}

/** Returns the SOA record of a zone: the seven fields of RFC 1035 §3.3.13, MNAME, RNAME, SERIAL, REFRESH, RETRY, EXPIRE and MINIMUM, with the fixed values above. */
export function soaOf(zoneName: string): SoaRecord {
  return {
    name: zoneName,
    type: 'SOA',
    ttl: RECORD_TTL,
    value: {
      mname: `${NAME_SERVER_LABEL}.${zoneName}`,
      rname: `${RESPONSIBLE_LABEL}.${zoneName}`,
      serial: SOA_SERIAL,
      refresh: SOA_REFRESH,
      retry: SOA_RETRY,
      expire: SOA_EXPIRE,
      minimum: SOA_MINIMUM,
    },
  };
}

/** Returns the NS record of a zone: the name server its SOA names. The game gives that name no address record, since the delegation from the parent zone is not modelled. */
export function nsOf(zoneName: string): DnsRecord {
  return { name: zoneName, type: 'NS', ttl: RECORD_TTL, value: `${NAME_SERVER_LABEL}.${zoneName}` };
}

/** Builds a zone: its own NS and SOA at the apex, which the player never edits, and then the records it holds. */
export function zoneOf(name: string, records: readonly AnswerRecord[]): Zone {
  return { name, records: [nsOf(name), soaOf(name), ...records] };
}

/** The TTL of a negative answer, the smaller of the TTL of the SOA record and its MINIMUM field (RFC 2308 §3, "The TTL of this record is set from the minimum of the MINIMUM field of the SOA record and the TTL of the SOA itself"; §5 repeats it; read on 2026-10-11). */
export function negativeTtl(soa: SoaRecord): number {
  return Math.min(soa.ttl, soa.value.minimum);
}

/** Returns the SOA record as an authoritative server puts it in the authority section of a negative answer: the zone's SOA with the TTL of the negative answer, and every field of its value as the zone has it. Undefined when the zone has no SOA. */
export function negativeAnswerSoa(zone: Zone): SoaRecord | undefined {
  const soa = zone.records.find((record): record is SoaRecord => record.type === 'SOA');
  return soa && { ...soa, ttl: negativeTtl(soa) };
}

/** True when the name holds a CNAME and any other record, or a second CNAME. RFC 1034 §3.6.2 (read on 2026-10-11): "If a CNAME RR is present at a node, no other data should be present"; RFC 2181 §10.1 makes it exact: a label has one CNAME, or one or more records and none of them a CNAME. A zone is the same rule for every name in it, and the apex always has NS and SOA. */
export function holdsAliasAndMore(records: readonly DnsRecord[], name: string): boolean {
  const here = records.filter((record) => sameName(record.name, name));
  return here.length > 1 && here.some((record) => record.type === 'CNAME');
}

export const RECORD_PROBLEMS = ['no-zone', 'already-there', 'name-is-an-alias', 'cname-with-other-records', 'cname-at-apex'] as const;

/** Why an authoritative server does not take a record: it holds no zone for the name, it already has that very record, the name is an alias and takes nothing else, or the record is a CNAME for a name that has other records, or for the apex of the zone, which has its own NS and SOA. */
export type RecordProblem = (typeof RECORD_PROBLEMS)[number];

/** Returns the server of the internet with that id when it is an authoritative DNS server. */
export function authoritativeServer(net: Network, id: string): ServerActor | undefined {
  const server = net.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === id);
  return server?.dns?.role === 'authoritative' ? server : undefined;
}

/** Returns the zone that an authoritative server holds for a name, or undefined when the server is not one or holds none. */
export function zoneHeldBy(net: Network, serverId: string, name: string): Zone | undefined {
  return zoneHolding(authoritativeServer(net, serverId)?.dns?.zones ?? [], name);
}

function sameRecord(a: AnswerRecord, b: DnsRecord): boolean {
  return sameName(a.name, b.name) && a.type === b.type && typeof b.value === 'string' && normalizeName(a.value) === normalizeName(b.value);
}

/** Says why an authoritative server does not take a record, or undefined when it does. The CNAME rule is the same one the network schema applies to every zone, so a record that raises no problem leaves the zone valid. */
export function recordProblem(net: Network, serverId: string, record: AnswerRecord): RecordProblem | undefined {
  const zone = zoneHeldBy(net, serverId, record.name);
  if (!zone) return 'no-zone';
  if (zone.records.some((held) => sameRecord(record, held))) return 'already-there';
  if (!holdsAliasAndMore([...zone.records, record], record.name)) return undefined;
  if (record.type !== 'CNAME') return 'name-is-an-alias';
  return sameName(record.name, zone.name) ? 'cname-at-apex' : 'cname-with-other-records';
}
