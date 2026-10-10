// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { sessionReducer, startSession, terminalCard, terminalLine, tracerouteLines } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { routedSendIncident, sendIncident } from '@/testing/incidents';
import { TerminalCard } from './terminal-card';

const SENDING = sendIncident();
const SESSION = startSession([SENDING], SENDING.id);
const TITLE = 'Terminal de your-laptop';
const noRoute = () => null;

function renderTerminal(pieceId = PIECE_ID.device('your-laptop')) {
  const card = terminalCard(SESSION, pieceId);
  if (!card) throw new Error('missing terminal');
  const handlers = { onPickOrigin: vi.fn(), onSend: vi.fn(), onClose: vi.fn() };
  const view = render(<TerminalCard card={card} describe={(picks) => terminalLine(SESSION, picks)} route={noRoute} {...handlers} />);
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
    view.rerender(<TerminalCard card={moved} describe={(picks) => terminalLine(SESSION, picks)} route={noRoute} onPickOrigin={vi.fn()} onSend={vi.fn()} onClose={vi.fn()} />);
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

describe('terminal card of a traceroute', () => {
  const ROUTED = routedSendIncident();
  const hop = TERMINAL_TEXT.route.hop;

  function Terminal() {
    const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([ROUTED], ROUTED.id));
    const card = terminalCard(session, PIECE_ID.device('your-laptop'));
    if (!card) throw new Error('missing terminal');
    return (
      <TerminalCard
        card={card}
        describe={(picks) => terminalLine(session, picks)}
        route={(picks) => tracerouteLines(session, picks)}
        onPickOrigin={vi.fn()}
        onSend={({ from, to, message }) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message })}
        onClose={vi.fn()}
      />
    );
  }

  async function traceTo(address: string) {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: address }));
    await user.click(screen.getByRole('button', { name: 'traceroute' }));
    return user;
  }

  const rows = (list: HTMLElement) => within(list).getAllByRole('listitem').map((item) => [...item.querySelectorAll('code')].map((code) => code.textContent));

  it('a traceroute shows its lines after it was sent', async () => {
    render(<Terminal />);
    const user = await traceTo('198.51.100.50');
    expect(screen.getByRole('dialog')).toHaveTextContent('traceroute -I 198.51.100.50');
    expect(screen.queryByRole('list', { name: TERMINAL_TEXT.route.label })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(rows(screen.getByRole('list', { name: TERMINAL_TEXT.route.label }))).toEqual([
      [hop(1, '192.168.1.1'), '4 ms'],
      [hop(2, '203.0.113.1'), '20 ms'],
      [hop(3, '203.0.113.2'), '44 ms'],
      [hop(4, '198.51.100.50'), '84 ms'],
    ]);
    expect(screen.getByText(TERMINAL_TEXT.route.notes.times)).toBeInTheDocument();
  });

  it('a ping prints no hops, and a new choice of address leaves the list of the old one', async () => {
    render(<Terminal />);
    const user = await traceTo('198.51.100.50');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(screen.getByRole('button', { name: '192.168.1.21' }));
    expect(screen.queryByRole('list', { name: TERMINAL_TEXT.route.label })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'ping' }));
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(screen.queryByRole('list', { name: TERMINAL_TEXT.route.label })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog').querySelector('code')).toHaveTextContent('ping 192.168.1.21');
  });

  it('a hop nobody answered is a star, explained below the list', async () => {
    render(<Terminal />);
    const user = await traceTo('10.0.0.10');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    const list = screen.getByRole('list', { name: TERMINAL_TEXT.route.label });
    expect(rows(list).slice(0, 3)).toEqual([[hop(1, '192.168.1.1'), '4 ms'], [hop(2, '203.0.113.1'), '20 ms'], [hop(3, '*')]]);
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
    expect(screen.getByText(TERMINAL_TEXT.route.notes.silent)).toBeInTheDocument();
  });

  it('the last line of a warning that the destination cannot be reached carries its mark, and the mark is explained in plain words', async () => {
    render(<Terminal />);
    const user = await traceTo('192.168.1.99');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(rows(screen.getByRole('list', { name: TERMINAL_TEXT.route.label }))).toEqual([[hop(1, '192.168.1.10'), '!H']]);
    expect(screen.getByRole('dialog')).toHaveTextContent('«!H»: el equipo con esa IP avisó con Destination Host Unreachable que no pudo llegar al dispositivo de destino.');
  });
});
