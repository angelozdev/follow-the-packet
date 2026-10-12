import { EMPTY_CACHE, entriesOf } from '@/engine/dns/cache';
import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { DnsCacheEntry, Network, PacketSpec } from '@/engine/network/types';
import { run, type Carried } from './simulate';
import type { Trace } from './trace';

/** One packet of a sequence and the second of the game clock it leaves at. */
export interface Send {
  packet: PacketSpec;
  at: number;
}

/** What a sequence carries from one send to the next: for each sender, by id, the ephemeral source port its next TCP or UDP packet leaves from, and what the pipeline hands on (the translation table of the NAT and the cache of the resolvers). */
interface SequenceState extends Carried {
  nextSourcePort: Readonly<Record<string, number>>;
}

interface Advance {
  state: SequenceState;
  trace: Trace;
}

const emptyState = (): SequenceState => ({ nextSourcePort: {}, nat: [], dnsCache: EMPTY_CACHE });

/** Gives a TCP or UDP packet that has no source port the next one of its sender and moves that sender on by one. A packet that brings its own port keeps it and leaves the counter as it was, like a port a program binds by hand; an ICMP message has no ports. Returns the packet to simulate and the state after it. */
function withSourcePort(state: SequenceState, packet: PacketSpec): { state: SequenceState; packet: PacketSpec } {
  if (packet.protocol === 'icmp' || packet.sourcePort !== undefined) return { state, packet };
  const sender = packet.from.id;
  const sourcePort = state.nextSourcePort[sender] ?? DEFAULT_SOURCE_PORT;
  return { state: { ...state, nextSourcePort: { ...state.nextSourcePort, [sender]: sourcePort + 1 } }, packet: { ...packet, sourcePort } };
}

/** Simulates one send of the sequence from the state the previous sends left, at the second it leaves at, and returns its trace with the state for the next one. */
function advance(net: Network, state: SequenceState, { packet, at }: Send): Advance {
  const next = withSourcePort(state, packet);
  const { trace, carried } = run(net, next.packet, next.state, at);
  return { state: { ...next.state, ...carried }, trace };
}

interface Played {
  traces: Trace[];
  state: SequenceState;
}

function play(net: Network, sends: readonly Send[]): Played {
  const traces: Trace[] = [];
  let state = emptyState();
  for (const send of sends) {
    const step = advance(net, state, send);
    state = step.state;
    traces.push(step.trace);
  }
  return { traces, state };
}

/** Simulates the sends in order and returns one trace per send, in the same order. What one send leaves behind (the source port of its sender, the rows of the NAT and what the resolvers remembered) is the input of the next, and each send is measured against its own `at`, so the same sends in the same network always give the same traces; a single `simulate` knows nothing of the sends before it. */
export function simulateSequence(net: Network, sends: readonly Send[]): Trace[] {
  return play(net, sends).traces;
}

/** One answer a resolver holds: the record and the seconds it has left. */
export interface CachedRow {
  name: string;
  type: DnsCacheEntry['type'];
  value: string;
  ttlLeft: number;
}

/** Returns what the resolver with this id holds once the sends have run, at second `now` of the game clock: its own `dns.cache` and what the sends stored, each with the seconds it has left (`expiresAt` less `now`), in the order the resolver holds them. An entry is alive while `now` is below its `expiresAt`, as in `cachedAnswer`, so one that ran out is not listed. Empty for an id that is no resolver. Nothing in it comes from the clock of the machine: `now` is the clock of the game, and the sends are replayed exactly as `simulateSequence` plays them. */
export function cacheAfter(net: Network, sends: readonly Send[], resolverId: string, now: number): CachedRow[] {
  const resolver = net.actors.find((actor) => actor.kind === 'server' && actor.id === resolverId && actor.dns?.role === 'resolver');
  if (resolver?.kind !== 'server') return [];
  return entriesOf(resolver, play(net, sends).state.dnsCache)
    .filter((entry) => now < entry.expiresAt)
    .map(({ name, type, value, expiresAt }) => ({ name, type, value, ttlLeft: expiresAt - now }));
}
