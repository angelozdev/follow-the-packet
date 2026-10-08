import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { countStars, isTight } from './stars';

describe('stars', () => {
  it('counts the stars earned', () => {
    expect(countStars({ closed: true, tight: false, explained: true })).toBe(2);
  });

  it('a world that lets nothing in opens nothing extra', () => {
    const incident = INCIDENTS[0];
    expect(isTight(startWorld(INCIDENTS, incident.id), incident.flows)).toBe(true);
  });

  it('ping from all of internet opens too much', () => {
    const incident = INCIDENTS[0];
    const wide = applyMove(startWorld(INCIDENTS, incident.id), incident, { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.internet.id });
    expect(isTight(wide, incident.flows)).toBe(false);
  });
});
