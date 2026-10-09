import { z } from 'zod';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

const ip = z.string().refine(isIpv4, 'invalid IPv4');
const cidr = z.string().refine((value) => {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}, 'invalid CIDR');
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
  inbound: z.array(ruleSchema),
  outbound: z.array(ruleSchema),
});

export const deviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subnetId: z.string().min(1),
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

function safeInCidr(value: string, range: string): boolean {
  try {
    return ipInCidr(value, range);
  } catch {
    return false;
  }
}

export const networkSchema = z
  .object({
    region: z.string().min(1),
    cidr,
    subnets: z.array(subnetSchema).min(1),
    devices: z.array(deviceSchema),
    firewalls: z.array(firewallSchema),
    actors: z.array(actorSchema),
  })
  .superRefine((net, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = [
      ...net.subnets.map((s) => s.id),
      ...net.devices.map((d) => d.id),
      ...net.firewalls.map((f) => f.id),
      ...net.actors.map((a) => a.id),
    ];
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated) fail(`duplicate id: ${repeated}`);
    for (const subnet of net.subnets) {
      if (!safeInCidr(subnet.cidr.split('/')[0], net.cidr)) fail(`${subnet.id}: ${subnet.cidr} is outside the VPC`);
    }
    for (const device of net.devices) {
      const subnet = net.subnets.find((s) => s.id === device.subnetId);
      if (!subnet) fail(`${device.id}: subnet ${device.subnetId} does not exist`);
      else if (!safeInCidr(device.privateIp, subnet.cidr)) fail(`${device.id}: ${device.privateIp} is not in ${subnet.cidr}`);
      for (const firewallId of device.firewallIds) {
        if (!net.firewalls.some((f) => f.id === firewallId)) fail(`${device.id}: firewall ${firewallId} does not exist`);
      }
    }
    for (const firewall of net.firewalls) {
      for (const rule of [...firewall.inbound, ...firewall.outbound]) {
        const peer = rule.peer;
        if (peer.kind === 'sg') {
          const sgId = peer.sgId;
          if (!net.firewalls.some((f) => f.id === sgId)) fail(`${firewall.id}/${rule.id}: security group ${sgId} does not exist`);
        }
      }
    }
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
