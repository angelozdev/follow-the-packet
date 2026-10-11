import { lookupService } from '@/engine/network/services';
import { CONTINUE, describePacket, logAt, receiverOf, sayRefusal, stop, type Receiver, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import type { Reason } from '@/engine/simulation/trace';

/** The host answers a TCP packet with a reset: it logs the RST, says it in the exchange and ends the trip as `refused`. */
function refuseTcp(ctx: SimContext, receiver: Receiver, reason: Reason): StageResult {
  logAt(ctx, receiver, 'Out', receiver.ip, ctx.effectiveSource!, `TCP ${ctx.packet.port} RST`);
  sayRefusal(ctx);
  ctx.steps.push({ stage: 'host', at: receiver.id, verdict: 'reject', reason });
  return stop('refused');
}

export const hostStage: Stage = (ctx) => {
  const receiver = receiverOf(ctx);
  const { id, ip, host } = receiver;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  logAt(ctx, receiver, 'In', src, ip, describePacket(p));

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-unsolicited-icmp', deviceId: id, icmpType: p.icmpType! } });
      return stop('arrived-no-reply');
    }
    if (host.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-ignores-echo', deviceId: id } });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'host', at: id, verdict: 'pass', reason: receiver.replies });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    const port = p.port!;
    const destinationIp = ctx.destIp!;
    switch (lookupService(host.services, 'tcp', port, destinationIp)) {
      case 'closed':
        return refuseTcp(ctx, receiver, { code: 'host-refused', deviceId: id, port });
      case 'wrong-address':
        return refuseTcp(ctx, receiver, { code: 'host-wrong-address', deviceId: id, port, ip: destinationIp });
      case 'accepts':
        ctx.steps.push({ stage: 'host', at: id, verdict: 'pass', reason: { code: 'host-accepts', deviceId: id, port } });
        return CONTINUE;
    }
  }

  ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-udp-no-service', deviceId: id, port: p.port! } });
  return stop('arrived-no-reply');
};
