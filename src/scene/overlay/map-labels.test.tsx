// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapPiece } from '@/testing/map-pieces';
import { frameOf } from '@/scene/frame';
import type { MapLayout } from '@/scene/layout/arrange/geometry';
import { layoutMap } from '@/scene/layout/map-layout';
import { readingOrder } from '@/scene/marks/reading-order';
import type { InspectTrigger, TriggerProps } from '@/scene/overlay/inspect-trigger';
import { PieceLabel, pieceDomId, type MapPiece } from '@/scene/overlay/piece-label';
import { MapLabels } from './map-labels';

const WORLD = officeTwoFloorsNet();
const DESKTOP = 1280;
const PHONE = 360;
const PIECES: MapPiece[] = FLOORS_LABEL_PIECES;

const layoutAt = (width: number, pieces: readonly MapPiece[] = PIECES): MapLayout => layoutMap(WORLD, pieces, { width });

function triggers() {
  const given = new Map<string, TriggerProps>();
  const inspectTrigger: InspectTrigger = (pieceId) => {
    const props: TriggerProps = { onPointerEnter: vi.fn(), onPointerLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onClick: vi.fn() };
    given.set(pieceId, props);
    return props;
  };
  return { given, inspectTrigger };
}

function labelsOn(layout: MapLayout, pieces: readonly MapPiece[] = PIECES) {
  const { given, inspectTrigger } = triggers();
  const onActivate = vi.fn();
  const frame = frameOf(DESKTOP, layout.size);
  const { container } = render(<MapLabels pieces={pieces} layout={layout} frame={frame} inspectTrigger={inspectTrigger} onActivate={onActivate} />);
  return { container, given, onActivate, frame };
}

const buttonsOf = (container: HTMLElement) => [...container.querySelectorAll<HTMLButtonElement>('button.map-button')];

describe('the labels of the pieces', () => {
  it('every label is a button with the name, the lock and the alert it has today', () => {
    const { container } = labelsOn(layoutAt(DESKTOP));
    const { inspectTrigger } = triggers();
    const drawn = buttonsOf(container);
    expect(drawn).toHaveLength(PIECES.length);
    for (const piece of PIECES) {
      const button = drawn.find(({ id }) => id === pieceDomId(piece.id));
      const alone = render(<PieceLabel piece={piece} trigger={inspectTrigger(piece.id)} onActivate={vi.fn()} />, { container: document.createElement('div') });
      expect(button?.outerHTML, piece.id).toBe(alone.container.querySelector('button')?.outerHTML);
    }
    expect(screen.getByRole('button', { name: `laptop-lucia ${MAP_TEXT.locked}` })).toHaveClass('map-button--locked');
    expect(screen.getByRole('button', { name: `tu-laptop ${MAP_TEXT.alert}` }).querySelector('.map-button__alert')).not.toBeNull();
    expect(screen.getByRole('button', { name: `firewall tu-laptop ${MAP_TEXT.locked}` })).toHaveClass('map-button--locked');
    expect(screen.getByRole('button', { name: 'laptop-marta' })).toHaveClass('map-button--name');
  });

  it('the reading order of the buttons is the order of the map', () => {
    for (const width of [DESKTOP, PHONE]) {
      const layout = layoutAt(width);
      const mapOrder = readingOrder(layout, []).map(({ id }) => pieceDomId(id));
      const centers = Object.entries(layout.icons).map(([id, { x, y, width: across, height }]) => ({ id: pieceDomId(id), x: x + across / 2, y: y + height / 2 }));
      const byPosition = [...centers].sort((a, b) => a.y - b.y || a.x - b.x).map(({ id }) => id);
      expect(mapOrder, `${layout.mode}`).toEqual(byPosition);
      for (const pieces of [PIECES, [...PIECES].reverse(), [...PIECES.slice(3), ...PIECES.slice(0, 3)]]) {
        const { container } = labelsOn(layout, pieces);
        expect(buttonsOf(container).map(({ id }) => id), `${layout.mode}`).toEqual(mapOrder);
        container.remove();
      }
    }
    expect(layoutAt(DESKTOP).mode).not.toBe(layoutAt(PHONE).mode);
  });

  it('draws no button for a piece the layout holds no label for', () => {
    const stray = mapPiece({ kind: 'device', variant: 'laptop' }, 'ghost-laptop', nameTag('laptop-fantasma'));
    const { container } = labelsOn(layoutAt(DESKTOP), [...PIECES, stray]);
    expect(buttonsOf(container).map(({ id }) => id)).not.toContain(pieceDomId(stray.id));
    expect(buttonsOf(container)).toHaveLength(PIECES.length);
  });

  it('stands each label at the pixels of the layout with the frame added, and gives it its lines', () => {
    const layout = layoutAt(DESKTOP);
    const { container, frame } = labelsOn(layout);
    const holders = [...container.querySelectorAll<HTMLElement>('.map-label')];
    expect(holders).toHaveLength(PIECES.length);
    for (const holder of holders) {
      const piece = PIECES.find(({ id }) => holder.querySelector('button')?.id === pieceDomId(id)) as MapPiece;
      const box = layout.labels[piece.id];
      expect([holder.style.left, holder.style.top, holder.style.width, holder.style.height]).toEqual([`${frame.x + box.x}px`, `${frame.y + box.y}px`, `${box.width}px`, `${box.height}px`]);
      expect(holder.dataset.lines).toBe(piece.kind === 'firewall' ? '2' : '1');
    }
  });

  it('gives each button the trigger of its own piece and tells the screen which piece was activated', async () => {
    const user = userEvent.setup();
    const { container, given, onActivate } = labelsOn(layoutAt(DESKTOP));
    const button = buttonsOf(container).find(({ id }) => id === pieceDomId('device:marta-laptop')) as HTMLButtonElement;
    await user.hover(button);
    await user.click(button);
    expect(given.get('device:marta-laptop')?.onPointerEnter).toHaveBeenCalledTimes(1);
    expect(given.get('device:marta-laptop')?.onClick).toHaveBeenCalledTimes(1);
    expect(given.get('device:lucia-laptop')?.onPointerEnter).not.toHaveBeenCalled();
    expect(onActivate).toHaveBeenCalledWith('device:marta-laptop');
  });
});
