import { MAP_TEXT, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'actor';

type PieceEntity = Extract<EntityRef, { kind: PieceKind }>;

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export type PieceView = PieceEntity & PieceFacts & { term: TermId | null };

export const EDGE_ANCHOR = 'edge';

function piece(entity: PieceEntity, facts: PieceFacts): PieceView {
  return { ...entity, ...facts, term: entityTerm(entity) };
}

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable };
    return [piece({ kind: 'firewall', variant: firewall.kind }, facts)];
  });
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  return [
    ...world.devices.map((device) =>
      piece({ kind: 'device', variant: device.kind }, { id: PIECE_ID.device(device.id), anchorId: device.id, label: device.name, locked: !parts.hostSettings, configurable: false }),
    ),
    ...firewalls(session),
    ...world.actors.map((actor) => piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false }),
  ];
}
