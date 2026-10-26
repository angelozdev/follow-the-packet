import { acceptingService } from '@/engine/network/services';
import type { PacketSpec } from '@/engine/network/types';
import type { Reason, Trace } from '@/engine/simulation/trace';
import { CONTINUE, arrivalOf, receiverOf, sayAnswer, stop, type SimContext, type Stage, type StageResult } from '@/engine/simulation/context';
import { appKey, answerRequest, chooseSite, pageOf } from '@/engine/web/app';
import type { Denial } from '@/engine/web/identity/access';
import { rememberCookie } from '@/engine/web/identity/browser-memory';
import { SET_COOKIE_HEADER } from '@/engine/web/identity/cookies';
import { originOf, upstreamMessageOf } from '@/engine/web/proxy/proxy';
import type { Origin } from '@/engine/web/schema';

export type SendUpstream = (ctx: SimContext, packet: PacketSpec) => Trace;

function denialReason(denial: Denial, deviceId: string, path: string): Reason {
  return denial.kind === 'forbidden' ? { code: 'web-forbidden', deviceId, path, user: denial.user } : { code: 'web-needs-login', deviceId, path };
}

function clientIpOf({ translation, source }: SimContext): string {
  return translation?.outside.ip ?? source.ip;
}

function passThrough(ctx: SimContext, send: SendUpstream, proxyId: string, origin: Origin): StageResult {
  const { request } = ctx.app!;
  const upstream = send(ctx, { from: { kind: 'actor', id: proxyId }, to: origin.ip, protocol: 'tcp', port: origin.port, message: upstreamMessageOf(request, clientIpOf(ctx)) });
  const { response, generatedBy } = upstream.app!;
  ctx.app = { request, upstream, ...(response && { response, generatedBy }) };
  if (!response) {
    sayAnswer(ctx);
    return stop('arrived-no-reply');
  }
  ctx.steps.push({ stage: 'app', at: proxyId, verdict: 'pass', reason: { code: 'web-answered', deviceId: proxyId, statusCode: response.statusCode } });
  return CONTINUE;
}

/** A packet that carries a message and was accepted by a service meets the app that listens. A service that speaks no HTTP ends the trip as `arrived-no-reply`, with the connection open. A web service chooses a site by the host of the request, answers from its pages (a 401 or a 403 of a page that asks for a role says why in a step of its own, a failed login does not) and keeps its orders and its sessions for the sends after; when the message comes from a browser and the response sets a cookie, the browser of that device keeps it for the site the request named. A packet with no message writes no step. */
function runApp(ctx: SimContext, send: SendUpstream): StageResult {
  const { app } = ctx;
  if (!app) return CONTINUE;
  const receiver = receiverOf(ctx);
  const { ip, packet } = arrivalOf(ctx);
  const web = acceptingService(receiver.host.services, 'tcp', packet.port!, ip, receiver.host.processes)?.web;
  if (!web) {
    sayAnswer(ctx);
    return stop('arrived-no-reply');
  }
  const { site, named } = chooseSite(web, app.request.host);
  ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'info', reason: { code: named ? 'web-site-chosen' : 'web-default-site', deviceId: receiver.id, name: app.request.host } });
  const origin = originOf(site, app.request);
  if (origin) return passThrough(ctx, send, receiver.id, origin);
  const key = appKey(receiver.id, packet.port!, site.id);
  const before = ctx.apps?.[key] ?? site.orders?.start ?? [];
  const { response, orders, sessions, denial } = answerRequest(site, before, app.request, ctx.sessions?.[key]);
  if (orders !== before) ctx.apps = { ...ctx.apps, [key]: orders };
  if (sessions) ctx.sessions = { ...ctx.sessions, [key]: sessions };
  if (denial && pageOf(site, app.request)?.role !== undefined) ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'info', reason: denialReason(denial, receiver.id, app.request.path) });
  ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'pass', reason: { code: 'web-answered', deviceId: receiver.id, statusCode: response.statusCode } });
  const setCookie = response.headers[SET_COOKIE_HEADER];
  if (packet.message?.browser && setCookie !== undefined) ctx.browser = rememberCookie(ctx.browser, ctx.source.id, app.request.host, setCookie);
  ctx.app = { ...app, response, generatedBy: { id: receiver.id, role: 'app' } };
  return CONTINUE;
}

export function createAppStage(send: SendUpstream): Stage {
  return (ctx) => runApp(ctx, send);
}
