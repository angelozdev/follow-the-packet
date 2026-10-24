import { z } from 'zod';
import { ipInCidr, isIpv4, isPrivateCidr, networkOf, parseCidr } from '@/engine/network/addressing/cidr';
import { lanOf, lansOf } from '@/engine/network/addressing/topology';
import { holdsAliasAndMore, isWithin, normalizeName, sameName } from '@/engine/dns/records';
import { DNS_PORT } from '@/engine/dns/resolve';
import { httpMessageSchema, webServiceSchema } from '@/engine/web/schema';

export const ROUTE_DEFAULT = 'default';
export const TTL_MAX = 255;
/** The TTL a packet leaves with when nobody sets one: 64, which IANA recommends and Linux uses. */
export const DEFAULT_TTL = 64;
/** The source port a TCP or UDP packet leaves with when nobody sets one: 51514, inside the range IANA recommends for dynamic ports (49152 to 65535, RFC 6335 §6) and the default of the Linux kernel (32768 to 60999, `ip_local_port_range`); both read in the chapter 2 research on 2026-10-10. */
export const DEFAULT_SOURCE_PORT = 51514;

export const ipSchema = z.string().refine(isIpv4, 'invalid IPv4');
function isCidr(value: string): boolean {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}

/** A range written as an IPv4 address and a prefix, such as 192.168.1.0/24. */
export const cidr = z.string().refine(isCidr, 'invalid CIDR');
const PORT_MAX = 65535;
const port = z.number().int().min(0).max(PORT_MAX);
/** A port a program binds or a packet leaves from: from 1 to 65535, since IANA marks port 0 as reserved. */
export const realPort = z.number().int().min(1).max(PORT_MAX);
const nonEmpty = z.string().min(1);
const latencyMs = z.number().nonnegative();
const UINT32_MAX = 4294967295;
const unsigned32 = z.number().int().min(0).max(UINT32_MAX);
/** The largest TTL of a DNS record: 2^31 - 1, since a TTL is an unsigned number of 31 significant bits (RFC 2181 §8, read on 2026-10-11). */
export const DNS_TTL_MAX = 2147483647;
const dnsTtl = z.number().int().min(0).max(DNS_TTL_MAX);

export const directionSchema = z.enum(['inbound', 'outbound']);
/** The direction of a rule that does not say one: inbound. */
export const DEFAULT_DIRECTION: z.infer<typeof directionSchema> = 'inbound';

/** The ICMP type of an Echo Request, the message a ping sends (RFC 792). */
export const ECHO_REQUEST = 8;

export const icmpTypeSchema = z.union([z.literal(0), z.literal(ECHO_REQUEST)]);

export const ruleWhatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('tcp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('udp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('icmp'), icmpType: z.union([icmpTypeSchema, z.literal('all')]) }),
]);

export const rulePeerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cidr'), cidr }),
  z.object({ kind: z.literal('sg'), sgId: z.string().min(1) }),
]);

export const ruleSchema = z.object({ id: z.string().min(1), what: ruleWhatSchema, peer: rulePeerSchema });

export const firewallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['host-firewall', 'security-group']),
  inbound: z.array(ruleSchema),
  outbound: z.array(ruleSchema),
});

/** Where a service listens: on every IP of the device (`all`) or only on 127.0.0.1 (`loopback`). */
export const listenSchema = z.enum(['all', 'loopback']);

export const serviceSchema = z.object({
  protocol: z.enum(['tcp', 'udp']),
  port: realPort,
  listen: listenSchema,
  web: webServiceSchema.optional(),
});

export const soaSchema = z.object({ mname: nonEmpty, rname: nonEmpty, serial: unsigned32, refresh: unsigned32, retry: unsigned32, expire: unsigned32, minimum: unsigned32 });

const recordShape = { name: nonEmpty, ttl: dnsTtl };
const addressRecordSchema = z.object({ ...recordShape, type: z.literal('A'), value: ipSchema });
const aliasRecordSchema = z.object({ ...recordShape, type: z.literal('CNAME'), value: nonEmpty });

/** The records a player can put in a zone and take out of it: an address and an alias. The NS and the SOA belong to the zone itself. */
export const editableRecordSchema = z.discriminatedUnion('type', [addressRecordSchema, aliasRecordSchema]);

export const dnsRecordSchema = z.discriminatedUnion('type', [
  addressRecordSchema,
  aliasRecordSchema,
  z.object({ ...recordShape, type: z.literal('NS'), value: nonEmpty }),
  z.object({ ...recordShape, type: z.literal('SOA'), value: soaSchema }),
]);

export const zoneSchema = z.object({ name: nonEmpty, records: z.array(dnsRecordSchema) });

