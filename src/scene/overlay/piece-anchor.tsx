import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import type { OnInspect } from './inspect-handlers';
import { PieceLabel, type MapPiece } from './piece-label';

const LABEL_LAYERS: [number, number] = [20, 10];

export function PieceAnchor({ piece, position, onInspect, onActivate }: { piece: MapPiece; position: Vec3; onInspect: OnInspect; onActivate: (pieceId: string) => void }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center zIndexRange={LABEL_LAYERS}>
      <PieceLabel piece={piece} onInspect={onInspect} onActivate={onActivate} />
    </Html>
  );
}
