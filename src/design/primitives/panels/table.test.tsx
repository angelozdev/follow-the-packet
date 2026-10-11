// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { Table, type TableRow } from './table';

const CAPTION = 'Rutas de router-oficina';
const EMPTY = 'Sin filas';
const IN_USE = 'en uso';
const REMOVE = 'Quitar';
const COLUMNS = [
  { id: 'to', label: 'Destino' },
  { id: 'via', label: 'Por dónde sale' },
];

function rowOf(id: string, to: string, via: string, extra: Partial<TableRow> = {}): TableRow {
  return { id, cells: [<code key="to">{to}</code>, via], ...extra };
}

function renderTable(rows: TableRow[]) {
  return render(<Table caption={CAPTION} columns={COLUMNS} rows={rows} emptyText={EMPTY} inUseText={IN_USE} removeText={REMOVE} />);
}

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole('row').slice(1);
}

describe('Table', () => {
  it('renders a caption, the column headers and the rows', () => {
    renderTable([rowOf('home', '192.168.1.0/24', 'directo'), rowOf('default', '0.0.0.0/0', '203.0.113.1')]);
    const table = screen.getByRole('table', { name: CAPTION });
    expect(table.querySelector('caption')).toHaveTextContent(CAPTION);
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(COLUMNS.map((column) => column.label));
    expect(bodyRows()).toHaveLength(2);
    expect(within(bodyRows()[0]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['192.168.1.0/24', 'directo']);
    expect(within(bodyRows()[1]).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['0.0.0.0/0', '203.0.113.1']);
    expect(within(bodyRows()[0]).getByText('192.168.1.0/24').tagName).toBe('CODE');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a row action has an accessible name made from its row', () => {
    renderTable([
      rowOf('home', '192.168.1.0/24', 'directo'),
      rowOf('default', '0.0.0.0/0', '203.0.113.1', { onRemove: vi.fn() }),
      rowOf('branch', '10.0.0.0/16', '172.16.0.2', { onRemove: vi.fn() }),
      rowOf('branch-again', '10.0.0.0/16', '172.16.0.9', { onRemove: vi.fn() }),
    ]);
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['×', '×', '×']);
    expect(screen.getByRole('button', { name: 'Quitar 0.0.0.0/0 203.0.113.1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar 10.0.0.0/16 172.16.0.2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitar 10.0.0.0/16 172.16.0.9' })).toBeInTheDocument();
    expect(within(bodyRows()[0]).queryByRole('button')).toBeNull();
    expect(within(bodyRows()[0]).getAllByRole('cell')).toHaveLength(3);
  });

  it('marks the rows in use with text and not only with colour', () => {
    const { container } = renderTable([rowOf('home', '192.168.1.0/24', 'directo'), rowOf('branch', '10.0.0.0/16', '172.16.0.2', { inUse: true, onRemove: vi.fn() })]);
    expect(screen.getAllByText(IN_USE)).toHaveLength(1);
    expect(within(bodyRows()[1]).getByText(IN_USE)).toBeInTheDocument();
    expect(within(bodyRows()[0]).queryByText(IN_USE)).toBeNull();
    expect(container.querySelector('.table__use')).toHaveTextContent(IN_USE);
    expect(screen.getByRole('button', { name: 'Quitar 10.0.0.0/16 172.16.0.2' })).toBeInTheDocument();
  });

  it('shows the empty text when there are no rows', () => {
    renderTable([]);
    const table = screen.getByRole('table', { name: CAPTION });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(COLUMNS.length);
    expect(bodyRows()).toHaveLength(1);
    expect(within(bodyRows()[0]).getByRole('cell')).toHaveTextContent(EMPTY);
    expect(within(bodyRows()[0]).getByRole('cell')).toHaveAttribute('colspan', String(COLUMNS.length));
    expect(screen.queryByText(IN_USE)).toBeNull();
  });

  it('takes no className and no style', () => {
    expectTypeOf<ComponentProps<typeof Table>>().not.toHaveProperty('className');
    expectTypeOf<ComponentProps<typeof Table>>().not.toHaveProperty('style');
    const extras = { className: 'extra', style: { color: 'red' } };
    const { container } = render(<Table caption={CAPTION} columns={COLUMNS} rows={[rowOf('home', '192.168.1.0/24', 'directo', { onRemove: vi.fn() })]} emptyText={EMPTY} inUseText={IN_USE} removeText={REMOVE} {...extras} />);
    expect(container.querySelector('.extra')).toBeNull();
    expect(container.firstElementChild).toHaveClass('table', { exact: true });
    expect(screen.getByRole('table')).toHaveClass('table__grid', { exact: true });
    expect(Array.from(container.querySelectorAll<HTMLElement>('*')).flatMap((element) => Array.from(element.style))).toEqual([]);
  });

  it('the remove buttons are reached and used with the keyboard', async () => {
    const user = userEvent.setup();
    const removeDefault = vi.fn();
    const removeBranch = vi.fn();
    renderTable([rowOf('home', '192.168.1.0/24', 'directo'), rowOf('default', '0.0.0.0/0', '203.0.113.1', { onRemove: removeDefault }), rowOf('branch', '10.0.0.0/16', '172.16.0.2', { onRemove: removeBranch })]);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Quitar 0.0.0.0/0 203.0.113.1' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(removeDefault).toHaveBeenCalledOnce();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Quitar 10.0.0.0/16 172.16.0.2' })).toHaveFocus();
    await user.keyboard(' ');
    expect(removeBranch).toHaveBeenCalledOnce();
    expect(removeDefault).toHaveBeenCalledOnce();
  });
});
