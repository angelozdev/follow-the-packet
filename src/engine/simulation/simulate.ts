import type { SimContext, Stage } from './context';
import { addressStage } from './stages/address';
import { dnsStage } from './stages/dns';
import { firewallInStage } from './stages/firewall-in';
import { firewallOutStage } from './stages/firewall-out';
import { forwardStage } from './stages/forward';
import { hostStage } from './stages/host';
import { replyStage } from './stages/reply';
import { routeStage } from './stages/route';
import type { Endpoint, Network, PacketSpec } from '@/engine/network/types';
import type { Outcome, Trace } from './trace';

export const PIPELINE: Stage[] = [addressStage, dnsStage, routeStage, firewallOutStage, forwardStage, firewallInStage, hostStage, replyStage];

function resolveSource(net: Network, from: Endpoint): SimContext['source'] {
  if (from.kind === 'device') {
    const device = net.devices.find((d) => d.id === from.id);
    if (!device) throw new Error(`unknown device ${from.id}`);
    return { endpoint: from, id: device.id, ip: device.privateIp, inside: true, device };
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
    ...(ctx.notice && { notice: ctx.notice }),
  };
}

/** Runs the packet through every stage and returns its trace; the same network and packet always give the same trace. */
export function simulate(net: Network, packet: PacketSpec): Trace {
  const ctx: SimContext = { net, packet, source: resolveSource(net, packet.from), steps: [], tcpdump: [] };
  for (const stage of PIPELINE) {
    const result = stage(ctx);
    if (result.done) return finish(ctx, result.outcome);
  }
  throw new Error('the simulation ended without an outcome');
}
