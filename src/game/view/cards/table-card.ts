import { INSPECTION_TEXT, SITE_PROBLEM_TEXT, TABLE_TEXT, deviceName, nameTag, toPlainText, word, type TermText } from '@/copy';
import { DNS_PORT, ROUTE_DEFAULT, cacheAfter, forwardRows, routingTableOf, translates, type AnswerRecord, type Device, type Router, type ServerActor, type TableRoute, type Translation } from '@/engine';
import { recordEntryId, routeEntryId, tablesOf, type EntryProblem, type SendIncident, type TableSpec } from '@/levels';
import { drawnSends, type SentPacket } from '@/game/flow-runs';
import { canEdit, currentCase, type Session } from '@/game/session';
import { PIECE_ID, parsePieceId } from '@/game/view/piece-id';
import { routerWithIp } from '@/game/view/revealed-routers';
import { routerPlace } from '@/game/view/router-place';
import { originPieces } from './terminal/terminal-card';

export type TableKind = 'routes' | 'translations' | 'records' | 'cache' | 'sites';

/** One cell of a table: its text and whether it is a value written in code (an IP, a range, a name or a number) and not a word. */
export interface TableCell {
  text: TermText;
  code: boolean;
}

/** One row of a table. `entryId` is how the session names the row it removes, and is null for a row the player cannot take away (a route of the network the holder is plugged into). `inUse` marks the row the last packet sent used. */
export interface TableRowView {
  id: string;
  entryId: string | null;
  cells: TableCell[];
  inUse: boolean;
}

/** A tray of an editable table: the name the placement picks it by (`destination` and `nextHop` for a route, `name`, `type` and `value` for a record), the name the player reads and its chips. */
export interface EntryTray {
  name: string;
  label: string;
  chips: { id: string; label: TermText }[];
}

export interface TableCard {
  kind: TableKind;
  tableId: string | null;
  ownerId: string;
  pieceId: string;
  title: TermText;
  columns: { id: string; label: TermText }[];
  rows: TableRowView[];
  empty: TermText;
  note: TermText | null;
  trays: EntryTray[] | null;
  add: string | null;
  problem: TermText | null;
}

const ANYWHERE = '0.0.0.0/0';

function sendIncident(session: Session): SendIncident | null {
  return session.incident.mechanic === 'send' ? session.incident : null;
}

export function tableSpec(session: Session, ownerId: string, kind: TableSpec['kind']): TableSpec | undefined {
  return tablesOf(session.incident, currentCase(session)).find((table) => table.ownerId === ownerId && table.kind === kind);
}

function holderOf(session: Session, pieceId: string): Device | Router | undefined {
  const ref = parsePieceId(pieceId);
  if (ref?.kind === 'device') return session.world.devices.find((device) => device.id === ref.id);
  return ref?.kind === 'router' ? (session.world.routers ?? []).find((router) => router.id === ref.id) : undefined;
}

function serverOf(session: Session, pieceId: string): ServerActor | undefined {
  const ref = parsePieceId(pieceId);
  return ref?.kind === 'actor' ? session.world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === ref.id) : undefined;
}

function lastRun(session: Session): SentPacket | undefined {
  const last = session.history.at(-1);
  return last && last.route === undefined ? last : undefined;
}

export function code(text: TermText): TableCell {
  return { text, code: true };
}

export function words(text: TermText): TableCell {
  return { text, code: false };
}

export function problemOf(session: Session, spec: TableSpec | undefined): TermText | null {
  const kept = session.entryProblem;
  if (!spec || kept?.tableId !== spec.id) return null;
  const problems: Record<EntryProblem, TermText> = { ...TABLE_TEXT.problems, ...SITE_PROBLEM_TEXT };
  return TABLE_TEXT.refused(problems[kept.code]);
}

export function trayOf(name: string, label: string, chips: readonly { id: string; label: TermText }[]): EntryTray {
  return { name, label, chips: chips.map(({ id, label: chipLabel }) => ({ id, label: chipLabel })) };
}

function routerText(session: Session, router: Router): TermText {
  const place = routerPlace(session, router.id);
  return place === 'named' ? nameTag(router.name) : INSPECTION_TEXT.place[place];
}

function viaText(session: Session, via: string): TermText {
  const router = routerWithIp(session.world, via);
  if (!router) return via;
  return routerPlace(session, router.id) === 'named' ? `${via} ${nameTag(router.name)}` : routerText(session, router);
}

