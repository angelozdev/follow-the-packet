// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { pieceCard, sessionReducer, startSession, type PieceCard as Piece, type Session } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import type { SendIncident } from '@/levels';
import { PieceLabel, pieceDomId } from '@/scene/overlay/piece-label';
import { NAME_SERVER_PIECES, OFFICE_FLOORS } from '@/testing/fixtures';
import { namesSendIncident, sendIncident } from '@/testing/incidents';
import { PieceCard, pieceHandlers } from './piece-card';

const NAMES = namesSendIncident();
const startWithTerms = (incident: SendIncident): Session => startSession([incident], incident.id);
const LAPTOP = PIECE_ID.device('your-laptop');
const ROUTER = PIECE_ID.router(OFFICE_FLOORS.officeRouter.id);
const WWW = 'www.lucia.example';

function Hosted({ pieceId, incident = NAMES, onClose = vi.fn(), shaped = (card) => card }: { pieceId: string; incident?: SendIncident; onClose?: () => void; shaped?: (card: Piece) => Piece }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([incident], incident.id));
  const card = pieceCard(session, pieceId);
  if (!card) throw new Error('missing the card of the piece');
  return <PieceCard card={shaped(card)} {...pieceHandlers(session, dispatch, vi.fn())} onClose={onClose} />;
}

const pressed = (name: string) => screen.getByRole('button', { name }).getAttribute('aria-pressed');
const tabs = () => screen.queryAllByRole('tab').map((tab) => tab.textContent);

describe('piece card', () => {
  it('a piece with one card opens it with no tabs', () => {
    const sending = sendIncident();
    render(<Hosted pieceId={LAPTOP} incident={sending} />);
    expect(tabs()).toEqual([]);
    expect(screen.getByRole('dialog', { name: 'Terminal de your-laptop' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Terminal de your-laptop' })).toHaveFocus();
  });

  it('a piece with several cards opens on the tab the model names, with the title, the foot and the panel of that tab', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} />);
    expect(tabs()).toEqual(['Terminal', 'Ajustes de red', 'Tabla de rutas']);
    expect(screen.getByRole('tab', { name: 'Ajustes de red' })).toHaveAttribute('aria-selected', 'true');
    const settings = screen.getByRole('dialog', { name: 'Ajustes de red de tu-laptop' });
    expect(within(settings).queryByRole('button', { name: TERMINAL_TEXT.send })).toBeNull();
    expect(within(settings).getByRole('button', { name: TASK_CARD_TEXT.done })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    const terminal = screen.getByRole('dialog', { name: 'Terminal de tu-laptop' });
    expect(within(terminal).getByRole('button', { name: TERMINAL_TEXT.send })).toBeDisabled();
    await user.click(screen.getByRole('tab', { name: 'Tabla de rutas' }));
    expect(screen.getByRole('dialog', { name: 'Tabla de rutas de tu-laptop' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TERMINAL_TEXT.send })).toBeNull();
    expect(screen.getByRole('heading', { name: /^Tabla de rutas/ })).toBeInTheDocument();
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
    await user.click(screen.getByRole('tab', { name: 'Ajustes de red' }));
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
    expect(tabs()).toEqual(['Tabla de rutas', 'Tabla de traducciones']);
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

  it('moving the card to a piece that shows its terminal alone, or the other way round, keeps what was picked in the terminal', async () => {
    const user = userEvent.setup();
    const tabbed = startWithTerms(NAMES);
    const alone: Session = { ...tabbed, known: new Set([...tabbed.known].filter((term) => term !== 'routing-table' && term !== 'dhcp')) };
    const [withTabs, withOne] = [tabbed, alone].map((session) => pieceCard(session, LAPTOP));
    if (!withTabs?.tabbed || !withOne || withOne.tabbed) throw new Error('expected a tabbed card and a single one');
    const handlers = { ...pieceHandlers(tabbed, vi.fn(), vi.fn()), onClose: vi.fn() };
    const { rerender } = render(<PieceCard card={withTabs} {...handlers} />);
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    await user.click(screen.getByRole('button', { name: WWW }));
    rerender(<PieceCard card={withOne} {...handlers} />);
    expect(tabs()).toEqual([]);
    expect(pressed(WWW)).toBe('true');
    rerender(<PieceCard card={withTabs} {...handlers} />);
    expect(screen.getByRole('tab', { name: 'Ajustes de red' })).toHaveAttribute('aria-selected', 'true');
    await user.click(screen.getByRole('tab', { name: 'Terminal' }));
    expect(pressed(WWW)).toBe('true');
  });

  it('Escape closes the card and the focus goes back to the only button of the label', async () => {
    const user = userEvent.setup();
    function WithLabel() {
      const [open, setOpen] = useState(false);
      const piece = { id: LAPTOP, kind: 'device', variant: 'laptop', anchorId: 'your-laptop', label: '[[tu-laptop]]', locked: false, state: 'normal' } as const;
      return (
        <>
          <PieceLabel piece={piece} trigger={{}} onActivate={() => setOpen(true)} />
          {open && (
            <Hosted
              pieceId={LAPTOP}
              onClose={() => {
                document.getElementById(pieceDomId(LAPTOP))?.focus();
                setOpen(false);
              }}
            />
          )}
        </>
      );
    }
    render(<WithLabel />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'tu-laptop' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Tabla de rutas' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'tu-laptop' })).toHaveFocus();
  });

  it('the tabs are reached and changed with the keyboard', async () => {
    const user = userEvent.setup();
    render(<Hosted pieceId={LAPTOP} />);
    screen.getByRole('tab', { name: 'Ajustes de red' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tabla de rutas' })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Terminal' })).toHaveAttribute('aria-selected', 'true');
  });

  it('the card of a server says every role in words once', async () => {
    const user = userEvent.setup();
    const rolesOfTheCard = () => [...document.querySelectorAll('.chip-card__roles')].map((line) => line.textContent);
    const { unmount } = render(<Hosted pieceId={PIECE_ID.actor(NAME_SERVER_PIECES.authoritative.id)} />);
    expect(tabs()).toEqual([]);
    expect(rolesOfTheCard()).toEqual(['Papel: servidor autoritativo']);
    unmount();
    const resolver = PIECE_ID.actor(NAME_SERVER_PIECES.resolver.id);
    const second = pieceCard(startSession([NAMES], NAMES.id), PIECE_ID.actor(NAME_SERVER_PIECES.authoritative.id))?.tabs[0];
    if (!second) throw new Error('missing the second tab');
    const withTwoTabs = (card: Piece): Piece => ({ ...card, tabs: [...card.tabs, second], tabbed: true });
    render(<Hosted pieceId={resolver} shaped={withTwoTabs} />);
    expect(tabs()).toHaveLength(2);
    expect(rolesOfTheCard()).toEqual(['Papel: resolutor de DNS']);
    await user.click(screen.getAllByRole('tab')[1]);
    expect(rolesOfTheCard()).toEqual(['Papel: resolutor de DNS']);
  });

  it('a card of a piece that is not a server has no line of roles', () => {
    render(<Hosted pieceId={LAPTOP} />);
    expect(document.querySelector('.chip-card__roles')).toBeNull();
  });
});
