import type { Frame } from '@/scene/map2d/frame';
import type { RowLayout } from '@/scene/map2d/layout/arrange/geometry';
import { labelLines } from '@/scene/map2d/layout/metrics';
import { readingOrder } from '@/scene/map2d/marks/reading-order';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import { PieceLabel, type MapPiece } from '@/scene/overlay/piece-label';

interface MapLabelsProps {
  pieces: readonly MapPiece[];
  layout: Pick<RowLayout, 'labels' | 'icons'>;
  frame: Frame;
  inspectTrigger: InspectTrigger;
  onActivate: (pieceId: string) => void;
}

/** Takes the pieces of the map, the layout (the box of each label and of each icon), where the drawing stands in its layer, what inspects a piece and what the screen does when one is activated; returns the label of every piece the layout holds a box for, as the same button the map has always had (`PieceLabel`), in the order the Tab key must walk the map (`readingOrder`), each in a holder at the pixels of its box with the frame added, which says how many lines the label has. A piece with no box is not drawn. */
export function MapLabels({ pieces, layout, frame, inspectTrigger, onActivate }: MapLabelsProps) {
  const byId = new Map(pieces.map((piece) => [piece.id, piece]));
  return readingOrder(layout, []).flatMap(({ kind, id }) => {
    const piece = byId.get(id);
    const box = layout.labels[id];
    if (kind !== 'piece' || piece === undefined || box === undefined) return [];
    return [
      <div key={id} className="map-label" data-lines={labelLines(piece.label).length} style={{ left: frame.x + box.x, top: frame.y + box.y, width: box.width, height: box.height }}>
        <PieceLabel piece={piece} trigger={inspectTrigger(id)} onActivate={onActivate} />
      </div>,
    ];
  });
}
