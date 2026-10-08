import { MAP_TEXT, type TermId, type TermText } from '@/copy';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

export type PieceKind = 'server' | 'barrier' | 'actor' | 'gateway';

export interface PieceView {
  id: string;
  kind: PieceKind;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
}

export const GATEWAY_ANCHOR = 'igw';

/** Names the internet entrance plainly until its term is known. */
export function gatewayLabel(known: ReadonlySet<TermId>): TermText {
  return known.has('internet-gateway') ? MAP_TEXT.gateway : MAP_TEXT.gatewayPlain;
}

function barriers(session: Session): PieceView[] {
  const { world } = session;
  return world.securityGroups.flatMap((group): PieceView[] => {
    const owner = world.instances.find((instance) => instance.sgIds.includes(group.id));
    if (!owner) return [];
    const configurable = canConfigure(session, group.id);
    return [{ id: PIECE_ID.barrier(group.id), kind: 'barrier', anchorId: owner.id, label: MAP_TEXT.barrier(group.name), locked: !configurable, configurable }];
  });
}

/** Returns every piece the map shows, with labels that respect the ladder and whether the player may open it. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts, known } = session;
  return [
    ...world.instances.map((instance): PieceView => ({ id: PIECE_ID.server(instance.id), kind: 'server', anchorId: instance.id, label: instance.name, locked: !parts.linuxSettings, configurable: false })),
    ...barriers(session),
    ...world.actors.map((actor): PieceView => ({ id: PIECE_ID.actor(actor.id), kind: 'actor', anchorId: actor.id, label: actor.name, locked: false, configurable: false })),
    { id: PIECE_ID.gateway, kind: 'gateway', anchorId: GATEWAY_ANCHOR, label: gatewayLabel(known), locked: true, configurable: false },
  ];
}
