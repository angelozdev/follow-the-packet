import { describe, expect, it } from 'vitest';
import type { Box, Mark } from '@/scene/map2d/layout/arrange/geometry';
import { lengthOf, positionAt, type Point } from '@/scene/map2d/layout/graph';
import { LABEL_HEIGHT } from '@/scene/map2d/layout/metrics';
import { crowds } from './boxes';
import { placeTags, separateGlyphs, type PacketTag } from './packet-tags';
import { fanStamps } from './stamp-fan';

const LINE: Point[] = [[0, 100], [400, 100]];
const WIDTH = 100;
const tagOf = (id: string, path: readonly Point[] = LINE, extras: Partial<PacketTag> = {}): PacketTag => ({ id, path, size: { width: WIDTH, height: LABEL_HEIGHT }, ...extras });
const boxAt = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
const only = (placed: ReturnType<typeof placeTags>) => placed[0];

describe('placeTags', () => {
  it('the label of a packet moves clear of a stamp, of the label of a piece, of a box and of another label, along its link first and then up or down', () => {
    const stamp = boxAt(182, 82, 36, 36);
    const pieceLabel = boxAt(150, 88, 100, 24);
    const icon = boxAt(180, 76, 48, 48);
    for (const obstacle of [stamp, pieceLabel, icon]) {
      const placed = only(placeTags([tagOf('tag')], [obstacle]));
      expect(placed.clear).toBe(true);
      expect(crowds(placed.box, obstacle)).toBe(false);
      expect(placed.at[1]).toBe(100);
      expect(placed.at[0]).not.toBe(200);
    }
    expect(only(placeTags([tagOf('tag')], [stamp])).at).toEqual([268, 100]);
    const [first, second] = placeTags([tagOf('first'), tagOf('second')], []);
    expect(first.at).toEqual([200, 100]);
    expect(crowds(first.box, second.box)).toBe(false);
    expect(second.at).toEqual([300, 100]);

    const wall = boxAt(-50, 80, 500, 40);
    expect(only(placeTags([tagOf('tag')], [wall])).at).toEqual([200, 56]);
    const deep = boxAt(-50, 20, 500, 100);
    expect(only(placeTags([tagOf('tag')], [deep])).at).toEqual([200, 144]);
    const tall = boxAt(-50, 46, 500, 114);
    expect(only(placeTags([tagOf('tag')], [tall])).at).toEqual([200, 34]);
    const unreachable = boxAt(-50, -100, 500, 400);
    const stuck = only(placeTags([tagOf('tag')], [unreachable]));
    expect(stuck).toMatchObject({ at: [200, 100], clear: false });
  });

  it('a label that nothing touches does not move', () => {
    const away = [boxAt(300, 60, 36, 36), boxAt(250, 90, 40, 20), boxAt(150, 110, 100, 20), boxAt(0, 0, 400, 90)];
    for (const path of [LINE, [[50, 100], [50, 300]] as Point[], [[0, 100], [100, 100], [100, 200], [300, 200]] as Point[]]) {
      const home = positionAt(path, lengthOf(path), (lengthOf(path).at(-1) ?? 0) / 2);
      const placed = only(placeTags([tagOf('tag', path)], path === LINE ? away : []));
      expect(placed.at[0]).toBeCloseTo(home[0], 9);
      expect(placed.at[1]).toBeCloseTo(home[1], 9);
      expect(placed.clear).toBe(true);
      expect(placed.box).toEqual(boxAt(placed.at[0] - WIDTH / 2, placed.at[1] - LABEL_HEIGHT / 2, WIDTH, LABEL_HEIGHT));
    }
    expect(placeTags([], [boxAt(0, 0, 10, 10)])).toEqual([]);
  });

  it('slides along the path before it climbs, and climbs before it falls: three steps of 22 px up and two down', () => {
    const band = boxAt(100, 80, 200, 40);
    const slid = only(placeTags([tagOf('tag')], [band]));
    expect(slid.at).toEqual([350, 100]);
    const bent: Point[] = [[0, 100], [200, 100], [200, 300]];
    const around = only(placeTags([tagOf('tag', bent)], [boxAt(150, 90, 100, 20)]));
    expect(around).toMatchObject({ at: [200, 120], clear: true });
  });

  it('on a path that runs down it slides first, and then climbs or falls from the end of the sheet that blocks it', () => {
    const upright: Point[] = [[100, 0], [100, 400]];
    const sheet = boxAt(0, 0, 200, 400);
    expect(only(placeTags([tagOf('tag', upright)], [boxAt(40, 190, 120, 20)])).at).toEqual([100, 220]);
    expect(only(placeTags([tagOf('tag', upright)], [sheet])).at).toEqual([100, -10]);
    expect(only(placeTags([tagOf('tag', upright)], [sheet, boxAt(0, -60, 200, 60)])).at).toEqual([100, 410]);
  });

  it('puts the label of a packet beside the next one when they share a path, in the order they come', () => {
    const placed = placeTags([tagOf('a'), tagOf('b'), tagOf('c')], []);
    expect(placed.map(({ at }) => at)).toEqual([[200, 100], [300, 100], [100, 100]]);
    for (const [index, one] of placed.entries()) for (const other of placed.slice(index + 1)) expect(crowds(one.box, other.box)).toBe(false);
  });
});

