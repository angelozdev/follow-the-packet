import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import { OFFICE_FLOORS, NAME_SERVER_PIECES, classifyIncident, filterIncident, identifyIncident, namesSendIncident, outboundFilterIncident, sendIncident, webSendIncident } from '@/testing';
import { startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceViews } from '@/game/view/pieces';
import { pieceCard } from '@/game/view/cards/piece-card';
import { PANEL_TABS, TAB_OF_PART, panelOf, type Panel } from './panel';

const NAMES = namesSendIncident();
const START = startSession([NAMES], NAMES.id);
const { officeRouter } = OFFICE_FLOORS;
const { resolver, authoritative } = NAME_SERVER_PIECES;
const LAPTOP = PIECE_ID.device('your-laptop');
const ELEVEN_KINDS = ['terminal', 'browser', 'identify', 'classify', 'settings', 'services', 'routes', 'translations', 'records', 'cache', 'sites'];

const tabIds = (panel: Panel) => panel.tabs.map((tab) => tab.id);
const partIds = (panel: Panel, tabId: string) => panel.tabs.find((tab) => tab.id === tabId)?.parts.map((part) => part.id);
const startOf = (incident: Parameters<typeof startSession>[0][number]): Session => startSession([incident], incident.id);
const isInOrder = (ids: string[]) => ids.every((id, index) => index === 0 || PANEL_TABS.indexOf(id as (typeof PANEL_TABS)[number]) > PANEL_TABS.indexOf(ids[index - 1] as (typeof PANEL_TABS)[number]));

