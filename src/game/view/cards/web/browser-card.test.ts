import { describe, expect, it } from 'vitest';
import { BROWSER_TEXT, toPlainText } from '@/copy';
import { OFFICE_FLOORS, sendIncident, signInIncident, webSendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { browserCard, browserView } from './browser-card';

const WEB = webSendIncident();
const web = startSession([WEB], WEB.id);
const { floor1, server } = OFFICE_FLOORS;

const opening = (session: Session, from: string, to: string): Session => sessionReducer(session, { type: 'sendPacket', fromId: from, toId: to, messageId: 'browser' });
const viewOf = (session: Session, from: string, to: string) => browserView(opening(session, from, to), { from, to, message: 'browser' });

describe('browserCard', () => {
  it('opens from an origin of an incident that offers the browser, with its title, the chips it sends and the url of each address', () => {
    const card = browserCard(web, PIECE_ID.device('your-laptop'));
    expect(card).toMatchObject({ pieceId: PIECE_ID.device('your-laptop'), fromId: 'you', messageId: 'browser', title: '{{browser|Navegador}} de [[tu-laptop]]' });
    expect(card?.addresses.map((chip) => chip.id)).toEqual(['app-7', 'app-8', 'app-80', 'orders', 'shop', 'blog', 'ip']);
    expect(card?.addresses.find((chip) => chip.id === 'shop')?.label).toBe('http://www.lucia.example/');
    expect(browserCard(web, PIECE_ID.device('lucia-laptop'))?.fromId).toBe('lucia');
  });

  it('is null for a piece that is not an origin, and in an incident that offers no browser', () => {
    expect(browserCard(web, PIECE_ID.device('printer'))).toBeNull();
    const plain = sendIncident();
    expect(browserCard(startSession([plain], plain.id), PIECE_ID.device('your-laptop'))).toBeNull();
  });

  it('offers only the addresses that are a url: a browser cannot open a plain address', () => {
    const plain = startSession([{ ...WEB, send: { ...WEB.send, to: [...WEB.send.to, { id: 'plain', address: floor1.lucia }] } }], WEB.id);
    expect(browserCard(plain, PIECE_ID.device('your-laptop'))?.addresses.map((chip) => chip.id)).not.toContain('plain');
  });
});

describe('browserView', () => {
  it('the tab shows the address, the page or the error in plain words', () => {
    expect(viewOf(web, 'you', 'shop')).toEqual({ address: 'http://www.lucia.example/', shows: { kind: 'page', lines: ['La tienda'] } });
    expect(viewOf(web, 'you', 'blog')?.shows).toEqual({ kind: 'page', lines: ['La tienda'] });
    expect(viewOf(web, 'lucia', 'app-80')).toEqual({ address: 'http://localhost:80/pedidos?id=7', shows: { kind: 'error', text: 'La conexión se rechazó' } });
    expect(viewOf(web, 'you', 'orders')).toEqual({ address: `http://${floor1.lucia}:3000/pedidos`, shows: { kind: 'error', text: 'No se pudo conectar' } });
  });

  it('shows the page the server sent after the firewall lets the browser in, the 404 included', () => {
    const opened = sessionReducer(web, { type: 'placeRule', firewallId: 'fw-lucia', whatId: 'tcp-3000', fromId: 'you' });
    expect(viewOf(opened, 'you', 'orders')?.shows).toEqual({ kind: 'page', lines: ['No hay nada en esa URL.'] });
  });

  it('says a service that accepted the connection and sent no page did not answer with one', () => {
    const ssh = { id: 'ssh', address: 'localhost', url: 'http://localhost:22/' };
    const withSsh = startSession([{ ...WEB, send: { ...WEB.send, to: [...WEB.send.to, ssh] } }], WEB.id);
    expect(viewOf(withSsh, 'lucia', 'ssh')?.shows).toEqual({ kind: 'error', text: 'El servidor no contestó con ninguna página' });
  });

  it('is null until that address was opened, for the other messages and for an address that is no url', () => {
    expect(browserView(web, { from: 'you', to: 'shop', message: 'browser' })).toBeNull();
    expect(browserView(sessionReducer(web, { type: 'sendPacket', fromId: 'you', toId: 'shop', messageId: 'curl' }), { from: 'you', to: 'shop', message: 'curl' })).toBeNull();
    expect(browserView(opening(web, 'you', 'shop'), { from: 'you', message: 'browser' })).toBeNull();
  });

  it('shows the last time the address was opened, and nothing after the world changed', () => {
    const moved = sessionReducer(opening(web, 'you', 'orders'), { type: 'placeRule', firewallId: 'fw-lucia', whatId: 'tcp-3000', fromId: 'you' });
    expect(browserView(moved, { from: 'you', to: 'orders', message: 'browser' })).toBeNull();
    expect(viewOf(moved, 'you', 'orders')?.shows.kind).toBe('page');
  });

  it('the browser names no real browser and no real error code', () => {
    const { refused, noConnection, noPage, address } = BROWSER_TEXT;
    const texts = [refused, noConnection, noPage, address, toPlainText(BROWSER_TEXT.title('[[tu-laptop]]'))];
    for (const text of texts) expect(text, text).not.toMatch(/chrome|chromium|firefox|safari|edge|opera|brave|explorer|ERR_|NET::|\b[1-5]\d\d\b|código|code|cookie|redirig|redirecci|HSTS/i);
    const shown = [viewOf(web, 'you', 'shop'), viewOf(web, 'lucia', 'app-80'), viewOf(web, 'you', 'orders')].map((view) => view?.shows);
    expect(shown.filter((shows) => shows?.kind === 'error').map((shows) => shows && 'text' in shows && shows.text)).toEqual([BROWSER_TEXT.refused, BROWSER_TEXT.noConnection]);
  });
});

describe('the sign-in and the memory of the browser', () => {
  const SIGN_IN = signInIncident();
  const signing = startSession([SIGN_IN], SIGN_IN.id);
  const LAPTOP = PIECE_ID.device('your-laptop');
  const sent = (session: Session, ...messageIds: string[]): Session => messageIds.reduce((current, messageId) => sessionReducer(current, { type: 'sendPacket', fromId: 'you', toId: 'admin', messageId }), session);
  const cookieNamed = (site: string, value: string) => ({ id: `${site}|sesion`, site, name: 'sesion', value });
  const lucia = OFFICE_FLOORS.floor1.lucia;

  it('offers a user for each browser message that signs in, and opens with the one that does not', () => {
    const card = browserCard(signing, LAPTOP);
    expect(card?.messageId).toBe('browser');
    expect(card?.users).toEqual([{ messageId: 'sign-in-lucia', label: 'Lucía' }, { messageId: 'sign-in-marta', label: 'Marta' }]);
    expect(card?.addresses.map((chip) => chip.id)).toContain('admin');
    expect(browserCard(web, LAPTOP)?.users).toEqual([]);
  });

  it('the memory table lists the cookies the browser holds, by site', () => {
    expect(browserCard(signing, LAPTOP)?.remembered).toEqual([]);
    const asLucia = sent(signing, 'sign-in-lucia');
    expect(browserCard(asLucia, LAPTOP)?.remembered).toEqual([cookieNamed(lucia, 's1')]);
    expect(browserCard(sent(asLucia, 'sign-in-marta'), LAPTOP)?.remembered, 'the same name and site replace each other').toEqual([cookieNamed(lucia, 's2')]);
    expect(browserCard(sent(signing, 'curl-i', 'curl-cookie'), LAPTOP)?.remembered, 'a curl keeps nothing').toEqual([]);
    expect(browserCard(asLucia, PIECE_ID.device('lucia-laptop'))?.remembered, 'the browser of another device holds its own').toEqual([]);
  });

  it('the memory table waits for the term cookie, and goes with the sends when a move changes the world', () => {
    const unknown = startSession([{ ...SIGN_IN, introduces: SIGN_IN.introduces.filter((term) => term !== 'cookie') }], SIGN_IN.id);
    expect(browserCard(sent(unknown, 'sign-in-lucia'), LAPTOP)?.remembered).toBeNull();
    const moved = sessionReducer(sent(signing, 'sign-in-lucia'), { type: 'placeRule', firewallId: 'fw-lucia', whatId: 'tcp-3001', fromId: 'you' });
    expect(browserCard(moved, LAPTOP)?.remembered).toEqual([]);
  });

  it('shows the page of the sign-in and then the page that was opened, for the same address', () => {
    const picks = { from: 'you', to: 'admin', message: 'browser' };
    expect(browserView(signing, picks)).toBeNull();
    const asLucia = sent(signing, 'sign-in-lucia');
    expect(browserView(asLucia, picks)).toEqual({ address: `http://${lucia}:3000/login`, shows: { kind: 'page', lines: ['Sesión iniciada.'] } });
    expect(browserView(sent(asLucia, 'browser'), picks)).toEqual({ address: `http://${lucia}:3000/admin`, shows: { kind: 'page', lines: ['Panel de administración.'] } });
    expect(browserView(sent(sent(asLucia, 'browser'), 'sign-in-marta'), picks)?.address, 'the last of the two').toBe(`http://${lucia}:3000/login`);
    expect(browserView(sent(signing, 'curl-i'), picks), 'a curl is not the browser').toBeNull();
  });

  it('a browser without the cookie gets what the app answers to a request with no credential', () => {
    expect(browserView(sent(signing, 'browser'), { from: 'you', to: 'admin', message: 'browser' })?.shows).toEqual({ kind: 'page', lines: ['Hace falta un usuario y una contraseña válidos.'] });
    expect(browserView(sent(signing, 'sign-in-marta', 'browser'), { from: 'you', to: 'admin', message: 'browser' })?.shows).toEqual({ kind: 'page', lines: ['Ese usuario no tiene permiso para entrar aquí.'] });
  });
});

describe('the sites and the server of the internet are no part of the browser', () => {
  it('has no tab for the server of the internet: it is not an origin', () => {
    expect(browserCard(web, PIECE_ID.actor(server.id))).toBeNull();
  });
});
