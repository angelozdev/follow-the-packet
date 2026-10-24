import { z } from 'zod';
import { DEFAULT_DIRECTION, actorSchema, deviceSchema, directionSchema, dnsSchema, editableRecordSchema, firewallSchema, forwardSchema, hostLineSchema, ipSchema, lanSchema, processSchema, realPort, recordKeySchema, routeSchema, routerInterfaceSchema, routerSchema, ruleSchema, sameDestination, serviceSchema } from './schema';
import { lansOf } from '@/engine/network/addressing/topology';
import { recordProblem, sameName, zoneHeldBy } from '@/engine/dns/records';
import { siteSchema, webServiceSchema, type Site, type WebService } from '@/engine/web/schema';
import type { Actor, AnswerRecord, Device, Direction, DnsRecord, Firewall, Forward, HostLine, Lan, Network, Route, Router, Rule, ServerActor, ServerDns, Service } from './types';

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
  z.object({ type: z.literal('setServices'), ownerId: nonEmpty, services: z.array(serviceSchema), processes: z.array(processSchema).optional() }),
  z.object({ type: z.literal('setListenAddress'), ownerId: nonEmpty, ...serviceSchema.omit({ web: true, processId: true }).shape }),
  z.object({ type: z.literal('setProcess'), deviceId: nonEmpty, processId: nonEmpty, running: z.boolean() }),
  z.object({ type: z.literal('setWebService'), ownerId: nonEmpty, port: realPort, web: webServiceSchema }),
  z.object({ type: z.literal('addSite'), ownerId: nonEmpty, port: realPort, site: siteSchema }),
  z.object({ type: z.literal('addRoute'), routerId: nonEmpty, route: routeSchema }),
  z.object({ type: z.literal('removeRoute'), routerId: nonEmpty, to: routeSchema.shape.to }),
  z.object({ type: z.literal('setForwards'), routerId: nonEmpty, forwards: z.array(forwardSchema) }),
  z.object({ type: z.literal('setDns'), ownerId: nonEmpty, dns: dnsSchema.optional() }),
  z.object({ type: z.literal('setDnsServer'), deviceId: nonEmpty, server: ipSchema.optional() }),
  z.object({ type: z.literal('setHosts'), deviceId: nonEmpty, hosts: z.array(hostLineSchema) }),
  z.object({ type: z.literal('addRecord'), serverId: nonEmpty, record: editableRecordSchema }),
  z.object({ type: z.literal('removeRecord'), serverId: nonEmpty, record: recordKeySchema }),
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

export const ROUTE_PROBLEMS = ['no-router', 'destination-has-route'] as const;

/** Why a router does not take a route: the network has no router with that id, or the router already has a route to that destination, whatever its next hop (a table holds one route to each). */
export type RouteProblem = (typeof ROUTE_PROBLEMS)[number];

/** Says why a router does not take a route, or undefined when it does. `addRoute` applies a route only when there is no problem, so it returns the same network exactly when this returns a code. */
export function routeProblem(net: Network, routerId: string, route: Route): RouteProblem | undefined {
  const router = (net.routers ?? []).find((r) => r.id === routerId);
  if (!router) return 'no-router';
  return router.routes.some(({ to }) => sameDestination(to, route.to)) ? 'destination-has-route' : undefined;
}

