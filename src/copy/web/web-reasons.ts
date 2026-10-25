import type { Network, Reason } from '@/engine';
import { deviceName } from '@/copy/packet-labels';
import { word, type TermText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';
import { statusCodeName } from './web-text';

export type WebReason = Extract<Reason, { code: 'web-site-chosen' | 'web-default-site' | 'web-needs-login' | 'web-forbidden' | 'web-answered' }>;

function withCode(statusCode: number, known: ReadonlySet<TermId>): TermText {
  return known.has('status-code') ? `con el {{status-code|código de estado}} ${statusCodeName(statusCode, known)}` : `de código ${statusCode}`;
}

/** Turns what a web service did with a request into the sentence the player reads, with the terms they know tagged. Choosing a site names the host the request carries and says whether the service has a site with that name; before `host-header` is known the request is only "dirigida a" that name. A 401 speaks of who asks (the app does not know who the request comes from, so there is no authentication) and a 403 of what is allowed (the app knows the user, and the authorization decides that this user has no permission for the page); each tags its term once the player knows it. Answering says the code of the response and nothing else about it, behind the term status code and the term of the code itself once the player knows them. */
export function describeWebReason(reason: WebReason, net: Network, known: ReadonlySet<TermId>): TermText {
  const server = deviceName(net, reason.deviceId);
  const asked = (name: string): TermText => (known.has('host-header') ? `La {{host-header}} de la petición indica ${name}.` : `La petición va dirigida a ${name}.`);
  switch (reason.code) {
    case 'web-site-chosen':
      return `${asked(reason.name)} ${server} tiene un sitio con ese nombre y contesta con él.`;
    case 'web-default-site':
      return `${asked(reason.name)} ${server} no tiene un sitio con ese nombre y contesta con su sitio por defecto.`;
    case 'web-needs-login':
      return `${server} no sabe quién pide ${reason.path}: la petición no trae una credencial válida, y sin ella no puede hacer la ${word(known, 'authentication', 'autenticación')}.`;
    case 'web-forbidden':
      return `${server} sabe quién pide ${reason.path}: es ${reason.user}. Pero la ${word(known, 'authorization', 'autorización')} decide que ${reason.user} no tiene permiso para entrar a ${reason.path}.`;
    case 'web-answered':
      return `${server} contesta con una ${word(known, 'http-response', 'respuesta')} ${withCode(reason.statusCode, known)}.`;
  }
}
