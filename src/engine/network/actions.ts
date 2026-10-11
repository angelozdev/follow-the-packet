import { z } from 'zod';
import { DEFAULT_DIRECTION, actorSchema, deviceSchema, directionSchema, firewallSchema, forwardSchema, ipSchema, lanSchema, routeSchema, routerInterfaceSchema, routerSchema, ruleSchema, sameDestination, serviceSchema } from './schema';
import { lansOf } from '@/engine/network/addressing/topology';
import type { Actor, Device, Direction, Firewall, Forward, Lan, Network, Route, Router, Rule, ServerActor, Service } from './types';

const nonEmpty = z.string().min(1);

export const networkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), firewallId: nonEmpty, rule: ruleSchema, direction: directionSchema.optional() }),
  z.object({ type: z.literal('removeRule'), firewallId: nonEmpty, ruleId: nonEmpty, direction: directionSchema.optional() }),
  z.object({ type: z.literal('setAppTarget'), deviceId: nonEmpty, target: nonEmpty }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), deviceId: nonEmpty, value: z.boolean() }),
  z.object({ type: z.literal('addActor'), actor: actorSchema }),
  z.object({ type: z.literal('addFirewall'), deviceId: nonEmpty, firewall: firewallSchema }),
  z.object({ type: z.literal('connectDevice'), deviceId: nonEmpty }),
  z.object({ type: z.literal('setGateway'), deviceId: nonEmpty, gateway: ipSchema.optional() }),
  z.object({ type: z.literal('addLan'), lan: lanSchema }),
  z.object({ type: z.literal('addDevice'), device: deviceSchema }),
  z.object({ type: z.literal('addRouter'), router: routerSchema }),
  z.object({ type: z.literal('setServices'), ownerId: nonEmpty, services: z.array(serviceSchema) }),
  z.object({ type: z.literal('setListenAddress'), ownerId: nonEmpty, ...serviceSchema.shape }),
  z.object({ type: z.literal('addRoute'), routerId: nonEmpty, route: routeSchema }),
  z.object({ type: z.literal('removeRoute'), routerId: nonEmpty, to: routeSchema.shape.to }),
  z.object({ type: z.literal('setForwards'), routerId: nonEmpty, forwards: z.array(forwardSchema) }),
  z.object({
    type: z.literal('updateRouter'),
    routerId: nonEmpty,
    routes: z.array(routeSchema).optional(),
    interfaces: z.array(routerInterfaceSchema).optional(),
    sendsUnreachable: z.boolean().optional(),
  }),
]);

export type NetworkAction = z.infer<typeof networkActionSchema>;

function changeDevice(net: Network, deviceId: string, change: (device: Device) => Device): Network {
  if (!net.devices.some((d) => d.id === deviceId)) return net;
  return { ...net, devices: net.devices.map((d) => (d.id === deviceId ? change(d) : d)) };
}

const isServer = (actor: Actor): actor is ServerActor => actor.kind === 'server';

function changeRouter(net: Network, routerId: string, change: (router: Router) => Router): Network {
  const routers = net.routers ?? [];
  if (!routers.some((r) => r.id === routerId)) return net;
  return { ...net, routers: routers.map((r) => (r.id === routerId ? change(r) : r)) };
}

/** Adds a route at the end of the table of a router, unless the router is not there or already has a route to that destination: a table holds one route to each. */
function withRoute(net: Network, routerId: string, route: Route): Network {
  const router = (net.routers ?? []).find((r) => r.id === routerId);
  if (!router || router.routes.some(({ to }) => sameDestination(to, route.to))) return net;
  return changeRouter(net, routerId, (r) => ({ ...r, routes: [...r.routes, route] }));
}

/** Removes the route of a destination from the table of a router, unless the router is not there or has no route to it. */
function withoutRoute(net: Network, routerId: string, destination: string): Network {
  const router = (net.routers ?? []).find((r) => r.id === routerId);
  if (!router?.routes.some(({ to }) => sameDestination(to, destination))) return net;
  return changeRouter(net, routerId, (r) => ({ ...r, routes: r.routes.filter(({ to }) => !sameDestination(to, destination)) }));
}

function changeRules(net: Network, firewallId: string, direction: Direction, change: (rules: Rule[]) => Rule[]): Network {
  if (!net.firewalls.some((f) => f.id === firewallId)) return net;
  const changeFirewall = (f: Firewall): Firewall => ({ ...f, [direction]: change(f[direction]) });
  return { ...net, firewalls: net.firewalls.map((f) => (f.id === firewallId ? changeFirewall(f) : f)) };
}

