import { z } from 'zod';
import { ipInCidr, isIpv4, isPrivateCidr, parseCidr } from './cidr';
import { lanOf, lansOf } from './topology';

export const ROUTE_DEFAULT = 'default';
export const TTL_MAX = 255;
/** The TTL a packet leaves with when nobody sets one: 64, which IANA recommends and Linux uses. */
export const DEFAULT_TTL = 64;

export const ipSchema = z.string().refine(isIpv4, 'invalid IPv4');
function isCidr(value: string): boolean {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}

const cidr = z.string().refine(isCidr, 'invalid CIDR');
const port = z.number().int().min(0).max(65535);
const nonEmpty = z.string().min(1);
const latencyMs = z.number().nonnegative();

export const directionSchema = z.enum(['inbound', 'outbound']);

export const icmpTypeSchema = z.union([z.literal(0), z.literal(8)]);

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

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['laptop', 'printer', 'ec2-instance']),
  subnetId: z.string().min(1).optional(),
  privateIp: ipSchema,
  publicIp: ipSchema.optional(),
  firewallIds: z.array(z.string().min(1)),
  host: z.object({ ignoreIcmpEcho: z.boolean(), listeningTcpPorts: z.array(port) }),
  appTarget: z.string().min(1).optional(),
  lanId: nonEmpty.optional(),
  gateway: ipSchema.optional(),
  connected: z.boolean().optional(),
});

export const subnetSchema = z.object({ id: z.string().min(1), az: z.string().min(1), cidr });

export const lanSchema = z.object({ id: nonEmpty, name: nonEmpty, cidr, latencyMs });

export const routerInterfaceSchema = z.object({ ip: ipSchema, faces: nonEmpty });

export const routeSchema = z.object({ to: z.union([z.literal(ROUTE_DEFAULT), cidr]), next: nonEmpty });

export const routerSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  interfaces: z.array(routerInterfaceSchema),
  routes: z.array(routeSchema),
  latencyMs,
  sendsUnreachable: z.boolean(),
});

const actorShape = { id: nonEmpty, name: nonEmpty, ip: ipSchema };

export const actorSchema = z.discriminatedUnion('kind', [
  z.object({ ...actorShape, kind: z.enum(['you', 'attacker', 'home']) }),
  z.object({ ...actorShape, kind: z.literal('server'), latencyMs }),
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
  checkFirewalls(net, fail);
});

export const endpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('device'), id: z.string().min(1) }),
  z.object({ kind: z.literal('actor'), id: z.string().min(1) }),
]);

export const packetSchema = z
  .object({
    from: endpointSchema,
    to: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'icmp']),
    port: port.optional(),
    icmpType: icmpTypeSchema.optional(),
    ttl: z.number().int().min(1).max(TTL_MAX).optional(),
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP needs icmpType; TCP and UDP need port',
  });
