import type { Device, Firewall, Network } from '@/engine/network/types';
import { CONTINUE, stop, type SimContext, type StageResult } from './context';
import { checkRules, type PeerContext } from './rules';

const STEP = {
  inbound: { stage: 'firewall-in', pass: 'firewall-in-pass', drop: 'firewall-in-drop' },
  outbound: { stage: 'firewall-out', pass: 'firewall-out-pass', drop: 'firewall-out-drop' },
} as const;

function firewallsOf(net: Network, device: Device): Firewall[] {
  return device.firewallIds.flatMap((id) => net.firewalls.filter((f) => f.id === id));
}

/** Checks the packet against the device's firewalls in one direction and records the step; a device without firewalls lets everything through, with no step. */
export function passFirewalls(ctx: SimContext, device: Device, direction: keyof typeof STEP, peer: PeerContext): StageResult {
  const firewalls = firewallsOf(ctx.net, device);
  if (firewalls.length === 0) return CONTINUE;
  const { allowed, checks } = checkRules(firewalls, direction, ctx.packet, peer);
  const step = STEP[direction];
  ctx.steps.push({
    stage: step.stage,
    at: device.id,
    verdict: allowed ? 'pass' : 'drop',
    reason: { code: allowed ? step.pass : step.drop, deviceId: device.id, firewallKind: firewalls[0].kind },
    checks,
  });
  return allowed ? CONTINUE : stop('timeout');
}
