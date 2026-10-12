// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT } from '@/copy';
import { sessionReducer, startSession, type Session } from '@/game';
import { classifyCard } from '@/game/view/cards/identify/classify-card';
import { PIECE_ID } from '@/game/view/piece-id';
import { classifyIncident } from '@/testing/incidents';
import { ClassifyCard } from './classify-card';

const INCIDENT = classifyIncident();
const START = startSession([INCIDENT], INCIDENT.id);
const YOU = PIECE_ID.device('your-laptop');
const INSIDE = 'Dentro de 192.168.1.0/24';
const OUTSIDE = 'Fuera';

function cardOf(session: Session) {
  const card = classifyCard(session, YOU);
  if (!card) throw new Error('missing the classify card');
  return card;
}

function Hosted({ onClose }: { onClose: () => void }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => START);
  return <ClassifyCard card={cardOf(session)} onAnswer={(deviceId, picks) => dispatch({ type: 'answerCard', deviceId, picks })} onClose={onClose} />;
}

const tile = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}\\b`) });
const bin = (name: string) => within(screen.getByRole('group', { name }));
const place = (name: string) => screen.getByRole('button', { name: new RegExp(`^Poner .* en ${name}$|^Poner aquí en ${name}$`) });

describe('classify card', () => {
  it('shows the block, the mask, the bits row and the two bins', () => {
    render(<ClassifyCard card={cardOf(START)} onAnswer={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: 'tu-laptop' });
    expect(dialog).toHaveTextContent('192.168.1.0/24');
    expect(dialog).toHaveTextContent('255.255.255.0');
    expect(screen.getByRole('heading', { name: 'tu-laptop' })).toHaveFocus();
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
    const onAnswer = vi.fn();
    render(<ClassifyCard card={cardOf(START)} onAnswer={onAnswer} onClose={vi.fn()} />);
    expect(place(INSIDE)).toBeDisabled();
    await user.click(tile('impresora'));
    expect(tile('impresora')).toHaveAttribute('aria-pressed', 'true');
    expect(place(INSIDE)).toBeEnabled();
    expect(onAnswer).not.toHaveBeenCalled();
    await user.click(place(INSIDE));
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith('printer', { bin: 'inside' });
  });

  it('an item is placed with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Hosted onClose={vi.fn()} />);
    tile('laptop-andres').focus();
    await user.keyboard('{Enter}');
    expect(tile('laptop-andres')).toHaveAttribute('aria-pressed', 'true');
    place(OUTSIDE).focus();
    await user.keyboard('{Enter}');
    expect(bin(OUTSIDE).getByRole('button', { name: /^laptop-andres/ })).toBeInTheDocument();
    expect(bin(INSIDE).queryByRole('button', { name: /^laptop-andres/ })).toBeNull();
    expect(screen.getByRole('heading', { name: 'tu-laptop' })).toHaveFocus();
    await user.keyboard('{Escape}');
  });

  it('moves a placed item to the other bin, and says when nothing is left to classify', async () => {
    const user = userEvent.setup();
    render(<Hosted onClose={vi.fn()} />);
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
    render(<Hosted onClose={vi.fn()} />);
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

  it('Listo and Escape only close the card', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onAnswer = vi.fn();
    render(<ClassifyCard card={cardOf(START)} onAnswer={onAnswer} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: TASK_CARD_TEXT.done }));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('without a prefix that ends at a dot it still writes the bits row and leaves the IPs whole', () => {
    const incident = { ...INCIDENT, identify: { ...INCIDENT.identify, classify: { ...INCIDENT.identify.classify!, cidr: '192.168.1.0/28' } } };
    render(<ClassifyCard card={cardOf(startSession([incident], incident.id))} onAnswer={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('255.255.255.240');
    expect(tile('impresora').querySelector('.ip')).toBeNull();
    expect(tile('impresora')).toHaveTextContent('192.168.1.21');
  });
});
