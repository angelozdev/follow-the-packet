import { useId, type ReactNode } from 'react';
import { Button } from '@/design/primitives/button';

const REMOVE_MARK = '×';

export interface TableColumn {
  id: string;
  label: ReactNode;
}

/** One row of a table: its cells in the order of the columns, whether it is the row in use, and, when the player can take it away, what removing it does. */
export interface TableRow {
  id: string;
  cells: ReactNode[];
  inUse?: boolean;
  onRemove?: () => void;
}

interface TableProps {
  caption: string;
  columns: TableColumn[];
  rows: TableRow[];
  emptyText: string;
  inUseText: string;
  removeText: string;
}

/** The one table of the game: a caption that names it for screen readers, a header of columns and one row per entry, with the text of an empty table in place of the rows. A row in use wears a mark with `inUseText`, so it does not depend on colour; a row with `onRemove` ends in a small button whose name is `removeText` followed by the content of its row. All the words arrive as props because the design system imports no text. It sits inside a `Card`, and its wrapper scrolls sideways when the columns do not fit. */
export function Table({ caption, columns, rows, emptyText, inUseText, removeText }: TableProps) {
  const tableId = useId();
  const hasActions = rows.some((row) => row.onRemove !== undefined);
  const columnCount = columns.length + (hasActions ? 1 : 0);
  return (
    <div className="table">
      <table className="table__grid">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className="caption caption--soft">
                {column.label}
              </th>
            ))}
            {hasActions && (
              <th scope="col" className="table__action">
                <span className="sr-only">{removeText}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="muted">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const rowId = `${tableId}-${row.id}`;
            const cellIds = columns.map((column) => `${rowId}-${column.id}`);
            const removeId = `${rowId}-remove`;
            return (
              <tr key={row.id}>
                {columns.map((column, index) => (
                  <td key={column.id}>
                    <span id={cellIds[index]}>{row.cells[index]}</span>
                    {index === 0 && row.inUse && <span className="table__use">{inUseText}</span>}
                  </td>
                ))}
                {hasActions && (
                  <td className="table__action">
                    {row.onRemove && (
                      <Button variant="small" id={removeId} aria-label={removeText} aria-labelledby={[removeId, ...cellIds].join(' ')} onClick={row.onRemove}>
                        {REMOVE_MARK}
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
