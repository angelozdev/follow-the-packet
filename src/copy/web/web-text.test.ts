import { describe, expect, it } from 'vitest';
import { EVERY_TERM, OFFICE_FLOORS, officeWithNames } from '@/testing';
import { termsIn, toPlainText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';
import { describeWebReason, type WebReason } from './web-reasons';
import { BROWSER_TEXT, SITES_TEXT, WEB_BOX_TEXT, type UrlParts } from './web-text';

const NET = officeWithNames();
const SERVER = OFFICE_FLOORS.server.id;
const PARTS: UrlParts = { scheme: 'http', host: 'localhost', hostIsIp: false, port: 3000, portWritten: true, path: '/pedidos', query: 'id=7' };
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

const reasons: WebReason[] = [
  { code: 'web-site-chosen', deviceId: SERVER, name: 'blog.lucia.example' },
  { code: 'web-default-site', deviceId: SERVER, name: 'blog.lucia.example' },
  { code: 'web-answered', deviceId: SERVER, statusCode: 200 },
];

describe('the texts of the web', () => {
  const textsOf = (known: ReadonlySet<TermId>): string[] => [
    ...reasons.map((reason) => describeWebReason(reason, NET, known)),
    ...WEB_BOX_TEXT.url.lines(PARTS, known),
    ...WEB_BOX_TEXT.url.lines({ ...PARTS, hostIsIp: true, portWritten: false, query: undefined }, known),
    WEB_BOX_TEXT.url.label,
    WEB_BOX_TEXT.request,
    WEB_BOX_TEXT.response,
    WEB_BOX_TEXT.header('Host', 'localhost:3000'),
    WEB_BOX_TEXT.body('Pedido 7: 2 cafés'),
    ...Object.values(WEB_BOX_TEXT.notes),
    WEB_BOX_TEXT.curlGaveUp(3),
    BROWSER_TEXT.title('[[tu-laptop]]'),
    BROWSER_TEXT.refused,
    BROWSER_TEXT.noConnection,
    BROWSER_TEXT.noPage,
    SITES_TEXT.title('[[servidor-nuevo]]'),
    SITES_TEXT.byDefault('www.lucia.example'),
    SITES_TEXT.anyName,
    SITES_TEXT.empty,
  ];

  it('no text calls an http message a packet', () => {
    for (const known of [EVERY_TERM, NOTHING_KNOWN]) expect(textsOf(known).filter((text) => /paquete|packet/i.test(toPlainText(text)))).toEqual([]);
  });

  it('the lines of the url tag the term of each part only once the player knows it', () => {
    expect(termsIn(WEB_BOX_TEXT.url.lines({ ...PARTS, portWritten: false }, EVERY_TERM).join(' '))).toEqual(['port', 'default-port', 'url-path', 'query-string']);
    expect(termsIn(WEB_BOX_TEXT.url.lines({ ...PARTS, hostIsIp: true }, EVERY_TERM).join(' '))).toEqual(['ip-address', 'port', 'url-path', 'query-string']);
    expect(termsIn(WEB_BOX_TEXT.url.lines(PARTS, NOTHING_KNOWN).join(' '))).toEqual([]);
  });
});
