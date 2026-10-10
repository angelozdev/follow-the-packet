import type { FilterTask, IncidentTask, SendTask } from '@/levels';
import type { FlowRun, SentPacket } from './flow-runs';

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

function flowsHold(task: FilterTask, runs: FlowRun[]): boolean {
  return runs.filter((run) => task.flowIds.includes(run.id)).every(runIsFine);
}

function sentHolds({ expect }: SendTask, sent: SentPacket[]): boolean {
  const last = sent.find((packet) => packet.fromId === expect.fromId && packet.toId === expect.toId && packet.messageId === expect.messageId);
  return last !== undefined && (expect.outcome === 'any' || last.replied);
}

/** True when the task holds: a filter task when every required flow gets its reply and none of its forbidden flows reaches a device; a send task when the last packet sent with its chips has the expected result (`replied`: its reply came back; `any`: it was sent). */
export function taskHolds(task: IncidentTask, runs: FlowRun[], sent: SentPacket[]): boolean {
  return 'expect' in task ? sentHolds(task, sent) : flowsHold(task, runs);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[], sent: SentPacket[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs, sent)).map((task) => task.id);
}
