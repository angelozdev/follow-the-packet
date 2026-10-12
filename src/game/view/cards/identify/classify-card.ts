import { CLASSIFY_TEXT, deviceName, type EntityRef, type TermText } from '@/copy';
import { ipBits, ipInCidr, maskOf, parseCidr, prefixNumbers, type Device } from '@/engine';
import type { ClassifySpec, IdentifyIncident } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';

const BITS_IN_NUMBER = 8;

export interface ClassifyBit {
  value: number;
  fixed: boolean;
}

export interface ClassifyNumber {
  bits: ClassifyBit[];
  decimal: number;
}

/** The IP of an item split where the prefix ends, when it ends at a dot: the numbers that are the block's (with their last dot) and the ones that are the device's. */
export interface IpSplit {
  block: string;
  device: string;
}

export interface ClassifyLine {
  fits: boolean;
  right: boolean;
  text: TermText;
}

export interface ClassifyItem {
  deviceId: string;
  pieceId: string;
  name: TermText;
  ip: string;
  split: IpSplit | null;
  placed: string | null;
  line: ClassifyLine | null;
}

export interface ClassifyBin {
  id: string;
  name: string;
  items: ClassifyItem[];
}

export interface ClassifyCard {
  deviceId: string;
  pieceId: string;
  entity: Extract<EntityRef, { kind: 'device' }>;
  title: TermText;
  trayId: string;
  block: string;
  prefix: number;
  blockNumbers: number | null;
  mask: string;
  ownerIp: string;
  numbers: ClassifyNumber[];
  bins: ClassifyBin[];
  waiting: ClassifyItem[];
}

function classifySpec(session: Session): { incident: IdentifyIncident; spec: ClassifySpec } | null {
  const { incident } = session;
  return incident.mechanic === 'identify' && incident.identify.classify ? { incident, spec: incident.identify.classify } : null;
}

/** Returns the bits of an IP as four numbers: eight bits each, with the decimal value they write and whether the prefix fixes each one (the first `prefix` bits of the 32). */
export function bitsRow(ip: string, prefix: number): ClassifyNumber[] {
  const bits = ipBits(ip).map((value, index) => ({ value, fixed: index < prefix }));
  return Array.from({ length: bits.length / BITS_IN_NUMBER }, (_, number) => {
    const group = bits.slice(number * BITS_IN_NUMBER, (number + 1) * BITS_IN_NUMBER);
    return { bits: group, decimal: group.reduce((total, bit) => total * 2 + bit.value, 0) };
  });
}

/** Splits an IP where the prefix ends when it ends at a dot (/8, /16 and /24), with the dot in the part of the block; with any other prefix the IP is not split, because the line between the block and the device falls inside a number and only the row of bits shows it. */
export function splitIp(ip: string, prefix: number): IpSplit | null {
  const count = prefixNumbers(prefix);
  if (count === null) return null;
  const parts = ip.split('.');
  return { block: `${parts.slice(0, count).join('.')}.`, device: parts.slice(count).join('.') };
}

function lineOf(item: Device, placed: string, inside: string, block: string, prefix: number): ClassifyLine {
  const fits = ipInCidr(item.privateIp, block);
  const numbers = prefixNumbers(prefix);
  return {
    fits,
    right: fits === (placed === inside),
    text: fits ? CLASSIFY_TEXT.line.fits(item.privateIp, prefix, block, numbers) : CLASSIFY_TEXT.line.doesNotFit(item.privateIp, prefix, block, numbers),
  };
}

function itemOf(session: Session, device: Device, spec: ClassifySpec): ClassifyItem {
  const answered = session.answers[device.id]?.[spec.trayId];
  const placed = spec.bins.some((bin) => bin.id === answered) ? (answered ?? null) : null;
  const { prefix } = parseCidr(spec.cidr);
  return {
    deviceId: device.id,
    pieceId: PIECE_ID.device(device.id),
    name: deviceName(session.world, device.id),
    ip: device.privateIp,
    split: splitIp(device.privateIp, prefix),
    placed,
    line: placed === null ? null : lineOf(device, placed, spec.bins[0].id, spec.cidr, prefix),
  };
}

/** Returns the card that classifies, for the piece of its owner. It has the block with its mask, the 32 bits of the IP of the owner with the first ones the prefix fixes marked, the items (devices of the world) each with its IP split at the prefix when that ends at a dot, the two bins with the items that already have an answer (`Session.answers`, under the tray the card names), and the items still to classify. The first bin is the one that holds what fits in the block and the second what does not. A placed item carries a line that says whether it fits, with the first numbers of its IP, and whether the bin it was placed in is the right one. Null for any other piece and for an incident with no such card. */
export function classifyCard(session: Session, pieceId: string): ClassifyCard | null {
  const found = classifySpec(session);
  const owner = found && session.world.devices.find((device) => device.id === found.spec.deviceId);
  if (!found || !owner || PIECE_ID.device(owner.id) !== pieceId) return null;
  const { spec } = found;
  const { prefix } = parseCidr(spec.cidr);
  const items = spec.items.flatMap((id) => session.world.devices.filter((device) => device.id === id)).map((device) => itemOf(session, device, spec));
  return {
    deviceId: owner.id,
    pieceId,
    entity: { kind: 'device', variant: owner.kind },
    title: deviceName(session.world, owner.id),
    trayId: spec.trayId,
    block: spec.cidr,
    prefix,
    blockNumbers: prefixNumbers(prefix),
    mask: maskOf(prefix),
    ownerIp: owner.privateIp,
    numbers: bitsRow(owner.privateIp, prefix),
    bins: spec.bins.map((bin) => ({ id: bin.id, name: bin.name, items: items.filter((item) => item.placed === bin.id) })),
    waiting: items.filter((item) => item.placed === null),
  };
}

/** Returns the block of the card that classifies, such as 192.168.1.0/24, which the map writes beside the outline; null when the incident has no such card. */
export function classifiedBlock(session: Session): string | null {
  return classifySpec(session)?.spec.cidr ?? null;
}

/** Returns the piece ids of the devices that are inside the block: the owner of the card, from the start, and each item the player placed in the bin of what fits. Empty when the incident has no card that classifies. */
export function insideBlockPieces(session: Session): ReadonlySet<string> {
  const found = classifySpec(session);
  if (!found) return new Set();
  const card = classifyCard(session, PIECE_ID.device(found.spec.deviceId));
  return new Set(card ? [card.pieceId, ...(card.bins[0]?.items ?? []).map((item) => item.pieceId)] : []);
}
