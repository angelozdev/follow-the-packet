import { describe, expect, it } from 'vitest';
import { applyAction } from '@/engine/network/actions';
import type { AnswerRecord, DnsCacheEntry, Network, ServerActor } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import { simulateSequence } from '@/engine/simulation/sequence';
import type { DnsTrace } from '@/engine/simulation/trace';
import { NAME_SERVERS, device, dig, officeWithNames, ping, withResolverCache } from '@/testing';
import { EMPTY_CACHE, cachedAnswer, entriesOf, remember } from './cache';
import { RECORD_TTL } from './records';

const { zone, downZone, site, resolver } = NAME_SERVERS;
const WWW = `www.${zone}`;
const BLOG = `blog.${zone}`;
const OLD_IP = '198.51.100.77';
const you = device('your-laptop');
const net = officeWithNames();

const entry = (name: string, value: string, expiresAt: number, type: DnsCacheEntry['type'] = 'A'): DnsCacheEntry => ({ name, type, value, expiresAt });
const address = (name: string, ttl: number, value: string = site): AnswerRecord => ({ name, type: 'A', value, ttl });
const alias = (name: string, value: string, ttl: number): AnswerRecord => ({ name, type: 'CNAME', value, ttl });
const resolverActor = (world: Network): ServerActor => world.actors.find((actor): actor is ServerActor => actor.id === resolver.id)!;

function digsAt(world: Network, name: string, seconds: number[]): DnsTrace[] {
  return simulateSequence(world, seconds.map((at) => ({ packet: dig(you, name), at }))).map((trace) => trace.dns!);
}

describe('the cache of a resolver in a sequence', () => {
  it('the resolver answers from its cache until the time to live runs out', () => {
    const answers = digsAt(net, WWW, [0, 100, 299, 300]);
    expect(answers.map(({ fromCache }) => fromCache)).toEqual([false, true, true, false]);
    expect(answers.map(({ ttlLeft }) => ttlLeft)).toEqual([undefined, 200, 1, undefined]);
    expect(answers[1]).toMatchObject({ status: 'NOERROR', answers: [address(WWW, 200)], viaDig: true });
    expect(answers[0].answers).toEqual([address(WWW, RECORD_TTL)]);
  });

  it('after the time to live the resolver asks again and caches the new answer', () => {
    const answers = digsAt(net, WWW, [0, 300, 450, 599, 600]);
    expect(answers.map(({ fromCache }) => fromCache)).toEqual([false, false, true, true, false]);
    expect(answers[1].answers).toEqual([address(WWW, RECORD_TTL)]);
    expect(answers.map(({ ttlLeft }) => ttlLeft)).toEqual([undefined, undefined, 150, 1, undefined]);
  });

  it('an initial cache entry runs out against the clock of the game', () => {
    const stale = withResolverCache(net, [entry(WWW, OLD_IP, 240)]);
    const answers = digsAt(stale, WWW, [0, 239, 240, 241]);
    expect(answers.map(({ answers: records }) => records[0].value)).toEqual([OLD_IP, OLD_IP, site, site]);
    expect(answers.map(({ fromCache }) => fromCache)).toEqual([true, true, false, true]);
    expect(answers.map(({ ttlLeft }) => ttlLeft)).toEqual([240, 1, undefined, 299]);
    expect(simulate(stale, dig(you, WWW)).dns).toMatchObject({ fromCache: true, ttlLeft: 240, answers: [address(WWW, 240, OLD_IP)] });
  });

  it('a cached alias answers with the whole chain and the seconds each record has left', () => {
    const answers = digsAt(net, BLOG, [0, 100]);
    expect(answers.map(({ fromCache }) => fromCache)).toEqual([false, true]);
    expect(answers[1]).toMatchObject({ answers: [alias(BLOG, WWW, 200), address(WWW, 200)], ttlLeft: 200 });
  });

  it('stores only an answer that holds an address: NXDOMAIN, SERVFAIL and a name with no address are asked again', () => {
    for (const name of [`noexiste.${zone}`, `www.${downZone}`, zone]) {
      expect(digsAt(net, name, [0, 1]).map(({ fromCache }) => fromCache), name).toEqual([false, false]);
    }
  });

  it('the cache is the resolver\'s: a question that does not reach the resolver gets no answer, however full its cache is', () => {
    const cached = withResolverCache(net, [entry(WWW, OLD_IP, 240)]);
    const hidden = applyAction(cached, { type: 'setListenAddress', ownerId: resolver.id, protocol: 'udp', port: 53, listen: 'loopback' });
    expect(simulate(cached, dig(you, WWW)).dns).toMatchObject({ status: 'NOERROR', fromCache: true });
    for (const packet of [dig(you, WWW), ping(you, WWW)]) expect(simulate(hidden, packet).dns).toMatchObject({ status: 'NO-RESOLVER', answers: [], fromCache: false });
  });

  it('the cache of a world is not changed by the sends that fill it', () => {
    const stale = withResolverCache(net, [entry(WWW, OLD_IP, 240)]);
    const before = structuredClone(resolverActor(stale));
    digsAt(stale, WWW, [0, 240, 300]);
    expect(resolverActor(stale)).toEqual(before);
  });
});