/** Returns what the column of the next hop says for a row: «directo» for the network the holder is plugged into, the IP of the next hop with its router when the map draws it, and, for a route whose router shares no link with the holder (so the engine has no IP to give), the router alone. */
function outletOf(session: Session, holder: Device | Router, route: TableRoute): TableCell {
  if (route.kind === 'connected') return words(TABLE_TEXT.routes.direct);
  if (route.via !== undefined) return code(viaText(session, route.via));
  const next = 'interfaces' in holder ? (session.world.routers ?? []).find((router) => router.id === holder.routes.find(({ to }) => to === route.to)?.next) : undefined;
  return next ? code(routerText(session, next)) : words(TABLE_TEXT.routes.direct);
}

function routeRow(session: Session, holder: Device | Router, route: TableRoute, editable: boolean): TableRowView {
  const decision = lastRun(session)?.trace.routes?.find((candidate) => candidate.holderId === holder.id);
  const destination = route.to === ROUTE_DEFAULT ? ANYWHERE : route.to;
  return {
    id: `${route.kind}:${route.to}`,
    entryId: editable && route.kind !== 'connected' ? routeEntryId(route) : null,
    cells: [code(destination), outletOf(session, holder, route)],
    inUse: decision !== undefined && decision.route.to === route.to && decision.kind === route.kind,
  };
}

function opensRoutes(session: Session, pieceId: string, holder: Device | Router): boolean {
  if (session.incident.mechanic !== 'send' || !session.known.has('routing-table')) return false;
  return 'interfaces' in holder || Object.values(originPieces(session)).includes(pieceId);
}

/** Returns the «Tabla de rutas» card of a device or a router: the routing table the engine derives for it (`routingTableOf`: a connected route for each network it is plugged into, the default route and, for a router, its routes), with the row the last packet sent used marked. A router whose table the incident lets the player edit gets the trays of the destination and the next hop, a button to take away each route that is not connected, the problem the engine gave to the last entry it refused and the label of the button that adds one; any other table is read only, and shows only once `routing-table` is known, for a router and for a device that sends. A table the incident lets the player edit is read only too once the session no longer accepts edits (`canEdit`: the case of a diagnose is closed, or the incident is), so the card never offers a control that would do nothing. The column of the next hop is called «Por dónde sale» until `next-hop` is known. Null for a piece that is no device or router, in an incident that is not a send, and when the piece has no such card. */
export function routesCard(session: Session, pieceId: string): TableCard | null {
  const holder = holderOf(session, pieceId);
  if (!holder) return null;
  const spec = tableSpec(session, holder.id, 'routes');
  if (!spec && !opensRoutes(session, pieceId, holder)) return null;
  const editable = spec?.kind === 'routes' && canEdit(session);
  const outlet = session.known.has('next-hop') ? TABLE_TEXT.routes.nextHop : TABLE_TEXT.routes.outlet;
  return {
    kind: 'routes',
    tableId: editable ? spec.id : null,
    ownerId: holder.id,
    pieceId: 'interfaces' in holder ? PIECE_ID.router(holder.id) : PIECE_ID.device(holder.id),
    title: TABLE_TEXT.routes.title(deviceName(session.world, holder.id)),
    columns: [
      { id: 'destination', label: TABLE_TEXT.destination },
      { id: 'outlet', label: outlet },
    ],
    rows: routingTableOf(session.world, holder).map((route) => routeRow(session, holder, route, editable)),
    empty: TABLE_TEXT.routes.empty,
    note: null,
    trays: editable ? [trayOf('destination', TABLE_TEXT.destination, spec.trays.destination), trayOf('nextHop', toPlainText(outlet), spec.trays.nextHop)] : null,
    add: editable ? TABLE_TEXT.routes.add : null,
    problem: editable ? problemOf(session, spec) : null,
  };
}

type TranslationEnds = Pick<Translation, 'protocol' | 'inside' | 'outside'>;

function translationKey({ protocol, inside, outside }: TranslationEnds): string {
  return `${protocol}|${inside.ip}:${inside.port}|${outside.ip}:${outside.port}`;
}

function makesRow(run: SentPacket): boolean {
  const { translation } = run.trace;
  return run.route === undefined && translation !== undefined && translation.protocol !== 'icmp' && translation.isNew && !translation.fixed;
}

