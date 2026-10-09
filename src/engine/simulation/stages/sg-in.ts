import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  const sgIds = ctx.path === 'private' && ctx.source.device ? ctx.source.device.firewallIds : [];
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, sgIds });
  ctx.steps.push({
    stage: 'sg-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-in-pass' : 'sg-in-drop', instanceId: dest.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
