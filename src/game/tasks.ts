import type { IncidentTask } from '@/levels';
import type { FlowRun } from './flow-runs';

export const STABLE_MS = 3000;

function runIsFine(run: FlowRun): boolean {
  switch (run.kind) {
    case 'required':
      return run.replied;
    case 'forbidden':
      return !run.reached;
    case 'ambient':
      return true;
  }
}

/** True when every required flow of the task gets its reply and none of its forbidden flows reaches a server. */
export function taskHolds(task: IncidentTask, runs: FlowRun[]): boolean {
  return runs.filter((run) => task.flowIds.includes(run.id)).every(runIsFine);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs)).map((task) => task.id);
}

/** Adds the elapsed milliseconds to each task that holds, up to STABLE_MS, and drops the ones that broke back to zero. */
export function advanceTasks(tasks: IncidentTask[], runs: FlowRun[], elapsed: Record<string, number>, ms: number): Record<string, number> {
  return Object.fromEntries(tasks.map((task) => [task.id, taskHolds(task, runs) ? Math.min(STABLE_MS, (elapsed[task.id] ?? 0) + ms) : 0]));
}

export function isStable(ms: number): boolean {
  return ms >= STABLE_MS;
}
