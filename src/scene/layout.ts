import type { Device, Network, PacketSpec, Trace } from '@/engine';
import type { MapPieceKind } from './overlay/piece-label';

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type CardSide = 'left' | 'right';

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
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  devices: Record<string, DeviceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  outside: boolean;
  edge: Vec2;
  internet: Vec2;
  actors: Record<string, Vec2>;
}

interface Column {
  subnetId: string | null;
  devices: Device[];
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
const ACTOR_STAGGER_Z = 1.6;
const LABEL_OFFSET: Record<MapPieceKind, Vec3> = { device: [0, 1.75, 0], firewall: [0, 0.1, 0.8], actor: [0, 0.05, 1.1], edge: [0, 3.1, 0], internet: [0, 2.1, 0] };
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.8;
const STAMP_NEAR = 1;
const EDGE_PLACES: string[] = ['internet-gateway', 'router'] satisfies Network['edge'][];

function columnsOf(net: Network): Column[] {
  if (!net.subnets) return [{ subnetId: null, devices: net.devices }];
  return net.subnets.map((subnet) => ({ subnetId: subnet.id, devices: net.devices.filter((d) => d.subnetId === subnet.id) }));
}

/** Lays out one column per subnet (a single one for an office), the devices of each column in a row and, when the map shows the outside, the edge, the internet and its actors on the left. */
export function computeLayout(net: Network, outside: boolean): Layout {
  const columns = columnsOf(net);
  const widths = columns.map((column) => Math.max(MIN_COLUMN, column.devices.length * GAP + 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const sheetWidth = total + 2;
  const subnets: Record<string, SubnetSpot> = {};
  const devices: Record<string, DeviceSpot> = {};
  let cursor = -total / 2;
  columns.forEach((column, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width;
    if (column.subnetId) subnets[column.subnetId] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1 };
    column.devices.forEach((device, k) => {
      const x = cx + (k - (column.devices.length - 1) / 2) * GAP;
      devices[device.id] = { x, z: DEVICE_Z, firewall: [x, FIREWALL_Z], door: [x, DOOR_Z], doorstep: [x, DOORSTEP_Z], road: [x, ROAD_Z] };
    });
  });
  const edge: Vec2 = [-sheetWidth / 2 - EDGE_MARGIN, ROAD_Z];
  const internet: Vec2 = [edge[0] - INTERNET_GAP, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [internet[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  const roadFromX = outside ? edge[0] : -sheetWidth / 2 + ROAD_INSET;
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, devices, roadZ: ROAD_Z, roadFromX, roadToX: sheetWidth / 2 - ROAD_INSET, outside, edge, internet, actors };
}

/** Returns the middle of everything drawn, so the camera can look at it. */
export function layoutCenter(layout: Layout): Vec2 {
  const outsideXs = layout.outside ? [layout.internet[0], ...Object.values(layout.actors).map(([x]) => x)] : [];
  const left = Math.min(-layout.sheet.width / 2, ...outsideXs);
  return [(left + layout.sheet.width / 2) / 2, 0];
}

/** Returns where a piece of this kind stands on the ground: a device, the firewall in front of its device, an actor, the edge or the internet. */
export function piecePosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec2 {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return [spot.x, spot.z];
    }
    case 'firewall':
      return layout.devices[piece.anchorId].firewall;
    case 'actor':
      return layout.actors[piece.anchorId];
    case 'edge':
      return layout.edge;
    case 'internet':
      return layout.internet;
  }
}

/** Returns where the label of a piece floats from the point it stands on: above a device, in front of a firewall, below an actor, above the edge and the internet. */
export function labelOffset(kind: MapPieceKind): Vec3 {
  return LABEL_OFFSET[kind];
}

/** Returns where the label of a piece floats on the map. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  const [x, z] = piecePosition(piece, layout);
  const [dx, y, dz] = labelOffset(piece.kind);
  return [x + dx, y, z + dz];
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

/** Returns the points the packet travels along its trace, ending where it stopped: at its own doorstep for a packet to its own IP, at the far end of the road when no device has its IP, in the internet when the internet does not deliver it. It crosses the edge only while the map shows the outside. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
  const from = packet.from;
  const source = from.kind === 'device' ? layout.devices[from.id] : undefined;
  if (source && trace.steps.some((s) => s.reason.code === 'route-self')) return [source.door, source.doorstep];
  const points: Vec2[] = source ? [source.door, source.firewall, source.road] : [layout.actors[from.id] ?? layout.internet, layout.internet];

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.reason.code === 'route-no-device')) return [...points, [layout.roadToX, layout.roadZ]];
  if (layout.outside && trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.devices[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.firewall);
  if (trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'drop')) return points;
  points.push(dest.door);
  return points;
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

/** Returns the group of each point: points chained by gaps shorter than `STAMP_NEAR` share one (A near B and B near C make one group). */
function nearGroups(points: Vec2[]): number[] {
  const groups = points.map((_, index) => index);
  points.forEach((point, index) => {
    points.forEach((other, otherIndex) => {
      if (groups[otherIndex] !== groups[index] && distance(point, other) < STAMP_NEAR) merge(groups, groups[index], groups[otherIndex]);
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

/** Returns two stamps of different groups that ended up closer than `STAMP_NEAR`, or null when there are none. */
function closePair(stamps: Vec2[], groups: number[]): [number, number] | null {
  for (let a = 0; a < stamps.length; a++) {
    for (let b = a + 1; b < stamps.length; b++) {
      if (groups[a] !== groups[b] && distance(stamps[a], stamps[b]) < STAMP_NEAR) return [a, b];
    }
  }
  return null;
}

/** Moves stamps that are close together apart along the screen's horizontal, so no two end up closer than `STAMP_NEAR`: points chained by gaps shorter than `STAMP_NEAR` form a group spread around its average, and two groups whose spread stamps come too close join into one. Each stamp keeps its side of the screen within its group; a stamp with no close neighbour stays where it is. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  const groups = nearGroups(points);
  for (;;) {
    const stamps = placeGroups(points, groups);
    const pair = closePair(stamps, groups);
    if (!pair) return stamps;
    merge(groups, groups[pair[0]], groups[pair[1]]);
  }
}
