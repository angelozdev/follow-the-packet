import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { applyAction, type Network, type Outcome } from '@/engine';
import type { MessageChip, SendIncident, SendTask } from '@/levels';
import { EVERY_TERM, NAME_SERVER_PIECES, OFFICE_FLOORS, device, filterIncident, identifyIncident, namesSendIncident, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import { lastOfEach, runFlows, sendPacket, sendSequence, type Dispatch, type SentPacket } from './flow-runs';
import { failingTaskIds, taskHolds } from './tasks';

const incident = filterIncident('04-01');
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows, EVERY_TERM);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows, EVERY_TERM);

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing, [])).toBe(false);
    expect(taskHolds(task, holding, [])).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows, EVERY_TERM), [])).toBe(false);
  });

  it('lists the tasks that do not hold, in the order of the incident', () => {
    expect(failingTaskIds(incident.tasks, failing, [])).toEqual([task.id]);
    expect(failingTaskIds(incident.tasks, holding, [])).toEqual([]);
  });
});

describe('send tasks', () => {
  const sending = sendIncident();
  const [printer, outside] = sending.tasks;
  const sent = (fromId: string, toId: string, messageId: string, world: Network = officeNet(), incident: SendIncident = sending): SentPacket[] => {
    const packet = sendPacket(world, incident, { type: 'sendPacket', fromId, toId, messageId }, 1, EVERY_TERM);
    return packet ? [packet] : [];
  };
  const expecting = (toId: string, messageId: string, outcome: SendTask['expect']['outcome'], by?: string): SendTask => ({
    ...printer,
    expect: { fromId: 'you', toId, messageId, outcome, by },
  });
  const guarded = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });

  it('a task that expects the reply holds only when the reply of its combination came back', () => {
    expect(taskHolds(printer, [], [])).toBe(false);
    expect(taskHolds(printer, [], sent('you', 'printer', 'reply'))).toBe(false);
    expect(taskHolds(printer, [], sent('you', 'printer', 'ping'))).toBe(true);
  });

  it('a task that expects the reply fails when its own combination was sent and got no reply, and one that expects any result holds', () => {
    const toNobody = { ...printer, expect: { ...printer.expect, toId: 'nobody' } };
    const unanswered = sent('you', 'nobody', 'ping');
    expect(unanswered[0].replied).toBe(false);
    expect(taskHolds(toNobody, [], unanswered)).toBe(false);
    expect(taskHolds({ ...toNobody, expect: { ...toNobody.expect, outcome: 'any' } }, [], unanswered)).toBe(true);
  });

  it('a task that expects any result holds as soon as its combination is sent, even when the packet is lost', () => {
    const lost = sent('attacker', 'lucia', 'ping');
    expect(lost[0].reached).toBe(false);
    expect(taskHolds(outside, [], lost)).toBe(true);
    expect(failingTaskIds(sending.tasks, [], lost)).toEqual([printer.id]);
  });

  it('a send task holds when the last packet with its chips ends in the expected outcome and by the expected id', () => {
    const silenced = sent('you', 'lucia', 'ping', guarded);
    expect(silenced[0].trace.outcome).toBe('timeout');
    expect(taskHolds(expecting('lucia', 'ping', 'timeout', 'fw-lucia'), [], silenced)).toBe(true);
    expect(taskHolds(expecting('lucia', 'ping', 'timeout'), [], silenced)).toBe(true);
    expect(taskHolds(expecting('lucia', 'ping', 'timeout', 'lucia-laptop'), [], silenced)).toBe(false);
    expect(taskHolds(expecting('lucia', 'ping', 'timeout', 'fw-lucia'), [], [])).toBe(false);

    const warned = sent('you', 'nobody', 'ping');
    expect(taskHolds(expecting('nobody', 'ping', 'unreachable', 'your-laptop'), [], warned)).toBe(true);
    expect(taskHolds(expecting('nobody', 'ping', 'unreachable', 'printer'), [], warned)).toBe(false);
    expect(taskHolds(expecting('nobody', 'ping', 'timeout', 'your-laptop'), [], warned)).toBe(false);

    const answered = sent('you', 'printer', 'ping');
    expect(taskHolds(expecting('printer', 'ping', 'replied', 'printer'), [], answered)).toBe(true);
    expect(taskHolds(expecting('printer', 'ping', 'replied', 'lucia-laptop'), [], answered)).toBe(false);
  });

  it('an expected outcome of reached holds when the packet got to the destination, with or without a reply', () => {
    const withReply = sent('you', 'printer', 'ping');
    const withoutReply = sent('you', 'printer', 'reply');
    expect(withReply[0].replied).toBe(true);
    expect(withoutReply[0].replied).toBe(false);
    expect(taskHolds(expecting('printer', 'ping', 'reached', 'printer'), [], withReply)).toBe(true);
    expect(taskHolds(expecting('printer', 'reply', 'reached', 'printer'), [], withoutReply)).toBe(true);
    expect(taskHolds(expecting('printer', 'reply', 'reached'), [], sent('you', 'printer', 'reply', guarded))).toBe(true);
  });

  it('an expected outcome of reached does not hold when the packet never got to the destination', () => {
    expect(taskHolds(expecting('lucia', 'ping', 'reached'), [], sent('you', 'lucia', 'ping', guarded))).toBe(false);
    expect(taskHolds({ ...expecting('lucia', 'ping', 'reached'), expect: { fromId: 'attacker', toId: 'lucia', messageId: 'ping', outcome: 'reached' } }, [], sent('attacker', 'lucia', 'ping'))).toBe(false);
    expect(taskHolds(expecting('lucia', 'ping', 'reached'), [], [])).toBe(false);
  });

  it('a task that expects silence does not hold when something came back', () => {
    expect(taskHolds(expecting('printer', 'ping', 'timeout'), [], sent('you', 'printer', 'ping'))).toBe(false);
    expect(taskHolds(expecting('nobody', 'ping', 'timeout'), [], sent('you', 'nobody', 'ping'))).toBe(false);
    expect(taskHolds(expecting('lucia', 'ping', 'timeout'), [], sent('you', 'lucia', 'ping', guarded))).toBe(true);
  });

  it('a task that expects the exact outcome does not hold for a different one, whatever the answer', () => {
    const outcomes: Outcome[] = ['replied', 'unreachable', 'ttl-exceeded', 'no-route', 'lost'];
    const warned = sent('you', 'nobody', 'ping');
    expect(outcomes.filter((outcome) => taskHolds(expecting('nobody', 'ping', outcome), [], warned))).toEqual(['unreachable']);
  });
});

