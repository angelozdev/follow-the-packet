// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { ROOM_UNDER_THE_DRAWING } from '@/scene/cards/placement';
import { frameOf } from '@/scene/frame';
import { overlaps, type Box } from '@/scene/layout/arrange/geometry';
import { layoutMap } from '@/scene/layout/map-layout';
import { MAP_CARD } from '@/scene/html-layer';
import type { MapPiece } from '@/scene/overlay/piece-label';
import { CardAnchor } from './card-anchor';

const WORLD = officeTwoFloorsNet();
const PIECES: MapPiece[] = FLOORS_LABEL_PIECES;
const ROW = 1500;
const STACK = 1060;
const PHONE = 390;
const TALL_WINDOW = 2000;
const DOCK_MARGIN = 6;
const TERMINAL_HEIGHT = 495;
const FIREWALL = 'firewall:your-firewall';
const INTERNET = 'internet:internet';
const YOUR_LAPTOP = 'device:your-laptop';

function sceneAt(width: number) {
  const layout = layoutMap(WORLD, PIECES, { width });
  const frame = frameOf(width, layout.size);
  const layer = { width, height: frame.y + layout.size.height + ROOM_UNDER_THE_DRAWING };
  return { layout, frame, layer };
}

function anchorOf(pieceId: string, width: number, windowHeight = TALL_WINDOW) {
  const { layout, frame, layer } = sceneAt(width);
  const piece = PIECES.find(({ id }) => id === pieceId);
  if (piece === undefined) throw new Error(`no piece ${pieceId}`);
  return (
    <CardAnchor piece={piece} others={PIECES.filter(({ id }) => id !== pieceId)} layout={layout} frame={frame} layer={layer} windowHeight={windowHeight}>
      <button type="button">Done</button>
    </CardAnchor>
  );
}

function holderOf(container: HTMLElement): HTMLElement {
  const holder = container.querySelector<HTMLElement>(MAP_CARD);
  if (holder === null) throw new Error('no card was drawn');
  return holder;
}

function iconCenter(pieceId: string, width: number): [number, number] {
  const { layout, frame } = sceneAt(width);
  const icon = layout.icons[pieceId];
  return [frame.x + icon.x + icon.width / 2, frame.y + icon.y + icon.height / 2];
}

const variable = (holder: HTMLElement, name: string) => Number.parseFloat(holder.style.getPropertyValue(name));

/** Takes the holder of a card and the height its content would take; returns the box the stylesheet gives it in the layer: beside the anchor on the side of its class, centered on it between the title bar and the bottom margin, or docked with its bottom left corner in the corner of the layer, and never taller than `--card-room`. */
function boxOf(holder: HTMLElement, natural: number): Box {
  const [left, top] = [Number.parseFloat(holder.style.left), Number.parseFloat(holder.style.top)];
  const [gap, width, room] = [variable(holder, '--card-gap'), variable(holder, '--card-width'), variable(holder, '--card-room')];
  const [toLeft, toBottom, highest] = [variable(holder, '--card-x'), variable(holder, '--card-y'), variable(holder, '--card-top')];
  const height = Math.min(natural, room);
  if (holder.classList.contains('map-card--dock')) return { x: left + toLeft, y: top + toBottom - height, width, height };
  const x = holder.classList.contains('map-card--left') ? left - gap - width : left + gap;
  return { x, y: top + Math.max(highest, Math.min(-height / 2, toBottom - height)), width, height };
}

const labelsOf = (width: number): Box[] => {
  const { layout, frame } = sceneAt(width);
  return Object.values(layout.labels).map((box) => ({ ...box, x: box.x + frame.x, y: box.y + frame.y }));
};

