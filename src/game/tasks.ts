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

function addressesOf({ trace }: SentPacket): string[] {
  if (trace.dns?.usedHostsFile) return trace.resolvedIp === null ? [] : [trace.resolvedIp];
  return (trace.dns?.answers ?? []).flatMap((record) => (record.type === 'A' ? [record.value] : []));
}

function answerHolds({ ip, alias }: NonNullable<SendTask['expect']['answer']>, packet: SentPacket): boolean {
  const aliased = (packet.trace.dns?.answers ?? []).some((record) => record.type === 'CNAME');
  const addresses = addressesOf(packet);
  const ipHolds = ip === undefined || addresses.includes(ip);
  const aliasHolds = alias === undefined || (alias ? aliased : !aliased && addresses.length > 0);
  return ipHolds && aliasHolds;
}

function dnsHolds({ answer, status }: SendTask['expect'], packet: SentPacket): boolean {
  return (status === undefined || packet.trace.dns?.status === status) && (answer === undefined || answerHolds(answer, packet));
}

function bodyHolds({ body }: SendTask['expect'], packet: SentPacket): boolean {
  return body === undefined || packet.trace.app?.response?.body === body;
}

function statusCodeHolds({ statusCode }: SendTask['expect'], packet: SentPacket): boolean {
  return statusCode === undefined || packet.trace.app?.response?.statusCode === statusCode;
}

function sentHolds({ expect }: SendTask, history: SentPacket[]): boolean {
  const sends = history.filter((packet) => packet.fromId === expect.fromId && packet.toId === expect.toId && packet.messageId === expect.messageId);
  const chosen = expect.nth === undefined ? sends.at(-1) : sends[expect.nth - 1];
  return chosen !== undefined && outcomeHolds(expect.outcome, chosen) && (expect.by === undefined || chosen.by.includes(expect.by)) && dnsHolds(expect, chosen) && bodyHolds(expect, chosen) && statusCodeHolds(expect, chosen);
}

function pickHolds({ deviceId, trayId, chipId }: IdentifyTask['expect'], answers: Answers): boolean {
  return answers[deviceId]?.[trayId] === chipId;
}

function isIdentifyTask(task: SendTask | IdentifyTask): task is IdentifyTask {
  return 'chipId' in task.expect;
}

/** True when the task holds: a filter task when every required flow gets its reply and none of its forbidden flows reaches a device; an identify task when the chip confirmed for its device and tray (`answers`) is the one it expects; a send task when the send of its chips that it looks at (the last one, or the nth since the world last changed when it says `nth`, which a later send does not undo) has the expected result. That is the outcome of its trace (`replied`, `timeout`, `unreachable`, `ttl-exceeded`, `no-route` and the rest), `reached` (it got to the destination, with or without a reply) or `any` (it was sent); when the task names who (`by`), that id is among whoever answered, warned or dropped it: a device, a router, an actor or the firewalls of the device that dropped it; and, when it says what the DNS answered, the trace agrees. An expected `answer.ip` is among the addresses the name resolved to (the A records of the answer, or the address the hosts file gave); `answer.alias: true` asks for a CNAME in the answer and `answer.alias: false` for an address that came with none, so a name nobody answered holds neither; `status` is the status of the answer (`NXDOMAIN`, `SERVFAIL`); `body` is the body of the response of the web service, and `statusCode` its status code (200, 400 or 404), which a message that got no response does not have. `history` is every send since the world last changed, in order (`Session.history`); the list of the last send of each combination (`Session.sent`) is enough for a task that does not say `nth`. */
export function taskHolds(task: IncidentTask, runs: FlowRun[], history: SentPacket[], answers: Answers = NO_ANSWERS): boolean {
  if ('flowIds' in task) return flowsHold(task.flowIds, runs);
  return isIdentifyTask(task) ? pickHolds(task.expect, answers) : sentHolds(task, history);
}

/** Returns the ids of the tasks that do not hold, in the order of the incident. */
export function failingTaskIds(tasks: IncidentTask[], runs: FlowRun[], history: SentPacket[], answers: Answers = NO_ANSWERS): string[] {
  return tasks.filter((task) => !taskHolds(task, runs, history, answers)).map((task) => task.id);
}
