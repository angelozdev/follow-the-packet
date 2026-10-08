import type { Actor, Endpoint, Network, PacketSpec } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import type { Trace } from '@/engine/simulation/trace';

/** Una IP cualquiera de internet que no está en la red del nivel. */
export const PROBE_INTERNET: Actor = { id: 'probe-internet', name: 'Internet', ip: '203.0.113.200', kind: 'attacker' };

type Service = Pick<PacketSpec, 'protocol' | 'port' | 'icmpType'>;
const SERVICES: Service[] = [
  { protocol: 'icmp', icmpType: 8 },
  { protocol: 'icmp', icmpType: 0 },
  { protocol: 'tcp', port: 22 },
  { protocol: 'tcp', port: 80 },
  { protocol: 'tcp', port: 443 },
  { protocol: 'tcp', port: 3306 },
  { protocol: 'tcp', port: 5432 },
  { protocol: 'udp', port: 53 },
];

export function withProbeActor(net: Network): Network {
  return { ...net, actors: [...net.actors, PROBE_INTERNET] };
}

/** Batería fija: desde cada actor, desde internet y desde cada instancia, a cada IP de cada otra instancia. */
export function probePackets(net: Network): PacketSpec[] {
  const sources: Endpoint[] = [
    ...net.actors.map((a): Endpoint => ({ kind: 'actor', id: a.id })),
    { kind: 'actor', id: PROBE_INTERNET.id },
    ...net.instances.map((i): Endpoint => ({ kind: 'instance', id: i.id })),
  ];
  const packets: PacketSpec[] = [];
  for (const from of sources) {
    for (const target of net.instances) {
      if (from.kind === 'instance' && from.id === target.id) continue;
      const addresses = target.publicIp ? [target.privateIp, target.publicIp] : [target.privateIp];
      for (const to of addresses) for (const service of SERVICES) packets.push({ from, to, ...service });
    }
  }
  return packets;
}

/** "Llega al host" = pasó el SG de entrada, aunque Linux luego no conteste. */
export function reachesHost(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'sg-in' && s.verdict === 'pass');
}

function keyFor(from: Endpoint, trace: Trace, p: Service): string {
  const detail = p.protocol === 'icmp' ? `icmp:${p.icmpType}` : `${p.protocol}:${p.port}`;
  return `${from.kind}:${from.id}@${trace.effectiveSource}>${trace.destinationId}@${trace.resolvedIp}:${detail}`;
}

export function flowKey(net: Network, packet: PacketSpec): string | null {
  const trace = simulate(withProbeActor(net), packet);
  return trace.destinationId ? keyFor(packet.from, trace, packet) : null;
}

/** Sondas que llegan a un host y no corresponden a ningún flujo esperado. */
export function extraOpenings(net: Network, expected: PacketSpec[]): PacketSpec[] {
  const probeNet = withProbeActor(net);
  const allowed = new Set(expected.map((p) => flowKey(net, p)).filter((k): k is string => k !== null));
  return probePackets(net).filter((packet) => {
    const trace = simulate(probeNet, packet);
    return reachesHost(trace) && trace.destinationId !== null && !allowed.has(keyFor(packet.from, trace, packet));
  });
}
