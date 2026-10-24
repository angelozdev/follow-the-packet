import { acceptingService } from '@/engine/network/services';
import type { Reason } from '@/engine/simulation/trace';
import { CONTINUE, arrivalOf, receiverOf, sayAnswer, stop, type Stage } from '@/engine/simulation/context';
import { appKey, answerRequest, chooseSite } from '@/engine/web/app';
import type { Denial } from '@/engine/web/identity/access';
import { rememberCookie } from '@/engine/web/identity/browser-memory';
import { SET_COOKIE_HEADER } from '@/engine/web/identity/cookies';

function denialReason(denial: Denial, deviceId: string, path: string): Reason {
  return denial.kind === 'forbidden' ? { code: 'web-forbidden', deviceId, path, user: denial.user } : { code: 'web-needs-login', deviceId, path };
}

/** A packet that carries a message and was accepted by a service meets the app that listens. A service that speaks no HTTP ends the trip as `arrived-no-reply`, with the connection open. A web service chooses a site by the host of the request, answers from its pages (a 401 or a 403 says why in a step of its own) and keeps its orders and its sessions for the sends after; when the message comes from a browser and the response sets a cookie, the browser of that device keeps it for the site the request named. A packet with no message writes no step. */
export const appStage: Stage = (ctx) => {
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
  const key = appKey(receiver.id, packet.port!, site.id);
  const before = ctx.apps?.[key] ?? site.orders?.start ?? [];
  const { response, orders, sessions, denial } = answerRequest(site, before, app.request, ctx.sessions?.[key]);
  if (orders !== before) ctx.apps = { ...ctx.apps, [key]: orders };
  if (sessions) ctx.sessions = { ...ctx.sessions, [key]: sessions };
  if (denial) ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'info', reason: denialReason(denial, receiver.id, app.request.path) });
  ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'pass', reason: { code: 'web-answered', deviceId: receiver.id, statusCode: response.statusCode } });
  const setCookie = response.headers[SET_COOKIE_HEADER];
  if (packet.message?.browser && setCookie !== undefined) ctx.browser = rememberCookie(ctx.browser, ctx.source.id, app.request.host, setCookie);
  ctx.app = { ...app, response };
  return CONTINUE;
};
