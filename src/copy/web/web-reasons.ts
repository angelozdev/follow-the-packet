import type { Network, Reason } from '@/engine';
import { deviceName } from '@/copy/packet-labels';
import { word, type TermText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';

export type WebReason = Extract<Reason, { code: 'web-site-chosen' | 'web-default-site' | 'web-answered' }>;

/** Turns what a web service did with a request into the sentence the player reads, with the terms they know tagged. Choosing a site names the host the request carries and says whether the service has a site with that name; before `host-header` is known the request is only "dirigida a" that name. Answering says the code of the response and nothing else about it. */
export function describeWebReason(reason: WebReason, net: Network, known: ReadonlySet<TermId>): TermText {
  const server = deviceName(net, reason.deviceId);
  const asked = (name: string): TermText => (known.has('host-header') ? `La {{host-header}} de la petición indica ${name}.` : `La petición va dirigida a ${name}.`);
  switch (reason.code) {
    case 'web-site-chosen':
      return `${asked(reason.name)} ${server} tiene un sitio con ese nombre y contesta con él.`;
    case 'web-default-site':
      return `${asked(reason.name)} ${server} no tiene un sitio con ese nombre y contesta con su sitio por defecto.`;
    case 'web-answered':
      return `${server} contesta con una ${word(known, 'http-response', 'respuesta')} de código ${reason.statusCode}.`;
  }
}
