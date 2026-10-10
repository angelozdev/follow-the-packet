import type { ExpectedOutcome, FilterTask, IncidentTask, SendTask } from '@/levels';
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

function outcomeHolds(expected: ExpectedOutcome, packet: SentPacket): boolean {
  switch (expected) {
    case 'any':
      return true;
    case 'reached':
      return packet.reached;
    default:
      return packet.trace.outcome === expected;
  }
}

function sentHolds({ expect }: SendTask, sent: SentPacket[]): boolean {
  const last = sent.find((packet) => packet.fromId === expect.fromId && packet.toId === expect.toId && packet.messageId === expect.messageId);
  return last !== undefined && outcomeHolds(expect.outcome, last) && (expect.by === undefined || last.by.includes(expect.by));
}

/** True when the task holds: a filter task when every required flow gets its reply and none of its forbidden flows reaches a device; a send task when the last packet sent with its chips has the expected result. That is the outcome of its trace (`replied`, `timeout`, `unreachable`, `ttl-exceeded`, `no-route` and the rest), `reached` (it got to the destination, with or without a reply) or `any` (it was sent); and, when the task names who (`by`), that id is among whoever answered, warned or dropped it: a device, a router, an actor or the firewalls of the device that dropped it. */
export function taskHolds(task: IncidentTask, runs: FlowRun[], sent: SentPacket[]): boolean {
  return 'expect' in task ? sentHolds(task, sent) : flowsHold(task, runs);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[], sent: SentPacket[]): string[] {
  return tasks.filter((task) => !taskHolds(task, runs, sent)).map((task) => task.id);
}
