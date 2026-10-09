import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const firewallInStage: Stage = (ctx) => {
  if (ctx.path === 'self') return CONTINUE;
  const dest = ctx.dest!;
  const firewallIds = ctx.path === 'private' && ctx.source.device ? ctx.source.device.firewallIds : [];
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, firewallIds });
  ctx.steps.push({
    stage: 'firewall-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'firewall-in-pass' : 'firewall-in-drop', deviceId: dest.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
