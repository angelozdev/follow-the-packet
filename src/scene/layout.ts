import type { Actor, ClientActor, Device, Network, PacketSpec, Reason, Router, ServerActor, Trace } from '@/engine';
import type { MapPieceKind } from './overlay/piece-label';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type CardSide = 'left' | 'right';
/** Where a card opens: on a side of its anchor, or docked in the bottom left corner of the map. */
export type CardPosition = CardSide | 'dock';

/** Pixels per world unit of the map's orthographic camera. */
export const CAMERA_ZOOM = 38;
/** Width in pixels of a card beside a piece. */
export const CARD_WIDTH = 300;
/** Half the width in pixels that a card keeps clear around the label of another piece: the widest label, a name with its lock. */
export const LABEL_REACH = 64;

/** Where a card anchors on the map and how it keeps clear of it: its distance in pixels from the anchor, the labels its side must keep clear (null when only the room on screen decides its side), the label of every piece the card may cover when it docks, and the point on the ground where each of those pieces stands, in the same order as the labels. */
export interface CardPlacement {
  position: Vec3;
  gap: number;
  avoid: Vec3[] | null;
  labels: Vec3[];
  rooted: Vec3[];
}

export interface SubnetSpot {
  x: number;
  z: number;
  width: number;
  depth: number;
}

export interface DeviceSpot {
  x: number;
  z: number;
  firewall: Vec2;
  door: Vec2;
  doorstep: Vec2;
  road: Vec2;
  plugged: boolean;
}

/** The slab of a floor, the local network of an office that declares them, with the point where its label floats. */
export interface FloorSpot {
  x: number;
  z: number;
  width: number;
  depth: number;
  label: Vec3;
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  floors: Record<string, FloorSpot>;
  devices: Record<string, DeviceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  outside: boolean;
  edge: Vec2;
  internet: Vec2;
  actors: Record<string, Vec2>;
  routers: Record<string, Vec2>;
  servers: Record<string, Vec2>;
  stops: Vec2[];
  bounds: { left: number; right: number };
}

/** A piece the map draws, as the layout sees it: its kind and what it stands for. A device piece whose anchor is a server of the internet stands for that server, and an edge piece whose anchor is a router of the world stands for that router. */
export interface LayoutPiece {
  kind: MapPieceKind;
  anchorId: string;
}

interface Column {
  id: string | null;
  devices: Device[];
  unplugged: Device[];
}

interface Drawn {
  devices: Device[];
  servers: ServerActor[];
  clients: ClientActor[];
  routers: Router[];
  edge: boolean;
  internet: boolean;
}

const GAP = 3.2;
const MIN_COLUMN = 5;
const DEPTH = 6;
const ROAD_Z = 1.9;
const ROAD_INSET = 0.5;
const DEVICE_Z = -0.9;
const FIREWALL_Z = 0.7;
const DOOR_Z = -0.2;
const DOORSTEP_Z = 0.25;
const EDGE_MARGIN = 1.5;
const INTERNET_GAP = 3.6;
const ACTOR_GAP = 3;
const ACTOR_SPACING = 2.5;
const ROUTER_GAP = 2.4;
const SLAB_GAP = 0.4;
const UNPLUGGED_GAP = 2;
const FLOOR_LABEL_Z = DEPTH / 2 + 0.4;
const SERVER_KIND: Actor['kind'] = 'server';
const ACTOR_STAGGER_Z = 1.6;
const LABEL_OFFSET: Record<MapPieceKind, Vec3> = { device: [0, 1.75, 0], firewall: [0, 0.1, 0.8], actor: [0, 0.05, 1.1], edge: [0, 3.1, 0], internet: [0, 2.1, 0] };
const SERVER_LABEL_OFFSET: Vec3 = [0, 2.05, 0];
const SERVER_LABEL_OVERHANG = 1.75;
const CARD_Y = 0.5;
const CAMERA_OFFSET = 14;
const FIREWALL_CARD_GAP = 110;
const ORIGIN_CARD_GAP = 70;
const CARD_MARGIN = 12;
const DOCK_MARGIN = 6;
const GROUND_REACH = 16;
const MIN_DOCK_ROOM = 200;
const STAMP_SPREAD = 0.8;
const STAMP_NEAR = 1;
const STAMP_PX = 32;
const UNIT_PX_X = CAMERA_ZOOM / Math.SQRT2;
const UNIT_PX_Y = CAMERA_ZOOM / Math.sqrt(6);
const EDGE_PLACES: string[] = ['internet-gateway', 'router'] satisfies Network['edge'][];
const NOBODY_HAS_IT: Reason['code'][] = ['route-no-device'];

