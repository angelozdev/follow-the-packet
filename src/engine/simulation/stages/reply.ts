import { arrivalOf, logAt, receiverOf, sayAnswer, stop, type Stage } from '@/engine/simulation/context';

export const replyStage: Stage = (ctx) => {
  const receiver = receiverOf(ctx);
  const p = arrivalOf(ctx).packet;
  const summary = p.protocol === 'icmp' ? 'ICMP echo reply' : `${p.protocol.toUpperCase()} ${p.port} reply`;
  logAt(ctx, receiver, 'Out', receiver.ip, ctx.effectiveSource!, summary);
  sayAnswer(ctx);
  ctx.steps.push({ stage: 'reply', at: receiver.id, verdict: 'pass', reason: { code: 'reply-stateful', deviceId: receiver.id } });
  return stop('replied');
};
