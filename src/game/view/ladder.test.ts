import { describe, expect, it } from 'vitest';
import { termsIn, toPlainText, unofficialNames, type TermText } from '@/copy';
import { INCIDENTS, type Incident } from '@/levels';
import { incidentTexts, unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { firewallCard } from './firewall-card';
import { inspect } from './inspection';
import { pieceViews, type PieceKind } from './pieces';

const NAMED_BY_KIND: PieceKind[] = ['firewall', 'edge'];
const RETIRED_NAMES = ['puerta', 'todo internet', 'entrada desde internet', 'red privada', 'ping completo', 'linux ignora el ping', 'desde dónde'];

function shownTexts(session: Session): TermText[] {
  const pieces = pieceViews(session);
  const ids = [...pieces.map((piece) => piece.id), ...session.runs.map((run) => run.pieceId)];
  const inspected = ids.flatMap((id) => {
    const shown = inspect(session, id);
    return shown ? [shown.title, ...shown.fields.flatMap((field) => [field.label, ...field.lines])] : [];
  });
  return [...pieces.map((piece) => piece.label), ...session.runs.map((run) => run.label), ...inspected];
}

function sessionsToCheck(incident: Incident): Session[] {
  const start = startSession(INCIDENTS, incident.id);
  const solved = incident.solution.reduce(sessionReducer, start);
  const cards = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => firewallCard(start, piece.id) ?? []);
  const placed = cards.flatMap((card) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', firewallId: card.firewallId, whatId: what.id, fromId: from.id }))),
  );
  return [start, solved, ...placed];
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s on the map', (_id, incident) => {
  it('shows only terms introduced in it or before', () => {
    for (const session of sessionsToCheck(incident)) expect(unknownTerms(shownTexts(session), session.known)).toEqual([]);
  });

  it('names every piece by the official name of its term', () => {
    for (const session of sessionsToCheck(incident)) {
      const pieces = pieceViews(session);
      expect(unofficialNames(pieces.map((piece) => piece.label))).toEqual([]);
      for (const piece of pieces.filter((candidate) => NAMED_BY_KIND.includes(candidate.kind))) expect(termsIn(piece.label), piece.id).toContain(piece.term);
    }
  });

  it('uses none of the names the first playtest retired', () => {
    const texts = [...incidentTexts(incident), ...sessionsToCheck(incident).flatMap(shownTexts)].map((text) => toPlainText(text).toLowerCase());
    expect(RETIRED_NAMES.filter((name) => texts.some((text) => text.includes(name)))).toEqual([]);
  });
});
