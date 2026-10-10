import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident, officeNet, sendIncident } from '@/testing';
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
  const sent = (fromId: string, toId: string, messageId: string): SentPacket[] => {
    const packet = sendPacket(officeNet(), sending, { type: 'sendPacket', fromId, toId, messageId }, 1);
    return packet ? [packet] : [];
  };

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
});
