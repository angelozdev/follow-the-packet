// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { classifyIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const INCIDENT = classifyIncident();
const START = startSession([INCIDENT], INCIDENT.id);
const YOU = PIECE_ID.device('your-laptop');
const INSIDE = 'Dentro de 192.168.1.0/24';
const OUTSIDE = 'Fuera';

const panelFor = (session: Session, dispatch: Dispatch<SessionAction> = vi.fn(), onClose = vi.fn()) => <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, YOU)} pieceId={YOU} heading={createRef()} onClose={onClose} onChoose={vi.fn()} />;

function Hosted() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => START);
  return panelFor(session, dispatch);
}

const openClassify = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('tab', { name: 'Clasificar' }));

const tile = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}\\b`) });
const bin = (name: string) => within(screen.getByRole('group', { name }));
const place = (name: string) => screen.getByRole('button', { name: new RegExp(`^Poner .* en ${name}$|^Poner aquí en ${name}$`) });

describe('classify card', () => {
  it('shows the block, the mask, the bits row and the two bins', async () => {
    const user = userEvent.setup();
    render(panelFor(START));
    await openClassify(user);
    const panel = screen.getByRole('region', { name: 'tu-laptop' });
    expect(panel).toHaveTextContent('192.168.1.0/24');
    expect(panel).toHaveTextContent('255.255.255.0');
    const octets = within(screen.getByRole('group', { name: 'Los 32 bits de la IP, en cuatro números' })).getAllByRole('img');
    expect(octets.map((octet) => octet.getAttribute('aria-label'))).toEqual(['11000000', '10101000', '00000001', '00001010']);
    expect(octets.map((octet) => octet.querySelectorAll('.bits__b--net').length)).toEqual([8, 8, 8, 0]);
    expect(screen.getByRole('group', { name: INSIDE })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: OUTSIDE })).toBeInTheDocument();
    expect(screen.getByText('Por clasificar')).toBeInTheDocument();
    expect(tile('impresora')).toHaveTextContent('192.168.1.21');
    expect(tile('impresora').querySelector('.ip__net')).toHaveTextContent('192.168.1.');
    expect(tile('impresora').querySelector('.ip__host')).toHaveTextContent('21');
    expect(tile('laptop-andres').querySelector('.ip__net')).toHaveTextContent('192.168.2.');
    expect(bin(INSIDE).getByText('Vacía')).toBeInTheDocument();
  });

  it('placing an item in a bin reports the answer of that item', async () => {
    const user = userEvent.setup();
    const dispatch = vi.fn();
    render(panelFor(START, dispatch));
    await openClassify(user);
    expect(place(INSIDE)).toBeDisabled();
    await user.click(tile('impresora'));
    expect(tile('impresora')).toHaveAttribute('aria-pressed', 'true');
    expect(place(INSIDE)).toBeEnabled();
    expect(dispatch).not.toHaveBeenCalled();
    await user.click(place(INSIDE));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'answerCard', deviceId: 'printer', picks: { bin: 'inside' } });
  });

  it('an item is placed with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    await openClassify(user);
    tile('laptop-andres').focus();
    await user.keyboard('{Enter}');
    expect(tile('laptop-andres')).toHaveAttribute('aria-pressed', 'true');
    place(OUTSIDE).focus();
    await user.keyboard('{Enter}');
    expect(bin(OUTSIDE).getByRole('button', { name: /^laptop-andres/ })).toBeInTheDocument();
    expect(bin(INSIDE).queryByRole('button', { name: /^laptop-andres/ })).toBeNull();
    expect(screen.getByRole('heading', { name: 'tu-laptop' })).toHaveFocus();
  });

  it('moves a placed item to the other bin, and says when nothing is left to classify', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    await openClassify(user);
    await user.click(tile('impresora'));
    await user.click(place(OUTSIDE));
    await user.click(bin(OUTSIDE).getByRole('button', { name: /^impresora/ }));
    expect(place(OUTSIDE)).toBeDisabled();
    await user.click(place(INSIDE));
    expect(bin(INSIDE).getByRole('button', { name: /^impresora/ })).toBeInTheDocument();
    expect(bin(OUTSIDE).queryByRole('button', { name: /^impresora/ })).toBeNull();
    expect(screen.queryByText('Nada por clasificar.')).toBeNull();
    await user.click(tile('laptop-andres'));
    await user.click(place(OUTSIDE));
    expect(screen.getByText('Nada por clasificar.')).toBeInTheDocument();
  });

  it('the line of a placed item shows as a success or an error message', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    await openClassify(user);
    await user.click(tile('impresora'));
    await user.click(place(INSIDE));
    await user.click(tile('laptop-andres'));
    await user.click(place(INSIDE));
    const lines = within(screen.getByRole('group', { name: INSIDE })).getAllByRole('status');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toHaveClass('message--success');
    expect(lines[0]).toHaveTextContent('Sus tres primeros números, 192.168.1, son los del bloque: cabe.');
    expect(lines[1]).toHaveClass('message--error');
    expect(lines[1]).toHaveTextContent('Sus tres primeros números, 192.168.2, no son 192.168.1: no cabe.');
    expect(lines[1]).not.toHaveAttribute('role', 'alert');
  });

  it('has no «Listo», and Escape closes nothing and reports nothing', async () => {
    const user = userEvent.setup();
    const [dispatch, onClose] = [vi.fn(), vi.fn()];
    render(panelFor(START, dispatch, onClose));
    await openClassify(user);
    expect(screen.queryByRole('button', { name: TASK_CARD_TEXT.done })).toBeNull();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('without a prefix that ends at a dot it still writes the bits row and leaves the IPs whole', async () => {
    const user = userEvent.setup();
    const incident = { ...INCIDENT, identify: { ...INCIDENT.identify, classify: { ...INCIDENT.identify.classify!, cidr: '192.168.1.0/28' } } };
    render(panelFor(startSession([incident], incident.id)));
    await openClassify(user);
    expect(screen.getByRole('region')).toHaveTextContent('255.255.255.240');
    expect(tile('impresora').querySelector('.ip')).toBeNull();
    expect(tile('impresora')).toHaveTextContent('192.168.1.21');
  });
});
