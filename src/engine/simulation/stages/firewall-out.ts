import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const firewallOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device || ctx.path === 'self') return CONTINUE;
  const dest = ctx.dest!;
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, device), 'outbound', ctx.packet, {
    ip: ctx.destIp!,
    firewallIds: ctx.path === 'private' ? dest.firewallIds : [],
  });
  ctx.steps.push({
    stage: 'firewall-out',
    at: device.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'firewall-out-pass' : 'firewall-out-drop', deviceId: device.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