/** The three things that tell an address record or an alias from any other: its name, its type and its value. */
export const recordKeySchema = z.object({ name: nonEmpty, type: z.enum(['A', 'CNAME']), value: nonEmpty });

export const dnsCacheEntrySchema = recordKeySchema.extend({ expiresAt: z.number().nonnegative() });

export const dnsSchema = z.object({
  role: z.enum(['resolver', 'authoritative']),
  upstreams: z.array(z.object({ zone: nonEmpty, serverId: nonEmpty })).optional(),
  zones: z.array(zoneSchema).optional(),
  cache: z.array(dnsCacheEntrySchema).optional(),
  failing: z.boolean().optional(),
});

/** One line of the hosts file of a device: a name and the IP it stands for. */
export const hostLineSchema = z.object({ name: nonEmpty, ip: ipSchema });

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['laptop', 'printer', 'ec2-instance']),
  subnetId: z.string().min(1).optional(),
  privateIp: ipSchema,
  publicIp: ipSchema.optional(),
  firewallIds: z.array(z.string().min(1)),
  host: z.object({ ignoreIcmpEcho: z.boolean(), services: z.array(serviceSchema) }),
  appTarget: z.string().min(1).optional(),
  lanId: nonEmpty.optional(),
  gateway: ipSchema.optional(),
  connected: z.boolean().optional(),
  dnsServer: ipSchema.optional(),
  hosts: z.array(hostLineSchema).optional(),
});

export const subnetSchema = z.object({ id: z.string().min(1), az: z.string().min(1), cidr });

export const lanSchema = z.object({ id: nonEmpty, name: nonEmpty, cidr, latencyMs });

export const routerInterfaceSchema = z.object({ ip: ipSchema, faces: nonEmpty });

export const routeSchema = z.object({ to: z.union([z.literal(ROUTE_DEFAULT), cidr]), next: nonEmpty });

function destinationKey(to: string): string {
  if (!isCidr(to)) return to;
  const { prefix } = parseCidr(to);
  return prefix === 0 ? ROUTE_DEFAULT : networkOf(to.split('/')[0], prefix);
}

/** True when two destinations of a route are the same one: a range is its first address and its prefix, so 198.51.100.7/24 is 198.51.100.0/24, and `default` is 0.0.0.0/0, the range of every IP. A table holds one route to each destination. */
export function sameDestination(a: string, b: string): boolean {
  return destinationKey(a) === destinationKey(b);
}

export const forwardSchema = z.object({
  protocol: serviceSchema.shape.protocol,
  publicPort: realPort,
  toDeviceId: nonEmpty,
  toPort: realPort,
});

export const routerSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  interfaces: z.array(routerInterfaceSchema),
  routes: z.array(routeSchema),
  forwards: z.array(forwardSchema).optional(),
  latencyMs,
  sendsUnreachable: z.boolean(),
});

const actorShape = { id: nonEmpty, name: nonEmpty, ip: ipSchema };

export const actorSchema = z.discriminatedUnion('kind', [
  z.object({ ...actorShape, kind: z.enum(['you', 'attacker', 'home']) }),
  z.object({ ...actorShape, kind: z.literal('server'), latencyMs, services: z.array(serviceSchema).optional(), dns: dnsSchema.optional() }),
]);

const networkShape = z.object({
  kind: z.enum(['office', 'vpc']),
  cidr,
  region: z.string().min(1).optional(),
  subnets: z.array(subnetSchema).optional(),
  devices: z.array(deviceSchema),
  firewalls: z.array(firewallSchema),
  edge: z.enum(['router', 'internet-gateway']),
  actors: z.array(actorSchema),
  lans: z.array(lanSchema).min(1).optional(),
  routers: z.array(routerSchema).optional(),
});

type NetworkShape = z.infer<typeof networkShape>;
type Fail = (message: string) => void;

function safeInCidr(value: string, range: string): boolean {
  try {
    return ipInCidr(value, range);
  } catch {
    return false;
  }
}

function checkIds(net: NetworkShape, fail: Fail): void {
  const ids = [
    ...(net.subnets ?? []).map((s) => s.id),
    ...net.devices.map((d) => d.id),
    ...net.firewalls.map((f) => f.id),
    ...net.actors.map((a) => a.id),
    ...(net.lans ?? []).map((l) => l.id),
    ...(net.routers ?? []).map((r) => r.id),
  ];
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) fail(`duplicate id: ${repeated}`);
}

function checkPrivateRange(range: string, fail: Fail): void {
  if (isCidr(range) && !isPrivateCidr(range)) fail(`${range} is not a private range (RFC 1918)`);
}