describe('placeTags with the fans of the stamps', () => {
  it('the label of a hidden stamp is not drawn on the still map and its text is in the list', () => {
    const mark: Mark = { station: 'door:lucia', point: [200, 100], axis: 'y', casillas: 3 };
    const stamps = ['one', 'two', 'three', 'four'].map((id, index) => ({ id, problem: false, send: index + 1 }));
    const [fan] = fanStamps({ 'door:lucia': stamps }, [mark]);
    const tags = [...stamps.map(({ id }) => tagOf(`tag-${id}`, LINE, { stamp: id })), tagOf('tag-of-a-flow')];
    const placed = placeTags(tags, [], [fan]);
    expect(fan.hidden).toEqual(['one', 'two']);
    expect(placed.map(({ id }) => id)).toEqual(['tag-three', 'tag-four', 'tag-of-a-flow']);
    expect(placed).toEqual(placeTags(tags.slice(2), []));
    for (const id of fan.hidden) expect(fan.more?.ids).toContain(id);
    expect(placeTags(tags, [], []).map(({ id }) => id)).toEqual(tags.map(({ id }) => id));
    expect(placeTags(tags, [])).toEqual(placeTags(tags, [], []));
  });
});

describe('separateGlyphs', () => {
  it('two glyphs on one point are 12 px apart along their path', () => {
    const [first, second] = separateGlyphs([
      { id: 'first', path: LINE, at: 200 },
      { id: 'second', path: LINE, at: 200 },
    ]);
    expect(first.point).toEqual([200, 100]);
    expect(second.point[0]).toBeCloseTo(212, 9);
    expect(second.point[1]).toBe(100);

    const bent: Point[] = [[0, 0], [100, 0], [100, 100]];
    const [turn, turned] = separateGlyphs([
      { id: 'turn', path: bent, at: 95 },
      { id: 'turned', path: bent, at: 95 },
    ]);
    expect(turn.point[0]).toBeCloseTo(95, 9);
    expect(turned.point[0]).toBeCloseTo(100, 9);
    expect(turned.point[1]).toBeCloseTo(7, 9);
  });

  it('keeps apart three glyphs on one point, leaves alone the ones that are apart and backs off at the end of a path', () => {
    const three = separateGlyphs(['a', 'b', 'c'].map((id) => ({ id, path: LINE, at: 100 })));
    three.forEach(({ point }, index) => expect(point[0]).toBeCloseTo(100 + 12 * index, 9));
    const apart = separateGlyphs([
      { id: 'near', path: LINE, at: 100 },
      { id: 'far', path: LINE, at: 300 },
    ]);
    expect(apart.map(({ point }) => point[0])).toEqual([100, 300]);
    const ends = separateGlyphs([
      { id: 'one', path: LINE, at: 400 },
      { id: 'two', path: LINE, at: 400 },
    ]);
    expect(ends[0].point[0]).toBeCloseTo(400, 9);
    expect(ends[1].point[0]).toBeCloseTo(388, 9);
    const crossing = separateGlyphs([
      { id: 'across', path: [[200, 0], [200, 200]], at: 100 },
      { id: 'along', path: LINE, at: 200 },
    ]);
    expect(crossing[0].point[1]).toBeCloseTo(100, 9);
    expect(crossing[1].point[0]).toBeCloseTo(212, 9);
    expect(separateGlyphs([])).toEqual([]);
  });
});
