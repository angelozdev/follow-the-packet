import { ipInCidr } from '@/engine/network/cidr';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

export const routeStage: Stage = (ctx) => {
  const { net, source } = ctx;
  const destIp = ctx.destIp!;

  if (ipInCidr(destIp, net.cidr)) {
    if (!source.inside) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: destIp } });
      return stop('timeout');
    }
    const dest = net.devices.find((d) => d.privateIp === destIp);
    if (!dest) {
      ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'drop', reason: { code: 'route-no-private-instance', ip: destIp } });
      return stop('timeout');
    }
    ctx.dest = dest;
    ctx.path = 'private';
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'vpc', verdict: 'pass', reason: { code: 'route-private' } });
    return CONTINUE;
  }

  const dest = net.devices.find((d) => d.publicIp === destIp);
  if (!dest) {
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-no-public-device', ip: destIp } });
    return stop('timeout');
  }
  if (source.device) {
    const publicIp = source.device.publicIp;
    if (!publicIp) {
      ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'drop', reason: { code: 'route-no-public-ip', deviceId: source.device.id } });
      return stop('timeout');
    }
    ctx.effectiveSource = publicIp;
    ctx.steps.push({ stage: 'nat', at: 'igw', verdict: 'info', reason: { code: 'route-nat', from: source.ip, to: publicIp } });
  } else {
    ctx.effectiveSource = source.ip;
    ctx.steps.push({ stage: 'route', at: 'igw', verdict: 'pass', reason: { code: 'route-from-internet' } });
  }
  ctx.dest = dest;
  ctx.path = 'public';
  return CONTINUE;
};
