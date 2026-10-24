import { EMPTY_CACHE, entriesOf } from '@/engine/dns/cache';
import type { DnsCacheEntry, Network, PacketSpec } from '@/engine/network/types';
import type { StoredCookie } from '@/engine/web/identity/browser-memory';
import { run, type Carried } from './simulate';
import type { Trace } from './trace';

/** One packet of a sequence and the second of the game clock it leaves at. */
export interface Send {
  packet: PacketSpec;
  at: number;
}

const emptyState = (): Carried => ({ nextSourcePort: {}, nat: [], dnsCache: EMPTY_CACHE });

interface Played {
  traces: Trace[];
  state: Carried;
}

/** Runs the sends in order, each from the state the previous one left at the second it leaves at, and returns their traces with the state after the last one. */
function play(net: Network, sends: readonly Send[]): Played {
  const traces: Trace[] = [];
  let state = emptyState();
  for (const { packet, at } of sends) {
    const step = run(net, packet, state, at);
    state = step.carried;
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

/** Returns the cookies the browser of the device with this id holds once the sends have run, in the order each was last set: the site it came from, its name and its value. The sends are replayed exactly as `simulateSequence` plays them, so nothing here is kept between calls; a device whose browser received none, and an id that is no device, give none. */
export function browserAfter(net: Network, sends: readonly Send[], deviceId: string): StoredCookie[] {
  return [...(play(net, sends).state.browser?.[deviceId] ?? [])];
}
