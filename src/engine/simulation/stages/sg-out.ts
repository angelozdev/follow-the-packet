import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgOutStage: Stage = (ctx) => {
  const instance = ctx.source.instance;
  if (!instance) return CONTINUE;
  const dest = ctx.dest!;
  const { allowed, checks } = checkRules(groupsOf(ctx.net, instance), 'outbound', ctx.packet, {
    ip: ctx.destIp!,
    sgIds: ctx.path === 'private' ? dest.sgIds : [],
  });
  ctx.steps.push({
    stage: 'sg-out',
    at: instance.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-out-pass' : 'sg-out-drop', instanceId: instance.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