/** One row of the table of translations. The word after its protocol, when it has one (`mark`), is what makes the row different from the others: «fija» for a port forward, which no packet made, and «consulta DNS» for a datagram to port 53, so what a row is for is a word and not only its place in the list. */
function translationRow(session: Session, id: string, { protocol, inside, outside }: TranslationEnds, inUse: boolean, mark?: TermText): TableRowView {
  const name = word(session.known, protocol, protocol.toUpperCase());
  const first = mark ? `${name} · ${mark}` : name;
  return { id, entryId: null, cells: [code(first), code(`${inside.ip}:${inside.port}`), code(`${outside.ip}:${outside.port}`)], inUse };
}

/** The fixed rows of the router, the ones its port forwards give (`forwardRows`), in the order of the forwards. The id starts with `fixed|`, so a fixed row and a row that a packet made never share a key. */
function fixedRows(session: Session, router: Router, usedKey: string | undefined): TableRowView[] {
  const mark = word(session.known, 'port-forwarding', TABLE_TEXT.translations.fixed);
  return forwardRows(session.world, router).map((row) => translationRow(session, `fixed|${translationKey(row)}`, row, translationKey(row) === usedKey, mark));
}

/** The word a row made by a run wears: «consulta DNS» when the run is a UDP datagram to port 53, the question of a send by name or a `dig`, and only once `dns-query` is known; before, the row says its protocol and nothing more. */
function markOf(session: Session, { trace }: SentPacket): TermText | undefined {
  const asksTheResolver = trace.translation?.protocol === 'udp' && trace.header?.request.destinationPort === DNS_PORT;
  return asksTheResolver && session.known.has('dns-query') ? word(session.known, 'dns-query', TABLE_TEXT.translations.dnsQuery) : undefined;
}

/** The row the last send touched last: the one its packet made or used, or, for a packet that has none of its own (a ping, a name nobody resolved), the one its question made. */
function lastTouched(session: Session): Translation | undefined {
  const last = lastRun(session);
  return [last?.trace.translation, last?.question?.trace.translation].find((translation) => translation !== undefined && translation.protocol !== 'icmp');
}

/** Returns the «Tabla de traducciones» card of the router of the office, read only and shown once `translation-table` is known. It lists first the fixed rows of the router, one for each port forward of the world (`forwardRows`), marked «fija»: the world gave them, no packet made them. Then, one row for each TCP or UDP packet the player sent since the world last changed that made one, and for each question a send by name put to its resolver before its packet (`Session.history`, in the order they were made, the row of the question first, because `sent` keeps only the last send of each combination of chips and would lose rows), with the private IP:port, the public IP:port, and the row the last send touched last marked: the one of its packet, or, when the packet has none, the one of its question, a fixed one too when a forward delivered the packet. A row made by a datagram to port 53 (a question or a `dig`) wears «consulta DNS» once that term is known. A ping makes no row (ICMP has no ports) and neither does a packet a fixed forward delivered: the forward was there before it. Null for a piece that is no router, a router that does not translate, and an incident that is not a send. */
export function translationsCard(session: Session, pieceId: string): TableCard | null {
  const holder = holderOf(session, pieceId);
  if (!holder || !('interfaces' in holder) || sendIncident(session) === null || !session.known.has('translation-table') || !translates(session.world, holder)) return null;
  const touched = lastTouched(session);
  const used = touched && translationKey(touched);
  const ownRows = drawnSends(session.history).filter((run) => makesRow(run) && holder.interfaces.some((face) => face.ip === run.trace.translation?.outside.ip));
  return {
    kind: 'translations',
    tableId: null,
    ownerId: holder.id,
    pieceId: PIECE_ID.router(holder.id),
    title: TABLE_TEXT.translations.title(deviceName(session.world, holder.id)),
    columns: [
      { id: 'protocol', label: TABLE_TEXT.translations.protocol },
      { id: 'inside', label: TABLE_TEXT.translations.inside },
      { id: 'outside', label: TABLE_TEXT.translations.outside },
    ],
    rows: [
      ...fixedRows(session, holder, used),
      ...ownRows.map((run) => {
        const key = translationKey(run.trace.translation!);
        return translationRow(session, key, run.trace.translation!, key === used, markOf(session, run));
      }),
    ],
    empty: TABLE_TEXT.translations.empty,
    note: null,
    trays: null,
    add: null,
    problem: null,
  };
}

function recordColumns(): { id: string; label: TermText }[] {
  return [
    { id: 'name', label: TABLE_TEXT.records.name },
    { id: 'type', label: TABLE_TEXT.records.type },
    { id: 'value', label: TABLE_TEXT.records.value },
  ];
}

function answerRecords(server: ServerActor): AnswerRecord[] {
  return (server.dns?.zones ?? []).flatMap((zone) => zone.records).filter((record): record is AnswerRecord => record.type === 'A' || record.type === 'CNAME');
}