describe('send tasks in an office with routers', () => {
  const { server, officeRouter } = OFFICE_FLOORS;
  const ping = (id: string, ttl?: number): MessageChip => ({ id, label: id, icmpType: 8, command: 'ping', ...(ttl !== undefined && { ttl }) });
  const traceroute: MessageChip = { id: 'trace', label: 'traceroute', icmpType: 8, command: 'traceroute' };
  const world = officeTwoFloorsNet();
  const incident: SendIncident = {
    ...sendIncident(),
    base: world,
    send: {
      from: [{ id: 'you', endpoint: device('your-laptop') }],
      to: [{ id: 'server', address: server.ip }, { id: 'lost', address: '10.0.0.10' }],
      message: [ping('ping'), ping('ping-1', 1), traceroute],
    },
  };
  const sentFrom = (toId: string, messageId: string) => sendPacket(world, incident, { type: 'sendPacket', fromId: 'you', toId, messageId }, 1, EVERY_TERM);
  const task = (toId: string, messageId: string, outcome: SendTask['expect']['outcome'], by?: string): SendTask => ({
    id: 'task',
    text: 'Una tarea.',
    expect: { fromId: 'you', toId, messageId, outcome, by },
  });
  const holds = (packet: SentPacket | null, expected: SendTask) => taskHolds(expected, [], packet ? [packet] : []);

  it('a ping answered by an actor holds by the id of that actor', () => {
    const packet = sentFrom('server', 'ping');
    expect(holds(packet, task('server', 'ping', 'replied', server.id))).toBe(true);
    expect(holds(packet, task('server', 'ping', 'replied', officeRouter.id))).toBe(false);
  });

  it('a ping whose TTL runs out holds by the id of the router that warned', () => {
    const packet = sentFrom('server', 'ping-1');
    expect(packet?.packet.ttl).toBe(1);
    expect(holds(packet, task('server', 'ping-1', 'ttl-exceeded', officeRouter.id))).toBe(true);
    expect(holds(packet, task('server', 'ping-1', 'ttl-exceeded', server.id))).toBe(false);
  });

  it('a private address dropped by the first router outside the office holds as silence by that router', () => {
    const packet = sentFrom('lost', 'ping');
    expect(holds(packet, task('lost', 'ping', 'timeout', OFFICE_FLOORS.provider.id))).toBe(true);
    expect(holds(packet, task('lost', 'ping', 'timeout', officeRouter.id))).toBe(false);
  });

  it('a laptop with no default gateway holds as a local error by that laptop', () => {
    const unplugged = withDevice(world, 'your-laptop', { gateway: undefined });
    const packet = sendPacket(unplugged, incident, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' }, 1, EVERY_TERM);
    expect(holds(packet, task('server', 'ping', 'no-route', 'your-laptop'))).toBe(true);
    expect(holds(packet, task('server', 'ping', 'no-route', server.id))).toBe(false);
  });

  it('a traceroute is sent as a run with the lines of its probes, and a task that expects any result holds', () => {
    const packet = sentFrom('server', 'trace');
    expect(packet?.route?.lines.at(-1)).toMatchObject({ ip: server.ip, reached: true });
    expect(holds(packet, task('server', 'trace', 'any'))).toBe(true);
    expect(holds(packet, task('server', 'trace', 'replied', server.id))).toBe(true);
    expect(holds(null, task('server', 'trace', 'any'))).toBe(false);
  });

  it('a single packet carries no traceroute lines', () => {
    expect(sentFrom('server', 'ping')?.route).toBeUndefined();
  });

  it('a traceroute that ends in a local error has no lines and holds as that error', () => {
    const unplugged = withDevice(world, 'your-laptop', { gateway: undefined });
    const packet = sendPacket(unplugged, incident, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'trace' }, 1, EVERY_TERM);
    expect(packet?.route?.lines).toEqual([]);
    expect(holds(packet, task('server', 'trace', 'no-route', 'your-laptop'))).toBe(true);
  });
});

