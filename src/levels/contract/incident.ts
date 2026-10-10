import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { DEFAULT_DIRECTION, OUTCOMES, directionSchema, endpointSchema, icmpTypeSchema, ipSchema, networkActionSchema, networkSchema, packetSchema, rulePeerSchema, ruleWhatSchema, type Direction } from '@/engine';

const id = z.string().min(1);
const ECHO_REQUEST = 8;
const SEGMENTED_CHIPS = 2;

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

const placeRuleSchema = z
  .object({ type: z.literal('placeRule'), firewallId: id, whatId: id, fromId: id.optional(), toId: id.optional(), direction: directionSchema.optional() })
  .superRefine((move, ctx) => {
    const direction = move.direction ?? DEFAULT_DIRECTION;
    const [peer, other] = direction === 'outbound' ? (['toId', 'fromId'] as const) : (['fromId', 'toId'] as const);
    if (move[peer] === undefined) ctx.addIssue({ code: 'custom', message: `${direction}: a rule needs ${peer}`, path: [peer] });
    if (move[other] !== undefined) ctx.addIssue({ code: 'custom', message: `${direction}: a rule has no ${other}`, path: [other] });
  });
const removeRuleSchema = z.object({ type: z.literal('removeRule'), firewallId: id, ruleId: id, direction: directionSchema.optional() });
const sendPacketSchema = z.object({ type: z.literal('sendPacket'), fromId: id, toId: id, messageId: id });
const answerCardSchema = z.object({ type: z.literal('answerCard'), deviceId: id, picks: z.record(id, id) });
const setSettingSchema = z.object({ type: z.literal('setSetting'), deviceId: id, settingId: id, chipId: id });
const ruleMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema]);
const sendMoveSchema = z.discriminatedUnion('type', [sendPacketSchema, setSettingSchema]);

export const playerMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema, sendPacketSchema, answerCardSchema, setSettingSchema]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const filterTaskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const expectedOutcomeSchema = z.enum([...OUTCOMES, 'reached', 'any'] as const);
const sendTaskSchema = z.object({
  id,
  text: termText,
  expect: z.object({ fromId: id, toId: id, messageId: id, outcome: expectedOutcomeSchema, by: id.optional() }),
});
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const peerChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
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
const settingChipSchema = z.object({ id, label: termText, value: ipSchema.nullable() });
const settingSchema = z.object({ id, deviceId: id, name: termText, chips: z.array(settingChipSchema).min(2) });
const identifyTaskSchema = z.object({ id, text: termText, expect: z.object({ deviceId: id, trayId: id, chipId: id }) });
const cardChipSchema = z.object({ id, label: termText, feedback: termText.optional() });
const cardTraySchema = z.object({
  id,
  name: z.string().min(1),
  chips: z.array(cardChipSchema).min(2),
  initialPick: id.optional(),
  initialPickRule: termText.optional(),
  segmented: z.boolean().optional(),
});
const cardSchema = z.object({ deviceId: id, question: termText.optional(), trays: z.array(cardTraySchema).min(1) });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });
const sendChipsShape = {
  from: z.array(originChipSchema).min(1),
  to: z.array(addressChipSchema).min(1),
  message: z.array(messageChipSchema).min(1),
};
const caseSchema = z.object({
  id,
  changes: z.array(networkActionSchema).optional(),
  report: termText,
  send: z.object(sendChipsShape),
  hints: z.tuple([termText, termText]),
  cause: z.object({ question: termText, options: z.tuple([optionSchema, optionSchema, optionSchema]) }),
});

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
  takeaway: termText,
};

const guided = {
  hints: z.tuple([termText, termText]),
  question: termText.optional(),
  explanation: z.tuple([optionSchema, optionSchema, optionSchema]),
};

const filterIncidentSchema = z.object({
  ...common,
  ...guided,
  mechanic: z.literal('filter'),
  tasks: z.array(filterTaskSchema).min(1),
  flows: z.array(flowSchema).min(1),
  chips: z.object({ what: z.array(whatChipSchema).min(1), from: z.array(peerChipSchema).min(1), to: z.array(peerChipSchema).min(1).optional() }),
  solution: z.array(ruleMoveSchema).min(1),
});

