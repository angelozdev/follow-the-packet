import { TERMINAL_TEXT, endpointName, packetMessage, type TermText } from '@/copy';
import type { Endpoint } from '@/engine';
import type { SendIncident } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type SendTrayName = 'from' | 'to' | 'message';
export type SendPicks = Record<SendTrayName, string>;

interface Chip {
  id: string;
  label: TermText;
}

interface SendTray {
  name: SendTrayName;
  chips: Chip[];
}

export interface TerminalCard {
  fromId: string;
  title: TermText;
  trays: SendTray[];
  fixed: Partial<SendPicks>;
  origins: Record<string, string>;
}

const TRAY_ORDER: SendTrayName[] = ['from', 'to', 'message'];

function endpointPieceId(endpoint: Endpoint): string {
  return endpoint.kind === 'device' ? PIECE_ID.device(endpoint.id) : PIECE_ID.actor(endpoint.id);
}

function sendingIncident(session: Session): SendIncident | null {
  return session.incident.mechanic === 'send' ? session.incident : null;
}

/** Returns the piece ids where the incident's origin chips sit, by chip id; empty when the incident does not send. */
export function originPieces(session: Session): Record<string, string> {
  const incident = sendingIncident(session);
  return Object.fromEntries((incident?.send.from ?? []).map((chip) => [chip.id, endpointPieceId(chip.endpoint)]));
}

function chipsOf(incident: SendIncident, session: Session): Record<SendTrayName, Chip[]> {
  return {
    from: incident.send.from.map((chip) => ({ id: chip.id, label: endpointName(chip.endpoint, session.world) })),
    to: incident.send.to.map((chip) => ({ id: chip.id, label: chip.address })),
    message: incident.send.message.map((chip) => ({ id: chip.id, label: chip.label })),
  };
}

/** Returns what the terminal card of an origin piece shows: its title, the trays with a choice to make, and the chip of each tray that offers only one (that tray is fixed and not shown); null when the piece is not an origin of a send incident. */
export function terminalCard(session: Session, pieceId: string): TerminalCard | null {
  const incident = sendingIncident(session);
  const origin = incident?.send.from.find((chip) => endpointPieceId(chip.endpoint) === pieceId);
  if (!incident || !origin) return null;
  const chips = chipsOf(incident, session);
  return {
    fromId: origin.id,
    title: TERMINAL_TEXT.title(endpointName(origin.endpoint, session.world)),
    trays: TRAY_ORDER.filter((name) => chips[name].length > 1).map((name) => ({ name, chips: chips[name] })),
    fixed: Object.fromEntries(TRAY_ORDER.flatMap((name) => (chips[name].length === 1 ? [[name, chips[name][0].id]] : []))),
    origins: originPieces(session),
  };
}

/** Returns the line the terminal shows for an address and a message: the real ping command for an Echo Request, a packet made by hand for any other message; null until both are picked. */
export function terminalLine(session: Session, { to, message }: Partial<SendPicks>): TermText | null {
  const incident = sendingIncident(session);
  const address = incident?.send.to.find((chip) => chip.id === to)?.address;
  const picked = incident?.send.message.find((chip) => chip.id === message);
  if (!address || !picked) return null;
  return packetMessage({ protocol: 'icmp', icmpType: picked.icmpType }) === 'echo-request' ? TERMINAL_TEXT.ping(address) : TERMINAL_TEXT.handmade(picked.label, address);
}
