import { z } from 'zod';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

const ip = z.string().refine(isIpv4, 'IPv4 inválida');
const cidr = z.string().refine((value) => {
  try {
    parseCidr(value);
    return true;
  } catch {
    return false;
  }
}, 'CIDR inválido');
const port = z.number().int().min(0).max(65535);

/** 0 = Echo Reply, 8 = Echo Request. Los únicos tipos ICMP del juego en v1. */
export const icmpTypeSchema = z.union([z.literal(0), z.literal(8)]);

export const ruleWhatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('all') }),
  z.object({ kind: z.literal('tcp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('udp'), fromPort: port, toPort: port }),
  z.object({ kind: z.literal('icmp'), icmpType: z.union([icmpTypeSchema, z.literal('all')]) }),
]);

/** En una regla de entrada, el peer es el origen; en una de salida, el destino. */
export const rulePeerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('cidr'), cidr }),
  z.object({ kind: z.literal('sg'), sgId: z.string().min(1) }),
]);

export const ruleSchema = z.object({ id: z.string().min(1), what: ruleWhatSchema, peer: rulePeerSchema });

export const securityGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  inbound: z.array(ruleSchema),
  outbound: z.array(ruleSchema),
});

export const instanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subnetId: z.string().min(1),
  privateIp: ip,
  publicIp: ip.optional(),
  sgIds: z.array(z.string().min(1)),
  linux: z.object({ ignoreIcmpEcho: z.boolean(), listeningTcpPorts: z.array(port) }),
  /** Adónde apunta la app de esta instancia: IP o nombre DNS. */
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
    vpcCidr: cidr,
    subnets: z.array(subnetSchema).min(1),
    instances: z.array(instanceSchema),
    securityGroups: z.array(securityGroupSchema),
    actors: z.array(actorSchema),
  })
  .superRefine((net, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: 'custom', message });
    const ids = [
      ...net.subnets.map((s) => s.id),
      ...net.instances.map((i) => i.id),
      ...net.securityGroups.map((g) => g.id),
      ...net.actors.map((a) => a.id),
    ];
    const repeated = ids.find((id, index) => ids.indexOf(id) !== index);
    if (repeated) fail(`id repetido: ${repeated}`);
    for (const subnet of net.subnets) {
      if (!safeInCidr(subnet.cidr.split('/')[0], net.vpcCidr)) fail(`${subnet.id}: ${subnet.cidr} no está dentro de la VPC`);
    }
    for (const instance of net.instances) {
      const subnet = net.subnets.find((s) => s.id === instance.subnetId);
      if (!subnet) fail(`${instance.id}: la subred ${instance.subnetId} no existe`);
      else if (!safeInCidr(instance.privateIp, subnet.cidr)) fail(`${instance.id}: ${instance.privateIp} no está en ${subnet.cidr}`);
      for (const sgId of instance.sgIds) {
        if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${instance.id}: el SG ${sgId} no existe`);
      }
    }
    for (const group of net.securityGroups) {
      for (const rule of [...group.inbound, ...group.outbound]) {
        const peer = rule.peer;
        if (peer.kind === 'sg') {
          const sgId = peer.sgId;
          if (!net.securityGroups.some((g) => g.id === sgId)) fail(`${group.id}/${rule.id}: el SG ${sgId} no existe`);
        }
      }
    }
  });

export const endpointSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('instance'), id: z.string().min(1) }),
  z.object({ kind: z.literal('actor'), id: z.string().min(1) }),
]);

export const packetSchema = z
  .object({
    from: endpointSchema,
    /** IP, nombre DNS o "@appTarget" (lo que tenga configurado la app de la instancia de origen). */
    to: z.string().min(1),
    protocol: z.enum(['tcp', 'udp', 'icmp']),
    port: port.optional(),
    icmpType: icmpTypeSchema.optional(),
  })
  .refine((p) => (p.protocol === 'icmp' ? p.icmpType !== undefined : p.port !== undefined), {
    message: 'ICMP necesita icmpType; TCP y UDP necesitan port',
  });

export const checkpointSchema = z.object({
  stage: z.enum(['dns', 'route', 'sg-out', 'sg-in', 'linux', 'reply']),
  at: z.string().min(1),
});