function isServer(actor: Actor): actor is ServerActor {
  return actor.kind === SERVER_KIND;
}

/** The pieces of the whole world, as the map drew it before an incident could pick: every device, and, when the map shows the outside, the routers (or the lone edge), the internet, the servers and the actors. */
function wholeMap(net: Network, outside: boolean): LayoutPiece[] {
  const devices: LayoutPiece[] = net.devices.map((d) => ({ kind: 'device', anchorId: d.id }));
  if (!outside) return devices;
  const routers: LayoutPiece[] = (net.routers ?? []).map((r) => ({ kind: 'edge', anchorId: r.id }));
  return [
    ...devices,
    ...net.actors.map((a): LayoutPiece => ({ kind: isServer(a) ? 'device' : 'actor', anchorId: a.id })),
    ...(routers.length > 0 ? routers : [{ kind: 'edge', anchorId: 'edge' } satisfies LayoutPiece]),
    { kind: 'internet', anchorId: 'internet' },
  ];
}

function facesALan(net: Network, router: Router): boolean {
  const others = new Set([...(net.routers ?? []), ...net.actors].map((thing) => thing.id));
  return router.interfaces.some((face) => !others.has(face.faces));
}

/** Orders the routers from the office outward: first the ones that face a local network, then the ones they face, and so on; a router nothing reaches comes last. */
function roadOrder(net: Network): Router[] {
  const routers = net.routers ?? [];
  const order = routers.filter((router) => facesALan(net, router));
  for (const router of order) {
    for (const face of router.interfaces) {
      const next = routers.find((candidate) => candidate.id === face.faces);
      if (next && !order.includes(next)) order.push(next);
    }
  }
  return [...order, ...routers.filter((router) => !order.includes(router))];
}

function drawnOf(net: Network, pieces: readonly LayoutPiece[]): Drawn {
  const anchors = (kind: MapPieceKind) => new Set(pieces.filter((piece) => piece.kind === kind).map((piece) => piece.anchorId));
  const [deviceIds, actorIds, edgeIds] = [anchors('device'), anchors('actor'), anchors('edge')];
  const routers = roadOrder(net);
  return {
    devices: net.devices.filter((d) => deviceIds.has(d.id)),
    servers: net.actors.filter(isServer).filter((a) => deviceIds.has(a.id)),
    clients: net.actors.filter((a): a is ClientActor => !isServer(a) && actorIds.has(a.id)),
    routers: routers.filter((r) => edgeIds.has(r.id)),
    edge: [...edgeIds].some((id) => !routers.some((r) => r.id === id)),
    internet: pieces.some((piece) => piece.kind === 'internet'),
  };
}

function lanIdOf(net: Network, device: Device): string | undefined {
  return device.lanId ?? (net.lans?.length === 1 ? net.lans[0].id : undefined);
}

function columnsOf(net: Network, drawn: Device[]): Column[] {
  const unplugged = (d: Device) => d.connected === false;
  const split = (id: string | null, members: Device[]): Column => ({ id, devices: members.filter((d) => !unplugged(d)), unplugged: members.filter(unplugged) });
  const groups: [string | null, Device[]][] = net.subnets
    ? net.subnets.map((subnet) => [subnet.id, drawn.filter((d) => d.subnetId === subnet.id)])
    : net.lans
      ? net.lans.map((lan) => [lan.id, drawn.filter((d) => lanIdOf(net, d) === lan.id)])
      : [[null, drawn]];
  return groups.filter(([, members]) => members.length > 0).map(([id, members]) => split(id, members));
}

