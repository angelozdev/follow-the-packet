import { describe, expect, it } from 'vitest';
import { inspectionPlace, type Frame } from './inspection-place';

const MAP: Frame = { left: 0, top: 0, right: 1060, bottom: 900 };
const SIZE = { width: 352, margin: 16 };
const RIGHT_PLACE = { left: 692, right: 1044, top: 479, bottom: 884 };

function place(current: 'right' | 'left' | null = null) {
  return inspectionPlace({ map: MAP, ...SIZE, current });
}

describe('the place of the inspection box', () => {
  it('takes the right place when no card is open', () => {
    expect(place()).toBe('right');
  });

  it('keeps the place it has while no mark asks for the other', () => {
    expect(place('left')).toBe('left');
    expect(place('right')).toBe('right');
  });

  describe('with the marks of the map', () => {
    const inTheRightPlace = { left: 700, top: 800, right: 780, bottom: 820 };
    const inTheLeftPlace = { left: 40, top: 800, right: 120, bottom: 820 };
    const withMarks = (marks: Frame[], current: 'right' | 'left' | null = null) => inspectionPlace({ map: MAP, ...SIZE, current, marks });

    it('takes the left place when a mark stands where the box ends, which the least box covers', () => {
      expect(withMarks([inTheRightPlace])).toBe('left');
      expect(withMarks([inTheLeftPlace])).toBe('right');
    });

    it('leaves a mark that stands above the least height of the box to the height of the box, and keeps the place it has', () => {
      const above = { left: 700, top: 600, right: 780, bottom: 620 };
      expect(withMarks([above])).toBe('right');
      expect(withMarks([above], 'left')).toBe('left');
    });

    it('counts a mark closer than the gap to the least box and not one that is exactly the gap away', () => {
      const leastTop = RIGHT_PLACE.bottom - 120;
      const mark = (bottom: number) => ({ left: 700, top: bottom - 20, right: 780, bottom });
      expect(withMarks([mark(leastTop - 8)])).toBe('right');
      expect(withMarks([mark(leastTop - 8 + 1)])).toBe('left');
    });

    it('moves to the place that is free of marks even when the box has the other one', () => {
      expect(withMarks([inTheLeftPlace], 'left')).toBe('right');
      expect(withMarks([inTheRightPlace], 'right')).toBe('left');
    });

    it('keeps the order of the places when the marks cover both or none, so a place with a mark in it is still a place', () => {
      expect(withMarks([inTheRightPlace, inTheLeftPlace])).toBe('right');
      expect(withMarks([inTheRightPlace, inTheLeftPlace], 'left')).toBe('left');
      expect(withMarks([])).toBe('right');
    });
  });
});
