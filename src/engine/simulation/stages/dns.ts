import { isIpv4 } from '@/engine/network/cidr';
import { resolveName } from '@/engine/network/dns';
import { CONTINUE, stop, type Stage } from '@/engine/simulation/context';

export const dnsStage: Stage = (ctx) => {
  const { packet, source, net } = ctx;
  if (isIpv4(packet.to)) {
    ctx.destIp = packet.to;
    return CONTINUE;
  }
  const where = source.inside ? 'dentro' : 'fuera';
  const ip = resolveName(net, packet.to, source.inside);
  if (ip === null) {
    ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'drop', reason: `Nadie responde por el nombre ${packet.to} desde ${where} de la VPC.` });
    return stop('unresolved');
  }
  ctx.destIp = ip;
  ctx.steps.push({ stage: 'dns', at: source.id, verdict: 'info', reason: `${packet.to} → ${ip} (preguntando desde ${where} de la VPC)` });
  return CONTINUE;
};
