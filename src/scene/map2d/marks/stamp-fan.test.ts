import { describe, expect, it } from 'vitest';
import { fanBox, type FanAxis, type Mark } from '@/scene/map2d/layout/arrange/geometry';
import type { Point } from '@/scene/map2d/layout/graph';
import { fanStamps, type Fan, type StampSource } from './stamp-fan';

const CENTER: Point = [200, 100];
const markOf = (station: string, casillas: number, axis: FanAxis = 'y', point: Point = CENTER): Mark => ({ station, point, axis, casillas });
const stampsOf = (count: number): StampSource[] => Array.from({ length: count }, (_, index) => ({ id: `s${index + 1}`, problem: false, send: index + 1 }));
const sent = (id: string, send: number, problem = false): StampSource => ({ id, problem, send });
const live = (id: string, problem = false): StampSource => ({ id, problem });
const fanOf = (stamps: readonly StampSource[], casillas = 3, axis: FanAxis = 'y'): Fan => {
  const [fan] = fanStamps({ place: stamps }, [markOf('place', casillas, axis)]);
  return fan;
};
const shown = (fan: Fan) => fan.stamps.map(({ id }) => id);

describe('fanStamps', () => {
  it('a place whose stamps all fit draws every stamp, 25 px apart across the link and centered on its mark', () => {
    const along: [FanAxis, (offset: number) => Point][] = [
      ['y', (offset) => [200, 100 + offset]],
      ['x', (offset) => [200 + offset, 100]],
    ];
    const offsets = [[0], [-12.5, 12.5], [-25, 0, 25]];
    for (const [axis, at] of along) {
      offsets.forEach((expected, index) => {
        const fan = fanOf(stampsOf(index + 1), 3, axis);
        expect(fan.stamps.map(({ point }) => point), `${axis} ${index + 1}`).toEqual(expected.map(at));
        expect(fan.stamps.map(({ box }) => [box.width, box.height])).toEqual(expected.map(() => [36, 36]));
        expect(fan.stamps.map(({ point, box }) => [box.x + 18, box.y + 18].join() === point.join())).toEqual(expected.map(() => true));
        expect(fan.box).toEqual(fanBox(CENTER, axis, index + 1));
        expect(fan.more).toBeUndefined();
        expect(fan.hidden).toEqual([]);
      });
    }
  });

  it('a mark holds three casillas and a stamp of a fourth makes the last casilla a «+N» that counts the rest', () => {
    expect(fanOf(stampsOf(3)).more).toBeUndefined();
    const four = fanOf(stampsOf(4));
    expect(four.stamps.map(({ point }) => point)).toEqual([[200, 75], [200, 100]]);
    expect(four.more).toMatchObject({ point: [200, 125], count: 2 });
    expect(fanOf(stampsOf(7)).more?.count).toBe(5);
    const two = fanOf(stampsOf(3), 2);
    expect(two.stamps.map(({ point }) => point)).toEqual([[200, 87.5]]);
    expect(two.more).toMatchObject({ point: [200, 112.5], count: 2 });
    const one = fanOf(stampsOf(2), 1);
    expect(one.stamps).toEqual([]);
    expect(one.more).toMatchObject({ point: CENTER, count: 2 });
    expect(fanOf(stampsOf(6), 1).more).toMatchObject({ point: CENTER, count: 6 });
  });

  it('a lone stamp is never moved, hidden or counted', () => {
    for (const casillas of [1, 2, 3]) {
      for (const problem of [false, true]) {
        for (const axis of ['x', 'y'] as const) {
          const fan = fanOf([sent('only', 4, problem)], casillas, axis);
          expect(fan.stamps.map(({ id, point }) => [id, point])).toEqual([['only', CENTER]]);
          expect(fan.more).toBeUndefined();
          expect(fan.hidden).toEqual([]);
          expect(fan.box).toEqual(fanBox(CENTER, axis, 1));
        }
      }
    }
  });

  it('a stamp with a problem stays in sight while a stamp with no problem can go into «+N»', () => {
    const fan = fanOf([sent('blocked', 1, true), sent('b', 2), sent('c', 3), sent('d', 4), sent('e', 5)]);
    expect(shown(fan)).toEqual(['blocked', 'e']);
    expect(fan.hidden).toEqual(['b', 'c', 'd']);
    expect(fan.more?.count).toBe(3);
    const mixed = fanOf([sent('a', 1, true), sent('b', 2, true), sent('c', 3, true), sent('d', 4)]);
    expect(mixed.hidden).toEqual(['a', 'd']);
    expect(shown(mixed)).toEqual(['b', 'c']);
  });

  it('among stamps of the same kind the oldest go into «+N»', () => {
    const fan = fanOf([sent('four', 4), sent('one', 1), sent('three', 3), sent('two', 2), sent('five', 5)]);
    expect(fan.hidden).toEqual(['one', 'three', 'two']);
    expect(shown(fan)).toEqual(['four', 'five']);
  });

  it('with more problem stamps than casillas the oldest problem stamps go into «+N»', () => {
    const fan = fanOf([sent('p4', 4, true), sent('p1', 1, true), sent('p3', 3, true), sent('p2', 2, true), sent('p5', 5, true)]);
    expect(fan.hidden).toEqual(['p1', 'p3', 'p2']);
    expect(shown(fan)).toEqual(['p4', 'p5']);
    expect(fan.more?.count).toBe(3);
  });

  it('the live flows of an incident are older than every packet the player sent, and a combination sent again is as new as its last send', () => {
    const fan = fanOf([sent('again', 7), live('flow-a'), sent('late', 6), live('flow-b'), sent('early', 5)]);
    expect(fan.hidden).toEqual(['flow-a', 'flow-b', 'early']);
    expect(shown(fan)).toEqual(['again', 'late']);
    const flows = fanOf([live('flow-1'), live('flow-2'), live('flow-3'), sent('first', 1)]);
    expect(flows.hidden).toEqual(['flow-1', 'flow-2']);
    expect(shown(flows)).toEqual(['flow-3', 'first']);
  });

  it('«+N» is the last casilla of its mark and counts at least two stamps', () => {
    for (const casillas of [1, 2, 3]) {
      for (const axis of ['x', 'y'] as const) {
        for (let count = casillas + 1; count <= casillas + 9; count++) {
          const fan = fanOf(stampsOf(count), casillas, axis);
          const more = fan.more;
          expect(more, `${casillas} ${axis} ${count}`).toBeDefined();
          expect(more?.count).toBe(count - (casillas - 1));
          expect(more?.count).toBeGreaterThanOrEqual(2);
          expect(fan.stamps).toHaveLength(casillas - 1);
          const lastCasilla = fanBox(CENTER, axis, casillas);
          const [end, across] = axis === 'y' ? [(more?.point[1] ?? NaN) + 18, more?.point[0]] : [(more?.point[0] ?? NaN) + 18, more?.point[1]];
          expect(end).toBe(axis === 'y' ? lastCasilla.y + lastCasilla.height : lastCasilla.x + lastCasilla.width);
          expect(across).toBe(axis === 'y' ? CENTER[0] : CENTER[1]);
          for (const { point } of fan.stamps) expect(axis === 'y' ? point[1] : point[0]).toBeLessThan(axis === 'y' ? (more?.point[1] ?? NaN) : (more?.point[0] ?? NaN));
          expect([more?.box.width, more?.box.height]).toEqual([36, 36]);
          expect(fan.box).toEqual(fanBox(CENTER, axis, casillas));
        }
      }
    }
  });

  it('the list of a «+N» holds every stamp of the place, the drawn ones too', () => {
    const stamps = [sent('a', 3, true), live('flow'), sent('b', 1), sent('c', 2), sent('d', 4, true), sent('e', 5)];
    const fan = fanOf(stamps);
    expect(fan.more?.ids).toEqual(['a', 'flow', 'b', 'c', 'd', 'e']);
    expect([...shown(fan), ...fan.hidden].sort()).toEqual([...(fan.more?.ids ?? [])].sort());
    expect(shown(fan).every((id) => fan.more?.ids.includes(id))).toBe(true);
    expect(shown(fan).length).toBeGreaterThan(0);
    expect(fan.hidden.length).toBeGreaterThan(0);
  });

  it('a «+N» says whether it hides a stamp with a problem, not whether one is in its list', () => {
    expect(fanOf(stampsOf(5)).more?.hidesProblem).toBe(false);
    const seen = fanOf([sent('blocked', 1, true), sent('b', 2), sent('c', 3), sent('d', 4), sent('e', 5)]);
    expect(seen.more?.ids).toContain('blocked');
    expect(shown(seen)).toContain('blocked');
    expect(seen.more?.hidesProblem).toBe(false);
    const mixed = fanOf([sent('a', 1, true), sent('b', 2, true), sent('c', 3, true), sent('d', 4)]);
    expect(mixed.hidden).toEqual(['a', 'd']);
    expect(mixed.more?.hidesProblem).toBe(true);
    const onlyProblems = fanOf([sent('p1', 1, true), sent('p2', 2, true), sent('p3', 3, true), sent('p4', 4, true)]);
    expect(onlyProblems.more?.hidesProblem).toBe(true);
    const justEnough = fanOf([sent('p1', 1, true), sent('p2', 2, true), sent('ok', 3), sent('fine', 4)]);
    expect(justEnough.hidden).toEqual(['ok', 'fine']);
    expect(justEnough.more?.hidesProblem).toBe(false);
  });

  it('a mark of one casilla that holds two problem stamps makes a «+2» that hides a problem, and one that holds two stamps with none makes one that does not', () => {
    expect(fanOf([sent('a', 1, true), sent('b', 2, true)], 1).more).toMatchObject({ count: 2, hidesProblem: true });
    expect(fanOf([sent('a', 1), sent('b', 2, true)], 1).more).toMatchObject({ count: 2, hidesProblem: true });
    expect(fanOf([sent('a', 1), sent('b', 2)], 1).more).toMatchObject({ count: 2, hidesProblem: false });
    expect(fanOf([live('flow'), sent('a', 1), sent('b', 2, true)], 2).more).toMatchObject({ count: 2, hidesProblem: false });
  });

  it('a «+N» has an id of its own, made of the name of its place', () => {
    const [fan] = fanStamps({ 'door:lucia': stampsOf(4) }, [markOf('door:lucia', 3)]);
    expect(fan.more?.id).toBe('more:door:lucia');
  });

  it('gives each place its own fan, in the order of the marks, and none to a place with no stamps', () => {
    const marks = [markOf('first', 3, 'y', [10, 10]), markOf('empty', 3, 'y', [50, 10]), markOf('second', 2, 'x', [90, 10]), markOf('unused', 1, 'x', [130, 10])];
    const fans = fanStamps({ second: stampsOf(3), first: stampsOf(1), empty: [] }, marks);
    expect(fans.map(({ station }) => station)).toEqual(['first', 'second']);
    expect(fans[0].box).toEqual(fanBox([10, 10], 'y', 1));
    expect(fans[1].more?.count).toBe(2);
    expect(fanStamps({}, marks)).toEqual([]);
  });

  it('refuses a stamp at a place that has no mark instead of losing it', () => {
    expect(() => fanStamps({ 'door:nobody': stampsOf(1) }, [markOf('door:somebody', 3)])).toThrow('door:nobody');
  });
});