interface Office {
  subnets: Record<string, SubnetSpot>;
  floors: Record<string, FloorSpot>;
  devices: Record<string, DeviceSpot>;
  sheetWidth: number;
  right: number;
}

function deviceSpot(x: number, plugged: boolean): DeviceSpot {
  return { x, z: DEVICE_Z, firewall: [x, FIREWALL_Z], door: [x, DOOR_Z], doorstep: [x, DOORSTEP_Z], road: [x, ROAD_Z], plugged };
}

/** Lays out the drawn devices in one column per subnet or floor, side by side and centered on the origin: a VPC and an office with one local network keep a single sheet, and an office with floors gets a slab and a label for each floor that has a piece drawn. A device with no cable stands past the last slab. */
function layOutOffice(net: Network, columns: Column[]): Office {
  const slabbed = net.lans !== undefined;
  const widths = columns.map((column) => Math.max(MIN_COLUMN, column.devices.length * GAP + 1));
  const gap = slabbed ? SLAB_GAP : 0;
  const total = widths.reduce((a, b) => a + b, 0) + gap * Math.max(columns.length - 1, 0);
  const sheetWidth = columns.length === 0 ? 0 : slabbed ? total : total + 2;
  const office: Office = { subnets: {}, floors: {}, devices: {}, sheetWidth, right: sheetWidth / 2 };
  let cursor = -total / 2;
  columns.forEach((column, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width + gap;
    if (net.subnets && column.id) office.subnets[column.id] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1 };
    if (slabbed && column.id) office.floors[column.id] = { x: cx, z: 0, width, depth: DEPTH, label: [cx, 0, FLOOR_LABEL_Z] };
    column.devices.forEach((device, k) => {
      office.devices[device.id] = deviceSpot(cx + (k - (column.devices.length - 1) / 2) * GAP, true);
    });
  });
  columns
    .flatMap((column) => column.unplugged)
    .forEach((device, k) => {
      office.devices[device.id] = deviceSpot(sheetWidth / 2 + UNPLUGGED_GAP + k * GAP, false);
    });
  return office;
}

