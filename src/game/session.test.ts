import { describe, expect, it } from 'vitest';
import type { TermId } from '@/copy';
import { ROUTE_DEFAULT, applyAction, type Network, type ServerActor } from '@/engine';
import { INCIDENTS, caseWorld } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { ruleIdFor, type SettingMove } from '@/levels/contract/incident';
import { CHAPTER_1_TERMS, EVERY_TERM, NAME_SERVER_PIECES, OFFICE_FLOORS, classifyIncident, device, diagnoseIncident, filterIncident, gatewayIncident, hostFirewallIncident, identifyIncident, namesSendIncident, officeNet, officeTwoFloorsNet, officeWithNames, outboundFilterIncident, ping, repairableDiagnoseIncident, sendIncident, tcpService, withDevice } from '@/testing';
import { runFlows } from './flow-runs';
import { canAskHint, caseClosed, causeNamed, clockSteps, currentCase, failingFixTaskIds, hintsOf, isIntruding, sendingOf, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
import { countStars } from './stars';
import { taskHolds } from './tasks';

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

describe('rules in either direction', () => {
  const OUTBOUND = outboundFilterIncident();
  const FIREWALL = 'fw-you';
  const ECHO = 'echo-request';
  const placeOut: SessionAction = { type: 'placeRule', firewallId: FIREWALL, whatId: ECHO, toId: 'to-lucia', direction: 'outbound' };
  const placeIn: SessionAction = { type: 'placeRule', firewallId: FIREWALL, whatId: ECHO, fromId: 'from-lucia' };
  const start = startSession([OUTBOUND], OUTBOUND.id);
  const listsOf = (session: Session) => session.world.firewalls.find((firewall) => firewall.id === FIREWALL);
  const stopOf = (session: Session) => session.runs[0].trace.steps.find((step) => step.verdict === 'drop')?.stage;

  it('a rule placed in the wrong direction changes nothing for the flow', () => {
    expect(start.runs[0].replied).toBe(false);
    expect(stopOf(start)).toBe('firewall-out');
    const wrong = sessionReducer(start, placeIn);
    expect(listsOf(wrong)?.inbound).toHaveLength(1);
    expect(listsOf(wrong)?.outbound).toEqual([]);
    expect(wrong.runs).toEqual(start.runs);
    expect(stopOf(wrong)).toBe('firewall-out');
    expect(sessionReducer(wrong, SUBMIT).rejection).toEqual({ attempt: 1, failingTaskIds: ['leave'], intruding: false });
  });

  it('a rule placed in the right direction lets the ping out and back', () => {
    const right = sessionReducer(start, placeOut);
    expect(listsOf(right)?.outbound).toHaveLength(1);
    expect(listsOf(right)?.inbound).toEqual([]);
    expect(right.runs[0].replied).toBe(true);
    expect(sessionReducer(right, SUBMIT).phase).toBe('explaining');
  });

  it('removing an outbound rule closes the way out again, and removing it without its direction does nothing', () => {
    const right = sessionReducer(start, placeOut);
    const ruleId = ruleIdFor(ECHO, 'to-lucia', 'outbound');
    const closed = sessionReducer(right, { type: 'removeRule', firewallId: FIREWALL, ruleId, direction: 'outbound' });
    expect(listsOf(closed)?.outbound).toEqual([]);
    expect(closed.runs[0].replied).toBe(false);
    expect(sessionReducer(right, { type: 'removeRule', firewallId: FIREWALL, ruleId })).toBe(right);
  });

  it('an outbound rule needs the ladder to have opened the outbound rules of the kind, and an inbound one the inbound rules', () => {
    const closedOutbound: Session = { ...start, parts: { ...start.parts, outboundRules: { ...start.parts.outboundRules, 'host-firewall': false } } };
    expect(sessionReducer(closedOutbound, placeOut)).toBe(closedOutbound);
    expect(sessionReducer(closedOutbound, placeIn)).not.toBe(closedOutbound);
    const closedInbound: Session = { ...start, parts: { ...start.parts, inboundRules: { ...start.parts.inboundRules, 'host-firewall': false } } };
    expect(sessionReducer(closedInbound, placeIn)).toBe(closedInbound);
    expect(sessionReducer(closedInbound, placeOut)).not.toBe(closedInbound);
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

describe('setting the gateway of a device', () => {
  const GATEWAY = gatewayIncident();
  const set = (chipId: string, patch: Partial<SettingMove> = {}): SessionAction => ({ type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId, ...patch });
  const PING_ANDRES: SessionAction = { type: 'sendPacket', fromId: 'you', toId: 'andres', messageId: 'ping' };
  const PING_PRINTER: SessionAction = { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' };
  const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([GATEWAY], GATEWAY.id));
  const gatewayOf = (session: Session) => session.world.devices.find((candidate) => candidate.id === 'your-laptop')?.gateway;

  it('starts with the laptop reinstalled: no gateway, and the ping to the other floor does not leave', () => {
    const sent = playing(PING_ANDRES);
    expect(gatewayOf(sent)).toBeUndefined();
    expect(sent.sent[0].trace.outcome).toBe('no-route');
  });

  it('changing the gateway clears the packets sent before, so the stamps never show the old world', () => {
    const before = playing(PING_ANDRES, PING_PRINTER);
    expect(before.sent.map((packet) => packet.trace.outcome)).toEqual(['no-route', 'replied']);
    const after = sessionReducer(before, set('router'));
    expect(gatewayOf(after)).toBe(OFFICE_FLOORS.floor1.gateway);
    expect(after.sent).toEqual([]);
    expect(taskHolds(GATEWAY.tasks[0], after.runs, after.sent)).toBe(false);
  });

  it('a send after the setting uses the new gateway', () => {
    const after = playing(PING_ANDRES, set('router'), PING_ANDRES);
    expect(after.sent.map((packet) => [packet.id, packet.trace.outcome, packet.send])).toEqual([['sent-you-andres-ping', 'replied', 2]]);
    expect(taskHolds(GATEWAY.tasks[0], after.runs, after.sent)).toBe(true);
  });

  it('a gateway that is not a router, or that nobody has, does not bring the ping back', () => {
    expect(playing(set('printer'), PING_ANDRES).sent[0].trace.outcome).toBe('timeout');
    expect(playing(set('nobody'), PING_ANDRES).sent[0].trace.outcome).toBe('unreachable');
  });

  it('runs the ambient flows again on the new world', () => {
    const flowing = { ...GATEWAY, flows: [{ id: 'ambient', kind: 'ambient' as const, packet: ping(device('your-laptop'), OFFICE_FLOORS.floor2.andres) }] };
    const start = startSession([flowing], flowing.id);
    expect(start.runs.map((run) => run.replied)).toEqual([false]);
    const after = sessionReducer(start, set('router'));
    expect(after.runs.map((run) => run.replied)).toEqual([true]);
  });

  it('taking the gateway away puts the laptop back as it was, and clears what was sent', () => {
    const cleared = playing(set('router'), PING_ANDRES, set('none'));
    expect(gatewayOf(cleared)).toBeUndefined();
    expect(cleared.sent).toEqual([]);
  });

  it('a chip already in effect, or one the incident does not offer, changes nothing and keeps the packets', () => {
    const sent = playing(set('router'), PING_ANDRES);
    expect(sessionReducer(sent, set('router'))).toBe(sent);
    for (const patch of [{ chipId: 'ghost' }, { settingId: 'ghost' }, { deviceId: 'printer' }]) expect(sessionReducer(sent, set('none', patch))).toBe(sent);
  });

  it('takes Lucía’s reply away, and the send number goes on counting', () => {
    const rejected = playing(PING_ANDRES, SUBMIT);
    expect(rejected.rejection).not.toBeNull();
    const after = sessionReducer(rejected, set('router'));
    expect(after.rejection).toBeNull();
    expect(after.sends).toBe(1);
  });

  it('the reference solution closes the incident, and no setting changes anything once it closed', () => {
    const closed = [...GATEWAY.solution, SUBMIT].reduce(sessionReducer, startSession([GATEWAY], GATEWAY.id));
    expect(closed.phase).toBe('explaining');
    expect(sessionReducer(closed, set('none'))).toBe(closed);
  });

  it('a filter incident and an identify incident have no settings to set', () => {
    const first = play();
    expect(sessionReducer(first, set('router'))).toBe(first);
    const identifying = identifyIncident();
    const start = startSession([identifying], identifying.id);
    expect(sessionReducer(start, set('router'))).toBe(start);
  });
});

describe('answering the cards of an identify incident', () => {
  const IDENTIFYING = identifyIncident();
  const [GUEST_TASK, PRINTER_TASK] = IDENTIFYING.tasks;
  const answer = (deviceId: string, picks: Record<string, string>): SessionAction => ({ type: 'answerCard', deviceId, picks });
  const MARK_GUEST_OUT = answer('guest-laptop', { 'in-network': 'no' });
  const PICK_RIGHT_IP = answer('printer', { ip: 'right' });
  const PICK_MARTA_IP = answer('printer', { ip: 'marta' });
  const identifying = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([IDENTIFYING], IDENTIFYING.id));
  const holds = (session: Session, taskId: string) => {
    const task = IDENTIFYING.tasks.find((candidate) => candidate.id === taskId);
    if (!task) throw new Error(`missing task ${taskId}`);
    return taskHolds(task, session.runs, session.sent, session.answers);
  };

  it('a tray can start with a chip already picked', () => {
    expect(identifying().answers).toEqual({ printer: { ip: 'note' } });
  });

  it('a task whose chip is not the one picked from the start stays open', () => {
    const start = identifying();
    expect(holds(start, GUEST_TASK.id)).toBe(false);
    expect(holds(start, PRINTER_TASK.id)).toBe(false);
    expect(sessionReducer(start, SUBMIT).rejection?.failingTaskIds).toEqual([GUEST_TASK.id, PRINTER_TASK.id]);
  });

  it('starting the incident again puts the initial picks back', () => {
    const answered = identifying(MARK_GUEST_OUT, PICK_RIGHT_IP);
    expect(answered.answers).toEqual({ 'guest-laptop': { 'in-network': 'no' }, printer: { ip: 'right' } });
    expect(startSession([IDENTIFYING], IDENTIFYING.id).answers).toEqual({ printer: { ip: 'note' } });
  });

  it('answering a card keeps the chip picked for that device and tray', () => {
    const answered = identifying(MARK_GUEST_OUT);
    expect(answered.answers).toEqual({ 'guest-laptop': { 'in-network': 'no' }, printer: { ip: 'note' } });
    expect(answered.world).toBe(identifying().world);
  });

  it('a task holds when its chip is the one picked', () => {
    const answered = identifying(MARK_GUEST_OUT);
    expect(holds(answered, GUEST_TASK.id)).toBe(true);
    expect(holds(answered, PRINTER_TASK.id)).toBe(false);
    expect(holds(identifying(MARK_GUEST_OUT, PICK_RIGHT_IP), PRINTER_TASK.id)).toBe(true);
  });

  it('picking another chip changes the answer', () => {
    const right = identifying(PICK_RIGHT_IP);
    const changed = sessionReducer(right, PICK_MARTA_IP);
    expect(changed.answers.printer).toEqual({ ip: 'marta' });
    expect(holds(changed, PRINTER_TASK.id)).toBe(false);
  });

  it('answers that name a card, a tray or a chip the incident does not offer change nothing', () => {
    const start = identifying();
    expect(sessionReducer(start, answer('ghost', { ip: 'right' }))).toBe(start);
    expect(sessionReducer(start, answer('printer', { ghost: 'right' }))).toBe(start);
    expect(sessionReducer(start, answer('printer', { ip: 'ghost' }))).toBe(start);
    expect(sessionReducer(start, answer('printer', { ip: 'note' }))).toBe(start);
  });

  it('answering takes Lucía’s reply away, and a filter incident has no cards to answer', () => {
    const rejected = identifying(SUBMIT);
    expect(rejected.rejection).not.toBeNull();
    expect(sessionReducer(rejected, MARK_GUEST_OUT).rejection).toBeNull();
    const first = play();
    expect(sessionReducer(first, MARK_GUEST_OUT)).toBe(first);
  });

  it('the incident closes only with every card task done, and asking a hint costs the middle star', () => {
    expect(identifying(MARK_GUEST_OUT, SUBMIT).phase).toBe('playing');
    expect(identifying(PICK_RIGHT_IP, SUBMIT).phase).toBe('playing');
    const closed = identifying(MARK_GUEST_OUT, PICK_RIGHT_IP, SUBMIT);
    expect(closed.phase).toBe('explaining');
    expect(starsOf(closed)).toMatchObject({ closed: true, middle: true });
    expect(starsOf(identifying({ type: 'showHint' }, MARK_GUEST_OUT, PICK_RIGHT_IP, SUBMIT))).toMatchObject({ closed: true, middle: false });
  });

  it('the reference solution closes it', () => {
    expect([...IDENTIFYING.solution, SUBMIT].reduce(sessionReducer, startSession([IDENTIFYING], IDENTIFYING.id)).phase).toBe('explaining');
  });

  it('answers are ignored once the incident is closed', () => {
    const closed = identifying(MARK_GUEST_OUT, PICK_RIGHT_IP, SUBMIT);
    expect(sessionReducer(closed, PICK_MARTA_IP)).toBe(closed);
  });
});

describe('a firewall the player does not know yet', () => {
  const guard = (id: string, name: string) => ({ id, name, kind: 'host-firewall' as const, inbound: [], outbound: [] });
  const base = (deviceId: string) => {
    const net = officeNet();
    return withDevice({ ...net, firewalls: [...net.firewalls, guard('fw-you', 'tu-laptop')] }, deviceId, { firewallIds: [deviceId === 'your-laptop' ? 'fw-you' : 'fw-lucia'] });
  };
  const sending = (guarded: string, ...introduced: TermId[]): Session => {
    const incident = { ...sendIncident(), base: base(guarded), introduces: [...sendIncident().introduces, ...introduced] };
    return startSession([incident], incident.id);
  };
  const pingLucia = (session: Session) => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId: 'lucia', messageId: 'ping' }).sent[0];

  it('stops a packet that comes in without blocking it: the run is hidden, and its result is the same', () => {
    const hidden = pingLucia(sending('lucia-laptop'));
    const shown = pingLucia(sending('lucia-laptop', 'firewall'));
    expect(hidden).toMatchObject({ blocked: false, hiddenStop: true, reached: false, replied: false, by: ['fw-lucia'] });
    expect(shown).toMatchObject({ blocked: true, hiddenStop: false, reached: false, replied: false, by: ['fw-lucia'] });
    expect(hidden.trace).toEqual(shown.trace);
    expect(hidden.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop', at: 'lucia-laptop' }));
  });

  it('stops a packet that goes out without blocking it either', () => {
    const hidden = pingLucia(sending('your-laptop'));
    expect(hidden.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-out', verdict: 'drop', at: 'your-laptop' }));
    expect(hidden).toMatchObject({ blocked: false, hiddenStop: true });
    expect(pingLucia(sending('your-laptop', 'firewall'))).toMatchObject({ blocked: true, hiddenStop: false });
  });

  it('hides the stop of a flow of the incident in the same way', () => {
    const host = hostFirewallIncident();
    const unaware = { ...host, introduces: ['traffic' as const, 'rule' as const] };
    const [run] = startSession([unaware], unaware.id).runs;
    expect(run).toMatchObject({ blocked: false, hiddenStop: true, reached: false });
    expect(startSession([host], host.id).runs[0]).toMatchObject({ blocked: true, hiddenStop: false });
  });

  it('is not hidden when no firewall stops the packet', () => {
    const session = sending('lucia-laptop');
    const sendTo = (toId: string) => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId: 'ping' }).sent[0];
    expect(sendTo('printer')).toMatchObject({ replied: true, blocked: false, hiddenStop: false });
    expect(sendTo('nobody')).toMatchObject({ replied: false, blocked: false, hiddenStop: false });
  });
});

describe('a warning that comes back to the sender', () => {
  const floors = officeTwoFloorsNet();
  const { floor1, server } = OFFICE_FLOORS;
  const flow = (id: string, packet: ReturnType<typeof ping>) => ({ id, kind: 'ambient' as const, packet });
  const flows = [
    flow('own', ping(device('your-laptop'), floor1.nobody)),
    flow('expired', { ...ping(device('your-laptop'), server.ip), ttl: 1 }),
    flow('no-route', ping(device('your-laptop'), '8.8.8.8')),
    flow('silent', ping(device('your-laptop'), '10.0.0.10')),
    flow('answered', ping(device('your-laptop'), server.ip)),
  ];
  const without = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));
  const warnings = (known: ReadonlySet<TermId>) => Object.fromEntries(runFlows(floors, flows, known).map((run) => [run.id, run.warning]));

  it('is part of the result of its run, with the kind of warning and who generated it', () => {
    expect(warnings(CHAPTER_1_TERMS)).toEqual({
      own: { term: 'host-unreachable', by: 'sender' },
      expired: { term: 'time-exceeded', by: 'router' },
      'no-route': { term: null, by: 'router' },
      silent: null,
      answered: null,
    });
  });

  it('is left out of the result while its term is not known, and then nothing else about the run changes', () => {
    const [own, expired] = runFlows(floors, flows, without('host-unreachable', 'time-exceeded'));
    expect([own.warning, expired.warning]).toEqual([null, null]);
    const [knownOwn, knownExpired] = runFlows(floors, flows, EVERY_TERM);
    expect({ ...own, warning: null }).toEqual({ ...knownOwn, warning: null });
    expect({ ...expired, warning: null }).toEqual({ ...knownExpired, warning: null });
    expect(warnings(without('time-exceeded')).own).toEqual({ term: 'host-unreachable', by: 'sender' });
    expect(warnings(without('host-unreachable')).expired).toEqual({ term: 'time-exceeded', by: 'router' });
  });
});


