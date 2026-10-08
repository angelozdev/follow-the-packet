import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const sgIds = ctx.path === 'private' && ctx.source.instance ? ctx.source.instance.sgIds : [];
  const { allowed, checks } = checkRules(groupsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, sgIds });
  ctx.steps.push({
    stage: 'sg-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-in-pass' : 'sg-in-drop', instanceId: dest.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
