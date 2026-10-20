import { describe, expect, it } from 'vitest';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { layoutMap } from '@/scene/layout/map-layout';
import type { Point } from '@/scene/layout/graph';
import { CARD_WIDTH, LABEL_REACH, ROOM_UNDER_THE_DRAWING, TITLE_BAR, cardPlacement, cardSpan, dockOffset, sideHeight, type CardPlacement } from './placement';
import { cardSlot } from './slot';

const WORLD = officeTwoFloorsNet();
const TALL_WINDOW = 2000;
const LOW_WINDOW = 360;
const DOCK_MARGIN = 6;
const USABLE_CARD = 200;

function slotOf(pieceId: string, width: number, windowHeight = TALL_WINDOW) {
  const layout = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width });
  const piece = FLOORS_LABEL_PIECES.find(({ id }) => id === pieceId);
  if (piece === undefined) throw new Error(`no piece ${pieceId}`);
  const placement = cardPlacement(piece, FLOORS_LABEL_PIECES.filter(({ id }) => id !== pieceId), layout);
  const shift: Point = [Math.max(0, Math.floor((width - layout.size.width) / 2)), TITLE_BAR];
  const layer = { width, height: shift[1] + layout.size.height + ROOM_UNDER_THE_DRAWING };
  return { slot: cardSlot(placement, shift, layer, windowHeight), placement, shift, layer, layout };
}

describe('where a card sits in the layer', () => {
  it('anchors at the middle of the icon of its piece, in the pixels of the layer', () => {
    for (const width of [1500, 390]) {
      const { slot, layout, shift } = slotOf('firewall:your-firewall', width);
      const icon = layout.icons['firewall:your-firewall'];
      expect(slot.anchor, `${width}`).toEqual([shift[0] + icon.x + icon.width / 2, shift[1] + icon.y + icon.height / 2]);
    }
  });

  it('is on the side with more room when the layer holds it, and docks when the layer is too narrow for either side', () => {
    expect(slotOf('firewall:your-firewall', 1060).slot.position).toBe('right');
    expect(slotOf('internet:internet', 1060).slot.position).toBe('left');
    expect(slotOf('firewall:your-firewall', 390).slot.position).toBe('dock');
  });

  it('is picked against the width of the layer and not against the width of the drawing, which is centered in it', () => {
    const drawing = 1200;
    const layer = { width: 1500, height: 900 };
    const shift: Point = [(layer.width - drawing) / 2, TITLE_BAR];
    const placement: CardPlacement = { anchor: [500, 100], gap: 70, avoid: null, pieces: [] };
    expect((placement.anchor[0] + shift[0]) * 2).toBeLessThan(layer.width);
    expect((placement.anchor[0] + shift[0]) * 2).toBeGreaterThan(drawing);
    expect(cardSlot(placement, shift, layer, TALL_WINDOW).position).toBe('right');
  });

  it('docks a card that picks its side by the screen when that side is not clear of a label, and never takes the other side', () => {
    const layer = { width: 1400, height: 900 };
    const shift: Point = [0, TITLE_BAR];
    const blocked: CardPlacement = { anchor: [450, 100], gap: 110, avoid: [700], pieces: [], screenPicksSide: true };
    const free: CardPlacement = { ...blocked, avoid: [] };
    const terminal: CardPlacement = { anchor: [450, 100], gap: 70, avoid: [700], pieces: [] };
    expect([blocked, free, terminal].map((placement) => cardSlot(placement, shift, layer, TALL_WINDOW).position)).toEqual(['dock', 'right', 'left']);
  });

  it('keeps the card of a firewall off the x span of the label of every other piece at every width, docking when no side is clear', () => {
    let beside = 0;
    for (const width of [768, 900, 1060, 1280, 1440, 1920]) {
      const { slot, layout, shift } = slotOf('firewall:your-firewall', width);
      if (slot.position === 'dock') continue;
      const [near, far] = cardSpan(slot.position, slot.anchor[0], slot.gap);
      const others = Object.entries(layout.labels).filter(([id]) => id !== 'firewall:your-firewall');
      const covered = others.filter(([, { x, width: wide }]) => x + shift[0] < far && near < x + shift[0] + wide).map(([id]) => id);
      expect(covered, `${width}`).toEqual([]);
      beside++;
    }
    expect(beside).toBeGreaterThan(0);
  });

  it('hangs a docked card from the bottom left corner of the layer, whatever the height of the card', () => {
    const { slot, layer } = slotOf('device:your-laptop', 390);
    expect(slot.position).toBe('dock');
    expect(slot.dock).toEqual(dockOffset(slot.anchor, layer));
    expect([slot.anchor[0] + slot.dock[0], slot.anchor[1] + slot.dock[1]]).toEqual([DOCK_MARGIN, layer.height - DOCK_MARGIN]);
  });

  it('lets a card beside its piece rise up to the title bar and no higher', () => {
    const { slot } = slotOf('internet:internet', 1060);
    expect(slot.anchor[1] + slot.top).toBe(TITLE_BAR);
  });

  it('keeps a docked card from covering a piece: it is shorter than the room between the corner and the lowest piece it spans', () => {
    const { slot, layer, placement, shift } = slotOf('device:your-laptop', 390);
    const spanned = placement.pieces.map(({ x, bottom }) => ({ x: x + shift[0], bottom: bottom + shift[1] })).filter(({ x }) => x - LABEL_REACH < DOCK_MARGIN + CARD_WIDTH);
    const lowest = Math.max(...spanned.map(({ bottom }) => bottom));
    expect(slot.room).toBeLessThanOrEqual(layer.height - DOCK_MARGIN - lowest);
    expect(slot.room).toBeGreaterThanOrEqual(USABLE_CARD);
  });

  it('is never taller than the window allows, so its foot can be in view, and never less than a card that can be used', () => {
    const roomy = slotOf('internet:internet', 1060, TALL_WINDOW).slot;
    const low = slotOf('internet:internet', 1060, LOW_WINDOW).slot;
    expect(low.room).toBe(sideHeight({ height: LOW_WINDOW }));
    expect(low.room).toBeLessThan(roomy.room);
    expect(slotOf('internet:internet', 1060, 0).slot.room).toBe(USABLE_CARD);
    expect(slotOf('device:your-laptop', 390, LOW_WINDOW).slot.room).toBeLessThanOrEqual(sideHeight({ height: LOW_WINDOW }));
  });
});
