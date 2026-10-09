import { CONTINUE, type Stage } from '@/engine/simulation/context';
import { passFirewalls } from '@/engine/simulation/firewall-check';

export const firewallOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device || ctx.path === 'self') return CONTINUE;
  const firewallIds = ctx.path === 'private' ? ctx.dest!.firewallIds : [];
  return passFirewalls(ctx, device, 'outbound', { ip: ctx.destIp!, firewallIds });
};
