import { describe, expect, it } from 'vitest';
import { TABLE_TEXT, TERMINAL_TEXT, deviceName } from '@/copy';
import { ROUTE_DEFAULT } from '@/engine';
import { OFFICE_FLOORS, diagnoseIncident, repairableDiagnoseIncident, sendIncident } from '@/testing';
import { failingFixTaskIds, sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceViews } from '@/game/view/pieces';
import { caseCard, type CaseCard } from './case-card';
import { pieceCard } from './piece-card';
import { routesCard } from './table-card';

const DIAGNOSE = diagnoseIncident();
const { cases } = DIAGNOSE.diagnose;
const rightIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => option.correct);
const wrongIndex = (number: number) => cases[number - 1].cause.options.findIndex((option) => !option.correct);
const play = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([DIAGNOSE], DIAGNOSE.id));
const named = (index: number): SessionAction => ({ type: 'nameCause', index });
const cardOf = (session: Session): CaseCard => {
  const card = caseCard(session);
  if (!card) throw new Error('no case card');
  return card;
};

describe('the card of a case', () => {
  it('shows the report of the case and the tests the origin can send', () => {
    const card = cardOf(play());
    expect(card).toMatchObject({ number: 1, total: cases.length, report: cases[0].report, closed: false, last: false });
    expect(card.origins).toHaveLength(1);
    expect(card.origins[0]).toMatchObject({ fromId: 'origin', name: expect.stringContaining('tu-laptop') });
    expect(card.origins[0].tests.map((test) => test.line)).toEqual(['loopback', 'own', 'gateway', 'server'].map((id) => TERMINAL_TEXT.ping(cases[0].send.to.find((chip) => chip.id === id)?.address ?? '')));
    expect(card.origins[0].tests.map((test) => test.toId)).toEqual(['loopback', 'own', 'gateway', 'server']);
    expect(card.origins[0].tests.every((test) => test.messageId === 'ping' && test.fromId === 'origin')).toBe(true);
  });

  it('marks a test as sent once the player sent it', () => {
    const card = cardOf(play({ type: 'sendPacket', fromId: 'origin', toId: 'own', messageId: 'ping' }));
    expect(card.origins[0].tests.map((test) => test.sent)).toEqual([false, true, false, false]);
  });

  it('shows the question of the case and its options in the order the incident gives them, with no feedback yet', () => {
    const card = cardOf(play());
    expect(card.question).toBe(cases[0].cause.question);
    expect(card.options.map((option) => option.text)).toEqual(cases[0].cause.options.map((option) => option.text));
    expect(card.options.map((option) => [option.state, option.feedback])).toEqual([['untried', null], ['untried', null], ['untried', null]]);
  });

  it('a wrong option shows its own feedback and the others stay untried, so the player can try again', () => {
    const wrong = wrongIndex(1);
    const card = cardOf(play(named(wrong)));
    expect(card.closed).toBe(false);
    expect(card.options[wrong]).toMatchObject({ state: 'wrong', feedback: cases[0].cause.options[wrong].feedback });
    expect(card.options.filter((option) => option.state === 'untried')).toHaveLength(2);
  });

  it('the right option shows its feedback and closes the case, and the wrong ones tried stay marked', () => {
    const wrong = wrongIndex(1);
    const right = rightIndex(1);
    const card = cardOf(play(named(wrong), named(right)));
    expect(card.closed).toBe(true);
    expect(card.options[right]).toMatchObject({ state: 'right', feedback: cases[0].cause.options[right].feedback });
    expect(card.options[wrong].state).toBe('wrong');
  });

  it('the next case shows its own report, its own tests and untried options', () => {
    const second = cardOf(play(named(rightIndex(1)), { type: 'nextCase' }));
    expect(second).toMatchObject({ number: 2, report: cases[1].report, closed: false });
    expect(second.origins[0].tests.map((test) => test.toId)).toEqual(['typo', 'printer']);
    expect(second.options.every((option) => option.state === 'untried')).toBe(true);
  });

  it('knows the last case, and has no card for an incident that is not a diagnose', () => {
    const closeAll = cases.flatMap((_, index) => [named(rightIndex(index + 1)), { type: 'nextCase' } as const]);
    const last = cardOf(play(...closeAll.slice(0, -1)));
    expect(last).toMatchObject({ number: cases.length, last: true, closed: true });
    expect(caseCard(startSession([sendIncident()], sendIncident().id))).toBeNull();
  });
});

