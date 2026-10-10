import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident, sendIncident } from '@/testing';
import { countStars, earnsMiddle, everyCauseAtFirstTry, firstTry, isTight, noHintInAnyCase, type CaseResult } from './stars';

describe('stars', () => {
  it('counts the stars earned', () => {
    expect(countStars({ closed: true, middle: false, explained: true })).toBe(2);
  });

  it('a world that lets nothing in opens nothing extra', () => {
    const incident = filterIncident('04-01');
    expect(isTight(startWorld(INCIDENTS, incident.id), incident.flows)).toBe(true);
  });

  it('ping from all of internet opens too much', () => {
    const incident = filterIncident('04-01');
    const wide = applyMove(startWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(isTight(wide, incident.flows)).toBe(false);
  });

  it('the middle star of a filter is opening only what is needed, and of a send, closing without hints', () => {
    const first = filterIncident('04-01');
    const world = startWorld(INCIDENTS, first.id);
    expect(earnsMiddle(first, world, 2)).toBe(true);
    expect(earnsMiddle(sendIncident(), world, 0)).toBe(true);
    expect(earnsMiddle(sendIncident(), world, 1)).toBe(false);
  });
});

describe('the stars of a diagnose', () => {
  const SEVEN = 7;
  const clean = (): CaseResult[] => Array.from({ length: SEVEN }, () => ({ picks: [1], hints: 0 }));
  const withResult = (index: number, patch: Partial<CaseResult>): CaseResult[] => clean().map((result, at) => (at === index ? { ...result, ...patch } : result));

  it('the middle star is no hint asked in any case', () => {
    expect(noHintInAnyCase(clean())).toBe(true);
    expect(noHintInAnyCase(withResult(0, { hints: 1 }))).toBe(false);
    expect(noHintInAnyCase(withResult(SEVEN - 1, { hints: 2 }))).toBe(false);
  });

  it('the explained star needs every cause right at the first try', () => {
    expect(everyCauseAtFirstTry(clean(), SEVEN)).toBe(true);
    expect(everyCauseAtFirstTry(withResult(3, { picks: [0, 1] }), SEVEN)).toBe(false);
    expect(everyCauseAtFirstTry(clean().slice(1), SEVEN)).toBe(false);
  });

  it('a case is right at the first try when its right cause was the only one named', () => {
    expect(firstTry({ picks: [2], hints: 1 })).toBe(true);
    expect(firstTry({ picks: [0, 2], hints: 0 })).toBe(false);
  });
});
