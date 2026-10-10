// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, toPlainText } from '@/copy';
import { firewallCard, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { INCIDENTS } from '@/levels';
import { LUCIA_FIREWALL } from '@/levels/01-first-day/shared';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { filterIncident } from '@/testing/incidents';
import { TaskCard } from './task-card';

const SG_SERVIDOR2 = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const DAY_SHIFT_ROW = 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)';

function renderCard(incidentId: string, firewallId: string = SG.servidor2) {
  const session = startSession(INCIDENTS, incidentId);
  const card = firewallCard(session, PIECE_ID.firewall(firewallId));
  if (!card) throw new Error(`missing firewall ${firewallId}`);
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  render(<TaskCard card={card} chips={filterIncident(incidentId).chips} {...handlers} />);
  return handlers;
}

describe('task card', () => {
  it('opens with the focus on its title and says when the Security Group has no inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: SG_SERVIDOR2 })).toHaveTextContent(toPlainText(TASK_CARD_TEXT.noRules['security-group']));
  });

  it('names the slot of a Security Group after its inbound rules', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.slot['security-group'] })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Regla de entrada nueva' })).toBeInTheDocument();
  });

  it('a host firewall says it has no rules and names its slot without the later inbound rules', () => {
    renderCard('01-04', LUCIA_FIREWALL.id);
    expect(screen.getByRole('heading', { name: 'firewall laptop-lucia' })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: 'firewall laptop-lucia' })).toHaveTextContent('No tiene reglas: no deja entrar nada.');
    expect(screen.getByRole('group', { name: 'Regla nueva' })).toBeInTheDocument();
    expect(screen.queryByText(/de entrada/)).toBeNull();
  });

  it('names its trays Type and Source, like the inbound rules of the console', () => {
    renderCard('04-01');
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.what })).toHaveTextContent(ECHO_REQUEST);
    expect(screen.getByRole('group', { name: TASK_CARD_TEXT.from })).toHaveTextContent(SG_SERVIDOR1);
  });

  it('builds a rule with clicks: one chip from each tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
  });

  it('builds a rule with the keyboard', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.tab();
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    expect(screen.getByRole('button', { name: SG_SERVIDOR1 })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledWith(WHAT.echoRequest.id, FROM.sgServidor1.id);
  });

  it('a chip clicked in the slot goes back to its tray', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderCard('04-01');
    await user.click(screen.getByRole('button', { name: ECHO_REQUEST }));
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) }));
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: SG_SERVIDOR1 }));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('gives a chip back from the slot with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.giveBack(ECHO_REQUEST) })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: ECHO_REQUEST })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('removes a rule with the keyboard and keeps the focus inside the card', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderCard('04-02');
    await user.tab();
    const removeButton = screen.getByRole('button', { name: TASK_CARD_TEXT.remove(DAY_SHIFT_ROW) });
    expect(removeButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRemove).toHaveBeenCalledWith(DAY_SHIFT_RULE.id);
    expect(screen.getByRole('heading', { name: SG_SERVIDOR2 })).toHaveFocus();
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderCard('04-01');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
