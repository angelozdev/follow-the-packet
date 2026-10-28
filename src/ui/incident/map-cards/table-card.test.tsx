// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type Dispatch } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_TEXT } from '@/copy';
import { inspect, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { NAME_SERVER_PIECES, OFFICE_FLOORS } from '@/testing/fixtures';
import { namesSendIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const NAMES = namesSendIncident();
const START = startSession([NAMES], NAMES.id);
const { officeRouter, provider, range, server } = OFFICE_FLOORS;
const PROVIDER = PIECE_ID.router(provider.id);
const AUTHORITATIVE = PIECE_ID.actor(NAME_SERVER_PIECES.authoritative.id);

const panelFor = (session: Session, pieceId: string, dispatch: Dispatch<SessionAction> = vi.fn()) => <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, pieceId)} pieceId={pieceId} heading={createRef()} onClose={vi.fn()} onChoose={vi.fn()} />;

function renderTable(session: Session, pieceId: string) {
  const dispatch: Dispatch<SessionAction> = vi.fn();
  const view = render(panelFor(session, pieceId, dispatch));
  return { ...view, dispatch, show: (next: Session) => view.rerender(panelFor(next, pieceId, dispatch)) };
}

const chip = (name: string) => screen.getByRole('button', { name });

describe('table card', () => {
  it('placing a route needs both trays and then places it', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderTable(START, PROVIDER);
    const add = chip('Agregar ruta');
    expect(add).toBeDisabled();
    await user.click(chip('default'));
    expect(add).toBeDisabled();
    await user.click(chip(officeRouter.id));
    expect(add).toBeEnabled();
    expect(dispatch).not.toHaveBeenCalled();
    await user.click(add);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'placeEntry', tableId: 'routes', picks: { destination: 'default', nextHop: officeRouter.id } });
    expect(add).toBeDisabled();
    expect(chip('default')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('Agregar ruta')).toBeDisabled();
  });

  it('picking the chip of a tray again takes it back', async () => {
    const user = userEvent.setup();
    renderTable(START, PROVIDER);
    await user.click(chip('default'));
    expect(chip('default')).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip('default'));
    expect(chip('default')).toHaveAttribute('aria-pressed', 'false');
  });

  it('removing a row calls the move with that row', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderTable(START, PROVIDER);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).queryAllByRole('button').length)).toEqual([0, 0, 1, 1]);
    await user.click(screen.getByRole('button', { name: /^Quitar 198\.51\.100\.0\/24/ }));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'removeEntry', tableId: 'routes', entryId: server.range });
    await user.click(screen.getByRole('button', { name: new RegExp(`^Quitar ${range.replaceAll('.', '\\.')}`) }));
    expect(dispatch).toHaveBeenLastCalledWith({ type: 'removeEntry', tableId: 'routes', entryId: range });
  });

  it('a read-only table has no trays and no buttons', () => {
    renderTable(START, PIECE_ID.actor(NAME_SERVER_PIECES.resolver.id));
    expect(screen.queryAllByRole('group')).toEqual([]);
    expect(within(screen.getByRole('region')).queryAllByRole('button')).toEqual([]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(TABLE_TEXT.cache.empty)).toBeInTheDocument();
    const routes = renderTable(START, PIECE_ID.router(officeRouter.id));
    expect(within(routes.container).queryAllByRole('group')).toEqual([]);
  });

  it('marks the row in use with a word and not only a colour', () => {
    const sent: Session = sessionReducer(START, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' });
    renderTable(sent, PIECE_ID.router(provider.id));
    const inUse = screen.getAllByText(TABLE_TEXT.inUse);
    expect(inUse).toHaveLength(1);
    expect(inUse[0].closest('tr')).toHaveTextContent(server.range);
  });

  it('a rejected entry shows its problem as an error message under the table, in a status region that was already there', () => {
    const refused: Session = sessionReducer(START, { type: 'placeEntry', tableId: 'routes', picks: { destination: range, nextHop: officeRouter.id } });
    const { show } = renderTable(START, PROVIDER);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    show(refused);
    expect(screen.getByRole('status')).toBe(region);
    const message = region.querySelector('.message');
    expect(message).toHaveClass('message--error');
    expect(message).not.toHaveAttribute('role');
    expect(message).toHaveTextContent(/Ese destino ya tiene una ruta/);
    expect(region).toHaveTextContent('No se pudo agregar.');
    const table = screen.getByRole('table');
    expect(table.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getAllByRole('group')[0].compareDocumentPosition(region) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('after a row is taken away the focus goes to the heading of the panel, because the button that had it is gone', async () => {
    const user = userEvent.setup();
    renderTable(START, PROVIDER);
    await user.click(screen.getByRole('button', { name: /^Quitar 198\.51\.100\.0\/24/ }));
    expect(screen.getByRole('heading', { name: provider.id })).toHaveFocus();
  });

  it('names the card after its table, and the muted line of the zone sits under the rows', () => {
    renderTable(START, AUTHORITATIVE);
    const panel = screen.getByRole('region', { name: NAME_SERVER_PIECES.authoritative.id });
    expect(within(panel).getByRole('heading', { name: 'Registros' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Registros de lucia.example' })).toBeInTheDocument();
    expect(screen.getByText(TABLE_TEXT.records.own)).toHaveClass('muted');
    expect(screen.getByRole('button', { name: 'Agregar registro' })).toBeDisabled();
  });

  it('the buttons that need the keyboard are reached and used with it', async () => {
    const user = userEvent.setup();
    const { dispatch } = renderTable(START, AUTHORITATIVE);
    await user.click(chip(`www.${NAME_SERVER_PIECES.zone}`));
    await user.click(chip('CNAME'));
    await user.click(chip(server.ip));
    chip('Agregar registro').focus();
    await user.keyboard('{Enter}');
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'placeEntry', tableId: 'records', picks: { name: `www.${NAME_SERVER_PIECES.zone}`, type: 'CNAME', value: server.ip } });
    expect(screen.getByRole('heading', { name: NAME_SERVER_PIECES.authoritative.id })).toHaveFocus();
  });
});
