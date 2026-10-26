import { ipInCidr, isLoopbackIpv4, isPrivateIpv4 } from '@/engine/network/addressing/cidr';
import { ownsIp } from '@/engine/network/addressing/routing';
import { chooseRoute, type RouteDecision } from '@/engine/network/addressing/routing-table';
import { isClientActor, isConnected } from '@/engine/network/addressing/topology';
import { CONTINUE, recordRoute, stop, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import { answerFromServer } from '@/engine/simulation/paths/routers';
import type { Reason } from '@/engine/simulation/trace';
import type { Device, ServerActor } from '@/engine/network/types';

const INTERNET = 'internet';

function deliverToSelf(ctx: SimContext, device: Device, reason: Reason): StageResult {
  ctx.dest = device;
  ctx.path = 'self';
  ctx.effectiveSource = ctx.source.ip;
  ctx.steps.push({ stage: 'route', at: device.id, verdict: 'pass', reason });
  return CONTINUE;
}

function handToNetwork(ctx: SimContext, decision: RouteDecision, ip: string, reason: Reason = { code: 'route-private' }): StageResult {
  recordRoute(ctx, decision);
  ctx.delivery = { ip, viaGateway: decision.route.via !== undefined };
  ctx.effectiveSource = ctx.source.ip;
  ctx.steps.push({ stage: 'route', at: ctx.net.kind, verdict: 'pass', reason });
  return CONTINUE;
}

function stayAtSender(ctx: SimContext, device: Device, reason: Reason): StageResult {
  ctx.steps.push({ stage: 'route', at: device.id, verdict: 'drop', reason });
  return stop('no-route');
}

/** Decides how a device of an office sends the packet with its routing table (RFC 1122, §3.3.1.1): the most specific row that covers the destination carries it. The connected route of its LAN delivers straight to the destination, and the default route hands it to the gateway, which is where a destination in another LAN of the office goes. A device that has no cable, or has no gateway for a destination outside its LAN, sends nothing. A destination outside the office goes to the gateway too when the office has routers to carry it, and otherwise it returns undefined, which the rest of the stage handles. The decision is recorded only when the packet is handed to the network. */
function routeFromOffice(ctx: SimContext, device: Device): StageResult | undefined {
  const destIp = ctx.destIp!;
  if (!isConnected(device)) return stayAtSender(ctx, device, { code: 'route-not-connected', deviceId: device.id });
  const decision = chooseRoute(ctx.net, device, destIp);
  if (!decision) return stayAtSender(ctx, device, { code: 'route-no-gateway', deviceId: device.id, ip: destIp });
  const { via } = decision.route;
  if (via === undefined) return handToNetwork(ctx, decision, destIp);
  if (ipInCidr(destIp, ctx.net.cidr)) return handToNetwork(ctx, decision, via);
  return (ctx.net.routers ?? []).length > 0 ? handToNetwork(ctx, decision, via, { code: 'route-leaves-office', ip: destIp }) : undefined;
}

function routeInsideNetwork(ctx: SimContext): StageResult | undefined {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (!source.inside && isPrivateIpv4(destIp)) {
    ctx.steps.push({ stage: 'route', at: INTERNET, verdict: 'drop', reason: { code: 'route-private-from-outside', ip: destIp } });
    return stop('lost');
  }

  if (!ipInCidr(destIp, net.cidr)) return undefined;
  const dest = net.devices.find((d) => d.privateIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: net.kind, verdict: 'drop', reason: { code: 'route-no-device', ip: destIp } });
    return stop('lost');
  }
  ctx.dest = dest;
  ctx.path = 'private';
  ctx.effectiveSource = source.ip;
  ctx.steps.push({ stage: 'route', at: net.kind, verdict: 'pass', reason: { code: 'route-private' } });
  return CONTINUE;
}

/** True when a client actor of the internet sends the packet to an office that has routers: the packet comes in by the router that owns the public IP it is for, and the road from the actor to that router is not modelled. */
function arrivesFromTheInternet(ctx: SimContext): boolean {
  const { net, source } = ctx;
  return !source.device && net.kind === 'office' && (net.routers ?? []).length > 0 && net.actors.some((actor) => actor.id === source.id && isClientActor(actor));
}

/** Takes a packet from the internet to the router of the office that owns the public IP, which `forward` then enters (`ctx.entry`). No router owns the IP: the packet is for nobody in this network and is lost. A private IP from outside never gets here: `routeInsideNetwork` already lost it. */
function enterOffice(ctx: SimContext): StageResult {
  const destIp = ctx.destIp!;
  const router = (ctx.net.routers ?? []).find((candidate) => ownsIp(candidate, destIp));
  if (!router) {
    ctx.steps.push({ stage: 'route', at: ctx.net.kind, verdict: 'drop', reason: { code: 'route-no-device', ip: destIp } });
    return stop('lost');
  }
  ctx.entry = router;
  ctx.effectiveSource = ctx.source.ip;
  return CONTINUE;
}

function sendsFromAServer({ net, source }: SimContext): boolean {
  return !source.device && net.actors.some((actor) => actor.id === source.id && !isClientActor(actor));
}

function deliverToAnotherServer(ctx: SimContext): StageResult | undefined {
  const other = ctx.net.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id !== ctx.source.id && actor.ip === ctx.destIp);
  if (!other || !sendsFromAServer(ctx)) return undefined;
  ctx.effectiveSource = ctx.source.ip;
  return answerFromServer(ctx, other);
}

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (source.device && isLoopbackIpv4(destIp)) {
    return deliverToSelf(ctx, source.device, { code: 'route-loopback', deviceId: source.device.id, ip: destIp });
  }

  if (source.device && destIp === source.ip) {
    return deliverToSelf(ctx, source.device, { code: 'route-self', deviceId: source.device.id });
  }

  const betweenServers = deliverToAnotherServer(ctx);
  if (betweenServers) return betweenServers;

  const decided = source.device && net.kind === 'office' ? routeFromOffice(ctx, source.device) : routeInsideNetwork(ctx);
  if (decided) return decided;
  if (arrivesFromTheInternet(ctx)) return enterOffice(ctx);

  const dest = net.devices.find((d) => d.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'drop', reason: { code: 'route-no-public-device', ip: destIp } });
    return stop('timeout');
  }
  if (source.device) {
    const publicIp = source.device.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'drop', reason: { code: 'route-no-public-ip', deviceId: source.device.id } });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: net.edge, verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: net.edge, verdict: 'pass', reason: { code: 'route-from-internet' } });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
