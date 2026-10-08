import { Html } from '@react-three/drei';
import type { ReactNode } from 'react';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import { useCardSide } from './use-card-side';

const CARD_LAYERS: [number, number] = [30, 20];

export function CardAnchor({ position, children }: { position: Vec3; children: ReactNode }) {
  const portal = useHtmlPortal();
  const side = useCardSide(position);
  return (
    <Html portal={portal} position={position} zIndexRange={CARD_LAYERS}>
      <div className={`map-card map-card--${side}`}>{children}</div>
    </Html>
  );
}
