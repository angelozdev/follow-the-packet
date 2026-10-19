import { describe, expect, it } from 'vitest';
import type { PortLabels } from '@/copy';
import { lengthOf, positionAt, type Point } from '@/scene/map2d/layout/graph';
import { legTextAt } from '@/scene/map2d/marks/packet-tags';
import { FLOW_OFFSET, FLOW_PERIOD, PACKET_END_SECONDS, PACKET_SPEED, answerBackAt, distanceAt, flightPlan, flowCycles, keyframes, labelRide, motionOf, routeOf, sendCycle } from './flight-plan';

const PATH: Point[] = [
  [0, 0],
  [120, 0],
  [120, 240],
];
const LENGTH = 360;
const ROUTER_AT = 120;
const LEGS: PortLabels[] = [
  { request: 'TCP 51514 → 80', reply: 'TCP 80 → 51514' },
  { request: 'TCP 40001 → 80', reply: 'TCP 80 → 40001' },
];
const AT = (route: readonly Point[], distance: number) => positionAt(route, lengthOf(route), distance);
const WINDOW = (from: number, to: number) => ({ from, to });

describe('flightPlan', () => {
  it('a packet travels its path at 120 px per second', () => {
    const plan = flightPlan(PATH, 'arrived', 0);
    expect(PACKET_SPEED).toBe(120);
    expect(plan.turn).toBe(LENGTH / 120);
    expect(plan.travel).toBe(3);
    expect(plan.duration).toBe(3 + PACKET_END_SECONDS);
    expect([0, 1, 2.5, 3].map((seconds) => distanceAt(plan, seconds))).toEqual([0, 120, 300, 360]);
    expect(distanceAt(plan, 3.2)).toBe(LENGTH);
    expect(distanceAt(plan, -1)).toBe(0);
    expect(AT(routeOf(PATH, plan.end), distanceAt(plan, 1))).toEqual([120, 0]);
    expect(AT(routeOf(PATH, plan.end), distanceAt(plan, 2))).toEqual([120, 120]);
    const doubled = flightPlan([[0, 0], [720, 0]], 'arrived', 0);
    expect(doubled.travel).toBe(6);
    expect(plan.glyphs).toEqual({ going: WINDOW(0, 3) });
    expect(motionOf(plan, plan.duration)).toEqual({ keyTimes: [0, 3 / 3.5, 1], keyPoints: [0, 1, 1] });
  });

  it('an answered packet comes back as the ring of its protocol along the same path', () => {
    const plan = flightPlan(PATH, 'replied', 0);
    const route = routeOf(PATH, plan.end);
    expect(route).toEqual([...PATH, [120, 0], [0, 0]]);
    expect(plan.turn).toBe(3);
    expect(plan.travel).toBe(6);
    expect(plan.duration).toBe(6.5);
    expect(plan.glyphs).toEqual({ going: WINDOW(0, 3), answer: WINDOW(3, 6) });
    expect(AT(route, distanceAt(plan, 3))).toEqual([120, 240]);
    expect(AT(route, distanceAt(plan, 4))).toEqual([120, 120]);
    expect(AT(route, distanceAt(plan, 5))).toEqual([120, 0]);
    expect(AT(route, distanceAt(plan, 6))).toEqual([0, 0]);
    expect(plan.ending).toBeUndefined();
    expect(motionOf(plan, plan.duration)).toEqual({ keyTimes: [0, 6 / 6.5, 1], keyPoints: [0, 1, 1] });
  });

  it('a warning from a router comes back along the path from that router', () => {
    const plan = flightPlan(PATH, 'warned', 0);
    const route = routeOf(PATH, plan.end);
    expect(plan.glyphs).toEqual({ going: WINDOW(0, 3), answer: WINDOW(3, 6) });
    expect(AT(route, distanceAt(plan, plan.turn))).toEqual(PATH[2]);
    expect(AT(route, distanceAt(plan, plan.turn + 1))).toEqual([120, 120]);
    expect(AT(route, distanceAt(plan, plan.travel))).toEqual(PATH[0]);
    expect(plan.ending).toBeUndefined();
    expect(plan.labels.filter(({ back }) => back)).toEqual([]);
  });

  it("a warning that the sender's own device generates does not travel and appears at the end of the path", () => {
    const plan = flightPlan(PATH, 'self-warned', 0);
    expect(plan.travel).toBe(0);
    expect(plan.turn).toBe(0);
    expect(plan.duration).toBe(PACKET_END_SECONDS);
    expect(plan.glyphs).toEqual({ appears: WINDOW(0, PACKET_END_SECONDS) });
    expect(plan.ending).toEqual({ kind: 'appears', from: 0, to: PACKET_END_SECONDS });
    expect([0, 0.25, 0.5].map((seconds) => AT(routeOf(PATH, plan.end), distanceAt(plan, seconds)))).toEqual([PATH[2], PATH[2], PATH[2]]);
    expect(motionOf(plan, plan.duration)).toEqual({ keyTimes: [0, 1], keyPoints: [1, 1] });
    expect(plan.labels).toEqual([]);
  });

  it('a blocked packet bursts for half a second', () => {
    const plan = flightPlan(PATH, 'blocked', 0);
    expect(plan.ending).toEqual({ kind: 'burst', from: 3, to: 3.5 });
    expect(plan.glyphs).toEqual({ going: WINDOW(0, 3) });
    expect(plan.duration - plan.travel).toBe(0.5);
    expect(AT(routeOf(PATH, plan.end), distanceAt(plan, 3.25))).toEqual(PATH[2]);
  });

  it('a lost packet shrinks away for half a second', () => {
    const plan = flightPlan(PATH, 'lost', 0);
    expect(plan.ending).toEqual({ kind: 'shrink', from: 3, to: 3.5 });
    expect(plan.glyphs).toEqual({ going: WINDOW(0, 3.5) });
    expect(AT(routeOf(PATH, plan.end), distanceAt(plan, 3.25))).toEqual(PATH[2]);
  });

  it('the label of a translated packet changes where the router that translates stands on the path, and the reply wears the ports swapped', () => {
    const plan = flightPlan(PATH, 'replied', 0, ROUTER_AT);
    expect(plan.labels.map(({ back, from, to }) => ({ back, from, to }))).toEqual([
      { back: false, from: 0, to: 1 },
      { back: false, from: 1, to: 3 },
      { back: true, from: 3, to: 5 },
      { back: true, from: 5, to: 6 },
    ]);
    expect(plan.labels.map(({ back, distance }) => legTextAt(LEGS, ROUTER_AT, distance, back))).toEqual(['TCP 51514 → 80', 'TCP 40001 → 80', 'TCP 80 → 40001', 'TCP 80 → 51514']);
    const route = routeOf(PATH, plan.end);
    expect(AT(route, distanceAt(plan, 1))).toEqual([120, 0]);
    expect(AT(route, distanceAt(plan, 5))).toEqual([120, 0]);
  });

  it('a packet whose ports do not change wears one label going and, when it is answered, its reply coming back', () => {
    const answered = flightPlan(PATH, 'replied', 0);
    expect(answered.labels.map(({ back, from, to }) => ({ back, from, to }))).toEqual([
      { back: false, from: 0, to: 3 },
      { back: true, from: 3, to: 6 },
    ]);
    expect(answered.labels.map(({ back, distance }) => legTextAt(LEGS.slice(0, 1), undefined, distance, back))).toEqual(['TCP 51514 → 80', 'TCP 80 → 51514']);
    expect(flightPlan(PATH, 'blocked', 0).labels.map(({ back }) => back)).toEqual([false]);
  });

  it('a send that waits for another begins when the answer of the other is back at its sender', () => {
    const question = flightPlan(PATH, 'replied', 0);
    expect(answerBackAt(question)).toBe(6);
    const asked = flightPlan(PATH, 'arrived', answerBackAt(question));
    expect(asked.begin).toBe(6);
    expect(sendCycle(asked)).toEqual({ begin: 6, period: asked.duration, repeats: false });
    const afterWaiting = flightPlan(PATH, 'replied', 2);
    expect(answerBackAt(afterWaiting)).toBe(8);
    expect(distanceAt(afterWaiting, 0)).toBe(0);
  });
});

