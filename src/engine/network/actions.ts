import { z } from 'zod';
import { ruleSchema } from './schema';
import type { Network } from './types';

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
