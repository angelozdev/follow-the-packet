import type { Network, Router } from '@/engine';
import type { Point } from '@/scene/map2d/layout/graph';
import { EDGE, INTERNET, LINE_END, mainLine, station, type Drawn } from '@/scene/map2d/layout/stations';
import { assemble, type MarkSpec, type Road, type Waypoint } from './assemble';
import {
  BAR_AT,
  BAR_LENGTH,
  BAR_MARK_BACK,
  BAR_THICKNESS,
  BOX_GAP,
  DOORSTEP,
  FAN_CLEARANCE,
  FAN_HALF,
  FIREWALL_LABEL_AT,
  FIREWALL_LABEL_DROP,
  GROUP_PAD,
  HELPER_PREFIX,
  ICON,
  ICON_MARK_BACK,
  LABEL_GAP,
  LABEL_SEP,
  LANE_HEIGHT,
  LINE_END_REACH,
  LINK_MIN,
  MARK_BACK,
  OUTER,
  ROW_HEIGHT,
  SERVERS_GAP,
  STAMP,
  STOP_LABEL_RISE,
  STOP_PITCH,
  STUB,
  fanBox,
  type Box,
  type Density,
  type Group,
  type RowLayout,
  type RowPiece,
} from './geometry';
import { floorsOf, isNested, outerOf, stackFloors, trunkLane, trunkOf, type Floor, type Stack } from './groups';
import { classify, drawnOf, labelOf, type Classified } from './pieces';

export interface Frame {
  innerLeft: number;
  iconLeft: number;
  doorX: number;
  busX: number;
  floorRight: number;
}

interface Stop {
  name: string;
  piece: RowPiece | undefined;
  center: number;
  labelLeft: number;
  labelRight: number;
}

export interface Draft {
  roads: Road[];
  marks: MarkSpec[];
  labels: Record<string, Box>;
  icons: Record<string, Box>;
}

export interface Head {
  name: string;
  point: Point;
}

export interface Branch {
  gateway: Router;
  floors: Floor[];
}

export interface DeviceLabels {
  device: (frame: Frame, y: number, size: LabelSize) => Box;
  firewall: (frame: Frame, y: number, size: LabelSize) => Box;
}

export interface LanePlan {
  busX: number;
  junctionY: number;
  centers: readonly number[];
  length: number;
  side: 1 | -1;
}

type LabelSize = Pick<Box, 'width' | 'height'>;

export const HEAD = `${HELPER_PREFIX}head`;
export const SERVERS = `${HELPER_PREFIX}servers`;
const junctionOf = (id: string) => `${HELPER_PREFIX}lane:${id}`;
export const headOf = (gatewayId: string) => `${HELPER_PREFIX}head:${gatewayId}`;
export const named = (name: string, [x, y]: Point): Waypoint => ({ name, point: [x, y] });
export const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
export const widthOf = (piece: RowPiece | undefined) => (piece ? labelOf(piece).width : 0);
const ROW_LABELS: DeviceLabels = {
  device: (frame, y, { width, height }) => box(frame.iconLeft - LABEL_GAP - width, y - height / 2, width, height),
  firewall: (frame, y, { width, height }) => box(frame.doorX + FIREWALL_LABEL_AT, y + FIREWALL_LABEL_DROP, width, height),
};

export function pieceFor(pieces: readonly RowPiece[], kind: RowPiece['kind'], anchorId: string): RowPiece | undefined {
  return pieces.find((piece) => piece.kind === kind && piece.anchorId === anchorId);
}

export function place(draft: Draft, piece: RowPiece | undefined, icon: Box, label: (size: LabelSize) => Box) {
  if (piece === undefined) return;
  draft.icons[piece.id] = icon;
  draft.labels[piece.id] = label(labelOf(piece));
}

function frameOf(pieces: readonly RowPiece[], found: Classified, nested: boolean): Frame {
  const widest = (kind: RowPiece['kind']) => Math.max(0, ...found.devices.map(({ id }) => widthOf(pieceFor(pieces, kind, id))));
  const firewall = widest('firewall');
  const link = firewall > 0 ? Math.max(LINK_MIN, FIREWALL_LABEL_AT + firewall + FAN_CLEARANCE + STAMP / 2) : LINK_MIN;
  const innerLeft = OUTER + (nested ? GROUP_PAD : 0);
  const iconLeft = innerLeft + GROUP_PAD + widest('device') + LABEL_GAP;
  const busX = iconLeft + ICON + link;
  return { innerLeft, iconLeft, doorX: iconLeft + ICON, busX, floorRight: busX + GROUP_PAD };
}

