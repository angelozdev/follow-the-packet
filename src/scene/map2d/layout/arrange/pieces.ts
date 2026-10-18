import type { TermText } from '@/copy';
import type { ClientActor, Device, Network, Router, ServerActor } from '@/engine';
import { labelBox, labelLines, labelWidth } from '@/scene/map2d/layout/metrics';
import type { Drawn } from '@/scene/map2d/layout/stations';
import type { PieceKind, RowPiece } from './geometry';

export interface Classified {
  devices: Device[];
  servers: ServerActor[];
  clients: ClientActor[];
  routers: Router[];
  gateways: Router[];
  edge: boolean;
  internet: boolean;
}

export interface PieceLabel {
  lines: string[];
  width: number;
  height: number;
}

function isServer(actor: Network['actors'][number]): actor is ServerActor {
  return actor.kind === 'server';
}

/** Takes a world and a device; returns the id of the bus the device hangs from: its subnet in a world with subnets, its floor (the only one, when the device names none) in a world with floors, and the kind of the world in an office or a VPC with neither. A device that belongs to none of the subnets or floors of its world hangs from no bus. */
export function busOf(world: Network, device: Device): string | undefined {
  if (world.subnets) return world.subnets.find(({ id }) => id === device.subnetId)?.id;
  if (!world.lans) return world.kind;
  const lanId = device.lanId ?? (world.lans.length === 1 ? world.lans[0].id : undefined);
  return world.lans.find(({ id }) => id === lanId)?.id;
}

function anchorsOf(pieces: readonly RowPiece[], kind: PieceKind): Set<string> {
  return new Set(pieces.filter((piece) => piece.kind === kind).map(({ anchorId }) => anchorId));
}

function fromOfficeOutward(routers: readonly Router[], inOffice: ReadonlySet<string>): Router[] {
  const ordered = routers.filter(({ id }) => inOffice.has(id));
  for (let index = 0; index < ordered.length; index++) {
    const reached = ordered[index].interfaces.flatMap(({ faces }) => routers.filter(({ id }) => id === faces));
    ordered.push(...reached.filter((router) => !ordered.includes(router)));
  }
  return [...ordered, ...routers.filter((router) => !ordered.includes(router))];
}

function splitGateways(routers: readonly Router[], drawnFloors: ReadonlySet<string | undefined>): Pick<Classified, 'routers' | 'gateways'> {
  const [first, ...later] = routers;
  const gateways = later.filter(({ interfaces }) => interfaces.some(({ faces }) => drawnFloors.has(faces)));
  return { routers: first ? [first, ...later.filter((router) => !gateways.includes(router))] : [], gateways };
}

/** Takes a world and the pieces the map draws; returns what they stand for, in the order of the world: the devices that hang from a bus, the servers of the internet and the clients, the routers along the main line from the office outward, the gateways of another office (routers after the first that face a floor with a drawn device, which stand off the line), whether the lone edge is drawn and whether the internet is. A piece that stands for nothing in the world gets nothing. */
export function classify(world: Network, pieces: readonly RowPiece[]): Classified {
  const [deviceIds, actorIds, edgeIds] = [anchorsOf(pieces, 'device'), anchorsOf(pieces, 'actor'), anchorsOf(pieces, 'edge')];
  const devices = world.devices.filter((device) => deviceIds.has(device.id) && busOf(world, device) !== undefined);
  const outward = fromOfficeOutward(world.routers ?? [], new Set(pieces.filter((piece) => piece.kind === 'edge' && piece.inOffice).map(({ anchorId }) => anchorId)));
  const drawnFloors = new Set(world.lans ? devices.map((device) => busOf(world, device)) : []);
  return {
    devices,
    servers: world.actors.filter(isServer).filter(({ id }) => deviceIds.has(id)),
    clients: world.actors.filter((actor): actor is ClientActor => !isServer(actor) && actorIds.has(actor.id)),
    ...splitGateways(
      outward.filter(({ id }) => edgeIds.has(id)),
      drawnFloors,
    ),
    edge: [...edgeIds].some((id) => !outward.some((router) => router.id === id)),
    internet: pieces.some((piece) => piece.kind === 'internet'),
  };
}

/** Takes a world and what `classify` found; returns the `Drawn` that `stationsFor` reads: each drawn device with the id of its bus, and the clients, servers, routers, gateways, lone edge and internet. */
export function drawnOf(world: Network, found: Classified): Drawn {
  const ids = (list: readonly { id: string }[]) => list.map(({ id }) => id);
  return {
    devices: Object.fromEntries(found.devices.map((device) => [device.id, busOf(world, device) ?? world.kind])),
    clients: ids(found.clients),
    servers: ids(found.servers),
    routers: ids(found.routers),
    gateways: ids(found.gateways),
    edge: found.edge,
    internet: found.internet,
  };
}

/** Takes what a piece wears (its label, whether it is locked and whether it has the alert); returns its lines and the box of its label: the alert goes before the first line and the lock after the last, as in the button, so the box is as wide as the widest line with what it wears, and as tall as its lines. */
export function labelOf({ label, locked, state }: { label: TermText; locked: boolean; state: RowPiece['state'] }): PieceLabel {
  const lines = labelLines(label);
  const widths = lines.map((line, index) => labelWidth(line, { alert: index === 0 && state === 'intruded', locked: index === lines.length - 1 && locked }));
  return { lines, width: Math.max(...widths), height: labelBox(lines).height };
}
