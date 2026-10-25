import { useState } from 'react';
import { MESSAGE_TEXT, TABLE_TEXT, toPlainText } from '@/copy';
import { Button, ChipTray, Message, Table } from '@/design';
import type { TableCard as Tabled, TableCell } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { FramedCard, trayChips, type CardFrame } from './chip-card';

type Picks = Record<string, string>;

/** What a table asks of its screen: placing the entry the picks in its trays make, and taking a row away. */
export interface TableHandlers {
  onPlace: (tableId: string, picks: Picks) => void;
  onRemove: (tableId: string, entryId: string) => void;
}

/** The chips the player has picked in the trays of the editable tables of a piece, by table. They live above the card, so a card that shows several tables as tabs keeps them when the player switches tabs. */
export interface EntryDrafts {
  picked: (tableId: string) => Picks;
  pick: (tableId: string, tray: string, chipId: string) => void;
  clear: (tableId: string) => void;
}

export function useEntryDrafts(): EntryDrafts {
  const [drafts, setDrafts] = useState<Record<string, Picks>>({});
  return {
    picked: (tableId) => drafts[tableId] ?? {},
    pick: (tableId, tray, chipId) =>
      setDrafts((previous) => {
        const { [tray]: current, ...rest } = previous[tableId] ?? {};
        return { ...previous, [tableId]: current === chipId ? rest : { ...rest, [tray]: chipId } };
      }),
    clear: (tableId) => setDrafts((previous) => Object.fromEntries(Object.entries(previous).filter(([id]) => id !== tableId))),
  };
}

function Cell({ cell }: { cell: TableCell }) {
  const text = <TaggedText text={cell.text} ips={!cell.code} />;
  return cell.code ? <code>{text}</code> : text;
}

interface TableBodyProps {
  card: Tabled;
  picked: Picks;
  onPick: (tray: string, chipId: string) => void;
  onRemove: (entryId: string) => void;
}

function TableBody({ card, picked, onPick, onRemove }: TableBodyProps) {
  return (
    <>
      <div>
        <Table
          caption={toPlainText(card.title)}
          columns={card.columns.map(({ id, label }) => ({ id, label: <TaggedText text={label} /> }))}
          rows={card.rows.map((row) => ({
            id: row.id,
            cells: row.cells.map((cell, index) => <Cell key={index} cell={cell} />),
            inUse: row.inUse,
            onRemove: row.entryId === null || card.tableId === null ? undefined : () => onRemove(row.entryId!),
          }))}
          emptyText={toPlainText(card.empty)}
          inUseText={TABLE_TEXT.inUse}
          removeText={TABLE_TEXT.remove}
        />
        {card.note && (
          <p className="muted">
            <TaggedText text={card.note} />
          </p>
        )}
        {card.tableId !== null && (
          <div role="status">
            {card.problem && (
              <Message variant="error" words={MESSAGE_TEXT}>
                <TaggedText text={card.problem} />
              </Message>
            )}
          </div>
        )}
      </div>
      {card.trays?.map((tray) => (
        <ChipTray key={tray.name} name={tray.label} chips={trayChips(tray.chips)} picked={picked[tray.name] ?? null} onPick={(chipId) => onPick(tray.name, chipId)} />
      ))}
    </>
  );
}

/** Returns what a table puts in its card: its rows under their columns, with the row the last packet used marked, a muted line under them when the zone has records of its own, and, if the player edits it, a button on each row that can be taken away, the problem the engine gave to the last entry it refused (an error `Message` in a `status` region that is always there, so the screen reader hears it appear), the trays of the entry and the button that adds the entry the picks make once every tray has one. A table the player cannot edit has no trays and no buttons. After adding or removing, the focus goes to the title, because the button that had it is gone or disabled. */
export function tableFrame(card: Tabled, drafts: EntryDrafts, { onPlace, onRemove }: TableHandlers, refocus: () => void): CardFrame {
  const tableId = card.tableId;
  const picked = tableId === null ? {} : drafts.picked(tableId);
  const complete = card.trays !== null && card.trays.every((tray) => picked[tray.name] !== undefined);
  const add = () => {
    if (tableId === null || !complete) return;
    onPlace(tableId, picked);
    drafts.clear(tableId);
    refocus();
  };
  return {
    title: card.title,
    icon: <CardIcon kind="table" />,
    actions: card.add === null ? undefined : (
      <Button disabled={!complete} onClick={add}>
        {card.add}
      </Button>
    ),
    body: (
      <TableBody
        card={card}
        picked={picked}
        onPick={(tray, chipId) => tableId !== null && drafts.pick(tableId, tray, chipId)}
        onRemove={(entryId) => {
          if (tableId === null) return;
          onRemove(tableId, entryId);
          refocus();
        }}
      />
    ),
  };
}

interface TableCardProps extends TableHandlers {
  card: Tabled;
  onClose: () => void;
}

/** A table as a card of its own, for a piece whose only card it is. */
export function TableCard({ card, onPlace, onRemove, onClose }: TableCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const drafts = useEntryDrafts();
  return <FramedCard frame={tableFrame(card, drafts, { onPlace, onRemove }, () => heading.current?.focus())} heading={heading} onClose={onClose} />;
}
