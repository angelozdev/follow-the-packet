import type { Network, Router } from '@/engine';
import type { Point } from '@/scene/map2d/layout/graph';
import { EDGE, INTERNET, LINE_END, mainLine, station } from '@/scene/map2d/layout/stations';
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

interface Frame {
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

interface Draft {
  roads: Road[];
  marks: MarkSpec[];
  labels: Record<string, Box>;
  icons: Record<string, Box>;
}

interface Head {
  name: string;
  point: Point;
}

interface Branch {
  gateway: Router;
  floors: Floor[];
}

const HEAD = `${HELPER_PREFIX}head`;
const SERVERS = `${HELPER_PREFIX}servers`;
const junctionOf = (id: string) => `${HELPER_PREFIX}lane:${id}`;
const headOf = (gatewayId: string) => `${HELPER_PREFIX}head:${gatewayId}`;
const named = (name: string, [x, y]: Point): Waypoint => ({ name, point: [x, y] });
const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
const widthOf = (piece: RowPiece | undefined) => (piece ? labelOf(piece).width : 0);

function pieceFor(pieces: readonly RowPiece[], kind: RowPiece['kind'], anchorId: string): RowPiece | undefined {
  return pieces.find((piece) => piece.kind === kind && piece.anchorId === anchorId);
}

function place(draft: Draft, piece: RowPiece | undefined, icon: Box, label: (size: { width: number; height: number }) => Box) {
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

function stopsOf(world: Network, pieces: readonly RowPiece[], found: Classified, firstCenter: number, nearest: number): Stop[] {
  const routerIds = new Set((world.routers ?? []).map(({ id }) => id));
  const edge = pieces.find(({ kind, anchorId }) => kind === 'edge' && !routerIds.has(anchorId));
  const internet = pieces.find(({ kind }) => kind === 'internet');
  const named: [string, RowPiece | undefined][] = [
    ...(found.edge ? [[EDGE, edge] as [string, RowPiece | undefined]] : []),
    ...found.routers.map(({ id }): [string, RowPiece | undefined] => [station.router(id), pieceFor(pieces, 'edge', id)]),
    ...(found.internet ? [[INTERNET, internet] as [string, RowPiece | undefined]] : []),
  ];
  const stops: Stop[] = [];
  for (const [name, piece] of named) {
    const before = stops[stops.length - 1];
    const width = widthOf(piece);
    const center = before ? Math.max(before.center + STOP_PITCH, before.labelRight + LABEL_SEP + width / 2) : firstCenter;
    const labelLeft = Math.max(center - width / 2, before ? before.labelRight + LABEL_SEP : nearest);
    stops.push({ name, piece, center, labelLeft, labelRight: labelLeft + width });
  }
  return stops;
}

function placeDevices(draft: Draft, pieces: readonly RowPiece[], frame: Frame, floor: Floor, stack: Stack) {
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
    place(draft, pieceFor(pieces, 'device', id), box(frame.iconLeft, y - ICON / 2, ICON, ICON), ({ width, height }) => box(frame.iconLeft - LABEL_GAP - width, y - height / 2, width, height));
    place(draft, firewall, box(frame.doorX + BAR_AT - BAR_THICKNESS / 2, y - BAR_LENGTH / 2, BAR_THICKNESS, BAR_LENGTH), ({ width, height }) => box(frame.doorX + FIREWALL_LABEL_AT, y + FIREWALL_LABEL_DROP, width, height));
  }
}

function placeBus(draft: Draft, frame: Frame, floor: Floor, stack: Stack, lane: number, head: Head) {
  const span = stack.buses.find(({ id }) => id === floor.id);
  if (span === undefined) return;
  const { leave, bends } = trunkOf(span, lane, head.point);
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

function placeLanes(draft: Draft, pieces: readonly RowPiece[], found: Classified, serversX: number, yMain: number, density: Density): string | undefined {
  const lanes = [...found.servers.map(({ id }) => pieceFor(pieces, 'device', id)), ...found.clients.map(({ id }) => pieceFor(pieces, 'actor', id))].flatMap((piece) => (piece ? [piece] : []));
  const centers = lanes.map((_, index) => yMain + (index - (lanes.length - 1) / 2) * LANE_HEIGHT);
  const doorX = serversX + density.lane;
  const junctions = [...lanes.map(({ anchorId }, index) => ({ name: junctionOf(anchorId), y: centers[index] })), { name: SERVERS, y: yMain }].sort((a, b) => a.y - b.y);
  lanes.forEach((piece, index) => {
    const [door, junction] = [station.door(piece.anchorId), junctionOf(piece.anchorId)];
    draft.roads.push({ kind: 'lane', via: [named(junction, [serversX, centers[index]]), named(door, [doorX, centers[index]])] });
    draft.marks.push({ station: door, facing: junction, back: MARK_BACK });
    place(draft, piece, box(doorX, centers[index] - ICON / 2, ICON, ICON), ({ width, height }) => box(doorX + ICON + LABEL_GAP, centers[index] - height / 2, width, height));
  });
  draft.roads.push({ kind: 'bus', via: junctions.map(({ name, y }) => named(name, [serversX, y])) });
  const last = junctions[junctions.length - 1];
  draft.roads.push({ kind: 'stub', via: [named(last.name, [serversX, last.y]), named(LINE_END, [serversX, last.y + LINE_END_REACH])] });
  return last.name;
}

function branchesOf(gateways: readonly Router[], floors: readonly Floor[]): Branch[] {
  const claimed = new Set<string>();
  return gateways.map((gateway) => {
    const faced = floors.filter(({ id }) => !claimed.has(id) && gateway.interfaces.some(({ faces }) => faces === id));
    faced.forEach(({ id }) => claimed.add(id));
    return { gateway, floors: faced };
  });
}

function legsOf(drawn: RowLayout['drawn']): [string, string][] {
  const line = mainLine(drawn);
  const first = line[0] ?? LINE_END;
  const fromBuses = [...new Set(Object.values(drawn.devices))].map((bus): [string, string] => [station.bus(bus), first]);
  const along = line.slice(1).map((after, index): [string, string] => [line[index], after]);
  return [...fromBuses, ...along, ...(line.length > 0 ? [[line[line.length - 1], LINE_END] as [string, string]] : [])];
}

function placeBranch(draft: Draft, pieces: readonly RowPiece[], frame: Frame, branch: Branch, stack: Stack, gateway: { x: number; y: number; headX: number; first: string; firstY: number }) {
  const [id, router] = [branch.gateway.id, station.router(branch.gateway.id)];
  const head: Head = { name: headOf(id), point: [gateway.headX, gateway.y] };
  branch.floors.forEach((floor, index) => {
    placeDevices(draft, pieces, frame, floor, stack);
    placeBus(draft, frame, floor, stack, trunkLane(index, branch.floors.length, gateway.y), head);
  });
  place(draft, pieceFor(pieces, 'edge', id), box(gateway.x - ICON / 2, gateway.y - ICON / 2, ICON, ICON), ({ width, height }) => box(gateway.x + ICON / 2 + LABEL_GAP, gateway.y - height / 2, width, height));
  draft.roads.push({ kind: 'line', via: [named(head.name, head.point), named(router, [gateway.x, gateway.y])] });
  draft.roads.push({ kind: 'private', via: [named(gateway.first, [gateway.x, gateway.firstY]), named(router, [gateway.x, gateway.y])] });
  draft.marks.push({ station: router, facing: gateway.first, back: ICON_MARK_BACK });
}

/** Takes a world, the pieces the map draws and a density; returns the map in a row, left to right: the office (one box per floor, a row of 100 px for each plugged device, and a bus at the right of its boxes), the main line through the router that stands on the border of the office, the other routers, the internet and the servers and clients as lanes of 100 px centered on the line, the devices with no cable under the boxes, and the office of a gateway as a second group below. The layout holds the boxes of the groups, the links with their points, the nodes of the graph that `route` walks, where each station stands, the marks where a stamp stands (with the axis of its fan and how many casillas fit), and the boxes of the label and the icon of each piece. It never reads what the player sent: its size depends on the pieces only. `density` shortens the trunk and the lane. */
export function layoutRow(world: Network, pieces: readonly RowPiece[], density: Density): RowLayout {
  const found = classify(world, pieces);
  const drawn = drawnOf(world, found);
  const floors = floorsOf(world, found.devices);
  const branches = branchesOf(found.gateways, floors);
  const mainFloors = floors.filter((floor) => !branches.some((branch) => branch.floors.includes(floor)));
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
  const lastJunction = laneCount > 0 ? placeLanes(draft, pieces, found, serversX, yMain, density) : undefined;
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
