import { TERMINAL_TEXT, curlOutput, digOutput, ncOutput, type CurlResult, type DigLine, type DigResult, type NcResult, type TermText } from '@/copy';
import { parseUrl } from '@/engine';
import type { SentPacket } from '@/game/flow-runs';
import { sendingOf, type Session } from '@/game/session';
import type { SendPicks } from './terminal-card';

/** A piece of what a tool printed, in order: a line as printed (`key` for the lines that tell the answer, which stay in view when the output is folded) or a run of lines that the folded output hides behind a mark. */
export type OutputSegment = { kind: 'line'; text: string; key: boolean } | { kind: 'folded'; lines: string[] };

/** What the output card shows for an `nc`, a `dig` or a `curl` the player sent: the lines the tool printed, grouped into the segments the card folds, how many lines the fold hides in all (none for an output with no key lines, which is never folded), the notes that say which figures are examples and, for a `curl`, the title of its send («Envío 1», «Envío 2»). */
export interface ToolOutput {
  command: 'nc' | 'dig' | 'curl';
  title?: TermText;
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

function curlResultOf({ trace, packet }: SentPacket, include: boolean): CurlResult | null {
  switch (trace.outcome) {
    case 'replied':
      return trace.app?.response ? { kind: 'response', response: trace.app.response, include } : null;
    case 'refused':
      return packet.message && packet.port !== undefined ? { kind: 'refused', host: parseUrl(packet.message.url).host, port: packet.port, elapsedMs: trace.rttMs ?? 0 } : null;
    case 'timeout':
      return { kind: 'timeout' };
    default:
      return null;
  }
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

function curlPrinted(run: SentPacket, include: boolean): Printed | null {
  const result = curlResultOf(run, include);
  const lines = result ? curlOutput(result) : [];
  if (!result || lines.length === 0) return null;
  const notes = TERMINAL_TEXT.output.notes;
  return { lines: lines.map((text) => ({ text, key: false })), note: result.kind === 'refused' ? notes.curl : include && result.kind === 'response' ? notes.curlHeaders : null };
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

/** Returns the output card of a tool for the lines it printed: the lines grouped into the segments the card folds, how many it hides in all and the notes, with the title of its send when it has one. */
export function toolOutputOf(command: ToolOutput['command'], lines: DigLine[], notes: TermText[], title?: TermText): ToolOutput {
  const segments = segmentsOf(lines);
  return { command, ...(title !== undefined && { title }), segments, folded: foldedCount(segments), notes };
}

function sendsOf({ history }: Session, { from, to, message }: Partial<SendPicks>): SentPacket[] {
  return history.filter((candidate) => !candidate.route && candidate.fromId === from && candidate.toId === to && candidate.messageId === message);
}

function commandOf(session: Session, message: string | undefined) {
  return sendingOf(session)?.send.message.find((chip) => chip.id === message);
}

function blockOf(command: ToolOutput['command'], printed: Printed | null, title?: TermText): ToolOutput | null {
  return printed && toolOutputOf(command, printed.lines, printed.note === null ? [] : [printed.note], title);
}

function curlBlock(sends: SentPacket[], index: number, include: boolean): ToolOutput | null {
  return blockOf('curl', curlPrinted(sends[index], include), TERMINAL_TEXT.output.sendTitle(index + 1));
}

/** Returns what the last `nc`, `dig` or `curl` sent with these picks printed, or null when none was sent with them, when the picks are no tool, and when the source of the tool does not confirm what it printed in that case: the game then prints nothing and the box says what happened. A `curl` block carries the title of its send. The query that an `nc` by name makes to the resolver is not a send of the player, so its lines are not here. */
export function toolOutput(session: Session, picks: Partial<SendPicks>): ToolOutput | null {
  const sends = sendsOf(session, picks);
  const chip = commandOf(session, picks.message);
  if (sends.length === 0 || !chip?.command) return null;
  switch (chip.command) {
    case 'nc':
      return blockOf('nc', ncPrinted(sends.at(-1)!));
    case 'dig':
      return blockOf('dig', digPrinted(sends.at(-1)!));
    case 'curl':
      return curlBlock(sends, sends.length - 1, chip.options?.include === true);
    default:
      return null;
  }
}

/** Returns the blocks the output card draws for these picks, in the order of the sends: for a `curl`, one for each send of the same chips since the world last changed, each with its title («Envío 1», «Envío 2»), so the first body can be compared with the second; a send that printed nothing has no block, but keeps its number. For an `nc` or a `dig`, the one block of the last send, with no title; none when nothing was sent or the picks are no tool. */
export function toolOutputs(session: Session, picks: Partial<SendPicks>): ToolOutput[] {
  const chip = commandOf(session, picks.message);
  if (chip?.command !== 'curl') {
    const single = toolOutput(session, picks);
    return single ? [single] : [];
  }
  const sends = sendsOf(session, picks);
  return sends.flatMap((_, index) => curlBlock(sends, index, chip.options?.include === true) ?? []);
}
