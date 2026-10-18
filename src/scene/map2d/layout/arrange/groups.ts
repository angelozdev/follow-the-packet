import type { TermId } from '@/copy';
import type { Device, Network } from '@/engine';
import type { Point } from '@/scene/map2d/layout/graph';
import { BLOCK_BUS_GAP, BLOCK_INSET_X, BLOCK_INSET_Y, BOX_GAP, CAPTION, GROUP_PAD, ROW_HEIGHT, TRUNK_LEAD, TRUNK_PITCH, type Group, type GroupKind, type NamePart } from './geometry';
import { busOf } from './pieces';

export interface Floor {
  id: string;
  kind: Extract<GroupKind, 'floor' | 'subnet' | 'office' | 'vpc'>;
  name: NamePart[];
  plugged: string[];
  unplugged: string[];
}

export interface StackSpec {
  top: number;
  left: number;
  right: number;
  busX: number;
  floorRight: number;
  outer: Pick<Group, 'id' | 'kind' | 'name'>;
  inside: ReadonlySet<string>;
}

export interface BusSpan {
  id: string;
  x: number;
  top: number;
  bottom: number;
}

export interface Stack {
  groups: Group[];
  rows: Record<string, number>;
  buses: BusSpan[];
  center: number;
  bottom: number;
}

type FloorSource = Pick<Floor, 'id' | 'kind' | 'name'>;

const HEADER = GROUP_PAD + CAPTION;

function blockPart(text: string): NamePart {
  return { text, term: 'cidr' };
}

function sourcesOf(world: Network): FloorSource[] {
  if (world.subnets) return world.subnets.map(({ id, cidr }) => ({ id, kind: 'subnet', name: [{ text: id, term: 'vpc' }, blockPart(cidr)] }));
  if (world.lans) return world.lans.map(({ id, name, cidr }) => ({ id, kind: 'floor', name: [{ text: name }, blockPart(cidr)] }));
  return [{ id: world.kind, kind: world.kind, name: [blockPart(world.cidr)] }];
}

/** Takes a world; returns the group that surrounds the floors of its map when there are several (the office, or the VPC): its id and kind are the kind of the world and its name the block of the world. */
export function outerOf(world: Network): Pick<Group, 'id' | 'kind' | 'name'> {
  return { id: world.kind, kind: world.kind, name: [blockPart(world.cidr)] };
}

/** Takes the floors of a map; returns whether their boxes stand inside the box of the office or the VPC: when there are two or more floors, and for any subnet. */
export function isNested(floors: readonly Pick<Floor, 'kind'>[]): boolean {
  return floors.length >= 2 || floors[0]?.kind === 'subnet';
}

/** Takes a world and the devices the map draws, in the order of the world; returns its floors in the order the world lists them (its subnets, its local networks, or the one bus of an office or a VPC with neither): only the ones with a drawn device, each with the ids of the devices that are plugged and of those that have no cable, and the parts of its name. */
export function floorsOf(world: Network, devices: readonly Device[]): Floor[] {
  return sourcesOf(world).flatMap((source) => {
    const members = devices.filter((device) => busOf(world, device) === source.id);
    const idsOf = (plugged: boolean) => members.filter((device) => (device.connected !== false) === plugged).map(({ id }) => id);
    return members.length === 0 ? [] : [{ ...source, plugged: idsOf(true), unplugged: idsOf(false) }];
  });
}

/** Takes the parts of the name of a group and the terms the player knows; returns the text of the parts the player may read: a part that declares a term is left out until the player knows it. */
export function shownParts(name: readonly NamePart[], known: ReadonlySet<TermId>): string[] {
  return name.filter(({ term }) => term === undefined || known.has(term)).map(({ text }) => text);
}

function blocksOf(floor: Floor, centers: readonly number[], box: Group['box'], spec: StackSpec): Group[] {
  const runs: number[][] = [];
  floor.plugged.forEach((id, index) => {
    if (!spec.inside.has(id)) return;
    const joins = index > 0 && spec.inside.has(floor.plugged[index - 1]);
    if (joins) runs[runs.length - 1].push(centers[index]);
    else runs.push([centers[index]]);
  });
  const x = box.x + BLOCK_INSET_X;
  return runs.map((run) => ({
    id: `block:${floor.id}:${run[0]}`,
    kind: 'block',
    name: [],
    box: { x, y: run[0] - ROW_HEIGHT / 2 + BLOCK_INSET_Y, width: spec.busX - BLOCK_BUS_GAP - x, height: run[run.length - 1] - run[0] + ROW_HEIGHT - 2 * BLOCK_INSET_Y },
  }));
}

