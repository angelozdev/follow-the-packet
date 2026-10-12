// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MAP_TEXT } from '@/copy';
import { PieceLabel, pieceDomId, type MapPiece } from './piece-label';

const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: '[[servidor2]]', locked: true, state: 'normal' };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} [[servidor2]]', locked: false, state: 'normal' };

function renderLabel(piece: MapPiece) {
  const handlers = { onInspect: vi.fn(), onActivate: vi.fn() };
  render(<PieceLabel piece={piece} {...handlers} />);
  return handlers;
}

const LAPTOP: MapPiece = {
  id: 'device:your-laptop',
  kind: 'device',
  variant: 'laptop',
  anchorId: 'your-laptop',
  label: '[[tu-laptop]]',
  locked: false,
  state: 'normal',
};

describe('piece label', () => {
  it('reads its plain label and says when the piece is locked', () => {
    renderLabel(SERVER);
    expect(screen.getByRole('button', { name: 'servidor2 con candado' })).toBeInTheDocument();
  });

  it("draws the name of a firewall's device as a name tag", () => {
    renderLabel(SG_PIECE);
    const label = screen.getByRole('button', { name: 'Security Group servidor2' });
    expect(label.querySelectorAll('.name-tag')).toHaveLength(1);
    expect(screen.getByText('servidor2')).toHaveClass('name-tag');
    expect(label).not.toHaveClass('map-button--name');
  });

  it('a label that is only a name looks like a name tag', () => {
    renderLabel(SERVER);
    const label = screen.getByRole('button', { name: `servidor2 ${MAP_TEXT.locked}` });
    expect(label).toHaveClass('map-button--name');
    expect(label.querySelector('.name-tag')).toHaveTextContent('servidor2');
  });

  it('draws the lock of a locked piece in ink, not as an emoji', () => {
    renderLabel(SERVER);
    const label = screen.getByRole('button', { name: `servidor2 ${MAP_TEXT.locked}` });
    expect(label).not.toHaveTextContent('🔒');
    expect(label.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('hovering or focusing inspects the piece, and leaving stops', async () => {
    const user = userEvent.setup();
    const { onInspect } = renderLabel(SG_PIECE);
    const label = screen.getByRole('button', { name: 'Security Group servidor2' });
    await user.hover(label);
    expect(onInspect).toHaveBeenLastCalledWith(SG_PIECE.id);
    await user.unhover(label);
    expect(onInspect).toHaveBeenLastCalledWith(null);
    await user.tab();
    expect(onInspect).toHaveBeenLastCalledWith(SG_PIECE.id);
  });

  it('a click or Enter activates it', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderLabel(SG_PIECE);
    await user.click(screen.getByRole('button', { name: 'Security Group servidor2' }));
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenCalledWith(SG_PIECE.id);
  });

  it('a device under attack carries its alert inside its label, read as text, so it never covers the label', () => {
    renderLabel({ ...SERVER, state: 'intruded' });
    const label = screen.getByRole('button', { name: 'servidor2 con candado con alerta: entra algo que no debe' });
    expect(label).toContainElement(screen.getByText('!'));
  });

  it('a firewall that stops a packet shows no alert in its label', () => {
    renderLabel({ ...SG_PIECE, state: 'blocking' });
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).not.toHaveTextContent('!');
  });

  it('has a DOM id so the focus can come back to it', () => {
    renderLabel(SG_PIECE);
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).toHaveAttribute('id', pieceDomId(SG_PIECE.id));
  });

  it('a label draws one button however many cards its piece has', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderLabel(LAPTOP);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'tu-laptop' });
    expect(button.id).toBe(pieceDomId('device:your-laptop'));
    expect(screen.queryByRole('button', { name: /Ajustes de red/ })).toBeNull();
    expect(button.closest('.map-labels')).toBeNull();
    await user.click(button);
    expect(onActivate).toHaveBeenCalledExactlyOnceWith('device:your-laptop');
  });

  it('inspects the piece from its only button', async () => {
    const user = userEvent.setup();
    const { onInspect } = renderLabel(LAPTOP);
    await user.hover(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(onInspect).toHaveBeenLastCalledWith(LAPTOP.id);
    await user.unhover(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(onInspect).toHaveBeenLastCalledWith(null);
  });

  it('a piece without a settings entry draws one button only', () => {
    renderLabel(SERVER);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
