import { MAP_TEXT, type TermId } from '@/copy';
import type { Device, Network } from '@/engine';
import type { Point } from '@/scene/layout/graph';
import { BLOCK_BUS_GAP, BLOCK_INSET_X, BLOCK_INSET_Y, BLOCK_TAB, BOX_GAP, CAPTION, DROP_GAP, GROUP_PAD, ROW_HEIGHT, TRUNK_LEAD, TRUNK_PITCH, type Group, type GroupKind, type NamePart, type RowExtent, type TabRoom } from './geometry';
import { busOf } from './pieces';

export interface Floor {
  id: string;
  kind: Extract<GroupKind, 'floor' | 'subnet' | 'office' | 'vpc'>;
  name: NamePart[];
  plugged: string[];
  unplugged: string[];
}

export interface StackSpec extends TabRoom {
  top: number;
  left: number;
  right: number;
  busX: number;
  floorRight: number;
  outer: Pick<Group, 'id' | 'kind' | 'name'>;
  inside: ReadonlySet<string>;
  row?: (id: string) => RowExtent;
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

function nameOfWorld(world: Network): NamePart[] {
  return [MAP_TEXT.groups[world.kind], blockPart(world.cidr)];
}

function sourcesOf(world: Network): FloorSource[] {
  if (world.subnets) return world.subnets.map(({ id, cidr }) => ({ id, kind: 'subnet', name: [{ text: id, term: 'vpc' }, blockPart(cidr)] }));
  if (world.lans) return world.lans.map(({ id, name, cidr }) => ({ id, kind: 'floor', name: [{ text: name }, blockPart(cidr)] }));
  return [{ id: world.kind, kind: world.kind, name: nameOfWorld(world) }];
}

/** Takes a world; returns the group that surrounds the floors of its map when there are several (the office, or the VPC): its id and kind are the kind of the world and its name the word of that kind («Oficina», or «VPC» once the player knows the term) and the block of the world. */
export function outerOf(world: Network): Pick<Group, 'id' | 'kind' | 'name'> {
  return { id: world.kind, kind: world.kind, name: nameOfWorld(world) };
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

const EVEN_ROW = (): RowExtent => ({ above: ROW_HEIGHT / 2, below: ROW_HEIGHT / 2 });

function runsOf(plugged: readonly string[], inside: ReadonlySet<string>): number[][] {
  const runs: number[][] = [];
  plugged.forEach((id, index) => {
    if (!inside.has(id)) return;
    const joins = index > 0 && inside.has(plugged[index - 1]);
    if (joins) runs[runs.length - 1].push(index);
    else runs.push([index]);
  });
  return runs;
}

function blocksOf(floor: Floor, centers: readonly number[], box: Group['box'], spec: StackSpec): Group[] {
  const extentOf = spec.row ?? EVEN_ROW;
  const x = box.x + BLOCK_INSET_X;
  return runsOf(floor.plugged, spec.inside).map((run) => {
    const [first, last] = [run[0], run[run.length - 1]];
    const [top, bottom] = [centers[first] - extentOf(floor.plugged[first]).above, centers[last] + extentOf(floor.plugged[last]).below];
    return {
      id: `block:${floor.id}:${centers[first]}`,
      kind: 'block',
      name: [],
      box: { x, y: top + BLOCK_INSET_Y, width: spec.busX - BLOCK_BUS_GAP - x, height: bottom - top - 2 * BLOCK_INSET_Y },
    };
  });
}

/** Takes the floors of a map and where to stack them; returns the boxes (the one of the office or the VPC around the floors when there are two or more floors, or any subnet), the outline of each run of rows marked `inside`, the center of each row (a device with no cable stands in a row under every box), the span of each bus, the center of the rows to put the main line on, and the bottom of it all. A floor is a box with room for its name and a row of 100 px for each plugged device; its bus runs from its first row to its last at `busX`. */
export function stackFloors(floors: readonly Floor[], spec: StackSpec): Stack {
  const nested = isNested(floors);
  const [left, right] = nested ? [spec.left + GROUP_PAD, spec.floorRight] : [spec.left, spec.right];
  const extentOf = spec.row ?? EVEN_ROW;
  const boxes: Group[] = [];
  const blocks: Group[] = [];
  const buses: BusSpan[] = [];
  const rows: Record<string, number> = {};
  const tabbedOf = (ids: readonly string[]): ReadonlySet<string> => new Set(spec.blockTab ? [...ids.slice(0, 1), ...runsOf(ids, spec.inside).map(([first]) => ids[first])] : []);
  const rowsFrom = (start: number, ids: readonly string[], tabbed: ReadonlySet<string> = new Set()) => {
    let cursor = start;
    const centers = ids.map((id) => {
      const { above, below } = extentOf(id);
      const room = tabbed.has(id) ? BLOCK_TAB : 0;
      const center = cursor + room + above;
      cursor += room + above + below;
      return center;
    });
    return { centers, end: cursor };
  };
  let top = spec.top + (nested ? HEADER : 0);
  for (const floor of floors) {
    const { centers, end } = rowsFrom(top + HEADER, floor.plugged, tabbedOf(floor.plugged));
    const box = { x: left, y: top, width: right - left, height: HEADER + (floor.plugged.length > 0 ? end - top - HEADER : ROW_HEIGHT) + GROUP_PAD };
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
  const { centers: looseCenters, end } = rowsFrom(boxesBottom + BOX_GAP, loose);
  loose.forEach((id, index) => (rows[id] = looseCenters[index]));
  return {
    groups: [...outer, ...boxes, ...blocks],
    rows,
    buses,
    center: buses.length > 0 ? (buses[0].top + buses[buses.length - 1].bottom) / 2 : spec.top,
    bottom: loose.length > 0 ? end : boxesBottom,
  };
}

/** Takes the place of a trunk among `count` trunks that run side by side to the same head, and the height of the main line; returns the height of its lane: the lanes are `TRUNK_PITCH` apart (12 px of room between two cables) and centered on the line. */
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

/** Takes the x of the right wall of a floor and the x of the right edge of every box around the floors; returns the x of the first channel a trunk can run in: `DROP_GAP` outside the wall of the floor, and again `DROP_GAP` outside any wall that stands in its way (the box of an office or a VPC with no router on its border). Every channel keeps 12 px of room, edge to edge, from the walls it runs beside. */
export function channelX(floorRight: number, walls: readonly number[]): number {
  return [...walls].sort((a, b) => a - b).reduce((channel, wall) => (Math.abs(wall - channel) < DROP_GAP ? wall + DROP_GAP : channel), floorRight + DROP_GAP);
}

/** Takes the span of the bus of each floor and the height of the lane its trunk runs in; returns which channel each trunk runs in, counted outward from the first (0): a trunk that has to turn to reach its lane runs next to the trunks that turn the same way and have less to travel, so none crosses another (the farther from the line, the farther out). A trunk that leaves along its lane does not turn and gets 0. */
export function channelRanks(spans: readonly BusSpan[], lanes: readonly number[]): number[] {
  const reach = spans.map(({ top, bottom }, index) => lanes[index] - Math.min(Math.max(lanes[index], top), bottom));
  return reach.map((own) => (own === 0 ? 0 : reach.filter((other) => Math.sign(other) === Math.sign(own) && Math.abs(other) < Math.abs(own)).length));
}

/** Takes the stack of a group of floors, the x of the wall of its floors and the height of the lane of each trunk; returns, for each floor, how far from its bus its trunk first runs: its channel (`channelX` over the boxes of the group) plus `TRUNK_PITCH` for each channel before it. */
export function trunkLeads(stack: Stack, floorRight: number, lanes: readonly number[]): number[] {
  const channel = channelX(floorRight, stack.groups.map(({ box }) => box.x + box.width));
  const ranks = channelRanks(stack.buses, lanes);
  return stack.buses.map(({ x }, index) => channel - x + TRUNK_PITCH * ranks[index]);
}
