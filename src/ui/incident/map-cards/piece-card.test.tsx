// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import type { SendIncident } from '@/levels';
import { NAME_SERVER_PIECES, OFFICE_FLOORS } from '@/testing/fixtures';
import { namesSendIncident, sendIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const NAMES = namesSendIncident();
const LAPTOP = PIECE_ID.device('your-laptop');
const ROUTER = PIECE_ID.router(OFFICE_FLOORS.officeRouter.id);
const WWW = 'www.lucia.example';

function Hosted({ pieceId, incident = NAMES, onClose = vi.fn() }: { pieceId: string; incident?: SendIncident; onClose?: () => void }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([incident], incident.id));
  const [chosen, choose] = useState(pieceId);
  return <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, chosen)} pieceId={chosen} heading={createRef()} onClose={onClose} onChoose={choose} />;
}

const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
const tabs = () => screen.queryAllByRole('tab').map((tab) => tab.textContent);

describe('piece card', () => {
  it('a piece with one card has its tab next to Estado and nothing else', () => {
    render(<Hosted pieceId={LAPTOP} incident={sendIncident()} />);
    expect(tabs()).toEqual(['Estado', 'Terminal']);
    expect(screen.getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('region', { name: 'your-laptop' })).toBeInTheDocument();
  });

  it('a piece with several cards opens on the tab the model names, with the sections and the foot of that tab', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} />);
    expect(tabs()).toEqual(['Estado', 'Ajustes', 'Tablas', 'Terminal']);
    expect(screen.getByRole('tab', { name: 'Ajustes' })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('region', { name: 'tu-laptop' });
    expect(within(panel).getByRole('heading', { name: 'Ajustes de red' })).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: TERMINAL_TEXT.send })).toBeNull();
    expect(within(panel).queryByRole('button', { name: TASK_CARD_TEXT.done })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(within(panel).getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
    await user.click(screen.getByRole('tab', { name: 'Tablas' }));
    expect(within(panel).getByRole('heading', { name: 'Tabla de rutas' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TERMINAL_TEXT.send })).toBeNull();
  });

  it('switching tabs keeps what was picked in the terminal and the lines unfolded in its output', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} />);
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    await user.click(screen.getByRole('button', { name: WWW }));
    await user.click(screen.getByRole('button', { name: 'dig' }));
    await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(screen.getByRole('button', { name: /^Ver las \d+ líneas restantes$/ }));
    const hide = screen.getByRole('button', { name: /^Ocultar las \d+ líneas restantes$/ });
    expect(hide).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('tab', { name: 'Ajustes' }));
    expect(screen.queryByRole('group', { name: 'Salida de dig' })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(pressed(WWW)).toBe('true');
    expect(pressed('dig')).toBe('true');
    expect(screen.getByRole('button', { name: /^Ocultar las \d+ líneas restantes$/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Salida de dig' })).toBeInTheDocument();
  });

  it('switching tabs keeps the chips picked in the trays of a table that has no entry yet', async () => {
    const user = userEvent.setup();
    const [routes] = NAMES.send.tables!;
    const editable = { ...NAMES, send: { ...NAMES.send, tables: [{ ...routes, id: 'office-routes', ownerId: OFFICE_FLOORS.officeRouter.id }] } };
    render(<Hosted pieceId={ROUTER} incident={editable} />);
    expect(tabs()).toEqual(['Estado', 'Tablas', 'Tabla de rutas', 'Tabla de traducciones']);
    await user.click(screen.getByRole('button', { name: 'default' }));
    await user.click(screen.getByRole('tab', { name: 'Tabla de traducciones' }));
    expect(screen.getByText(/Todavía no hay filas/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agregar ruta' })).toBeNull();
    await user.click(screen.getByRole('tab', { name: 'Tabla de rutas' }));
    expect(pressed('default')).toBe('true');
    expect(screen.getByRole('button', { name: 'Agregar ruta' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: OFFICE_FLOORS.officeRouter.id }));
    expect(screen.getByRole('button', { name: 'Agregar ruta' })).toBeEnabled();
  });

  it('moving the panel to the piece of another origin and back keeps what was picked in the terminal', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} incident={sendIncident()} />);
    await user.click(screen.getByRole('button', { name: '192.168.1.11' }));
    await user.click(screen.getByRole('button', { name: 'Atacante' }));
    expect(screen.getByRole('region', { name: 'Atacante' })).toBeInTheDocument();
    expect(pressed('Atacante')).toBe('true');
    expect(pressed('192.168.1.11')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'your-laptop' }));
    expect(screen.getByRole('region', { name: 'your-laptop' })).toBeInTheDocument();
    expect(pressed('192.168.1.11')).toBe('true');
  });

  it('Escape closes nothing and the tab chosen stays', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Hosted pieceId={LAPTOP} onClose={onClose} />);
    await user.click(screen.getByRole('tab', { name: 'Tablas' }));
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
  });

  it('the tabs are reached and changed with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} />);
    screen.getByRole('tab', { name: 'Ajustes' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tablas' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Estado' })).toHaveAttribute('aria-selected', 'true');
  });

  it('the card of a server says every role in words once', async () => {
    const user = userEvent.setup();
    const rolesOfThePanel = () => [...document.querySelectorAll('.chip-card__roles')].map((line) => line.textContent);
    const { unmount } = render(<Hosted pieceId={PIECE_ID.actor(NAME_SERVER_PIECES.authoritative.id)} />);
    expect(tabs()).toEqual(['Estado', 'Tablas']);
    expect(rolesOfThePanel()).toEqual(['Papel: servidor autoritativo']);
    unmount();
    render(<Hosted pieceId={PIECE_ID.actor(NAME_SERVER_PIECES.resolver.id)} />);
    expect(rolesOfThePanel()).toEqual(['Papel: resolutor de DNS']);
    await user.click(screen.getByRole('tab', { name: 'Estado' }));
    expect(rolesOfThePanel()).toEqual(['Papel: resolutor de DNS']);
  });

  it('a card of a piece that is not a server has no line of roles', () => {
    render(<Hosted pieceId={LAPTOP} />);
    expect(document.querySelector('.chip-card__roles')).toBeNull();
  });
});
