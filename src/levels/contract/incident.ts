import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { OUTCOMES, endpointSchema, icmpTypeSchema, networkActionSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from '@/engine';

const id = z.string().min(1);
const ECHO_REQUEST = 8;

function termTextProblem(text: string): string | undefined {
  try {
    parseTermText(text);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

const termText = z.string().min(1).check((context) => {
  const problem = termTextProblem(context.value);
  if (problem) context.issues.push({ code: 'custom', message: problem, input: context.value });
});
const termIdSchema = z.custom<TermId>((value) => typeof value === 'string' && isTermId(value), 'unknown term');

export const flowKindSchema = z.enum(['required', 'forbidden', 'ambient']);

const placeRuleSchema = z.object({ type: z.literal('placeRule'), firewallId: id, whatId: id, fromId: id });
const removeRuleSchema = z.object({ type: z.literal('removeRule'), firewallId: id, ruleId: id });
const sendPacketSchema = z.object({ type: z.literal('sendPacket'), fromId: id, toId: id, messageId: id });
const ruleMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema]);

export const playerMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema, sendPacketSchema]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const filterTaskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const expectedOutcomeSchema = z.enum([...OUTCOMES, 'reached', 'any'] as const);
const sendTaskSchema = z.object({
  id,
  text: termText,
  expect: z.object({ fromId: id, toId: id, messageId: id, outcome: expectedOutcomeSchema, by: id.optional() }),
});
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const fromChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
const originChipSchema = z.object({ id, endpoint: endpointSchema });
const addressChipSchema = z.object({ id, address: id });
const messageChipSchema = z
  .object({
    id,
    label: termText,
    icmpType: icmpTypeSchema,
    command: z.enum(['packet', 'ping', 'traceroute']).optional(),
    ttl: packetSchema.shape.ttl,
  })
  .superRefine((chip, ctx) => {
    if (chip.ttl !== undefined && chip.command !== 'ping') ctx.addIssue({ code: 'custom', message: 'a TTL belongs to a ping', path: ['ttl'] });
    if ((chip.command === 'ping' || chip.command === 'traceroute') && chip.icmpType !== ECHO_REQUEST) {
      ctx.addIssue({ code: 'custom', message: `a ${chip.command} sends an Echo Request`, path: ['icmpType'] });
    }
  });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });

const common = {
  id: z.string().regex(/^\d{2}-\d{2}$/),
  chapter: z.number().int().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  role: z.enum(['defender', 'attacker']),
  lesson: z.string().min(1),
  concept: z.string().min(1),
  introduces: z.array(termIdSchema),
  base: networkSchema.optional(),
  changes: z.array(networkActionSchema).optional(),
  shown: z.array(id).min(1).optional(),
  report: termText,
  hints: z.tuple([termText, termText]),
  question: termText.optional(),
  explanation: z.tuple([optionSchema, optionSchema, optionSchema]),
  takeaway: termText,
};

const filterIncidentSchema = z.object({
  ...common,
  mechanic: z.literal('filter'),
  tasks: z.array(filterTaskSchema).min(1),
  flows: z.array(flowSchema).min(1),
  chips: z.object({ what: z.array(whatChipSchema).min(1), from: z.array(fromChipSchema).min(1) }),
  solution: z.array(ruleMoveSchema).min(1),
});

const sendIncidentSchema = z.object({
  ...common,
  mechanic: z.literal('send'),
  tasks: z.array(sendTaskSchema).min(1),
  flows: z.array(flowSchema),
  send: z.object({ from: z.array(originChipSchema).min(1), to: z.array(addressChipSchema).min(1), message: z.array(messageChipSchema).min(1) }),
  solution: z.array(sendPacketSchema).min(1),
});

type FilterShape = z.infer<typeof filterIncidentSchema>;
type SendShape = z.infer<typeof sendIncidentSchema>;
type Fail = (message: string) => void;

