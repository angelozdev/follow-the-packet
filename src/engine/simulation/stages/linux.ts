import { CONTINUE, describePacket, stop, type Stage } from '@/engine/simulation/context';

export const linuxStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const src = ctx.effectiveSource!;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'In', src, dst: dest.privateIp, summary: describePacket(p) });

  if (p.protocol === 'icmp') {
    if (p.icmpType !== 8) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-unsolicited-icmp', instanceId: dest.id, icmpType: p.icmpType! } });
      return stop('arrived-no-reply');
    }
    if (dest.linux.ignoreIcmpEcho) {
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-ignores-echo', instanceId: dest.id } });
      return stop('arrived-no-reply');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: { code: 'linux-replies', instanceId: dest.id } });
    return CONTINUE;
  }

  if (p.protocol === 'tcp') {
    if (!dest.linux.listeningTcpPorts.includes(p.port!)) {
      ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: src, summary: `TCP ${p.port} RST` });
      ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'reject', reason: { code: 'linux-refused', instanceId: dest.id, port: p.port! } });
      return stop('refused');
    }
    ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'pass', reason: { code: 'linux-accepts', instanceId: dest.id, port: p.port! } });
    return CONTINUE;
  }

  ctx.steps.push({ stage: 'linux', at: dest.id, verdict: 'drop', reason: { code: 'linux-udp-no-service', instanceId: dest.id, port: p.port! } });
  return stop('arrived-no-reply');
};
