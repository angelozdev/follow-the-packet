import type { Checkpoint, Network, PacketSpec, Trace } from '@/engine';

export type Vec2 = [number, number];

export interface SubnetSpot {
  x: number;
  z: number;
  width: number;
  depth: number;
  az: string;
}

export interface InstanceSpot {
  x: number;
  z: number;
  barrier: Vec2;
  door: Vec2;
  road: Vec2;
}

export interface Layout {
  sheet: { width: number; depth: number };
  subnets: Record<string, SubnetSpot>;
  instances: Record<string, InstanceSpot>;
  roadZ: number;
  roadFromX: number;
  roadToX: number;
  igw: Vec2;
  actors: Record<string, Vec2>;
}

const GAP = 3.2;
const MIN_COLUMN = 5;
const DEPTH = 6;
const ROAD_Z = 1.9;
const BUILDING_Z = -0.9;
const BARRIER_Z = 0.7;
const DOOR_Z = -0.2;
const REPLY_SIDE_X = 1.45;

/** Lays out one column per subnet, the instances of each subnet in a row, and the internet on the left. */
export function computeLayout(net: Network): Layout {
  const widths = net.subnets.map((s) => Math.max(MIN_COLUMN, net.instances.filter((i) => i.subnetId === s.id).length * GAP + 1));
  const total = widths.reduce((a, b) => a + b, 0);
  const sheetWidth = total + 2;
  const subnets: Record<string, SubnetSpot> = {};
  const instances: Record<string, InstanceSpot> = {};
  let cursor = -total / 2;
  net.subnets.forEach((subnet, index) => {
    const width = widths[index];
    const cx = cursor + width / 2;
    cursor += width;
    subnets[subnet.id] = { x: cx, z: 0, width: width - 0.4, depth: DEPTH - 1, az: subnet.az };
    const own = net.instances.filter((i) => i.subnetId === subnet.id);
    own.forEach((instance, k) => {
      const x = cx + (k - (own.length - 1) / 2) * GAP;
      instances[instance.id] = { x, z: BUILDING_Z, barrier: [x, BARRIER_Z], door: [x, DOOR_Z], road: [x, ROAD_Z] };
    });
  });
  const igw: Vec2 = [-sheetWidth / 2 - 1.5, ROAD_Z];
  const actors: Record<string, Vec2> = {};
  net.actors.forEach((a, k) => {
    actors[a.id] = [igw[0] - 3 - k * 2.5, ROAD_Z + (k % 2 === 0 ? 0 : 1.6)];
  });
  return { sheet: { width: sheetWidth, depth: DEPTH }, subnets, instances, roadZ: ROAD_Z, roadFromX: igw[0], roadToX: sheetWidth / 2 - 0.5, igw, actors };
}

/** Returns the points the packet travels along its trace, ending where it stopped. */
export function pathFor(trace: Trace, packet: PacketSpec, layout: Layout): Vec2[] {
  const points: Vec2[] = [];
  const from = packet.from;
  const source = from.kind === 'instance' ? layout.instances[from.id] : undefined;
  if (source) points.push(source.door, source.barrier, source.road);
  else points.push(layout.actors[from.id] ?? layout.igw);

  if (trace.steps.some((s) => s.stage === 'sg-out' && s.verdict === 'drop')) return points.slice(0, 2);
  if (trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && s.at === 'igw'))) points.push(layout.igw);
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return points;

  const dest = trace.destinationId ? layout.instances[trace.destinationId] : undefined;
  if (!dest) return points;
  points.push(dest.road, dest.barrier);
  if (trace.steps.some((s) => s.stage === 'sg-in' && s.verdict === 'drop')) return points;
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

export function checkpointPosition(cp: Checkpoint, layout: Layout): Vec2 {
  const spot = layout.instances[cp.at];
  switch (cp.stage) {
    case 'route':
      return cp.at === 'igw' ? layout.igw : [0, layout.roadZ];
    case 'dns':
      return spot?.door ?? layout.actors[cp.at] ?? layout.igw;
    case 'sg-out':
    case 'sg-in':
      return spot?.barrier ?? layout.igw;
    case 'linux':
      return spot?.door ?? layout.igw;
    case 'reply':
      return spot ? [spot.x + REPLY_SIDE_X, spot.z] : layout.igw;
  }
}
