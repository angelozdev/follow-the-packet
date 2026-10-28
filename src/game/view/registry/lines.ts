import type { TermText } from '@/copy';
import { drawnSends, type DrawnSend, type FlowRun } from '@/game/flow-runs';
import { changeNotice, type LogEntry, type Session } from '@/game/session';
import { problemText } from '@/game/view/cards/table-card';
import { resultOf, stopOf } from '@/game/view/inspection';

/** A packet of the map, a send of the player or a flow of the incident: the id of its piece, its label, its result and, when the player can place where it stopped, the reason, in the words of its box. */
export interface PacketLine {
  kind: 'packet';
  pieceId: string;
  label: TermText;
  result: TermText;
  reason: TermText | null;
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

const BETWEEN_SENDS = 0.5;

interface Dated {
  at: number;
  line: RegistryLine;
}

function packetLine(session: Session, run: DrawnSend | FlowRun): PacketLine {
  return { kind: 'packet', pieceId: run.pieceId, label: run.label, result: resultOf(session, run), reason: run.hiddenStop ? null : stopOf(session, run) };
}

function logLine(session: Session, entry: LogEntry): ChangeLine | RejectionLine {
  return entry.kind === 'change' ? { kind: 'change', notice: changeNotice(session, entry.restart) } : { kind: 'rejection', text: problemText(entry.problem) };
}

/** Takes the session and returns the lines of its registry, the newest first: the sends since the world last changed (a send by name is two lines, its packet over its question, which left first), with the change that emptied the sends and the entries of tables the engine refused (`Session.log`) between them as they happened, and then the flows of the incident, the last one first, since a flow has no send and is older than all of them. A packet whose stop the player cannot place has no reason. Every line of a packet carries the id of the piece the map draws for it, so a click on it chooses the same packet. Pure, from the session. */
export function registryLines(session: Session): RegistryLine[] {
  const sends: Dated[] = drawnSends(session.history).map((run) => ({ at: run.send, line: packetLine(session, run) }));
  const events: Dated[] = session.log.map((entry) => ({ at: entry.sends + BETWEEN_SENDS, line: logLine(session, entry) }));
  const inOrder = [...sends, ...events].sort((a, b) => a.at - b.at);
  const flows = session.runs.map((run) => packetLine(session, run));
  return [...inOrder.map(({ line }) => line).reverse(), ...flows.reverse()];
}