/** Lays out the way out to the left of the office, along the road: the drawn routers (or the lone edge) one after another, then the internet, then the servers and the actors. A router, a server or an actor that is not drawn takes no place. */
function layOutOutside(drawn: Drawn, sheetWidth: number): Pick<Layout, 'edge' | 'internet' | 'actors' | 'routers' | 'servers' | 'stops'> {
  const edge: Vec2 = [-sheetWidth / 2 - EDGE_MARGIN, ROAD_Z];
  const routers: Record<string, Vec2> = {};
  drawn.routers.forEach((router, k) => {
    routers[router.id] = [edge[0] - k * ROUTER_GAP, ROAD_Z];
  });
  const lastX = edge[0] - Math.max(drawn.routers.length - 1, 0) * ROUTER_GAP;
  const internet: Vec2 = [lastX - INTERNET_GAP, ROAD_Z];
  const beyond = (k: number) => internet[0] - ACTOR_GAP - k * ACTOR_SPACING;
  const servers: Record<string, Vec2> = {};
  drawn.servers.forEach((server, k) => {
    servers[server.id] = [beyond(k), ROAD_Z];
  });
  const actors: Record<string, Vec2> = {};
  drawn.clients.forEach((client, k) => {
    actors[client.id] = [beyond(drawn.servers.length + k), ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  const stops = [...(drawn.edge ? [edge] : []), ...Object.values(routers), ...(drawn.internet ? [internet] : []), ...Object.values(servers)];
  return { edge, internet, actors, routers, servers, stops };
}

/** Lays out the pieces it is given and no others: one column per subnet or floor that has a drawn device, the devices of each column in a row and, when the map shows anything outside the office, the way out to the left. Pass `true` or `false` instead of pieces for the whole world with or without the outside. The size of the office never depends on what is drawn: only where it stands on the map. */
export function computeLayout(net: Network, pieces: readonly LayoutPiece[] | boolean): Layout {
  const drawn = drawnOf(net, typeof pieces === 'boolean' ? wholeMap(net, pieces) : pieces);
  const office = layOutOffice(net, columnsOf(net, drawn.devices));
  const way = layOutOutside(drawn, office.sheetWidth);
  const outside = drawn.edge || drawn.internet || drawn.routers.length > 0 || drawn.servers.length > 0 || drawn.clients.length > 0;
  const waystations = [...(drawn.edge ? [way.edge[0]] : []), ...Object.values(way.routers).map(([x]) => x)];
  const overhanging = Object.values(way.servers).map(([x]) => x - SERVER_LABEL_OVERHANG);
  const reached = [...waystations, ...(drawn.internet ? [way.internet[0]] : []), ...overhanging, ...Object.values(way.actors).map(([x]) => x)];
  const roadStart = waystations.length > 0 ? Math.min(...waystations) : way.edge[0];
  return {
    sheet: { width: office.sheetWidth, depth: DEPTH },
    subnets: office.subnets,
    floors: office.floors,
    devices: office.devices,
    roadZ: ROAD_Z,
    roadFromX: outside ? roadStart : -office.sheetWidth / 2 + ROAD_INSET,
    roadToX: office.sheetWidth / 2 - ROAD_INSET,
    outside,
    bounds: { left: Math.min(-office.sheetWidth / 2, ...reached), right: Math.max(office.right, ...Object.values(office.devices).map((spot) => spot.x + 1)) },
    ...way,
  };
}

/** Returns the middle of everything drawn, so the camera can look at it. */
export function layoutCenter(layout: Layout): Vec2 {
  return [(layout.bounds.left + layout.bounds.right) / 2, 0];
}

/** Returns where a piece of this kind stands on the ground: a device (or a server of the internet), the firewall in front of its device, an actor, a router (or the lone edge) or the internet. */
export function piecePosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec2 {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return spot ? [spot.x, spot.z] : layout.servers[piece.anchorId];
    }
    case 'firewall':
      return layout.devices[piece.anchorId].firewall;
    case 'actor':
      return layout.actors[piece.anchorId];
    case 'edge':
      return layout.routers[piece.anchorId] ?? layout.edge;
    case 'internet':
      return layout.internet;
  }
}

/** Returns where the label of a piece floats from the point it stands on: above a device, in front of a firewall, below an actor, above the edge and the internet. */
export function labelOffset(kind: MapPieceKind): Vec3 {
  return LABEL_OFFSET[kind];
}

/** Returns where the label of a piece floats on the map. The label of a server of the internet floats higher than the label of a device, above the stamp of a ping that reaches the server: that stamp stands on the server itself, where the packet ends, and not at a door beside it. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  const [x, z] = piecePosition(piece, layout);
  const [dx, y, dz] = piece.kind === 'device' && layout.servers[piece.anchorId] ? SERVER_LABEL_OFFSET : labelOffset(piece.kind);
  return [x + dx, y, z + dz];
}

/** Returns where the camera stands to look at the middle of everything drawn: the same isometric view from the front right, whatever the size of the map. */
export function cameraPosition(layout: Layout): Vec3 {
  const [x, z] = layoutCenter(layout);
  return [x + CAMERA_OFFSET, CAMERA_OFFSET, z + CAMERA_OFFSET];
}

/** Returns where the card of a piece is anchored: beside a firewall, a device or an actor. */
export function cardAnchorPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  const [x, z] = piecePosition(piece, layout);
  return [x, CARD_Y, z];
}

/** Picks the side with more room for a card anchored at this normalized screen x (-1 is the left edge, 1 the right edge). */
export function sideForNdc(ndcX: number): CardSide {
  return ndcX > 0 ? 'left' : 'right';
}

/** Returns how the card of a piece anchors. A firewall's card keeps its wide gap and takes the side with more room that keeps it inside the map, or docks in the corner of the map when neither does. The terminal of a device or an actor sits closer, just past its mat and label, and avoids the labels of every piece, its own included (the label of an actor hangs to the left of it), so it never hides the thing the player has to read, or docks in the corner of the map when it cannot. */
export function cardPlacement(piece: { kind: MapPieceKind; anchorId: string }, others: { kind: MapPieceKind; anchorId: string }[], layout: Layout): CardPlacement {
  const position = cardAnchorPosition(piece, layout);
  const pieces = [piece, ...others];
  const rooted = pieces.map((other): Vec3 => {
    const [x, z] = piecePosition(other, layout);
    return [x, 0, z];
  });
  const labels = pieces.map((other) => labelPosition(other, layout));
  if (piece.kind === 'firewall') return { position, gap: FIREWALL_CARD_GAP, avoid: null, labels, rooted };
  return { position, gap: ORIGIN_CARD_GAP, avoid: labels, labels, rooted };
}

