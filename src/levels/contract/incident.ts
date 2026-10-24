import { z } from 'zod';
import { isTermId, parseTermText, type TermId } from '@/copy';
import { DEFAULT_DIRECTION, DNS_PORT, ECHO_REQUEST, OUTCOMES, cidrSchema, directionSchema, endpointSchema, icmpTypeSchema, ipSchema, isIpv4, listenSchema, networkActionSchema, networkSchema, packetSchema, portSchema, recordKeySchema, routeSchema, rulePeerSchema, ruleWhatSchema, type Direction, type DnsStatus } from '@/engine';

const id = z.string().min(1);
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
const placeEntrySchema = z.object({ type: z.literal('placeEntry'), tableId: id, picks: z.record(id, id) });
const removeEntrySchema = z.object({ type: z.literal('removeEntry'), tableId: id, entryId: id });
const waitSchema = z.object({ type: z.literal('wait'), seconds: z.number().int().positive() });
const ruleMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema]);
const sendMoveSchema = z.discriminatedUnion('type', [sendPacketSchema, setSettingSchema, placeEntrySchema, removeEntrySchema, waitSchema]);
const fixMoveSchema = z.discriminatedUnion('type', [sendPacketSchema, placeEntrySchema, removeEntrySchema]);

export const playerMoveSchema = z.discriminatedUnion('type', [placeRuleSchema, removeRuleSchema, sendPacketSchema, answerCardSchema, setSettingSchema, placeEntrySchema, removeEntrySchema, waitSchema]);

const flowSchema = z.object({ id, kind: flowKindSchema, packet: packetSchema });
const filterTaskSchema = z.object({ id, text: termText, flowIds: z.array(id).min(1) });
const expectedOutcomeSchema = z.enum([...OUTCOMES, 'reached', 'any'] as const);
const EXPECTED_STATUSES = ['NXDOMAIN', 'SERVFAIL'] as const satisfies readonly DnsStatus[];
const expectedAnswerSchema = z
  .object({ ip: ipSchema.optional(), alias: z.boolean().optional() })
  .refine((answer) => answer.ip !== undefined || answer.alias !== undefined, { message: 'an expected answer names an IP or says whether it came through an alias' });
const sendTaskSchema = z.object({
  id,
  text: termText,
  expect: z.object({
    fromId: id,
    toId: id,
    messageId: id,
    outcome: expectedOutcomeSchema,
    by: id.optional(),
    answer: expectedAnswerSchema.optional(),
    status: z.enum(EXPECTED_STATUSES).optional(),
  }),
});
const whatChipSchema = z.object({ id, label: termText, what: ruleWhatSchema });
const peerChipSchema = z.object({ id, label: termText, peer: rulePeerSchema });
const originChipSchema = z.object({ id, endpoint: endpointSchema });
const addressChipSchema = z.object({ id, address: id });
const MESSAGE_COMMANDS = ['packet', 'ping', 'traceroute', 'nc', 'dig'] as const;
const COMMAND_PROTOCOL: Record<(typeof MESSAGE_COMMANDS)[number], z.infer<typeof packetSchema>['protocol']> = { packet: 'icmp', ping: 'icmp', traceroute: 'icmp', nc: 'tcp', dig: 'udp' };
const messageChipSchema = z
  .object({
    id,
    label: termText,
    icmpType: icmpTypeSchema.optional(),
    command: z.enum(MESSAGE_COMMANDS).optional(),
    protocol: packetSchema.shape.protocol.optional(),
    port: portSchema.optional(),
    ttl: packetSchema.shape.ttl,
  })
  .superRefine((chip, ctx) => {
    const issue = (message: string, path: string) => ctx.addIssue({ code: 'custom', message, path: [path] });
    const protocol = chip.command ? COMMAND_PROTOCOL[chip.command] : 'icmp';
    if (chip.protocol !== undefined && chip.protocol !== protocol) issue(`a message ${chip.command ? `of ${chip.command}` : 'with no command'} is ${protocol}`, 'protocol');
    if (chip.ttl !== undefined && chip.command !== 'ping') issue('a TTL belongs to a ping', 'ttl');
    if ((chip.command === 'ping' || chip.command === 'traceroute') && chip.icmpType !== ECHO_REQUEST) issue(`a ${chip.command} sends an Echo Request`, 'icmpType');
    if (protocol === 'icmp' && chip.icmpType === undefined) issue('an ICMP message needs its type', 'icmpType');
    if (protocol === 'icmp' && chip.port !== undefined) issue('an ICMP message has no port', 'port');
    if (protocol !== 'icmp' && chip.icmpType !== undefined) issue(`a ${chip.command} has no ICMP type`, 'icmpType');
    if (chip.command === 'nc' && chip.port === undefined) issue('an nc needs the port it tests', 'port');
    if (chip.command === 'dig' && chip.port !== undefined && chip.port !== DNS_PORT) issue(`a dig goes to port ${DNS_PORT}`, 'port');
  });
