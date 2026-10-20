import type { Network } from '@/engine';
import type { Point } from '@/scene/layout/graph';
import { captionWidth } from '@/scene/layout/captions';
import { LINE_END, station } from '@/scene/layout/stations';
import { assemble, type Waypoint } from './assemble';
import {
  BAR_AT,
  BLOCK_BUS_GAP,
  BLOCK_INSET_Y,
  BOX_GAP,
  FAN_CLEARANCE,
  FAN_HALF,
  FIREWALL_MARK_AT,
  GATEWAY_DROP,
  GROUP_PAD,
  ICON,
  ICON_MARK_BACK,
  LABEL_GAP,
  LABEL_SEP,
  LANE_HEIGHT,
  LINE_END_REACH,
  LINE_PITCH,
  LINK_MIN,
  MARK_SPACING,
  MIN_WIDTH,
  NAME_ABOVE,
  OUTER,
  SERVERS_GAP,
  SNAKE_BUS_WALL,
  SNAKE_LABEL_WALL,
  SNAKE_LANE,
  STAMP,
  STOP_LABEL_RISE,
  STOP_PITCH,
  STUB,
  TRUNK_PITCH,
  fanBox,
  type Box,
  type NamePart,
  type RowExtent,
  type RowLayout,
  type RowPiece,
  type TabRoom,
} from './geometry';
import { channelX, isNested, outerOf, stackFloors, trunkLane, type Floor, type Stack, type StackSpec } from './groups';
import { labelOf, type Classified } from './pieces';
import {
  HEAD,
  SERVERS,
  box,
  headOf,
  joinGateway,
  lanesOf,
  legsOf,
  named,
  pieceFor,
  place,
  placeBus,
  placeDevices,
  placeLanes,
  stopsNamed,
  surveyOf,
  widthOf,
  type Branch,
  type DeviceLabels,
  type Draft,
  type Frame,
  type Head,
} from './row';

interface SnakeFrame extends Frame {
  dropBase: number;
}

interface Run {
  y: number;
  from: number;
  to: number;
  start: number;
}

interface Seat {
  run: Run;
  x: number;
  into: number;
  left: number;
}

interface Item {
  name: string;
  piece: RowPiece | undefined;
  width: number;
  gap: number;
  behind: number;
  ahead: number;
  accepts: (seat: Seat) => boolean;
}

interface Placed {
  item: Item;
  s: number;
  seat: Seat;
}

const MAX_RUNS = 24;
const MID_CLEAR = STAMP / 2 + FAN_CLEARANCE;
const STOP_BEHIND = ICON_MARK_BACK + LABEL_SEP;
const STOP_AHEAD = ICON / 2 + LABEL_SEP;
const WALL = 10000;
const WIDEN = 8;
const MAX_WIDEN = 400;
const TRUNK_CORNER = 2 * (FAN_HALF + STAMP / 2);

class NoRoomError extends Error {}

const SNAKE_LABELS: DeviceLabels = {
  device: (frame, y, { width, height }) => box(frame.iconLeft, y - STOP_LABEL_RISE - height, width, height),
  firewall: (frame, y, { width, height }) => box(Math.max(frame.doorX, Math.min(frame.doorX + BAR_AT - width / 2, frame.busX - BLOCK_BUS_GAP - width)), y + STOP_LABEL_RISE, width, height),
};

const rowExtentOf =
  (pieces: readonly RowPiece[]) =>
  (id: string): RowExtent => {
    const firewall = pieceFor(pieces, 'firewall', id);
    return { above: NAME_ABOVE + 2 * BLOCK_INSET_Y, below: STOP_LABEL_RISE + (firewall ? labelOf(firewall).height + FAN_CLEARANCE : 0) };
  };