const sendIncidentSchema = z.object({
  ...common,
  ...guided,
  mechanic: z.literal('send'),
  tasks: z.array(sendTaskSchema).min(1),
  flows: z.array(flowSchema),
  send: z.object({ ...sendChipsShape, settings: z.array(settingSchema).min(1).optional() }),
  solution: z.array(sendMoveSchema).min(1),
});

const identifyIncidentSchema = z.object({
  ...common,
  ...guided,
  mechanic: z.literal('identify'),
  tasks: z.array(identifyTaskSchema).min(1),
  flows: z.array(flowSchema),
  identify: z.object({ cards: z.array(cardSchema).min(1) }),
  solution: z.array(answerCardSchema).min(1),
});

const diagnoseIncidentSchema = z.object({
  ...common,
  mechanic: z.literal('diagnose'),
  flows: z.array(flowSchema),
  diagnose: z.object({ cases: z.array(caseSchema).min(1) }),
});

type FilterShape = z.infer<typeof filterIncidentSchema>;
type SendShape = z.infer<typeof sendIncidentSchema>;
type IdentifyShape = z.infer<typeof identifyIncidentSchema>;
type DiagnoseShape = z.infer<typeof diagnoseIncidentSchema>;
type SendChipsShape = z.infer<typeof caseSchema>['send'];
type Flows = FilterShape['flows'];
type CardTrayShape = z.infer<typeof cardTraySchema>;
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
  unique('to chip id', (incident.chips.to ?? []).map((c) => c.id));
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
  const peerIds = { inbound: new Set(incident.chips.from.map((c) => c.id)), outbound: new Set((incident.chips.to ?? []).map((c) => c.id)) };
  for (const move of incident.solution) {
    if (move.type !== 'placeRule') continue;
    const direction = move.direction ?? DEFAULT_DIRECTION;
    const peerId = peerIdOf(move);
    if (!(whatIds.has(move.whatId) && peerId !== undefined && peerIds[direction].has(peerId))) {
      fail(`the solution uses chips the incident does not offer: ${move.whatId}, ${peerId}`);
    }
  }
}

function checkSettings({ send }: SendShape, fail: Fail): void {
  const settings = send.settings ?? [];
  const origins = new Set(send.from.flatMap(({ endpoint }) => (endpoint.kind === 'device' ? [endpoint.id] : [])));
  uniqueIn(fail)('setting', settings.map((setting) => `${setting.deviceId}/${setting.id}`));
  for (const setting of settings) {
    const where = `${setting.deviceId}/${setting.id}`;
    if (!origins.has(setting.deviceId)) fail(`${where}: a setting belongs to a device that sends`);
    uniqueIn(fail)(`${where}: chip id`, setting.chips.map((chip) => chip.id));
    uniqueIn(fail)(`${where}: chip value`, setting.chips.map((chip) => String(chip.value)));
  }
}

function checkSendChips(send: SendChipsShape, where: string, fail: Fail) {
  const unique = uniqueIn(fail);
  const ids = { from: send.from.map((c) => c.id), to: send.to.map((c) => c.id), message: send.message.map((c) => c.id) };
  unique(`${where}origin chip id`, ids.from);
  unique(`${where}address chip id`, ids.to);
  unique(`${where}message chip id`, ids.message);
  return ids;
}

function checkAmbient(flows: Flows, mechanic: Mechanic, fail: Fail): void {
  for (const flow of flows) {
    if (flow.kind !== 'ambient') fail(`${flow.id}: a ${mechanic} incident has only ambient flows`);
  }
}

