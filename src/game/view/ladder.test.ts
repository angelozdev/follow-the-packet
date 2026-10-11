import { describe, expect, it } from 'vitest';
import { TERMS, parseTermText, termsIn, toPlainText, unofficialNames, type TermId, type TermText } from '@/copy';
import { ROUTE_DEFAULT, applyAction, type Firewall, type Network } from '@/engine';
import { INCIDENTS, isGuided, sendCombinations, type CaseSpec, type DiagnoseIncident, type Incident, type SendIncident } from '@/levels';
import { incidentTexts, unknownTerms } from '@/levels/ladder';
import { EVERY_TERM, officeNet, sendIncident, withDevice } from '@/testing';
import { ADDRESS, MESSAGE, ORIGIN, ROUTER } from '@/levels/01-first-day/shared';
import { currentCase, sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { firewallCard } from './cards/firewall-card';
import { inspect } from './inspection';
import { parsePieceId } from './piece-id';
import { pieceViews, type PieceKind } from './pieces';
import { terminalCard, terminalLine } from '@/game/view/cards/terminal/terminal-card';
import { tracerouteLines } from '@/game/view/cards/terminal/traceroute-lines';

const NAMED_BY_KIND: PieceKind[] = ['firewall', 'edge', 'internet'];
const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];
const GATEWAY_NAME = TERMS['default-gateway'].name;
const FIREWALL_INCIDENT_ORDER = 11;
const FIRST_HIDDEN_FIREWALL = 4;

function terminalTexts(session: Session, pieceIds: string[]): TermText[] {
  return pieceIds.flatMap((id) => {
    const card = terminalCard(session, id);
    if (!card) return [];
    const lines = session.sent.flatMap((packet) => terminalLine(session, { to: packet.toId, message: packet.messageId }) ?? []);
    const outputs = session.sent.flatMap((packet) => {
      const output = tracerouteLines(session, { from: packet.fromId, to: packet.toId, message: packet.messageId });
      return output ? [...output.notes, ...(output.error ? [output.error] : [])] : [];
    });
    return [card.title, ...card.trays.flatMap((tray) => tray.chips.map((chip) => chip.label)), ...lines, ...outputs];
  });
}

function shownTexts(session: Session): TermText[] {
  const pieces = pieceViews(session);
  const packets = [...session.runs, ...session.sent];
  const ids = [...pieces.map((piece) => piece.id), ...packets.map((packet) => packet.pieceId)];
  const inspected = ids.flatMap((id) => {
    const shown = inspect(session, id);
    return shown ? [shown.title, ...shown.fields.flatMap((field) => [field.label, ...field.lines])] : [];
  });
  return [...pieces.map((piece) => piece.label), ...packets.map((packet) => packet.label), ...inspected, ...terminalTexts(session, ids)];
}

function sendMoves(offers: { send: SendIncident['send'] } | null): SessionAction[] {
  return offers ? sendCombinations(offers).map((combination) => ({ type: 'sendPacket', ...combination })) : [];
}

function movesToTry(incident: Incident, start: Session): SessionAction[] {
  if (incident.mechanic === 'send' || incident.mechanic === 'diagnose') return sendMoves(incident.mechanic === 'send' ? incident : currentCase(start));
  if (incident.mechanic === 'identify') return [];
  const cards = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => firewallCard(start, piece.id) ?? []);
  return cards.flatMap((card) =>
    incident.chips.what.flatMap((what) => [
      ...incident.chips.from.map((from) => ({ type: 'placeRule', firewallId: card.firewallId, whatId: what.id, fromId: from.id }) as const),
      ...(incident.chips.to ?? []).map((to) => ({ type: 'placeRule', firewallId: card.firewallId, whatId: what.id, toId: to.id, direction: 'outbound' }) as const),
    ]),
  );
}

function closeCase(spec: CaseSpec): SessionAction[] {
  return [{ type: 'nameCause', index: spec.cause.options.findIndex((option) => option.correct) }, { type: 'nextCase' }];
}

function sessionsOfCases(incident: DiagnoseIncident): Session[] {
  return incident.diagnose.cases.flatMap((_, index) => {
    const atCase = incident.diagnose.cases.slice(0, index).flatMap(closeCase).reduce(sessionReducer, startSession(INCIDENTS, incident.id));
    return [atCase, ...movesToTry(incident, atCase).map((move) => sessionReducer(atCase, move))];
  });
}

