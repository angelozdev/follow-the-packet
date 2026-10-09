import { MAP_TEXT, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface PieceView {
  id: string;
  kind: PieceKind;
  anchorId: string;
  term: TermId | null;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export const GATEWAY_ANCHOR = 'igw';

export const PIECE_TERM = {
  server: 'ec2-instance',
  barrier: 'security-group',
  gateway: 'internet-gateway',
  actor: null,
} as const satisfies Record<PieceKind, TermId | null>;

function barriers(session: Session): PieceView[] {
  const { world } = session;
  return world.securityGroups.flatMap((group): PieceView[] => {
    const owner = world.instances.find((instance) => instance.sgIds.includes(group.id));
    if (!owner) return [];
    const configurable = canConfigure(session, group.id);
    return [
      { id: PIECE_ID.barrier(group.id), kind: 'barrier', anchorId: owner.id, term: PIECE_TERM.barrier, label: MAP_TEXT.barrier(group.name), locked: !configurable, configurable },
    ];
  });
}

/** Returns every piece the map shows, with its term, its label by official name and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  return [
    ...world.instances.map(
      (instance): PieceView => ({ id: PIECE_ID.server(instance.id), kind: 'server', anchorId: instance.id, term: PIECE_TERM.server, label: instance.name, locked: !parts.linuxSettings, configurable: false }),
    ),
    ...barriers(session),
    ...world.actors.map(
      (actor): PieceView => ({ id: PIECE_ID.actor(actor.id), kind: 'actor', anchorId: actor.id, term: PIECE_TERM.actor, label: actor.name, locked: false, configurable: false }),
    ),
    { id: PIECE_ID.gateway, kind: 'gateway', anchorId: GATEWAY_ANCHOR, term: PIECE_TERM.gateway, label: MAP_TEXT.gateway, locked: true, configurable: false },
  ];
}