const SETTING_KINDS = ['gateway', 'dns-server', 'listen-address'] as const;
const settingChipSchema = z.object({ id, label: termText, value: z.union([ipSchema, listenSchema]).nullable() });
const settingSchema = z
  .object({
    id,
    deviceId: id,
    kind: z.enum(SETTING_KINDS).optional(),
    service: z.object({ protocol: packetSchema.shape.protocol.exclude(['icmp']), port: portSchema }).optional(),
    name: termText,
    chips: z.array(settingChipSchema).min(2),
  })
  .superRefine((setting, ctx) => {
    const listens = settingKind(setting) === 'listen-address';
    if (listens !== (setting.service !== undefined)) ctx.addIssue({ code: 'custom', message: 'only a listen address names its service, and it needs one', path: ['service'] });
    setting.chips.forEach(({ value }, index) => {
      const fits = listens ? listenSchema.safeParse(value).success : value === null || isIpv4(value);
      if (!fits) ctx.addIssue({ code: 'custom', message: `a value of ${settingKind(setting)} does not fit: ${value}`, path: ['chips', index, 'value'] });
    });
  });

const tray = <Value extends z.ZodType>(value: Value) => z.array(z.object({ id, label: termText, value })).min(1);
const tableShape = { id, ownerId: id };
const tableSchema = z.discriminatedUnion('kind', [
  z.object({ ...tableShape, kind: z.literal('routes'), trays: z.object({ destination: tray(routeSchema.shape.to), nextHop: tray(routeSchema.shape.next) }) }),
  z.object({ ...tableShape, kind: z.literal('records'), trays: z.object({ name: tray(recordKeySchema.shape.name), type: tray(recordKeySchema.shape.type), value: tray(recordKeySchema.shape.value) }) }),
]);
const clockSchema = z.object({ steps: z.array(z.object({ id, label: termText, seconds: waitSchema.shape.seconds })).min(1) });
const PIECE_CARDS = ['terminal', 'settings', 'services', 'routes', 'records'] as const;
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
const binSchema = z.object({ id, name: z.string().min(1) });
const classifySchema = z.object({ deviceId: id, cidr: cidrSchema, trayId: id, bins: z.tuple([binSchema, binSchema]), items: z.array(id).min(1) });
const optionSchema = z.object({ text: termText, feedback: termText, correct: z.boolean() });
const sendChipsShape = {
  from: z.array(originChipSchema).min(1),
  to: z.array(addressChipSchema).min(1),
  message: z.array(messageChipSchema).min(1),
};
const caseSchema = z.object({
  id,
  changes: z.array(networkActionSchema).optional(),
  shown: z.array(id).min(1).optional(),
  report: termText,
  send: z.object(sendChipsShape),
  fix: z.object({ tables: z.array(tableSchema).min(1), tasks: z.array(sendTaskSchema).min(1), solution: z.array(fixMoveSchema).min(1) }).optional(),
  hints: z.tuple([termText, termText]),
  cause: z.object({ question: termText, options: z.tuple([optionSchema, optionSchema, optionSchema]) }),
});

