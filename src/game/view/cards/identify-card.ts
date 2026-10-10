import { deviceName, type EntityRef, type TermText } from '@/copy';
import type { CardChip, IdentifyIncident, TraySpec } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';

interface IdentifyChip {
  id: string;
  label: TermText;
  lines: TermText[];
  correct: boolean;
}

interface IdentifyTray {
  id: string;
  name: string;
  segmented: boolean;
  saved: string | null;
  chips: IdentifyChip[];
}

export interface IdentifyCard {
  deviceId: string;
  entity: Extract<EntityRef, { kind: 'device' }>;
  title: TermText;
  question: TermText | null;
  trays: IdentifyTray[];
}

function identifyingIncident(session: Session): IdentifyIncident | null {
  return session.incident.mechanic === 'identify' ? session.incident : null;
}

/** Returns the piece ids of the devices whose card the incident offers, in the order of its cards; empty when the incident does not identify. */
export function identifyPieces(session: Session): string[] {
  return (identifyingIncident(session)?.identify.cards ?? []).map((card) => PIECE_ID.device(card.deviceId));
}

function linesOf(tray: TraySpec, chip: CardChip): TermText[] {
  const rule = tray.initialPickRule !== undefined && chip.id !== tray.initialPick ? [tray.initialPickRule] : [];
  return [...(chip.feedback === undefined ? [] : [chip.feedback]), ...rule];
}

function trayOf(incident: IdentifyIncident, session: Session, deviceId: string, tray: TraySpec): IdentifyTray {
  const expects = (chipId: string) => incident.tasks.some(({ expect }) => expect.deviceId === deviceId && expect.trayId === tray.id && expect.chipId === chipId);
  return {
    id: tray.id,
    name: tray.name,
    segmented: tray.segmented === true,
    saved: session.answers[deviceId]?.[tray.id] ?? null,
    chips: tray.chips.map((chip) => ({ id: chip.id, label: chip.label, lines: linesOf(tray, chip), correct: expects(chip.id) })),
  };
}

/** Returns what the card of a device piece shows: its title (the name of the device), its question, and each tray with the chip saved as the answer (the initial pick until the player confirms another) and, for each chip, the lines it shows when the player presses Listo with it picked: its own feedback and then, for a chip that is not the initial pick, the rule of the initial pick. `correct` says whether a task expects that chip, so the card can tell the line of a right chip from the line of a wrong one. Null when the piece has no card in this incident. */
export function identifyCard(session: Session, pieceId: string): IdentifyCard | null {
  const incident = identifyingIncident(session);
  const spec = incident?.identify.cards.find((card) => PIECE_ID.device(card.deviceId) === pieceId);
  const device = session.world.devices.find((candidate) => candidate.id === spec?.deviceId);
  if (!incident || !spec || !device) return null;
  return {
    deviceId: device.id,
    entity: { kind: 'device', variant: device.kind },
    title: deviceName(session.world, device.id),
    question: spec.question ?? null,
    trays: spec.trays.map((tray) => trayOf(incident, session, device.id, tray)),
  };
}