/** Adds a route at the end of the table of a router, unless `routeProblem` says the router does not take it. */
function withRoute(net: Network, routerId: string, route: Route): Network {
  return routeProblem(net, routerId, route) === undefined ? changeRouter(net, routerId, (r) => ({ ...r, routes: [...r.routes, route] })) : net;
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

function withSetting(device: Device, setting: 'gateway' | 'dnsServer', value: string | undefined): Device {
  return value !== undefined ? { ...device, [setting]: value } : without(device, setting);
}

/** Replaces the hosts file of a device; an empty list takes the field away, so a device that had none is the same one as before. */
function withHosts(device: Device, hosts: HostLine[]): Device {
  return hosts.length > 0 ? { ...device, hosts } : without(device, 'hosts');
}

/** Replaces the DNS setup of a server of the internet; with none, the server stops being a DNS server and the field goes away. */
function withDns(net: Network, ownerId: string, dns: ServerDns | undefined): Network {
  const changeServer = (server: ServerActor): ServerActor => (dns ? { ...server, dns } : without(server, 'dns'));
  if (!net.actors.some((a) => isServer(a) && a.id === ownerId)) return net;
  return { ...net, actors: net.actors.map((a) => (isServer(a) && a.id === ownerId ? changeServer(a) : a)) };
}

function changeZone(net: Network, serverId: string, zoneName: string, change: (records: DnsRecord[]) => DnsRecord[]): Network {
  const changeZones = (dns: ServerDns): ServerDns => ({ ...dns, zones: (dns.zones ?? []).map((zone) => (zone.name === zoneName ? { ...zone, records: change(zone.records) } : zone)) });
  return { ...net, actors: net.actors.map((a) => (isServer(a) && a.id === serverId && a.dns ? { ...a, dns: changeZones(a.dns) } : a)) };
}

/** Adds a record to the zone of an authoritative server that holds its name, unless the server does not take it (`recordProblem`). */
function withRecord(net: Network, serverId: string, record: AnswerRecord): Network {
  const zone = zoneHeldBy(net, serverId, record.name);
  return zone && recordProblem(net, serverId, record) === undefined ? changeZone(net, serverId, zone.name, (records) => [...records, record]) : net;
}

/** Removes the record with that name, type and value from the zone that holds the name, unless it has none like it. */
function withoutRecord(net: Network, serverId: string, key: Pick<AnswerRecord, 'name' | 'type' | 'value'>): Network {
  const zone = zoneHeldBy(net, serverId, key.name);
  const isIt = (record: DnsRecord) => sameName(record.name, key.name) && record.type === key.type && record.value === key.value;
  return zone?.records.some(isIt) ? changeZone(net, serverId, zone.name, (records) => records.filter((record) => !isIt(record))) : net;
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

/** Replaces the processes of a device with the ones an action gives, when it gives any; a server of the internet has none, so the network stays as it is. */
function withProcesses(net: Network, { ownerId, processes }: Extract<NetworkAction, { type: 'setServices' }>): Network {
  return processes === undefined ? net : changeDevice(net, ownerId, (d) => ({ ...d, host: { ...d.host, processes } }));
}

/** Sets whether a process of a device runs, unless the network has no such device or the device has no such process. */
function withProcess(net: Network, { deviceId, processId, running }: Extract<NetworkAction, { type: 'setProcess' }>): Network {
  const processes = net.devices.find((d) => d.id === deviceId)?.host.processes;
  if (!processes?.some(({ id }) => id === processId)) return net;
  return changeDevice(net, deviceId, (d) => ({ ...d, host: { ...d.host, processes: processes.map((process) => (process.id === processId ? { ...process, running } : process)) } }));
}

/** Replaces the web service of the TCP service that an owner has on a port, unless it has none there. The other services are kept. */
function withWebService(net: Network, { ownerId, port, web }: Extract<NetworkAction, { type: 'setWebService' }>): Network {
  const isIt = (service: Service) => service.protocol === 'tcp' && service.port === port;
  const services = servicesOf(net, ownerId);
  return services?.some(isIt) ? withServices(net, ownerId, services.map((service) => (isIt(service) ? { ...service, web } : service))) : net;
}

export const SITE_PROBLEMS = ['no-web-service', 'name-has-site'] as const;

/** Why a web service does not take a site: the owner has no web service on that TCP port, or a name of the site is already the name of a site of the service. */
export type SiteProblem = (typeof SITE_PROBLEMS)[number];

const isWebAt = (service: Service, port: number): boolean => service.protocol === 'tcp' && service.port === port && service.web !== undefined;

/** Returns the TCP service that a device or a server of the internet has on a port, or undefined when `ownerId` is neither or has none there. */
export function tcpServiceAt(net: Network, ownerId: string, port: number): Service | undefined {
  return servicesOf(net, ownerId)?.find((service) => service.protocol === 'tcp' && service.port === port);
}

/** Returns the web service that a device or a server of the internet has on a TCP port, or undefined when `ownerId` is neither or has none there. */
export function webServiceAt(net: Network, ownerId: string, port: number): WebService | undefined {
  return servicesOf(net, ownerId)?.find((service) => isWebAt(service, port))?.web;
}

/** Says why the web service of `ownerId` on TCP `port` does not take a site, or undefined when it does. `addSite` applies a site only when there is no problem, so it returns the same network exactly when this returns a code. */
export function siteProblem(net: Network, ownerId: string, port: number, site: Site): SiteProblem | undefined {
  const web = webServiceAt(net, ownerId, port);
  if (!web) return 'no-web-service';
  const taken = web.sites.flatMap(({ names }) => names);
  return site.names.some((name) => taken.some((held) => sameName(held, name))) ? 'name-has-site' : undefined;
}

/** Adds a site to the web service of an owner on a TCP port, unless `siteProblem` says the service does not take it. */
function withSite(net: Network, { ownerId, port, site }: Extract<NetworkAction, { type: 'addSite' }>): Network {
  if (siteProblem(net, ownerId, port, site) !== undefined) return net;
  const addTo = (service: Service): Service => (service.web && isWebAt(service, port) ? { ...service, web: { ...service.web, sites: [...service.web.sites, site] } } : service);
  return withServices(net, ownerId, (servicesOf(net, ownerId) ?? []).map(addTo));
}

function withListenAddress(net: Network, { ownerId, protocol, port, listen }: Extract<NetworkAction, { type: 'setListenAddress' }>): Network {
  const isIt = (service: Service) => service.protocol === protocol && service.port === port;
  const services = servicesOf(net, ownerId);
  return services?.some(isIt) ? withServices(net, ownerId, services.map((service) => (isIt(service) ? { ...service, listen } : service))) : net;
}

function withLan(net: Network, lan: Lan): Network {
  return { ...net, lans: [...(net.lans ?? lansOf(net)), lan] };
}

/** Returns the network after one action. An action that names a firewall, a rule, a device or a router the network does not have returns the same network; so does an `addRoute` for a destination the router already has a route to, a `removeRoute` for one it has none to, a `setProcess` for a process the device does not have, a `setServices` for an owner that is neither (its `processes` go to a device; a server of the internet keeps none), a `setWebService` for a port with no TCP service and an `addSite` that `siteProblem` refuses. A rule goes in the inbound list unless the action says outbound. A LAN added to an office that declares none keeps the single LAN its devices were on. */
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
      return changeDevice(net, action.deviceId, (d) => withSetting(d, 'gateway', action.gateway));
    case 'setDnsServer':
      return changeDevice(net, action.deviceId, (d) => withSetting(d, 'dnsServer', action.server));
    case 'setHosts':
      return changeDevice(net, action.deviceId, (d) => withHosts(d, action.hosts));
    case 'setDns':
      return withDns(net, action.ownerId, action.dns);
    case 'addRecord':
      return withRecord(net, action.serverId, action.record);
    case 'removeRecord':
      return withoutRecord(net, action.serverId, action.record);
    case 'addLan':
      return withLan(net, action.lan);
    case 'addDevice':
      return { ...net, devices: [...net.devices, action.device] };
    case 'addRouter':
      return { ...net, routers: [...(net.routers ?? []), action.router] };
    case 'setServices':
      return servicesOf(net, action.ownerId) ? withProcesses(withServices(net, action.ownerId, action.services), action) : net;
    case 'setListenAddress':
      return withListenAddress(net, action);
    case 'setProcess':
      return withProcess(net, action);
    case 'setWebService':
      return withWebService(net, action);
    case 'addSite':
      return withSite(net, action);
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