const common = {
  id: z.string().regex(/^\d{2}-\d{2}$/),
  chapter: z.number().int().min(1),
  order: z.number().int().min(1),
  title: z.string().min(1),
  role: z.enum(['defender', 'attacker']),
  lesson: z.string().min(1).optional(),
  concept: z.string().min(1).optional(),
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
  send: z.object({
    ...sendChipsShape,
    settings: z.array(settingSchema).min(1).optional(),
    tables: z.array(tableSchema).min(1).optional(),
    clock: clockSchema.optional(),
    opensFirst: z.record(id, z.enum(PIECE_CARDS)).optional(),
  }),
  revealRoutersByTraceroute: z.boolean().optional(),
  solution: z.array(sendMoveSchema).min(1),
});

const identifyIncidentSchema = z.object({
  ...common,
  ...guided,
  mechanic: z.literal('identify'),
  tasks: z.array(identifyTaskSchema).min(1),
  flows: z.array(flowSchema),
  identify: z.object({ cards: z.array(cardSchema).min(1), classify: classifySchema.optional() }),
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
type SendChipsShape = CaseShape['send'];
type CaseShape = z.infer<typeof caseSchema>;
type TableShape = z.infer<typeof tableSchema>;
type ClassifyShape = NonNullable<IdentifyShape['identify']['classify']>;
type Combination = { fromId: string; toId: string; messageId: string };
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
    if (settingKind(setting) !== 'listen-address' && !origins.has(setting.deviceId)) fail(`${where}: a setting belongs to a device that sends`);
    uniqueIn(fail)(`${where}: chip id`, setting.chips.map((chip) => chip.id));
    uniqueIn(fail)(`${where}: chip value`, setting.chips.map((chip) => String(chip.value)));
  }
}

type TableMoveShape = Extract<SendShape['solution'][number], { type: 'placeEntry' | 'removeEntry' }>;

function offersPlacement(tables: TableShape[], { tableId, picks }: Extract<TableMoveShape, { type: 'placeEntry' }>): boolean {
  const trays = Object.entries<{ id: string }[]>(tables.find((table) => table.id === tableId)?.trays ?? {});
  return trays.length > 0 && Object.keys(picks).length === trays.length && trays.every(([name, chips]) => chips.some((chip) => chip.id === picks[name]));
}

function checkTableMove(move: TableMoveShape, tables: TableShape[], fail: Fail): void {
  if (move.type === 'placeEntry' && !offersPlacement(tables, move)) fail(`the solution places an entry the incident does not offer: ${move.tableId}`);
  if (move.type === 'removeEntry' && !tables.some((table) => table.id === move.tableId)) fail(`the solution removes an entry from a table the incident does not offer: ${move.tableId}`);
}

