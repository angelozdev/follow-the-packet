import { WEB_BOX_TEXT } from '@/copy';
import { isIpv4, parseUrl } from '@/engine';
import type { PacketRun } from '@/game/flow-runs';
import { sendingOf, type Session } from '@/game/session';
import type { InspectionField } from '@/game/view/packet-fields';

const PORT_WRITTEN = /^[a-z][a-z\d+.-]*:\/\/[^/?#]*:\d+(?:[/?#]|$)/i;

function messageOf(session: Session, run: PacketRun) {
  const messageId = 'messageId' in run ? run.messageId : undefined;
  return sendingOf(session)?.send.message.find((chip) => chip.id === messageId);
}

function opened({ trace }: PacketRun): boolean {
  return trace.exchange?.some(({ kind }) => kind === 'ACK') === true;
}

interface HttpMessageText {
  startLine: string;
  headers: Readonly<Record<string, string>>;
  body?: string;
}

function linesOf({ startLine, headers, body }: HttpMessageText): string[] {
  return [startLine, ...Object.entries(headers).map(([name, value]) => WEB_BOX_TEXT.header(name, value)), ...(body === undefined ? [] : [WEB_BOX_TEXT.body(body)])];
}

/** Returns the field with the url a `curl` or the browser asked for, in its parts, once `url` is known: the scheme, the name or the IP, the port (with the default port of the scheme when the url wrote none), the path and the query string when it has one. A packet with no message has none. */
export function urlField(session: Session, run: PacketRun): InspectionField[] {
  const url = run.packet.message?.url;
  if (url === undefined || !session.known.has('url')) return [];
  const { scheme, host, port, path, query } = parseUrl(url);
  const parts = { scheme, host, hostIsIp: isIpv4(host), port, portWritten: PORT_WRITTEN.test(url), path, ...(query !== undefined && { query }) };
  return [{ label: WEB_BOX_TEXT.url.label, lines: WEB_BOX_TEXT.url.lines(parts, session.known) }];
}

/** Returns the field with the request that went through the open connection, once `http-request` is known, as it travelled: start line, headers and body. A connection that never opened sent none. The browser of the game says it sends only the Host header. */
export function requestField(session: Session, run: PacketRun): InspectionField[] {
  const request = run.trace.app?.request;
  if (!request || !opened(run) || !session.known.has('http-request')) return [];
  const browser = messageOf(session, run)?.command === 'browser';
  return [{ label: WEB_BOX_TEXT.request, lines: linesOf(request), ...(browser && { notes: [WEB_BOX_TEXT.notes.browserRequest] }) }];
}

/** Returns the field with the response a web service gave, once `http-response` is known, as it travelled: start line, headers and body, and a note that a real server sends more headers. */
export function responseField(session: Session, run: PacketRun): InspectionField[] {
  const response = run.trace.app?.response;
  if (!response || !session.known.has('http-response')) return [];
  return [{ label: WEB_BOX_TEXT.response, lines: linesOf(response), notes: [WEB_BOX_TEXT.notes.response] }];
}

/** Returns the field that says a `curl` waited and gave up with code 28, once `curl` is known: the source of `curl` 8.21.0 has two texts for that error and which one comes out was not confirmed, so the card of the terminal prints no line for it. The seconds are those of its `--connect-timeout`, when it has one. */
export function curlWaitField(session: Session, run: PacketRun): InspectionField[] {
  const message = messageOf(session, run);
  if (message?.command !== 'curl' || run.trace.outcome !== 'timeout' || !session.known.has('curl')) return [];
  return [{ label: WEB_BOX_TEXT.curl, lines: [WEB_BOX_TEXT.curlGaveUp(message.options?.connectTimeout)] }];
}