/** Returns the horizontal span in pixels, from the map's left edge, that a card covers on a side of its anchor. */
export function cardSpan(side: CardSide, anchorX: number, gap: number): [number, number] {
  return side === 'right' ? [anchorX + gap, anchorX + gap + CARD_WIDTH] : [anchorX - gap - CARD_WIDTH, anchorX - gap];
}

function opensClear(side: CardSide, anchorX: number, avoidXs: number[], room: number, gap: number): boolean {
  const [near, far] = cardSpan(side, anchorX, gap);
  const insideMap = near >= CARD_MARGIN && far <= room - CARD_MARGIN;
  return insideMap && avoidXs.every((x) => x + LABEL_REACH < near || x - LABEL_REACH > far);
}

/** Returns how far from its anchor, in pixels, the bottom left corner of a docked card sits, so that corner lands on the map's bottom left corner, `DOCK_MARGIN` in: the card's shadow still fits, and no room that the corner has is lost. The card hangs from that corner, so its height does not matter. */
export function dockOffset(anchor: Vec2, map: { width: number; height: number }): Vec2 {
  return [DOCK_MARGIN - anchor[0], map.height - DOCK_MARGIN - anchor[1]];
}

/** Returns how tall a card docked in the bottom left corner may be, in pixels, so that it stays inside the map: the height of the map less the margin the dock keeps at its bottom and at its top, and never less than `MIN_DOCK_ROOM`. */
export function dockHeight(map: { height: number }): number {
  return Math.max(MIN_DOCK_ROOM, map.height - 2 * DOCK_MARGIN);
}

/** Returns how tall a card docked in the bottom left corner may be, in pixels, so that it covers no piece: the height from the corner up to the lowest piece the card spans, a piece being its label and all that hangs under it down to its feet (`x` is where its label centers, `bottom` the pixel row of its ground point). A card that grows with what it shows takes this height and scrolls, so the dock does not cover what the player has to read. It is null when no piece stands above the card, and never less than `MIN_DOCK_ROOM`, so a window too short for the map keeps a card that can be used. */
export function dockRoom(pieces: { x: number; bottom: number }[], map: { height: number }): number | null {
  const spanned = pieces.filter(({ x }) => x + LABEL_REACH > DOCK_MARGIN && x - LABEL_REACH < DOCK_MARGIN + CARD_WIDTH);
  if (spanned.length === 0) return null;
  return Math.max(MIN_DOCK_ROOM, map.height - DOCK_MARGIN - Math.max(...spanned.map(({ bottom }) => bottom + GROUND_REACH)));
}

/** Picks where a terminal opens, with every x in pixels from the map's left edge: the side with more room when it keeps the card inside the map and clear of the labels at `avoidXs` (each taken as `LABEL_REACH` wide on both sides), else the other side when that one does, else the dock: the map is a band from the upper left to the lower right, so its bottom left corner is free. A map too narrow to hold the card keeps the side with more room. */
export function terminalSide(anchorX: number, avoidXs: number[], room: number, gap: number): CardPosition {
  const preferred = sideForNdc((anchorX / room) * 2 - 1);
  const other: CardSide = preferred === 'left' ? 'right' : 'left';
  const clear = [preferred, other].find((side) => opensClear(side, anchorX, avoidXs, room, gap));
  if (clear) return clear;
  return room >= CARD_WIDTH + 2 * DOCK_MARGIN ? 'dock' : preferred;
}

const STAYS_IN_DEVICE: Reason['code'][] = ['route-self', 'route-loopback', 'address-invalid', 'forward-no-owner'];
const DROPPED_BY_A_ROUTER: Reason['code'][] = ['forward-ttl-exceeded', 'forward-no-route', 'forward-no-host', 'forward-private-dropped'];

