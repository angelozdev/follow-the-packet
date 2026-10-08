import { z } from 'zod';
import { sameCheckpoint } from '../engine/checkpoints';
import {
  checkpointSchema,
  endpointSchema,
  icmpTypeSchema,
  networkSchema,
  packetSchema,
  rulePeerSchema,
  ruleSchema,
  ruleWhatSchema,
} from '../engine/schema';

const protocolSchema = z.enum(['tcp', 'udp', 'icmp']);

export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), sgId: z.string().min(1), rule: ruleSchema }),
  z.object({ type: z.literal('removeRule'), sgId: z.string().min(1), ruleId: z.string().min(1) }),
  z.object({ type: z.literal('setAppTarget'), instanceId: z.string().min(1), target: z.string().min(1) }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), instanceId: z.string().min(1), value: z.boolean() }),
]);

const editableSchema = z.object({
  /** v1: solo reglas de entrada. */
  rules: z
    .object({
      sgIds: z.array(z.string().min(1)).min(1),
      whatOptions: z.array(z.object({ label: z.string().min(1), what: ruleWhatSchema })).min(1),
      peerOptions: z.array(z.object({ label: z.string().min(1), peer: rulePeerSchema })).min(1),
    })
    .optional(),
  appTarget: z
    .object({
      instanceId: z.string().min(1),
      options: z.array(z.object({ label: z.string().min(1), target: z.string().min(1) })).min(2),
    })
    .optional(),
  linuxFlags: z.object({ instanceIds: z.array(z.string().min(1)).min(1) }).optional(),
});

const serviceSchema = z.object({
  label: z.string().min(1),
  protocol: protocolSchema,
  port: z.number().int().min(0).max(65535).optional(),
  icmpType: icmpTypeSchema.optional(),
});

const defenderObjectiveSchema = z.object({
  kind: z.literal('defender'),
  mustPass: z.array(packetSchema).min(1),
  mustBlock: z.array(packetSchema),
  /** Flujos que ya existían y no cuentan como apertura de más (por ejemplo, tu SSH). */
  allowed: z.array(packetSchema),
});

const attackerObjectiveSchema = z.object({
  kind: z.literal('attacker'),
  target: z.object({
    instanceId: z.string().min(1),
    protocol: protocolSchema,
    port: z.number().int().min(0).max(65535).optional(),
    icmpType: icmpTypeSchema.optional(),
  }),
  maxAttempts: z.number().int().min(1),
  attack: z.object({
    origins: z.array(z.object({ label: z.string().min(1), endpoint: endpointSchema })).min(1),
    targets: z.array(z.object({ label: z.string().min(1), to: z.string().min(1) })).min(1),
    services: z.array(serviceSchema).min(1),
  }),
});

const candidateSchema = z.object({ label: z.string().min(1), checkpoint: checkpointSchema });

const pad = (n: number) => String(n).padStart(2, '0');

export const levelSchema = z
  .object({
    id: z.string().regex(/^\d{2}-\d{2}$/),
    chapter: z.number().int().min(1).max(20),
    order: z.number().int().min(1),
    title: z.string().min(1),
    role: z.enum(['defender', 'attacker']),
    /** Texto exacto de la lección en syllabus.md. */
    lesson: z.string().min(1),
    /** Ruta de la nota de concepto desde la raíz del repo. */
    concept: z.string().regex(/^concepts\/[a-z0-9-]+\.md$/),
    brief: z.string().min(1),
    network: networkSchema,
    objective: z.discriminatedUnion('kind', [defenderObjectiveSchema, attackerObjectiveSchema]),
    editable: editableSchema,
    tools: z.array(z.enum(['tcpdump', 'getent', 'rules'])),
    prediction: z.object({ packet: packetSchema, candidates: z.array(candidateSchema).min(2), answer: checkpointSchema }),
    hints: z.tuple([z.string().min(1), z.string().min(1)]),
    solution: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('defender'), actions: z.array(actionSchema).min(1) }),
      z.object({ kind: z.literal('attacker'), packet: packetSchema }),
    ]),
    takeaway: z.string().min(1),
  })
  .superRefine((level, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (level.id !== `${pad(level.chapter)}-${pad(level.order)}`) fail(`el id debe ser ${pad(level.chapter)}-${pad(level.order)}`);
    if (level.objective.kind !== level.role) fail('el objetivo no corresponde al rol');
    if (level.solution.kind !== level.role) fail('la solución no corresponde al rol');
    if (!level.prediction.candidates.some((c) => sameCheckpoint(c.checkpoint, level.prediction.answer))) {
      fail('la respuesta de la predicción no está entre los candidatos');
    }
    for (const sgId of level.editable.rules?.sgIds ?? []) {
      if (!level.network.securityGroups.some((g) => g.id === sgId)) fail(`editable.rules: el SG ${sgId} no existe`);
    }
  });

export type Level = z.infer<typeof levelSchema>;
export type LevelAction = z.infer<typeof actionSchema>;
export type Candidate = z.infer<typeof candidateSchema>;
export type DefenderObjective = Extract<Level['objective'], { kind: 'defender' }>;
export type AttackerObjective = Extract<Level['objective'], { kind: 'attacker' }>;

export function defineLevel(input: z.input<typeof levelSchema>): Level {
  const result = levelSchema.safeParse(input);
  if (!result.success) throw new Error(`Nivel ${input.id} inválido: ${JSON.stringify(result.error.issues)}`);
  return result.data;
}