function frameOf(pieces: readonly RowPiece[], found: Classified, available: number, nested: boolean, trunks: number, names: readonly (readonly NamePart[])[]): SnakeFrame {
  const widest = (kind: RowPiece['kind']) => Math.max(0, ...found.devices.map(({ id }) => widthOf(pieceFor(pieces, kind, id))));
  const firewalls = widest('firewall');
  const link = Math.max(LINK_MIN, widest('device') - ICON + BLOCK_BUS_GAP, firewalls > 0 ? Math.max(FIREWALL_MARK_AT + MARK_SPACING, firewalls + BLOCK_BUS_GAP) : 0);
  const innerLeft = OUTER + (nested ? GROUP_PAD : 0);
  const iconLeft = innerLeft + GROUP_PAD;
  const doorX = iconLeft + ICON;
  const lead = channelX(GROUP_PAD, [(nested ? 2 : 1) * GROUP_PAD]);
  const [outerName, ...floorNames] = names;
  const nameRoom = Math.max(...floorNames.map((name) => innerLeft + captionWidth(name)), nested ? innerLeft - 2 * GROUP_PAD + captionWidth(outerName) : 0);
  const busX = Math.max(available - FAN_HALF - TRUNK_PITCH * Math.max(0, trunks - 1) - lead, doorX + link, nameRoom);
  return { innerLeft, iconLeft, doorX, busX, floorRight: busX + GROUP_PAD, dropBase: busX + lead };
}

function runsOf(y0: number, xHead: number, available: number): Run[] {
  const runs: Run[] = [];
  let start = 0;
  for (let index = 0; index < MAX_RUNS; index++) {
    const from = index === 0 ? xHead : index % 2 === 1 ? OUTER : available - OUTER;
    const to = index % 2 === 0 ? OUTER : available - OUTER;
    runs.push({ y: y0 + index * LINE_PITCH, from, to, start });
    start += Math.abs(to - from) + LINE_PITCH;
  }
  return runs;
}

function seatAt(runs: readonly Run[], s: number): Seat | undefined {
  const run = runs.find((each) => s >= each.start && s <= each.start + Math.abs(each.to - each.from));
  if (run === undefined) return undefined;
  const into = s - run.start;
  return { run, x: run.from + Math.sign(run.to - run.from) * into, into, left: Math.abs(run.to - run.from) - into };
}

function bendsBetween(runs: readonly Run[], from: number, to: number): Point[] {
  return runs.flatMap((run, index) => {
    const end = run.start + Math.abs(run.to - run.from);
    return from < end && end < to && runs[index + 1] ? ([[run.to, run.y], [run.to, runs[index + 1].y]] as Point[]) : [];
  });
}

function fits(item: Item, seat: Seat, s: number, previous: Placed | undefined, runs: readonly Run[], available: number): boolean {
  const { run, x, into, left } = seat;
  if (into < item.behind || left < item.ahead || !item.accepts(seat)) return false;
  const [lowest, highest] = [OUTER + LABEL_SEP, available - OUTER - LABEL_SEP];
  if (item.width > 0 && (x - item.width / 2 < lowest || x + item.width / 2 > highest)) return false;
  if (previous === undefined) return true;
  const sameRun = previous.seat.run === run;
  if (sameRun && previous.item.width > 0 && Math.abs(x - previous.seat.x) < (previous.item.width + item.width) / 2 + LABEL_SEP) return false;
  const middle = seatAt(runs, (previous.s + s) / 2);
  return middle !== undefined && middle.into >= MID_CLEAR && middle.left >= MID_CLEAR;
}

function placeItems(items: readonly Item[], runs: readonly Run[], available: number): Placed[] {
  const placed: Placed[] = [];
  for (const item of items) {
    const previous = placed[placed.length - 1];
    const last = runs[runs.length - 1].start;
    let found: Placed | undefined;
    for (let s = (previous?.s ?? 0) + item.gap; found === undefined && s <= last; s++) {
      const seat = seatAt(runs, s);
      if (seat !== undefined && fits(item, seat, s, previous, runs, available)) found = { item, s, seat };
    }
    if (found === undefined) throw new NoRoomError(`There is no room on the snake for ${item.name}`);
    placed.push(found);
  }
  return placed;
}

