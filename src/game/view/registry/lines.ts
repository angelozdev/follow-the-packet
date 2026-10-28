import { toPlainText, type TermText } from '@/copy';
import { drawnSends, type DrawnSend, type FlowRun } from '@/game/flow-runs';
import { changeNotice, type LogEntry, type Session } from '@/game/session';
import { problemText, routesCard } from '@/game/view/cards/table-card';
import { inspect, resultOf, stopOf } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';

/** Where «Ver fila en la tabla de rutas» of a send takes the player: the piece whose table of routes holds the row that send used, and the number of the send. */
export interface RouteRow {
  pieceId: string;
  send: number;
}

/** A packet of the map, a send of the player or a flow of the incident: the id of its piece, its label, its result and, when the player can place where it stopped, the reason, in the words of its box. A send that left, with the routing table known, also has `row`: where «Ver fila en la tabla de rutas» takes the player. */
export interface PacketLine {
  kind: 'packet';
  pieceId: string;
  label: TermText;
  result: TermText;
  reason: TermText | null;
  row?: RouteRow;
}

/** The change whose edit emptied sends that were not empty, as the notice that says it. */
export interface ChangeLine {
  kind: 'change';
  notice: TermText;
}

/** An entry of a table that the engine refused, as the text the table says under itself. */
export interface RejectionLine {
  kind: 'rejection';
  text: TermText;
}

export type RegistryLine = PacketLine | ChangeLine | RejectionLine;

/** A line of the registry with the packet lines that came before it and read the same: a single line has none. */
export interface RegistryRow {
  line: RegistryLine;
  older: PacketLine[];
}

const BETWEEN_SENDS = 0.5;

interface Dated {
  at: number;
  line: RegistryLine;
}

function packetLine(session: Session, run: DrawnSend | FlowRun): PacketLine {
  return { kind: 'packet', pieceId: run.pieceId, label: run.label, result: resultOf(session, run), reason: run.hiddenStop ? null : stopOf(session, run) };
}

function isRouter(session: Session, holderId: string): boolean {
  return (session.world.routers ?? []).some(({ id }) => id === holderId);
}

function holderPiece(session: Session, holderId: string): string {
  return isRouter(session, holderId) ? PIECE_ID.router(holderId) : PIECE_ID.device(holderId);
}

function rowOf(session: Session, run: DrawnSend): RouteRow | undefined {
  const sent = session.history.find(({ send, id }) => send === run.send && id === run.id);
  if (sent === undefined || sent.route !== undefined || session.phase !== 'playing' || !session.known.has('routing-table')) return undefined;
  const holders = (sent.trace.routes ?? []).map(({ holderId }) => holderId);
  const routers = holders.filter((holderId) => isRouter(session, holderId));
  const pieceId = (routers.length > 0 ? routers : holders).map((holderId) => holderPiece(session, holderId)).find((id) => routesCard(session, id) !== null && inspect(session, id) !== null);
  return pieceId === undefined ? undefined : { pieceId, send: sent.send };
}

function sendLine(session: Session, run: DrawnSend): PacketLine {
  const row = rowOf(session, run);
  return { ...packetLine(session, run), ...(row && { row }) };
}

function logLine(session: Session, entry: LogEntry): ChangeLine | RejectionLine {
  return entry.kind === 'change' ? { kind: 'change', notice: changeNotice(session, entry.restart) } : { kind: 'rejection', text: problemText(entry.problem) };
}

/** Takes the session and returns the lines of its registry, the newest first: the sends since the world last changed (a send by name is two lines, its packet over its question, which left first), with the change that emptied the sends and the entries of tables the engine refused (`Session.log`) between them as they happened, and then the flows of the incident, the last one first, since a flow has no send and is older than all of them. A packet whose stop the player cannot place has no reason. A line of a send that left (not its question, not a traceroute) also has `row`, the first router of its route decisions that the map draws (the device whose decision it is when the decisions hold no router, and nothing when they hold routers and the map draws none) and its send number, while the incident is on and `routing-table` is known; no other line has it. Every line of a packet carries the id of the piece the map draws for it, so a click on it chooses the same packet. Pure, from the session. */
export function registryLines(session: Session): RegistryLine[] {
  const sends: Dated[] = drawnSends(session.history).map((run) => ({ at: run.send, line: sendLine(session, run) }));
  const events: Dated[] = session.log.map((entry) => ({ at: entry.sends + BETWEEN_SENDS, line: logLine(session, entry) }));
  const inOrder = [...sends, ...events].sort((a, b) => a.at - b.at);
  const flows = session.runs.map((run) => packetLine(session, run));
  return [...inOrder.map(({ line }) => line).reverse(), ...flows.reverse()];
}

/** Takes a line and returns what the player reads on it, as plain text: for a packet its label, its result and its reason, one after the other. */
export function printedText(line: RegistryLine): string {
  switch (line.kind) {
    case 'packet':
      return [line.label, line.result, ...(line.reason ? [line.reason] : [])].map(toPlainText).join(' ');
    case 'change':
      return toPlainText(line.notice);
    case 'rejection':
      return toPlainText(line.text);
  }
}

/** Takes the lines of the registry, the newest first, and returns its rows: the packet lines that follow each other and print the same text are one row, the newest line with the older ones in `older`, and a line of change or of refusal is a row of its own that no packet line joins across, so a group never crosses it. */
export function registryRows(lines: readonly RegistryLine[]): RegistryRow[] {
  return lines.reduce<RegistryRow[]>((rows, line) => {
    const last = rows.at(-1);
    if (last && line.kind === 'packet' && last.line.kind === 'packet' && printedText(last.line) === printedText(line)) last.older.push(line);
    else rows.push({ line, older: [] });
    return rows;
  }, []);
}