/** Takes a world, the pieces the map draws and what `classify` found; returns the stops of the main line in order, each with its station and the piece that draws it (none when the map draws a router without a piece): the lone edge, the routers from the office outward and the internet. */
export function stopsNamed(world: Network, pieces: readonly RowPiece[], found: Classified): [string, RowPiece | undefined][] {
  const routerIds = new Set((world.routers ?? []).map(({ id }) => id));
  const edge = pieces.find(({ kind, anchorId }) => kind === 'edge' && !routerIds.has(anchorId));
  const internet = pieces.find(({ kind }) => kind === 'internet');
  return [
    ...(found.edge ? [[EDGE, edge] as [string, RowPiece | undefined]] : []),
    ...found.routers.map(({ id }): [string, RowPiece | undefined] => [station.router(id), pieceFor(pieces, 'edge', id)]),
    ...(found.internet ? [[INTERNET, internet] as [string, RowPiece | undefined]] : []),
  ];
}

function stopsOf(world: Network, pieces: readonly RowPiece[], found: Classified, firstCenter: number, nearest: number): Stop[] {
  const stops: Stop[] = [];
  for (const [name, piece] of stopsNamed(world, pieces, found)) {
    const before = stops[stops.length - 1];
    const width = widthOf(piece);
    const center = before ? Math.max(before.center + STOP_PITCH, before.labelRight + LABEL_SEP + width / 2) : firstCenter;
    const labelLeft = Math.max(center - width / 2, before ? before.labelRight + LABEL_SEP : nearest);
    stops.push({ name, piece, center, labelLeft, labelRight: labelLeft + width });
  }
  return stops;
}

/** Takes the draft of a map, its pieces, the frame of its columns, a floor and where its rows stand, and how to place the labels of a device and of a firewall (to the left of the icon and past the bar by default); adds the roads, the marks, the icons and the labels of the devices of the floor, and of those with no cable. */
export function placeDevices(draft: Draft, pieces: readonly RowPiece[], frame: Frame, floor: Floor, stack: Stack, labels: DeviceLabels = ROW_LABELS) {
  for (const id of [...floor.plugged, ...floor.unplugged]) {
    const y = stack.rows[id];
    const plugged = floor.plugged.includes(id);
    const [door, doorstep, bar, road] = [station.door(id), station.doorstep(id), station.firewall(id), station.road(id)];
    const firewall = pieceFor(pieces, 'firewall', id);
    draft.roads.push({
      kind: plugged ? 'device' : 'unplugged',
      via: [named(door, [frame.doorX, y]), named(doorstep, [frame.doorX + DOORSTEP, y]), named(bar, [frame.doorX + BAR_AT, y]), named(road, [frame.busX, y])],
    });
    draft.marks.push({ station: door, facing: doorstep, back: MARK_BACK }, { station: doorstep, facing: bar, back: 0 }, { station: road, facing: bar, back: 0 });
    if (firewall) draft.marks.push({ station: bar, facing: road, back: BAR_MARK_BACK });
    place(draft, pieceFor(pieces, 'device', id), box(frame.iconLeft, y - ICON / 2, ICON, ICON), (size) => labels.device(frame, y, size));
    place(draft, firewall, box(frame.doorX + BAR_AT - BAR_THICKNESS / 2, y - BAR_LENGTH / 2, BAR_THICKNESS, BAR_LENGTH), (size) => labels.firewall(frame, y, size));
  }
}

/** Takes the draft, the frame, a floor with its stack, the height of the lane its trunk runs in, the head where the trunks join and how far to the right of the bus the trunk first runs; adds the bus of the floor, with the stub past its last device, and its trunk. */
export function placeBus(draft: Draft, frame: Frame, floor: Floor, stack: Stack, lane: number, head: Head, lead?: number) {
  const span = stack.buses.find(({ id }) => id === floor.id);
  if (span === undefined) return;
  const { leave, bends } = trunkOf(span, lane, head.point, lead);
  const bus = station.bus(floor.id);
  const chain = [...floor.plugged.map((id) => ({ name: station.road(id), y: stack.rows[id] })), { name: bus, y: leave[1] }].sort((a, b) => a.y - b.y);
  const end = { name: station.busEnd(floor.id), y: span.bottom + STUB };
  draft.roads.push({ kind: 'bus', via: [...chain, end].map(({ name, y }) => named(name, [frame.busX, y])) });
  draft.roads.push({ kind: 'trunk', via: [named(bus, leave), ...bends.map((point): Waypoint => ({ point })), named(head.name, head.point)] });
  draft.marks.push({ station: end.name, facing: chain[chain.length - 1].name, back: 0 });
}

