import { ipInCidr, isLoopbackIpv4, isPrivateIpv4 } from '@/engine/network/cidr';
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

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (source.device && isLoopbackIpv4(destIp)) {
    return deliverToSelf(ctx, source.device, { code: 'route-loopback', deviceId: source.device.id, ip: destIp });
  }

  if (source.device && destIp === source.ip) {
    return deliverToSelf(ctx, source.device, { code: 'route-self', deviceId: source.device.id });
  }

  if (!source.inside && isPrivateIpv4(destIp)) {
    ctx.steps.push({ stage: 'route', at: INTERNET, verdict: 'drop', reason: { code: 'route-private-from-outside', ip: destIp } });
    return stop('lost');
  }

  if (ipInCidr(destIp, net.cidr)) {
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
