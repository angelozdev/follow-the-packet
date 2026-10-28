// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { routedSendIncident, sendIncident } from '@/testing/incidents';
import { addressByPartsIncident } from '@/testing/web/web-incident';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const SENDING = sendIncident();
const SESSION = startSession([SENDING], SENDING.id);
const LAPTOP = PIECE_ID.device('your-laptop');
const PANEL = 'your-laptop';

const panelFor = (session: Session, pieceId: string, dispatch: Dispatch<SessionAction> = vi.fn(), onClose = vi.fn(), onChoose = vi.fn()) => <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, pieceId)} pieceId={pieceId} heading={createRef()} onClose={onClose} onChoose={onChoose} />;

function renderTerminal(pieceId = LAPTOP) {
  const spies = { dispatch: vi.fn(), onClose: vi.fn(), onChoose: vi.fn() };
  const view = render(panelFor(SESSION, pieceId, spies.dispatch, spies.onClose, spies.onChoose));
  return { ...spies, view };
}

async function tabTo(user: ReturnType<typeof userEvent.setup>, target: HTMLElement) {
  for (let stops = 0; stops < 40 && document.activeElement !== target; stops++) await user.tab();
  expect(target).toHaveFocus();
}

describe('terminal card', () => {
  it('opens in its tab, asks for a chip from each tray and cannot send yet', () => {
    renderTerminal();
    expect(screen.getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: PANEL })).toHaveTextContent(TERMINAL_TEXT.incomplete);
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
  });

  it('"Enviar" is the primary button of the card, like "Enviar solución", and "Listo" stays secondary', () => {
    renderTerminal();
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toHaveClass('btn btn--primary', { exact: true });
    expect(screen.queryByRole('button', { name: TASK_CARD_TEXT.done })).toBeNull();
  });

  it('names its trays Origen, Destino and Mensaje, with the origin of the card picked', () => {
    renderTerminal();
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual(Object.values(TERMINAL_TEXT.trays));
    expect(screen.getByRole('button', { name: 'your-laptop' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows the real ping command for the picked chips and sends them with a click', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.20' }));
    await user.click(screen.getByRole('button', { name: 'ping' }));
    expect(screen.getByRole('region', { name: PANEL }).querySelector('code')).toHaveTextContent('ping 192.168.1.20');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' });
  });

  it('shows an Echo Reply as a packet made by hand, without inventing a command', async () => {
    const user = userEvent.setup();
    renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Echo Reply' }));
    expect(screen.getByRole('region', { name: PANEL }).querySelector('code')).toHaveTextContent('paquete armado a mano: Echo Reply → 192.168.1.11');
  });

  it('picks and sends with the keyboard', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderTerminal();
    await tabTo(user, screen.getByRole('button', { name: '192.168.1.20' }));
    await user.keyboard('{Enter}');
    await tabTo(user, screen.getByRole('button', { name: 'ping' }));
    await user.keyboard('{Enter}');
    await tabTo(user, screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.keyboard('{Enter}');
    expect(dispatch).toHaveBeenCalledWith({ type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' });
  });

  it('picking another origin asks to move the card, and the other picks stay when it moves', async () => {
    const user = userEvent.setup();
    const { onChoose, view } = renderTerminal();
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Atacante' }));
    expect(onChoose).toHaveBeenCalledWith(PIECE_ID.actor('attacker'));
    view.rerender(panelFor(SESSION, PIECE_ID.actor('attacker')));
    expect(screen.getByRole('button', { name: 'Atacante' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '192.168.1.11' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('Escape closes nothing', async () => {
    const user = userEvent.setup();
    const { onClose } = renderTerminal();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: PANEL })).toBeInTheDocument();
  });
});

describe('terminal card of a traceroute', () => {
  const ROUTED = routedSendIncident();
  const hop = TERMINAL_TEXT.route.hop;

  function Terminal() {
    const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([ROUTED], ROUTED.id));
    return panelFor(session, LAPTOP, dispatch);
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
    expect(screen.getByRole('region')).toHaveTextContent('traceroute -I 198.51.100.50');
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
    expect(screen.getByRole('region').querySelector('code')).toHaveTextContent('ping 192.168.1.21');
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
    expect(screen.getByRole('region')).toHaveTextContent('«!H»: el equipo con esa IP avisó con Destination Host Unreachable que no pudo llegar al dispositivo de destino.');
  });
});

describe('terminal card of an incident that gives its urls by parts', () => {
  it('writes the line once every part is picked and sends the address those parts stand for', async () => {
    const user = userEvent.setup();
    const incident = addressByPartsIncident();
    const session = startSession([incident], incident.id);
    const dispatch = vi.fn();
    render(panelFor(session, PIECE_ID.device('lucia-laptop'), dispatch));
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
    for (const part of ['3000', '/pedidos']) await user.click(screen.getByRole('button', { name: part }));
    expect(screen.getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '?id=7' }));
    expect(screen.getByRole('region').querySelector('code')).toHaveTextContent('curl http://localhost:3000/pedidos?id=7');
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'sendPacket', fromId: 'lucia', toId: '3000/pedidos-id=7', messageId: 'curl' });
  });
});