function withoutRule(net: Network, firewallId: string, direction: Direction, ruleId: string): Network {
  const firewall = net.firewalls.find((f) => f.id === firewallId);
  if (!firewall?.[direction].some((r) => r.id === ruleId)) return net;
  return changeRules(net, firewallId, direction, (rules) => rules.filter((r) => r.id !== ruleId));
}

function withFirewall(net: Network, deviceId: string, firewall: Firewall): Network {
  const guarded = changeDevice(net, deviceId, (d) => ({ ...d, firewallIds: [...d.firewallIds, firewall.id] }));
  return guarded === net ? net : { ...guarded, firewalls: [...guarded.firewalls, firewall] };
}

function without<Value extends object>(value: Value, field: string): Value {
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== field)) as Value;
}

function withGateway(device: Device, gateway: string | undefined): Device {
  return gateway !== undefined ? { ...device, gateway } : without(device, 'gateway');
}

/** Replaces the forwards of a router; an empty list takes the field away, so a router that had none is the same one as before. */
function withForwards(router: Router, forwards: Forward[]): Router {
  return forwards.length > 0 ? { ...router, forwards } : without(router, 'forwards');
}

/** Returns the services of a device or of a server of the internet, or undefined when the network has neither under that id. */
function servicesOf(net: Network, ownerId: string): Service[] | undefined {
  const device = net.devices.find((d) => d.id === ownerId);
  if (device) return device.host.services;
  const server = net.actors.find((a): a is ServerActor => isServer(a) && a.id === ownerId);
  return server && (server.services ?? []);
}

function withServices(net: Network, ownerId: string, services: Service[]): Network {
  if (net.devices.some((d) => d.id === ownerId)) return changeDevice(net, ownerId, (d) => ({ ...d, host: { ...d.host, services } }));
  return { ...net, actors: net.actors.map((a) => (isServer(a) && a.id === ownerId ? { ...a, services } : a)) };
}

function withListenAddress(net: Network, { ownerId, protocol, port, listen }: Extract<NetworkAction, { type: 'setListenAddress' }>): Network {
  const isIt = (service: Service) => service.protocol === protocol && service.port === port;
  const services = servicesOf(net, ownerId);
  return services?.some(isIt) ? withServices(net, ownerId, services.map((service) => (isIt(service) ? { ...service, listen } : service))) : net;
}

function withLan(net: Network, lan: Lan): Network {
  return { ...net, lans: [...(net.lans ?? lansOf(net)), lan] };
}

/** Returns the network after one action. An action that names a firewall, a rule, a device or a router the network does not have returns the same network; so does an `addRoute` for a destination the router already has a route to and a `removeRoute` for one it has none to. A rule goes in the inbound list unless the action says outbound. A LAN added to an office that declares none keeps the single LAN its devices were on. */
export function applyAction(net: Network, action: NetworkAction): Network {
  switch (action.type) {
    case 'addRule':
      return changeRules(net, action.firewallId, action.direction ?? DEFAULT_DIRECTION, (rules) => [...rules, action.rule]);
    case 'removeRule':
      return withoutRule(net, action.firewallId, action.direction ?? DEFAULT_DIRECTION, action.ruleId);
    case 'setAppTarget':
      return changeDevice(net, action.deviceId, (d) => ({ ...d, appTarget: action.target }));
    case 'setIgnoreIcmpEcho':
      return changeDevice(net, action.deviceId, (d) => ({ ...d, host: { ...d.host, ignoreIcmpEcho: action.value } }));
    case 'addActor':
      return { ...net, actors: [...net.actors, action.actor] };
    case 'addFirewall':
      return withFirewall(net, action.deviceId, action.firewall);
    case 'connectDevice':
      return changeDevice(net, action.deviceId, (d) => ({ ...d, connected: true }));
    case 'setGateway':
      return changeDevice(net, action.deviceId, (d) => withGateway(d, action.gateway));
    case 'addLan':
      return withLan(net, action.lan);
    case 'addDevice':
      return { ...net, devices: [...net.devices, action.device] };
    case 'addRouter':
      return { ...net, routers: [...(net.routers ?? []), action.router] };
    case 'setServices':
      return servicesOf(net, action.ownerId) ? withServices(net, action.ownerId, action.services) : net;
    case 'setListenAddress':
      return withListenAddress(net, action);
    case 'addRoute':
      return withRoute(net, action.routerId, action.route);
    case 'removeRoute':
      return withoutRoute(net, action.routerId, action.to);
    case 'setForwards':
      return changeRouter(net, action.routerId, (r) => withForwards(r, action.forwards));
    case 'updateRouter':
      return changeRouter(net, action.routerId, (r) => ({
        ...r,
        routes: action.routes ?? r.routes,
        interfaces: action.interfaces ?? r.interfaces,
        sendsUnreachable: action.sendsUnreachable ?? r.sendsUnreachable,
      }));
  }
}
