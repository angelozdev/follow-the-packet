import { checkRules } from '@/engine/simulation/rules';
import { CONTINUE, groupsOf, stop, type Stage } from '@/engine/simulation/context';

export const sgInStage: Stage = (ctx) => {
  const dest = ctx.dest!;
  // Un SG como origen solo coincide si el paquete viaja por IP privada dentro de la VPC (lab 03, V2).
  const sgIds = ctx.path === 'private' && ctx.source.instance ? ctx.source.instance.sgIds : [];
  const { allowed, checks } = checkRules(groupsOf(ctx.net, dest), 'inbound', ctx.packet, { ip: ctx.effectiveSource!, sgIds });
  ctx.steps.push({
    stage: 'sg-in',
    at: dest.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: allowed
      ? `El SG de ${dest.name} lo deja entrar.`
      : `Descartado en silencio: ninguna regla de entrada de ${dest.name} coincide en qué y desde dónde a la vez.`,
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
};
