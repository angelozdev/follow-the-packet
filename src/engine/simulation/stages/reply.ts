import { stop, type Stage } from '@/engine/simulation/context';

export const replyStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const p = ctx.packet;
  const summary = p.protocol === 'icmp' ? 'ICMP echo reply' : `${p.protocol.toUpperCase()} ${p.port} reply`;
  ctx.tcpdump.push({ instanceId: dest.id, direction: 'Out', src: dest.privateIp, dst: ctx.effectiveSource!, summary });
  ctx.steps.push({ stage: 'reply', at: dest.id, verdict: 'pass', reason: { code: 'reply-stateful', instanceId: dest.id } });
  return stop('replied');
};
