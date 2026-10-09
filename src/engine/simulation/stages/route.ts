import { ipInCidr, isPrivateIpv4 } from '@/engine/network/cidr';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

const INTERNET = 'internet';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (source.device && destIp === source.ip) {
    ctx.dest = source.device;
    ctx.path = 'self';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: source.device.id, verdict: 'pass', reason: { code: 'route-self', deviceId: source.device.id } });
    return CONTINUE;
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
