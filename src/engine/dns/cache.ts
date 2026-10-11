import { normalizeName, sameName } from './records';
import type { AnswerRecord, DnsCacheEntry, ServerActor } from '@/engine/network/types';

/** What the resolvers have remembered since a sequence began, by the id of the resolver: the entries that its answers put there. A resolver also starts with the entries of its `dns.cache`, which are data of the world, not of the sequence. The clock is the one of the game, in seconds, and the cache never reads another. */
export type DnsCache = Readonly<Record<string, readonly DnsCacheEntry[]>>;

export const EMPTY_CACHE: DnsCache = {};

/** An answer a resolver gave from its cache: the records with the seconds each one has left, and the seconds the whole answer has left, which are those of the record that expires first. */
export interface CachedAnswer {
  answers: AnswerRecord[];
  ttlLeft: number;
}

function sameKey(a: Pick<DnsCacheEntry, 'name' | 'type'>, b: Pick<DnsCacheEntry, 'name' | 'type'>): boolean {
  return a.type === b.type && sameName(a.name, b.name);
}

/** Returns the entries a resolver can answer from: its own `dns.cache` and what the sequence put there. An entry the sequence stored for a name and type replaces the entries of the world for that name and type, since it is the newer answer. */
export function entriesOf(resolver: ServerActor, cache: DnsCache): DnsCacheEntry[] {
  const stored = cache[resolver.id] ?? [];
  return [...(resolver.dns?.cache ?? []).filter((entry) => !stored.some((newer) => sameKey(newer, entry))), ...stored];
}

function recordOf(entry: DnsCacheEntry, now: number): AnswerRecord {
  const { name, value } = entry;
  const ttl = entry.expiresAt - now;
  return entry.type === 'A' ? { name, type: 'A', value, ttl } : { name, type: 'CNAME', value, ttl };
}

function follow(entries: readonly DnsCacheEntry[], name: string, now: number, chain: AnswerRecord[], visited: ReadonlySet<string>): CachedAnswer | undefined {
  const key = normalizeName(name);
  if (visited.has(key)) return undefined;
  const alive = entries.filter((entry) => sameName(entry.name, name) && now < entry.expiresAt);
  const alias = alive.find((entry) => entry.type === 'CNAME');
  if (alias) return follow(entries, alias.value, now, [...chain, recordOf(alias, now)], new Set([...visited, key]));
  const addresses = alive.filter((entry) => entry.type === 'A').map((entry) => recordOf(entry, now));
  if (addresses.length === 0) return undefined;
  const answers = [...chain, ...addresses];
  return { answers, ttlLeft: Math.min(...answers.map(({ ttl }) => ttl)) };
}

/** Returns what a resolver can answer for a name from its entries at second `now`, or undefined when it has to ask. An entry is alive while `now` is below its `expiresAt` and out of it at that very second, so a record stored at `now` with a TTL of 300 answers until second 299 and not at second 300. A name is answered only when every link of its chain of aliases down to an address is alive; if one link ran out, the resolver asks for the whole name again. The records of the answer carry the seconds they have left, as the answer of a real resolver does. */
export function cachedAnswer(entries: readonly DnsCacheEntry[], name: string, now: number): CachedAnswer | undefined {
  return follow(entries, name, now, [], new Set());
}

/** Returns the cache after a resolver stored the records of an answer at second `now`: each expires at `now` plus its TTL, and it replaces whatever the resolver stored before for that name and type. A record with a TTL of 0 is not kept. */
export function remember(cache: DnsCache, resolverId: string, answers: readonly AnswerRecord[], now: number): DnsCache {
  const stored: DnsCacheEntry[] = answers.filter(({ ttl }) => ttl > 0).map(({ name, type, value, ttl }) => ({ name, type, value, expiresAt: now + ttl }));
  const kept = (cache[resolverId] ?? []).filter((entry) => !stored.some((newer) => sameKey(newer, entry)));
  return { ...cache, [resolverId]: [...kept, ...stored] };
}
