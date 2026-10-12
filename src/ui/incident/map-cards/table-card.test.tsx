// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TABLE_TEXT, TASK_CARD_TEXT } from '@/copy';
import { sessionReducer, startSession, type Session, type TableCard as Tabled } from '@/game';
import { cacheCard, recordsCard, routesCard } from '@/game/view/cards/table-card';
import { PIECE_ID } from '@/game/view/piece-id';
import { NAME_SERVERS, OFFICE_FLOORS } from '@/testing/fixtures';
import { namesSendIncident } from '@/testing/incidents';
import { TableCard } from './table-card';

const NAMES = namesSendIncident();
const START = startSession([NAMES], NAMES.id);
const { officeRouter, provider, range, server } = OFFICE_FLOORS;
const PROVIDER = PIECE_ID.router(provider.id);

function cardOf(session: Session, build: (session: Session, pieceId: string) => Tabled | null, pieceId: string): Tabled {
  const card = build(session, pieceId);
  if (!card) throw new Error(`missing the card of ${pieceId}`);
  return card;
}

function renderTable(card: Tabled) {
  const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
  const view = render(<TableCard card={card} {...handlers} />);
  return { ...view, ...handlers };
}

const chip = (name: string) => screen.getByRole('button', { name });

describe('table card', () => {
  it('placing a route needs both trays and then places it', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderTable(cardOf(START, routesCard, PROVIDER));
    const add = chip('Agregar ruta');
    expect(add).toBeDisabled();
    await user.click(chip('default'));
    expect(add).toBeDisabled();
    await user.click(chip(officeRouter.id));
    expect(add).toBeEnabled();
    expect(onPlace).not.toHaveBeenCalled();
    await user.click(add);
    expect(onPlace).toHaveBeenCalledExactlyOnceWith('routes', { destination: 'default', nextHop: officeRouter.id });
    expect(add).toBeDisabled();
    expect(chip('default')).toHaveAttribute('aria-pressed', 'false');
    expect(chip('Agregar ruta')).toBeDisabled();
  });

  it('picking the chip of a tray again takes it back', async () => {
    const user = userEvent.setup();
    renderTable(cardOf(START, routesCard, PROVIDER));
    await user.click(chip('default'));
    expect(chip('default')).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip('default'));
    expect(chip('default')).toHaveAttribute('aria-pressed', 'false');
  });

  it('removing a row calls the move with that row', async () => {
    const user = userEvent.setup();
    const { onRemove } = renderTable(cardOf(START, routesCard, PROVIDER));
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((row) => within(row).queryAllByRole('button').length)).toEqual([0, 0, 1, 1]);
    await user.click(screen.getByRole('button', { name: /^Quitar 198\.51\.100\.0\/24/ }));
    expect(onRemove).toHaveBeenCalledExactlyOnceWith('routes', server.range);
    await user.click(screen.getByRole('button', { name: new RegExp(`^Quitar ${range.replaceAll('.', '\\.')}`) }));
    expect(onRemove).toHaveBeenLastCalledWith('routes', range);
  });

  it('a read-only table has no trays and no buttons', () => {
    renderTable(cardOf(START, cacheCard, PIECE_ID.actor(NAME_SERVERS.resolver.id)));
    expect(screen.queryAllByRole('group')).toEqual([]);
    expect(within(screen.getByRole('dialog')).queryAllByRole('button').map((button) => button.textContent)).toEqual([TASK_CARD_TEXT.done]);
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(TABLE_TEXT.cache.empty)).toBeInTheDocument();
    const routes = renderTable(cardOf(START, routesCard, PIECE_ID.router(officeRouter.id)));
    expect(within(routes.container).queryAllByRole('group')).toEqual([]);
  });

  it('marks the row in use with a word and not only a colour', () => {
    const sent: Session = sessionReducer(START, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' });
    renderTable(cardOf(sent, routesCard, PIECE_ID.router(provider.id)));
    const inUse = screen.getAllByText(TABLE_TEXT.inUse);
    expect(inUse).toHaveLength(1);
    expect(inUse[0].closest('tr')).toHaveTextContent(server.range);
  });

  it('a rejected entry shows its problem as an error message under the table, in a status region that was already there', () => {
    const refused: Session = sessionReducer(START, { type: 'placeEntry', tableId: 'routes', picks: { destination: range, nextHop: officeRouter.id } });
    const handlers = { onPlace: vi.fn(), onRemove: vi.fn(), onClose: vi.fn() };
    const { rerender } = render(<TableCard card={cardOf(START, routesCard, PROVIDER)} {...handlers} />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();
    rerender(<TableCard card={cardOf(refused, routesCard, PROVIDER)} {...handlers} />);
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

  it('Escape closes the card and the focus goes to the title when it opens', async () => {
    const user = userEvent.setup();
    const { onClose } = renderTable(cardOf(START, recordsCard, PIECE_ID.actor(NAME_SERVERS.authoritative.id)));
    expect(screen.getByRole('heading', { name: /^Registros de lucia\.example/ })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('names the card after its table, and the muted line of the zone sits under the rows', () => {
    renderTable(cardOf(START, recordsCard, PIECE_ID.actor(NAME_SERVERS.authoritative.id)));
    expect(screen.getByRole('dialog', { name: 'Registros de lucia.example' })).toBeInTheDocument();
    expect(screen.getByText(TABLE_TEXT.records.own)).toHaveClass('muted');
    expect(screen.getByRole('button', { name: 'Agregar registro' })).toBeDisabled();
  });

  it('the buttons that need the keyboard are reached and used with it', async () => {
    const user = userEvent.setup();
    const { onPlace } = renderTable(cardOf(START, recordsCard, PIECE_ID.actor(NAME_SERVERS.authoritative.id)));
    await user.click(chip(`www.${NAME_SERVERS.zone}`));
    await user.click(chip('CNAME'));
    await user.click(chip(server.ip));
    chip('Agregar registro').focus();
    await user.keyboard('{Enter}');
    expect(onPlace).toHaveBeenCalledExactlyOnceWith('records', { name: `www.${NAME_SERVERS.zone}`, type: 'CNAME', value: server.ip });
    expect(screen.getByRole('heading', { name: /^Registros/ })).toHaveFocus();
  });
});
