import { describe, expect, it } from 'vitest';
import { INCIDENTS, applyMove, startWorld } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident, sendIncident } from '@/testing';
import { countStars, earnsMiddle, isTight } from './stars';

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