function checkSend(incident: SendShape, fail: Fail): void {
  const ids = checkSendChips(incident.send, '', fail);
  checkSettings(incident, fail);
  const offers = (combination: { fromId: string; toId: string; messageId: string }) =>
    ids.from.includes(combination.fromId) && ids.to.includes(combination.toId) && ids.message.includes(combination.messageId);
  const offersSetting = ({ deviceId, settingId, chipId }: Extract<SendShape['solution'][number], { type: 'setSetting' }>) =>
    (incident.send.settings ?? []).some((setting) => setting.deviceId === deviceId && setting.id === settingId && setting.chips.some((chip) => chip.id === chipId));
  for (const task of incident.tasks) {
    if (!offers(task.expect)) fail(`${task.id}: expects chips the incident does not offer`);
  }
  checkAmbient(incident.flows, incident.mechanic, fail);
  for (const move of incident.solution) {
    if (move.type === 'sendPacket' && !offers(move)) fail(`the solution uses chips the incident does not offer: ${move.fromId}, ${move.toId}, ${move.messageId}`);
    if (move.type === 'setSetting' && !offersSetting(move)) fail(`the solution uses a setting the incident does not offer: ${move.deviceId}/${move.settingId}/${move.chipId}`);
  }
}

function checkTray(deviceId: string, tray: CardTrayShape, fail: Fail): void {
  const where = `${deviceId}/${tray.id}`;
  uniqueIn(fail)(`${where}: chip id`, tray.chips.map((chip) => chip.id));
  if (tray.initialPick !== undefined && !tray.chips.some((chip) => chip.id === tray.initialPick)) fail(`${where}: the initial pick ${tray.initialPick} is not a chip of the tray`);
  if (tray.initialPickRule !== undefined && tray.initialPick === undefined) fail(`${where}: the rule of an initial pick needs an initial pick`);
  if (tray.segmented && tray.chips.length !== SEGMENTED_CHIPS) fail(`${where}: a segmented tray has exactly ${SEGMENTED_CHIPS} chips`);
}

function checkIdentify(incident: IdentifyShape, fail: Fail): void {
  const { cards } = incident.identify;
  const unique = uniqueIn(fail);
  unique('card device', cards.map((card) => card.deviceId));
  for (const card of cards) {
    unique(`${card.deviceId}: tray id`, card.trays.map((tray) => tray.id));
    for (const tray of card.trays) checkTray(card.deviceId, tray, fail);
  }
  const offers = ({ deviceId, trayId, chipId }: IdentifyShape['tasks'][number]['expect']) =>
    cards.some((card) => card.deviceId === deviceId && card.trays.some((tray) => tray.id === trayId && tray.chips.some((chip) => chip.id === chipId)));
  for (const task of incident.tasks) {
    if (!offers(task.expect)) fail(`${task.id}: expects a chip the cards do not offer`);
  }
  for (const move of incident.solution) {
    for (const [trayId, chipId] of Object.entries(move.picks)) {
      if (!offers({ deviceId: move.deviceId, trayId, chipId })) fail(`the solution uses a chip the cards do not offer: ${move.deviceId}/${trayId}/${chipId}`);
    }
  }
  if (incident.flows.length > 0) fail('an identify incident sends nothing');
}

function checkDiagnose(incident: DiagnoseShape, fail: Fail): void {
  const { cases } = incident.diagnose;
  uniqueIn(fail)('case id', cases.map((spec) => spec.id));
  for (const spec of cases) {
    checkSendChips(spec.send, `${spec.id}: `, fail);
    if (spec.cause.options.filter((option) => option.correct).length !== 1) fail(`${spec.id}: exactly one cause is correct`);
  }
  checkAmbient(incident.flows, incident.mechanic, fail);
}

function checkGuided(incident: FilterShape | SendShape | IdentifyShape, fail: Fail): void {
  uniqueIn(fail)('task id', incident.tasks.map((t) => t.id));
  if (incident.explanation.filter((option) => option.correct).length !== 1) fail('exactly one explanation is correct');
}

export const incidentSchema = z.discriminatedUnion('mechanic', [filterIncidentSchema, sendIncidentSchema, identifyIncidentSchema, diagnoseIncidentSchema]).superRefine((incident, ctx) => {
  const fail: Fail = (message) => ctx.addIssue({ code: 'custom', message });
  const unique = uniqueIn(fail);
  if ((incident.base === undefined) === (incident.changes === undefined)) fail('an incident has either a base world or changes');
  if (incident.id !== `${twoDigits(incident.chapter)}-${twoDigits(incident.order)}`) fail(`id ${incident.id} must be chapter-order`);
  unique('introduced term', incident.introduces);
  unique('flow id', incident.flows.map((f) => f.id));
  unique('shown id', incident.shown ?? []);
  if (incident.mechanic !== 'diagnose') checkGuided(incident, fail);
  switch (incident.mechanic) {
    case 'filter':
      return checkFilter(incident, fail);
    case 'send':
      return checkSend(incident, fail);
    case 'identify':
      return checkIdentify(incident, fail);
    case 'diagnose':
      return checkDiagnose(incident, fail);
  }
});

