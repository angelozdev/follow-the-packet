import type { SimContext, Stage } from './context';
import { dnsStage } from './stages/dns';
import { linuxStage } from './stages/linux';
import { replyStage } from './stages/reply';
import { routeStage } from './stages/route';
import { sgInStage } from './stages/sg-in';
import { sgOutStage } from './stages/sg-out';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { Outcome, Trace } from './trace';


/** Orden de las etapas. Un capítulo nuevo (por ejemplo, NACL) agrega etapas aquí. */
export const PIPELINE: Stage[] = [dnsStage, routeStage, sgOutStage, sgInStage, linuxStage, replyStage];

function resolveSource(net: Network, from: Endpoint): SimContext['source'] {
  if (from.kind === 'instance') {
    const instance = net.instances.find((i) => i.id === from.id);
    if (!instance) throw new Error(`unknown instance ${from.id}`);
    return { endpoint: from, id: instance.id, ip: instance.privateIp, inside: true, instance };
  }
  const found = net.actors.find((a) => a.id === from.id);
  if (!found) throw new Error(`unknown actor ${from.id}`);
  return { endpoint: from, id: found.id, ip: found.ip, inside: false };
}

function finish(ctx: SimContext, outcome: Outcome): Trace {
  return {
    steps: ctx.steps,
    outcome,
    resolvedIp: ctx.destIp ?? null,
    destinationId: ctx.dest?.id ?? null,
    effectiveSource: ctx.effectiveSource ?? ctx.source.ip,
    tcpdump: ctx.tcpdump,
  };
}

/** Recorre las etapas en orden. Pura: misma entrada, mismo recorrido. */
export function simulate(net: Network, packet: PacketSpec): Trace {
  const ctx: SimContext = { net, packet, source: resolveSource(net, packet.from), steps: [], tcpdump: [] };
  for (const stage of PIPELINE) {
    const result = stage(ctx);
    if (result.done) return finish(ctx, result.outcome);
  }
  throw new Error('the simulation ended without an outcome');
}
