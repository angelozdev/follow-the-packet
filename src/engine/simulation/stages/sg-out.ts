import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, firewallsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device) return CONTINUE;
  const dest = ctx.dest!;
  const { allowed, checks } = checkRules(firewallsOf(ctx.net, device), 'outbound', ctx.packet, {
    ip: ctx.destIp!,
    sgIds: ctx.path === 'private' ? dest.firewallIds : [],
  });
  ctx.steps.push({
    stage: 'sg-out',
    at: device.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? 'sg-out-pass' : 'sg-out-drop', instanceId: device.id },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
