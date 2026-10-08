import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { ruleIdFor } from '@/levels/incident';
import { isIntruding, sessionReducer, startSession, starsOf, type Session, type SessionAction } from './session';
import { countStars } from './stars';
import { STABLE_MS } from './tasks';

const FIRST = INCIDENTS[0];
const SECOND_MS = 1000;
const FULL_STARS = 3;
const place = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'placeRule', sgId, whatId, fromId });
const remove = (sgId: string, whatId: string, fromId: string): SessionAction => ({ type: 'removeRule', sgId, ruleId: ruleIdFor(whatId, fromId) });
const FIX = place(SG.servidor2, WHAT.ping.id, FROM.servidor1.id);
const UNFIX = remove(SG.servidor2, WHAT.ping.id, FROM.servidor1.id);
const WIDE = place(SG.servidor2, WHAT.ping.id, FROM.internet.id);
const UNWIDE = remove(SG.servidor2, WHAT.ping.id, FROM.internet.id);
const tick = (ms: number): SessionAction => ({ type: 'tick', ms });
const choose = (index: number): SessionAction => ({ type: 'chooseExplanation', index });
const RIGHT = FIRST.explanation.findIndex((option) => option.correct);
const WRONG = FIRST.explanation.findIndex((option) => !option.correct);

const play = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(INCIDENTS, FIRST.id));
const taskMs = (session: Session): number => session.taskMs[session.incident.tasks[0].id];

describe('incident session', () => {
  it('starts playing, with the bar at zero and nothing getting in', () => {
    const start = play();
    expect(start.phase).toBe('playing');
    expect(taskMs(start)).toBe(0);
    expect(isIntruding(start)).toBe(false);
    expect(start.alerts).toBe(0);
  });

  it('a rule on the door of servidor1 does not fix the ping', () => {
    const session = play(place(SG.servidor1, WHAT.ping.id, FROM.servidor1.id), tick(STABLE_MS));
    expect(session.phase).toBe('playing');
    expect(taskMs(session)).toBe(0);
  });

  it('the bar fills in 3 seconds and then the incident closes', () => {
    const twoSeconds = play(FIX, tick(SECOND_MS), tick(SECOND_MS));
    expect(twoSeconds.phase).toBe('playing');
    expect(taskMs(twoSeconds)).toBe(2 * SECOND_MS);
    expect(sessionReducer(twoSeconds, tick(SECOND_MS)).phase).toBe('explaining');
  });

  it('the bar drops to zero when the condition breaks', () => {
    expect(taskMs(play(FIX, tick(2 * SECOND_MS), UNFIX, tick(SECOND_MS)))).toBe(0);
  });

  it('a forbidden flow that gets in blocks the close and warns once per episode', () => {
    const filling = play(FIX, tick(2 * SECOND_MS));
    expect(taskMs(filling)).toBe(2 * SECOND_MS);
    const opened = [WIDE, tick(SECOND_MS)].reduce(sessionReducer, filling);
    expect(taskMs(opened)).toBe(0);
    expect(opened.phase).toBe('playing');
    expect(isIntruding(opened)).toBe(true);
    expect(opened.alerts).toBe(1);
    const stillOpen = play(FIX, WIDE, tick(2 * STABLE_MS));
    expect(stillOpen.phase).toBe('playing');
    expect(sessionReducer(opened, place(SG.servidor1, WHAT.ping.id, FROM.internet.id)).alerts).toBe(1);
    expect([UNWIDE, WIDE].reduce(sessionReducer, opened).alerts).toBe(2);
  });

  it('closing right, tight and with the right explanation gives 3 stars', () => {
    const explained = play(FIX, tick(STABLE_MS), choose(RIGHT));
    expect(starsOf(explained)).toEqual({ closed: true, tight: true, explained: true });
    expect(countStars(starsOf(explained))).toBe(FULL_STARS);
  });

  it('only the first explanation counts', () => {
    const session = play(FIX, tick(STABLE_MS), choose(WRONG), choose(RIGHT));
    expect(session.choice).toBe(WRONG);
    expect(starsOf(session).explained).toBe(false);
  });

  it('an explanation out of range is ignored, and the result needs a choice', () => {
    const closed = play(FIX, tick(STABLE_MS));
    expect(sessionReducer(closed, choose(FIRST.explanation.length))).toBe(closed);
    expect(sessionReducer(closed, { type: 'showResult' })).toBe(closed);
    expect(play(FIX, tick(STABLE_MS), choose(RIGHT), { type: 'showResult' }).phase).toBe('result');
  });

  it('nothing on the map changes once the incident closed', () => {
    const closed = play(FIX, tick(STABLE_MS));
    expect(sessionReducer(closed, WIDE)).toBe(closed);
  });

  it('hints come one by one, up to two', () => {
    const hint: SessionAction = { type: 'showHint' };
    expect(play(hint).hintsShown).toBe(1);
    expect(play(hint, hint, hint).hintsShown).toBe(FIRST.hints.length);
  });

  it('a door the ladder keeps closed cannot be changed', () => {
    const start = startSession(INCIDENTS, FIRST.id);
    const closedDoors: Session = { ...start, parts: { ...start.parts, inboundRules: false } };
    expect(sessionReducer(closedDoors, FIX)).toBe(closedDoors);
  });
});