function itemsOf(world: Network, pieces: readonly RowPiece[], found: Classified, lanes: readonly RowPiece[], available: number, firstBehind: number): Item[] {
  const stops = stopsNamed(world, pieces, found).map(([name, piece], index): Item => ({ name, piece, width: widthOf(piece), gap: index === 0 ? 0 : STOP_PITCH, behind: index === 0 ? firstBehind : STOP_BEHIND, ahead: STOP_AHEAD, accepts: () => true }));
  const reach = SNAKE_LANE + ICON + LABEL_GAP + Math.max(0, ...lanes.map((lane) => labelOf(lane).width));
  const clear = STAMP / 2 + FAN_CLEARANCE;
  const servers: Item = {
    name: SERVERS,
    piece: undefined,
    width: 0,
    gap: SERVERS_GAP,
    behind: clear,
    ahead: SNAKE_BUS_WALL - OUTER,
    accepts: ({ run, x }) => (run.to < run.from ? x + reach <= available - SNAKE_LABEL_WALL : x - reach >= SNAKE_LABEL_WALL),
  };
  const end: Item = { name: LINE_END, piece: undefined, width: 0, gap: LINE_END_REACH, behind: clear, ahead: clear, accepts: () => true };
  return [...stops, ...(lanes.length > 0 ? [servers] : stops.length > 0 ? [end] : [])];
}

const pointOf = ({ seat }: Placed): Point => [seat.x, seat.run.y];

function placeStops(draft: Draft, stops: readonly Placed[], from: string) {
  stops.forEach(({ item, seat }, index) => {
    place(draft, item.piece, box(seat.x - ICON / 2, seat.run.y - ICON / 2, ICON, ICON), ({ width, height }) => box(seat.x - width / 2, seat.run.y + STOP_LABEL_RISE, width, height));
    draft.marks.push({ station: item.name, facing: index === 0 ? from : stops[index - 1].item.name, back: ICON_MARK_BACK });
  });
}

function placeBranch(draft: Draft, pieces: readonly RowPiece[], frame: SnakeFrame, branch: Branch, stack: Stack, gateway: { x: number; y: number; first: string; firstY: number }) {
  const id = branch.gateway.id;
  const count = branch.floors.length;
  const lead = frame.dropBase - frame.busX;
  const head: Head = { name: headOf(id), point: [frame.busX + lead - (count > 1 ? TRUNK_PITCH : 0), gateway.y] };
  branch.floors.forEach((floor, index) => {
    placeDevices(draft, pieces, frame, floor, stack, SNAKE_LABELS);
    placeBus(draft, frame, floor, stack, trunkLane(count - 1 - index, count, gateway.y), head, lead + TRUNK_PITCH * (count - 1 - index));
  });
  place(draft, pieceFor(pieces, 'edge', id), box(gateway.x - ICON / 2, gateway.y - ICON / 2, ICON, ICON), ({ width, height }) => box(gateway.x - ICON / 2 - LABEL_GAP - width, gateway.y - height / 2, width, height));
  joinGateway(draft, id, head, gateway);
}

function extentOf(boxes: readonly Box[], fans: readonly Box[], points: readonly Point[], available: number): { width: number; height: number } {
  return {
    width: Math.max(available, ...boxes.map(({ x, width }) => x + width + SNAKE_LABEL_WALL), ...fans.map(({ x, width }) => x + width), ...points.map(([x]) => x + OUTER)),
    height: Math.max(0, ...[...boxes, ...fans].map(({ y, height }) => y + height), ...points.map(([, y]) => y)) + OUTER,
  };
}

interface Office {
  main: Stack;
  branches: { branch: Branch; stack: Stack; y: number }[];
}

function officeOf(mainFloors: readonly Floor[], branches: readonly Branch[], specFor: (group: readonly Floor[], top: number) => StackSpec): Office {
  const main = stackFloors(mainFloors, specFor(mainFloors, OUTER));
  const placedBranches: Office['branches'] = [];
  let top = mainFloors.length > 0 ? main.bottom + BOX_GAP : OUTER;
  for (const branch of branches) {
    const stack = stackFloors(branch.floors, specFor(branch.floors, top));
    const y = stack.bottom + GATEWAY_DROP;
    placedBranches.push({ branch, stack, y });
    top = y + ICON / 2 + BOX_GAP;
  }
  return { main, branches: placedBranches };
}

