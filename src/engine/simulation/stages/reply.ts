import { logAt, receiverOf, stop, type Stage } from '@/engine/simulation/context';

export const replyStage: Stage = (ctx) => {
  const receiver = receiverOf(ctx);
  const p = ctx.packet;
  const summary = p.protocol === 'icmp' ? 'ICMP echo reply' : `${p.protocol.toUpperCase()} ${p.port} reply`;
  logAt(ctx, receiver, 'Out', receiver.ip, ctx.effectiveSource!, summary);
  ctx.steps.push({ stage: 'reply', at: receiver.id, verdict: 'pass', reason: { code: 'reply-stateful', deviceId: receiver.id } });
  return stop('replied');
};
