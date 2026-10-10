import { isIpv4 } from '@/engine/network/cidr';
import { resolveName } from '@/engine/network/naming/dns';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

export const dnsStage: Stage = (ctx) => {
  const { packet, source, net } = ctx;
  if (isIpv4(packet.to)) {
    ctx.destIp = packet.to;
    return CONTINUE;
  }
  const ip = resolveName(net, packet.to, source.inside);
  if (ip === null) {
    ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'drop', reason: { code: 'dns-unresolved', name: packet.to, fromInside: source.inside } });
    return stop('unresolved');
  }
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'info', reason: { code: 'dns-resolved', name: packet.to, ip, fromInside: source.inside } });
  return CONTINUE;
};
