import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { STABLE_MS, advanceTasks, isStable, taskHolds } from './tasks';

const incident = INCIDENTS[0];
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);
const SOME_MS = 2500;
const STEP_MS = 1000;

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing)).toBe(false);
    expect(taskHolds(task, holding)).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows))).toBe(false);
  });

  it('adds time while the task holds, up to STABLE_MS', () => {
    expect(advanceTasks(incident.tasks, holding, { [task.id]: SOME_MS }, STEP_MS)).toEqual({ [task.id]: STABLE_MS });
  });

  it('drops to zero when the task breaks', () => {
    expect(advanceTasks(incident.tasks, failing, { [task.id]: SOME_MS }, STEP_MS)).toEqual({ [task.id]: 0 });
  });

  it('is stable from STABLE_MS on', () => {
    expect(isStable(STABLE_MS - 1)).toBe(false);
    expect(isStable(STABLE_MS)).toBe(true);
  });
});