function repeated(values: string[]): string | undefined {
  return values.find((value, index) => values.indexOf(value) !== index);
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

function uniqueIn(fail: Fail) {
  return (name: string, values: string[]) => {
    const twice = repeated(values);
    if (twice) fail(`${name} repeated: ${twice}`);
  };
}

function checkFilter(incident: FilterShape, fail: Fail): void {
  const unique = uniqueIn(fail);
  unique('what chip id', incident.chips.what.map((c) => c.id));
  unique('from chip id', incident.chips.from.map((c) => c.id));
  const kinds = new Map(incident.flows.map((f) => [f.id, f.kind]));
  for (const task of incident.tasks) {
    for (const flowId of task.flowIds) if (!kinds.has(flowId)) fail(`${task.id}: unknown flow ${flowId}`);
    if (!task.flowIds.some((flowId) => kinds.get(flowId) === 'required')) fail(`${task.id}: needs a required flow`);
  }
  const inTasks = new Set(incident.tasks.flatMap((t) => t.flowIds));
  for (const flow of incident.flows) {
    if (flow.kind !== 'ambient' && !inTasks.has(flow.id)) fail(`${flow.id}: required and forbidden flows belong to a task`);
  }
  const whatIds = new Set(incident.chips.what.map((c) => c.id));
  const fromIds = new Set(incident.chips.from.map((c) => c.id));
  for (const move of incident.solution) {
    if (move.type === 'placeRule' && !(whatIds.has(move.whatId) && fromIds.has(move.fromId))) {
      fail(`the solution uses chips the incident does not offer: ${move.whatId}, ${move.fromId}`);
    }
  }
}

function checkSend(incident: SendShape, fail: Fail): void {
  const unique = uniqueIn(fail);
  const ids = { from: incident.send.from.map((c) => c.id), to: incident.send.to.map((c) => c.id), message: incident.send.message.map((c) => c.id) };
  unique('origin chip id', ids.from);
  unique('address chip id', ids.to);
  unique('message chip id', ids.message);
  const offers = (combination: { fromId: string; toId: string; messageId: string }) =>
    ids.from.includes(combination.fromId) && ids.to.includes(combination.toId) && ids.message.includes(combination.messageId);
  for (const task of incident.tasks) {
    if (!offers(task.expect)) fail(`${task.id}: expects chips the incident does not offer`);
  }
  for (const flow of incident.flows) {
    if (flow.kind !== 'ambient') fail(`${flow.id}: a send incident has only ambient flows`);
  }
  for (const move of incident.solution) {
    if (!offers(move)) fail(`the solution uses chips the incident does not offer: ${move.fromId}, ${move.toId}, ${move.messageId}`);
  }
}

export const incidentSchema = z.discriminatedUnion('mechanic', [filterIncidentSchema, sendIncidentSchema]).superRefine((incident, ctx) => {
  const fail: Fail = (message) => ctx.addIssue({ code: 'custom', message });
  const unique = uniqueIn(fail);
  if ((incident.base === undefined) === (incident.changes === undefined)) fail('an incident has either a base world or changes');
  if (incident.id !== `${twoDigits(incident.chapter)}-${twoDigits(incident.order)}`) fail(`id ${incident.id} must be chapter-order`);
  unique('introduced term', incident.introduces);
  unique('flow id', incident.flows.map((f) => f.id));
  unique('task id', incident.tasks.map((t) => t.id));
  unique('shown id', incident.shown ?? []);
  if (incident.explanation.filter((option) => option.correct).length !== 1) fail('exactly one explanation is correct');
  if (incident.mechanic === 'filter') checkFilter(incident, fail);
  else checkSend(incident, fail);
});

export type Incident = z.infer<typeof incidentSchema>;
export type Mechanic = Incident['mechanic'];
export type FilterIncident = Extract<Incident, { mechanic: 'filter' }>;
export type SendIncident = Extract<Incident, { mechanic: 'send' }>;
export type Flow = Incident['flows'][number];
export type FlowKind = z.infer<typeof flowKindSchema>;
export type IncidentTask = Incident['tasks'][number];
export type FilterTask = FilterIncident['tasks'][number];
export type SendTask = SendIncident['tasks'][number];
export type WhatChip = FilterIncident['chips']['what'][number];
export type FromChip = FilterIncident['chips']['from'][number];
export type OriginChip = SendIncident['send']['from'][number];
export type AddressChip = SendIncident['send']['to'][number];
export type MessageChip = SendIncident['send']['message'][number];
export type ExpectedOutcome = SendTask['expect']['outcome'];
export type PlayerMove = z.infer<typeof playerMoveSchema>;
export type SendMove = z.infer<typeof sendPacketSchema>;
export type ExplanationOption = Incident['explanation'][number];
export type LevelEntry = Pick<Incident, 'id' | 'chapter' | 'order' | 'title' | 'role'>;
export type LevelRole = Incident['role'];

/** Returns the id a rule gets when the player places it from two chips. */
export function ruleIdFor(whatId: string, fromId: string): string {
  return `${whatId}-from-${fromId}`;
}

/** Validates an incident file and returns it typed; throws with every problem when the file is wrong. */
export function defineIncident(input: z.input<typeof incidentSchema>): Incident {
  return incidentSchema.parse(input);
}