describe('the cases of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const { cases } = DIAGNOSE.diagnose;
  const { floor1, floor2 } = OFFICE_FLOORS;
  const rightIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => option.correct);
  const wrongIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => !option.correct);
  const nameRight = (number: number): SessionAction => ({ type: 'nameCause', index: rightIndex(number) });
  const nameWrong = (number: number): SessionAction => ({ type: 'nameCause', index: wrongIndex(number) });
  const sendTest = (toId: string): SessionAction => ({ type: 'sendPacket', fromId: 'origin', toId, messageId: 'ping' });
  const NEXT: SessionAction = { type: 'nextCase' };
  const HINT: SessionAction = { type: 'showHint' };
  const diagnosing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([DIAGNOSE], DIAGNOSE.id));
  const closeCases = (count: number): SessionAction[] => Array.from({ length: count }, (_, index) => [nameRight(index + 1), NEXT]).flat();
  const closeAll: SessionAction[] = [...closeCases(cases.length - 1), nameRight(cases.length)];
  const gatewayOf = (session: Session, deviceId: string) => session.world.devices.find((candidate) => candidate.id === deviceId)?.gateway;

  it('starts at the first case', () => {
    const start = diagnosing();
    expect(start.caseIndex).toBe(0);
    expect(start.caseResults).toEqual([]);
    expect(start.named).toEqual([]);
    expect(start.phase).toBe('playing');
    expect(currentCase(start)).toBe(cases[0]);
    expect(hintsOf(start)).toBe(cases[0].hints);
    expect(gatewayOf(start, 'your-laptop')).toBeUndefined();
    expect(start.sent).toEqual([]);
    expect(caseClosed(start)).toBe(false);
  });

  it('the player can send tests in the case', () => {
    const sent = diagnosing(sendTest('loopback'), sendTest('server'));
    expect(sendingOf(sent)).toBe(cases[0]);
    expect(sent.sent.map((packet) => [packet.toId, packet.trace.outcome])).toEqual([['loopback', 'replied'], ['server', 'no-route']]);
    expect(sent.sent.map((packet) => packet.send)).toEqual([1, 2]);
    expect(sessionReducer(sent, sendTest('typo'))).toBe(sent);
    expect(sessionReducer(sent, { type: 'sendPacket', fromId: 'ghost', toId: 'loopback', messageId: 'ping' })).toBe(sent);
  });

  it('naming the cause right closes the case and opens the next', () => {
    const closed = diagnosing(nameRight(1));
    expect(closed.caseResults).toEqual([{ picks: [rightIndex(1)], hints: 0 }]);
    expect(closed.caseIndex).toBe(0);
    expect(closed.phase).toBe('playing');
    expect(caseClosed(closed)).toBe(true);
    const next = sessionReducer(closed, NEXT);
    expect(next.caseIndex).toBe(1);
    expect(currentCase(next)).toBe(cases[1]);
    expect(next.named).toEqual([]);
    expect(caseClosed(next)).toBe(false);
    expect(next.caseResults).toEqual(closed.caseResults);
    expect(gatewayOf(next, 'your-laptop')).toBe(floor1.gateway);
  });

  it('the next case waits for the case in play to close, and each case builds on the world before the incident', () => {
    const open = diagnosing();
    expect(sessionReducer(open, NEXT)).toBe(open);
    const second = diagnosing(...closeCases(2));
    expect(second.caseIndex).toBe(2);
    expect(gatewayOf(second, 'andres-laptop')).toBeUndefined();
    expect(gatewayOf(second, 'your-laptop')).toBe(floor1.gateway);
    expect(gatewayOf(sessionReducer(sessionReducer(second, nameRight(3)), NEXT), 'andres-laptop')).toBe(floor2.gateway);
  });

  it('naming it wrong gives the feedback of the option and lets the player try again', () => {
    const wrong = diagnosing(nameWrong(1));
    expect(wrong.named).toEqual([wrongIndex(1)]);
    expect(cases[0].cause.options[wrong.named[0]].feedback).toBe(`Porque 1${String.fromCharCode(65 + wrongIndex(1))}.`);
    expect(wrong.caseResults).toEqual([]);
    expect(caseClosed(wrong)).toBe(false);
    expect(sessionReducer(wrong, nameWrong(1))).toBe(wrong);
    const again = sessionReducer(wrong, nameRight(1));
    expect(again.caseResults).toEqual([{ picks: [wrongIndex(1), rightIndex(1)], hints: 0 }]);
    expect(caseClosed(again)).toBe(true);
  });

  it('a cause that is out of range, or named after the case closed, changes nothing', () => {
    const open = diagnosing();
    for (const index of [-1, 3, 1.5, Number.NaN]) expect(sessionReducer(open, { type: 'nameCause', index })).toBe(open);
    const closed = diagnosing(nameRight(1));
    expect(sessionReducer(closed, nameWrong(1))).toBe(closed);
    expect(sessionReducer(closed, nameRight(1))).toBe(closed);
    const sending = startSession([sendIncident()], sendIncident().id);
    expect(sessionReducer(sending, { type: 'nameCause', index: 0 })).toBe(sending);
    expect(sessionReducer(sending, NEXT)).toBe(sending);
  });

  it('the last case closed closes the incident', () => {
    const closed = diagnosing(...closeAll);
    expect(closed.phase).toBe('explaining');
    expect(closed.caseIndex).toBe(cases.length - 1);
    expect(closed.caseResults).toHaveLength(cases.length);
    expect(starsOf(closed).closed).toBe(true);
    expect(sessionReducer(closed, NEXT)).toBe(closed);
    expect(sessionReducer(closed, nameRight(cases.length))).toBe(closed);
    expect(sessionReducer(closed, { type: 'showResult' }).phase).toBe('result');
  });

  it('the incident stays open until the last case closes, and the result needs it closed', () => {
    const almost = diagnosing(...closeCases(cases.length - 1));
    expect(almost.phase).toBe('playing');
    expect(starsOf(almost).closed).toBe(false);
    expect(sessionReducer(almost, { type: 'showResult' })).toBe(almost);
  });

  it('sends and hints belong to the case they were made in', () => {
    const first = diagnosing(sendTest('loopback'), HINT, HINT, nameRight(1));
    expect(first.sent).toHaveLength(1);
    expect(first.hintsShown).toBe(2);
    expect(first.caseResults).toEqual([{ picks: [rightIndex(1)], hints: 2 }]);
    const second = sessionReducer(first, NEXT);
    expect(second.sent).toEqual([]);
    expect(second.hintsShown).toBe(0);
    expect(hintsOf(second)).toBe(cases[1].hints);
    const hinted = sessionReducer(second, HINT);
    expect(hinted.hintsShown).toBe(1);
    expect(sessionReducer(hinted, sendTest('printer')).sent.map((packet) => packet.toId)).toEqual(['printer']);
    expect(sessionReducer(hinted, nameRight(2)).caseResults).toEqual([first.caseResults[0], { picks: [rightIndex(2)], hints: 1 }]);
    expect(sessionReducer(second, sendTest('loopback'))).toBe(second);
  });

  it('a hint comes one by one, up to two, and none once the case is closed', () => {
    expect(diagnosing(HINT, HINT, HINT).hintsShown).toBe(cases[0].hints.length);
    const closed = diagnosing(nameRight(1));
    expect(canAskHint(diagnosing())).toBe(true);
    expect(canAskHint(diagnosing(HINT, HINT))).toBe(false);
    expect(canAskHint(closed)).toBe(false);
    expect(sessionReducer(closed, HINT)).toBe(closed);
  });

  it('what a send incident does with tasks, rules, cards and explanations does nothing here', () => {
    const open = diagnosing(sendTest('loopback'));
    const ignored: SessionAction[] = [
      { type: 'submit' },
      { type: 'chooseExplanation', index: 0 },
      { type: 'placeRule', firewallId: 'fw-your-laptop', whatId: 'a', fromId: 'b' },
      { type: 'removeRule', firewallId: 'fw-your-laptop', ruleId: 'a' },
      { type: 'answerCard', deviceId: 'your-laptop', picks: { tray: 'chip' } },
      { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'router' },
    ];
    for (const action of ignored) expect(sessionReducer(open, action)).toBe(open);
    expect(sessionReducer(diagnosing(...closeAll), { type: 'chooseExplanation', index: 0 }).choice).toBeNull();
  });

  it('earns the three stars with every cause right at the first try and no hint', () => {
    const closed = diagnosing(...closeAll);
    expect(starsOf(closed)).toEqual({ closed: true, middle: true, explained: true });
    expect(countStars(starsOf(closed))).toBe(FULL_STARS);
  });

  it('a hint in the first case loses the middle star, though no hint was asked in the last one', () => {
    const closed = diagnosing(HINT, ...closeAll);
    expect(closed.hintsShown).toBe(0);
    expect(starsOf(closed)).toEqual({ closed: true, middle: false, explained: true });
  });

  it('a wrong cause in an early case loses the explained star, though the case closes', () => {
    const closed = diagnosing(nameWrong(1), ...closeAll);
    expect(closed.caseResults[0].picks).toEqual([wrongIndex(1), rightIndex(1)]);
    expect(starsOf(closed)).toEqual({ closed: true, middle: true, explained: false });
  });

  it('the explained star waits for the incident to close', () => {
    const partway = diagnosing(...closeCases(cases.length - 1));
    expect(starsOf(partway)).toEqual({ closed: false, middle: false, explained: false });
  });
});

