import type { Network } from '@/engine';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

/** The network's way out to the internet, an arch over the road: plain for an Internet gateway, with two antennas for a router. */
export function EdgePiece({ position, variant }: { position: Vec2; variant: Network['edge'] }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z - 0.65]} />
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z + 0.65]} />
      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
      {variant === 'router' && (
        <>
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z - 0.45]} lineWidth={1} />
          <InkBox size={[0.06, 0.55, 0.06]} position={[x, 1.76, z + 0.45]} lineWidth={1} />
        </>
      )}
    </group>
  );
}
