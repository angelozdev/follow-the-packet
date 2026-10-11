import { Html } from '@react-three/drei';
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useHtmlPortal } from '@/scene/html-layer';
import { CARD_WIDTH, type CardPlacement } from '@/scene/layout';
import { roomLength, useCardSide } from './use-card-side';

const CARD_LAYERS: [number, number] = [30, 20];

/** Anchors a card beside a piece of the map, on the side its placement picks (or docked in the map's bottom left corner), as wide and as far from the anchor as the placement says. */
export function CardAnchor({ placement, children }: { placement: CardPlacement; children: ReactNode }) {
  const portal = useHtmlPortal();
  const card = useRef<HTMLDivElement>(null);
  const { position, dock, top, room } = useCardSide(placement, card);
  const size = { '--card-width': `${CARD_WIDTH}px`, '--card-gap': `${placement.gap}px`, '--card-x': `${dock[0]}px`, '--card-y': `${dock[1]}px`, '--card-top': `${top}px`, '--card-room': roomLength(room) } as CSSProperties;
  return (
    <Html portal={portal} position={placement.position} zIndexRange={CARD_LAYERS}>
      <div ref={card} className={`map-card map-card--${position}`} style={size}>
        {children}
      </div>
    </Html>
  );
}
