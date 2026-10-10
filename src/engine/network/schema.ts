import { z } from 'zod';
import { ipInCidr, isIpv4, isPrivateCidr, parseCidr } from './cidr';

const ip = z.string().refine(isIpv4, 'invalid IPv4');
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
  privateIp: ip,
  publicIp: ip.optional(),
  firewallIds: z.array(z.string().min(1)),
  host: z.object({ ignoreIcmpEcho: z.boolean(), listeningTcpPorts: z.array(port) }),
  appTarget: z.string().min(1).optional(),
});

export const subnetSchema = z.object({ id: z.string().min(1), az: z.string().min(1), cidr });

export const actorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ip,
  kind: z.enum(['you', 'attacker']),
});

const networkShape = z.object({
  kind: z.enum(['office', 'vpc']),
  cidr,
  region: z.string().min(1).optional(),
  subnets: z.array(subnetSchema).optional(),
  devices: z.array(deviceSchema),
  firewalls: z.array(firewallSchema),
  edge: z.enum(['router', 'internet-gateway']),
  actors: z.array(actorSchema),
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
  ];
  const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
  if (repeated) fail(`duplicate id: ${repeated}`);
}

function checkAddresses(net: NetworkShape, fail: Fail): void {
  if (isCidr(net.cidr) && !isPrivateCidr(net.cidr)) fail(`${net.cidr} is not a private range (RFC 1918)`);
  net.devices.forEach((device, index) => {
    const first = net.devices.find((other) => other.privateIp === device.privateIp);
    if (first && net.devices.indexOf(first) < index) fail(`${device.id}: ${device.privateIp} is already the IP of ${first.id}`);
  });
}

function checkVpc(net: NetworkShape, fail: Fail): void {
  const subnets = net.subnets ?? [];
  if (!net.region) fail('a VPC needs a region');
  if (net.edge !== 'internet-gateway') fail('a VPC reaches the internet through an Internet gateway');
  if (subnets.length === 0) fail('a VPC needs at least one subnet');
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
    if (!safeInCidr(device.privateIp, net.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${net.cidr}`);
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
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP needs icmpType; TCP and UDP need port',
  });
