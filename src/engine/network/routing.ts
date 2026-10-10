import { ipInCidr, isPrivateIpv4, parseCidr } from './cidr';
import { ROUTE_DEFAULT } from './schema';
import { isConnected, lanOf, lansOf } from './topology';
import type { Device, Network, Route, Router, ServerActor } from './types';

const SERVER_LINK_PREFIX = 24;

/** Where a router sends a packet next, or why it cannot: a device of a LAN it faces, a server behind one of its interfaces, another router, or nothing. */
export type Onward =
  | { kind: 'device'; device: Device }
  | { kind: 'server'; server: ServerActor }
  | { kind: 'router'; router: Router; ingress: string }
  | { kind: 'no-host' }
  | { kind: 'private' }
  | { kind: 'no-route' };

function routersOf(net: Pick<Network, 'routers'>): Router[] {
  return net.routers ?? [];
}

/** Returns the IP of the interface of a router that faces a LAN, another router or a server, by the id of what it faces. */
export function interfaceTowards(router: Router, faces: string): string | undefined {
  return router.interfaces.find((face) => face.faces === faces)?.ip;
}

/** True when the IP is the address of one of the router's own interfaces. */
export function ownsIp(router: Router, ip: string): boolean {
  return router.interfaces.some((face) => face.ip === ip);
}

/** True when one of the router's interfaces faces a LAN: the router belongs to the office, and a router with none belongs to the road to the internet. */
export function facesALan(net: Network, router: Router): boolean {
  const lans = lansOf(net);
  return router.interfaces.some((face) => lans.some((lan) => lan.id === face.faces));
}

function covers(route: Route, ip: string): boolean {
  return route.to === ROUTE_DEFAULT || ipInCidr(ip, route.to);
}

function specificity(route: Route): number {
  return route.to === ROUTE_DEFAULT ? 0 : parseCidr(route.to).prefix;
}

/** Returns the most specific route of the router that covers the IP; `default` covers every IP and loses to any range. */
export function bestRoute(router: Router, ip: string): Route | undefined {
  return router.routes.filter((route) => covers(route, ip)).reduce<Route | undefined>((best, route) => (best && specificity(best) >= specificity(route) ? best : route), undefined);
}

function connectedDevice(net: Network, lanId: string, ip: string): Device | undefined {
  return net.devices.find((device) => device.privateIp === ip && isConnected(device) && lanOf(net, device)?.id === lanId);
}

function serversFacing(net: Network, router: Router): ServerActor[] {
  return net.actors.filter((actor): actor is ServerActor => actor.kind === 'server' && interfaceTowards(router, actor.id) !== undefined);
}

/** The link to a server is the /24 of the router's interface that faces it: the model gives an interface no mask of its own. */
function serverBehind(net: Network, router: Router, ip: string): Onward | undefined {
  const facing = serversFacing(net, router);
  const server = facing.find((candidate) => candidate.ip === ip);
  if (server) return { kind: 'server', server };
  const onLink = facing.some((candidate) => ipInCidr(ip, `${interfaceTowards(router, candidate.id)}/${SERVER_LINK_PREFIX}`));
  return onLink ? { kind: 'no-host' } : undefined;
}

function lanBehind(net: Network, router: Router, ip: string): Onward | undefined {
  const lan = lansOf(net).find((candidate) => interfaceTowards(router, candidate.id) !== undefined && ipInCidr(ip, candidate.cidr));
  if (!lan) return undefined;
  const device = connectedDevice(net, lan.id, ip);
  return device ? { kind: 'device', device } : { kind: 'no-host' };
}

function neighbourOwning(net: Network, router: Router, ip: string): Onward | undefined {
  const owner = routersOf(net).find((candidate) => candidate.interfaces.some((face) => face.ip === ip && face.faces === router.id));
  const ingress = owner && interfaceTowards(owner, router.id);
  return owner && ingress ? { kind: 'router', router: owner, ingress } : undefined;
}

function viaRoute(net: Network, router: Router, ip: string): Onward {
  const route = bestRoute(router, ip);
  const next = route && routersOf(net).find((candidate) => candidate.id === route.next);
  const ingress = next && interfaceTowards(next, router.id);
  return next && ingress ? { kind: 'router', router: next, ingress } : { kind: 'no-route' };
}

/** Decides where the router sends a packet that is not for itself: to what it has connected, to the router next door whose own interface is the destination, and otherwise by its routes. A router outside the office that has no such connection drops a private IP, which the internet does not carry (RFC 1918, §3). */
export function onwardFrom(net: Network, router: Router, ip: string): Onward {
  const connected = lanBehind(net, router, ip) ?? serverBehind(net, router, ip) ?? neighbourOwning(net, router, ip);
  if (connected) return connected;
  if (isPrivateIpv4(ip) && !facesALan(net, router)) return { kind: 'private' };
  return viaRoute(net, router, ip);
}
