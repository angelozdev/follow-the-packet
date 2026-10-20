import type { Network, PacketSpec, Reason, Trace } from '@/engine';

/** What the map draws, by id, as much as `stationsFor` needs to name where a packet stops. `devices` holds each drawn device with the id of the bus it hangs from (the floor, the subnet, or the one bus of an office with neither); `clients` and `servers` are the actors of the internet that are drawn; `routers` are the routers along the main line, from the office outward, and `gateways` the routers of another office, which stand off that line; `edge` is the lone edge of a world with no routers. */
export interface Drawn {
  devices: Readonly<Record<string, string>>;
  clients: readonly string[];
  servers: readonly string[];
  routers: readonly string[];
  gateways: readonly string[];
  edge: boolean;
  internet: boolean;
}

export interface StationOptions {
  hiddenStop?: boolean;
}

export const INTERNET = 'internet';
export const EDGE = 'edge';
export const LINE_END = 'line-end';

/** The names of the stations of the map. A device has `door`, `doorstep`, `firewall` and `road`; a bus has `busEnd` (the stub past its last device) and `bus` (where its trunk leaves it, named only inside a `mid`); a router has `router`; a server or a client has `door`; `mid` is the middle of the link between two stops, and `LINE_END` is the stub past the last stop of the main line, where a link that leaves it ends. */
export const station = {
  door: (id: string) => `door:${id}`,
  doorstep: (id: string) => `doorstep:${id}`,
  firewall: (id: string) => `firewall:${id}`,
  road: (id: string) => `road:${id}`,
  busEnd: (bus: string) => `bus-end:${bus}`,
  bus: (bus: string) => `bus:${bus}`,
  router: (id: string) => `router:${id}`,
  mid: (before: string, after: string) => `mid:${before}-${after}`,
};

const STAYS_IN_DEVICE: Reason['code'][] = ['route-self', 'route-loopback', 'address-invalid', 'route-no-gateway', 'route-not-connected', 'forward-no-owner'];
const NOT_A_ROUTER: Reason['code'][] = ['route-gateway-not-a-router'];
const DROPPED_BY_A_ROUTER: Reason['code'][] = ['forward-ttl-exceeded', 'forward-no-route', 'forward-no-host', 'forward-private-dropped', 'nat-no-translation'];
const NOBODY_HAS_IT: Reason['code'][] = ['route-no-device'];
const EDGE_PLACES: string[] = ['internet-gateway', 'router'] satisfies Network['edge'][];

function isDeviceDrawn(id: string, drawn: Drawn): boolean {
  return Object.hasOwn(drawn.devices, id);
}

function isActorDrawn(id: string, drawn: Drawn): boolean {
  return drawn.clients.includes(id) || drawn.servers.includes(id);
}

function isRouterDrawn(id: string, drawn: Drawn): boolean {
  return drawn.routers.includes(id) || drawn.gateways.includes(id);
}

/** Takes what the map draws and returns the stops of its main line, in order: the lone edge, the routers from the office outward, the internet and the door of each server. */
export function mainLine(drawn: Drawn): string[] {
  return [...(drawn.edge ? [EDGE] : []), ...drawn.routers.map(station.router), ...(drawn.internet ? [INTERNET] : []), ...drawn.servers.map(station.door)];
}

/** Takes the id of a device and returns the stations a packet passes when it leaves that device for the road: its door, its firewall and its road. */
function leavingStations(deviceId: string): string[] {
  return [station.door(deviceId), station.firewall(deviceId), station.road(deviceId)];
}

/** Takes the id of a device and returns the stations of a packet that never leaves it: its door and its doorstep. */
function stayingStations(deviceId: string): string[] {
  return [station.door(deviceId), station.doorstep(deviceId)];
}

function forwardDrop(trace: Trace, reasons: readonly Reason['code'][]): Reason | undefined {
  return trace.steps.find(({ stage, verdict, reason }) => stage === 'forward' && verdict === 'drop' && reasons.includes(reason.code))?.reason;
}

function routerThatDrops(trace: Trace): string | undefined {
  const reason = forwardDrop(trace, DROPPED_BY_A_ROUTER);
  return reason && 'routerId' in reason ? reason.routerId : undefined;
}

function gatewayThatDrops(trace: Trace): string | undefined {
  const reason = forwardDrop(trace, NOT_A_ROUTER);
  return reason && 'deviceId' in reason ? reason.deviceId : undefined;
}

function crossesTheEdge(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'nat' || (s.stage === 'route' && EDGE_PLACES.includes(s.at)));
}

/** Returns the half way station that a router the map does not draw leaves after `last`, the last stop the packet crossed: between that stop and the next one of the main line, past the last stop it is between that stop and the end of the line, and, from the road of the sender, between its bus and the first stop. A packet that crossed something off the main line (a client, the gateway of another office) has no half way and ends there. */
function halfWayAfter(last: string, senderId: string | undefined, drawn: Drawn): string[] {
  const line = mainLine(drawn);
  const at = line.indexOf(last);
  if (at >= 0) return [station.mid(last, line[at + 1] ?? LINE_END)];
  return senderId !== undefined && last === station.road(senderId) ? [station.mid(station.bus(drawn.devices[senderId]), line[0] ?? LINE_END)] : [];
}

