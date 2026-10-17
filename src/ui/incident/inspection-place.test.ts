import { describe, expect, it } from 'vitest';
import { inspectionPlace, type Frame } from './inspection-place';

const MAP: Frame = { left: 0, top: 0, right: 1060, bottom: 900 };
const SIZE = { width: 352, tallest: 405, margin: 16 };
const RIGHT_PLACE = { left: 692, right: 1044, top: 479, bottom: 884 };
const LEFT_PLACE = { left: 16, right: 368, top: 479, bottom: 884 };

function place(card: Frame | null, current: 'right' | 'left' | null = null) {
  return inspectionPlace({ map: MAP, ...SIZE, card, current });
}

describe('the place of the inspection box', () => {
  it('takes the right place when no card is open', () => {
    expect(place(null)).toBe('right');
  });

  it('takes the left place when the card touches the right one', () => {
    expect(place({ left: 535, top: 203, right: 835, bottom: 589 })).toBe('left');
  });

  it('has no place when the card touches both', () => {
    expect(place({ left: 300, top: 600, right: 700, bottom: 880 })).toBeNull();
  });

  it('a card that ends above a place leaves it free', () => {
    const endsAbove = { left: RIGHT_PLACE.left, top: 100, right: RIGHT_PLACE.right, bottom: RIGHT_PLACE.top - 8 };
    expect(place(endsAbove)).toBe('right');
    expect(place({ ...endsAbove, bottom: endsAbove.bottom + 1 })).toBe('left');
  });

  it('a card closer than the gap to a place touches it', () => {
    const besideTheRightPlace = { left: 500, top: 500, right: RIGHT_PLACE.left - 8, bottom: 880 };
    expect(place(besideTheRightPlace)).toBe('right');
    expect(place({ ...besideTheRightPlace, right: besideTheRightPlace.right + 1 })).toBe('left');
    const besideTheLeftPlace = { left: LEFT_PLACE.right + 8, top: 500, right: 600, bottom: 880 };
    expect(place(besideTheLeftPlace, 'left')).toBe('left');
    expect(place({ ...besideTheLeftPlace, left: besideTheLeftPlace.left - 1 }, 'left')).toBe('right');
  });

  it('a card with no size touches no place', () => {
    expect(place({ left: 0, top: 0, right: 0, bottom: 0 })).toBe('right');
    expect(place({ left: 800, top: 600, right: 800, bottom: 880 })).toBe('right');
    expect(place({ left: 800, top: 600, right: 1000, bottom: 600 }, 'left')).toBe('left');
  });

  it('keeps the place it has while the card does not touch it', () => {
    const farFromBoth = { left: 400, top: 100, right: 600, bottom: 300 };
    expect(place(farFromBoth, 'left')).toBe('left');
    expect(place(farFromBoth, 'right')).toBe('right');
    expect(place(null, 'left')).toBe('left');
    const onTheLeft = { left: 6, top: 500, right: 306, bottom: 894 };
    expect(place(onTheLeft, 'left')).toBe('right');
    expect(place(onTheLeft, 'right')).toBe('right');
  });

  it('measures the place at the tallest the box may be, whatever it shows', () => {
    const inTheTopOfTheTallest = { left: 700, top: 300, right: 1000, bottom: 600 };
    expect(place(inTheTopOfTheTallest)).toBe('left');
    expect(inspectionPlace({ map: MAP, ...SIZE, tallest: 120, card: inTheTopOfTheTallest, current: null })).toBe('right');
  });
});