function placeStops(draft: Draft, stops: readonly Stop[], yMain: number, from: string) {
  stops.forEach(({ name, piece, center, labelLeft }, index) => {
    place(draft, piece, box(center - ICON / 2, yMain - ICON / 2, ICON, ICON), ({ width, height }) => box(labelLeft, yMain - STOP_LABEL_RISE - height, width, height));
    draft.marks.push({ station: name, facing: index === 0 ? from : stops[index - 1].name, back: ICON_MARK_BACK });
  });
}

/** Takes the pieces and what `classify` found; returns the pieces of the lanes, the servers first and then the clients, in the order of the world. */
export function lanesOf(pieces: readonly RowPiece[], found: Classified): RowPiece[] {
  return [...found.servers.map(({ id }) => pieceFor(pieces, 'device', id)), ...found.clients.map(({ id }) => pieceFor(pieces, 'actor', id))].flatMap((piece) => (piece ? [piece] : []));
}

/** Takes the draft, the pieces of the lanes and where they stand (the vertical bus, the height where the line joins it, the height of each lane, how far the door of a lane is from the bus and on which side of it); adds the lanes, their bus and the stub past the last junction, and returns the name of that junction. */
export function placeLanes(draft: Draft, lanes: readonly RowPiece[], { busX, junctionY, centers, length, side }: LanePlan): string {
  const doorX = busX + side * length;
  const junctions = [...lanes.map(({ anchorId }, index) => ({ name: junctionOf(anchorId), y: centers[index] })), { name: SERVERS, y: junctionY }].sort((a, b) => a.y - b.y);
  lanes.forEach((piece, index) => {
    const [door, junction] = [station.door(piece.anchorId), junctionOf(piece.anchorId)];
    draft.roads.push({ kind: 'lane', via: [named(junction, [busX, centers[index]]), named(door, [doorX, centers[index]])] });
    draft.marks.push({ station: door, facing: junction, back: MARK_BACK });
    place(draft, piece, box(side === 1 ? doorX : doorX - ICON, centers[index] - ICON / 2, ICON, ICON), ({ width, height }) =>
      box(side === 1 ? doorX + ICON + LABEL_GAP : doorX - ICON - LABEL_GAP - width, centers[index] - height / 2, width, height),
    );
  });
  draft.roads.push({ kind: 'bus', via: junctions.map(({ name, y }) => named(name, [busX, y])) });
  const last = junctions[junctions.length - 1];
  draft.roads.push({ kind: 'stub', via: [named(last.name, [busX, last.y]), named(LINE_END, [busX, last.y + LINE_END_REACH])] });
  return last.name;
}

/** Takes the routers of other offices and the floors of the map; returns, for each gateway, the floors it faces that no gateway before it claimed. */
export function branchesOf(gateways: readonly Router[], floors: readonly Floor[]): Branch[] {
  const claimed = new Set<string>();
  return gateways.map((gateway) => {
    const faced = floors.filter(({ id }) => !claimed.has(id) && gateway.interfaces.some(({ faces }) => faces === id));
    faced.forEach(({ id }) => claimed.add(id));
    return { gateway, floors: faced };
  });
}

/** Takes what the map draws; returns the pairs of stops whose middle the map names: from the bus of each floor to the first stop, between consecutive stops, and from the last one to the end of the line. */
export function legsOf(drawn: RowLayout['drawn']): [string, string][] {
  const line = mainLine(drawn);
  const first = line[0] ?? LINE_END;
  const fromBuses = [...new Set(Object.values(drawn.devices))].map((bus): [string, string] => [station.bus(bus), first]);
  const along = line.slice(1).map((after, index): [string, string] => [line[index], after]);
  return [...fromBuses, ...along, ...(line.length > 0 ? [[line[line.length - 1], LINE_END] as [string, string]] : [])];
}