function sessionsToCheck(incident: Incident): Session[] {
  if (!isGuided(incident)) return sessionsOfCases(incident);
  const start = startSession(INCIDENTS, incident.id);
  const solved = incident.solution.reduce(sessionReducer, start);
  return [start, solved, ...movesToTry(incident, start).map((move) => sessionReducer(start, move))];
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s on the map', (_id, incident) => {
  it('shows only terms introduced in it or before', () => {
    for (const session of sessionsToCheck(incident)) expect(unknownTerms(shownTexts(session), session.known)).toEqual([]);
  });

  it('names every piece by the official name of its term', () => {
    for (const session of sessionsToCheck(incident)) {
      const pieces = pieceViews(session);
      expect(unofficialNames(pieces.map((piece) => piece.label))).toEqual([]);
      for (const piece of pieces.filter((candidate) => NAMED_BY_KIND.includes(candidate.kind))) {
        if (parsePieceId(piece.id)?.kind === 'router') expect(parseTermText(piece.label).map((segment) => segment.kind), piece.id).toEqual(['name']);
        else expect(termsIn(piece.label), piece.id).toContain(piece.term);
      }
    }
  });

  it('uses none of the names the first playtest retired', () => {
    const texts = [...incidentTexts(incident), ...sessionsToCheck(incident).flatMap(shownTexts)].map((text) => toPlainText(text).toLowerCase().replaceAll(GATEWAY_NAME, ''));
    expect(RETIRED_NAMES.filter((name) => texts.some((text) => text.includes(name)))).toEqual([]);
  });
});

describe('the firewall before the incident that introduces it', () => {
  const OUTBOUND_FIREWALL: Firewall = { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
  const WORLDS: Network[] = [
    withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }),
    withDevice({ ...officeNet(), firewalls: [OUTBOUND_FIREWALL] }, 'your-laptop', { firewallIds: [OUTBOUND_FIREWALL.id] }),
  ];
  const incidentOn = (base: Network, ...introduced: TermId[]): SendIncident => ({ ...sendIncident(), base, introduces: [...sendIncident().introduces, ...introduced] });

  function sessionsOf(incident: SendIncident): Session[] {
    const start = startSession([incident], incident.id);
    return [start, ...sendCombinations(incident).map((combination) => sessionReducer(start, { type: 'sendPacket', ...combination }))];
  }

  const runsOf = (sessions: Session[]) => sessions.flatMap((session) => [...session.runs, ...session.sent]);
  const mentionsFirewall = (sessions: Session[]) => sessions.flatMap(shownTexts).filter((text) => /firewall|regla/i.test(toPlainText(text)) || termsIn(text).some((term) => term === 'firewall' || term === 'rule'));

  const BEFORE_THE_GUARD = INCIDENTS.filter((incident) => incident.chapter === 1 && incident.order < FIREWALL_INCIDENT_ORDER);
  const namesFirewall = (text: TermText) => /firewall/i.test(toPlainText(text)) || termsIn(text).some((term) => term === 'firewall' || term === 'rule');

  it('shows no firewall, in any text or piece, before the incident that introduces it', () => {
    for (const base of WORLDS) {
      const hidden = sessionsOf(incidentOn(base));
      expect(runsOf(hidden).filter((run) => run.hiddenStop).length).toBeGreaterThan(0);
      expect(runsOf(hidden).filter((run) => run.blocked)).toEqual([]);
      expect(hidden.flatMap(pieceViews).filter((piece) => piece.kind === 'firewall')).toEqual([]);
      expect(mentionsFirewall(hidden)).toEqual([]);
    }
    expect(BEFORE_THE_GUARD).toHaveLength(FIREWALL_INCIDENT_ORDER - 1);
    for (const incident of BEFORE_THE_GUARD) {
      const sessions = sessionsToCheck(incident);
      expect(runsOf(sessions).filter((run) => run.blocked), incident.id).toEqual([]);
      expect(sessions.flatMap(pieceViews).filter((piece) => piece.kind === 'firewall'), incident.id).toEqual([]);
      expect([...incidentTexts(incident), ...sessions.flatMap(shownTexts)].filter(namesFirewall), incident.id).toEqual([]);
    }
  });

  it('keeps the firewall of laptop-marta in the world from 01-05 on while no incident before the one that introduces it shows it', () => {
    const withFirewall = BEFORE_THE_GUARD.filter((incident) => startSession(INCIDENTS, incident.id).world.firewalls.length > 0).map((incident) => incident.id);
    expect(withFirewall).toEqual(['01-05', '01-06', '01-07', '01-08', '01-09', '01-10']);
    expect(runsOf(sessionsToCheck(BEFORE_THE_GUARD[FIRST_HIDDEN_FIREWALL])).filter((run) => run.hiddenStop).length).toBeGreaterThan(0);
  });

  it('shows it once the incident introduces it, so the check above can fail', () => {
    for (const base of WORLDS) {
      const shown = sessionsOf(incidentOn(base, 'firewall'));
      expect(runsOf(shown).filter((run) => run.blocked).length).toBeGreaterThan(0);
      expect(shown.flatMap(pieceViews).filter((piece) => piece.kind === 'firewall')).not.toEqual([]);
      expect(mentionsFirewall(shown)).not.toEqual([]);
    }
  });
});

