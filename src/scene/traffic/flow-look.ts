import { packetShape, type PacketShape, type StampState, type Warning } from '@/copy';
import type { PacketSpec } from '@/engine';
import type { PacketEnd } from '@/scene/entities';

export interface FlowResult {
  packet: PacketSpec;
  intruder: boolean;
  reached: boolean;
  replied: boolean;
  blocked: boolean;
  warning: Warning | null;
}

export interface FlowLook {
  message: PacketShape;
  intruder: boolean;
  end: PacketEnd;
  stamp: StampState;
}

function warnedEnd(warning: Warning): PacketEnd {
  return warning.by === 'sender' ? 'self-warned' : 'warned';
}

function packetEnd(flow: FlowResult): PacketEnd {
  if (flow.replied) return 'replied';
  if (flow.warning) return warnedEnd(flow.warning);
  if (flow.reached) return 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

function stampState(flow: FlowResult): StampState {
  if (flow.warning) return 'warned';
  if (flow.reached) return flow.intruder ? 'intruder' : 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

/** Turns a packet's computed result into its look and its stamp: the message it carries, whether it is an intruder, how its run ends and which stamp it leaves. A packet that ends in a warning the player knows looks like that warning, which comes back from whoever sent it (a router, or the host a datagram reached) or appears at the sender (its own device), and leaves the stamp of a warning: a datagram that reached its host and got a Port Unreachable is not an arrival, since no program received it. Only a firewall the player knows blocks: a packet that reaches no device and that no known firewall stopped, and that no warning answered, is lost. */
export function flowLook(flow: FlowResult): FlowLook {
  return { message: packetShape(flow.packet), intruder: flow.intruder, end: packetEnd(flow), stamp: stampState(flow) };
}
