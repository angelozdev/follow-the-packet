import { packetLabel, type TermText } from '@/copy';
import { reachesHost, simulate, type Network, type PacketSpec, type Trace } from '@/engine';
import type { Flow, FlowKind } from '@/levels';
import { PIECE_ID } from './view/piece-id';

export interface FlowRun {
  id: string;
  pieceId: string;
  kind: FlowKind;
  packet: PacketSpec;
  trace: Trace;
  replied: boolean;
  reached: boolean;
  lost: boolean;
  label: TermText;
}

/** Simulates every flow on the world and returns one run per flow, in the same order. */
export function runFlows(world: Network, flows: Flow[]): FlowRun[] {
  return flows.map((flow) => {
    const trace = simulate(world, flow.packet);
    return {
      id: flow.id,
      pieceId: PIECE_ID.packet(flow.id),
      kind: flow.kind,
      packet: flow.packet,
      trace,
      replied: trace.outcome === 'replied',
      reached: reachesHost(trace),
      lost: trace.outcome === 'lost',
      label: packetLabel(flow.packet, trace, world),
    };
  });
}

/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => run.trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop').map((step) => step.at)));
}