describe('the clock and the tables of chapter 2', () => {
  const NAMES = namesSendIncident();
  const { zone, authoritative } = NAME_SERVER_PIECES;
  const { provider, officeRouter, server, range } = OFFICE_FLOORS;
  const WWW = `www.${zone}`;
  const send = (toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId: 'you', toId, messageId });
  const DIG = send('www', 'dig');
  const NC = send('lucia', 'nc');
  const wait = (seconds: number): SessionAction => ({ type: 'wait', seconds });
  const ONE_MINUTE = wait(60);
  const FIVE_MINUTES = wait(300);
  const setting = (deviceId: string, settingId: string, chipId: string): SessionAction => ({ type: 'setSetting', deviceId, settingId, chipId });
  const placeRoute = (destination: string): SessionAction => ({ type: 'placeEntry', tableId: 'routes', picks: { destination, nextHop: officeRouter.id } });
  const placeRecord = (type: string): SessionAction => ({ type: 'placeEntry', tableId: 'records', picks: { name: WWW, type, value: server.ip } });
  const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([NAMES], NAMES.id));
  const routesOf = (session: Session, routerId: string = provider.id) => session.world.routers?.find((router) => router.id === routerId)?.routes ?? [];
  const recordsOf = (session: Session) => (session.world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === authoritative.id)?.dns?.zones ?? []).flatMap((zone) => zone.records);
  const deviceOf = (session: Session, id: string) => session.world.devices.find((candidate) => candidate.id === id)!;
  const sourcePorts = (session: Session) => session.history.map((packet) => packet.trace.header?.request.sourcePort);

  it('starts with the clock at zero and nothing sent', () => {
    const start = playing();
    expect([start.clock, start.sent, start.history, start.entryProblem]).toEqual([0, [], [], null]);
  });

  it('wait advances the clock and keeps the sends', () => {
    const sent = playing(DIG);
    const waited = sessionReducer(sent, ONE_MINUTE);
    expect(waited.clock).toBe(60);
    expect(waited.sent).toBe(sent.sent);
    expect(waited.history).toBe(sent.history);
    expect(waited.world).toBe(sent.world);
    expect(sessionReducer(waited, FIVE_MINUTES).clock).toBe(360);
    const rejected = playing(DIG, SUBMIT);
    expect(sessionReducer(rejected, ONE_MINUTE).rejection).toBe(rejected.rejection);
  });

  it('waits only the steps of the clock of an incident that has one, while the incident is open', () => {
    const start = playing();
    for (const seconds of [30, 0, -60]) expect(sessionReducer(start, wait(seconds)), String(seconds)).toBe(start);
    const noClock = sendIncident();
    const quiet = startSession([noClock], noClock.id);
    expect(sessionReducer(quiet, ONE_MINUTE)).toBe(quiet);
    const closed = playing(send('www', 'dig'), send('missing', 'dig'), SUBMIT);
    expect(closed.phase).toBe('explaining');
    expect(sessionReducer(closed, ONE_MINUTE)).toBe(closed);
    const identifying = identifyIncident();
    const answering = startSession([identifying], identifying.id);
    expect(sessionReducer(answering, ONE_MINUTE)).toBe(answering);
  });

  it('a sent packet keeps the time it left at', () => {
    const session = playing(DIG, ONE_MINUTE, DIG, FIVE_MINUTES, send('lucia', 'ping'));
    expect(session.history.map((packet) => [packet.send, packet.at])).toEqual([[1, 0], [2, 60], [3, 360]]);
    expect(session.sent.map((packet) => [packet.id, packet.at])).toEqual([['sent-you-www-dig', 60], ['sent-you-lucia-ping', 360]]);
    expect(session.sent[0].trace.dns).toMatchObject({ fromCache: true, ttlLeft: 240 });
    expect(playing(FIVE_MINUTES, DIG, FIVE_MINUTES, DIG).sent[0].trace.dns?.fromCache).toBe(false);
  });

  it('the sends carry the translation table and the cache of one to the next, and the last of each combination is the one kept', () => {
    const session = playing(DIG, DIG, NC);
    expect(sourcePorts(session)).toEqual([51514, 51515, 51516]);
    expect(session.history.map((packet) => packet.trace.dns?.fromCache)).toEqual([false, true, undefined]);
    expect(session.history.slice(0, 2).map((packet) => packet.trace.translation?.outside.port)).toEqual([40001, 40002]);
    expect(session.sent.map((packet) => [packet.id, packet.send])).toEqual([['sent-you-www-dig', 2], ['sent-you-lucia-nc', 3]]);
    expect(session.sends).toBe(3);
    expect(session.sent[0]).toBe(session.history[1]);
  });

  it('a move that changes the world clears the sends and keeps the clock', () => {
    const sent = playing(DIG, ONE_MINUTE, NC);
    expect(sourcePorts(sent)).toEqual([51514, 51515]);
    const moves = [setting('your-laptop', 'resolver', 'none'), placeRoute('default'), { type: 'removeEntry', tableId: 'routes', entryId: range } as const];
    for (const move of moves) {
      const after = sessionReducer(sent, move);
      expect(after.world, JSON.stringify(move)).not.toBe(sent.world);
      expect([after.sent, after.history, after.clock, after.sends], JSON.stringify(move)).toEqual([[], [], 60, 2]);
    }
    const again = sessionReducer(sessionReducer(sent, placeRoute('default')), NC);
    expect(sourcePorts(again)).toEqual([51514]);
    expect(again.sent[0]).toMatchObject({ send: 3, at: 60 });
  });

  it('a move that changes nothing keeps the sends and the clock', () => {
    const sent = playing(DIG, ONE_MINUTE);
    for (const move of [setting('your-laptop', 'resolver', 'resolver'), { type: 'removeEntry', tableId: 'routes', entryId: 'ghost' } as const]) expect(sessionReducer(sent, move), JSON.stringify(move)).toBe(sent);
    for (const move of [placeRoute(range), placeRecord('A')]) {
      const refused = sessionReducer(sent, move);
      expect([refused.world, refused.sent, refused.history, refused.clock], JSON.stringify(move)).toEqual([sent.world, sent.sent, sent.history, 60]);
    }
  });

  it('placeEntry of a route changes the table and clears the sends', () => {
    const sent = playing(DIG, NC);
    expect(routesOf(sent).map(({ to }) => to)).not.toContain('default');
    const placed = sessionReducer(sent, placeRoute('default'));
    expect(routesOf(placed).at(-1)).toEqual({ to: 'default', next: officeRouter.id });
    expect(routesOf(placed)).toHaveLength(routesOf(sent).length + 1);
    expect([placed.sent, placed.history, placed.entryProblem]).toEqual([[], [], null]);
    expect(placed.runs).toEqual(runFlows(placed.world, NAMES.flows, placed.known));
  });

  it('placeEntry of a record that the cname rule forbids leaves the world as it was and keeps the problem', () => {
    const sent = playing(DIG, ONE_MINUTE);
    const refused = sessionReducer(sent, placeRecord('CNAME'));
    expect(refused.world).toBe(sent.world);
    expect([refused.sent, refused.history, refused.clock]).toEqual([sent.sent, sent.history, 60]);
    expect(refused.entryProblem).toEqual({ tableId: 'records', code: 'cname-with-other-records' });
    expect(sessionReducer(refused, placeRecord('CNAME'))).toBe(refused);
  });

  it('placeEntry of a route to a destination that already has one leaves the world as it was and keeps the problem', () => {
    const sent = playing(DIG);
    const refused = sessionReducer(sent, placeRoute(range));
    expect(refused.world).toBe(sent.world);
    expect(refused.sent).toBe(sent.sent);
    expect(refused.entryProblem).toEqual({ tableId: 'routes', code: 'destination-has-route' });
    expect(sessionReducer(refused, placeRoute(range))).toBe(refused);
  });

  it('the problem stays through a send, a wait and a hint, and goes with the next change of the world', () => {
    const refused = playing(placeRoute(range));
    const problem = refused.entryProblem;
    expect(problem).not.toBeNull();
    for (const action of [DIG, ONE_MINUTE, { type: 'showHint' } as const]) expect(sessionReducer(refused, action).entryProblem, JSON.stringify(action)).toBe(problem);
    expect(sessionReducer(refused, placeRoute('default')).entryProblem).toBeNull();
    expect(sessionReducer(refused, setting('your-laptop', 'resolver', 'none')).entryProblem).toBeNull();
    expect(sessionReducer(refused, placeRecord('CNAME')).entryProblem).toEqual({ tableId: 'records', code: 'cname-with-other-records' });
  });

  it('an entry the incident does not offer changes nothing and keeps no problem', () => {
    const start = playing();
    const odd: SessionAction[] = [{ type: 'placeEntry', tableId: 'ghost', picks: {} }, { type: 'placeEntry', tableId: 'routes', picks: { destination: 'ghost', nextHop: officeRouter.id } }, { type: 'placeEntry', tableId: 'routes', picks: { destination: 'default' } }];
    for (const move of odd) expect(sessionReducer(start, move), JSON.stringify(move)).toBe(start);
  });

  it('removeEntry removes the row it names', () => {
    const sent = playing(DIG);
    const removed = sessionReducer(sent, { type: 'removeEntry', tableId: 'routes', entryId: range });
    expect(routesOf(removed).map(({ to }) => to)).toEqual(routesOf(sent).map(({ to }) => to).filter((to) => to !== range));
    expect([removed.sent, removed.history]).toEqual([[], []]);
    const recordId = `${WWW}|A|${server.ip}`;
    const noRecord = sessionReducer(sent, { type: 'removeEntry', tableId: 'records', entryId: recordId });
    expect(recordsOf(noRecord).filter((record) => record.name === WWW)).toEqual([]);
    expect(recordsOf(sent).filter((record) => record.name === WWW)).toHaveLength(1);
    expect(sessionReducer(removed, { type: 'removeEntry', tableId: 'routes', entryId: range })).toBe(removed);
  });

  it('setSetting sets the dns server and the listen address of a device', () => {
    const serving = { ...NAMES, base: applyAction(officeWithNames(), { type: 'setServices', ownerId: 'lucia-laptop', services: [tcpService(3000)] }) };
    const opened = (...actions: SessionAction[]) => actions.reduce(sessionReducer, startSession([serving], serving.id));
    expect(deviceOf(opened(), 'your-laptop').dnsServer).toBe(NAME_SERVER_PIECES.resolver.ip);
    const none = opened(setting('your-laptop', 'resolver', 'none'));
    expect(deviceOf(none, 'your-laptop')).not.toHaveProperty('dnsServer');
    expect(sessionReducer(none, DIG).sent[0].trace.dns?.status).toBe('NO-RESOLVER');
    expect(deviceOf(opened(setting('your-laptop', 'resolver', 'none'), setting('your-laptop', 'resolver', 'resolver')), 'your-laptop').dnsServer).toBe(NAME_SERVER_PIECES.resolver.ip);
    expect(opened(NC).sent[0].trace.outcome).toBe('replied');
    const loopback = opened(NC, setting('lucia-laptop', 'app', 'loopback'));
    expect(deviceOf(loopback, 'lucia-laptop').host.services).toEqual([tcpService(3000, 'loopback')]);
    expect(loopback.sent).toEqual([]);
    expect(sessionReducer(loopback, NC).sent[0].trace.outcome).toBe('refused');
    expect(sessionReducer(sessionReducer(loopback, setting('lucia-laptop', 'app', 'all')), NC).sent[0].trace.outcome).toBe('replied');
  });
});

