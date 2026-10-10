import type { ExpectedOutcome, IdentifyTask, IncidentTask, SendTask } from '@/levels';
import type { FlowRun, SentPacket } from './flow-runs';

/** What the player confirmed on the cards of an identify incident: the id of the chip picked, by device and then by tray. */
export type Answers = Record<string, Record<string, string>>;

const NO_ANSWERS: Answers = {};

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

function flowsHold(flowIds: string[], runs: FlowRun[]): boolean {
  return runs.filter((run) => flowIds.includes(run.id)).every(runIsFine);
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

function answerHolds({ deviceId, trayId, chipId }: IdentifyTask['expect'], answers: Answers): boolean {
  return answers[deviceId]?.[trayId] === chipId;
}

function isIdentifyTask(task: SendTask | IdentifyTask): task is IdentifyTask {
  return 'chipId' in task.expect;
}

/** True when the task holds: a filter task when every required flow gets its reply and none of its forbidden flows reaches a device; an identify task when the chip confirmed for its device and tray (`answers`) is the one it expects; a send task when the last packet sent with its chips has the expected result. That is the outcome of its trace (`replied`, `timeout`, `unreachable`, `ttl-exceeded`, `no-route` and the rest), `reached` (it got to the destination, with or without a reply) or `any` (it was sent); and, when the task names who (`by`), that id is among whoever answered, warned or dropped it: a device, a router, an actor or the firewalls of the device that dropped it. */
export function taskHolds(task: IncidentTask, runs: FlowRun[], sent: SentPacket[], answers: Answers = NO_ANSWERS): boolean {
  if ('flowIds' in task) return flowsHold(task.flowIds, runs);
  return isIdentifyTask(task) ? answerHolds(task.expect, answers) : sentHolds(task, sent);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[], sent: SentPacket[], answers: Answers = NO_ANSWERS): string[] {
  return tasks.filter((task) => !taskHolds(task, runs, sent, answers)).map((task) => task.id);
}
