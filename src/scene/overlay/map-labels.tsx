import type { ReactNode } from 'react';
import type { Frame } from '@/scene/frame';
import type { RowLayout } from '@/scene/layout/arrange/geometry';
import { labelLines } from '@/scene/layout/metrics';
import { readingOrder, type StampEntry } from '@/scene/marks/reading-order';
import type { Fan } from '@/scene/marks/stamp-fan';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import { PieceLabel, type MapPiece } from '@/scene/overlay/piece-label';

const NO_FANS: readonly Fan[] = [];

interface MapLabelsProps {
  pieces: readonly MapPiece[];
  layout: Pick<RowLayout, 'labels' | 'icons'>;
  frame: Frame;
  inspectTrigger: InspectTrigger;
  onActivate: (pieceId: string) => void;
  fans?: readonly Fan[];
  stamp?: (entry: StampEntry) => ReactNode;
}

/** Takes the pieces of the map, the layout (the box of each label and of each icon), where the drawing stands in its layer, what inspects a piece, what the screen does when one is activated and, when the map has stamps, the fans of stamps and what draws each stamp or «+N» of the reading order; returns the buttons of the map in the order the Tab key must walk it (`readingOrder`): the label of every piece the layout holds a box for, as the same button the map has always had (`PieceLabel`) in a holder at the pixels of its box with the frame added, which says how many lines the label has, and, after the label of the piece that stands nearest to them, the stamps of each fan as `stamp` draws them. A piece with no box is not drawn, and with no `stamp` no stamp is. */
export function MapLabels({ pieces, layout, frame, inspectTrigger, onActivate, fans = NO_FANS, stamp }: MapLabelsProps) {
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  return readingOrder(layout, fans).flatMap(({ kind, id }) => {
    if (kind !== 'piece') return stamp?.({ kind, id }) ?? [];
    const piece = byId.get(id);
    const box = layout.labels[id];
    if (piece === undefined || box === undefined) return [];
    return [
      <div key={id} className="map-label" data-lines={labelLines(piece.label).length} style={{ left: frame.x + box.x, top: frame.y + box.y, width: box.width, height: box.height }}>
        <PieceLabel piece={piece} trigger={inspectTrigger(id)} onActivate={onActivate} />
      </div>,
    ];
  });
}
