import { packetMessage, type PacketMessage, type StampState } from '@/copy';
import type { PacketSpec } from '@/engine';
import type { PacketEnd } from '@/scene/entities';

export interface FlowResult {
  packet: PacketSpec;
  intruder: boolean;
  reached: boolean;
  replied: boolean;
  blocked: boolean;
}

export interface FlowLook {
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
  stamp: StampState;
}

function packetEnd(flow: FlowResult): PacketEnd {
  if (flow.replied) return 'replied';
  if (flow.reached) return 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

function stampState(flow: FlowResult): StampState {
  if (flow.reached) return flow.intruder ? 'intruder' : 'arrived';
  return flow.blocked ? 'blocked' : 'lost';
}

/** Turns a packet's computed result into its look and its stamp: the message it carries, whether it is an intruder, how its run ends and which stamp it leaves. Only a firewall blocks: a packet that reaches no device and that no firewall stopped is lost. */
export function flowLook(flow: FlowResult): FlowLook {
  return { message: packetMessage(flow.packet), intruder: flow.intruder, end: packetEnd(flow), stamp: stampState(flow) };
}
