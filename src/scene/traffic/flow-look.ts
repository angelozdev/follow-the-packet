import { packetMessage, type PacketMessage } from '@/copy';
import type { PacketSpec } from '@/engine';
import type { FlowKind } from '@/levels';
import type { PacketEnd, StampState } from '@/scene/entities';

export interface FlowResult {
  kind: FlowKind;
  packet: PacketSpec;
  reached: boolean;
  replied: boolean;
  lost: boolean;
}

export interface FlowLook {
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
  stamp: StampState;
}

function packetEnd(flow: FlowResult): PacketEnd {
  if (flow.replied) return 'replied';
  if (flow.lost) return 'lost';
  return flow.reached ? 'arrived' : 'blocked';
}

function stampState(flow: FlowResult, intruder: boolean): StampState {
  if (flow.lost) return 'lost';
  if (!flow.reached) return 'blocked';
  return intruder ? 'intruder' : 'arrived';
}

/** Turns a flow's computed result into the look of its packet and its stamp: the message it carries, whether it is an intruder, how its run ends and which stamp it leaves. */
export function flowLook(flow: FlowResult): FlowLook {
  const intruder = flow.kind === 'forbidden';
  return { message: packetMessage(flow.packet), intruder, end: packetEnd(flow), stamp: stampState(flow, intruder) };
}
