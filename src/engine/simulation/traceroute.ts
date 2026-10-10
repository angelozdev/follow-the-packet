import { TTL_MAX } from '@/engine/network/schema';
import type { Endpoint, Network } from '@/engine/network/types';
import { simulate } from './simulate';
import type { NoticeKind, Outcome, Trace } from './trace';

const FIRST_TTL = 1;
const ECHO_REQUEST = 8;

/** The most hops the game's traceroute probes. A number of the game, not the default of any system. */
export const TRACEROUTE_MAX_HOPS = 8;

export type UnreachableKind = 'host' | 'net';

/** One probe: the hop number (the TTL it left with), the IP that answered and the round trip time of that answer, and whether it came from the destination. A hop nobody answered has neither `ip` nor `rttMs`. When the answer was a Destination Host Unreachable or a Destination Network Unreachable, `unreachable` says which: it is the last line. A warning the sender generates itself has its own IP and no `rttMs`. */
export interface TracerouteLine {
  hop: number;
  ip?: string;
  rttMs?: number;
  unreachable?: UnreachableKind;
  reached: boolean;
}

/** What traceroute returns: one line per probe, and the trace of the probe that never left the sender when none could (then there are no lines). */
export interface TracerouteResult {
  lines: TracerouteLine[];
  localError?: Trace;
}

type Answer = 'destination' | 'warning' | 'silence' | 'sender';

const ANSWER_OF: Record<Outcome, Answer> = {
  replied: 'destination',
  'ttl-exceeded': 'warning',
  unreachable: 'warning',
  timeout: 'silence',
  refused: 'silence',
  'arrived-no-reply': 'silence',
  lost: 'silence',
  'invalid-address': 'sender',
  unresolved: 'sender',
  'no-route': 'sender',
};

const UNREACHABLE_OF: Partial<Record<NoticeKind, UnreachableKind>> = {
  'host-unreachable': 'host',
  'net-unreachable': 'net',
};

function answeringIp(trace: Trace): string | undefined {
  switch (ANSWER_OF[trace.outcome]) {
    case 'destination':
      return trace.resolvedIp ?? undefined;
    case 'warning':
      return trace.notice?.fromIp;
    default:
      return undefined;
  }
}

function lineOf(hop: number, trace: Trace): TracerouteLine {
  const ip = answeringIp(trace);
  const unreachable = trace.notice && UNREACHABLE_OF[trace.notice.kind];
  const answer = ip !== undefined && { ip, ...(trace.rttMs !== undefined && { rttMs: trace.rttMs }), ...(unreachable && { unreachable }) };
  return { hop, ...answer, reached: ANSWER_OF[trace.outcome] === 'destination' };
}

/** Sends one Echo Request per TTL, from 1 up (as `tracert` does and `traceroute -I` on Linux), and lists who answered each one: the router that discarded it with Time Exceeded, or the destination when the probe got there. It ends at the destination, at a Destination Host or Network Unreachable (more TTL cannot change it, and traceroute gives up there), or at `maxHops`, whichever comes first. A probe nobody answered is a line with no IP. A sender that cannot send the packet at all (an invalid address, a name nobody resolves, no cable or no default gateway) has no lines: `localError` is the trace of that probe, the same one a ping would give. */
export function traceroute(net: Network, from: Endpoint, to: string, maxHops: number): TracerouteResult {
  if (!Number.isInteger(maxHops) || maxHops < FIRST_TTL || maxHops > TTL_MAX) {
    throw new RangeError(`maxHops must be an integer from ${FIRST_TTL} to ${TTL_MAX}`);
  }
  const lines: TracerouteLine[] = [];
  for (let ttl = FIRST_TTL; ttl <= maxHops; ttl += 1) {
    const trace = simulate(net, { from, to, protocol: 'icmp', icmpType: ECHO_REQUEST, ttl });
    if (ANSWER_OF[trace.outcome] === 'sender') return { lines, localError: trace };
    const line = lineOf(ttl, trace);
    lines.push(line);
    if (line.reached || line.unreachable) break;
  }
  return { lines };
}
