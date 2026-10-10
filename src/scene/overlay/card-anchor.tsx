import { Html } from '@react-three/drei';
import type { CSSProperties, ReactNode } from 'react';
import { useHtmlPortal } from '@/scene/html-layer';
import { CARD_WIDTH, type CardPlacement } from '@/scene/layout';
import { useCardSide } from './use-card-side';

const CARD_LAYERS: [number, number] = [30, 20];

/** Anchors a card beside a piece of the map, on the side its placement picks, as wide and as far from the anchor as the placement says. */
export function CardAnchor({ placement, children }: { placement: CardPlacement; children: ReactNode }) {
  const portal = useHtmlPortal();
  const side = useCardSide(placement);
  const size = { '--card-width': `${CARD_WIDTH}px`, '--card-gap': `${placement.gap}px` } as CSSProperties;
  return (
    <Html portal={portal} position={placement.position} zIndexRange={CARD_LAYERS}>
      <div className={`map-card map-card--${side}`} style={size}>
        {children}
      </div>
    </Html>
  );
}
