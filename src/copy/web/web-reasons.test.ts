import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, officeWithNames } from '@/testing';
import { describeReason } from '@/copy/reasons';
import { termsIn } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';
import { describeWebReason, type WebReason } from './web-reasons';

const NET = officeWithNames();
const SERVER = OFFICE_FLOORS.server.id;
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const WITH_HOST: ReadonlySet<TermId> = new Set(['host-header']);
const WITH_HOST_AND_RESPONSE: ReadonlySet<TermId> = new Set(['host-header', 'http-response']);

const chosen: WebReason = { code: 'web-site-chosen', deviceId: SERVER, name: 'blog.lucia.example' };
const fallback: WebReason = { code: 'web-default-site', deviceId: SERVER, name: '198.51.100.50' };
const answered: WebReason = { code: 'web-answered', deviceId: SERVER, statusCode: 404 };

describe('the reasons of a web service', () => {
  it('choosing a site names the host of the request and the site that answers', () => {
    expect(describeWebReason(chosen, NET, NOTHING_KNOWN)).toBe('La petición va dirigida a blog.lucia.example. [[servidor-internet]] tiene un sitio con ese nombre y contesta con él.');
    expect(describeWebReason(fallback, NET, NOTHING_KNOWN)).toBe('La petición va dirigida a 198.51.100.50. [[servidor-internet]] no tiene un sitio con ese nombre y contesta con su sitio por defecto.');
  });

  it('the Host header is named only once the player knows it', () => {
    expect(describeWebReason(chosen, NET, WITH_HOST)).toBe('La {{host-header}} de la petición indica blog.lucia.example. [[servidor-internet]] tiene un sitio con ese nombre y contesta con él.');
    expect(termsIn(describeWebReason(chosen, NET, NOTHING_KNOWN))).toEqual([]);
  });

  it('an answer says the code and tags the response once the player knows it', () => {
    expect(describeWebReason(answered, NET, NOTHING_KNOWN)).toBe('[[servidor-internet]] contesta con una respuesta de código 404.');
    expect(describeWebReason(answered, NET, WITH_HOST_AND_RESPONSE)).toBe('[[servidor-internet]] contesta con una {{http-response|respuesta}} de código 404.');
  });

  it('describeReason gives the sentence of each web reason and ties no reply to a rule', () => {
    for (const reason of [chosen, fallback, answered]) {
      const text = describeReason(reason, NET, WITH_HOST_AND_RESPONSE);
      expect(text).toBe(describeWebReason(reason, NET, WITH_HOST_AND_RESPONSE));
      expect(text).not.toMatch(/stateful|firewall|bloquea|filtra/i);
    }
  });
});