describe('panelOf', () => {
  it('the panel of a piece shows its tabs in the fixed order and draws none the piece lacks', () => {
    expect(PANEL_TABS).toEqual(['status', 'settings', 'tables', 'terminal', 'browser', 'questions']);
    expect(tabIds(panelOf(START, LAPTOP))).toEqual(['status', 'settings', 'tables', 'terminal']);
    expect(tabIds(panelOf(START, PIECE_ID.router(officeRouter.id)))).toEqual(['status', 'tables']);
    expect(tabIds(panelOf(START, PIECE_ID.actor(resolver.id)))).toEqual(['status', 'tables']);
    expect(tabIds(panelOf(START, PIECE_ID.device('lucia-laptop')))).toEqual(['status', 'settings']);
    const sending = sendIncident();
    expect(tabIds(panelOf(startOf(sending), PIECE_ID.device('printer')))).toEqual(['status']);
    const web = startOf(webSendIncident());
    expect(tabIds(panelOf(web, LAPTOP))).toEqual(['status', 'settings', 'tables', 'terminal', 'browser']);
    expect(panelOf(START, LAPTOP).tabs.map((tab) => toPlainText(tab.label))).toEqual(['Estado', 'Ajustes', 'Tablas', 'Terminal']);
    expect(panelOf(web, LAPTOP).tabs.map((tab) => toPlainText(tab.label))).toEqual(['Estado', 'Ajustes', 'Tablas', 'Terminal', 'Navegador']);
  });

  it('every piece of every registered incident has a panel model whose tabs follow the fixed order', () => {
    const wrong: string[] = [];
    for (const { id } of INCIDENTS) {
      const session = startSession(INCIDENTS, id);
      for (const { id: pieceId } of pieceViews(session)) {
        const ids = tabIds(panelOf(session, pieceId));
        if (ids[0] !== 'status' || !isInOrder(ids)) wrong.push(`${id} ${pieceId}: ${ids.join(' ')}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the eleven kinds of content of today each have a tab, and a section or a ficha where the tab holds several', () => {
    const seen = new Map<string, string>();
    for (const { id } of INCIDENTS) {
      const session = startSession(INCIDENTS, id);
      for (const { id: pieceId } of pieceViews(session)) {
        for (const tab of panelOf(session, pieceId).tabs) {
          for (const part of tab.parts) {
            expect(tab.id, `${id} ${pieceId} ${part.id}`).toBe(TAB_OF_PART[part.id]);
            seen.set(part.id, tab.holds);
          }
        }
      }
    }
    expect([...seen.keys()].filter((kind) => kind !== 'rules').sort()).toEqual([...ELEVEN_KINDS].sort());
    expect(Object.fromEntries(ELEVEN_KINDS.map((kind) => [kind, TAB_OF_PART[kind as keyof typeof TAB_OF_PART]]))).toEqual({
      terminal: 'terminal',
      browser: 'browser',
      identify: 'questions',
      classify: 'questions',
      settings: 'settings',
      services: 'settings',
      routes: 'tables',
      translations: 'tables',
      records: 'tables',
      cache: 'tables',
      sites: 'tables',
    });
    expect(seen.get('settings')).toBe('sections');
    expect(seen.get('routes')).toBe('fichas');
    expect(seen.get('identify')).toBe('fichas');
    expect(seen.get('terminal')).toBe('one');
  });

  it('settings and services are sections of Ajustes, one under the other', () => {
    const [, listen] = NAMES.send.settings!;
    const both = { ...NAMES, send: { ...NAMES.send, settings: [...NAMES.send.settings!, { ...listen, id: 'own-app', deviceId: 'your-laptop' }] } };
    const panel = panelOf(startOf(both), LAPTOP);
    const settings = panel.tabs.find((tab) => tab.id === 'settings');
    expect(settings).toMatchObject({ holds: 'sections' });
    expect(partIds(panel, 'settings')).toEqual(['settings', 'services']);
    expect(settings?.parts.map((part) => toPlainText(part.label))).toEqual(['Ajustes de red', 'Servicios']);
  });

  it('routes, translations, records, cache and sites are fichas of Tablas', () => {
    expect(partIds(panelOf(START, PIECE_ID.router(officeRouter.id)), 'tables')).toEqual(['routes', 'translations']);
    expect(partIds(panelOf(START, PIECE_ID.actor(authoritative.id)), 'tables')).toEqual(['records']);
    expect(partIds(panelOf(START, PIECE_ID.actor(resolver.id)), 'tables')).toEqual(['cache']);
    expect(partIds(panelOf(startOf(webSendIncident()), PIECE_ID.actor(OFFICE_FLOORS.server.id)), 'tables')).toEqual(['sites']);
    const tables = panelOf(START, PIECE_ID.router(officeRouter.id)).tabs.find((tab) => tab.id === 'tables');
    expect(tables).toMatchObject({ holds: 'fichas' });
    expect(tables?.parts.map((part) => toPlainText(part.label))).toEqual(['Tabla de rutas', 'Tabla de traducciones']);
  });

  it('the rules of a firewall are in Tablas with the two fichas of direction', () => {
    const outbound = outboundFilterIncident();
    const panel = panelOf(startOf(outbound), PIECE_ID.firewall('fw-you'));
    expect(tabIds(panel)).toEqual(['status', 'tables']);
    expect(partIds(panel, 'tables')).toEqual(['rules']);
    const [rules] = panel.tabs[1].parts;
    const labels = rules.id === 'rules' ? rules.card.outbound?.tabs : undefined;
    expect([labels?.inbound, labels?.outbound].map((label) => label && toPlainText(label))).toEqual(['entrada', 'salida']);
    expect(panel.first).toBe('tables');
    const first = filterIncident('04-01');
    const group = panelOf(startOf(first), PIECE_ID.firewall('sg-servidor2'));
    const [only] = group.tabs[1].parts;
    expect(only.id === 'rules' && only.card.outbound).toBeUndefined();
  });

  it('identify and classify are fichas of Preguntas and a piece with one of them has no ficha', () => {
    const classifying = startOf(classifyIncident());
    const both = panelOf(classifying, LAPTOP);
    expect(tabIds(both)).toEqual(['status', 'questions']);
    expect(both.tabs[1]).toMatchObject({ holds: 'fichas' });
    expect(partIds(both, 'questions')).toEqual(['identify', 'classify']);
    const identifying = startOf(identifyIncident());
    expect(partIds(panelOf(identifying, PIECE_ID.device('printer')), 'questions')).toEqual(['identify']);
  });

  it('a locked piece has only Estado', () => {
    const session = startSession(INCIDENTS, '04-01');
    const locked = pieceViews(session).find((piece) => piece.locked);
    expect(locked).toBeDefined();
    expect(tabIds(panelOf(session, locked!.id))).toEqual(['status']);
    expect(panelOf(session, locked!.id).first).toBe('status');
  });

  it('the firewall of a diagnose, which the player cannot set, has only Estado', () => {
    const diagnosing = startSession(INCIDENTS, '01-14');
    const firewalls = pieceViews(diagnosing).filter((piece) => piece.kind === 'firewall');
    expect(firewalls.length).toBeGreaterThan(0);
    for (const { id } of firewalls) expect(tabIds(panelOf(diagnosing, id))).toEqual(['status']);
  });

  it('once the incident is over a piece has only Estado', () => {
    for (const phase of ['explaining', 'result'] as const) {
      const over: Session = { ...START, phase };
      expect(tabIds(panelOf(over, LAPTOP)), phase).toEqual(['status']);
      expect(panelOf(over, LAPTOP).first, phase).toBe('status');
      expect(panelOf(over, LAPTOP).roles, phase).toBeUndefined();
    }
  });

  it('the panel opens on the tab the card used to open and on Estado when the piece has no other', () => {
    for (const { id } of INCIDENTS) {
      const session = startSession(INCIDENTS, id);
      for (const { id: pieceId } of pieceViews(session)) {
        const card = pieceCard(session, pieceId);
        const { first, tabs } = panelOf(session, pieceId);
        if (card) expect(first, `${id} ${pieceId}`).toBe(TAB_OF_PART[card.first]);
        expect(tabs.some((tab) => tab.id === first), `${id} ${pieceId}`).toBe(true);
      }
    }
    expect(panelOf(START, LAPTOP).first).toBe('settings');
    expect(panelOf(START, PIECE_ID.router(officeRouter.id)).first).toBe('tables');
    expect(panelOf(startOf(sendIncident()), PIECE_ID.device('printer')).first).toBe('status');
    expect(panelOf(startOf(sendIncident()), LAPTOP).first).toBe('terminal');
    expect(panelOf(startOf(outboundFilterIncident()), PIECE_ID.firewall('fw-you')).first).toBe('tables');
  });

  it('the panel of a server of the internet carries the line of its roles', () => {
    expect(panelOf(START, PIECE_ID.actor(authoritative.id)).roles).toBeDefined();
    expect(panelOf(START, LAPTOP).roles).toBeUndefined();
  });
});
