import { describe, expect, it } from 'vitest';
import type { Network, Outcome } from '@/engine';
import { INCIDENTS, applyMove, startWorld, type FilterIncident, type Incident } from '@/levels';
import { ADDRESS, MESSAGE, ORIGIN } from '@/levels/01-first-day/shared';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing';
import { runFlows } from './flow-runs';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { isTight } from './stars';
import { taskHolds } from './tasks';

function holdsAll(of: FilterIncident, world: Network): boolean {
  const runs = runFlows(world, of.flows);
  return of.tasks.every((task) => taskHolds(task, runs, []));
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (id, of) => {
  const start = startSession(INCIDENTS, id);

  it('starts with a task to fix', () => {
    expect(of.tasks.some((task) => !taskHolds(task, start.runs, start.sent))).toBe(true);
  });

  it('its reference solution fixes every task and earns every star but the explanation', () => {
    const solved = [...of.solution, { type: 'submit' } as const].reduce(sessionReducer, start);
    expect(solved.phase).toBe('explaining');
    expect(starsOf(solved)).toMatchObject({ closed: true, middle: true });
  });
});

const THE_ADDRESS = '01-01';
const THERE_AND_BACK = '01-02';
const REPLIED: Outcome = 'replied';

function sendFromYou(incidentId: string, toId: string, messageId: string): Session {
  return sessionReducer(startSession(INCIDENTS, incidentId), { type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId });
}

function outcomesOf(session: Session): Outcome[] {
  return session.sent.map((packet) => packet.trace.outcome);
}

function taskIsDone(session: Session): boolean {
  return session.incident.tasks.every((task) => taskHolds(task, session.runs, session.sent));
}

describe('01-01, the address', () => {
  it('a ping to the printer comes back and completes the task', () => {
    const session = sendFromYou(THE_ADDRESS, ADDRESS.printer.id, MESSAGE.ping.id);
    expect(outcomesOf(session)).toEqual([REPLIED]);
    expect(taskIsDone(session)).toBe(true);
  });

  it.each([
    ['the laptop of Lucía, which also answers', ADDRESS.lucia.id, REPLIED],
    ['an address no device has', ADDRESS.nobody.id, 'lost'],
  ])('a ping to %s does not complete it: only the printer does', (_, toId, outcome) => {
    const session = sendFromYou(THE_ADDRESS, toId, MESSAGE.ping.id);
    expect(outcomesOf(session)).toEqual([outcome]);
    expect(taskIsDone(session)).toBe(false);
  });
});

describe('01-02, there and back', () => {
  it('an Echo Request to the laptop of Lucía comes back and completes the task', () => {
    const session = sendFromYou(THERE_AND_BACK, ADDRESS.lucia.id, MESSAGE.echoRequest.id);
    expect(outcomesOf(session)).toEqual([REPLIED]);
    expect(taskIsDone(session)).toBe(true);
  });

  it('an Echo Reply to the laptop of Lucía arrives with no reply back, so the task stays open', () => {
    const session = sendFromYou(THERE_AND_BACK, ADDRESS.lucia.id, MESSAGE.echoReply.id);
    expect(session.sent).toMatchObject([{ reached: true, replied: false, blocked: false, trace: { outcome: 'arrived-no-reply' } }]);
    expect(taskIsDone(session)).toBe(false);
    expect(sessionReducer(session, { type: 'submit' }).rejection?.failingTaskIds).toEqual(session.incident.tasks.map((task) => task.id));
  });
});

describe('04-01, the first ping', () => {
  const first = filterIncident('04-01');
  const start = startWorld(INCIDENTS, first.id);

  it('a rule on the Security Group of servidor1 does not help: the destination decides', () => {
    const world = applyMove(start, first, { type: 'placeRule', firewallId: SG.servidor1, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id });
    expect(holdsAll(first, world)).toBe(false);
  });

  it('ping from all of internet lets the attacker reach servidor2', () => {
    const world = applyMove(start, first, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(runFlows(world, first.flows).find((run) => run.kind === 'forbidden')?.reached).toBe(true);
    expect(holdsAll(first, world)).toBe(false);
  });
});

describe('04-02, only what is needed', () => {
  const second = filterIncident('04-02');
  const start = startWorld(INCIDENTS, second.id);
  const fromServer1 = (whatId: string) => applyMove(start, second, { type: 'placeRule', firewallId: SG.servidor2, whatId, fromId: FROM.sgServidor1.id });
  const withoutDayShift = (world: Network) => applyMove(world, second, { type: 'removeRule', firewallId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id });

  it('the way back (Echo Reply) does not let the ping in', () => {
    expect(holdsAll(second, fromServer1(WHAT.echoReply.id))).toBe(false);
  });

  it('keeping the day-shift Echo Reply fixes the task but opens too much', () => {
    const world = fromServer1(WHAT.echoRequest.id);
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });

  it('the full ping from servidor1 opens too much', () => {
    const world = withoutDayShift(fromServer1(WHAT.allIcmp.id));
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });
});
