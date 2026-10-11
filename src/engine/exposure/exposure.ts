import { isClientActor } from '@/engine/network/addressing/topology';
import type { Actor, Endpoint, Network, PacketSpec } from '@/engine/network/types';
import { simulate } from '@/engine/simulation/simulate';
import type { Trace } from '@/engine/simulation/trace';

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

/** Builds the fixed probe battery: from every actor that sends packets (a server of the internet only answers), from the internet and from every device, to every IP of every other device. */
export function probePackets(net: Network): PacketSpec[] {
  const sources: Endpoint[] = [
    ...net.actors.filter(isClientActor).map((a): Endpoint => ({ kind: 'actor', id: a.id })),
    { kind: 'actor', id: PROBE_INTERNET.id },
    ...net.devices.map((d): Endpoint => ({ kind: 'device', id: d.id })),
  ];
  const packets: PacketSpec[] = [];
  for (const from of sources) {
    for (const target of net.devices) {
      if (from.kind === 'device' && from.id === target.id) continue;
      const addresses = target.publicIp ? [target.privateIp, target.publicIp] : [target.privateIp];
      for (const to of addresses) for (const service of SERVICES) packets.push({ from, to, ...service });
    }
  }
  return packets;
}

/** True when the packet got to the destination's host, past its firewalls or with none, even if the host then stays silent. */
export function reachesHost(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'host');
}

function passesFirewall(trace: Trace): boolean {
  return trace.steps.some((s) => s.stage === 'firewall-in' && s.verdict === 'pass');
}

function keyFor(from: Endpoint, trace: Trace, p: Service): string {
  const detail = p.protocol === 'icmp' ? `icmp:${p.icmpType}` : `${p.protocol}:${p.port}`;
  return `${from.kind}:${from.id}@${trace.effectiveSource}>${trace.destinationId}@${trace.resolvedIp}:${detail}`;
}

export function flowKey(net: Network, packet: PacketSpec): string | null {
  const trace = simulate(withProbeActor(net), packet);
  return trace.destinationId ? keyFor(packet.from, trace, packet) : null;
}

/** Returns the probes that a firewall lets in without matching any expected flow; a device without firewalls opens nothing. */
export function extraOpenings(net: Network, expected: PacketSpec[]): PacketSpec[] {
  const probeNet = withProbeActor(net);
  const allowed = new Set(expected.map((p) => flowKey(net, p)).filter((k): k is string => k !== null));
  return probePackets(net).filter((packet) => {
    const trace = simulate(probeNet, packet);
    return passesFirewall(trace) && trace.destinationId !== null && !allowed.has(keyFor(packet.from, trace, packet));
  });
}
