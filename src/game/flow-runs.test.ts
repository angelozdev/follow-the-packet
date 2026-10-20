import { describe, expect, it } from 'vitest';
import { ROUTE_DEFAULT, applyAction, simulateSequence, type Network } from '@/engine';
import { packetFromChips, startWorld } from '@/levels';
import { stampOf, type TermId } from '@/copy';
import { EVERY_TERM, NAME_SERVERS, OFFICE_FLOORS, namesSendIncident, officeNet, sendIncident, withDevice } from '@/testing';
import { drawnSends, hideStopsOutOfSight, lastOfEach, offersSend, sendPacket, sendSequence, type Dispatch, type SentPacket } from './flow-runs';
import { PIECE_ID } from './view/piece-id';

const FIRST_PORT = 51514;
const FIRST_PUBLIC_PORT = 40001;
const NAMES = namesSendIncident();
const WORLD = startWorld([NAMES], NAMES.id);
const { resolver } = NAME_SERVERS;
const { uplink } = OFFICE_FLOORS.officeRouter;

const dispatch = (messageId: string, toId: string, send: number, at: number): Dispatch => ({ move: { type: 'sendPacket', fromId: 'you', toId, messageId }, send, at });

describe('the sends of the player', () => {
  it('the sends are simulated in sequence so the translation table and the cache carry over', () => {
    const sends = [dispatch('dig', 'www', 1, 0), dispatch('dig', 'www', 2, 60), dispatch('nc', 'lucia', 3, 61)];
    const runs = sendSequence(WORLD, NAMES, sends, EVERY_TERM);
    expect(runs.map((run) => run.trace.dns?.fromCache)).toEqual([false, true, undefined]);
    expect(runs[1].trace.dns?.ttlLeft).toBe(240);
    expect(runs.map((run) => run.trace.header?.request.sourcePort)).toEqual([FIRST_PORT, FIRST_PORT + 1, FIRST_PORT + 2]);
    expect(runs.slice(0, 2).map((run) => run.trace.translation?.outside)).toEqual([{ ip: uplink, port: FIRST_PUBLIC_PORT }, { ip: uplink, port: FIRST_PUBLIC_PORT + 1 }]);
    expect(runs[0].trace.header?.request.destination).toBe(resolver.ip);
    const packets = sends.map(({ move, at }) => ({ packet: packetFromChips(NAMES, move)!, at }));
    expect(runs.map((run) => run.trace)).toEqual(simulateSequence(WORLD, packets));
  });

  it('a send alone starts from nothing, and the same sends always give the same runs', () => {
    const second = dispatch('dig', 'www', 2, 60);
    const alone = sendSequence(WORLD, NAMES, [second], EVERY_TERM);
    expect(alone[0].trace.dns?.fromCache).toBe(false);
    expect(alone[0].trace.header?.request.sourcePort).toBe(FIRST_PORT);
    const sends = [dispatch('dig', 'www', 1, 0), second];
    expect(sendSequence(WORLD, NAMES, sends, EVERY_TERM)).toEqual(sendSequence(WORLD, NAMES, sends, EVERY_TERM));
  });

  it('each run keeps the number of its send, the second it left at and the chips that made it', () => {
    const [first, second] = sendSequence(WORLD, NAMES, [dispatch('dig', 'www', 4, 10), dispatch('ping', 'lucia', 7, 90)], EVERY_TERM);
    expect(first).toMatchObject({ id: 'sent-you-www-dig', fromId: 'you', toId: 'www', messageId: 'dig', send: 4, at: 10 });
    expect(second).toMatchObject({ id: 'sent-you-lucia-ping', send: 7, at: 90 });
  });

  it('a traceroute is a run of its own with its probes, and takes no source port or row of the sequence', () => {
    const routed = { ...NAMES, send: { ...NAMES.send, message: [...NAMES.send.message, { id: 'trace', label: '{{traceroute}}', command: 'traceroute' as const, icmpType: 8 as const }] } };
    const trace = dispatch('trace', 'lucia', 2, 5);
    const [dig, route, nc] = sendSequence(WORLD, routed, [dispatch('dig', 'www', 1, 0), trace, dispatch('nc', 'lucia', 3, 6)], EVERY_TERM);
    expect(route.route?.lines.length).toBeGreaterThan(0);
    expect([dig, nc].map((run) => run.trace.header?.request.sourcePort)).toEqual([FIRST_PORT, FIRST_PORT + 1]);
    expect(route).toMatchObject({ send: 2, at: 5 });
  });

  it('a send of chips the incident does not offer is left out of the sequence', () => {
    const ghost: Dispatch = { move: { type: 'sendPacket', fromId: 'you', toId: 'ghost', messageId: 'dig' }, send: 2, at: 0 };
    expect(offersSend(NAMES, ghost.move)).toBe(false);
    expect(offersSend(NAMES, dispatch('dig', 'www', 1, 0).move)).toBe(true);
    expect(sendSequence(WORLD, NAMES, [dispatch('dig', 'www', 1, 0), ghost], EVERY_TERM)).toHaveLength(1);
  });

  it('keeps sendPacket as the run of one send on its own', () => {
    const sending = sendIncident();
    const run = sendPacket(officeNet(), sending, { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' }, 3, EVERY_TERM);
    expect(run).toMatchObject({ send: 3, at: 0, replied: true });
    expect(sendPacket(officeNet(), sending, { type: 'sendPacket', fromId: 'you', toId: 'ghost', messageId: 'ping' }, 1, EVERY_TERM)).toBeNull();
  });

  it('keeps the last run of each combination, in the place of its first send', () => {
    const runs = sendSequence(WORLD, NAMES, [dispatch('dig', 'www', 1, 0), dispatch('ping', 'lucia', 2, 1), dispatch('dig', 'www', 3, 2)], EVERY_TERM);
    expect(lastOfEach(runs).map((run) => [run.id, run.send])).toEqual([['sent-you-www-dig', 3], ['sent-you-lucia-ping', 2]]);
    expect(lastOfEach([])).toEqual([]);
  });
});

describe('the warning a run shows', () => {
  const withoutRoutes = applyAction(WORLD, { type: 'removeRoute', routerId: OFFICE_FLOORS.officeRouter.id, to: ROUTE_DEFAULT });
  const toServer = (known: ReadonlySet<TermId>) => sendPacket(withoutRoutes, NAMES, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' }, 1, known);

  it('a router with no route is named Destination Net Unreachable by the run once that term is known, and by no term before', () => {
    expect(toServer(EVERY_TERM)?.warning).toEqual({ term: 'net-unreachable', by: 'router' });
    expect(toServer(new Set([...EVERY_TERM].filter((term) => term !== 'net-unreachable')))?.warning).toEqual({ term: null, by: 'router' });
    expect(toServer(new Set([...EVERY_TERM].filter((term) => term !== 'net-unreachable' && term !== 'host-unreachable')))?.warning).toBeNull();
  });
});

describe('the labels a run carries on the map', () => {
  const sent = (messageId: string, toId: string, known: ReadonlySet<TermId> = EVERY_TERM) => sendPacket(WORLD, NAMES, { type: 'sendPacket', fromId: 'you', toId, messageId }, 1, known)!;
  const without = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));

  it('a packet with ports is labelled with its protocol and ports', () => {
    expect(sent('nc', 'lucia').ports).toEqual({ legs: [{ request: '{{tcp}} 51514 → 3000', reply: '{{tcp}} 3000 → 51514' }] });
    expect(sent('nc', 'lucia', without('tcp')).ports?.legs[0].request).toBe('{{packet}} al {{port|puerto}} 3000');
  });

  it('a packet the NAT translates carries a second label with the public source port, and says which router changes it', () => {
    expect(sent('dig', 'www').ports).toEqual({
      legs: [
        { request: '{{udp}} 51514 → 53', reply: '{{udp}} 53 → 51514' },
        { request: '{{udp}} 40001 → 53', reply: '{{udp}} 53 → 40001' },
      ],
      changesAt: OFFICE_FLOORS.officeRouter.id,
    });
  });

  it('a packet with no ports carries no labels, so a ping and the packets of a VPC look as they did', () => {
    expect(sent('ping', 'lucia')).not.toHaveProperty('ports');
    expect(sent('ping', 'server')).not.toHaveProperty('ports');
  });
});

describe('a datagram that got a Port Unreachable', () => {
  it('is a run that reached the host and got a warning from it, which the map draws as a warning and not as an arrival', () => {
    const toPrinter = withDevice(WORLD, 'your-laptop', { dnsServer: OFFICE_FLOORS.floor1.printer });
    const run = sendPacket(toPrinter, NAMES, { type: 'sendPacket', fromId: 'you', toId: 'www', messageId: 'dig' }, 1, EVERY_TERM)!;
    expect([run.trace.outcome, run.reached, run.warning]).toEqual(['unreachable', true, { term: 'port-unreachable', by: 'host' }]);
  });
});

describe('the question of a send by name', () => {
  const { provider, officeRouter, server } = OFFICE_FLOORS;
  const ROUTED = { ...NAMES, send: { ...NAMES.send, message: [...NAMES.send.message, { id: 'trace', label: '{{traceroute}}', command: 'traceroute' as const, icmpType: 8 as const }] } };
  const run = (toId: string, messageId: string, world: Network = WORLD, known: ReadonlySet<TermId> = EVERY_TERM): SentPacket => sendSequence(world, NAMES, [dispatch(messageId, toId, 1, 0)], known)[0];
  const closedOut = applyAction(WORLD, { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } });

  it('a send by name has a question run with its own id and stamp, and the run of the packet keeps its trace', () => {
    const asked = run('www', 'ping');
    const { question } = asked;
    expect(question).toMatchObject({
      id: 'sent-you-www-ping-question',
      pieceId: PIECE_ID.packet('sent-you-www-ping-question'),
      packet: { to: resolver.ip, protocol: 'udp', port: 53, sourcePort: FIRST_PORT },
      replied: true,
      reached: true,
      blocked: false,
      hiddenStop: false,
      warning: null,
      intruder: false,
      by: [resolver.id],
    });
    expect(stampOf(question!)).toBe('arrived');
    expect(asked.id).toBe('sent-you-www-ping');
    expect(asked.trace.question?.trace).toBe(question?.trace);
    expect(asked.trace).toEqual(simulateSequence(WORLD, [{ packet: packetFromChips(NAMES, dispatch('ping', 'www', 1, 0).move)!, at: 0 }])[0]);
  });

  it('the question run is labelled with its ports, the private source port before the router and the public one after it', () => {
    expect(run('www', 'ping').question?.ports).toEqual({
      legs: [
        { request: '{{udp}} 51514 → 53', reply: '{{udp}} 53 → 51514' },
        { request: '{{udp}} 40001 → 53', reply: '{{udp}} 53 → 40001' },
      ],
      changesAt: officeRouter.id,
    });
    expect(run('www', 'nc').ports?.legs.map(({ request }) => request)).toEqual(['{{tcp}} 51515 → 3000', '{{tcp}} 40002 → 3000']);
  });

  it('a send addressed by IP has no question run', () => {
    for (const [toId, messageId] of [['lucia', 'ping'], ['lucia', 'nc'], ['server', 'ping'], ['www', 'dig']] as const) expect(run(toId, messageId)).not.toHaveProperty('question');
  });

  it('a firewall the player does not know stops the question without blocking it', () => {
    const known = run('www', 'nc', closedOut).question!;
    expect(known).toMatchObject({ blocked: true, hiddenStop: false, replied: false, reached: false });
    expect(stampOf(known)).toBe('blocked');
    const without = new Set([...EVERY_TERM].filter((term) => term !== 'firewall'));
    const hidden = run('www', 'nc', closedOut, without);
    expect(hidden.question).toMatchObject({ blocked: false, hiddenStop: true });
    expect(stampOf(hidden.question!)).toBe('lost');
    expect(hidden.trace.steps.map((step) => step.reason.code)).toEqual(['dns-resolver-silent']);
    expect(hidden).toMatchObject({ blocked: false, hiddenStop: false });
  });

  it('a router out of sight that drops the question in silence hides its stop as it does for any packet', () => {
    const silent: Network = { ...WORLD, routers: (WORLD.routers ?? []).map((router) => (router.id === provider.id ? { ...router, sendsUnreachable: false, routes: router.routes.filter(({ to }) => to !== server.range) } : router)) };
    const waiting = { ...ROUTED, revealRoutersByTraceroute: true };
    const runs = sendSequence(silent, waiting, [dispatch('ping', 'www', 1, 0)], EVERY_TERM);
    expect(runs[0].question).toMatchObject({ replied: false, hiddenStop: false });
    expect(runs[0].question?.trace.notice).toBeUndefined();
    const hidden = hideStopsOutOfSight(waiting, runs);
    expect(hidden[0].question?.hiddenStop).toBe(true);
    expect(hidden[0].hiddenStop).toBe(false);
    expect(hideStopsOutOfSight(waiting, hidden)).toBe(hidden);
    expect(hideStopsOutOfSight(NAMES, runs)).toBe(runs);
  });

  it('drawnSends puts the question of each send before the packet that asked and makes the packet wait for it', () => {
    const sends = [dispatch('ping', 'www', 1, 0), dispatch('ping', 'lucia', 2, 1), dispatch('nc', 'www', 3, 2)];
    const drawn = drawnSends(lastOfEach(sendSequence(WORLD, NAMES, sends, EVERY_TERM)));
    expect(drawn.map((each) => each.id)).toEqual(['sent-you-www-ping-question', 'sent-you-www-ping', 'sent-you-lucia-ping', 'sent-you-www-nc-question', 'sent-you-www-nc']);
    expect(drawn.map((each) => each.after)).toEqual([undefined, 'sent-you-www-ping-question', undefined, undefined, 'sent-you-www-nc-question']);
    expect(drawn.map((each) => each.send)).toEqual([1, 1, 2, 3, 3]);
    expect(drawn.map((each) => each.at)).toEqual([0, 0, 1, 2, 2]);
    expect(drawn[0]).toMatchObject({ fromId: 'you', toId: 'www', messageId: 'ping', packet: { port: 53, sourcePort: FIRST_PORT } });
    expect(drawnSends([])).toEqual([]);
  });

  it('a traceroute has no question run', () => {
    const [trace, ping] = sendSequence(WORLD, ROUTED, [dispatch('trace', 'www', 1, 0), dispatch('ping', 'lucia', 2, 1)], EVERY_TERM);
    expect(trace.route?.lines.length).toBeGreaterThan(0);
    expect(trace).not.toHaveProperty('question');
    expect(drawnSends([trace, ping]).map((each) => each.id)).toEqual([trace.id, ping.id]);
  });

  it('only the last send of each combination keeps its question on the map while every send keeps its row in the history', () => {
    const history = sendSequence(WORLD, NAMES, [dispatch('ping', 'www', 1, 0), dispatch('ping', 'www', 2, 10)], EVERY_TERM);
    expect(history.map((each) => each.question?.packet.sourcePort)).toEqual([FIRST_PORT, FIRST_PORT + 1]);
    expect(history.map((each) => each.question?.trace.translation?.outside.port)).toEqual([FIRST_PUBLIC_PORT, FIRST_PUBLIC_PORT + 1]);
    const onTheMap = drawnSends(lastOfEach(history));
    expect(onTheMap.map((each) => [each.id, each.send])).toEqual([['sent-you-www-ping-question', 2], ['sent-you-www-ping', 2]]);
    expect(onTheMap[0].packet.sourcePort).toBe(FIRST_PORT + 1);
  });
});
