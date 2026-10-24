import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import { CHAPTER_1_TERMS, NAME_SERVER_PIECES, OFFICE_FLOORS, classifyIncident, diagnoseIncident, filterIncident, gatewayIncident, identifyIncident, namesSendIncident, sendIncident, webSendIncident } from '@/testing';
import { startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceCard } from './piece-card';

const NAMES = namesSendIncident();
const START = startSession([NAMES], NAMES.id);
const { officeRouter, provider } = OFFICE_FLOORS;
const { resolver, authoritative } = NAME_SERVER_PIECES;

const ids = (session: Session, pieceId: string) => pieceCard(session, pieceId)?.tabs.map((tab) => tab.id);
const labels = (session: Session, pieceId: string) => pieceCard(session, pieceId)?.tabs.map((tab) => toPlainText(tab.label));

describe('pieceCard', () => {
  it('a piece with several cards offers one tab per card and a piece with one card offers none', () => {
    const gateway = gatewayIncident();
    const laptop = PIECE_ID.device('your-laptop');
    const chapter1: Session = { ...startSession([gateway], gateway.id), known: CHAPTER_1_TERMS };
    expect(pieceCard(chapter1, laptop)).toMatchObject({ pieceId: laptop, tabbed: true });
    expect(ids(chapter1, laptop)).toEqual(['terminal', 'settings']);
    const sending = sendIncident();
    const alone = startSession([sending], sending.id);
    expect(pieceCard(alone, laptop)).toMatchObject({ tabbed: false, first: 'terminal' });
    expect(ids(alone, laptop)).toEqual(['terminal']);
    expect(pieceCard(chapter1, PIECE_ID.device('printer'))).toBeNull();
    expect(pieceCard(chapter1, PIECE_ID.device('ghost'))).toBeNull();
  });

  it('a router offers its tables, a device its terminal, its settings and its services, and a server of names its records and its cache', () => {
    expect(ids(START, PIECE_ID.router(officeRouter.id))).toEqual(['routes', 'translations']);
    expect(ids(START, PIECE_ID.router(provider.id))).toEqual(['routes']);
    expect(ids(START, PIECE_ID.device('your-laptop'))).toEqual(['terminal', 'settings', 'routes']);
    expect(ids(START, PIECE_ID.device('lucia-laptop'))).toEqual(['services']);
    expect(ids(START, PIECE_ID.actor(authoritative.id))).toEqual(['records']);
    expect(ids(START, PIECE_ID.actor(resolver.id))).toEqual(['cache']);
    const [, listen] = NAMES.send.settings!;
    const both = { ...NAMES, send: { ...NAMES.send, settings: [...NAMES.send.settings!, { ...listen, id: 'own-app', deviceId: 'your-laptop' }] } };
    expect(ids(startSession([both], both.id), PIECE_ID.device('your-laptop'))).toEqual(['terminal', 'settings', 'services', 'routes']);
    expect(labels(START, PIECE_ID.router(officeRouter.id))).toEqual(['Tabla de rutas', 'Tabla de traducciones']);
    expect(labels(START, PIECE_ID.device('your-laptop'))).toEqual(['Terminal', 'Ajustes de red', 'Tabla de rutas']);
  });

  it('waits for the terms of the tables that nobody offers, so a router of chapter 1 opens nothing', () => {
    const chapter1: Session = { ...START, known: CHAPTER_1_TERMS };
    expect(pieceCard(chapter1, PIECE_ID.router(officeRouter.id))).toBeNull();
    expect(pieceCard(chapter1, PIECE_ID.actor(resolver.id))).toBeNull();
    expect(ids(chapter1, PIECE_ID.device('your-laptop'))).toEqual(['terminal']);
    const noCache: Session = { ...START, known: new Set([...START.known].filter((term) => term !== 'dns-cache')) };
    expect(pieceCard(noCache, PIECE_ID.actor(resolver.id))).toBeNull();
  });

  it('the first tab is the card the incident names and, when it names none, the terminal', () => {
    const laptop = PIECE_ID.device('your-laptop');
    expect(pieceCard(START, laptop)?.first).toBe('settings');
    const unnamed = { ...NAMES, send: { ...NAMES.send, opensFirst: undefined } };
    expect(pieceCard(startSession([unnamed], unnamed.id), laptop)?.first).toBe('terminal');
    const lacking = { ...NAMES, send: { ...NAMES.send, opensFirst: { 'your-laptop': 'records' as const } } };
    expect(pieceCard(startSession([lacking], lacking.id), laptop)?.first).toBe('terminal');
    const ofRouter = { ...NAMES, send: { ...NAMES.send, opensFirst: { [officeRouter.id]: 'routes' as const } } };
    expect(pieceCard(startSession([ofRouter], ofRouter.id), PIECE_ID.router(officeRouter.id))?.first).toBe('routes');
    expect(pieceCard(START, PIECE_ID.router(officeRouter.id))?.first).toBe('routes');
  });

  it('01-07: the laptop offers the tabs Terminal and Ajustes de red and opens on the terminal', () => {
    const start = startSession(INCIDENTS, '01-07');
    const card = pieceCard(start, PIECE_ID.device('your-laptop'));
    expect(card?.tabs.map((tab) => [tab.id, toPlainText(tab.label), toPlainText(tab.card.title)])).toEqual([
      ['terminal', 'Terminal', 'Terminal de tu-laptop'],
      ['settings', 'Ajustes de red', 'Ajustes de red de tu-laptop'],
    ]);
    expect(card).toMatchObject({ tabbed: true, first: 'terminal' });
  });

  it('no other piece of chapter 1 has more than one card', () => {
    const chapter1 = INCIDENTS.filter((incident) => incident.chapter === 1).map((incident) => startSession(INCIDENTS, incident.id));
    for (const session of chapter1) {
      const tabbed = [...session.world.devices.map((device) => PIECE_ID.device(device.id)), ...session.world.actors.map((actor) => PIECE_ID.actor(actor.id)), ...(session.world.routers ?? []).map((router) => PIECE_ID.router(router.id))].filter((id) => pieceCard(session, id)?.tabbed);
      expect(tabbed.length, session.incident.id).toBe(session.incident.id === '01-07' ? 1 : 0);
    }
  });

  it('a firewall piece and the pieces of a filter incident have no piece card', () => {
    const session = startSession([filterIncident('04-01')], '04-01');
    expect(pieceCard(session, PIECE_ID.firewall('sg-servidor2'))).toBeNull();
    expect(pieceCard(session, PIECE_ID.device('servidor2'))).toBeNull();
    expect(pieceCard(session, PIECE_ID.actor('attacker'))).toBeNull();
  });

  it('an identify incident opens the card of each device that has one, and a device that also owns the card that classifies offers both', () => {
    const identifying = identifyIncident();
    const plain = startSession([identifying], identifying.id);
    expect(ids(plain, PIECE_ID.device('printer'))).toEqual(['identify']);
    expect(pieceCard(plain, PIECE_ID.device('printer'))?.tabbed).toBe(false);
    expect(pieceCard(plain, PIECE_ID.device('marta-laptop'))).toBeNull();
    const classifying = classifyIncident();
    const sorted = startSession([classifying], classifying.id);
    expect(ids(sorted, PIECE_ID.device('your-laptop'))).toEqual(['identify', 'classify']);
    expect(labels(sorted, PIECE_ID.device('your-laptop'))).toEqual(['Preguntas', 'Clasificar']);
    expect(pieceCard(sorted, PIECE_ID.device('your-laptop'))?.first).toBe('identify');
    expect(pieceCard(sorted, PIECE_ID.device('printer'))).toBeNull();
  });

  it('a diagnose opens the terminal of the origin of the case and nothing else', () => {
    const session = startSession([diagnoseIncident()], diagnoseIncident().id);
    expect(ids(session, PIECE_ID.device('your-laptop'))).toEqual(['terminal']);
    expect(pieceCard(session, PIECE_ID.router(officeRouter.id))).toBeNull();
  });
});

describe('pieceCard of a web server', () => {
  const WEB = webSendIncident();
  const web = startSession([WEB], WEB.id);
  const server = PIECE_ID.actor(OFFICE_FLOORS.server.id);

  it('the server that owns a table of sites opens its sites card, alone, with the tab called Sitios', () => {
    expect(pieceCard(web, server)).toMatchObject({ tabbed: false, first: 'sites' });
    expect(ids(web, server)).toEqual(['sites']);
    expect(labels(web, server)).toEqual(['Sitios']);
  });

  it('a device that owns no table of sites has none, and the incident can name the sites card to open first', () => {
    expect(ids(web, PIECE_ID.device('lucia-laptop'))).not.toContain('sites');
    const named = startSession([{ ...WEB, send: { ...WEB.send, opensFirst: { [OFFICE_FLOORS.server.id]: 'sites' } } }], WEB.id);
    expect(pieceCard(named, server)?.first).toBe('sites');
  });
});
