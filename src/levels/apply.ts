import type { Network, PacketSpec } from '../engine/types';
import type { LevelAction } from './schema';

export function applyAction(net: Network, action: LevelAction): Network {
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