describe('identify tasks', () => {
  const identifying = identifyIncident();
  const [guest, printer] = identifying.tasks;

  it('holds when the chip confirmed for its device and tray is the one it expects, and no other', () => {
    expect(taskHolds(printer, [], [], { printer: { ip: 'right' } })).toBe(true);
    expect(taskHolds(printer, [], [], { printer: { ip: 'note' } })).toBe(false);
    expect(taskHolds(printer, [], [], { 'guest-laptop': { ip: 'right' } })).toBe(false);
    expect(taskHolds(printer, [], [], { printer: { other: 'right' } })).toBe(false);
  });

  it('does not hold with nothing confirmed, and lists the open ones in the order of the incident', () => {
    expect(taskHolds(guest, [], [])).toBe(false);
    expect(failingTaskIds(identifying.tasks, [], [], { 'guest-laptop': { 'in-network': 'no' } })).toEqual([printer.id]);
    expect(failingTaskIds(identifying.tasks, [], [], { 'guest-laptop': { 'in-network': 'no' }, printer: { ip: 'right' } })).toEqual([]);
  });
});

describe('send tasks that expect what the DNS answered', () => {
  const NAMES = namesSendIncident();
  const { zone, site } = NAME_SERVER_PIECES;
  const OTHER_IP = '198.51.100.51';
  const addresses = [{ id: 'blog', address: `blog.${zone}` }, { id: 'down', address: `www.${NAME_SERVER_PIECES.downZone}` }, { id: 'broken', address: `rota.${zone}` }];
  const NAMED = { ...NAMES, send: { ...NAMES.send, to: [...NAMES.send.to, ...addresses] } };
  const world = startWorld([NAMED], NAMED.id);
  const [www] = NAMES.tasks;
  const asking = (toId: string, expect: Partial<SendTask['expect']>, messageId = 'dig'): SendTask => ({ ...www, expect: { fromId: 'you', toId, messageId, outcome: 'replied', ...expect } });
  const dispatch = (toId: string, at: number, messageId = 'dig'): Dispatch => ({ move: { type: 'sendPacket', fromId: 'you', toId, messageId }, send: at + 1, at });
  const sentAfter = (net: Network, ...dispatches: Dispatch[]): SentPacket[] => lastOfEach(sendSequence(net, NAMED, dispatches, EVERY_TERM));
  const holds = (task: SendTask, sent: SentPacket[]) => taskHolds(task, [], sent);

  it('a send task holds when the last dig answers with the expected ip', () => {
    const answered = sentAfter(world, dispatch('www', 0));
    expect(holds(asking('www', { answer: { ip: site } }), answered)).toBe(true);
    expect(holds(asking('www', { answer: { ip: OTHER_IP } }), answered)).toBe(false);
    expect(holds(asking('www', { answer: { ip: site } }), [])).toBe(false);
    expect(holds(asking('www', { answer: { ip: site } }), sentAfter(world, dispatch('www', 0), dispatch('www', 60)))).toBe(true);
    expect(holds(asking('missing', { answer: { ip: site } }), sentAfter(world, dispatch('missing', 0)))).toBe(false);
    expect(holds(asking('www', { answer: { ip: site }, by: 'ghost' }), answered)).toBe(false);
  });

  it('an expected ip holds for a name the hosts file answered and for a ping by name', () => {
    const hosted = applyAction(world, { type: 'setHosts', deviceId: 'your-laptop', hosts: [{ name: `www.${zone}`, ip: OTHER_IP }] });
    const pinged = sentAfter(hosted, dispatch('www', 0, 'ping'));
    expect(pinged[0].trace.dns?.usedHostsFile).toBe(true);
    expect(holds(asking('www', { outcome: 'any', answer: { ip: OTHER_IP } }, 'ping'), pinged)).toBe(true);
    expect(holds(asking('www', { outcome: 'any', answer: { ip: site } }, 'ping'), pinged)).toBe(false);
    expect(holds(asking('www', { outcome: 'any', answer: { ip: site } }, 'ping'), sentAfter(world, dispatch('www', 0, 'ping')))).toBe(true);
  });

  it('an expected alias holds only when the answer came through a cname', () => {
    const throughAlias = sentAfter(world, dispatch('blog', 0));
    const direct = sentAfter(world, dispatch('www', 0));
    expect(holds(asking('blog', { answer: { alias: true } }), throughAlias)).toBe(true);
    expect(holds(asking('blog', { answer: { alias: false } }), throughAlias)).toBe(false);
    expect(holds(asking('www', { answer: { alias: true } }), direct)).toBe(false);
    expect(holds(asking('www', { answer: { alias: false } }), direct)).toBe(true);
    expect(holds(asking('blog', { answer: { alias: true, ip: site } }), throughAlias)).toBe(true);
    expect(holds(asking('blog', { answer: { alias: true, ip: OTHER_IP } }), throughAlias)).toBe(false);
    const cached = sentAfter(world, dispatch('blog', 0), dispatch('blog', 30));
    expect(cached[0].trace.dns?.fromCache).toBe(true);
    expect(holds(asking('blog', { answer: { alias: true } }), cached)).toBe(true);
  });

  it('an expected alias that is not there does not hold when nobody answered', () => {
    const silent = applyAction(world, { type: 'setDnsServer', deviceId: 'your-laptop' });
    const nobody = sentAfter(silent, dispatch('www', 0));
    expect(nobody[0].trace.dns?.status).toBe('NO-RESOLVER');
    expect(holds(asking('www', { outcome: 'any', answer: { alias: false } }), nobody)).toBe(false);
    expect(holds(asking('www', { outcome: 'any', answer: { alias: false } }), sentAfter(silent, dispatch('missing', 0)))).toBe(false);
    expect(holds(asking('missing', { answer: { alias: false } }), sentAfter(world, dispatch('missing', 0)))).toBe(false);
  });

  it('an expected status holds when the dig ended with it', () => {
    const missing = sentAfter(world, dispatch('missing', 0));
    expect(holds(asking('missing', { status: 'NXDOMAIN' }), missing)).toBe(true);
    expect(holds(asking('missing', { status: 'SERVFAIL' }), missing)).toBe(false);
    expect(holds(asking('www', { status: 'NXDOMAIN' }), sentAfter(world, dispatch('www', 0)))).toBe(false);
    expect(holds(asking('down', { status: 'SERVFAIL' }), sentAfter(world, dispatch('down', 0)))).toBe(true);
    expect(holds(asking('down', { status: 'NXDOMAIN' }), sentAfter(world, dispatch('down', 0)))).toBe(false);
    expect(holds(asking('missing', { status: 'NXDOMAIN' }), [])).toBe(false);
    expect(holds(asking('missing', { status: 'NXDOMAIN', outcome: 'timeout' }), missing)).toBe(false);
    expect(holds(asking('lucia', { status: 'NXDOMAIN', outcome: 'any' }, 'ping'), sentAfter(world, dispatch('lucia', 0, 'ping')))).toBe(false);
  });

  it('an expected status and an expected answer must both hold', () => {
    const blog = sentAfter(world, dispatch('blog', 0));
    expect(holds(asking('blog', { status: 'NXDOMAIN', answer: { alias: true } }), blog)).toBe(false);
    expect(holds(asking('missing', { status: 'NXDOMAIN', answer: { alias: true } }), sentAfter(world, dispatch('missing', 0)))).toBe(false);
    const dangling = applyAction(world, { type: 'addRecord', serverId: NAME_SERVER_PIECES.authoritative.id, record: { name: `rota.${zone}`, type: 'CNAME', value: `nadie.${zone}`, ttl: 300 } });
    const broken = sentAfter(dangling, dispatch('broken', 0));
    expect(holds(asking('broken', { status: 'NXDOMAIN', answer: { alias: true } }), broken)).toBe(true);
    expect(holds(asking('broken', { status: 'NXDOMAIN', answer: { alias: false } }), broken)).toBe(false);
  });
});
