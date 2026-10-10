import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import { LABEL_LAYERS } from './piece-anchor';

/** The name of a floor, floating at the front of its slab: plain text in the caption style, not a button, because a floor is not a piece the player opens. */
export function FloorLabel({ position, name }: { position: Vec3; name: string }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center zIndexRange={LABEL_LAYERS}>
      <span className="caption">{name}</span>
    </Html>
  );
}
