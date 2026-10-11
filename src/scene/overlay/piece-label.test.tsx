// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MAP_TEXT } from '@/copy';
import { PieceLabel, pieceDomId, type MapPiece } from './piece-label';

const SERVER: MapPiece = { id: 'device:servidor2', kind: 'device', variant: 'ec2-instance', anchorId: 'servidor2', label: '[[servidor2]]', locked: true, state: 'normal' };
const SG_PIECE: MapPiece = { id: 'firewall:sg-servidor2', kind: 'firewall', variant: 'security-group', anchorId: 'servidor2', label: '{{security-group}} [[servidor2]]', locked: false, state: 'normal' };

function renderLabel(piece: MapPiece, pinned = false) {
  const trigger = { onPointerEnter: vi.fn(), onPointerLeave: vi.fn(), onFocus: vi.fn(), onBlur: vi.fn(), onClick: vi.fn(), 'data-pinned': pinned ? (true as const) : undefined };
  const onActivate = vi.fn();
  render(<PieceLabel piece={piece} trigger={trigger} onActivate={onActivate} />);
  return { trigger, onActivate };
}

const LAPTOP: MapPiece = {
  id: 'device:your-laptop',
  kind: 'device',
  variant: 'laptop',
  anchorId: 'your-laptop',
  label: '[[tu-laptop]]',
  locked: false,
  state: 'normal',
  settings: { id: 'settings:your-laptop', label: 'Ajustes de red de [[tu-laptop]]' },
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

  it('hovering, focusing, leaving and blurring it call the props of its trigger', async () => {
    const user = userEvent.setup();
    const { trigger } = renderLabel(SG_PIECE);
    const label = screen.getByRole('button', { name: 'Security Group servidor2' });
    await user.hover(label);
    expect(trigger.onPointerEnter).toHaveBeenCalledTimes(1);
    await user.unhover(label);
    expect(trigger.onPointerLeave).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(trigger.onFocus).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(trigger.onBlur).toHaveBeenCalledTimes(1);
  });

  it('a click or Enter activates it and also calls the click of its trigger', async () => {
    const user = userEvent.setup();
    const { onActivate, trigger } = renderLabel(SG_PIECE);
    await user.click(screen.getByRole('button', { name: 'Security Group servidor2' }));
    await user.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(onActivate).toHaveBeenCalledWith(SG_PIECE.id);
    expect(trigger.onClick).toHaveBeenCalledTimes(2);
  });

  it('wears the pinned mark of its trigger', () => {
    renderLabel(SG_PIECE, true);
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).toHaveAttribute('data-pinned');
  });

  it('wears no pinned mark when its trigger gives none', () => {
    renderLabel(SG_PIECE);
    expect(screen.getByRole('button', { name: 'Security Group servidor2' })).not.toHaveAttribute('data-pinned');
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

  it('a piece with a settings entry has a second button beside its label that activates the entry and not the piece', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderLabel(LAPTOP);
    const entry = screen.getByRole('button', { name: 'Ajustes de red de tu-laptop' });
    expect(entry.querySelectorAll('.name-tag')).toHaveLength(1);
    expect(entry.id).toBe(pieceDomId('settings:your-laptop'));
    await user.click(entry);
    expect(onActivate).toHaveBeenLastCalledWith('settings:your-laptop');
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(onActivate).toHaveBeenLastCalledWith('device:your-laptop');
  });

  it('inspects the piece from its own button and not from the settings entry', async () => {
    const user = userEvent.setup();
    const { trigger } = renderLabel(LAPTOP);
    await user.hover(screen.getByRole('button', { name: 'Ajustes de red de tu-laptop' }));
    expect(trigger.onPointerEnter).not.toHaveBeenCalled();
    await user.hover(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(trigger.onPointerEnter).toHaveBeenCalledTimes(1);
  });

  it('a piece without a settings entry draws one button only', () => {
    renderLabel(SERVER);
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
