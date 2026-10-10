import { isConnected, lanOf } from '@/engine/network/topology';
import { CONTINUE, stop, type Delivery, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import type { Device, Lan, Network, Router } from '@/engine/network/types';

type Neighbour = { kind: 'device'; device: Device } | { kind: 'router'; router: Router };

function neighbourAt(net: Network, lan: Lan | undefined, ip: string): Neighbour | undefined {
  if (!lan) return undefined;
  const device = net.devices.find((d) => d.privateIp === ip && isConnected(d) && lanOf(net, d)?.id === lan.id);
  if (device) return { kind: 'device', device };
  const router = (net.routers ?? []).find((r) => r.interfaces.some((face) => face.ip === ip && face.faces === lan.id));
  return router && { kind: 'router', router };
}

function arriveAt(ctx: SimContext, dest: Device): StageResult {
  ctx.dest = dest;
  ctx.path = 'private';
  return CONTINUE;
}

function warnFromSender(ctx: SimContext, sender: Device, delivery: Delivery): StageResult {
  ctx.steps.push({
    stage: 'forward',
    at: sender.id,
    verdict: 'drop',
    reason: { code: 'forward-no-owner', deviceId: sender.id, ip: delivery.ip, viaGateway: delivery.viaGateway },
  });
  ctx.notice = { kind: 'host-unreachable', fromId: sender.id, fromIp: sender.privateIp };
  return stop('unreachable');
}

function loseInOffice(ctx: SimContext): StageResult {
  ctx.steps.push({ stage: 'forward', at: ctx.net.kind, verdict: 'drop', reason: { code: 'route-no-device', ip: ctx.destIp! } });
  return stop('lost');
}

function dropAtGateway(ctx: SimContext, gateway: Device): StageResult {
  ctx.steps.push({ stage: 'forward', at: gateway.id, verdict: 'drop', reason: { code: 'route-gateway-not-a-router', deviceId: gateway.id, ip: gateway.privateIp } });
  return stop('timeout');
}

function crossRouter(ctx: SimContext, router: Router): StageResult {
  const dest = ctx.net.devices.find(
    (d) => d.privateIp === ctx.destIp && isConnected(d) && router.interfaces.some((face) => face.faces === lanOf(ctx.net, d)?.id),
  );
  return dest ? arriveAt(ctx, dest) : loseInOffice(ctx);
}

function handOver(ctx: SimContext, next: Neighbour, viaGateway: boolean): StageResult {
  if (!viaGateway) return next.kind === 'device' ? arriveAt(ctx, next.device) : loseInOffice(ctx);
  return next.kind === 'device' ? dropAtGateway(ctx, next.device) : crossRouter(ctx, next.router);
}

/** Delivers what `route` handed over, inside the sender's LAN: it looks for a connected owner of the IP and, when nobody has it, the sender's own device warns that the host is unreachable. A gateway that is a router takes the packet to the LAN of the destination if it has an interface there, and a gateway that is any other device drops it in silence. A packet whose destination `route` already settled (a VPC, the same device, a public IP) goes through untouched. */
export const forwardStage: Stage = (ctx) => {
  const { delivery, source, net } = ctx;
  const sender = source.device;
  if (!delivery || !sender) return CONTINUE;
  const next = neighbourAt(net, lanOf(net, sender), delivery.ip);
  return next ? handOver(ctx, next, delivery.viaGateway) : warnFromSender(ctx, sender, delivery);
};