describe('flowCycles', () => {
  it('a flow sends a packet every 3.5 seconds, shifted 1.1 seconds by its place among the flows', () => {
    const plan = flightPlan(PATH, 'arrived', 0);
    expect(FLOW_PERIOD).toBe(3.5);
    expect(FLOW_OFFSET).toBe(1.1);
    expect(flowCycles(plan, 0)).toEqual([{ begin: 0, period: 3.5, repeats: true }]);
    expect(flowCycles(plan, 3)).toEqual([{ begin: 3 * 1.1, period: 3.5, repeats: true }]);
  });

  it('a flow whose trip lasts longer than its period draws one copy more, shifted by the period', () => {
    const fits = flightPlan(PATH, 'arrived', 0);
    expect(fits.duration).toBe(FLOW_PERIOD);
    expect(flowCycles(fits, 0)).toHaveLength(1);
    const slightlyLonger = flightPlan([[0, 0], [LENGTH + 1, 0]], 'arrived', 0);
    expect(slightlyLonger.duration).toBeGreaterThan(FLOW_PERIOD);
    expect(flowCycles(slightlyLonger, 2)).toEqual([
      { begin: 2 * FLOW_OFFSET, period: 2 * FLOW_PERIOD, repeats: true },
      { begin: 2 * FLOW_OFFSET + FLOW_PERIOD, period: 2 * FLOW_PERIOD, repeats: true },
    ]);
    const long = flightPlan([[0, 0], [1000, 0]], 'arrived', 0);
    expect(flowCycles(long, 0).map(({ begin }) => begin)).toEqual([0, FLOW_PERIOD, 2 * FLOW_PERIOD]);
    expect(new Set(flowCycles(long, 0).map(({ period }) => period))).toEqual(new Set([3 * FLOW_PERIOD]));
    expect(long.duration).toBeLessThanOrEqual(3 * FLOW_PERIOD);
  });
});