describe('the card that classifies in an identify incident', () => {
  const CLASSIFYING = classifyIncident();
  const answer = (deviceId: string, picks: Record<string, string>): SessionAction => ({ type: 'answerCard', deviceId, picks });
  const classifying = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([CLASSIFYING], CLASSIFYING.id));
  const holds = (session: Session, taskId: string) => taskHolds(CLASSIFYING.tasks.find((task) => task.id === taskId)!, session.runs, session.sent, session.answers);

  it('answering for a classified item saves its bin under its own device and a bin the card does not offer is left out', () => {
    const placed = classifying(answer('printer', { bin: 'inside' }));
    expect(placed.answers).toEqual({ printer: { bin: 'inside' } });
    expect(holds(placed, 'printer')).toBe(true);
    const both = sessionReducer(sessionReducer(placed, answer('andres-laptop', { bin: 'outside' })), answer('your-laptop', { block: 'right' }));
    expect(both.answers).toEqual({ printer: { bin: 'inside' }, 'andres-laptop': { bin: 'outside' }, 'your-laptop': { block: 'right' } });
    expect(sessionReducer(placed, answer('printer', { bin: 'outside' })).answers.printer).toEqual({ bin: 'outside' });
    const start = classifying();
    for (const move of [answer('printer', { bin: 'ghost' }), answer('printer', { other: 'inside' }), answer('lucia-laptop', { bin: 'inside' }), answer('your-laptop', { bin: 'inside' }), answer('ghost', { bin: 'inside' })]) {
      expect(sessionReducer(start, move), JSON.stringify(move)).toBe(start);
    }
    expect(sessionReducer(placed, answer('printer', { bin: 'inside', other: 'inside' })).answers).toEqual(placed.answers);
  });

  it('a classified item has no answer until the player places it', () => {
    const start = classifying();
    expect(start.answers).toEqual({});
    expect(holds(start, 'printer') || holds(start, 'andres')).toBe(false);
    expect(sessionReducer(start, SUBMIT).rejection?.failingTaskIds).toEqual(['block', 'printer', 'andres']);
  });

  it('the reference solution closes it, and an item placed in the wrong bin keeps its task open', () => {
    expect([...CLASSIFYING.solution, SUBMIT].reduce(sessionReducer, startSession([CLASSIFYING], CLASSIFYING.id)).phase).toBe('explaining');
    const wrong = classifying(answer('your-laptop', { block: 'right' }), answer('printer', { bin: 'outside' }), answer('andres-laptop', { bin: 'outside' }));
    expect(sessionReducer(wrong, SUBMIT).rejection?.failingTaskIds).toEqual(['printer']);
  });
});

