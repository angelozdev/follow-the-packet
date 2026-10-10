import { describe, expect, it } from 'vitest';
import { TERMINAL_TEXT } from '@/copy';
import { diagnoseIncident, sendIncident } from '@/testing';
import { sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { caseCard, type CaseCard } from './case-card';

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
