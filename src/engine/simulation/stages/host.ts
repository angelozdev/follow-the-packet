import { CONTINUE, describePacket, stop, type Stage } from '@/engine/simulation/context';

export const hostStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  ctx.tcpdump.push({ deviceId: dest.id, direction: 'In', src, dst: dest.privateIp, summary: describePacket(p) });

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'drop', reason: { code: 'host-unsolicited-icmp', deviceId: dest.id, icmpType: p.icmpType! } });
      return stop('arrived-no-reply');
    }
    if (dest.host.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'drop', reason: { code: 'host-ignores-echo', deviceId: dest.id } });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'pass', reason: { code: 'host-replies', deviceId: dest.id } });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    if (!dest.host.listeningTcpPorts.includes(p.port!)) {
      ctx.tcpdump.push({ deviceId: dest.id, direction: 'Out', src: dest.privateIp, dst: src, summary: `TCP ${p.port} RST` });
      ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'reject', reason: { code: 'host-refused', deviceId: dest.id, port: p.port! } });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'pass', reason: { code: 'host-accepts', deviceId: dest.id, port: p.port! } });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'host', at: dest.id, verdict: 'drop', reason: { code: 'host-udp-no-service', deviceId: dest.id, port: p.port! } });
  return stop('arrived-no-reply');
};
