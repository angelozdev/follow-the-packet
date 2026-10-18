import { describe, expect, it } from 'vitest';
import { lengthOf, positionAt, route, type Point } from '@/scene/map2d/layout/graph';
import { station } from '@/scene/map2d/layout/stations';
import { assemble, graphOf, type Plan, type Road } from './assemble';
import { CASILLAS, FAN_PITCH, HELPER_PREFIX, STAMP } from './geometry';

const at = (name: string, x: number, y: number) => ({ name, point: [x, y] as Point });
const plan = (roads: Road[], extras: Partial<Plan> = {}): Plan => ({ roads, legs: [], marks: [], obstacles: [], ...extras });
const HORIZONTAL: Road = { kind: 'line', via: [at('a', 0, 0), at('b', 100, 0), at('c', 300, 0)] };
const ELBOW: Road = { kind: 'trunk', via: [at('from', 0, 0), { point: [0, 60] }, { point: [80, 60] }, at('to', 80, 20)] };

describe('assemble', () => {
  it('makes one link for each pair of named waypoints in a row, with the bends between them as the points of the link', () => {
    const { links, nodes } = assemble(plan([HORIZONTAL, ELBOW]));
    expect(nodes.map(({ name }) => name)).toEqual(['a', 'b', 'c', 'from', 'to']);
    expect(links).toEqual([
      { from: 'a', to: 'b', kind: 'line', points: [[0, 0], [100, 0]] },
      { from: 'b', to: 'c', kind: 'line', points: [[100, 0], [300, 0]] },
      { from: 'from', to: 'to', kind: 'trunk', points: [[0, 0], [0, 60], [80, 60], [80, 20]] },
    ]);
  });

  it('a station named in two roads is one node, and a station at two points is an error', () => {
    const { nodes } = assemble(plan([HORIZONTAL, { kind: 'device', via: [at('b', 100, 0), at('d', 100, 80)] }]));
    expect(nodes.filter(({ name }) => name === 'b')).toHaveLength(1);
    expect(() => assemble(plan([HORIZONTAL, { kind: 'device', via: [at('b', 101, 0), at('d', 100, 80)] }]))).toThrow(/b/);
  });

  it('the stations leave out the helper nodes, and the graph holds all of them', () => {
    const helper = `${HELPER_PREFIX}junction`;
    const assembled = assemble(plan([{ kind: 'line', via: [at('a', 0, 0), at(helper, 50, 0), at('b', 100, 0)] }]));
    expect(assembled.stations).toEqual({ a: [0, 0], b: [100, 0] });
    expect(graphOf(assembled).nodes.map(({ name }) => name)).toEqual(['a', helper, 'b']);
    expect(graphOf(assembled).edges).toEqual([
      { from: 'a', to: helper, bends: [] },
      { from: helper, to: 'b', bends: [] },
    ]);
  });

  describe('a mid', () => {
    const withMid = (roads: Road[], leg: [string, string]) => assemble(plan(roads, { legs: [leg] }));

    it('stands half way along the way between its two stops and the way through it is the way without it', () => {
      for (const [roads, leg] of [[[HORIZONTAL], ['a', 'c']], [[ELBOW], ['from', 'to']]] as const) {
        const without = assemble(plan([...roads]));
        const assembled = withMid([...roads], [...leg]);
        const [a, b] = leg;
        const direct = route(graphOf(without), [a, b]);
        const half = lengthOf(direct).at(-1)! / 2;
        const name = station.mid(a, b);
        const middle = positionAt(direct, lengthOf(direct), half);
        const through = route(graphOf(assembled), [a, name, b]);
        expect(assembled.stations[name]).toEqual(middle);
        expect(lengthOf(route(graphOf(assembled), [a, name])).at(-1)).toBeCloseTo(half);
        expect(through.filter(([x, y]) => x !== middle[0] || y !== middle[1])).toEqual(direct);
      }
    });

    it('splits the link at the bend when the middle falls on the other side of it', () => {
      const { links, stations } = withMid([ELBOW], ['from', 'to']);
      expect(stations[station.mid('from', 'to')]).toEqual([30, 60]);
      expect(links.map(({ from, to }) => [from, to])).toEqual([['from', station.mid('from', 'to')], [station.mid('from', 'to'), 'to']]);
      expect(links[0].points).toEqual([[0, 0], [0, 60], [30, 60]]);
      expect(links[1].points).toEqual([[30, 60], [80, 60], [80, 20]]);
    });

    it('a middle that falls on a node hangs from it with a link of no length', () => {
      const { links, stations } = withMid([{ kind: 'line', via: [at('a', 0, 0), at('m', 50, 0), at('b', 100, 0)] }], ['a', 'b']);
      const name = station.mid('a', 'b');
      expect(stations[name]).toEqual([50, 0]);
      expect(links).toContainEqual({ from: 'm', to: name, kind: 'line', points: [[50, 0], [50, 0]] });
    });
  });

  describe('a mark', () => {
    const marks = (specs: Plan['marks'], extras: Partial<Plan> = {}) => assemble(plan([HORIZONTAL, ELBOW], { marks: specs, ...extras })).marks;

    it('stands the distance back along the way to its neighbor, and opens its fan across the link there', () => {
      expect(marks([{ station: 'b', facing: 'a', back: 22 }])).toEqual([{ station: 'b', point: [78, 0], axis: 'y', casillas: CASILLAS }]);
      expect(marks([{ station: 'from', facing: 'to', back: 70 }])).toEqual([{ station: 'from', point: [10, 60], axis: 'y', casillas: CASILLAS }]);
      expect(marks([{ station: 'from', facing: 'to', back: 30 }])[0]).toMatchObject({ point: [0, 30], axis: 'x' });
    });

    it('a mark with no distance stands on its station, across the first stretch of the way to its neighbor', () => {
      expect(marks([{ station: 'b', facing: 'c', back: 0 }])).toEqual([{ station: 'b', point: [100, 0], axis: 'y', casillas: CASILLAS }]);
      expect(marks([{ station: 'b', facing: 'b', back: 0 }])[0]).toMatchObject({ point: [100, 0], axis: 'y' });
    });

    it('the mark of a mid stands on it and opens across the link it is on', () => {
      const [mark] = assemble(plan([HORIZONTAL], { legs: [['a', 'c']] })).marks;
      expect(mark).toEqual({ station: station.mid('a', 'c'), point: [150, 0], axis: 'y', casillas: CASILLAS });
    });

    it('holds fewer casillas when a box is in the way of its fan, and never less than one', () => {
      const reach = (casillas: number) => (STAMP + FAN_PITCH * (casillas - 1)) / 2;
      const blocker = (distance: number) => ({ x: 40, y: distance, width: 20, height: 5 });
      const casillasWith = (obstacle: Plan['obstacles'][number]) => marks([{ station: 'b', facing: 'a', back: 50 }], { obstacles: [obstacle] })[0].casillas;
      expect(casillasWith(blocker(reach(3) - 1))).toBe(2);
      expect(casillasWith(blocker(reach(2) - 1))).toBe(1);
      expect(casillasWith(blocker(0))).toBe(1);
      expect(casillasWith(blocker(reach(3) + 1))).toBe(3);
    });
  });
});