function typeCell(session: Session, type: AnswerRecord['type']): TableCell {
  return code(word(session.known, type === 'A' ? 'a-record' : 'cname-record', type));
}

function recordRow(session: Session, record: AnswerRecord, editable: boolean): TableRowView {
  const ttl = session.known.has('dns-ttl') ? [code(TABLE_TEXT.records.seconds(record.ttl))] : [];
  return { id: recordEntryId(record), entryId: editable ? recordEntryId(record) : null, cells: [code(record.name), typeCell(session, record.type), code(record.value), ...ttl], inUse: false };
}

/** Returns the «Registros» card of the zone of an authoritative server whose records the incident lets the player edit: its address and alias records as rows, with a button to take away each one, the trays of the name, the type and the value, the problem the engine gave to the last record it refused, and, under the table, one muted line when the zone has records of its own besides (the player never edits them). The time to live is a column once `dns-ttl` is known. When the session no longer accepts edits (`canEdit`: the case is closed, or the incident is) the card is the same table read only, with no trays, no button, no table id, no button on the rows and no problem. Null when the piece is no server of the internet or the incident offers no table of records for it. */
export function recordsCard(session: Session, pieceId: string): TableCard | null {
  const server = serverOf(session, pieceId);
  const spec = server && tableSpec(session, server.id, 'records');
  if (!server || spec?.kind !== 'records') return null;
  const editable = canEdit(session);
  const zones = server.dns?.zones ?? [];
  const records = answerRecords(server);
  const ttl = session.known.has('dns-ttl') ? [{ id: 'ttl', label: TABLE_TEXT.records.ttl }] : [];
  return {
    kind: 'records',
    tableId: editable ? spec.id : null,
    ownerId: server.id,
    pieceId: PIECE_ID.actor(server.id),
    title: TABLE_TEXT.records.title(zones.length === 1 ? nameTag(zones[0].name) : nameTag(server.name)),
    columns: [...recordColumns(), ...ttl],
    rows: records.map((record) => recordRow(session, record, editable)),
    empty: TABLE_TEXT.records.empty,
    note: zones.some((zone) => zone.records.some((record) => record.type !== 'A' && record.type !== 'CNAME')) ? TABLE_TEXT.records.own : null,
    trays: editable ? [trayOf('name', TABLE_TEXT.records.name, spec.trays.name), trayOf('type', TABLE_TEXT.records.type, spec.trays.type), trayOf('value', TABLE_TEXT.records.value, spec.trays.value)] : null,
    add: editable ? TABLE_TEXT.records.add : null,
    problem: editable ? problemOf(session, spec) : null,
  };
}

/** Returns the packets the engine has to replay to know what a resolver or a browser remembers: every send since the world last changed, in order, with the second of the game clock it left at, without the traceroutes, which are not in the sequence. */
export function replayOf(history: readonly SentPacket[]): { packet: SentPacket['packet']; at: number }[] {
  return history.filter((run) => run.route === undefined).map(({ packet, at }) => ({ packet, at }));
}

/** Returns the «Caché» card of a resolver, read only and shown once `dns-cache` is known: the answers it holds at the second of the game clock the session is on, each with the seconds it has left (`cacheAfter` replays the sends since the world last changed against the engine, so the seconds are the engine's and not the view's). A resolver that holds nothing says so. Null when the piece is no resolver or the incident is not a send. */
export function cacheCard(session: Session, pieceId: string): TableCard | null {
  const server = serverOf(session, pieceId);
  if (!server || server.dns?.role !== 'resolver' || sendIncident(session) === null || !session.known.has('dns-cache')) return null;
  return {
    kind: 'cache',
    tableId: null,
    ownerId: server.id,
    pieceId: PIECE_ID.actor(server.id),
    title: TABLE_TEXT.cache.title(nameTag(server.name)),
    columns: [...recordColumns(), { id: 'left', label: TABLE_TEXT.cache.left }],
    rows: cacheAfter(session.world, replayOf(session.history), server.id, session.clock).map((entry) => ({
      id: `${entry.name}|${entry.type}|${entry.value}`,
      entryId: null,
      cells: [code(entry.name), typeCell(session, entry.type), code(entry.value), code(TABLE_TEXT.cache.seconds(entry.ttlLeft))],
      inUse: false,
    })),
    empty: TABLE_TEXT.cache.empty,
    note: null,
    trays: null,
    add: null,
    problem: null,
  };
}
