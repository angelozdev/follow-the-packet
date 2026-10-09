import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, solvedWorld, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { runFlows } from './flow-runs';
import { failingTaskIds, taskHolds } from './tasks';

const incident = INCIDENTS[0];
const [task] = incident.tasks;
const failing = runFlows(startWorld(INCIDENTS, incident.id), incident.flows);
const holding = runFlows(solvedWorld(INCIDENTS, incident.id), incident.flows);

describe('tasks', () => {
  it('a task holds when its required flow gets its reply and nothing forbidden gets in', () => {
    expect(taskHolds(task, failing)).toBe(false);
    expect(taskHolds(task, holding)).toBe(true);
  });

  it('a forbidden flow that gets in breaks the task even when the ping works', () => {
    const wide = applyMove(solvedWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(taskHolds(task, runFlows(wide, incident.flows))).toBe(false);
  });

  it('lists the tasks that do not hold, in the order of the incident', () => {
    expect(failingTaskIds(incident.tasks, failing)).toEqual([task.id]);
    expect(failingTaskIds(incident.tasks, holding)).toEqual([]);
  });
});
