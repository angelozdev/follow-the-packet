import type { IncidentTask } from '@/levels';
import type { FlowRun } from './flow-runs';

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

/** True when every required flow of the task gets its reply and none of its forbidden flows reaches a device. */
export function taskHolds(task: IncidentTask, runs: FlowRun[]): boolean {
  return runs.filter((run) => task.flowIds.includes(run.id)).every(runIsFine);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs)).map((task) => task.id);
}
