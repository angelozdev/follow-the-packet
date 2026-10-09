import type { Network, PacketSpec, Trace } from '@/engine';
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
  road: Vec2;
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  devices: Record<string, DeviceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  edge: Vec2;
  actors: Record<string, Vec2>;
}

const GAP = 3.2;
const MIN_COLUMN = 5;
const DEPTH = 6;
const ROAD_Z = 1.9;
const DEVICE_Z = -0.9;
const FIREWALL_Z = 0.7;
const DOOR_Z = -0.2;
const EDGE_MARGIN = 1.5;
const ACTOR_GAP = 3.5;
const ACTOR_SPACING = 2.5;
const ACTOR_STAGGER_Z = 1.6;
const LABEL = { deviceY: 1.75, firewallY: 0.1, firewallDz: 0.8, actorY: 0.05, actorDz: 0.7, edgeY: 2.6 } as const;
const CARD_Y = 0.5;
const STAMP_SPREAD = 0.8;
const EDGE_PLACES = ['internet-gateway', 'router', 'internet'];

/** Lays out one column per subnet, the devices of each subnet in a row, and the internet on the left. */
export function computeLayout(net: Network): Layout {
  const columns = net.subnets ?? [];
  const widths = columns.map((s) => Math.max(MIN_COLUMN, net.devices.filter((d) => d.subnetId === s.id).length * GAP + 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const sheetWidth = total + 2;
  const subnets: Record<string, SubnetSpot> = {};
  const devices: Record<string, DeviceSpot> = {};
  let cursor = -total / 2;
  columns.forEach((subnet, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width;
    subnets[subnet.id] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1 };
    const own = net.devices.filter((d) => d.subnetId === subnet.id);
    own.forEach((device, k) => {
      const x = cx + (k - (own.length - 1) / 2) * GAP;
      devices[device.id] = { x, z: DEVICE_Z, firewall: [x, FIREWALL_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const edge: Vec2 = [-sheetWidth / 2 - EDGE_MARGIN, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [edge[0] - ACTOR_GAP - k * ACTOR_SPACING, ROAD_Z + (k % 2 === 0 ? 0 : ACTOR_STAGGER_Z)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, devices, roadZ: ROAD_Z, roadFromX: edge[0], roadToX: sheetWidth / 2 - 0.5, edge, actors };
}

/** Returns the middle of everything drawn, so the camera can look at it. */
export function layoutCenter(layout: Layout): Vec2 {
  const left = Math.min(layout.edge[0], ...Object.values(layout.actors).map(([x]) => x));
  return [(left + layout.sheet.width / 2) / 2, 0];
}

/** Returns where the label of a piece floats: above a device, in front of its firewall, below an actor, above the edge. */
export function labelPosition(piece: { kind: MapPieceKind; anchorId: string }, layout: Layout): Vec3 {
  switch (piece.kind) {
    case 'device': {
      const spot = layout.devices[piece.anchorId];
      return [spot.x, LABEL.deviceY, spot.z];
    }
    case 'firewall': {
      const [x, z] = layout.devices[piece.anchorId].firewall;
      return [x, LABEL.firewallY, z + LABEL.firewallDz];
    }
    case 'actor': {
      const [x, z] = layout.actors[piece.anchorId];
      return [x, LABEL.actorY, z + LABEL.actorDz];
    }
    case 'edge':
      return [layout.edge[0], LABEL.edgeY, layout.edge[1]];
  }
}

/** Returns where the task card of the firewall of this device is anchored. */
export function cardAnchorPosition(deviceId: string, layout: Layout): Vec3 {
  const [x, z] = layout.devices[deviceId].firewall;
  return [x, CARD_Y, z];
}

/** Picks the side with more room for a card anchored at this normalized screen x (-1 is the left edge, 1 the right edge). */
export function sideForNdc(ndcX: number): CardSide {
  return ndcX > 0 ? 'left' : 'right';
}

/** Returns the points the packet travels along its trace, ending where it stopped. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
  const points: Vec2[] = [];
  const from = packet.from;
  const source = from.kind === 'device' ? layout.devices[from.id] : undefined;
  if (source) points.push(source.door, source.firewall, source.road);
  else points.push(layout.actors[from.id] ?? layout.edge);

  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)))) points.push(layout.edge);
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

function samePoint(point: Vec2) {
  return (other: Vec2) => other[0] === point[0] && other[1] === point[1];
}

/** Moves stamps that share a point apart along the screen's horizontal (x up, z down), keeping each group centered on its point. */
export function spreadStamps(points: Vec2[]): Vec2[] {
  return points.map((point, index): Vec2 => {
    const group = points.filter(samePoint(point)).length;
    const rank = points.slice(0, index).filter(samePoint(point)).length;
    const shift = (rank - (group - 1) / 2) * STAMP_SPREAD;
    return [point[0] + shift, point[1] - shift];
  });
}