describe('keyframes', () => {
  it('starts at 0 and ends at 1 whatever the points', () => {
    expect(keyframes(4, [[0, 0], [1, 1], [3, 0]])).toEqual({ keyTimes: [0, 0.25, 0.75, 1], values: [0, 1, 0, 0] });
    expect(keyframes(4, [[0, 0], [0, 1], [2, 0]])).toEqual({ keyTimes: [0, 0.5, 1], values: [1, 0, 0] });
    expect(keyframes(4, [[0, 1], [4, 0]])).toEqual({ keyTimes: [0, 1], values: [1, 0] });
    expect(keyframes(4, [[1, 5]])).toEqual({ keyTimes: [0, 0.25, 1], values: [5, 5, 5] });
  });
});

describe('labelRide', () => {
  const SIZE = { width: 100, height: 20 };
  const BOUNDS = { width: 300, height: 200 };

  it('keeps the label above the packet while the room allows it and inside the drawing the rest of the time', () => {
    const hugging: Point[] = [
      [2, 10],
      [2, 150],
      [296, 150],
      [296, 6],
    ];
    const ride = labelRide(hugging, SIZE, BOUNDS, 10);
    expect(ride.centers).toHaveLength(hugging.length);
    ride.centers.forEach(([x, y]) => {
      expect(x - SIZE.width / 2).toBeGreaterThanOrEqual(0);
      expect(x + SIZE.width / 2).toBeLessThanOrEqual(BOUNDS.width);
      expect(y - SIZE.height / 2).toBeGreaterThanOrEqual(0);
      expect(y + SIZE.height / 2).toBeLessThanOrEqual(BOUNDS.height);
    });
    const roomy = labelRide([[150, 100], [200, 100]], SIZE, BOUNDS, 1);
    expect(roomy.centers.map(([x]) => x)).toEqual([150, 200]);
    expect(roomy.centers.every(([, y]) => y < 100 - SIZE.height / 2)).toBe(true);
  });

  it('moves the label with the packet: the same share of the flight at every corner of the path', () => {
    const plan = flightPlan(PATH, 'arrived', 0);
    const ride = labelRide(PATH, SIZE, BOUNDS, plan.duration);
    const { keyTimes, keyPoints } = ride;
    expect(keyTimes).toEqual([0, 1 / 3.5, 3 / 3.5, 1]);
    expect(keyPoints[0]).toBe(0);
    expect(keyPoints.at(-1)).toBe(1);
    expect(keyPoints).toEqual([...keyPoints].sort((a, b) => a - b));
    const share = (corner: number) => lengthOf(ride.centers)[corner] / (lengthOf(ride.centers).at(-1) as number);
    expect(keyPoints[1]).toBeCloseTo(share(1), 10);
  });
});