export type Incident = z.infer<typeof incidentSchema>;
export type Mechanic = Incident['mechanic'];
export type FilterIncident = Extract<Incident, { mechanic: 'filter' }>;
export type SendIncident = Extract<Incident, { mechanic: 'send' }>;
export type IdentifyIncident = Extract<Incident, { mechanic: 'identify' }>;
export type DiagnoseIncident = Extract<Incident, { mechanic: 'diagnose' }>;
export type GuidedIncident = Exclude<Incident, DiagnoseIncident>;
export type Flow = Incident['flows'][number];
export type FlowKind = z.infer<typeof flowKindSchema>;
export type IncidentTask = FilterTask | SendTask | IdentifyTask;
export type FilterTask = FilterIncident['tasks'][number];
export type SendTask = SendIncident['tasks'][number];
export type IdentifyTask = IdentifyIncident['tasks'][number];
export type WhatChip = FilterIncident['chips']['what'][number];
export type FromChip = FilterIncident['chips']['from'][number];
export type ToChip = NonNullable<FilterIncident['chips']['to']>[number];
export type OriginChip = SendIncident['send']['from'][number];
export type AddressChip = SendIncident['send']['to'][number];
export type SettingSpec = NonNullable<SendIncident['send']['settings']>[number];
export type SettingChip = SettingSpec['chips'][number];
export type MessageChip = SendIncident['send']['message'][number];
export type CaseSpec = DiagnoseIncident['diagnose']['cases'][number];
export type SendChips = CaseSpec['send'];
export type ExpectedOutcome = SendTask['expect']['outcome'];
export type CardSpec = IdentifyIncident['identify']['cards'][number];
export type TraySpec = CardSpec['trays'][number];
export type CardChip = TraySpec['chips'][number];
export type PlayerMove = z.infer<typeof playerMoveSchema>;
export type RuleMove = z.infer<typeof ruleMoveSchema>;
export type PlaceMove = z.infer<typeof placeRuleSchema>;
export type SendMove = z.infer<typeof sendPacketSchema>;
export type SettingMove = z.infer<typeof setSettingSchema>;
export type AnswerMove = z.infer<typeof answerCardSchema>;
export type ExplanationOption = GuidedIncident['explanation'][number];
export type LevelEntry = Pick<Incident, 'id' | 'chapter' | 'order' | 'title' | 'role'>;
export type LevelRole = Incident['role'];

/** True for an incident the player works through tasks (a filter, a send or an identify), and false for a diagnose, which has cases. */
export function isGuided(incident: Incident): incident is GuidedIncident {
  return incident.mechanic !== 'diagnose';
}

/** Returns the id of the peer chip a placement names: the Destination chip of an outbound rule, the Source chip of an inbound one. */
export function peerIdOf({ direction = DEFAULT_DIRECTION, fromId, toId }: Pick<PlaceMove, 'direction' | 'fromId' | 'toId'>): string | undefined {
  return direction === 'outbound' ? toId : fromId;
}

const RULE_ID_JOINER: Record<Direction, string> = { inbound: 'from', outbound: 'to' };

/** Returns the id a rule gets when the player places it from two chips: the Type chip and, for an inbound rule (the default), the Source chip or, for an outbound one, the Destination chip. */
export function ruleIdFor(whatId: string, peerId: string, direction: Direction = DEFAULT_DIRECTION): string {
  return `${whatId}-${RULE_ID_JOINER[direction]}-${peerId}`;
}

/** Validates an incident file and returns it typed; throws with every problem when the file is wrong. */
export function defineIncident(input: z.input<typeof incidentSchema>): Incident {
  return incidentSchema.parse(input);
}
