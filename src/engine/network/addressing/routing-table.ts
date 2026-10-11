import { ROUTE_DEFAULT } from '@/engine/network/schema';
import { networkOf } from './cidr';
import { SERVER_LINK_PREFIX, coveringRoutes, interfaceTowards } from './routing';
import { lanOf, lansOf } from './topology';
import type { Device, Network, Route, Router, RouterInterface } from '@/engine/network/types';

const PEER_LINK_PREFIX = 32;

/** Where a row of a routing table comes from: `connected` is the range of a network the holder is plugged into, `default` is the route that takes what no other covers, and `static` is any other route the holder was given. */
export type RouteKind = 'connected' | 'default' | 'static';

/** A row of a routing table: the range it covers (`ROUTE_DEFAULT` for the default route), where it comes from and the IP of the next hop, which a connected route does not have because its destination is on the link. */
export interface TableRoute {
  to: string;
  kind: RouteKind;
  via?: string;
}

/** The route a holder picked for a destination and the rows that also covered it but lost. */
export interface RouteDecision {
  holderId: string;
  route: Pick<TableRoute, 'to' | 'via'>;
  kind: RouteKind;
  alsoCovered: TableRoute[];
}

type Holder = Device | Router;

function isRouter(holder: Holder): holder is Router {
  return 'interfaces' in holder;
}

function deviceTable(net: Network, device: Device): TableRoute[] {
  const connected: TableRoute = { to: lanOf(net, device)?.cidr ?? net.cidr, kind: 'connected' };
  return device.gateway ? [connected, { to: ROUTE_DEFAULT, kind: 'default', via: device.gateway }] : [connected];
}

/** The model gives an interface no mask: what a LAN is is its range, the link to a server is the /24 of the interface and the link to another router is that router's own address, as in a point-to-point link. */
function rangeFacing(net: Network, router: Router, face: RouterInterface): string | undefined {
  const lan = lansOf(net).find((candidate) => candidate.id === face.faces);
  if (lan) return lan.cidr;
  if (net.actors.some((actor) => actor.kind === 'server' && actor.id === face.faces)) return networkOf(face.ip, SERVER_LINK_PREFIX);
  const peer = (net.routers ?? []).find((candidate) => candidate.id === face.faces);
  const peerIp = peer && interfaceTowards(peer, router.id);
  return peerIp && networkOf(peerIp, PEER_LINK_PREFIX);
}

function ownRoute(net: Network, router: Router, route: Route): TableRoute {
  const next = (net.routers ?? []).find((candidate) => candidate.id === route.next);
  const via = next && interfaceTowards(next, router.id);
  return { to: route.to, kind: route.to === ROUTE_DEFAULT ? 'default' : 'static', ...(via && { via }) };
}

function routerTable(net: Network, router: Router): TableRoute[] {
  const connected = router.interfaces.flatMap((face) => {
    const to = rangeFacing(net, router, face);
    return to ? [{ to, kind: 'connected' as const }] : [];
  });
  return [...connected, ...router.routes.map((route) => ownRoute(net, router, route))];
}

/** Derives the routing table of a device or a router: a connected route for each network it is plugged into (a device has its LAN, a router one per interface), the default route (the gateway of a device, or the `default` route of a router) and the routes of a router. A device has no routes of its own. The next hop is the IP of the router's interface that faces the holder, and a connected route has none. The rows come connected first, then the routes of the router in the order it has them, which is the order that breaks a tie between rows of the same range. */
export function routingTableOf(net: Network, holder: Holder): TableRoute[] {
  return isRouter(holder) ? routerTable(net, holder) : deviceTable(net, holder);
}

/** Picks the row of the holder's table that carries a packet to the IP, the most specific one (the same rule routers use, `coveringRoutes`), and lists the rows that also covered it; undefined when no row covers the IP. */
export function chooseRoute(net: Network, holder: Holder, ip: string): RouteDecision | undefined {
  const covering = coveringRoutes(routingTableOf(net, holder), ip);
  const chosen = covering.at(0);
  return chosen && { holderId: holder.id, route: { to: chosen.to, ...(chosen.via && { via: chosen.via }) }, kind: chosen.kind, alsoCovered: covering.slice(1) };
}