/** Takes the draft, the id of the router of another office, the head where the trunks of its floors join and where the router stands with the first router of the main line (its name and the height it stands at); adds the line from the head to the router, the private link to the first router and the mark of the gateway, that faces it. */
export function joinGateway(draft: Draft, gatewayId: string, head: Head, gateway: { x: number; y: number; first: string; firstY: number }) {
  const router = station.router(gatewayId);
  draft.roads.push({ kind: 'line', via: [named(head.name, head.point), named(router, [gateway.x, gateway.y])] });
  draft.roads.push({ kind: 'private', via: [named(gateway.first, [gateway.x, gateway.firstY]), named(router, [gateway.x, gateway.y])] });
  draft.marks.push({ station: router, facing: gateway.first, back: ICON_MARK_BACK });
}

export interface Survey {
  found: Classified;
  drawn: Drawn;
  floors: Floor[];
  branches: Branch[];
  mainFloors: Floor[];
}

/** Takes a world and the pieces the map draws; returns what they stand for (`classify`), what `stationsFor` reads (`drawnOf`), the floors that have a drawn device, the other offices with the floors they face and the floors of the main office. */
export function surveyOf(world: Network, pieces: readonly RowPiece[]): Survey {
  const found = classify(world, pieces);
  const floors = floorsOf(world, found.devices);
  const branches = branchesOf(found.gateways, floors);
  return { found, drawn: drawnOf(world, found), floors, branches, mainFloors: floors.filter((floor) => !branches.some((branch) => branch.floors.includes(floor))) };
}

function placeBranch(draft: Draft, pieces: readonly RowPiece[], frame: Frame, branch: Branch, stack: Stack, gateway: { x: number; y: number; headX: number; first: string; firstY: number }) {
  const id = branch.gateway.id;
  const head: Head = { name: headOf(id), point: [gateway.headX, gateway.y] };
  branch.floors.forEach((floor, index) => {
    placeDevices(draft, pieces, frame, floor, stack);
    placeBus(draft, frame, floor, stack, trunkLane(index, branch.floors.length, gateway.y), head);
  });
  place(draft, pieceFor(pieces, 'edge', id), box(gateway.x - ICON / 2, gateway.y - ICON / 2, ICON, ICON), ({ width, height }) => box(gateway.x + ICON / 2 + LABEL_GAP, gateway.y - height / 2, width, height));
  joinGateway(draft, id, head, gateway);
}

