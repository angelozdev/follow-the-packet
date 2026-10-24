import { acceptingService } from '@/engine/network/services';
import { CONTINUE, arrivalOf, receiverOf, sayAnswer, stop, type Stage } from '@/engine/simulation/context';
import { appKey, answerRequest, chooseSite } from '@/engine/web/app';

/** A packet that carries a message and was accepted by a service meets the app that listens. A service that speaks no HTTP ends the trip as `arrived-no-reply`, with the connection open. A web service chooses a site by the host of the request, answers from its pages and keeps its orders for the sends after. A packet with no message writes no step. */
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
  const { response, orders } = answerRequest(site, before, app.request);
  if (orders !== before) ctx.apps = { ...ctx.apps, [key]: orders };
  ctx.steps.push({ stage: 'app', at: receiver.id, verdict: 'pass', reason: { code: 'web-answered', deviceId: receiver.id, statusCode: response.statusCode } });
  ctx.app = { ...app, response };
  return CONTINUE;
};
