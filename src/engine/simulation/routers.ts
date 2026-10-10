import { bestRoute, interfaceTowards, onwardFrom, ownsIp } from '@/engine/network/routing';
import { DEFAULT_TTL } from '@/engine/network/schema';
import { lanOf } from '@/engine/network/topology';
import type { Device, Router, ServerActor } from '@/engine/network/types';
import { CONTINUE, addLeg, stop, type SimContext, type StageResult } from './context';
import type { NoticeKind, Notice, Reason } from './trace';

/** Hands the packet to a device of the network: the firewall of that device, its host and its reply come next. */
export function arriveAt(ctx: SimContext, dest: Device): StageResult {
  ctx.dest = dest;
  ctx.path = 'private';
  return CONTINUE;
}

/** Records the warning that goes back to the sender and ends the packet: a Time Exceeded ends as `ttl-exceeded`, any other warning as `unreachable`. */
export function sendNotice(ctx: SimContext, notice: Notice): StageResult {
  ctx.notice = notice;
  return stop(notice.kind === 'time-exceeded' ? 'ttl-exceeded' : 'unreachable');
}

function answerAs(ctx: SimContext, id: string, ip: string, replies: Reason): StageResult {
  ctx.responder = { id, ip, replies };
  return CONTINUE;
}

function dropAt(ctx: SimContext, router: Router, reason: Reason): void {
  ctx.steps.push({ stage: 'forward', at: router.id, verdict: 'drop', reason });
}

/** The IP of the router's interface towards the sender, which is the source of every warning the router sends (RFC 1812, §4.3.2.4). It is the interface of the sender's LAN, or else the one the way back to the sender leaves through; the interface the packet came in by only stands in when the router has no way back. */
function towardsSender(ctx: SimContext, router: Router, ingress: string): string {
  const { net, source } = ctx;
  const lan = source.device && lanOf(net, source.device);
  const direct = lan && interfaceTowards(router, lan.id);
  if (direct) return direct;
  const back = bestRoute(router, source.ip);
  return (back && interfaceTowards(router, back.next)) ?? ingress;
}

function unreachableAt(ctx: SimContext, router: Router, from: string, kind: NoticeKind, reason: Reason): StageResult {
  dropAt(ctx, router, reason);
  return router.sendsUnreachable ? sendNotice(ctx, { kind, fromId: router.id, fromIp: from }) : stop('timeout');
}

function crossed(ctx: SimContext, router: Router, from: string, ttlLeft: number): void {
  ctx.steps.push({ stage: 'forward', at: router.id, verdict: 'pass', reason: { code: 'forward-hop', routerId: router.id, ip: from, ttlLeft } });
}

function forwardOn(ctx: SimContext, router: Router, from: string, ttlLeft: number): StageResult {
  const ip = ctx.destIp!;
  const onward = onwardFrom(ctx.net, router, ip);
  const failure = { routerId: router.id, ip, warns: router.sendsUnreachable };
  switch (onward.kind) {
    case 'private':
      dropAt(ctx, router, { code: 'forward-private-dropped', routerId: router.id, ip });
      return stop('timeout');
    case 'no-route':
      return unreachableAt(ctx, router, from, 'net-unreachable', { code: 'forward-no-route', ...failure });
    case 'no-host':
      return unreachableAt(ctx, router, from, 'host-unreachable', { code: 'forward-no-host', ...failure });
    case 'device':
      crossed(ctx, router, from, ttlLeft);
      addLeg(ctx, lanOf(ctx.net, onward.device)?.latencyMs ?? 0);
      return arriveAt(ctx, onward.device);
    case 'server':
      crossed(ctx, router, from, ttlLeft);
      return answerFromServer(ctx, onward.server);
    case 'router':
      crossed(ctx, router, from, ttlLeft);
      return pass(ctx, onward.router, ttlLeft, onward.ingress);
  }
}

function answerFromServer(ctx: SimContext, server: ServerActor): StageResult {
  addLeg(ctx, server.latencyMs);
  return answerAs(ctx, server.id, server.ip, { code: 'host-replies', deviceId: server.id });
}

function pass(ctx: SimContext, router: Router, ttl: number, ingress: string): StageResult {
  const ip = ctx.destIp!;
  addLeg(ctx, router.latencyMs);
  if (ownsIp(router, ip)) return answerAs(ctx, router.id, ip, { code: 'forward-router-replies', routerId: router.id, ip });
  const ttlLeft = ttl - 1;
  const from = towardsSender(ctx, router, ingress);
  ctx.hops.push({ routerId: router.id, ip: from, ttlLeft });
  if (ttlLeft > 0) return forwardOn(ctx, router, from, ttlLeft);
  dropAt(ctx, router, { code: 'forward-ttl-exceeded', routerId: router.id, ip: from });
  return sendNotice(ctx, { kind: 'time-exceeded', fromId: router.id, fromIp: from });
}

/** Takes the packet into the first router, by the interface `ingress` that faces the sender's LAN. Each router the packet reaches answers it when the destination is one of its own interfaces; otherwise takes 1 from the TTL (RFC 1812, §5.3.1), discards the packet at 0 and warns the sender, and passes it on. The TTL runs out in at most 255 routers, so a loop between two routers ends. Every router the packet reaches adds its latency to the trip, the one that answers or warns included, and a server adds its own. */
export function enterRouter(ctx: SimContext, router: Router, ingress: string): StageResult {
  return pass(ctx, router, ctx.packet.ttl ?? DEFAULT_TTL, ingress);
}
