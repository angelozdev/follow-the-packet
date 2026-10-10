import { CONTINUE, describePacket, logAt, receiverOf, stop, type Stage } from '@/engine/simulation/context';

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
    if (!host.listeningTcpPorts.includes(p.port!)) {
      logAt(ctx, receiver, 'Out', ip, src, `TCP ${p.port} RST`);
      ctx.steps.push({ stage: 'host', at: id, verdict: 'reject', reason: { code: 'host-refused', deviceId: id, port: p.port! } });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'host', at: id, verdict: 'pass', reason: { code: 'host-accepts', deviceId: id, port: p.port! } });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'host', at: id, verdict: 'drop', reason: { code: 'host-udp-no-service', deviceId: id, port: p.port! } });
  return stop('arrived-no-reply');
};
