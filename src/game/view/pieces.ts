import { MAP_TEXT, entityTerm, nameTag, type EntityRef, type TermId, type TermText } from '@/copy';
import { facesALan, isClientActor, type Network } from '@/engine';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';
import { insideBlockPieces } from './cards/identify/classify-card';
import { pieceCard } from './cards/piece-card';
import { ROUTER_ENTITY, drawsActor, drawsRouter, isDrawn, isShown, shownIds, waitsForTraceroute } from './drawn';

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
  inOffice?: boolean;
  insideBlock?: true;
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
    const entity = { kind: 'firewall', variant: firewall.kind } as const;
    if (!owner || !isShown(session, owner.id) || !isDrawn(session.known, entity)) return [];
    const configurable = canConfigure(session, firewall.id);
    const state: PieceState = blocking.has(owner.id) ? 'blocking' : 'normal';
    const facts = { id: PIECE_ID.firewall(firewall.id), anchorId: owner.id, label: MAP_TEXT.firewall[firewall.kind](firewall.name), locked: !configurable, configurable, state };
    return [piece(entity, facts)];
  });
}

function opens(session: Session, pieceId: string): boolean {
  return pieceCard(session, pieceId) !== null;
}

function routers(session: Session): PieceView[] {
  return (session.world.routers ?? [])
    .filter((router) => drawsRouter(session, router.id))
    .map((router) => {
      const id = PIECE_ID.router(router.id);
      const opening = opens(session, id);
      return piece(ROUTER_ENTITY, { id, anchorId: router.id, label: nameTag(router.name), locked: !opening, configurable: opening, state: 'normal', inOffice: facesALan(session.world, router) });
    });
}

function loneEdge({ world, known }: Pick<Session, 'world' | 'known'>): PieceView[] {
  const edge = { kind: 'edge', variant: world.edge } as const;
  return isDrawn(known, edge) ? [piece(edge, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false, state: 'normal' })] : [];
}

function hasRouters(world: Network): boolean {
  return (world.routers ?? []).length > 0;
}

/** True when the map has something to show outside the office: the incident lists nothing, and then draws the whole world, or it lists an actor or a router outside the office, one with no interface facing a local network, that is not waiting for a traceroute. The lone edge and the internet, which have no id to list, are drawn only then. */
function drawsOutside(session: Session): boolean {
  const { world } = session;
  const shown = shownIds(session);
  if (shown === undefined) return true;
  const outsideRouters = (world.routers ?? []).filter((router) => !facesALan(world, router) && !waitsForTraceroute(session, router.id));
  const outsideIds = [...world.actors, ...outsideRouters].map((outsider) => outsider.id);
  return shown.some((id) => outsideIds.includes(id));
}

function outside(session: Session): PieceView[] {
  const { world, known } = session;
  const internet = { kind: 'internet', variant: 'internet' } as const;
  const outsideDrawn = drawsOutside(session);
  const way = hasRouters(world) ? routers(session) : outsideDrawn ? loneEdge(session) : [];
  return [...way, ...(outsideDrawn && isDrawn(known, internet) ? [piece(internet, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false, state: 'normal' })] : [])];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state. An incident that lists what it draws (`shown`, which in a case of a diagnose is the list of that case when it has one) draws only those devices, routers and actors, and a firewall with its device; with no list it draws the whole world. A firewall, a router and the internet wait for their terms. A firewall opens its rules; every other piece opens one card with a tab for each card it has (`pieceCard`): a device or an actor that is an origin of a send incident its terminal, a device the incident offers settings or services for those, a router its tables, a server of names its records and its cache, and a device with a card in an identify incident that card. A piece with no card is locked. A world with routers draws them in place of the lone edge, each under its own name. With a list, the lone edge and the internet are drawn only when the list holds something outside the office (an actor, or a router with no interface facing a local network). A piece has one button on the map and no second entry. A device is `insideBlock` while it is inside the block of the card that classifies (its owner from the start, and each item the player placed in the bin of what fits); the mark is absent otherwise. A server of the internet is not an actor piece: it is a device of the variant `internet-server`, under the id of its actor, and a server of names (one with a `dns` role) waits for the term of its role, `resolver` or `authoritative-server`, like a router waits for `router`. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  const intruded = intrudedDeviceIds(session.runs);
  const inside = insideBlockPieces(session);
  return [
    ...world.devices
      .filter((device) => isShown(session, device.id))
      .map((device) => {
        const id = PIECE_ID.device(device.id);
        const opening = opens(session, id);
        const mark = inside.has(id) ? { insideBlock: true as const } : {};
        return piece(
          { kind: 'device', variant: device.kind },
          { id, anchorId: device.id, label: nameTag(device.name), locked: !parts.hostSettings && !opening, configurable: opening, state: intruded.has(device.id) ? 'intruded' : 'normal', ...mark },
        );
      }),
    ...firewalls(session),
    ...world.actors
      .filter((actor) => drawsActor(session, actor))
      .flatMap((actor): PieceView[] => {
        const id = PIECE_ID.actor(actor.id);
        const opening = opens(session, id);
        if (!isClientActor(actor)) return [piece({ kind: 'device', variant: 'internet-server' }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: !opening, configurable: opening, state: 'normal' })];
        return [piece({ kind: 'actor', variant: actor.kind }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: false, configurable: opening, state: 'normal' })];
      }),
    ...outside(session),
  ];
}
