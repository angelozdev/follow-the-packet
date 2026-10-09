import { MAP_TEXT, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'device' | 'firewall' | 'actor' | 'edge';

export interface PieceView {
  id: string;
  kind: PieceKind;
  anchorId: string;
  term: TermId | null;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export const EDGE_ANCHOR = 'edge';

export const PIECE_TERM = {
  device: 'ec2-instance',
  firewall: 'security-group',
  edge: 'internet-gateway',
  actor: null,
} as const satisfies Record<PieceKind, TermId | null>;

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);
    return [
      { id: PIECE_ID.firewall(firewall.id), kind: 'firewall', anchorId: owner.id, term: PIECE_TERM.firewall, label: MAP_TEXT.firewall(firewall.name), locked: !configurable, configurable },
    ];
  });
}

/** Returns every piece the map shows, with its term, its label by official name and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  return [
    ...world.devices.map(
      (device): PieceView => ({ id: PIECE_ID.device(device.id), kind: 'device', anchorId: device.id, term: PIECE_TERM.device, label: device.name, locked: !parts.hostSettings, configurable: false }),
    ),
    ...firewalls(session),
    ...world.actors.map(
      (actor): PieceView => ({ id: PIECE_ID.actor(actor.id), kind: 'actor', anchorId: actor.id, term: PIECE_TERM.actor, label: actor.name, locked: false, configurable: false }),
    ),
    { id: PIECE_ID.edge, kind: 'edge', anchorId: EDGE_ANCHOR, term: PIECE_TERM.edge, label: MAP_TEXT.edge, locked: true, configurable: false },
  ];
}