function addressOwners(net: NetworkShape): { owner: string; ip: string }[] {
  return [
    ...net.devices.map((device) => ({ owner: device.id, ip: device.privateIp })),
    ...(net.routers ?? []).flatMap((router) => router.interfaces.map((face) => ({ owner: router.id, ip: face.ip }))),
    ...net.actors.flatMap((actor) => (actor.kind === 'server' ? [{ owner: actor.id, ip: actor.ip }] : [])),
  ];
}

function checkAddresses(net: NetworkShape, fail: Fail): void {
  [net.cidr, ...(net.lans ?? []).map((lan) => lan.cidr)].forEach((range) => checkPrivateRange(range, fail));
  const owners = addressOwners(net);
  owners.forEach((entry, index) => {
    const first = owners.find((other) => other.ip === entry.ip);
    if (first && owners.indexOf(first) < index) fail(`${entry.owner}: ${entry.ip} is already the IP of ${first.owner}`);
  });
}

function checkVpc(net: NetworkShape, fail: Fail): void {
  const subnets = net.subnets ?? [];
  if (!net.region) fail('a VPC needs a region');
  if (net.edge !== 'internet-gateway') fail('a VPC reaches the internet through an Internet gateway');
  if (subnets.length === 0) fail('a VPC needs at least one subnet');
  if (net.lans !== undefined) fail('a VPC has no LANs');
  if (net.routers !== undefined) fail('a VPC has no routers');
  for (const subnet of subnets) {
    if (!safeInCidr(subnet.cidr.split('/')[0], net.cidr)) fail(`${subnet.id}: ${subnet.cidr} is outside the VPC`);
  }
  for (const device of net.devices) {
    const subnet = subnets.find((s) => s.id === device.subnetId);
    if (!subnet) fail(`${device.id}: subnet ${device.subnetId} does not exist`);
    else if (!safeInCidr(device.privateIp, subnet.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${subnet.cidr}`);
    const hasSecurityGroup = net.firewalls.some((f) => f.kind === 'security-group' && device.firewallIds.includes(f.id));
    if (!hasSecurityGroup) fail(`${device.id}: a device in a VPC needs at least one Security Group`);
  }
}

function checkOffice(net: NetworkShape, fail: Fail): void {
  if (net.region !== undefined) fail('an office network has no region');
  if (net.edge !== 'router') fail('an office reaches the internet through a router');
  if (net.subnets !== undefined) fail('an office network has no subnets');
  for (const firewall of net.firewalls) {
    if (firewall.kind !== 'host-firewall') fail(`${firewall.id}: an office firewall is a host firewall`);
  }
  for (const device of net.devices) {
    if (device.publicIp !== undefined) fail(`${device.id}: an office device has no public IP`);
    if (device.subnetId !== undefined) fail(`${device.id}: an office device has no subnet`);
    const lan = lanOf(net, device);
    if (!lan) fail(device.lanId === undefined ? `${device.id}: an office with several LANs needs the LAN of each device` : `${device.id}: LAN ${device.lanId} does not exist`);
    else if (!safeInCidr(device.privateIp, lan.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${lan.cidr}`);
  }
}

function checkDestinations(router: z.infer<typeof routerSchema>, fail: Fail): void {
  router.routes.forEach((route, index) => {
    if (router.routes.slice(0, index).some((earlier) => sameDestination(earlier.to, route.to))) fail(`${router.id}: two routes to ${route.to}`);
  });
}

function checkRouters(net: NetworkShape, fail: Fail): void {
  const routers = net.routers ?? [];
  const routerIds = new Set(routers.map((router) => router.id));
  const serverIds = net.actors.flatMap((actor) => (actor.kind === 'server' ? [actor.id] : []));
  const faceable = new Set([...lansOf(net).map((lan) => lan.id), ...routerIds, ...serverIds]);
  for (const router of routers) {
    for (const face of router.interfaces) {
      if (!faceable.has(face.faces)) fail(`${router.id}: ${face.ip} faces ${face.faces}, which is not a LAN, a router or a server`);
    }
    for (const route of router.routes) {
      if (!routerIds.has(route.next)) fail(`${router.id}: the route to ${route.to} goes through ${route.next}, which is not a router`);
    }
    checkDestinations(router, fail);
    for (const forward of router.forwards ?? []) {
      if (!net.devices.some((device) => device.id === forward.toDeviceId)) fail(`${router.id}: the forward of ${forward.protocol} ${forward.publicPort} goes to ${forward.toDeviceId}, which is not a device`);
    }
  }
}

type ServerShape = Extract<NetworkShape['actors'][number], { kind: 'server' }>;
type ZoneShape = NonNullable<NonNullable<ServerShape['dns']>['zones']>[number];

function checkZone(owner: string, zone: ZoneShape, fail: Fail): void {
  const apex = zone.records.filter((record) => record.type === 'SOA');
  if (apex.length !== 1) fail(`${owner}: the zone ${zone.name} has ${apex.length} SOA records and needs exactly one`);
  else if (!sameName(apex[0].name, zone.name)) fail(`${owner}: the SOA of ${zone.name} is at ${apex[0].name}, not at the top of the zone`);
  for (const record of zone.records) if (!isWithin(record.name, zone.name)) fail(`${owner}: ${record.name} is not within the zone ${zone.name}`);
  for (const name of new Set(zone.records.map((record) => normalizeName(record.name)))) {
    if (holdsAliasAndMore(zone.records, name)) fail(`${owner}: ${name} holds a CNAME and another record`);
  }
}

function checkDns(net: NetworkShape, fail: Fail): void {
  const servers = net.actors.filter((actor): actor is ServerShape => actor.kind === 'server');
  if (net.kind === 'vpc') {
    for (const server of servers) if (server.dns) fail(`${server.id}: a VPC has no DNS servers, its names are those of EC2`);
    for (const device of net.devices) if (device.dnsServer !== undefined) fail(`${device.id}: a device in a VPC has no DNS server setting`);
    for (const device of net.devices) if (device.hosts !== undefined) fail(`${device.id}: a device in a VPC has no hosts file, its names are those of EC2`);
  }
  for (const server of servers) {
    for (const { zone, serverId } of server.dns?.upstreams ?? []) {
      if (servers.find((candidate) => candidate.id === serverId)?.dns?.role !== 'authoritative') fail(`${server.id}: its server for ${zone} is ${serverId}, which is not an authoritative DNS server`);
    }
    for (const zone of server.dns?.zones ?? []) checkZone(server.id, zone, fail);
  }
}

function checkWebServices(net: NetworkShape, fail: Fail): void {
  const servers = net.actors.flatMap((actor) => (actor.kind === 'server' ? [{ id: actor.id, services: actor.services ?? [] }] : []));
  for (const { id, services } of [...net.devices.map((device) => ({ id: device.id, services: device.host.services })), ...servers]) {
    for (const service of services) if (service.web && service.protocol !== 'tcp') fail(`${id}: the web service of ${service.protocol} ${service.port} must be a TCP service`);
  }
}

function checkFirewalls(net: NetworkShape, fail: Fail): void {
  const byId = new Map(net.firewalls.map((f) => [f.id, f]));
  for (const device of net.devices) {
    const missing = device.firewallIds.filter((id) => !byId.has(id));
    for (const id of missing) fail(`${device.id}: firewall ${id} does not exist`);
    const kinds = new Set(device.firewallIds.flatMap((id) => byId.get(id)?.kind ?? []));
    if (kinds.size > 1) fail(`${device.id}: its firewalls mix kinds`);
  }
  for (const firewall of net.firewalls) {
    for (const rule of [...firewall.inbound, ...firewall.outbound]) {
      const peer = rule.peer;
      if (peer.kind !== 'sg') continue;
      if (firewall.kind !== 'security-group') fail(`${firewall.id}/${rule.id}: only a Security Group takes a Security Group as source`);
      if (byId.get(peer.sgId)?.kind !== 'security-group') fail(`${firewall.id}/${rule.id}: ${peer.sgId} is not a Security Group of this network`);
    }
  }
}

export const networkSchema = networkShape.superRefine((net, ctx) => {
  const fail: Fail = (message) => ctx.addIssue({ code: 'custom', message });
  checkIds(net, fail);
  checkAddresses(net, fail);
  if (net.kind === 'vpc') checkVpc(net, fail);
  else checkOffice(net, fail);
  checkRouters(net, fail);
  checkDns(net, fail);
  checkWebServices(net, fail);
  checkFirewalls(net, fail);
});

export const endpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('device'), id: z.string().min(1) }),
  z.object({ kind: z.literal('actor'), id: z.string().min(1) }),
]);

/** How a packet that is for a name looks the name up: `system` is what `ping` and `nc` do (the hosts file first, then the resolver) and `dig` is the question itself, a datagram to the resolver that reads no hosts file. A packet that does not say is `system`. */
export const lookupSchema = z.enum(['system', 'dig']);

export const packetSchema = z
  .object({
    from: endpointSchema,
    to: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'icmp']),
    port: port.optional(),
    sourcePort: realPort.optional(),
    icmpType: icmpTypeSchema.optional(),
    ttl: z.number().int().min(1).max(TTL_MAX).optional(),
    lookup: lookupSchema.optional(),
    message: httpMessageSchema.optional(),
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP needs icmpType; TCP and UDP need port',
  })
  .refine((p) => p.message === undefined || p.protocol === 'tcp', { message: 'a message travels in a TCP connection' })
  .refine((p) => p.lookup !== 'dig' || (p.protocol === 'udp' && p.port === DNS_PORT), {
    message: 'a dig is a UDP datagram to port 53',
  });
