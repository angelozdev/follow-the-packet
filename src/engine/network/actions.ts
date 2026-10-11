import { z } from 'zod';
import { DEFAULT_DIRECTION, actorSchema, deviceSchema, directionSchema, firewallSchema, ipSchema, lanSchema, routeSchema, routerInterfaceSchema, routerSchema, ruleSchema, serviceSchema } from './schema';
import { lansOf } from '@/engine/network/addressing/topology';
import type { Actor, Device, Direction, Firewall, Lan, Network, Router, Rule, ServerActor, Service } from './types';

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

function withGateway(device: Device, gateway: string | undefined): Device {
  if (gateway !== undefined) return { ...device, gateway };
  return Object.fromEntries(Object.entries(device).filter(([key]) => key !== 'gateway')) as Device;
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

/** Returns the network after one action. An action that names a firewall, a rule, a device or a router the network does not have returns the same network. A rule goes in the inbound list unless the action says outbound. A LAN added to an office that declares none keeps the single LAN its devices were on. */
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
    case 'updateRouter':
      return changeRouter(net, action.routerId, (r) => ({
        ...r,
        routes: action.routes ?? r.routes,
        interfaces: action.interfaces ?? r.interfaces,
        sendsUnreachable: action.sendsUnreachable ?? r.sendsUnreachable,
      }));
  }
}
