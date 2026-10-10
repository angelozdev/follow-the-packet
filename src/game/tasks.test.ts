import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import type { Network, Outcome } from '@/engine';
import type { MessageChip, SendIncident, SendTask } from '@/levels';
import { OFFICE_FLOORS, device, filterIncident, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import { runFlows, sendPacket, type SentPacket } from './flow-runs';
import { failingTaskIds, taskHolds } from './tasks';

const incident = filterIncident('04-01');
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing, [])).toBe(false);
    expect(taskHolds(task, holding, [])).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows), [])).toBe(false);
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
    const packet = sendPacket(world, incident, { type: 'sendPacket', fromId, toId, messageId }, 1);
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
  const sentFrom = (toId: string, messageId: string) => sendPacket(world, incident, { type: 'sendPacket', fromId: 'you', toId, messageId }, 1);
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
    const packet = sendPacket(unplugged, incident, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' }, 1);
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
    const packet = sendPacket(unplugged, incident, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'trace' }, 1);
    expect(packet?.route?.lines).toEqual([]);
    expect(holds(packet, task('server', 'trace', 'no-route', 'your-laptop'))).toBe(true);
  });
});
