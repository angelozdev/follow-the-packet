import { TERMINAL_TEXT, endpointName, packetMessage, type TermText } from '@/copy';
import type { Endpoint } from '@/engine';
import { urlOfChip, type MessageChip, type SendOwner } from '@/levels';
import { sendingOf, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { urlStrip, type UrlStrip } from '@/game/view/cards/web/url-strip';

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
  strip?: UrlStrip;
}

const TRAY_ORDER: SendTrayName[] = ['from', 'to', 'message'];

function endpointPieceId(endpoint: Endpoint): string {
  return endpoint.kind === 'device' ? PIECE_ID.device(endpoint.id) : PIECE_ID.actor(endpoint.id);
}

/** Returns the piece ids where the origin chips sit, by chip id: those of the incident, or of the case a diagnose is on; empty when nothing sends. */
export function originPieces(session: Session): Record<string, string> {
  const offers = sendingOf(session);
  return Object.fromEntries((offers?.send.from ?? []).map((chip) => [chip.id, endpointPieceId(chip.endpoint)]));
}

function chipsOf(offers: SendOwner, session: Session): Record<SendTrayName, Chip[]> {
  return {
    from: offers.send.from.map((chip) => ({ id: chip.id, label: endpointName(chip.endpoint, session.world) })),
    to: offers.send.to.map((chip) => ({ id: chip.id, label: urlOfChip(chip) ?? chip.address })),
    message: offers.send.message.filter((chip) => chip.command !== 'browser').map((chip) => ({ id: chip.id, label: chip.label })),
  };
}

/** Returns what the terminal card of an origin piece shows: its title, the trays with a choice to make, and the chip of each tray that offers only one (that tray is fixed and not shown); null when the piece is not an origin of a send incident, or of the case a diagnose is on. When the address chips give their urls by parts, the card carries the `strip` that picks them and has no tray of addresses. */
export function terminalCard(session: Session, pieceId: string): TerminalCard | null {
  const offers = sendingOf(session);
  const origin = offers?.send.from.find((chip) => endpointPieceId(chip.endpoint) === pieceId);
  if (!offers || !origin) return null;
  const chips = chipsOf(offers, session);
  const strip = urlStrip(offers.send.to);
  return {
    fromId: origin.id,
    title: TERMINAL_TEXT.title(endpointName(origin.endpoint, session.world)),
    trays: TRAY_ORDER.filter((name) => chips[name].length > 1 && !(strip && name === 'to')).map((name) => ({ name, chips: chips[name] })),
    fixed: Object.fromEntries(TRAY_ORDER.flatMap((name) => (chips[name].length === 1 ? [[name, chips[name][0].id]] : []))),
    origins: originPieces(session),
    ...(strip && { strip }),
  };
}

function lineKindOf(message: MessageChip): NonNullable<MessageChip['command']> | 'handmade' {
  if (message.command) return message.command;
  return packetMessage({ protocol: 'icmp', icmpType: message.icmpType }) === 'echo-request' ? 'ping' : 'handmade';
}

/** Returns the line the terminal shows for the chips picked, in Linux syntax: `ping <address>` with `-t <ttl>` when the message sets a TTL (the iputils option), `traceroute -I <address>` (`-I` makes it send ICMP Echo, as the engine does), and for a packet "paquete de <origin> a <address>", which names no command and so needs the origin picked too. A message with no command keeps the first design: an Echo Request is the ping command and any other message is a packet made by hand. An `nc` is `nc -vz -w 3 <address> <port>` (`-v` makes it print what happened, `-z` that it only connects and `-w 3` that it waits three seconds), and a `dig` is `dig <name>` with no server, so it asks the resolver of the network settings of the device. A `curl` is `curl` with its options (`-i`, `-X PUT`, `-d <body>`, `--connect-timeout <seconds>`, in that order) and the whole url of the address chip; the browser has no line, because it is not a command, and a `curl` to a chip that is no url has none either. Null until the address and the message (and, for a packet, the origin) are picked. */
export function terminalLine(session: Session, { from, to, message }: Partial<SendPicks>): TermText | null {
  const offers = sendingOf(session);
  const address = offers?.send.to.find((chip) => chip.id === to)?.address;
  const picked = offers?.send.message.find((chip) => chip.id === message);
  if (!offers || !address || !picked) return null;
  switch (lineKindOf(picked)) {
    case 'ping':
      return TERMINAL_TEXT.ping(address, picked.ttl);
    case 'traceroute':
      return TERMINAL_TEXT.traceroute(address);
    case 'packet': {
      const origin = offers.send.from.find((chip) => chip.id === from);
      return origin ? TERMINAL_TEXT.packet(endpointName(origin.endpoint, session.world), address) : null;
    }
    case 'handmade':
      return TERMINAL_TEXT.handmade(picked.label, address);
    case 'nc':
      return picked.port === undefined ? null : TERMINAL_TEXT.nc(address, picked.port);
    case 'dig':
      return TERMINAL_TEXT.dig(address);
    case 'curl': {
      const url = urlOfChip(offers.send.to.find((chip) => chip.id === to)!);
      return url === undefined ? null : TERMINAL_TEXT.curl(url, picked.options);
    }
    case 'browser':
      return null;
  }
}