function checkTables(tables: TableShape[], where: string, fail: Fail): void {
  uniqueIn(fail)(`${where}table id`, tables.map((table) => table.id));
  for (const table of tables) {
    for (const [trayName, chips] of Object.entries<{ id: string }[]>(table.trays)) uniqueIn(fail)(`${where}${table.id}/${trayName}: chip id`, chips.map((chip) => chip.id));
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

function offeredBy(ids: ReturnType<typeof checkSendChips>) {
  return (combination: Combination) => ids.from.includes(combination.fromId) && ids.to.includes(combination.toId) && ids.message.includes(combination.messageId);
}

function checkSend(incident: SendShape, fail: Fail): void {
  const ids = checkSendChips(incident.send, '', fail);
  checkSettings(incident, fail);
  const tables = incident.send.tables ?? [];
  checkTables(tables, '', fail);
  uniqueIn(fail)('clock step id', (incident.send.clock?.steps ?? []).map((step) => step.id));
  for (const [pieceId, card] of Object.entries(incident.send.opensFirst ?? {})) {
    if (!cardsOfPiece(incident.send, pieceId).includes(card)) fail(`${pieceId} has no ${card} card to open first`);
  }
  const offers = offeredBy(ids);
  const offersSetting = ({ deviceId, settingId, chipId }: Extract<SendShape['solution'][number], { type: 'setSetting' }>) =>
    (incident.send.settings ?? []).some((setting) => setting.deviceId === deviceId && setting.id === settingId && setting.chips.some((chip) => chip.id === chipId));
  for (const task of incident.tasks) {
    if (!offers(task.expect)) fail(`${task.id}: expects chips the incident does not offer`);
  }
  if (incident.revealRoutersByTraceroute && !incident.send.message.some((chip) => chip.command === 'traceroute')) fail('routers that wait for a traceroute need a traceroute chip to name them');
  checkAmbient(incident.flows, incident.mechanic, fail);
  for (const move of incident.solution) {
    if (move.type === 'sendPacket' && !offers(move)) fail(`the solution uses chips the incident does not offer: ${move.fromId}, ${move.toId}, ${move.messageId}`);
    if (move.type === 'setSetting' && !offersSetting(move)) fail(`the solution uses a setting the incident does not offer: ${move.deviceId}/${move.settingId}/${move.chipId}`);
    if (move.type === 'placeEntry' || move.type === 'removeEntry') checkTableMove(move, tables, fail);
    if (move.type === 'wait' && !(incident.send.clock?.steps ?? []).some((step) => step.seconds === move.seconds)) fail(`the solution waits ${move.seconds} seconds, which is no step of the clock`);
  }
}

function checkTray(deviceId: string, tray: CardTrayShape, fail: Fail): void {
  const where = `${deviceId}/${tray.id}`;
  uniqueIn(fail)(`${where}: chip id`, tray.chips.map((chip) => chip.id));
  if (tray.initialPick !== undefined && !tray.chips.some((chip) => chip.id === tray.initialPick)) fail(`${where}: the initial pick ${tray.initialPick} is not a chip of the tray`);
  if (tray.initialPickRule !== undefined && tray.initialPick === undefined) fail(`${where}: the rule of an initial pick needs an initial pick`);
  if (tray.segmented && tray.chips.length !== SEGMENTED_CHIPS) fail(`${where}: a segmented tray has exactly ${SEGMENTED_CHIPS} chips`);
}

function checkClassify(classify: ClassifyShape, cards: IdentifyShape['identify']['cards'], fail: Fail): void {
  const unique = uniqueIn(fail);
  unique('classify bin id', classify.bins.map((bin) => bin.id));
  unique('classify item', classify.items);
  if (classify.items.includes(classify.deviceId)) fail(`${classify.deviceId}: the owner of the classify card sorts nothing of itself`);
  const itemCards = cards.filter((card) => classify.items.includes(card.deviceId));
  if (itemCards.some((card) => card.trays.some((tray) => tray.id === classify.trayId))) fail(`classify tray id ${classify.trayId} repeats a tray of the card of an item`);
}

function classifies(classify: ClassifyShape | undefined, { deviceId, trayId, chipId }: IdentifyShape['tasks'][number]['expect']): boolean {
  return classify !== undefined && classify.trayId === trayId && classify.items.includes(deviceId) && classify.bins.some((bin) => bin.id === chipId);
}

function checkIdentify(incident: IdentifyShape, fail: Fail): void {
  const { cards, classify } = incident.identify;
  const unique = uniqueIn(fail);
  unique('card device', cards.map((card) => card.deviceId));
  for (const card of cards) {
    unique(`${card.deviceId}: tray id`, card.trays.map((tray) => tray.id));
    for (const tray of card.trays) checkTray(card.deviceId, tray, fail);
  }
  if (classify) checkClassify(classify, cards, fail);
  const offers = (expect: IdentifyShape['tasks'][number]['expect']) =>
    classifies(classify, expect) ||
    cards.some((card) => card.deviceId === expect.deviceId && card.trays.some((tray) => tray.id === expect.trayId && tray.chips.some((chip) => chip.id === expect.chipId)));
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

function checkFix({ tables, tasks, solution }: NonNullable<CaseShape['fix']>, ids: ReturnType<typeof checkSendChips>, where: string, fail: Fail): void {
  checkTables(tables, `${where}: fix `, fail);
  uniqueIn(fail)(`${where}: fix task id`, tasks.map((task) => task.id));
  const offers = offeredBy(ids);
  for (const task of tasks) {
    if (!offers(task.expect)) fail(`${where}: ${task.id} expects chips the case does not offer`);
  }
  const failInFix: Fail = (message) => fail(`${where}: fix: ${message}`);
  for (const move of solution) {
    if (move.type !== 'sendPacket') checkTableMove(move, tables, failInFix);
    else if (!offers(move)) failInFix(`the solution uses chips the case does not offer: ${move.fromId}, ${move.toId}, ${move.messageId}`);
  }
}

function checkDiagnose(incident: DiagnoseShape, fail: Fail): void {
  const { cases } = incident.diagnose;
  uniqueIn(fail)('case id', cases.map((spec) => spec.id));
  for (const spec of cases) {
    const ids = checkSendChips(spec.send, `${spec.id}: `, fail);
    if (spec.fix) checkFix(spec.fix, ids, spec.id, fail);
    uniqueIn(fail)(`${spec.id}: shown id`, spec.shown ?? []);
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
export type SettingKind = (typeof SETTING_KINDS)[number];
export type TableSpec = TableShape;
export type ClockStep = NonNullable<SendIncident['send']['clock']>['steps'][number];
export type ClassifySpec = ClassifyShape;
export type PieceCard = (typeof PIECE_CARDS)[number];
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
export type PlaceEntryMove = z.infer<typeof placeEntrySchema>;
export type RemoveEntryMove = z.infer<typeof removeEntrySchema>;
export type TableMove = PlaceEntryMove | RemoveEntryMove;
export type WaitMove = z.infer<typeof waitSchema>;
export type AnswerMove = z.infer<typeof answerCardSchema>;
export type ExplanationOption = GuidedIncident['explanation'][number];
export type LevelEntry = Pick<Incident, 'id' | 'chapter' | 'order' | 'title' | 'role'>;
export type LevelRole = Incident['role'];

/** True for an incident the player works through tasks (a filter, a send or an identify), and false for a diagnose, which has cases. */
export function isGuided(incident: Incident): incident is GuidedIncident {
  return incident.mechanic !== 'diagnose';
}

/** Returns the kind of a setting: a gateway when it names none, as every setting of chapter 1 does. */
export function settingKind({ kind = 'gateway' }: Pick<SettingSpec, 'kind'>): SettingKind {
  return kind;
}

/** Returns the cards a piece of the world has in a send incident, in the order it opens them when the incident names none: the terminal when it is an origin, the network settings (a gateway or a DNS server), the services (a listen address), then the tables of routes and of records it owns. */
export function cardsOfPiece({ from, settings = [], tables = [] }: SendIncident['send'], pieceId: string): PieceCard[] {
  const has: Record<PieceCard, boolean> = {
    terminal: from.some(({ endpoint }) => endpoint.id === pieceId),
    settings: settings.some((setting) => setting.deviceId === pieceId && settingKind(setting) !== 'listen-address'),
    services: settings.some((setting) => setting.deviceId === pieceId && settingKind(setting) === 'listen-address'),
    routes: tables.some((table) => table.ownerId === pieceId && table.kind === 'routes'),
    records: tables.some((table) => table.ownerId === pieceId && table.kind === 'records'),
  };
  return PIECE_CARDS.filter((card) => has[card]);
}

/** Returns the card a piece opens first: the one the incident names (`send.opensFirst`) or, with none, the first it has (the terminal, then the settings or the services, then the tables); none for a piece with no card. */
export function firstCardOf(send: SendIncident['send'], pieceId: string): PieceCard | undefined {
  return send.opensFirst?.[pieceId] ?? cardsOfPiece(send, pieceId).at(0);
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
