import { z } from 'zod';
import { ruleSchema } from './schema';
import type { Network } from './types';

export const networkActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('addRule'), firewallId: z.string().min(1), rule: ruleSchema }),
  z.object({ type: z.literal('removeRule'), firewallId: z.string().min(1), ruleId: z.string().min(1) }),
  z.object({ type: z.literal('setAppTarget'), deviceId: z.string().min(1), target: z.string().min(1) }),
  z.object({ type: z.literal('setIgnoreIcmpEcho'), deviceId: z.string().min(1), value: z.boolean() }),
]);

export type NetworkAction = z.infer<typeof networkActionSchema>;

export function applyAction(net: Network, action: NetworkAction): Network {
  switch (action.type) {
    case 'addRule':
      return {
        ...net,
        firewalls: net.firewalls.map((f) => (f.id === action.firewallId ? { ...f, inbound: [...f.inbound, action.rule] } : f)),
      };
    case 'removeRule':
      return {
        ...net,
        firewalls: net.firewalls.map((f) =>
          f.id === action.firewallId ? { ...f, inbound: f.inbound.filter((r) => r.id !== action.ruleId) } : f,
        ),
      };
    case 'setAppTarget':
      return { ...net, devices: net.devices.map((d) => (d.id === action.deviceId ? { ...d, appTarget: action.target } : d)) };
    case 'setIgnoreIcmpEcho':
      return {
        ...net,
        devices: net.devices.map((d) => (d.id === action.deviceId ? { ...d, host: { ...d.host, ignoreIcmpEcho: action.value } } : d)),
      };
  }
}