function spotOfActor(layout: Layout, id: string): Vec2 | undefined {
  return layout.actors[id] ?? layout.servers[id];
}

/** True when the packet starts at a piece the map draws: a device with a spot, or an actor or a server with one. A packet that starts at a piece that is not drawn has nowhere to start from. */
export function startsOnMap(packet: PacketSpec, layout: Layout): boolean {
  return packet.from.kind === 'device' ? layout.devices[packet.from.id] !== undefined : spotOfActor(layout, packet.from.id) !== undefined;
}

/** Returns the point of the road between this one and the next drawn stop beyond it, half way: where a packet ends when a router the map does not draw drops it. With nothing drawn beyond, it is the far end of the road. */
function betweenStops(from: Vec2, layout: Layout): Vec2 {
  const next = layout.stops.find(([x]) => x < from[0]);
  const toX = next ? next[0] : layout.bounds.left;
  return [(from[0] + toX) / 2, layout.roadZ];
}

function routerThatDrops(trace: Trace): string | undefined {
  const step = trace.steps.find((s) => s.stage === 'forward' && s.verdict === 'drop' && DROPPED_BY_A_ROUTER.includes(s.reason.code));
  return step && 'routerId' in step.reason ? step.reason.routerId : undefined;
}

/** Appends the drawn routers the packet crossed, in order, and, when a router drops it, the place where it ends: that router if it is drawn, or half way to the next drawn stop of the road if it is not. */
function throughRouters(points: Vec2[], trace: Trace, layout: Layout): Vec2[] {
  const crossed = (trace.hops ?? []).flatMap((hop): Vec2[] => (layout.routers[hop.routerId] ? [layout.routers[hop.routerId]] : []));
  const through = [...points, ...crossed];
  const dropper = routerThatDrops(trace);
  if (dropper === undefined || layout.routers[dropper]) return through;
  return [...through, betweenStops(through[through.length - 1], layout)];
}

/** Appends the end of the road when the packet was answered by a router or a server instead of a device: its spot if the map draws it, or half way to the next drawn stop if not. */
function toResponder(points: Vec2[], trace: Trace, layout: Layout): Vec2[] {
  const id = trace.destinationId;
  const spot = id === null ? undefined : (layout.routers[id] ?? layout.servers[id]);
  return spot ? [...points, spot] : points;
}

/** Returns the points the packet travels along its trace, ending where it stopped: at its own doorstep for a packet to its own IP, to a loopback address, to an address that is not valid or to an IP that nobody in its network has (its own device warns, so nothing goes out), at the far end of the road when no device has its IP, in the internet when the internet does not deliver it, in front of the firewall that drops it. It crosses the edge only while the map shows the outside, and goes through the routers of its trace that the map draws, in order: it ends at the router that drops it, or, when the map does not draw that router, half way between the last stop it crossed and the next one. When `hiddenStop` is true a firewall the map does not draw stopped it, so there is nothing in front of the device to stop at: it ends at the door of the device that has the firewall, going in, and stays at its own doorstep, going out. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout, hiddenStop = false): Vec2[] {
  const from = packet.from;
  const source = from.kind === 'device' ? layout.devices[from.id] : undefined;
  if (source && trace.steps.some((s) => STAYS_IN_DEVICE.includes(s.reason.code))) return [source.door, source.doorstep];
  if (from.kind === 'device' && !source) return [[layout.roadToX, layout.roadZ]];
  const points: Vec2[] = source ? [source.door, source.firewall, source.road] : [spotOfActor(layout, from.id) ?? layout.internet, layout.internet];

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return source && hiddenStop ? [source.door, source.doorstep] : points.slice(0, 2);
  if (trace.steps.some((s) => NOBODY_HAS_IT.includes(s.reason.code))) return [...points, [layout.roadToX, layout.roadZ]];
  if (layout.outside && trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const crossed = throughRouters(points, trace, layout);
  const dest = trace.destinationId ? layout.devices[trace.destinationId] : undefined;
  if (!dest) return toResponder(crossed, trace, layout);
  crossed.push(dest.road, dest.firewall);
  if (!hiddenStop && trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'drop')) return crossed;
  crossed.push(dest.door);
  return crossed;
}

export function cumulativeLengths(path: Vec2[]): number[] {
  const acc = [0];
  for (let i = 1; i < path.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
  }
  return acc;
}

export function pointAt(path: Vec2[], lengths: number[], distance: number): Vec2 {
  if (path.length === 1) return path[0];
  const total = lengths[lengths.length - 1];
  const d = Math.min(Math.max(distance, 0), total);
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < d) i++;
  const segment = lengths[i] - lengths[i - 1];
  const t = segment === 0 ? 1 : (d - lengths[i - 1]) / segment;
  return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
}

/** Returns the path out and, for a reply, the same path back to the start. */
export function roundTrip(path: Vec2[]): Vec2[] {
  return [...path, ...path.slice(0, -1).reverse()];
}