function firstBehindOf({ branches }: Office, frame: SnakeFrame, xHead: number, hasFloors: boolean): number {
  const clearOfGateway = ICON / 2 + STAMP / 2;
  const lead = frame.dropBase - frame.busX;
  const reach = branches.flatMap(({ branch, stack, y }) => {
    const headX = frame.busX + lead - (branch.floors.length > 1 ? TRUNK_PITCH : 0);
    return stack.buses.map((bus, index) => {
      const trunk = lead + TRUNK_PITCH * (branch.floors.length - 1 - index) + y - bus.bottom;
      return xHead - headX + Math.max(2 * clearOfGateway + LINE_PITCH - trunk, trunk + 2 * MID_CLEAR - LINE_PITCH);
    });
  });
  return Math.max(hasFloors ? STOP_BEHIND : 0, ...reach);
}

function lineHeightOf({ main, branches }: Office, lead: number, trunks: number, firstStop: number): number {
  if (trunks === 0) return branches.length > 0 ? branches[branches.length - 1].y + LINE_PITCH : OUTER + FAN_HALF;
  const lowestLeave = Math.max(...main.buses.map(({ bottom }) => bottom));
  const midLowest = Math.max(lowestLeave + STUB + STAMP, main.bottom + STAMP / 2);
  const trunkRoom = Math.max(lowestLeave + TRUNK_CORNER - lead + firstStop, 2 * midLowest - lowestLeave + lead + TRUNK_PITCH * (trunks - 1) - firstStop);
  const belowOffice = branches.length > 0 ? branches[branches.length - 1].y + LINE_PITCH : main.bottom + STOP_LABEL_RISE;
  return Math.max(belowOffice, trunkRoom);
}

function waypointsOf(runs: readonly Run[], list: readonly Placed[], from: number): Waypoint[] {
  return list.flatMap((each, index) => [...bendsBetween(runs, index === 0 ? from : list[index - 1].s, each.s).map((point): Waypoint => ({ point })), named(each.item.name, pointOf(each))]);
}

