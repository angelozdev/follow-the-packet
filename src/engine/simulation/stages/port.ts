import { DEFAULT_SOURCE_PORT } from '@/engine/network/schema';
import type { PacketSpec } from '@/engine/network/types';
import { CONTINUE, type SourcePorts, type Stage } from '@/engine/simulation/context';

/** Takes the counters of the senders and a packet; returns the packet to send and the counters after it. A TCP or UDP packet that has no source port gets the next one of its sender, and that sender moves on by one. A packet that brings its own port keeps it and leaves the counters as they were, like a port a program binds by hand; an ICMP message has no ports. */
export function withSourcePort(counters: SourcePorts, packet: PacketSpec): { packet: PacketSpec; counters: SourcePorts } {
  if (packet.protocol === 'icmp' || packet.sourcePort !== undefined) return { packet, counters };
  const sender = packet.from.id;
  const sourcePort = counters[sender] ?? DEFAULT_SOURCE_PORT;
  return { packet: { ...packet, sourcePort }, counters: { ...counters, [sender]: sourcePort + 1 } };
}

/** Gives the packet its source port once its destination is an IP, which is when a program opens a socket: a send that ends before this stage (an address that is not valid, a name nobody resolved) takes no port. The question of a lookup by name has already taken its own, so the packet gets the next one. */
export const portStage: Stage = (ctx) => {
  const given = withSourcePort(ctx.nextSourcePort, ctx.packet);
  ctx.packet = given.packet;
  ctx.nextSourcePort = given.counters;
  return CONTINUE;
};
