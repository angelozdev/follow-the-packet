import { ipInCidr, isLoopbackIpv4, isPrivateIpv4 } from '@/engine/network/cidr';
import { isConnected, lanOf } from '@/engine/network/topology';
import { CONTINUE, stop, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import type { Reason } from '@/engine/simulation/trace';
import type { Device } from '@/engine/network/types';

const INTERNET = 'internet';

function deliverToSelf(ctx: SimContext, device: Device, reason: Reason): StageResult {
  ctx.dest = device;
  ctx.path = 'self';
  ctx.effectiveSource = ctx.source.ip;
  ctx.steps.push({ stage: 'route', at: device.id, verdict: 'pass', reason });
  return CONTINUE;
}

function handToNetwork(ctx: SimContext, ip: string, viaGateway: boolean): StageResult {
  ctx.delivery = { ip, viaGateway };
  ctx.effectiveSource = ctx.source.ip;
  ctx.steps.push({ stage: 'route', at: ctx.net.kind, verdict: 'pass', reason: { code: 'route-private' } });
  return CONTINUE;
}

function stayAtSender(ctx: SimContext, device: Device, reason: Reason): StageResult {
  ctx.steps.push({ stage: 'route', at: device.id, verdict: 'drop', reason });
  return stop('no-route');
}

/** Decides how a device of an office sends the packet (RFC 1122, §3.3.1.1): a destination in its own LAN goes straight to it, one in another LAN of the office goes to its default gateway, and a device that has no cable, or has no gateway for a destination outside its LAN, sends nothing. It returns undefined for a destination outside the office, which the rest of the stage handles. */
function routeFromOffice(ctx: SimContext, device: Device): StageResult | undefined {
  const destIp = ctx.destIp!;
  if (!isConnected(device)) return stayAtSender(ctx, device, { code: 'route-not-connected', deviceId: device.id });
  if (ipInCidr(destIp, lanOf(ctx.net, device)?.cidr ?? ctx.net.cidr)) return handToNetwork(ctx, destIp, false);
  if (!device.gateway) return stayAtSender(ctx, device, { code: 'route-no-gateway', deviceId: device.id, ip: destIp });
  return ipInCidr(destIp, ctx.net.cidr) ? handToNetwork(ctx, device.gateway, true) : undefined;
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

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (source.device && isLoopbackIpv4(destIp)) {
    return deliverToSelf(ctx, source.device, { code: 'route-loopback', deviceId: source.device.id, ip: destIp });
  }

  if (source.device && destIp === source.ip) {
    return deliverToSelf(ctx, source.device, { code: 'route-self', deviceId: source.device.id });
  }

  const decided = source.device && net.kind === 'office' ? routeFromOffice(ctx, source.device) : routeInsideNetwork(ctx);
  if (decided) return decided;

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
