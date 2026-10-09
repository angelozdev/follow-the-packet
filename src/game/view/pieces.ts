import { MAP_TEXT, entityTerm, type EntityRef, type TermId, type TermText } from '@/copy';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';

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

function firewalls(session: Session): PieceView[] {
  const { world } = session;
  const blocking = blockingDeviceIds(session.runs);
  return world.firewalls.flatMap((firewall): PieceView[] => {
    const owner = world.devices.find((device) => device.firewallIds.includes(firewall.id));
    if (!owner) return [];
    const configurable = canConfigure(session, firewall.id);
    const state: PieceState = blocking.has(owner.id) ? 'blocking' : 'normal';
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable, state };
    return [piece({ kind: 'firewall', variant: firewall.kind }, facts)];
  });
}

function outside(session: Session): PieceView[] {
  const { world } = session;
  if (world.actors.length === 0) return [];
  return [
    piece({ kind: 'edge', variant: world.edge }, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false, state: 'normal' }),
    piece({ kind: 'internet', variant: 'internet' }, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false, state: 'normal' }),
  ];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state; the edge and the internet show only when someone is outside the network. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  const intruded = intrudedDeviceIds(session.runs);
  return [
    ...world.devices.map((device) =>
      piece(
        { kind: 'device', variant: device.kind },
        { id: PIECE_ID.device(device.id), anchorId: device.id, label: device.name, locked: !parts.hostSettings, configurable: false, state: intruded.has(device.id) ? 'intruded' : 'normal' },
      ),
    ),
    ...firewalls(session),
    ...world.actors.map((actor) =>
      piece({ kind: 'actor', variant: actor.kind }, { id: PIECE_ID.actor(actor.id), anchorId: actor.id, label: actor.name, locked: false, configurable: false, state: 'normal' }),
    ),
    ...outside(session),
  ];
}
