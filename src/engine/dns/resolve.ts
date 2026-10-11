import { EMPTY_CACHE, cachedAnswer, entriesOf, remember, type DnsCache } from './cache';
import { authoritativeServer, isWithin, negativeAnswerSoa, normalizeName, sameName, zoneHolding } from './records';
import type { AnswerRecord, Device, LookupMode, Network, PacketSpec, ServerActor, SoaRecord } from '@/engine/network/types';
import type { DnsStatus, DnsTrace, Trace } from '@/engine/simulation/trace';

/** The port a DNS server listens on, for UDP and for TCP: RFC 1035 §4.2 (read on 2026-10-11), "The Internet supports name server access using TCP on server port 53 (decimal) as well as datagram access using UDP on UDP port 53 (decimal)". The game sends every question over UDP. */
export const DNS_PORT = 53;

/** The most aliases a chain may follow before the resolver gives up: 8, so a chain of 8 aliases and an address resolves and one of 9 aliases is SERVFAIL. It is the game's bound, so a loop of aliases ends; it is not claimed to be the limit of any resolver. */
export const MAX_ALIAS_STEPS = 8;

export type { LookupMode };

/** What a lookup knows of the game: the second of the clock it happens at, and what the resolvers have remembered until then. The answer of a resolver is cached against that clock, never a real one. */
export interface Memory {
  now: number;
  cache: DnsCache;
}

const START_OF_GAME: Memory = { now: 0, cache: EMPTY_CACHE };

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
  cache: DnsCache;
}

interface Unanswered {
  answered: false;
  dns: DnsTrace;
  query?: Trace;
  notAResolver?: string;
}

/** What a lookup found: the answer of a resolver, with the resolver that gave it, the packet that carried the question and the cache after it, or the lack of one (`dns.status` is then `NO-RESOLVER`). When nobody answered, `notAResolver` is the id of the device, router or server that got the question and did not answer it as a resolver: it is no resolver and answered anyway, or it rejected the datagram with Port Unreachable because nothing listens on port 53 there or the service listens only on another address (a resolver that listens only on the loopback address is one of those); it is absent when the question never got to a host (a firewall dropped it, a router warned or nobody has the IP) and when nothing was sent. */
export type Resolution = Answered | Unanswered;

function upstreamFor(resolver: ServerActor, name: string): { zone: string; serverId: string } | undefined {
  return (resolver.dns?.upstreams ?? []).filter(({ zone }) => isWithin(name, zone)).sort((a, b) => b.zone.length - a.zone.length).at(0);
}

function asks(net: Network, resolver: ServerActor, name: string, chain: AnswerRecord[], visited: ReadonlySet<string>): Answer {
  const key = normalizeName(name);
  if (visited.has(key) || visited.size > MAX_ALIAS_STEPS) return { status: 'SERVFAIL', answers: [] };
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

function traceOf(name: string, mode: LookupMode, status: DnsStatus, answer: Pick<Answer, 'answers' | 'soa'> = { answers: [] }, ttlLeft?: number): DnsTrace {
  return { name, status, answers: answer.answers, ...(answer.soa && { soa: answer.soa }), fromCache: ttlLeft !== undefined, ...(ttlLeft !== undefined && { ttlLeft }), usedHostsFile: false, viaDig: mode === 'dig' };
}

function resolverReached(net: Network, query: Trace): ServerActor | undefined {
  const reached = net.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === query.destinationId);
  return query.outcome === 'replied' && reached?.dns?.role === 'resolver' ? reached : undefined;
}

/** The id of the host that got a question and did not answer it as a resolver, if the trace of the question says one did: it answered the datagram though it is no resolver, or it rejected it with Port Unreachable because nothing listens on port 53 there (or only on another address). A question that died on the way, or that a router or the sender itself warned about, reached no host. */
function nonResolverAt(query: Trace): string | undefined {
  const reachedAHost = query.outcome === 'replied' || query.notice?.kind === 'port-unreachable';
  return reachedAHost ? (query.destinationId ?? undefined) : undefined;
}

function unanswered(name: string, mode: LookupMode, query: Trace): Unanswered {
  const host = nonResolverAt(query);
  return { answered: false, dns: traceOf(name, mode, 'NO-RESOLVER'), query, ...(host && { notAResolver: host }) };
}

/** Returns what comes of a question once it has been sent: `query` is the trace of the datagram to port 53. If it reached a resolver and came back replied, the resolver answers the name, from its cache while the TTL of an entry has not run out at `memory.now` and otherwise by asking its authoritative servers (`answerFromUpstreams`), and the answer is cached at the resolver when it holds an address. NXDOMAIN, SERVFAIL and a name with no address are not cached (decided 13 of chapter 2). The cache is the resolver's, so a question that did not reach it gets no answer however full it is. The cache comes back in the resolution and the one received is never changed. */
export function answerFrom(net: Network, query: Trace, name: string, mode: LookupMode, memory: Memory = START_OF_GAME): Resolution {
  const resolver = resolverReached(net, query);
  if (!resolver) return unanswered(name, mode, query);
  const { now, cache } = memory;
  const hit = cachedAnswer(entriesOf(resolver, cache), name, now);
  if (hit) return { answered: true, dns: traceOf(name, mode, 'NOERROR', hit, hit.ttlLeft), resolverId: resolver.id, query, cache };
  const answer = answerFromUpstreams(net, resolver, name);
  const holdsAddress = answer.status === 'NOERROR' && answer.answers.some(({ type }) => type === 'A');
  return {
    answered: true,
    dns: traceOf(name, mode, answer.status, answer),
    resolverId: resolver.id,
    ...(answer.serverId && { serverId: answer.serverId }),
    query,
    cache: holdsAddress ? remember(cache, resolver.id, answer.answers, now) : cache,
  };
}

/** Looks a name up for a device: sends the question to the resolver of its network settings (`dnsServer`) as a UDP datagram to port 53, through whatever `send` carries it with (the rules, routes, NAT and services of the engine), and, when the resolver answers, takes the answer (`answerFrom`). A device with no `dnsServer` sends nothing and gets `NO-RESOLVER`; so does one whose question was not answered, because a firewall dropped it, no route led to the address, a router warned or the host there is no resolver. Then `query` is the trace of the packet that carried the question. The hosts file is not read here: it comes before the question and belongs to the `dns` stage. */
export function resolve(net: Network, device: Device, name: string, mode: LookupMode, send: SendPacket, memory: Memory = START_OF_GAME): Resolution {
  if (device.dnsServer === undefined) return { answered: false, dns: traceOf(name, mode, 'NO-RESOLVER') };
  const query = send(net, { from: { kind: 'device', id: device.id }, to: device.dnsServer, protocol: 'udp', port: DNS_PORT });
  return answerFrom(net, query, name, mode, memory);
}
