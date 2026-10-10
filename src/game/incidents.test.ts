import { describe, expect, it } from 'vitest';
import type { Network } from '@/engine';
import { INCIDENTS, applyMove, isGuided, startWorld, type FilterIncident, type GuidedIncident } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { EVERY_TERM, filterIncident } from '@/testing';
import { runFlows } from './flow-runs';
import { sessionReducer, startSession, starsOf } from './session';
import { isTight } from './stars';
import { taskHolds } from './tasks';

function holdsAll(of: FilterIncident, world: Network): boolean {
  const runs = runFlows(world, of.flows, EVERY_TERM);
  return of.tasks.every((task) => taskHolds(task, runs, []));
}

describe.each(INCIDENTS.filter(isGuided).map((i): [string, GuidedIncident] => [i.id, i]))('incident %s', (id, of) => {
  const start = startSession(INCIDENTS, id);

  it('starts with a task to fix', () => {
    expect(of.tasks.some((task) => !taskHolds(task, start.runs, start.sent, start.answers))).toBe(true);
  });

  it('its reference solution fixes every task and earns every star but the explanation', () => {
    const solved = [...of.solution, { type: 'submit' } as const].reduce(sessionReducer, start);
    expect(solved.phase).toBe('explaining');
    expect(starsOf(solved)).toMatchObject({ closed: true, middle: true });
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
    expect(runFlows(world, first.flows, EVERY_TERM).find((run) => run.kind === 'forbidden')?.reached).toBe(true);
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
