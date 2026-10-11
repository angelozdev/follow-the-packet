import { EMPTY_CACHE } from '@/engine/dns/cache';
import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { Network, PacketSpec } from '@/engine/network/types';
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

/** Simulates the sends in order and returns one trace per send, in the same order. What one send leaves behind (the source port of its sender, the rows of the NAT and what the resolvers remembered) is the input of the next, and each send is measured against its own `at`, so the same sends in the same network always give the same traces; a single `simulate` knows nothing of the sends before it. */
export function simulateSequence(net: Network, sends: readonly Send[]): Trace[] {
  const traces: Trace[] = [];
  let state = emptyState();
  for (const send of sends) {
    const step = advance(net, state, send);
    state = step.state;
    traces.push(step.trace);
  }
  return traces;
}
