import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { ruleIdFor } from '@/levels/contract/incident';
import { filterIncident, sendIncident } from '@/testing';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
import { countStars } from './stars';

const FIRST = filterIncident('04-01');
const FULL_STARS = 3;
const place = (firewallId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', firewallId, whatId, fromId });
const remove = (firewallId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', firewallId, ruleId: ruleIdFor(whatId, fromId) });
const FIX = place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id);
const WIDE = place(SG.servidor2, WHAT.echoRequest.id, FROM.anywhere.id);
const UNWIDE = remove(SG.servidor2, WHAT.echoRequest.id, FROM.anywhere.id);
const SUBMIT: SessionAction = { type: 'submit' };
const DROP_DAY_SHIFT: SessionAction = { type: 'removeRule', firewallId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id };
const choose = (index: number): SessionAction => ({ type: 'chooseExplanation', index });
const RIGHT = FIRST.explanation.findIndex((option) => option.correct);
const WRONG = FIRST.explanation.findIndex((option) => !option.correct);
const PING_TASK = FIRST.tasks[0].id;

const play = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(INCIDENTS, FIRST.id));

describe('incident session', () => {
  it('starts playing, with nothing getting in and no reply from Lucía', () => {
    const start = play();
    expect(start.phase).toBe('playing');
    expect(isIntruding(start)).toBe(false);
    expect(start.alerts).toBe(0);
    expect(start.rejection).toBeNull();
  });

  it('a forbidden flow that starts getting in warns once per episode', () => {
    const opened = play(FIX, WIDE);
    expect(isIntruding(opened)).toBe(true);
    expect(opened.alerts).toBe(1);
    expect(sessionReducer(opened, place(SG.servidor1, WHAT.echoRequest.id, FROM.anywhere.id)).alerts).toBe(1);
    expect([UNWIDE, WIDE].reduce(sessionReducer, opened).alerts).toBe(2);
  });

  it('closing tight with the right explanation gives 3 stars', () => {
    const explained = play(FIX, SUBMIT, choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, middle: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
  });

  it('only the first explanation counts', () => {
    const session = play(FIX, SUBMIT, choose(WRONG), choose(RIGHT));
    expect(session.choice).toBe(WRONG);
    expect(starsOf(session).explained).toBe(false);
  });

  it('an explanation out of range is ignored, and the result needs a choice', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, choose(FIRST.explanation.length))).toBe(closed);
    expect(sessionReducer(closed, { type: 'showResult' })).toBe(closed);
    expect(play(FIX, SUBMIT, choose(RIGHT), { type: 'showResult' }).phase).toBe('result');
  });

  it('nothing on the map changes once the incident closed', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, WIDE)).toBe(closed);
  });

  it('hints come one by one, up to two', () => {
    const hint: SessionAction = { type: 'showHint' };
    expect(play(hint).hintsShown).toBe(1);
    expect(play(hint, hint, hint).hintsShown).toBe(FIRST.hints.length);
  });

  it('a Security Group the ladder keeps closed cannot be changed', () => {
    const start = startSession(INCIDENTS, FIRST.id);
    const closedGroups: Session = { ...start, parts: { ...start.parts, inboundRules: { ...start.parts.inboundRules, 'security-group': false } } };
    expect(sessionReducer(closedGroups, FIX)).toBe(closedGroups);
  });
});