describe('a new case of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const diagnosing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([DIAGNOSE], DIAGNOSE.id));
  const right = (index: number): SessionAction => ({ type: 'nameCause', index: DIAGNOSE.diagnose.cases[index].cause.options.findIndex((option) => option.correct) });
  const sendTest: SessionAction = { type: 'sendPacket', fromId: 'origin', toId: 'loopback', messageId: 'ping' };

  it('starts with no sends in its history, and the send number and the clock go on', () => {
    const first = diagnosing(sendTest, sendTest, right(0));
    expect(first.history).toHaveLength(2);
    const next = sessionReducer(first, { type: 'nextCase' });
    expect([next.sent, next.history, next.sends, next.clock]).toEqual([[], [], 2, 0]);
    expect(sessionReducer(next, { type: 'sendPacket', fromId: 'origin', toId: 'typo', messageId: 'ping' }).history.map((packet) => packet.send)).toEqual([3]);
  });

  it('waits no time and edits no table, because a case offers neither', () => {
    const start = diagnosing();
    for (const move of [{ type: 'wait', seconds: 60 }, { type: 'placeEntry', tableId: 'routes', picks: {} }, { type: 'removeEntry', tableId: 'routes', entryId: 'x' }] as const) expect(sessionReducer(start, move), move.type).toBe(start);
  });
});

