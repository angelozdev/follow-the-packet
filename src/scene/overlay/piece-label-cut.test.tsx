// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { NAME_SERVERS, OFFICE_FLOORS, officeTwoFloorsNet } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapPiece, triggerSpies } from '@/testing/map-pieces';
import { frameOf } from '@/scene/frame';
import { MIN_WIDTH } from '@/scene/layout/arrange/geometry';
import { cutLabel } from '@/scene/layout/label-cut';
import { layoutMap } from '@/scene/layout/map-layout';
import { labelWidth } from '@/scene/layout/metrics';
import type { InspectTrigger, TriggerProps } from '@/scene/overlay/inspect-trigger';
import { MapLabels } from './map-labels';
import { PieceLabel, pieceDomId, type MapPiece } from './piece-label';

const LONG_NAME = NAME_SERVERS.down.id;
const FULL_NAME = `${LONG_NAME} ${MAP_TEXT.locked}`;
const CUT_NAME = 'servidor-autoritativo-not…';
const CUT_BOX = labelWidth(cutLabel(nameTag(LONG_NAME), 26), { locked: true });
const SERVER_ID = `device:${OFFICE_FLOORS.server.id}`;
const LONG_SERVER: MapPiece = mapPiece({ kind: 'device', variant: 'internet-server' }, LONG_NAME, nameTag(LONG_NAME), { locked: true });
const WORLD = officeTwoFloorsNet();
const PIECES: MapPiece[] = FLOORS_LABEL_PIECES.map((piece) => (piece.id === SERVER_ID ? { ...piece, label: nameTag(LONG_NAME), locked: true } : piece));

function renderLabel(piece: MapPiece, boxWidth?: number) {
  const trigger = triggerSpies();
  const onActivate = vi.fn();
  const { container } = render(<PieceLabel piece={piece} boxWidth={boxWidth} trigger={trigger} onActivate={onActivate} />);
  return { container, trigger, onActivate };
}

describe('a piece label in a box too narrow for its text', () => {
  it('shows the first characters and an ellipsis to the eye, hidden from screen readers, and reads the whole name with its lock', () => {
    renderLabel(LONG_SERVER, CUT_BOX);
    const button = screen.getByRole('button', { name: FULL_NAME });
    const seen = within(button).getByText(CUT_NAME);
    expect(seen).toHaveClass('name-tag');
    expect(seen.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(within(button).getByText(LONG_NAME)).toHaveClass('sr-only');
    expect(button).toHaveClass('map-button--locked');
    expect(button.querySelector('.map-button__lock svg')).not.toBeNull();
  });

  it('shows the alert and reads it too, and the box holds the characters the alert leaves', () => {
    renderLabel({ ...LONG_SERVER, state: 'intruded' }, CUT_BOX);
    const button = screen.getByRole('button', { name: `${FULL_NAME} ${MAP_TEXT.alert}` });
    expect(within(button).getByText('!')).toHaveClass('map-button__alert');
    expect(within(button).queryByText(CUT_NAME)).toBeNull();
    expect(within(button).getByText('servidor-autoritativo…')).toHaveClass('name-tag');
  });

  it('draws the label whole when no box is given or the box holds it, exactly as it was drawn before', () => {
    const [plain, unbounded, holding] = [renderLabel(LONG_SERVER), renderLabel(LONG_SERVER, 1000), renderLabel(LONG_SERVER, labelWidth(nameTag(LONG_NAME), { locked: true }))];
    for (const each of [unbounded, holding]) expect(each.container.querySelector('button')?.outerHTML).toBe(plain.container.querySelector('button')?.outerHTML);
    expect(screen.getAllByRole('button', { name: FULL_NAME })).toHaveLength(3);
    expect(screen.queryByText(CUT_NAME)).toBeNull();
  });

  it('draws the label of two lines whole, however narrow its box', () => {
    const firewall: MapPiece = mapPiece({ kind: 'firewall', variant: 'host-firewall' }, 'firewall-largo', MAP_TEXT.firewall['host-firewall'](LONG_NAME), { locked: true });
    const { container } = renderLabel(firewall, 50);
    expect(within(container).getByText(LONG_NAME)).toHaveClass('name-tag');
    expect(container.querySelector('[aria-hidden="true"] .name-tag')).toBeNull();
  });

  it('is still one button that inspects and opens the card of its piece', async () => {
    const user = userEvent.setup();
    const { trigger, onActivate } = renderLabel(LONG_SERVER, CUT_BOX);
    const button = screen.getByRole('button', { name: FULL_NAME });
    await user.hover(button);
    await user.tab();
    await user.click(button);
    expect(trigger.onPointerEnter).toHaveBeenCalledTimes(1);
    expect(trigger.onFocus).toHaveBeenCalledTimes(1);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith(LONG_SERVER.id);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});

describe('the labels of the map at 360 px', () => {
  function labelsAt(width: number) {
    const layout = layoutMap(WORLD, PIECES, { width });
    const given = new Map<string, TriggerProps>();
    const inspectTrigger: InspectTrigger = (pieceId) => {
      const props = triggerSpies();
      given.set(pieceId, props);
      return props;
    };
    const { container } = render(<MapLabels pieces={PIECES} layout={layout} frame={frameOf(width, layout.size)} inspectTrigger={inspectTrigger} onActivate={vi.fn()} />);
    return { container, given, layout };
  }

  it('draws the long name of a locked server cut, reads it whole, and draws every other label as it always was', () => {
    const { container, layout } = labelsAt(MIN_WIDTH);
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button.map-button')];
    expect(layout.size.width).toBe(MIN_WIDTH);
    expect(buttons).toHaveLength(PIECES.length);
    expect(within(container).getByRole('button', { name: FULL_NAME })).toHaveTextContent(`${CUT_NAME}${LONG_NAME}`);
    for (const piece of PIECES.filter(({ id }) => id !== SERVER_ID)) {
      const alone = render(<PieceLabel piece={piece} trigger={triggerSpies()} onActivate={vi.fn()} />, { container: document.createElement('div') });
      expect(buttons.find(({ id }) => id === pieceDomId(piece.id))?.outerHTML, piece.id).toBe(alone.container.querySelector('button')?.outerHTML);
    }
  });

  it('inspects the piece from its cut label, with the trigger of its own id', async () => {
    const user = userEvent.setup();
    const { container, given } = labelsAt(MIN_WIDTH);
    await user.hover(within(container).getByRole('button', { name: FULL_NAME }));
    expect(given.get(SERVER_ID)?.onPointerEnter).toHaveBeenCalledTimes(1);
    expect(given.get('device:your-laptop')?.onPointerEnter).not.toHaveBeenCalled();
  });

  it('draws the whole name at 390 px, where it fits', () => {
    const { container } = labelsAt(390);
    expect(within(container).getByRole('button', { name: FULL_NAME })).toHaveTextContent(LONG_NAME);
    expect(within(container).queryByText(CUT_NAME)).toBeNull();
  });
});
