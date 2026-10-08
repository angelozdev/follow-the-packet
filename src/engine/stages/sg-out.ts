import { checkRules } from '../rules';
import { CONTINUE, groupsOf, stop, type Stage } from './context';

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
    reason: allowed ? `La salida de ${instance.name} lo deja salir.` : `Ninguna regla de salida de ${instance.name} coincide.`,
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