describe('the card of a case with a fix', () => {
  const REPAIRABLE = repairableDiagnoseIncident();
  const fixed = REPAIRABLE.diagnose.cases.findIndex(({ fix }) => fix);
  const { fix } = REPAIRABLE.diagnose.cases[fixed];
  const { provider, backbone, server } = OFFICE_FLOORS;
  const right = (index: number) => REPAIRABLE.diagnose.cases[index].cause.options.findIndex((option) => option.correct);
  const wrong = (index: number) => REPAIRABLE.diagnose.cases[index].cause.options.findIndex((option) => !option.correct);
  const reaching = (index: number): SessionAction[] =>
    REPAIRABLE.diagnose.cases.slice(0, index).flatMap((spec, at) => [...(spec.fix?.solution ?? []), named(right(at)), { type: 'nextCase' } as const]);
  const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([REPAIRABLE], REPAIRABLE.id));
  const atTheFix = (...actions: SessionAction[]): Session => playing(...reaching(fixed), ...actions);
  const routerPiece = PIECE_ID.router(provider.id);
  const sendPing: SessionAction = { type: 'sendPacket', fromId: 'origin', toId: 'server', messageId: 'ping' };
  const solution = fix!.solution;

  it('a case with a fix offers the table of its fix next to its terminal', () => {
    const session = atTheFix();
    const card = cardOf(session);
    expect(card.repair).toEqual({
      tables: [{ pieceId: routerPiece, title: TABLE_TEXT.routes.title(deviceName(session.world, provider.id)) }],
      tasks: [{ id: 'server', text: fix!.tasks[0].text, done: false }],
    });
    const table = pieceCard(session, routerPiece);
    expect(table?.tabs.map((tab) => tab.id)).toEqual(['routes']);
    expect(table?.tabbed).toBe(false);
    expect(table?.tabs[0].card).toEqual(routesCard(session, routerPiece));
    const routes = routesCard(session, routerPiece);
    expect(routes).toMatchObject({ kind: 'routes', tableId: 'routes', ownerId: provider.id, add: TABLE_TEXT.routes.add, problem: null });
    expect(routes?.trays?.map((tray) => [tray.name, tray.chips.map((chip) => chip.id)])).toEqual([['destination', [ROUTE_DEFAULT, server.range]], ['nextHop', [OFFICE_FLOORS.officeRouter.id, backbone.id]]]);
    const terminal = pieceCard(session, PIECE_ID.device('marta-laptop'));
    expect(terminal?.tabs.map((tab) => tab.id)).toEqual(['terminal']);
    expect(pieceViews(session).find((piece) => piece.id === routerPiece)).toMatchObject({ configurable: true, locked: false });
  });

  it('a case without a fix offers no table', () => {
    for (const index of [0, 3, 5]) {
      const session = playing(...reaching(index));
      expect(session.caseIndex).toBe(index);
      expect(cardOf(session).repair, `case ${index + 1}`).toBeNull();
      expect(pieceCard(session, routerPiece), `case ${index + 1}`).toBeNull();
      expect(pieceViews(session).find((piece) => piece.id === routerPiece), `case ${index + 1}`).toMatchObject({ configurable: false, locked: true });
      const edited = sessionReducer(session, { type: 'removeEntry', tableId: 'routes', entryId: ROUTE_DEFAULT });
      expect(edited, `case ${index + 1}`).toBe(session);
    }
  });

  it('shows the problem of a refused entry in the table of its case, and the next case keeps none', () => {
    const [, placeServer] = solution;
    const refused = atTheFix({ type: 'placeEntry', tableId: 'routes', picks: { destination: ROUTE_DEFAULT, nextHop: backbone.id } });
    expect(routesCard(refused, routerPiece)?.problem).toBe(TABLE_TEXT.refused(TABLE_TEXT.problems['destination-has-route']));
    expect(routesCard(sessionReducer(refused, placeServer), routerPiece)?.problem).toBeNull();
    const next = [...solution, named(right(fixed)), { type: 'nextCase' } as const].reduce(sessionReducer, refused);
    expect(next.entryProblem).toBeNull();
    expect(routesCard(next, routerPiece)).toBeNull();
  });

  it('the case closes only when the cause is named and the tasks of its fix hold', () => {
    const [removeDefault, placeServer] = solution;
    const closedAfter = (...actions: SessionAction[]) => cardOf(atTheFix(...actions)).closed;
    expect(closedAfter(named(right(fixed)))).toBe(false);
    expect(closedAfter(named(right(fixed)), sendPing)).toBe(false);
    expect(closedAfter(named(right(fixed)), removeDefault, placeServer)).toBe(false);
    expect(closedAfter(removeDefault, placeServer)).toBe(false);
    expect(closedAfter(removeDefault, placeServer, sendPing)).toBe(false);
    expect(closedAfter(removeDefault, placeServer, sendPing, named(wrong(fixed)))).toBe(false);
    expect(closedAfter(named(right(fixed)), ...solution)).toBe(true);
    expect(closedAfter(...solution, named(right(fixed)))).toBe(true);
    expect(closedAfter(named(wrong(fixed)), named(right(fixed)), ...solution)).toBe(true);
  });

  it('marks the task of the fix once it holds, and unmarks it when the world changes again', () => {
    const [removeDefault, placeServer, send] = solution;
    expect(cardOf(atTheFix(removeDefault, placeServer)).repair?.tasks.map((task) => task.done)).toEqual([false]);
    expect(cardOf(atTheFix(removeDefault, placeServer, send)).repair?.tasks.map((task) => task.done)).toEqual([true]);
    expect(cardOf(atTheFix(removeDefault, placeServer, send, { type: 'removeEntry', tableId: 'routes', entryId: server.range })).repair?.tasks.map((task) => task.done)).toEqual([false]);
  });

  it('the reference solution of a case with a fix repairs the world of that case', () => {
    const before = atTheFix(sendPing);
    expect(before.sent.map((packet) => packet.trace.outcome)).toEqual(['ttl-exceeded']);
    expect(failingFixTaskIds(before)).toEqual(['server']);
    const after = atTheFix(...solution);
    expect(after.sent.map((packet) => packet.trace.outcome)).toEqual(['replied']);
    expect(failingFixTaskIds(after)).toEqual([]);
    expect(after.world.routers?.find((router) => router.id === provider.id)?.routes).toEqual([{ to: server.range, next: backbone.id }]);
    expect(before.world.routers?.find((router) => router.id === provider.id)?.routes).toEqual([{ to: ROUTE_DEFAULT, next: OFFICE_FLOORS.officeRouter.id }]);
  });
});
