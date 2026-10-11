import { CONTINUE, type Stage } from '@/engine/simulation/context';
import { passFirewalls } from '@/engine/simulation/firewall-check';

/** The firewall of the sender checks the packet before it leaves the device. One it drops never left, so the exchange the packet opened with (the SYN or the query) is taken back: nothing was said to the other end. */
export const firewallOutStage: Stage = (ctx) => {
  const device = ctx.source.device;
  if (!device || ctx.path === 'self') return CONTINUE;
  const firewallIds = ctx.path === 'private' ? ctx.dest!.firewallIds : [];
  const result = passFirewalls(ctx, device, 'outbound', { ip: ctx.destIp!, firewallIds });
  if (result.done) ctx.exchange = [];
  return result;
};
