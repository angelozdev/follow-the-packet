import { Html } from '@react-three/drei';
import { useHtmlPortal } from '@/scene/html-layer';
import type { Vec3 } from '@/scene/layout';
import type { InspectTrigger } from './inspect-trigger';
import { PieceLabel, type MapPiece } from './piece-label';

export const LABEL_LAYERS: [number, number] = [20, 10];

export function PieceAnchor({ piece, position, inspectTrigger, onActivate }: { piece: MapPiece; position: Vec3; inspectTrigger: InspectTrigger; onActivate: (pieceId: string) => void }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} position={position} center zIndexRange={LABEL_LAYERS}>
      <PieceLabel piece={piece} trigger={inspectTrigger(piece.id)} onActivate={onActivate} />
    </Html>
  );
}