function build(world: Network, pieces: readonly RowPiece[], available: number, { blockTab }: TabRoom): RowLayout {
  const { found, drawn, branches, mainFloors } = surveyOf(world, pieces);
  const nested = isNested(mainFloors) || branches.some((branch) => isNested(branch.floors));
  const inner = Math.max(0, ...branches.map(({ floors }) => floors.length));
  const frame = frameOf(pieces, found, available, nested, mainFloors.length + inner, [outerOf(world).name, ...[...mainFloors, ...branches.flatMap(({ floors }) => floors)].map(({ name }) => name)]);
  const inside = new Set(pieces.filter(({ kind, insideBlock }) => kind === 'device' && insideBlock).map(({ anchorId }) => anchorId));
  const specFor = (group: readonly Floor[], top: number): StackSpec => ({
    top,
    left: isNested(group) ? frame.innerLeft - GROUP_PAD : frame.innerLeft,
    right: frame.busX + (isNested(group) ? 2 : 1) * GROUP_PAD,
    busX: frame.busX,
    floorRight: frame.floorRight,
    outer: outerOf(world),
    inside,
    blockTab,
    row: rowExtentOf(pieces),
  });
  const office = officeOf(mainFloors, branches, specFor);
  const laneCount = found.servers.length + found.clients.length;
  const hasLine = found.edge || found.routers.length > 0 || found.internet || laneCount > 0;
  const mainLead = frame.dropBase + TRUNK_PITCH * inner - frame.busX;
  const xHead = mainFloors.length > 0 ? frame.busX + mainLead - (mainFloors.length > 1 ? TRUNK_PITCH : 0) : available - OUTER;
  const lanes = lanesOf(pieces, found);
  const items = itemsOf(world, pieces, found, lanes, available, firstBehindOf(office, frame, xHead, mainFloors.length > 0));
  const firstStop = placeItems(items, runsOf(0, xHead, available), available)[0]?.s ?? 0;
  const yLine = lineHeightOf(office, mainLead, mainFloors.length, firstStop);
  const runs = runsOf(yLine, xHead, available);
  const placed = placeItems(items, runs, available);
  const stops = placed.filter(({ item }) => item.name !== SERVERS && item.name !== LINE_END);
  const draft: Draft = { roads: [], marks: [], labels: {}, icons: {} };
  const head: Head = { name: hasLine ? HEAD : LINE_END, point: [xHead, yLine] };
  mainFloors.forEach((floor, index) => {
    placeDevices(draft, pieces, frame, floor, office.main, SNAKE_LABELS);
    placeBus(draft, frame, floor, office.main, trunkLane(mainFloors.length - 1 - index, mainFloors.length, yLine), head, mainLead + TRUNK_PITCH * (mainFloors.length - 1 - index));
  });
  const lineEnd = placed.find(({ item }) => item.name === LINE_END);
  const servers = placed.find(({ item }) => item.name === SERVERS);
  const onTheLine = placed.filter(({ item }) => item.name !== LINE_END);
  if (onTheLine.length > 0) draft.roads.push({ kind: 'line', via: [named(HEAD, head.point), ...waypointsOf(runs, onTheLine, 0)] });
  if (lineEnd !== undefined) draft.roads.push({ kind: 'stub', via: [named(stops[stops.length - 1].item.name, pointOf(stops[stops.length - 1])), ...waypointsOf(runs, [lineEnd], stops[stops.length - 1].s)] });
  placeStops(draft, stops, mainFloors.length > 0 ? station.bus(mainFloors[0].id) : (stops[1]?.item.name ?? LINE_END));
  let lastJunction: string | undefined;
  if (servers !== undefined) {
    const side = servers.seat.run.to < servers.seat.run.from ? 1 : -1;
    const centers = lanes.map((_, index) => servers.seat.run.y + LINE_PITCH + index * LANE_HEIGHT);
    lastJunction = placeLanes(draft, lanes, { busX: servers.seat.x, junctionY: servers.seat.run.y, centers, length: SNAKE_LANE, side });
  }
  const beforeEnd = lastJunction ?? stops[stops.length - 1]?.item.name ?? (mainFloors.length > 0 ? station.bus(mainFloors[0].id) : undefined);
  if (beforeEnd !== undefined) draft.marks.push({ station: LINE_END, facing: beforeEnd, back: 0 });
  const groups = [...office.main.groups];
  office.branches.forEach(({ branch, stack, y }) => {
    const first = stops[0];
    placeBranch(draft, pieces, frame, branch, stack, { x: first.seat.x, y, first: first.item.name, firstY: first.seat.run.y });
    groups.push(...stack.groups.map((group) => (group.kind === 'block' ? group : { ...group, gateway: branch.gateway.id })));
  });
  const solids = [...Object.values(draft.labels), ...Object.values(draft.icons)];
  const roadPoints = draft.roads.flatMap(({ via }) => via.map(({ point }) => point));
  const reached = extentOf([...groups.map(({ box: each }) => each), ...solids], [], roadPoints, available);
  const walls: Box[] = [box(-WALL, -WALL, WALL, 3 * WALL), box(reached.width, -WALL, WALL, 3 * WALL)];
  const assembled = assemble({ roads: draft.roads, legs: legsOf(drawn), marks: draft.marks, obstacles: [...solids, ...walls] });
  const fans = assembled.marks.map(({ point, axis, casillas }) => fanBox(point, axis, casillas));
  const size = extentOf([...groups.map(({ box: each }) => each), ...solids], fans, assembled.links.flatMap(({ points }) => points), available);
  return { size, groups, ...assembled, labels: draft.labels, icons: draft.icons, drawn };
}

/** Takes a world, the pieces the map draws and the width it has; returns the map as a snake, for a width where the row does not fit: the rows of the office hang to the left of a bus on the right, with the name of each device over its icon; the main line leaves the bus down the right side and runs from right to left under the office, and goes on in the next line, which runs the other way, when a stop has no room left in the line; the servers and the clients hang from a bus at the end of the line, toward the inside of the map. The layout holds the same things as the one of the row, and its width is the one it is given, 360 px at least: it is wider only when a label is too long for a lane at that width. It never reads what the player sent. With `blockTab` it leaves 18 px over the first row of each floor, and over each outline of a block that starts lower, for the tab of an outline. */
export function layoutStack(world: Network, pieces: readonly RowPiece[], width: number, room: TabRoom = {}): RowLayout {
  const first = Math.max(width, MIN_WIDTH);
  for (let available = first; ; available += WIDEN) {
    try {
      return build(world, pieces, available, room);
    } catch (error) {
      if (!(error instanceof NoRoomError) || available - first >= MAX_WIDEN) throw error;
    }
  }
}