describe('the card anchor', () => {
  let reveal: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    reveal = vi.fn();
    HTMLElement.prototype.scrollIntoView = reveal as unknown as HTMLElement['scrollIntoView'];
  });

  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  });

  it('the card of a piece opens beside its label on the side with more room', () => {
    for (const [pieceId, side] of [[FIREWALL, 'right'], [INTERNET, 'left']] as const) {
      const { container } = render(anchorOf(pieceId, STACK));
      const holder = holderOf(container);
      const [anchorX] = iconCenter(pieceId, STACK);
      const box = boxOf(holder, TERMINAL_HEIGHT);
      expect(holder, pieceId).toHaveClass(`map-card--${side}`);
      expect(anchorX * 2 > STACK ? 'left' : 'right', pieceId).toBe(side);
      expect(side === 'right' ? box.x - anchorX : anchorX - (box.x + box.width), pieceId).toBe(variable(holder, '--card-gap'));
      expect(box.x, pieceId).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, pieceId).toBeLessThanOrEqual(STACK);
      container.remove();
    }
  });

  it('the card docks in the corner when neither side keeps it inside the map', () => {
    for (const width of [PHONE, STACK]) {
      const { layer } = sceneAt(width);
      const { container } = render(anchorOf(YOUR_LAPTOP, width));
      const holder = holderOf(container);
      const box = boxOf(holder, TERMINAL_HEIGHT);
      expect(holder, `${width}`).toHaveClass('map-card--dock');
      expect([box.x, box.y + box.height], `${width}`).toEqual([DOCK_MARGIN, layer.height - DOCK_MARGIN]);
      expect(box.y, `${width}`).toBeGreaterThan(0);
      container.remove();
    }
  });

  it('the card never covers the label of a piece the player compares', () => {
    const terminals = PIECES.filter(({ kind }) => kind !== 'firewall');
    expect(terminals.length).toBeGreaterThan(3);
    for (const width of [ROW, STACK, PHONE]) {
      const labels = labelsOf(width);
      for (const { id } of terminals) {
        const { container } = render(anchorOf(id, width));
        const box = boxOf(holderOf(container), TERMINAL_HEIGHT);
        const covered = labels.filter((label) => overlaps(box, label));
        expect(covered, `${id} at ${width}`).toEqual([]);
        container.remove();
      }
    }
  });

  it('the card keeps its place when the container changes size and the layout changes mode', () => {
    expect(sceneAt(STACK).layout.mode).not.toBe(sceneAt(ROW).layout.mode);
    const view = render(anchorOf(FIREWALL, STACK));
    const holder = holderOf(view.container);
    const inside = view.getByRole('button');
    const placeOf = () => [Number.parseFloat(holder.style.left), Number.parseFloat(holder.style.top)];
    expect(holder).toHaveClass('map-card--right');
    expect(placeOf()).toEqual(iconCenter(FIREWALL, STACK));

    view.rerender(anchorOf(FIREWALL, ROW));
    expect(holderOf(view.container)).toBe(holder);
    expect(view.getByRole('button')).toBe(inside);
    expect(holder).toHaveClass('map-card--dock');
    expect(holder).not.toHaveClass('map-card--right');
    expect(placeOf()).toEqual(iconCenter(FIREWALL, ROW));

    view.rerender(anchorOf(FIREWALL, STACK));
    expect(holderOf(view.container)).toBe(holder);
    expect(holder).toHaveClass('map-card--right');
    expect(placeOf()).toEqual(iconCenter(FIREWALL, STACK));
  });

  it('is the element the inspection box watches, with the width and the room the stylesheet reads', () => {
    const { container } = render(anchorOf(INTERNET, STACK, 400));
    const holder = holderOf(container);
    expect(holder.matches(MAP_CARD)).toBe(true);
    expect(variable(holder, '--card-width')).toBe(300);
    expect(variable(holder, '--card-room')).toBe(400 - 56 - DOCK_MARGIN);
  });

  it('asks the browser to bring the card into view when it opens and when another piece opens, and not on every render', () => {
    const view = render(anchorOf(FIREWALL, STACK));
    expect(reveal).toHaveBeenCalledTimes(1);
    expect(reveal).toHaveBeenLastCalledWith({ block: 'nearest', inline: 'nearest' });
    view.rerender(anchorOf(FIREWALL, PHONE));
    view.rerender(anchorOf(FIREWALL, STACK));
    expect(reveal).toHaveBeenCalledTimes(1);
    view.rerender(anchorOf(INTERNET, STACK));
    expect(reveal).toHaveBeenCalledTimes(2);
  });
});