export function pathLength(path: Vec2[]): number {
  return cumulativeLengths(path).at(-1) ?? 0;
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

/** True when two stamps would touch: they stand closer than `STAMP_NEAR` on the ground, or their circles overlap on the screen, which a pair that is a little farther apart can do along the diagonals of the isometric view. */
function areNear(a: Vec2, b: Vec2): boolean {
  const apart = [a[0] - b[0], a[1] - b[1]];
  const onScreen = [Math.abs(apart[0] - apart[1]) * UNIT_PX_X, Math.abs(apart[0] + apart[1]) * UNIT_PX_Y];
  return distance(a, b) < STAMP_NEAR || (onScreen[0] < STAMP_PX && onScreen[1] < STAMP_PX);
}

/** Returns the group of each point: points chained by gaps shorter than `STAMP_NEAR`, or whose stamps would overlap, share one (A near B and B near C make one group). */
function nearGroups(points: Vec2[]): number[] {
  const groups = points.map((_, index) => index);
  points.forEach((point, index) => {
    points.forEach((other, otherIndex) => {
      if (groups[otherIndex] !== groups[index] && areNear(point, other)) merge(groups, groups[index], groups[otherIndex]);
    });
  });
  return groups;
}

function merge(groups: number[], keep: number, drop: number): void {
  groups.forEach((group, index) => {
    if (group === drop) groups[index] = keep;
  });
}

/** Places each group's stamps along the screen's horizontal (x up, z down), STAMP_SPREAD apart and centered on the average of its points, in the order of the points' screen x (x - z), ties by input index. */
function placeGroups(points: Vec2[], groups: number[]): Vec2[] {
  const screenX = (member: number) => points[member][0] - points[member][1];
  return points.map((_, index): Vec2 => {
    const group = points.flatMap((__, member) => (groups[member] === groups[index] ? [member] : []));
    const average = (axis: 0 | 1) => group.reduce((sum, member) => sum + points[member][axis], 0) / group.length;
    const slots = [...group].sort((a, b) => screenX(a) - screenX(b) || a - b);
    const shift = (slots.indexOf(index) - (slots.length - 1) / 2) * STAMP_SPREAD;
    return [average(0) + shift, average(1) - shift];
  });
}

/** Returns two stamps of different groups that ended up near each other (`areNear`), or null when there are none. */
function closePair(stamps: Vec2[], groups: number[]): [number, number] | null {
  for (let a = 0; a < stamps.length; a++) {
    for (let b = a + 1; b < stamps.length; b++) {
      if (groups[a] !== groups[b] && areNear(stamps[a], stamps[b])) return [a, b];
    }
  }
  return null;
}

/** Moves stamps that are close together apart along the screen's horizontal, so no two end up near each other (`areNear`): points chained by near gaps form a group spread around its average, and two groups whose spread stamps come too close join into one. Each stamp keeps its side of the screen within its group; a stamp with no close neighbour stays where it is. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  const groups = nearGroups(points);
  for (;;) {
    const stamps = placeGroups(points, groups);
    const pair = closePair(stamps, groups);
    if (!pair) return stamps;
    merge(groups, groups[pair[0]], groups[pair[1]]);
  }
}
