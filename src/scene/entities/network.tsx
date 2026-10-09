import { InkBox } from '@/scene/ink';

/** The network's slab: the floor its devices stand on. */
export function NetworkPiece({ width, depth }: { width: number; depth: number }) {
  return <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}