describe('cachedAnswer', () => {
  it('is alive up to the second before the entry expires and gone at that second', () => {
    const entries = [entry(WWW, site, 300)];
    expect(cachedAnswer(entries, WWW, 0)).toEqual({ answers: [address(WWW, 300)], ttlLeft: 300 });
    expect(cachedAnswer(entries, WWW, 299)?.ttlLeft).toBe(1);
    expect(cachedAnswer(entries, WWW, 300)).toBeUndefined();
    expect(cachedAnswer(entries, WWW, 301)).toBeUndefined();
  });

  it('answers an alias only while every link of its chain is alive, with the seconds of the link that expires first', () => {
    const entries = [entry(BLOG, WWW, 200, 'CNAME'), entry(WWW, site, 300)];
    expect(cachedAnswer(entries, BLOG, 100)).toEqual({ answers: [alias(BLOG, WWW, 100), address(WWW, 200)], ttlLeft: 100 });
    expect(cachedAnswer(entries, BLOG, 200)).toBeUndefined();
    expect(cachedAnswer([entry(BLOG, WWW, 300, 'CNAME'), entry(WWW, site, 200)], BLOG, 200)).toBeUndefined();
    expect(cachedAnswer(entries, WWW, 200)?.answers).toEqual([address(WWW, 100)]);
  });

  it('compares names without case and without a trailing dot, and gives every address a name holds', () => {
    const second = '198.51.100.51';
    const entries = [entry(WWW, site, 100), entry(WWW, second, 50)];
    expect(cachedAnswer(entries, `WWW.${zone}.`, 10)?.answers).toEqual([address(WWW, 90), address(WWW, 40, second)]);
    expect(cachedAnswer(entries, WWW, 10)?.ttlLeft).toBe(40);
  });

  it('gives up on a loop of aliases and on a name with no entry', () => {
    expect(cachedAnswer([entry(`a.${zone}`, `b.${zone}`, 100, 'CNAME'), entry(`b.${zone}`, `a.${zone}`, 100, 'CNAME')], `a.${zone}`, 0)).toBeUndefined();
    expect(cachedAnswer([], WWW, 0)).toBeUndefined();
  });
});

describe('remember', () => {
  it('stores each record until now plus its own TTL and replaces what was stored for that name and type', () => {
    const first = remember(EMPTY_CACHE, resolver.id, [alias(BLOG, WWW, 300), address(WWW, 100)], 10);
    expect(first[resolver.id]).toEqual([entry(BLOG, WWW, 310, 'CNAME'), entry(WWW, site, 110)]);
    const second = remember(first, resolver.id, [address(WWW, 300, OLD_IP)], 200);
    expect(second[resolver.id]).toEqual([entry(BLOG, WWW, 310, 'CNAME'), entry(WWW, OLD_IP, 500)]);
    expect(first[resolver.id]).toEqual([entry(BLOG, WWW, 310, 'CNAME'), entry(WWW, site, 110)]);
  });

  it('keeps a cache for each resolver, keeps nothing with a TTL of 0 and changes none of what it receives', () => {
    const other = remember(EMPTY_CACHE, 'other-resolver', [address(WWW, 300)], 0);
    const both = remember(other, resolver.id, [address(WWW, 0), address(BLOG, 20)], 5);
    expect(Object.keys(both)).toEqual(['other-resolver', resolver.id]);
    expect(both[resolver.id]).toEqual([entry(BLOG, site, 25)]);
    expect(other).toEqual({ 'other-resolver': [entry(WWW, site, 300)] });
    expect(EMPTY_CACHE).toEqual({});
  });
});

describe('entriesOf', () => {
  it('gives the entries of the world and of the sequence, and an entry of the sequence replaces the world\'s for its name and type', () => {
    const world = withResolverCache(net, [entry(WWW, OLD_IP, 240), entry(BLOG, WWW, 240, 'CNAME')]);
    const sequence = remember(EMPTY_CACHE, resolver.id, [address(WWW, 300)], 250);
    expect(entriesOf(resolverActor(world), sequence)).toEqual([entry(BLOG, WWW, 240, 'CNAME'), entry(WWW, site, 550)]);
    expect(entriesOf(resolverActor(world), EMPTY_CACHE)).toEqual([entry(WWW, OLD_IP, 240), entry(BLOG, WWW, 240, 'CNAME')]);
    expect(entriesOf(resolverActor(net), EMPTY_CACHE)).toEqual([]);
  });
});
