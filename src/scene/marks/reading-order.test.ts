import { describe, expect, it } from 'vitest';
import type { Box, Mark } from '@/scene/layout/arrange/geometry';
import { readingOrder, type ReadingEntry } from './reading-order';
import { fanStamps, type StampSource } from './stamp-fan';

const square = (x: number, y: number): Box => ({ x, y, width: 48, height: 48 });
const named = (x: number, y: number): Box => ({ x: x - 60, y: y + 14, width: 54, height: 20 });
const PIECES = { top: [200, 100], left: [50, 100], low: [50, 300], middle: [300, 200] } as const;
const LAYOUT = {
  icons: Object.fromEntries(Object.entries(PIECES).map(([id, [x, y]]) => [id, square(x, y)])),
  labels: Object.fromEntries(Object.entries(PIECES).map(([id, [x, y]]) => [id, named(x, y)])),
};
const stamps = (prefix: string, count: number): StampSource[] => Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index + 1}`, problem: false, send: index + 1 }));
const mark = (station: string, x: number, y: number, axis: Mark['axis'] = 'y'): Mark => ({ station, point: [x, y], axis, casillas: 3 });
const idsOf = (entries: ReadingEntry[]) => entries.map(({ kind, id }) => `${kind}:${id}`);

describe('readingOrder', () => {
  it('lists the pieces from the top to the bottom and, along one line, from the left to the right, whatever the order they were given in', () => {
    expect(idsOf(readingOrder(LAYOUT, []))).toEqual(['piece:left', 'piece:top', 'piece:middle', 'piece:low']);
    const reversed = { icons: Object.fromEntries(Object.entries(LAYOUT.icons).reverse()), labels: Object.fromEntries(Object.entries(LAYOUT.labels).reverse()) };
    expect(readingOrder(reversed, [])).toEqual(readingOrder(LAYOUT, []));
  });

  it('puts the stamps of a place right after the piece that stands nearest to it, in the order of the fan, with its «+N» last', () => {
    const marks = [mark('near-top', 280, 124), mark('near-low', 120, 324)];
    const fans = fanStamps({ 'near-top': stamps('t', 5), 'near-low': stamps('l', 2) }, marks);
    expect(idsOf(readingOrder(LAYOUT, fans))).toEqual(['piece:left', 'piece:top', 'stamp:t4', 'stamp:t5', 'more:more:near-top', 'piece:middle', 'piece:low', 'stamp:l1', 'stamp:l2']);
  });

  it('names a «+N» by the id its fan gives it, the one the list of collisions uses, and not by its station', () => {
    const fans = fanStamps({ 'near-top': stamps('t', 4) }, [mark('near-top', 280, 124)]);
    const entries = readingOrder(LAYOUT, fans).filter(({ kind }) => kind === 'more');
    expect(entries).toEqual([{ kind: 'more', id: fans[0].more?.id }]);
    expect(entries[0].id).not.toBe(fans[0].station);
  });

  it('puts the fans that are nearest to one piece after it from the top to the bottom, whatever the order they were given in', () => {
    const marks = [mark('below', 120, 200), mark('above', 120, 130)];
    const fans = fanStamps({ below: stamps('b', 1), above: stamps('a', 1) }, marks);
    expect(idsOf(readingOrder({ icons: { only: square(50, 100) }, labels: { only: named(50, 100) } }, fans))).toEqual(['piece:only', 'stamp:a1', 'stamp:b1']);
  });

  it('orders the stamps of a fan that opens along x from the left to the right, and lists them once', () => {
    const fans = fanStamps({ road: stamps('r', 3) }, [mark('road', 300, 260, 'x')]);
    const order = idsOf(readingOrder(LAYOUT, fans));
    expect(order.filter((entry) => entry.startsWith('stamp:'))).toEqual(['stamp:r1', 'stamp:r2', 'stamp:r3']);
    expect(order).toHaveLength(Object.keys(PIECES).length + 3);
  });

  it('lists the pieces by the center of their icon, so a long name does not move a piece', () => {
    const wide = { icons: LAYOUT.icons, labels: { ...LAYOUT.labels, left: { x: -400, y: 130, width: 454, height: 20 } } };
    expect(idsOf(readingOrder(wide, []))).toEqual(idsOf(readingOrder(LAYOUT, [])));
  });

  it('lists a stamp whose map has no piece, and a piece that has no icon by its label', () => {
    const fans = fanStamps({ alone: stamps('s', 1) }, [mark('alone', 10, 10)]);
    expect(idsOf(readingOrder({ icons: {}, labels: {} }, fans))).toEqual(['stamp:s1']);
    expect(idsOf(readingOrder({ icons: {}, labels: { late: named(500, 500), early: named(10, 10) } }, []))).toEqual(['piece:early', 'piece:late']);
  });
});
