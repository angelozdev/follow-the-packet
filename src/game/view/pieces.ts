import { MAP_TEXT, entityTerm, nameTag, type EntityRef, type TermId, type TermText } from '@/copy';
import { isClientActor } from '@/engine';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';
import { originPieces } from './cards/terminal-card';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';
export type PieceState = 'normal' | 'intruded' | 'blocking';

type PieceEntity = Extract<EntityRef, { kind: PieceKind }>;

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
  state: PieceState;
}

export type PieceView = PieceEntity & PieceFacts & { term: TermId | null };

export const EDGE_ANCHOR = 'edge';
export const INTERNET_ANCHOR = 'internet';

function piece(entity: PieceEntity, facts: PieceFacts): PieceView {
  return { ...entity, ...facts, term: entityTerm(entity) };
}

/** True when the map draws a piece of this entity: its term is known, or it has none. A device and an actor are the base of every map and are always drawn; the firewall, the edge and the internet wait for their terms. */
export function isDrawn(known: ReadonlySet<TermId>, entity: EntityRef): boolean {
  const term = entityTerm(entity);
  return term === null || known.has(term);
}

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  const blocking = blockingDeviceIds(session.runs);
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    const entity = { kind: 'firewall', variant: firewall.kind } as const;
    if (!owner || !isDrawn(session.known, entity)) return [];
    const configurable = canConfigure(session, firewall.id);
    const state: PieceState = blocking.has(owner.id) ? 'blocking' : 'normal';
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable, state };
    return [piece(entity, facts)];
  });
}

function outside(session: Session): PieceView[] {
  const { world, known } = session;
  const edge = { kind: 'edge', variant: world.edge } as const;
  const internet = { kind: 'internet', variant: 'internet' } as const;
  return [
    ...(isDrawn(known, edge) ? [piece(edge, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false, state: 'normal' })] : []),
    ...(isDrawn(known, internet) ? [piece(internet, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false, state: 'normal' })] : []),
  ];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state. A firewall opens its rules; a device or an actor that is an origin of a send incident opens its terminal. A firewall, the edge and the internet are drawn only once their terms are known, with or without someone outside the network. A server of the internet is not an actor piece, so it gets none here. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  const intruded = intrudedDeviceIds(session.runs);
  const origins = new Set(Object.values(originPieces(session)));
  return [
    ...world.devices.map((device) => {
      const id = PIECE_ID.device(device.id);
      const sends = origins.has(id);
      return piece(
        { kind: 'device', variant: device.kind },
        { id, anchorId: device.id, label: nameTag(device.name), locked: !parts.hostSettings && !sends, configurable: sends, state: intruded.has(device.id) ? 'intruded' : 'normal' },
      );
    }),
    ...firewalls(session),
    ...world.actors.filter(isClientActor).map((actor) => {
      const id = PIECE_ID.actor(actor.id);
      return piece({ kind: 'actor', variant: actor.kind }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: false, configurable: origins.has(id), state: 'normal' });
    }),
    ...outside(session),
  ];
}
