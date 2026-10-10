import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import { packetFromChips, type Flow, type FlowKind, type SendIncident, type SendMove } from '@/levels';
import { PIECE_ID } from './view/piece-id';

export interface PacketRun {
  id: string;
  pieceId: string;
  packet: PacketSpec;
  trace: Trace;
  replied: boolean;
  reached: boolean;
  lost: boolean;
  label: TermText;
}

export interface FlowRun extends PacketRun {
  kind: FlowKind;
}

export interface SentPacket extends PacketRun {
  fromId: string;
  toId: string;
  messageId: string;
  send: number;
}

function runPacket(world: Network, id: string, packet: PacketSpec): PacketRun {
  const trace = simulate(world, packet);
  return {
    id,
    pieceId: PIECE_ID.packet(id),
    packet,
    trace,
    replied: trace.outcome === 'replied',
    reached: reachesHost(trace),
    lost: trace.outcome === 'lost',
    label: packetLabel(packet, trace, world),
  };
}

/** Simulates every flow on the world and returns one run per flow, in the same order. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => ({ ...runPacket(world, flow.id, flow.packet), kind: flow.kind }));
}

/** Simulates the packet three send chips stand for, as the send number `send`; null when the incident does not offer one of the chips. Its id names the combination, so a new send of the same chips replaces the old one. */
export function sendPacket(world: Network, incident: SendIncident, { fromId, toId, messageId }: SendMove, send: number): SentPacket | null {
  const packet = packetFromChips(incident, { fromId, toId, messageId });
  return packet && { ...runPacket(world, `sent-${fromId}-${toId}-${messageId}`, packet), fromId, toId, messageId, send };
}

/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => run.trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop').map((step) => step.at)));
}
