import { MAP_TEXT, SETTINGS_TEXT, entityTerm, nameTag, type EntityRef, type TermId, type TermText } from '@/copy';
import { isClientActor, type Network } from '@/engine';
import { blockingDeviceIds, intrudedDeviceIds } from '@/game/flow-runs';
import { canConfigure, type Session } from '@/game/session';
import { PIECE_ID } from './piece-id';
import { identifyPieces } from './cards/identify-card';
import { settingsDeviceIds } from './cards/settings-card';
import { originPieces } from './cards/terminal-card';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';
export type PieceState = 'normal' | 'intruded' | 'blocking';

type PieceEntity = Extract<EntityRef, { kind: PieceKind }>;

export interface SettingsEntry {
  id: string;
  label: TermText;
}

interface PieceFacts {
  id: string;
  anchorId: string;
  label: TermText;
  locked: boolean;
  configurable: boolean;
  state: PieceState;
  settings?: SettingsEntry;
}

export type PieceView = PieceEntity & PieceFacts & { term: TermId | null };

const ROUTER_ENTITY = { kind: 'edge', variant: 'router' } as const;

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

/** True when the incident draws the world thing with this id: it lists it, or it lists nothing and draws the whole world. A firewall is not listed, it is drawn with its device. */
export function isShown(session: Session, id: string): boolean {
  const { shown } = session.incident;
  return shown === undefined || shown.includes(id);
}

/** True when the map draws the router with this id: the incident shows it and the term router is known. A text that names a router must agree with this. */
export function drawsRouter(session: Session, routerId: string): boolean {
  return isShown(session, routerId) && isDrawn(session.known, ROUTER_ENTITY);
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

function routers(session: Session): PieceView[] {
  return (session.world.routers ?? [])
    .filter((router) => drawsRouter(session, router.id))
    .map((router) => piece(ROUTER_ENTITY, { id: PIECE_ID.router(router.id), anchorId: router.id, label: nameTag(router.name), locked: true, configurable: false, state: 'normal' }));
}

function loneEdge({ world, known }: Pick<Session, 'world' | 'known'>): PieceView[] {
  const edge = { kind: 'edge', variant: world.edge } as const;
  return isDrawn(known, edge) ? [piece(edge, { id: PIECE_ID.edge, anchorId: EDGE_ANCHOR, label: MAP_TEXT.edge[world.edge], locked: true, configurable: false, state: 'normal' })] : [];
}

function hasRouters(world: Network): boolean {
  return (world.routers ?? []).length > 0;
}

function outside(session: Session): PieceView[] {
  const { world, known } = session;
  const internet = { kind: 'internet', variant: 'internet' } as const;
  return [
    ...(hasRouters(world) ? routers(session) : loneEdge(session)),
    ...(isDrawn(known, internet) ? [piece(internet, { id: PIECE_ID.internet, anchorId: INTERNET_ANCHOR, label: MAP_TEXT.internet, locked: false, configurable: false, state: 'normal' })] : []),
  ];
}

/** Returns every piece the map shows, in the variant of its model, with its term, its label by official name, whether the player may open it and its state. An incident that lists what it draws (`shown`) draws only those devices, routers and actors, and a firewall with its device; with no list it draws the whole world. A firewall, a router and the internet wait for their terms. A firewall opens its rules; a device or an actor that is an origin of a send incident opens its terminal; a device with a card in an identify incident opens it. A world with routers draws them in place of the lone edge, each under its own name. A device the incident offers settings for has a second entry, `settings`, that opens its settings card (`PIECE_ID.settings`): it is a button beside the label of the device, not a piece of the map, so it has no shape and no place of its own. A server of the internet is not an actor piece: it is a device of the variant `internet-server`, under the id of its actor. */
export function pieceViews(session: Session): PieceView[] {
  const { world, parts } = session;
  const intruded = intrudedDeviceIds(session.runs);
  const opening = new Set([...Object.values(originPieces(session)), ...identifyPieces(session)]);
  const withSettings = new Set(settingsDeviceIds(session));
  return [
    ...world.devices
      .filter((device) => isShown(session, device.id))
      .map((device) => {
        const id = PIECE_ID.device(device.id);
        const sends = opening.has(id);
        const settings = withSettings.has(device.id) ? { settings: { id: PIECE_ID.settings(device.id), label: SETTINGS_TEXT.entry(nameTag(device.name)) } } : {};
        return piece(
          { kind: 'device', variant: device.kind },
          { id, anchorId: device.id, label: nameTag(device.name), locked: !parts.hostSettings && !sends, configurable: sends, state: intruded.has(device.id) ? 'intruded' : 'normal', ...settings },
        );
      }),
    ...firewalls(session),
    ...world.actors
      .filter((actor) => isShown(session, actor.id))
      .flatMap((actor): PieceView[] => {
        const id = PIECE_ID.actor(actor.id);
        const sends = opening.has(id);
        if (!isClientActor(actor)) return [piece({ kind: 'device', variant: 'internet-server' }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: !sends, configurable: sends, state: 'normal' })];
        return [piece({ kind: 'actor', variant: actor.kind }, { id, anchorId: actor.id, label: nameTag(actor.name), locked: false, configurable: sends, state: 'normal' })];
      }),
    ...outside(session),
  ];
}
