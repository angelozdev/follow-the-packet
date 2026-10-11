import { TERMINAL_TEXT, digOutput, ncOutput, type DigLine, type DigResult, type NcResult, type TermText } from '@/copy';
import type { SentPacket } from '@/game/flow-runs';
import { sendingOf, type Session } from '@/game/session';
import type { SendPicks } from './terminal-card';

/** A piece of what a tool printed, in order: a line as printed (`key` for the lines that tell the answer, which stay in view when the output is folded) or a run of lines that the folded output hides behind a mark. */
export type OutputSegment = { kind: 'line'; text: string; key: boolean } | { kind: 'folded'; lines: string[] };

/** What the output card shows for an `nc` or a `dig` the player sent: the lines the tool printed, grouped into the segments the card folds, how many lines the fold hides in all (none for an output with no key lines, which is never folded), and the notes that say which figures are examples. */
export interface ToolOutput {
  command: 'nc' | 'dig';
  segments: OutputSegment[];
  folded: number;
  notes: TermText[];
}

interface Printed {
  lines: DigLine[];
  note: TermText | null;
}

function ncResultOf({ trace, packet }: SentPacket): NcResult | null {
  if (trace.steps.some(({ reason }) => reason.code === 'address-localhost')) return null;
  switch (trace.outcome) {
    case 'replied':
      return trace.resolvedIp === null || packet.port === undefined ? null : { kind: 'open', ip: trace.resolvedIp, port: packet.port, elapsedMs: trace.rttMs ?? 0 };
    case 'refused':
      return { kind: 'refused' };
    case 'timeout':
      return { kind: 'timeout' };
    default:
      return null;
  }
}

function digResultOf({ trace, packet, at }: SentPacket): DigResult | null {
  const { dns, resolvedIp: server } = trace;
  if (server === null) return null;
  if (dns && dns.status !== 'NO-RESOLVER') {
    return { kind: 'reply', name: packet.to, status: dns.status, answers: dns.answers, ...(dns.soa && { soa: dns.soa }), server, queryMs: trace.rttMs ?? 0, at };
  }
  if (trace.outcome === 'timeout') return { kind: 'timeout', name: packet.to, server };
  return trace.notice?.kind === 'port-unreachable' ? { kind: 'refused', name: packet.to, server } : null;
}

function ncPrinted(run: SentPacket): Printed | null {
  const result = ncResultOf(run);
  if (!result) return null;
  return { lines: ncOutput(result).map((text) => ({ text, key: false })), note: result.kind === 'open' ? TERMINAL_TEXT.output.notes.nc : null };
}

function digPrinted(run: SentPacket): Printed | null {
  const result = digResultOf(run);
  return result ? { lines: digOutput(result), note: result.kind === 'reply' ? TERMINAL_TEXT.output.notes.dig : null } : null;
}

/** Groups the lines into segments: when some are key lines, each key line stays a line and every run of the others becomes one folded segment; with no key line, which is a tool that printed no answer, every line stays a line and nothing folds. */
function segmentsOf(lines: DigLine[]): OutputSegment[] {
  if (!lines.some(({ key }) => key)) return lines.map(({ text }) => ({ kind: 'line', text, key: false }));
  return lines.reduce<OutputSegment[]>((segments, { text, key }) => {
    if (key) return [...segments, { kind: 'line', text, key }];
    const last = segments.at(-1);
    return last?.kind === 'folded' ? [...segments.slice(0, -1), { kind: 'folded', lines: [...last.lines, text] }] : [...segments, { kind: 'folded', lines: [text] }];
  }, []);
}

function foldedCount(segments: OutputSegment[]): number {
  return segments.reduce((total, segment) => total + (segment.kind === 'folded' ? segment.lines.length : 0), 0);
}

/** Returns the output card of a tool for the lines it printed: the lines grouped into the segments the card folds, how many it hides in all and the notes. */
export function toolOutputOf(command: ToolOutput['command'], lines: DigLine[], notes: TermText[]): ToolOutput {
  const segments = segmentsOf(lines);
  return { command, segments, folded: foldedCount(segments), notes };
}

/** Returns what the last `nc` or `dig` sent with these picks printed, or null when none was sent with them, when the picks are no tool, and when the source of the tool does not confirm what it printed in that case: the game then prints nothing and the box says what happened. The query that an `nc` by name makes to the resolver is not a send of the player, so its lines are not here. */
export function toolOutput(session: Session, { from, to, message }: Partial<SendPicks>): ToolOutput | null {
  const run = session.sent.find((candidate) => !candidate.route && candidate.fromId === from && candidate.toId === to && candidate.messageId === message);
  const command = sendingOf(session)?.send.message.find((chip) => chip.id === message)?.command;
  if (!run || (command !== 'nc' && command !== 'dig')) return null;
  const printed = command === 'nc' ? ncPrinted(run) : digPrinted(run);
  if (!printed) return null;
  return toolOutputOf(command, printed.lines, printed.note === null ? [] : [printed.note]);
}
