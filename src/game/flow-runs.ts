import { entityTerm, packetLabel, tracerouteLabel, warningOf, type TermId, type TermText, type Warning } from '@/copy';
import { TRACEROUTE_MAX_HOPS, reachesHost, simulate, stopStep, traceroute, type Network, type Outcome, type PacketSpec, type Step, type Trace, type TracerouteResult } from '@/engine';
import { packetFromChips, probeFromChips, revealsRoutersByTraceroute, type Flow, type FlowKind, type Incident, type SendMove, type SendOwner } from '@/levels';
import { PIECE_ID } from './view/piece-id';

export interface PacketRun {
  id: string;
  pieceId: string;
  packet: PacketSpec;
  trace: Trace;
  replied: boolean;
  reached: boolean;
  blocked: boolean;
  hiddenStop: boolean;
  warning: Warning | null;
  by: string[];
  intruder: boolean;
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
  route?: TracerouteResult;
}

function firewallStops(trace: Trace): Step[] {
  return trace.steps.filter((step) => (step.stage === 'firewall-in' || step.stage === 'firewall-out') && step.verdict === 'drop');
}

function hiddenByFirewall(trace: Trace, blocked: boolean): boolean {
  return firewallStops(trace).length > 0 && !blocked;
}

/** Returns the id of the router that dropped the packet without sending any warning back, or undefined when no router did. */
function silentRouterStop(trace: Trace): string | undefined {
  const step = stopStep(trace);
  return step?.stage === 'forward' && trace.notice === undefined && 'routerId' in step.reason ? step.reason.routerId : undefined;
}

/** Returns the router that dropped a packet without a warning when its sender cannot tell where it died, and undefined otherwise. That is the case in an incident whose routers wait for a traceroute (`revealsRoutersByTraceroute`), for any packet but a traceroute: a ping that gets no answer says nothing about the routers it crossed, and only a traceroute shows the ones that answer. */
export function routerOutOfSight(incident: Incident, run: PacketRun): string | undefined {
  const traced = 'route' in run && run.route !== undefined;
  return revealsRoutersByTraceroute(incident) && !traced ? silentRouterStop(run.trace) : undefined;
}

/** Returns the runs with `hiddenStop` set for every packet whose stop the player cannot place: one that a firewall the player does not know stopped, as always, and one that vanished at a router out of sight (`routerOutOfSight`), whether or not a traceroute has drawn that router since, because a ping alone never reveals where it died. The same array when nothing changes. */
export function hideStopsOutOfSight<T extends PacketRun>(incident: Incident, runs: T[]): T[] {
  const hidden = runs.map((run) => {
    const hiddenStop = hiddenByFirewall(run.trace, run.blocked) || routerOutOfSight(incident, run) !== undefined;
    return hiddenStop === run.hiddenStop ? run : { ...run, hiddenStop };
  });
  return hidden.every((run, index) => run === runs[index]) ? runs : hidden;
}

/** True when the firewall that dropped the packet at this step is a term the player knows. */
function firewallKnown(step: Step, known: ReadonlySet<TermId>): boolean {
  if (!('firewallKind' in step.reason)) return false;
  const term = entityTerm({ kind: 'firewall', variant: step.reason.firewallKind });
  return term === null || known.has(term);
}

/** Returns the warning that came back to the sender when the player knows its term, else null: an unknown term hides the warning, and the packet is seen as one that nobody answered. Only the look changes; the outcome, `by` and the trace are those of the engine. */
function visibleWarning(packet: PacketSpec, trace: Trace, known: ReadonlySet<TermId>): Warning | null {
  if (!trace.notice) return null;
  const warning = warningOf(trace.notice, packet);
  return known.has(warning.term) ? warning : null;
}

const LOCAL_ERRORS: ReadonlySet<Outcome> = new Set(['invalid-address', 'unresolved', 'no-route']);

function stoppedBy(world: Network, packet: PacketSpec, trace: Trace): string[] {
  if (LOCAL_ERRORS.has(trace.outcome)) return [packet.from.id];
  const step = stopStep(trace);
  if (!step) return trace.destinationId ? [trace.destinationId] : [];
  switch (step.stage) {
    case 'firewall-in':
    case 'firewall-out':
      return world.devices.find((device) => device.id === step.at)?.firewallIds ?? [];
    case 'route':
      return [];
    default:
      return [step.at];
  }
}

function runPacket(world: Network, known: ReadonlySet<TermId>, id: string, packet: PacketSpec, intruder: boolean): PacketRun {
  const trace = simulate(world, packet);
  const stops = firewallStops(trace);
  const blocked = stops.some((step) => firewallKnown(step, known));
  return {
    id,
    pieceId: PIECE_ID.packet(id),
    packet,
    trace,
    replied: trace.outcome === 'replied',
    reached: reachesHost(trace),
    blocked,
    hiddenStop: hiddenByFirewall(trace, blocked),
    warning: visibleWarning(packet, trace, known),
    by: stoppedBy(world, packet, trace),
    intruder,
    label: packetLabel(packet, trace, world, known),
  };
}

/** Simulates every flow on the world and returns one run per flow, in the same order; a forbidden flow's packet is an intruder. A firewall the player does not know yet (a term not in `known`) stops a packet without blocking it: the run is `hiddenStop`, not `blocked`, and it is the only thing that changes. */
export function runFlows(world: Network, flows: Flow[], known: ReadonlySet<TermId>): FlowRun[] {
  return flows.map((flow) => ({ ...runPacket(world, known, flow.id, flow.packet, flow.kind === 'forbidden'), kind: flow.kind }));
}

function sentRun(world: Network, known: ReadonlySet<TermId>, { fromId, toId, messageId }: SendMove, send: number, packet: PacketSpec, route?: TracerouteResult): SentPacket {
  const run = runPacket(world, known, `sent-${fromId}-${toId}-${messageId}`, packet, false);
  return { ...run, ...(route && { route, label: tracerouteLabel(packet, run.trace, world, known) }), fromId, toId, messageId, send };
}

/** Simulates what three send chips stand for, as the send number `send`; null when the incident, or the case of a diagnose, does not offer one of the chips. A message that is a single packet is simulated as it is. A traceroute runs its probes (`route`) and is kept as the run of the last probe it sent, the one that ended it, so its outcome and whoever answered are those of that probe; it is labelled as a traceroute, not as the ping its last probe is. Its id names the combination, so a new send of the same chips replaces the old one. */
export function sendPacket(world: Network, offers: SendOwner, move: SendMove, send: number, known: ReadonlySet<TermId>): SentPacket | null {
  const packet = packetFromChips(offers, move);
  if (packet) return sentRun(world, known, move, send, packet);
  const probe = probeFromChips(offers, move);
  if (!probe) return null;
  const route = traceroute(world, probe.from, probe.to, TRACEROUTE_MAX_HOPS);
  const last = route.lines.at(-1);
  return sentRun(world, known, move, send, last ? { ...probe, ttl: last.hop } : probe, route);
}

/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => firewallStops(run.trace).map((step) => step.at)));
}
