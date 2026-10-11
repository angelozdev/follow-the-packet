import { authoritativeServer, isWithin, negativeAnswerSoa, normalizeName, sameName, zoneHolding } from './records';
import type { AnswerRecord, Device, Network, PacketSpec, ServerActor, SoaRecord } from '@/engine/network/types';
import type { DnsStatus, DnsTrace, Trace } from '@/engine/simulation/trace';

/** The port a DNS server listens on, for UDP and for TCP: RFC 1035 §4.2 (read on 2026-10-11), "The Internet supports name server access using TCP on server port 53 (decimal) as well as datagram access using UDP on UDP port 53 (decimal)". The game sends every question over UDP. */
export const DNS_PORT = 53;

/** How many names a chain of aliases may visit before the resolver gives up: 8. It is the game's bound, so a loop of aliases ends; it is not claimed to be the limit of any resolver. */
export const MAX_ALIAS_STEPS = 8;

/** How a name is looked up: `system` is what `ping` and `nc` do, and `dig` is the question itself. Both ask the resolver of the device; they differ in what is read first, which is the job of the hosts file. */
export type LookupMode = 'system' | 'dig';

/** Sends a packet through the network and returns its trace. The question to the resolver is a packet like any other, so whatever sends it decides how: the pipeline passes its own, and `resolve` knows nothing of the pipeline. */
export type SendPacket = (net: Network, packet: PacketSpec) => Trace;

/** What the authoritative servers say about a name when a resolver asks them. `serverId` is the one that gave the last word or the one that failed. */
interface Answer {
  status: Exclude<DnsStatus, 'NO-RESOLVER'>;
  answers: AnswerRecord[];
  soa?: SoaRecord;
  serverId?: string;
}

interface Answered {
  answered: true;
  dns: DnsTrace;
  resolverId: string;
  serverId?: string;
  query: Trace;
}

interface Unanswered {
  answered: false;
  dns: DnsTrace;
  query?: Trace;
}

/** What `resolve` found: the answer of a resolver, with the resolver that gave it and the packet that carried the question, or the lack of one (`dns.status` is then `NO-RESOLVER`). */
export type Resolution = Answered | Unanswered;

function upstreamFor(resolver: ServerActor, name: string): { zone: string; serverId: string } | undefined {
  return (resolver.dns?.upstreams ?? []).filter(({ zone }) => isWithin(name, zone)).sort((a, b) => b.zone.length - a.zone.length).at(0);
}

function asks(net: Network, resolver: ServerActor, name: string, chain: AnswerRecord[], visited: ReadonlySet<string>): Answer {
  const key = normalizeName(name);
  if (visited.has(key) || visited.size >= MAX_ALIAS_STEPS) return { status: 'SERVFAIL', answers: [] };
  const upstream = upstreamFor(resolver, name);
  if (!upstream) return { status: 'NXDOMAIN', answers: chain };
  const server = authoritativeServer(net, upstream.serverId);
  const zone = server && !server.dns?.failing ? zoneHolding(server.dns?.zones ?? [], name) : undefined;
  if (!server || !zone) return { status: 'SERVFAIL', answers: [], serverId: upstream.serverId };
  const here = zone.records.filter((record) => sameName(record.name, name));
  const alias = here.find((record): record is AnswerRecord => record.type === 'CNAME');
  if (alias) return asks(net, resolver, alias.value, [...chain, alias], new Set([...visited, key]));
  const addresses = here.filter((record): record is AnswerRecord => record.type === 'A');
  if (addresses.length > 0) return { status: 'NOERROR', answers: [...chain, ...addresses], serverId: server.id };
  const exists = zone.records.some((record) => isWithin(record.name, name));
  const soa = negativeAnswerSoa(zone);
  return { status: exists ? 'NOERROR' : 'NXDOMAIN', answers: chain, ...(soa && { soa }), serverId: server.id };
}

/** Returns what the authoritative servers of a resolver say about a name. The resolver knows the server of each zone by configuration (`dns.upstreams`) and asks the one whose zone is the longest that holds the name; the question and the answer are not packets of the map. A CNAME is followed, in the same zone or in another one, until an A record answers; the chain of aliases comes first in `answers`.
 *
 * - A server that is down (`dns.failing`), a server that holds no zone for the name and a loop of aliases give `SERVFAIL`.
 * - A name that no zone of the resolver holds gives `NXDOMAIN` with no SOA: the root and the top-level domains are not modelled.
 * - A name nobody holds a record for gives `NXDOMAIN`, with the SOA of its zone. A name that holds records but no address, or only has names below it, gives `NOERROR` with no address and the same SOA (RFC 2308 §2.2, no data; RFC 8020 §1, a name with names below it exists).
 * - An alias whose target does not exist gives `NXDOMAIN` with the alias in `answers` (RFC 2308 §2.1). */
function answerFromUpstreams(net: Network, resolver: ServerActor, name: string): Answer {
  return asks(net, resolver, name, [], new Set());
}

function traceOf(name: string, mode: LookupMode, status: DnsStatus, answer: Pick<Answer, 'answers' | 'soa'> = { answers: [] }): DnsTrace {
  return { name, status, answers: answer.answers, ...(answer.soa && { soa: answer.soa }), fromCache: false, usedHostsFile: false, viaDig: mode === 'dig' };
}

function resolverReached(net: Network, query: Trace): ServerActor | undefined {
  const reached = net.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === query.destinationId);
  return query.outcome === 'replied' && reached?.dns?.role === 'resolver' ? reached : undefined;
}

/** Looks a name up for a device: sends the question to the resolver of its network settings (`dnsServer`) as a UDP datagram to port 53, through whatever `send` carries it with (the rules, routes, NAT and services of the engine), and, when the resolver answers, asks it for the name (`answerFromUpstreams`). A device with no `dnsServer` sends nothing and gets `NO-RESOLVER`; so does one whose question was not answered, because a firewall dropped it, no route led to the address, a router warned or the host there has no DNS service. Then `query` is the trace of the packet that carried the question. */
export function resolve(net: Network, device: Device, name: string, mode: LookupMode, send: SendPacket): Resolution {
  if (device.dnsServer === undefined) return { answered: false, dns: traceOf(name, mode, 'NO-RESOLVER') };
  const query = send(net, { from: { kind: 'device', id: device.id }, to: device.dnsServer, protocol: 'udp', port: DNS_PORT });
  const resolver = resolverReached(net, query);
  if (!resolver) return { answered: false, dns: traceOf(name, mode, 'NO-RESOLVER'), query };
  const answer = answerFromUpstreams(net, resolver, name);
  return { answered: true, dns: traceOf(name, mode, answer.status, answer), resolverId: resolver.id, ...(answer.serverId && { serverId: answer.serverId }), query };
}
