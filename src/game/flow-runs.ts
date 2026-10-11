import { entityTerm, packetLabel, tracerouteLabel, warningOf, type TermId, type TermText, type Warning } from '@/copy';
import { TRACEROUTE_MAX_HOPS, reachesHost, simulate, simulateSequence, stopStep, traceroute, type Network, type Outcome, type PacketSpec, type Step, type Trace, type TracerouteResult } from '@/engine';
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
  at: number;
  route?: TracerouteResult;
}

/** One send of the player as it happened: the chips it names, the number of the send and the second of the game clock it left at. A list of them, in order, is all it takes to simulate the sends again. */
export interface Dispatch {
  move: SendMove;
  send: number;
  at: number;
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

function runOf(world: Network, known: ReadonlySet<TermId>, id: string, packet: PacketSpec, intruder: boolean, trace: Trace): PacketRun {
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
  return flows.map((flow) => ({ ...runOf(world, known, flow.id, flow.packet, flow.kind === 'forbidden', simulate(world, flow.packet)), kind: flow.kind }));
}

type Plan = { dispatch: Dispatch; packet: PacketSpec } | { dispatch: Dispatch; probe: PacketSpec };

function sentRun(world: Network, known: ReadonlySet<TermId>, { move: { fromId, toId, messageId }, send, at }: Dispatch, packet: PacketSpec, trace: Trace, route?: TracerouteResult): SentPacket {
  const run = runOf(world, known, `sent-${fromId}-${toId}-${messageId}`, packet, false, trace);
  return { ...run, ...(route && { route, label: tracerouteLabel(packet, trace, world, known) }), fromId, toId, messageId, send, at };
}

/** True when the incident, or the case of a diagnose, offers the three chips of a send. */
export function offersSend(offers: SendOwner, move: SendMove): boolean {
  return packetFromChips(offers, move) !== null || probeFromChips(offers, move) !== null;
}

function planOf(offers: SendOwner, dispatch: Dispatch): Plan[] {
  const packet = packetFromChips(offers, dispatch.move);
  if (packet) return [{ dispatch, packet }];
  const probe = probeFromChips(offers, dispatch.move);
  return probe ? [{ dispatch, probe }] : [];
}

/** Simulates the sends of the player in the order they were made, each as the send number and the second of the game clock it carries, and returns one run per send the incident, or the case of a diagnose, offers (a send of chips it does not offer is left out). The single packets go through `simulateSequence`, so what one send leaves behind (the source port of its device, the rows of the translation table, what the resolver remembered) reaches the next one, and each is measured against its own second. A traceroute runs its probes (`route`) and is kept as the run of the last probe it sent, the one that ended it, so its outcome and whoever answered are those of that probe; it is labelled as a traceroute, not as the ping its last probe is. A traceroute sends no TCP or UDP packet and asks no resolver, so it neither uses a port nor leaves a row in the sequence. Every run has an id that names its combination, so a later send of the same chips has the same id as an earlier one. */
export function sendSequence(world: Network, offers: SendOwner, dispatches: readonly Dispatch[], known: ReadonlySet<TermId>): SentPacket[] {
  const plans = dispatches.flatMap((dispatch) => planOf(offers, dispatch));
  const single = plans.flatMap((plan) => ('packet' in plan ? [{ plan, send: { packet: plan.packet, at: plan.dispatch.at } }] : []));
  const traces = new Map(simulateSequence(world, single.map(({ send }) => send)).map((trace, index) => [single[index].plan, trace]));
  return plans.map((plan) => {
    if ('packet' in plan) return sentRun(world, known, plan.dispatch, plan.packet, traces.get(plan)!);
    const route = traceroute(world, plan.probe.from, plan.probe.to, TRACEROUTE_MAX_HOPS);
    const last = route.lines.at(-1);
    const packet = last ? { ...plan.probe, ttl: last.hop } : plan.probe;
    return sentRun(world, known, plan.dispatch, packet, simulate(world, packet), route);
  });
}

/** Simulates what three send chips stand for, as the send number `send`, on its own and at the start of the game clock; null when the incident, or the case of a diagnose, does not offer one of the chips. It knows nothing of the sends before it (`sendSequence` does). */
export function sendPacket(world: Network, offers: SendOwner, move: SendMove, send: number, known: ReadonlySet<TermId>): SentPacket | null {
  return sendSequence(world, offers, [{ move, send, at: 0 }], known).at(0) ?? null;
}

/** Returns the last run of each combination of chips, in the order of the first send of each: a later send of the same chips replaces the earlier one and takes its place in the run, not in the list. */
export function lastOfEach(runs: readonly SentPacket[]): SentPacket[] {
  return [...new Map(runs.map((run) => [run.id, run])).values()];
}

/** Returns the send a run stands for, to simulate it again. */
export function dispatchOf({ fromId, toId, messageId, send, at }: SentPacket): Dispatch {
  return { move: { type: 'sendPacket', fromId, toId, messageId }, send, at };
}

/** Returns the devices that a forbidden flow reaches. */
export function intrudedDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => (run.kind === 'forbidden' && run.reached && run.trace.destinationId ? [run.trace.destinationId] : [])));
}

/** Returns the devices whose firewalls stop a flow, on the way out or on the way in. */
export function blockingDeviceIds(runs: FlowRun[]): ReadonlySet<string> {
  return new Set(runs.flatMap((run) => firewallStops(run.trace).map((step) => step.at)));
}
