import { useRef, type CSSProperties, type ReactNode } from 'react';
import { CARD_WIDTH, DOCK_MARGIN, TITLE_BAR, cardPlacement } from '@/scene/map2d/cards/placement';
import { cardSlot, type CardLayer } from '@/scene/map2d/cards/slot';
import type { Frame } from '@/scene/map2d/frame';
import type { MapLayout } from '@/scene/map2d/layout/arrange/geometry';
import type { MapPiece } from '@/scene/overlay/piece-label';
import { useRevealCard } from './use-reveal-card';

interface CardAnchorProps {
  piece: Pick<MapPiece, 'id' | 'kind'>;
  others: readonly Pick<MapPiece, 'id'>[];
  layout: Pick<MapLayout, 'labels' | 'icons' | 'marks'>;
  frame: Frame;
  layer: CardLayer;
  windowHeight: number;
  children: ReactNode;
}

/** Takes the piece whose card is open, the other pieces of the map, the layout (which must hold the boxes of the piece), where the drawing stands in the layer, the layer in pixels, the height of the window and the card; returns the card in the HTML layer, beside the icon of its piece on the side with more room or docked in the bottom left corner of the layer when neither side keeps it inside (`cardSlot`). The slot is worked out from the layout on each render, so the card follows its piece when the container changes size and the layout changes mode, and it is one element whose class changes with the side, so what the card holds never remounts. The stylesheet reads the slot from the CSS variables `--card-width`, `--card-gap`, `--card-x`, `--card-y`, `--card-top` and `--card-room`, and the holder is `.map-card`, which the inspection box watches. When it opens, and when another piece opens, the browser brings it into view. */
export function CardAnchor({ piece, others, layout, frame, layer, windowHeight, children }: CardAnchorProps) {
  const holder = useRef<HTMLDivElement>(null);
  const slot = cardSlot(cardPlacement(piece, others, layout), [frame.x, frame.y], layer, windowHeight);
  useRevealCard(holder, piece.id);
  const style = {
    left: slot.anchor[0],
    top: slot.anchor[1],
    scrollMarginTop: TITLE_BAR,
    scrollMarginBottom: DOCK_MARGIN,
    '--card-width': `${CARD_WIDTH}px`,
    '--card-gap': `${slot.gap}px`,
    '--card-x': `${slot.dock[0]}px`,
    '--card-y': `${slot.dock[1]}px`,
    '--card-top': `${slot.top}px`,
    '--card-room': `${slot.room}px`,
  } as CSSProperties;
  return (
    <div ref={holder} className={`map-card map-card--${slot.position}`} style={style}>
      {children}
    </div>
  );
}
