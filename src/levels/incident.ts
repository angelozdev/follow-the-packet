import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { networkActionSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema } from '@/engine';

const id = z.string().min(1);

function isTermText(text: string): boolean {
  try {
    parseTermText(text);
    return true;
  } catch {
    return false;
  }
}

const termText = z.string().min(1).refine(isTermText, 'unknown term tag');
const termIdSchema = z.custom<TermId>((value) => typeof value === 'string' && isTermId(value), 'unknown term');

export const flowKindSchema = z.enum(['required', 'forbidden', 'ambient']);

export const playerMoveSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('placeRule'), sgId: id, whatId: id, fromId: id }),
  z.object({ type: z.literal('removeRule'), sgId: id, ruleId: id }),
]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const taskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const fromChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });

function repeated(values: string[]): string | undefined {
  return values.find((value, index) => values.indexOf(value) !== index);
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export const incidentSchema = z
  .object({
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
    report: termText,
    tasks: z.array(taskSchema).min(1),
    flows: z.array(flowSchema).min(1),
    chips: z.object({ what: z.array(whatChipSchema).min(1), from: z.array(fromChipSchema).min(1) }),
    hints: z.tuple([termText, termText]),
    explanation: z.tuple([optionSchema, optionSchema, optionSchema]),
    solution: z.array(playerMoveSchema).min(1),
    takeaway: termText,
  })
  .superRefine((incident, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const unique = (name: string, values: string[]) => {
      const twice = repeated(values);
      if (twice) fail(`${name} repeated: ${twice}`);
    };
    if ((incident.base === undefined) === (incident.changes === undefined)) fail('an incident has either a base world or changes');
    if (incident.id !== `${twoDigits(incident.chapter)}-${twoDigits(incident.order)}`) fail(`id ${incident.id} must be chapter-order`);
    unique('introduced term', incident.introduces);
    unique('flow id', incident.flows.map((f) => f.id));
    unique('task id', incident.tasks.map((t) => t.id));
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
    if (incident.explanation.filter((option) => option.correct).length !== 1) fail('exactly one explanation is correct');
    const whatIds = new Set(incident.chips.what.map((c) => c.id));
    const fromIds = new Set(incident.chips.from.map((c) => c.id));
    for (const move of incident.solution) {
      if (move.type === 'placeRule' && !(whatIds.has(move.whatId) && fromIds.has(move.fromId))) {
        fail(`the solution uses chips the incident does not offer: ${move.whatId}, ${move.fromId}`);
      }
    }
  });

export type Incident = z.infer<typeof incidentSchema>;
export type Flow = Incident['flows'][number];
export type FlowKind = z.infer<typeof flowKindSchema>;
export type IncidentTask = Incident['tasks'][number];
export type WhatChip = Incident['chips']['what'][number];
export type FromChip = Incident['chips']['from'][number];
export type PlayerMove = z.infer<typeof playerMoveSchema>;
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