/** Takes a world, the pieces the map draws and a density; returns the map in a row, left to right: the office (one box per floor, a row of 100 px for each plugged device, and a bus at the right of its boxes), the main line through the router that stands on the border of the office, the other routers, the internet and the servers and clients as lanes of 100 px centered on the line, the devices with no cable under the boxes, and the office of a gateway as a second group below. The layout holds the boxes of the groups, the links with their points, the nodes of the graph that `route` walks, where each station stands, the marks where a stamp stands (with the axis of its fan and how many casillas fit), and the boxes of the label and the icon of each piece. It never reads what the player sent: its size depends on the pieces only. `density` shortens the trunk and the lane. */
export function layoutRow(world: Network, pieces: readonly RowPiece[], density: Density): RowLayout {
  const { found, drawn, floors, branches, mainFloors } = surveyOf(world, pieces);
  const nested = isNested(mainFloors);
  const frame = frameOf(pieces, found, nested);
  const laneCount = found.servers.length + found.clients.length;
  const hasLine = found.edge || found.routers.length > 0 || found.internet || laneCount > 0;
  const lineStart = floors.length === 0 ? OUTER + STAMP / 2 + ICON_MARK_BACK - ICON / 2 : frame.busX + (hasLine ? density.trunk : LINE_END_REACH);
  const firstCenter = floors.length === 0 ? lineStart + ICON / 2 : frame.busX + STOP_PITCH;
  const stops = stopsOf(world, pieces, found, firstCenter, floors.length > 0 ? frame.busX + FAN_HALF + FAN_CLEARANCE : OUTER);
  const last = stops[stops.length - 1];
  const serversX = last ? Math.max(last.center + SERVERS_GAP, last.labelRight + LABEL_SEP) : floors.length === 0 ? lineStart : frame.busX + SERVERS_GAP;
  const officeRight = stops[0] && stops[0].name !== INTERNET ? stops[0].center : frame.floorRight + (nested ? GROUP_PAD : 0);
  const inside = new Set(pieces.filter(({ kind, insideBlock }) => kind === 'device' && insideBlock).map(({ anchorId }) => anchorId));
  const stackAt = (top: number) => stackFloors(mainFloors, { top, left: OUTER, right: officeRight, busX: frame.busX, floorRight: frame.floorRight, outer: outerOf(world), inside });
  const above = Math.max(...stops.map(({ piece }) => (piece ? STOP_LABEL_RISE + labelOf(piece).height : 0)), (laneCount * LANE_HEIGHT) / 2);
  const settled = stackAt(OUTER);
  const yMain = Math.max(settled.center, OUTER + above);
  const main = stackAt(OUTER + yMain - settled.center);
  const draft: Draft = { roads: [], marks: [], labels: {}, icons: {} };
  const head: Head = { name: hasLine ? HEAD : LINE_END, point: [lineStart, yMain] };
  mainFloors.forEach((floor, index) => {
    placeDevices(draft, pieces, frame, floor, main);
    placeBus(draft, frame, floor, main, trunkLane(index, mainFloors.length, yMain), head);
  });
  if (stops.length > 0) {
    draft.roads.push({ kind: 'line', via: [named(HEAD, head.point), ...stops.map(({ name, center }) => named(name, [center, yMain])), ...(laneCount > 0 ? [named(SERVERS, [serversX, yMain])] : [])] });
    if (laneCount === 0) draft.roads.push({ kind: 'stub', via: [named(last.name, [last.center, yMain]), named(LINE_END, [last.center + LINE_END_REACH, yMain])] });
    placeStops(draft, stops, yMain, mainFloors.length > 0 ? station.bus(mainFloors[0].id) : (stops[1]?.name ?? LINE_END));
  }
  if (stops.length === 0 && laneCount > 0) draft.roads.push({ kind: 'line', via: [named(HEAD, head.point), named(SERVERS, [serversX, yMain])] });
  const lanes = lanesOf(pieces, found);
  const centers = lanes.map((_, index) => yMain + (index - (lanes.length - 1) / 2) * LANE_HEIGHT);
  const lastJunction = laneCount > 0 ? placeLanes(draft, lanes, { busX: serversX, junctionY: yMain, centers, length: density.lane, side: 1 }) : undefined;
  const beforeEnd = lastJunction ?? last?.name ?? (mainFloors.length > 0 ? station.bus(mainFloors[0].id) : undefined);
  if (beforeEnd !== undefined) draft.marks.push({ station: LINE_END, facing: beforeEnd, back: 0 });
  const groups: Group[] = [...main.groups];
  let top = mainFloors.length > 0 ? main.bottom + BOX_GAP : OUTER;
  for (const branch of branches) {
    const left = frame.innerLeft - (isNested(branch.floors) ? GROUP_PAD : 0);
    const stack = stackFloors(branch.floors, { top, left, right: stops[0].center, busX: frame.busX, floorRight: frame.floorRight, outer: outerOf(world), inside });
    const y = branch.floors.length > 0 ? stack.center : top + ROW_HEIGHT / 2;
    placeBranch(draft, pieces, frame, branch, stack, { x: stops[0].center, y, headX: lineStart, first: station.router(found.routers[0].id), firstY: yMain });
    groups.push(...stack.groups.map((group) => (group.kind === 'block' ? group : { ...group, gateway: branch.gateway.id })));
    top = (branch.floors.length > 0 ? stack.bottom : top + ROW_HEIGHT) + BOX_GAP;
  }
  const assembled = assemble({ roads: draft.roads, legs: legsOf(drawn), marks: draft.marks, obstacles: [...Object.values(draft.labels), ...Object.values(draft.icons)] });
  const boxes = [...groups.map(({ box: each }) => each), ...Object.values(draft.labels), ...Object.values(draft.icons), ...assembled.marks.map(({ point, axis, casillas }) => fanBox(point, axis, casillas))];
  const points = assembled.links.flatMap(({ points: along }) => along);
  const size = {
    width: Math.max(0, ...boxes.map(({ x, width }) => x + width), ...points.map(([x]) => x)) + OUTER,
    height: Math.max(0, ...boxes.map(({ y, height }) => y + height), ...points.map(([, y]) => y)) + OUTER,
  };
  return { size, groups, ...assembled, labels: draft.labels, icons: draft.icons, drawn };
}
