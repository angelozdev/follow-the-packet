import { extraOpenings, reachesHost } from '../engine/exposure';
import { simulate } from '../engine/simulate';
import type { Network, PacketSpec, Trace } from '../engine/types';
import { applyAction, materialize } from './apply';
import type { Level } from './schema';

export interface FlowResult {
  packet: PacketSpec;
  trace: Trace;
  ok: boolean;
}

export interface DefenderEvaluation {
  kind: 'defender';
  objective: boolean;
  tight: boolean;
  mustPass: FlowResult[];
  mustBlock: FlowResult[];
  extra: PacketSpec[];
}

export interface AttackerEvaluation {
  kind: 'attacker';
  objective: boolean;
  trace: Trace;
}

export function evaluateDefender(level: Level, net: Network): DefenderEvaluation {
  const objective = level.objective;
  if (objective.kind !== 'defender') throw new Error(`El nivel ${level.id} no es de defensor`);
  const run = (p: PacketSpec) => {
    const packet = materialize(p, net);
    return { packet, trace: simulate(net, packet) };
  };
  const mustPass = objective.mustPass.map(run).map((r) => ({ ...r, ok: r.trace.outcome === 'replied' }));
  const mustBlock = objective.mustBlock.map(run).map((r) => ({ ...r, ok: !reachesHost(r.trace) }));
  const expected = [...objective.mustPass, ...objective.allowed].map((p) => materialize(p, net));
  const extra = extraOpenings(net, expected);
  return {
    kind: 'defender',
    objective: mustPass.every((r) => r.ok) && mustBlock.every((r) => r.ok),
    tight: extra.length === 0,
    mustPass,
    mustBlock,
    extra,
  };
}

export function evaluateAttack(level: Level, net: Network, packet: PacketSpec): AttackerEvaluation {
  const objective = level.objective;
  if (objective.kind !== 'attacker') throw new Error(`El nivel ${level.id} no es de atacante`);
  const trace = simulate(net, packet);
  const target = objective.target;
  const sameService =
    packet.protocol === target.protocol && (target.protocol === 'icmp' ? packet.icmpType === target.icmpType : packet.port === target.port);
  return { kind: 'attacker', objective: trace.outcome === 'replied' && trace.destinationId === target.instanceId && sameService, trace };
}

export function applySolution(level: Level): Network {
  if (level.solution.kind !== 'defender') return level.network;
  return level.solution.actions.reduce(applyAction, level.network);
}
