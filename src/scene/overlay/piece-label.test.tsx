// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PieceLabel, pieceDomId, type MapPiece } from './piece-label';

const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: 'servidor2', locked: true };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} servidor2', locked: false };

function renderLabel(piece: MapPiece) {
  const handlers = { onInspect: vi.fn(), onActivate: vi.fn() };
  render(<PieceLabel piece={piece} {...handlers} />);
  return handlers;
}

describe('piece label', () => {
  it('reads its plain label and says when the piece is locked', () => {
    renderLabel(SERVER);
    expect(screen.getByRole('button', { name: 'servidor2 con candado' })).toBeInTheDocument();
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

  it('has a DOM id so the focus can come back to it', () => {
    renderLabel(SG_PIECE);
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).toHaveAttribute('id', pieceDomId(SG_PIECE.id));
  });
});