/** Takes the floors of a map and where to stack them; returns the boxes (the one of the office or the VPC around the floors when there are two or more floors, or any subnet), the outline of each run of rows marked `inside`, the center of each row (a device with no cable stands in a row under every box), the span of each bus, the center of the rows to put the main line on, and the bottom of it all. A floor is a box with room for its name and a row of 100 px for each plugged device; its bus runs from its first row to its last at `busX`. */
export function stackFloors(floors: readonly Floor[], spec: StackSpec): Stack {
  const nested = isNested(floors);
  const [left, right] = nested ? [spec.left + GROUP_PAD, spec.floorRight] : [spec.left, spec.right];
  const boxes: Group[] = [];
  const blocks: Group[] = [];
  const buses: BusSpan[] = [];
  const rows: Record<string, number> = {};
  let top = spec.top + (nested ? HEADER : 0);
  for (const floor of floors) {
    const centers = floor.plugged.map((_, index) => top + HEADER + ROW_HEIGHT * index + ROW_HEIGHT / 2);
    const box = { x: left, y: top, width: right - left, height: HEADER + ROW_HEIGHT * Math.max(1, floor.plugged.length) + GROUP_PAD };
    floor.plugged.forEach((id, index) => (rows[id] = centers[index]));
    boxes.push({ id: floor.id, kind: floor.kind, box, name: floor.name });
    blocks.push(...blocksOf(floor, centers, box, spec));
    const [first, last] = [centers[0] ?? top + HEADER + ROW_HEIGHT / 2, centers[centers.length - 1] ?? top + HEADER + ROW_HEIGHT / 2];
    buses.push({ id: floor.id, x: spec.busX, top: first, bottom: last });
    top = box.y + box.height + BOX_GAP;
  }
  const outer: Group[] = nested ? [{ ...spec.outer, box: { x: spec.left, y: spec.top, width: spec.right - spec.left, height: top - BOX_GAP + GROUP_PAD - spec.top } }] : [];
  const boxesBottom = nested ? top - BOX_GAP + GROUP_PAD : floors.length > 0 ? top - BOX_GAP : spec.top;
  const loose = floors.flatMap((floor) => floor.unplugged);
  loose.forEach((id, index) => (rows[id] = boxesBottom + BOX_GAP + ROW_HEIGHT * index + ROW_HEIGHT / 2));
  return {
    groups: [...outer, ...boxes, ...blocks],
    rows,
    buses,
    center: buses.length > 0 ? (buses[0].top + buses[buses.length - 1].bottom) / 2 : spec.top,
    bottom: loose.length > 0 ? boxesBottom + BOX_GAP + ROW_HEIGHT * loose.length : boxesBottom,
  };
}

/** Takes the place of a trunk among `count` trunks that run side by side to the same head, and the height of the main line; returns the height of its lane: the lanes are 8 px apart and centered on the line. */
export function trunkLane(index: number, count: number, yMain: number): number {
  return yMain + (index - (count - 1) / 2) * TRUNK_PITCH;
}

function isSame([x, y]: Point, [otherX, otherY]: Point): boolean {
  return x === otherX && y === otherY;
}

/** Takes the span of a bus, the height of the lane its trunk runs in and the point of the head where the trunks join; returns where the trunk leaves the bus (the point of the bus nearest to its lane) and the bends it takes to reach the lane and then the head. A trunk that leaves on its own lane has no bend before the head. */
export function trunkOf(span: BusSpan, lane: number, head: Point, lead: number = TRUNK_LEAD): { leave: Point; bends: Point[] } {
  const leave: Point = [span.x, Math.min(Math.max(lane, span.top), span.bottom)];
  const turns: Point[] = leave[1] === lane ? [] : [[span.x + lead, leave[1]], [span.x + lead, lane]];
  const bends = [...turns, [head[0], lane] as Point].filter((bend, index, all) => !isSame(bend, index === 0 ? leave : all[index - 1]) && !isSame(bend, head));
  return { leave, bends };
}
