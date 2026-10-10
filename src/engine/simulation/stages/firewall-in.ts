import { CONTINUE, type Stage } from '@/engine/simulation/context';
import { passFirewalls } from '@/engine/simulation/firewall-check';

export const firewallInStage: Stage = (ctx) => {
  const { dest } = ctx;
  if (ctx.path === 'self' || !dest) return CONTINUE;
  const source = ctx.source.device;
  const firewallIds = ctx.path === 'private' && source ? source.firewallIds : [];
  return passFirewalls(ctx, dest, 'inbound', { ip: ctx.effectiveSource!, firewallIds });
};