describe('a case with a fix', () => {
  const REPAIRABLE = repairableDiagnoseIncident();
  const { cases } = REPAIRABLE.diagnose;
  const fixed = cases.findIndex(({ fix }) => fix);
  const { fix } = cases[fixed];
  const { provider, officeRouter, backbone, server } = OFFICE_FLOORS;
  const rightOf = (index: number) => cases[index].cause.options.findIndex((option) => option.correct);
  const nameRight = (index: number): SessionAction => ({ type: 'nameCause', index: rightOf(index) });
  const nameWrong = (index: number): SessionAction => ({ type: 'nameCause', index: cases[index].cause.options.findIndex((option) => !option.correct) });
  const NEXT: SessionAction = { type: 'nextCase' };
  const sendPing: SessionAction = { type: 'sendPacket', fromId: 'origin', toId: 'server', messageId: 'ping' };
  const [removeDefault, placeServer] = fix!.solution;
  const solution = fix!.solution;
  const closing = (index: number): SessionAction[] => cases.slice(0, index).flatMap((spec, at) => [...(spec.fix?.solution ?? []), nameRight(at), NEXT]);
  const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([REPAIRABLE], REPAIRABLE.id));
  const atTheFix = (...actions: SessionAction[]): Session => playing(...closing(fixed), ...actions);
  const routesIn = (world: Network) => world.routers?.find((router) => router.id === provider.id)?.routes;
  const routesOf = (session: Session) => routesIn(session.world);
  const all = [...cases.keys()];

  it('the repair of a case does not carry over to the next case', () => {
    const repaired = atTheFix(...solution, nameRight(fixed));
    expect(caseClosed(repaired)).toBe(true);
    expect(routesOf(repaired)).toEqual([{ to: server.range, next: backbone.id }]);
    const next = sessionReducer(repaired, NEXT);
    expect(next.caseIndex).toBe(fixed + 1);
    expect(next.world).toEqual(caseWorld(next.start, cases[fixed + 1]));
    expect(routesOf(next)).toEqual(routesIn(next.start));
    expect(routesOf(next)).not.toEqual(routesOf(repaired));
    expect([next.sent, next.history, next.entryProblem, next.named]).toEqual([[], [], null, []]);
    expect(routesIn(caseWorld(next.start, cases[fixed]))).toEqual([{ to: ROUTE_DEFAULT, next: officeRouter.id }]);
  });

  it('changes the world with the moves on the tables of its fix, clears the sends and keeps the causes named, the hints and the send number', () => {
    const sent = atTheFix({ type: 'showHint' }, nameWrong(fixed), sendPing);
    expect(sent.sent).toHaveLength(1);
    const edited = sessionReducer(sent, removeDefault);
    expect(routesOf(edited)).toEqual([]);
    expect([edited.sent, edited.history]).toEqual([[], []]);
    expect([edited.named, edited.hintsShown, edited.sends]).toEqual([sent.named, 1, 1]);
    expect(edited.caseIndex).toBe(fixed);
  });

  it('edits nothing in a case with no fix, in a case already closed, once the incident is closed and with a move that is no table move', () => {
    const noFix = playing();
    for (const move of [removeDefault, placeServer, { type: 'setSetting', deviceId: 'origin', settingId: 'gateway', chipId: 'none' }] as const) expect(sessionReducer(noFix, move), move.type).toBe(noFix);
    const closed = atTheFix(...solution, nameRight(fixed));
    expect(caseClosed(closed)).toBe(true);
    for (const move of [removeDefault, { type: 'removeEntry', tableId: 'routes', entryId: server.range }, placeServer] as const) expect(sessionReducer(closed, move), move.type).toBe(closed);
    const open = atTheFix();
    expect(sessionReducer(open, { type: 'setSetting', deviceId: 'marta-laptop', settingId: 'gateway', chipId: 'none' })).toBe(open);
    expect(sessionReducer(open, { type: 'placeEntry', tableId: 'ghost', picks: {} })).toBe(open);
    expect(sessionReducer(open, { type: 'removeEntry', tableId: 'routes', entryId: 'ghost' })).toBe(open);
    expect(sessionReducer(open, { type: 'wait', seconds: 60 })).toBe(open);
  });

  it('keeps the problem of an entry the engine refuses in the case, and drops it with the next change or the next case', () => {
    const refused = atTheFix({ type: 'placeEntry', tableId: 'routes', picks: { destination: ROUTE_DEFAULT, nextHop: backbone.id } });
    expect(refused.entryProblem).toEqual({ tableId: 'routes', code: 'destination-has-route' });
    expect(routesOf(refused)).toEqual([{ to: ROUTE_DEFAULT, next: officeRouter.id }]);
    expect(sessionReducer(refused, { type: 'placeEntry', tableId: 'routes', picks: { destination: ROUTE_DEFAULT, nextHop: backbone.id } })).toBe(refused);
    expect(sessionReducer(refused, removeDefault).entryProblem).toBeNull();
    const closed = sessionReducer(playing(...closing(fixed), ...solution, nameRight(fixed)), NEXT);
    expect(closed.entryProblem).toBeNull();
  });

  it('keeps the right cause apart from the case closing: the case waits for its fix, the cause named stays the last one, and nothing else can be named', () => {
    const waiting = atTheFix(nameWrong(fixed), nameRight(fixed));
    expect(causeNamed(waiting)).toBe(true);
    expect(caseClosed(waiting)).toBe(false);
    expect(waiting.caseResults).toHaveLength(fixed);
    expect(waiting.named).toEqual([cases[fixed].cause.options.findIndex((option) => !option.correct), rightOf(fixed)]);
    expect(sessionReducer(waiting, nameWrong(fixed))).toBe(waiting);
    expect(sessionReducer(waiting, NEXT)).toBe(waiting);
    expect(failingFixTaskIds(waiting)).toEqual(['server']);
    const closed = [...solution].reduce(sessionReducer, waiting);
    expect(caseClosed(closed)).toBe(true);
    expect(closed.caseResults.at(-1)).toEqual({ picks: waiting.named, hints: 0 });
    expect(failingFixTaskIds(closed)).toEqual([]);
  });

  it('closes the case once, whichever of the cause and the fix comes last, and sending again in a closed case adds nothing', () => {
    const repairedFirst = atTheFix(...solution);
    expect(caseClosed(repairedFirst)).toBe(false);
    const byCause = sessionReducer(repairedFirst, nameRight(fixed));
    const byFix = atTheFix(nameRight(fixed), ...solution);
    for (const closed of [byCause, byFix]) {
      expect(caseClosed(closed)).toBe(true);
      expect(closed.caseResults).toHaveLength(fixed + 1);
      expect(closed.phase).toBe('playing');
      const again = sessionReducer(closed, sendPing);
      expect(again.caseResults).toEqual(closed.caseResults);
      expect(again.phase).toBe('playing');
      expect(sessionReducer(again, sendPing).caseResults).toHaveLength(fixed + 1);
    }
  });

  it('closes the incident when the last case closes by its fix, and not before', () => {
    const only = { ...REPAIRABLE, diagnose: { cases: [cases[fixed]] } };
    const last = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([only], only.id));
    const named = last(nameRight(fixed));
    expect([named.phase, caseClosed(named)]).toEqual(['playing', false]);
    const closed = last(nameRight(fixed), ...solution);
    expect(closed.phase).toBe('explaining');
    expect(closed.middle).toBe(true);
    expect(starsOf(closed)).toEqual({ closed: true, middle: true, explained: true });
    expect(sessionReducer(closed, sendPing)).toMatchObject({ phase: 'explaining', caseResults: closed.caseResults });
    expect(sessionReducer(closed, removeDefault)).toBe(closed);
  });

  it('counts a hint asked while the fix is pending in the case it belongs to', () => {
    const waiting = atTheFix(nameRight(fixed), { type: 'showHint' });
    expect(waiting.hintsShown).toBe(1);
    const closed = [...solution].reduce(sessionReducer, waiting);
    expect(closed.caseResults.at(-1)).toEqual({ picks: [rightOf(fixed)], hints: 1 });
    expect(canAskHint(closed)).toBe(false);
  });

  it('plays every case of the incident, the one with a fix included', () => {
    const everything = playing(...all.flatMap((index) => [...(cases[index].fix?.solution ?? []), nameRight(index), ...(index < cases.length - 1 ? [NEXT] : [])]));
    expect(everything.phase).toBe('explaining');
    expect(everything.caseResults).toHaveLength(cases.length);
  });
});

describe('clockSteps', () => {
  it('lists the steps of the clock of a send incident and none for an incident without a clock or of another mechanic', () => {
    const names = namesSendIncident();
    expect(clockSteps(startSession([names], names.id)).map((step) => step.seconds)).toEqual([60, 300]);
    const sending = sendIncident();
    expect(clockSteps(startSession([sending], sending.id))).toEqual([]);
    expect(clockSteps(startSession(INCIDENTS, '04-01'))).toEqual([]);
  });
});
