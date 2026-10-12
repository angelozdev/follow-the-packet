import { describe, expect, it } from 'vitest';
import { inspectionRoom, type Edges } from './inspection-room';

const BOX: Edges = { left: 692, right: 1044, bottom: 884 };

describe('the room of the inspection box', () => {
  it('is the height from the bottom of the box up to the lowest mark that lies over it, less a gap', () => {
    const marks: Edges[] = [
      { left: 580, right: 751, bottom: 584 },
      { left: 547, right: 644, bottom: 418 },
    ];
    expect(inspectionRoom(BOX, marks)).toBe(884 - 584 - 8);
  });

  it('ignores a mark that shares no width with the box, and one that ends below its bottom edge', () => {
    const marks: Edges[] = [
      { left: 100, right: 692, bottom: 800 },
      { left: 1044, right: 1200, bottom: 800 },
      { left: 800, right: 900, bottom: 890 },
    ];
    expect(inspectionRoom(BOX, marks)).toBeNull();
  });

  it('is null when nothing lies over the box', () => {
    expect(inspectionRoom(BOX, [])).toBeNull();
  });

  it('keeps a box that can be read when a mark stands just above it', () => {
    expect(inspectionRoom(BOX, [{ left: 700, right: 800, bottom: 880 }])).toBe(120);
  });

  it('counts a mark that touches the box by one pixel of width and not one that only touches its edge', () => {
    expect(inspectionRoom(BOX, [{ left: 600, right: 693, bottom: 500 }])).toBe(884 - 500 - 8);
    expect(inspectionRoom(BOX, [{ left: 600, right: 692, bottom: 500 }])).toBeNull();
  });
});
