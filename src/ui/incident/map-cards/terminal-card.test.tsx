// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { startSession, terminalCard, terminalLine } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { sendIncident } from '@/testing/incidents';
import { TerminalCard } from './terminal-card';

const SENDING = sendIncident();
const SESSION = startSession([SENDING], SENDING.id);
const TITLE = 'Terminal de your-laptop';

function renderTerminal(pieceId = PIECE_ID.device('your-laptop')) {
  const card = terminalCard(SESSION, pieceId);
  if (!card) throw new Error('missing terminal');
  const handlers = { onPickOrigin: vi.fn(), onSend: vi.fn(), onClose: vi.fn() };
  const view = render(<TerminalCard card={card} describe={(picks) => terminalLine(SESSION, picks)} {...handlers} />);
  return { ...handlers, card, view };
}

describe('terminal card', () => {
  it('opens with the focus on its title, asks for a chip from each tray and cannot send yet', () => {
    renderTerminal();
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
    expect(screen.getByRole('dialog', { name: TITLE })).toHaveTextContent(TERMINAL_TEXT.incomplete);
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
  });

  it('"Enviar" is the primary button of the card, like "Enviar solución", and "Listo" stays secondary', () => {
    renderTerminal();
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toHaveClass('btn btn--primary', { exact: true });
    expect(screen.getByRole('button', { name: TASK_CARD_TEXT.done })).toHaveClass('btn', { exact: true });
  });

  it('names its trays Origen, Destino and Mensaje, with the origin of the card picked', () => {
    renderTerminal();
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(Object.values(TERMINAL_TEXT.trays));
    expect(screen.getByRole('button', { name: 'your-laptop' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the real ping command for the picked chips and sends them with a click', async () => {
    const user = userEvent.setup();
    const { onSend } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.20' }));
    await user.click(screen.getByRole('button', { name: 'ping' }));
    expect(screen.getByRole('dialog', { name: TITLE }).querySelector('code')).toHaveTextContent('ping 192.168.1.20');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(onSend).toHaveBeenCalledWith({ from: 'you', to: 'printer', message: 'ping' });
  });

  it('shows an Echo Reply as a packet made by hand, without inventing a command', async () => {
    const user = userEvent.setup();
    renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Echo Reply' }));
    expect(screen.getByRole('dialog', { name: TITLE }).querySelector('code')).toHaveTextContent('paquete armado a mano: Echo Reply → 192.168.1.11');
  });

  it('picks and sends with the keyboard', async () => {
    const user = userEvent.setup();
    const { onSend } = renderTerminal();
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: '192.168.1.20' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'ping' })).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSend).toHaveBeenCalledWith({ from: 'you', to: 'printer', message: 'ping' });
  });

  it('picking another origin asks to move the card, and the other picks stay when it moves', async () => {
    const user = userEvent.setup();
    const { onPickOrigin, view } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Atacante' }));
    expect(onPickOrigin).toHaveBeenCalledWith('attacker');
    const moved = terminalCard(SESSION, PIECE_ID.actor('attacker'));
    if (!moved) throw new Error('missing terminal');
    view.rerender(<TerminalCard card={moved} describe={(picks) => terminalLine(SESSION, picks)} onPickOrigin={vi.fn()} onSend={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Atacante' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '192.168.1.11' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Esc and "Listo" close it', async () => {
    const user = userEvent.setup();
    const { onClose } = renderTerminal();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
