import { describe, expect, it } from 'vitest';
import type { Box, Mark } from '@/scene/layout/arrange/geometry';
import { lengthOf, positionAt, type Point } from '@/scene/layout/graph';
import { LABEL_HEIGHT } from '@/scene/layout/metrics';
import { crowds } from './boxes';
import { changeDistance, legTextAt, placeTags, separateGlyphs, type PacketTag } from './packet-tags';
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
    expect(only(placeTags([tagOf('tag')], [wall])).at).toEqual([200, 70]);
    const deep = boxAt(-50, 20, 500, 100);
    expect(only(placeTags([tagOf('tag')], [deep])).at).toEqual([200, 130]);
    const tall = boxAt(-50, 46, 500, 114);
    expect(only(placeTags([tagOf('tag')], [tall])).at).toEqual([200, 36]);
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

  it('slides along the path before it climbs or falls, and climbs or falls only as far as the first height that clears', () => {
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

  it('climbs or falls to the nearest height at which an edge of its box touches an edge of what is in the way, up first when both are as near', () => {
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 90, 500, 15)])).at).toEqual([200, 115]);
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 95, 500, 20)])).at).toEqual([200, 85]);
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 80, 500, 40)])).at).toEqual([200, 70]);
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 81, 500, 39)])).at).toEqual([200, 71]);
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 80, 500, 39)])).at).toEqual([200, 129]);
  });

  it('on a slanted path it climbs from the place where its box meets the side of what is in the way', () => {
    const slanted: Point[] = [[65, 152], [158, 91]];
    const placed = only(placeTags([tagOf('tag', slanted, { size: { width: 126, height: LABEL_HEIGHT } })], [boxAt(208, 40, 99, 71), boxAt(60, 87, 252, 110)]));
    expect(placed.clear).toBe(true);
    expect(placed.at[0]).toBeCloseTo(145, 9);
    expect(placed.at[1]).toBeCloseTo(77, 9);
  });

  it('reaches 66 px up and 44 px down, to the pixel, and not a pixel more', () => {
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 44, 500, 156)]))).toMatchObject({ at: [200, 34], clear: true });
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 43, 500, 157)]))).toMatchObject({ at: [200, 100], clear: false });
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 0, 500, 134)]))).toMatchObject({ at: [200, 144], clear: true });
    expect(only(placeTags([tagOf('tag')], [boxAt(-50, 0, 500, 135)]))).toMatchObject({ at: [200, 100], clear: false });
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

describe('placeTags with the label of a packet that never leaves its device', () => {
  const short: Point[] = [[180, 100], [220, 100]];
  const block = boxAt(150, 60, 100, 100);
  const heavy = { width: WIDTH, height: 120 };
  const stays = tagOf('stays', short, { size: heavy, staysInDevice: true });

  it('is not drawn on the still map when it finds no clear place, and it does not push the others', () => {
    const other = tagOf('other', short);
    expect(placeTags([stays], [block])).toEqual([]);
    expect(placeTags([stays, other], [block])).toEqual(placeTags([other], [block]));
    expect(placeTags([stays, other], [block])).toMatchObject([{ id: 'other', at: [200, 50], clear: true }]);
    expect(placeTags([other, stays], [block]).map(({ id }) => id)).toEqual(['other']);
  });

  it('is drawn like any other when it finds a place, and a label that does leave its device with no place is still listed as not clear', () => {
    const plain = tagOf('stays', LINE, { staysInDevice: true });
    expect(only(placeTags([plain], [boxAt(182, 82, 36, 36)]))).toMatchObject({ id: 'stays', at: [268, 100], clear: true });
    expect(placeTags([plain], [])).toEqual(placeTags([tagOf('stays', LINE)], []));
    expect(only(placeTags([tagOf('stays', short, { size: heavy })], [block]))).toMatchObject({ id: 'stays', at: [200, 100], clear: false });
    expect(only(placeTags([tagOf('stays', short, { size: heavy, staysInDevice: false })], [block]))).toMatchObject({ id: 'stays', at: [200, 100], clear: false });
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

describe('the text of the label of a packet along its path', () => {
  const FIRST = { request: '{{tcp}} 51514 → 80', reply: '{{tcp}} 80 → 51514' };
  const SECOND = { request: '{{tcp}} 40001 → 80', reply: '{{tcp}} 80 → 40001' };

  it('legTextAt says, in plain text, the leg the packet stands in: the first before the distance where the ports change and the last from there on', () => {
    expect(legTextAt([FIRST, SECOND], 100, 0)).toBe('TCP 51514 → 80');
    expect(legTextAt([FIRST, SECOND], 100, 99.9)).toBe('TCP 51514 → 80');
    expect(legTextAt([FIRST, SECOND], 100, 100)).toBe('TCP 40001 → 80');
    expect(legTextAt([FIRST, SECOND], 100, 500)).toBe('TCP 40001 → 80');
  });

  it('legTextAt keeps the one leg of a packet whose ports do not change, wherever it stands', () => {
    expect(legTextAt([FIRST], undefined, 0)).toBe('TCP 51514 → 80');
    expect(legTextAt([FIRST], undefined, 500)).toBe('TCP 51514 → 80');
    expect(legTextAt([FIRST, SECOND], undefined, 500)).toBe('TCP 51514 → 80');
  });

  it('legTextAt says the answer coming back with the ports swapped, from the last leg first when the ports change on the way', () => {
    expect(legTextAt([FIRST, SECOND], 100, 500, true)).toBe('TCP 80 → 40001');
    expect(legTextAt([FIRST, SECOND], 100, 100, true)).toBe('TCP 80 → 40001');
    expect(legTextAt([FIRST, SECOND], 100, 99.9, true)).toBe('TCP 80 → 51514');
    expect(legTextAt([FIRST], undefined, 500, true)).toBe('TCP 80 → 51514');
    expect(legTextAt([FIRST, SECOND], 100, 0, false)).toBe('TCP 51514 → 80');
  });

  it('changeDistance says how far along a path the point of the router that translates lies, and nothing when the path does not pass there or the map does not draw the router', () => {
    const bent: Point[] = [[0, 0], [30, 40], [30, 140], [230, 140]];
    expect(changeDistance(bent, [30, 40])).toBe(50);
    expect(changeDistance(bent, [30, 140])).toBe(150);
    expect(changeDistance(bent, [230, 140])).toBe(350);
    expect(changeDistance(bent, [31, 40])).toBeUndefined();
    expect(changeDistance(bent, undefined)).toBeUndefined();
  });

  it('changeDistance takes the first time the path reaches the router, also when it comes back to it', () => {
    const there: Point[] = [[0, 0], [100, 0], [200, 0], [100, 0]];
    expect(changeDistance(there, [100, 0])).toBe(100);
  });
});