/** Appends the drawn routers the packet crossed, in order, and, when a router drops it, the place where it ends: that router if it is drawn, or half way to the next stop of the main line if it is not. */
function throughRouters(stations: string[], trace: Trace, senderId: string | undefined, drawn: Drawn): string[] {
  const crossed = (trace.hops ?? []).filter(({ routerId }) => isRouterDrawn(routerId, drawn)).map(({ routerId }) => station.router(routerId));
  const through = [...stations, ...crossed];
  const dropper = routerThatDrops(trace);
  const last = through.at(-1);
  if (dropper === undefined || isRouterDrawn(dropper, drawn) || last === undefined) return through;
  return [...through, ...halfWayAfter(last, senderId, drawn)];
}

/** Appends the end of the road when the packet was answered by a router or a server instead of a device: its station if the map draws it. */
function toResponder(stations: string[], trace: Trace, drawn: Drawn): string[] {
  const id = trace.destinationId;
  if (id === null) return stations;
  if (isRouterDrawn(id, drawn)) return [...stations, station.router(id)];
  return drawn.servers.includes(id) ? [...stations, station.door(id)] : stations;
}

function withoutRepeats(stations: string[]): string[] {
  return stations.filter((name, index) => name !== stations[index - 1]);
}

function walk(trace: Trace, packet: PacketSpec, drawn: Drawn, hiddenStop: boolean): string[] {
  const { from } = packet;
  const senderId = from.kind === 'device' && isDeviceDrawn(from.id, drawn) ? from.id : undefined;
  if (senderId !== undefined && trace.steps.some((s) => STAYS_IN_DEVICE.includes(s.reason.code))) return stayingStations(senderId);
  if (from.kind === 'device' && senderId === undefined) return [];

  const internet = drawn.internet ? [INTERNET] : [];
  const actorDoor = isActorDrawn(from.id, drawn) ? [station.door(from.id)] : internet;
  const origin = senderId === undefined ? [...actorDoor, ...internet] : leavingStations(senderId);

  if (senderId !== undefined && hiddenStop && routerThatDrops(trace) !== undefined) return stayingStations(senderId);
  if (trace.steps.some((s) => s.stage === 'firewall-out' && s.verdict === 'drop')) return senderId !== undefined && hiddenStop ? stayingStations(senderId) : origin.slice(0, 2);
  if (trace.steps.some((s) => NOBODY_HAS_IT.includes(s.reason.code))) return senderId === undefined ? origin : [...origin, station.busEnd(drawn.devices[senderId])];

  const crossingTheEdge = drawn.edge && crossesTheEdge(trace) ? [...origin, EDGE] : origin;
  if (trace.steps.some((s) => (s.stage === 'route' || s.stage === 'dns') && s.verdict === 'drop')) return crossingTheEdge;

  const crossed = throughRouters(crossingTheEdge, trace, senderId, drawn);
  const receiverId = trace.destinationId ?? gatewayThatDrops(trace);
  if (!receiverId || !isDeviceDrawn(receiverId, drawn)) return toResponder(crossed, trace, drawn);
  const arriving = [...crossed, station.road(receiverId), station.firewall(receiverId)];
  if (!hiddenStop && trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'drop')) return arriving;
  return [...arriving, station.door(receiverId)];
}

/** True when the packet starts at a piece the map draws: a device, or a client or a server of the internet. A packet that starts at a piece that is not drawn has nowhere to start from. */
export function startsOnMap(packet: PacketSpec, drawn: Drawn): boolean {
  return packet.from.kind === 'device' ? isDeviceDrawn(packet.from.id, drawn) : isActorDrawn(packet.from.id, drawn);
}

/** Takes the trace of a packet, the packet, what the map draws and, in `hiddenStop`, whether what stopped it is something the player cannot place; returns the stations the packet stops at, in order, and none of them twice in a row. A station is named only when the map draws a piece for it. The packet stays at its own doorstep when it never leaves its device (a ping to itself, to a loopback address or to an invalid one, an IP that nobody in its network has, a device with no cable or with no default gateway for it); at the end of the bus of its network when no device has its IP; in front of the firewall that drops it; at the door of a device that is the default gateway of the sender and is not a router. It crosses the edge only when the map draws it, and the routers of its trace that the map draws, in order: it ends at the router that drops it, or, when the map does not draw that router, half way between the last stop it crossed and the next one. With `hiddenStop`, a firewall the map does not draw leaves it at the door of the device that has the firewall, going in, and at its own doorstep, going out, and a router that dropped it leaves it at the doorstep of its sender, where the sender cannot know it died. A packet whose sender is not drawn has no stations. */
export function stationsFor(trace: Trace, packet: PacketSpec, drawn: Drawn, { hiddenStop = false }: StationOptions = {}): string[] {
  return withoutRepeats(walk(trace, packet, drawn, hiddenStop));
}