describe('the terms of a player who has finished a later chapter', () => {
  const THE_NETWORK_OF_NETWORKS = '01-08';
  const CHAPTER_2: Incident = { ...sendIncident(), id: '02-99', chapter: 2, order: 99, introduces: [...EVERY_TERM] };
  const AFTER_CHAPTER_2 = [...INCIDENTS, CHAPTER_2].sort((a, b) => a.chapter - b.chapter || a.order - b.order);
  const CHAPTER_2_TERMS: TermId[] = ['route', 'nat', 'net-unreachable'];
  const CHAPTER_2_FIELDS = /\(en internet\)|Ruta que usó|Traducción/;
  const TRIPS = [ADDRESS.server, ADDRESS.otherOffice, ADDRESS.printer].map((to) => ({ type: 'sendPacket', fromId: ORIGIN.you.id, toId: to.id, messageId: MESSAGE.ping.id }) as const);
  const again = startSession(AFTER_CHAPTER_2, THE_NETWORK_OF_NETWORKS);
  const first = startSession(INCIDENTS, THE_NETWORK_OF_NETWORKS);
  const tripsOf = (session: Session) => TRIPS.map((trip) => sessionReducer(session, trip));
  const boxOf = (session: Session) => inspect(session, session.sent[0].pieceId);
  const labelsOf = (session: Session) => boxOf(session)?.fields.map((field) => toPlainText(field.label)) ?? [];
  const withoutDefaultRoute = (session: Session): Session => ({ ...session, world: applyAction(session.world, { type: 'removeRoute', routerId: ROUTER.office.id, to: ROUTE_DEFAULT }) });
  const warningOfTheTrip = (session: Session) => sessionReducer(withoutDefaultRoute(session), TRIPS[0]).sent[0].warning;

  it('a player who finished chapter 2 and opens 01-08 again sees the box of chapter 1, with no header in the internet and no term of chapter 2', () => {
    expect(AFTER_CHAPTER_2.findIndex((incident) => incident.id === CHAPTER_2.id)).toBeGreaterThan(AFTER_CHAPTER_2.findIndex((incident) => incident.id === THE_NETWORK_OF_NETWORKS));
    expect(again.known).toEqual(first.known);
    expect(CHAPTER_2_TERMS.filter((term) => again.known.has(term))).toEqual([]);
    const trips = tripsOf(again);
    expect(trips.map((trip) => JSON.stringify(boxOf(trip)))).toEqual(tripsOf(first).map((trip) => JSON.stringify(boxOf(trip))));
    expect(trips.flatMap(labelsOf).filter((label) => CHAPTER_2_FIELDS.test(label))).toEqual([]);
    for (const trip of trips) expect(unknownTerms(shownTexts(trip), trip.known)).toEqual([]);
  });

  it('the same trip shows the header in the internet, the route and the translation once the terms of chapter 2 are known, so the check above can fail', () => {
    const [toServer] = tripsOf({ ...again, known: EVERY_TERM });
    expect(labelsOf(toServer).filter((label) => CHAPTER_2_FIELDS.test(label))).toHaveLength(3);
  });

  it('a router with no route is named Destination Host Unreachable on 01-08 after chapter 2 too, and Destination Net Unreachable only with the term', () => {
    expect(warningOfTheTrip(again)).toEqual({ term: 'host-unreachable', by: 'router' });
    expect(warningOfTheTrip({ ...again, known: EVERY_TERM })).toEqual({ term: 'net-unreachable', by: 'router' });
  });
});