describe('sending the solution', () => {
  it('with the task failing, the incident stays open and the reply names the task', () => {
    const session = play(place(SG.servidor1, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: false });
  });

  it('with something forbidden getting in, the reply says so', () => {
    const session = play(FIX, WIDE, SUBMIT);
    expect(session.phase).toBe('playing');
    expect(session.rejection).toEqual({ attempt: 1, failingTaskIds: [PING_TASK], intruding: true });
  });

  it('sending again without a change counts a new attempt, so Lucía answers again', () => {
    expect(play(SUBMIT, SUBMIT).rejection?.attempt).toBe(2);
  });

  it('the reply goes away when a rule changes, and stays when a move or a hint changes nothing', () => {
    const rejected = play(FIX, WIDE, SUBMIT);
    expect(sessionReducer(rejected, WIDE)).toBe(rejected);
    expect(sessionReducer(rejected, { type: 'showHint' }).rejection).toEqual(rejected.rejection);
    expect(sessionReducer(rejected, UNWIDE).rejection).toBeNull();
  });

  it('with every task done it closes and measures only-what-is-needed right then', () => {
    const second = startSession(INCIDENTS, '04-02');
    const keptDayShift = [place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(keptDayShift.phase).toBe('explaining');
    expect(keptDayShift.rejection).toBeNull();
    expect(starsOf(keptDayShift)).toMatchObject({ closed: true, middle: false });
    expect(sessionReducer(keptDayShift, DROP_DAY_SHIFT)).toBe(keptDayShift);
    const cleaned = [DROP_DAY_SHIFT, place(SG.servidor2, WHAT.echoRequest.id, FROM.sgServidor1.id), SUBMIT].reduce(sessionReducer, second);
    expect(starsOf(cleaned)).toMatchObject({ closed: true, middle: true });
  });

  it('sending once the incident is closed changes nothing', () => {
    const closed = play(FIX, SUBMIT);
    expect(sessionReducer(closed, SUBMIT)).toBe(closed);
  });
});

describe('sending packets', () => {
  const SENDING = sendIncident();
  const send = (fromId: string, toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId, toId, messageId });
  const PING_PRINTER = send('you', 'printer', 'ping');
  const FROM_OUTSIDE = send('attacker', 'lucia', 'ping');
  const sending = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([SENDING], SENDING.id));

  it('starts with nothing sent', () => {
    expect(sending().sent).toEqual([]);
  });

  it('simulates the packet of three chips and keeps it with its combination and its result', () => {
    const [packet] = sending(PING_PRINTER).sent;
    expect(packet).toMatchObject({ fromId: 'you', toId: 'printer', messageId: 'ping', replied: true, send: 1 });
    expect(packet.packet).toEqual({ from: { kind: 'device', id: 'your-laptop' }, to: '192.168.1.20', protocol: 'icmp', icmpType: 8 });
  });

  it('keeps only the last packet of each combination, in its place, with the number of its last send', () => {
    const session = sending(PING_PRINTER, FROM_OUTSIDE, PING_PRINTER);
    expect(session.sent.map((packet) => [packet.id, packet.send])).toEqual([
      ['sent-you-printer-ping', 3],
      ['sent-attacker-lucia-ping', 2],
    ]);
    expect(session.sends).toBe(3);
  });

  it('chips the incident does not offer change nothing, and a filter incident sends nothing', () => {
    const start = sending();
    expect(sessionReducer(start, send('you', 'ghost', 'ping'))).toBe(start);
    const first = play();
    expect(sessionReducer(first, PING_PRINTER)).toBe(first);
  });

  it('tasks hold from the packets sent, and a new send takes Lucía’s reply away', () => {
    const rejected = sending(PING_PRINTER, SUBMIT);
    expect(rejected.rejection).toEqual({ attempt: 1, failingTaskIds: ['outside'], intruding: false });
    expect(sessionReducer(rejected, FROM_OUTSIDE).rejection).toBeNull();
  });

  it('closing without hints earns the middle star, and with a hint it does not', () => {
    expect(starsOf(sending(PING_PRINTER, FROM_OUTSIDE, SUBMIT))).toMatchObject({ closed: true, middle: true });
    expect(starsOf(sending({ type: 'showHint' }, PING_PRINTER, FROM_OUTSIDE, SUBMIT))).toMatchObject({ closed: true, middle: false });
  });

  it('nothing is sent once the incident is closed', () => {
    const closed = sending(PING_PRINTER, FROM_OUTSIDE, SUBMIT);
    expect(sessionReducer(closed, PING_PRINTER)).toBe(closed);
  });
});
