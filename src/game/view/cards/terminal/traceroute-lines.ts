import { INSPECTION_TEXT, TERMINAL_TEXT, describeOutcome, roundTripText, type TermText } from '@/copy';
import type { TracerouteLine, UnreachableKind } from '@/engine';
import type { Session } from '@/game/session';
import { routerPlace } from '@/game/view/router-place';
import { routerWithIp, visibleIp } from '@/game/view/revealed-routers';
import type { SendPicks } from './terminal-card';

/** One line of the output of a traceroute: the hop number, the IP that answered (a star when nobody did, or where the router stands when the map does not draw it), the time as text and, on the last line of a warning that the destination cannot be reached, its mark. */
export interface RouteLine {
  hop: number;
  address: string;
  time: string | null;
  mark: string | null;
}

/** What the terminal shows under its command after a traceroute was sent: its lines, the notes that explain what the lines use, and the reason when the sender could not send anything. */
export interface TracerouteView {
  lines: RouteLine[];
  notes: TermText[];
  error: TermText | null;
}

const UNREACHABLE_KINDS = Object.keys(TERMINAL_TEXT.route.marks) as UnreachableKind[];

/** Returns the IP as the line shows it: itself, or, for a router the map does not draw, only where it stands. */
function addressOf(session: Session, ip: string): string {
  const router = routerWithIp(session.world, ip);
  const place = router ? routerPlace(session, router.id) : 'named';
  return place === 'named' ? ip : INSPECTION_TEXT.place[place];
}

function routeLine(session: Session, line: TracerouteLine): RouteLine {
  const ip = visibleIp(line, session.known);
  if (ip === undefined) return { hop: line.hop, address: TERMINAL_TEXT.route.silent, time: null, mark: null };
  return {
    hop: line.hop,
    address: addressOf(session, ip),
    time: line.rttMs !== undefined && session.known.has('rtt') ? roundTripText(line.rttMs) : null,
    mark: line.unreachable ? TERMINAL_TEXT.route.marks[line.unreachable] : null,
  };
}

function notesOf(lines: RouteLine[]): TermText[] {
  const { notes, marks, silent } = TERMINAL_TEXT.route;
  return [
    ...(lines.some((line) => line.address === silent) ? [notes.silent] : []),
    ...UNREACHABLE_KINDS.filter((kind) => lines.some((line) => line.mark === marks[kind])).map((kind) => notes[kind]),
    ...(lines.some((line) => line.time !== null) ? [notes.times] : []),
  ];
}

/** Returns the output of the traceroute the player sent with these picks, or null when none was sent with them (a ping, or a combination not sent yet). One line per probe, as the engine ran them: the IP that answered, the time, a star for a hop nobody answered. The terms the player does not know yet are left out of the lines: no time before RTT, and a warning they cannot name is a star. */
export function tracerouteLines(session: Session, { from, to, message }: Partial<SendPicks>): TracerouteView | null {
  const run = session.sent.find((candidate) => candidate.route && candidate.fromId === from && candidate.toId === to && candidate.messageId === message);
  if (!run?.route) return null;
  const lines = run.route.lines.map((line) => routeLine(session, line));
  return { lines, notes: notesOf(lines), error: run.route.localError ? describeOutcome(run.route.localError.outcome, session.known) : null };
}
