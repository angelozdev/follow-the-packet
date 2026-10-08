import { z } from 'zod';
import { ruleSchema } from '../engine/schema';
import type { Network, PacketSpec } from '../engine/types';

export const networkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), sgId: z.string().min(1), rule: ruleSchema }),
  z.object({ type: z.literal('removeRule'), sgId: z.string().min(1), ruleId: z.string().min(1) }),
  z.object({ type: z.literal('setAppTarget'), instanceId: z.string().min(1), target: z.string().min(1) }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), instanceId: z.string().min(1), value: z.boolean() }),
]);

export type NetworkAction = z.infer<typeof networkActionSchema>;

export function applyAction(net: Network, action: NetworkAction): Network {
  switch (action.type) {
    case 'addRule':
      return {
        ...net,
        securityGroups: net.securityGroups.map((g) => (g.id === action.sgId ? { ...g, inbound: [...g.inbound, action.rule] } : g)),
      };
    case 'removeRule':
      return {
        ...net,
        securityGroups: net.securityGroups.map((g) =>
          g.id === action.sgId ? { ...g, inbound: g.inbound.filter((r) => r.id !== action.ruleId) } : g,
        ),
      };
    case 'setAppTarget':
      return { ...net, instances: net.instances.map((i) => (i.id === action.instanceId ? { ...i, appTarget: action.target } : i)) };
    case 'setIgnoreIcmpEcho':
      return {
        ...net,
        instances: net.instances.map((i) =>
          i.id === action.instanceId ? { ...i, linux: { ...i.linux, ignoreIcmpEcho: action.value } } : i,
        ),
      };
  }
}

/** Reemplaza "@appTarget" por el destino configurado en la app de la instancia de origen. */
export function materialize(packet: PacketSpec, net: Network): PacketSpec {
  if (packet.to !== '@appTarget') return packet;
  const from = packet.from;
  const source = from.kind === 'instance' ? net.instances.find((i) => i.id === from.id) : undefined;
  if (!source?.appTarget) throw new Error('@appTarget necesita una instancia de origen con appTarget');
  return { ...packet, to: source.appTarget };
}
