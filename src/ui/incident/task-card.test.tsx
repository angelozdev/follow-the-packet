// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, toPlainText } from '@/copy';
import { barrierCard, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { TaskCard } from './task-card';

const DOOR = 'Security Group servidor2';

function renderCard(incidentId: string) {
  const session = startSession(INCIDENTS, incidentId);
  const card = barrierCard(session, PIECE_ID.barrier(SG.servidor2));
  if (!card) throw new Error('missing door');
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={session.incident.chips} {...handlers} />);
  return handlers;
}

describe('task card', () => {
  it('opens with the focus on its title and says when the door has no rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: DOOR })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules));
  });

  it('builds a rule with clicks: one chip from each tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: 'Ping' }));
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'servidor1' }));
    expect(onPlace).toHaveBeenCalledWith(WHAT.ping.id, FROM.servidor1.id);
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: 'servidor1' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith(WHAT.ping.id, FROM.servidor1.id);
  });

  it('a chip clicked again, or clicked in the slot, goes back to its tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: 'Ping' }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack('Ping') }));
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'servidor1' }));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('gives a chip back from the slot with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack('Ping') })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Ping' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes a rule with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard('04-02');
    await user.tab();
    const removeButton = screen.getByRole('button', { name: TASK_CARD_TEXT.remove('Echo Reply (vuelta) ← Todo internet') });
    expect(removeButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith(DAY_SHIFT_RULE.id);
    expect(screen.getByRole('heading', { name: DOOR })).toHaveFocus();
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
