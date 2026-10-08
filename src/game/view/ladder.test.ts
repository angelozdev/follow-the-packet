import { describe, expect, it } from 'vitest';
import type { TermText } from '@/copy';
import { INCIDENTS, type Incident } from '@/levels';
import { unknownTerms } from '@/levels/ladder';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { barrierCard } from './barrier';
import { inspect } from './inspection';
import { pieceViews } from './pieces';

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
  const doors = pieceViews(start)
    .filter((piece) => piece.configurable)
    .flatMap((piece) => barrierCard(start, piece.id) ?? []);
  const placed = doors.flatMap((door) =>
    incident.chips.what.flatMap((what) => incident.chips.from.map((from) => sessionReducer(start, { type: 'placeRule', sgId: door.sgId, whatId: what.id, fromId: from.id }))),
  );
  return [start, solved, ...placed];
}

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s on the map', (_id, incident) => {
  it('shows only terms introduced in it or before', () => {
    for (const session of sessionsToCheck(incident)) expect(unknownTerms(shownTexts(session), session.known)).toEqual([]);
  });
});
