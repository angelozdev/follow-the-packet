import { Line } from '@react-three/drei';
import type { Layout } from './layout';
import { INK, LINE, PAPER_SHADE } from './theme';

/** The road every packet travels inside the network, with a short path from it to the door of each device. */
export function Road({ layout }: { layout: Layout }) {
  const { roadZ: z, roadFromX: x1, roadToX: x2 } = layout;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(x1 + x2) / 2, 0.012, z]}>
        <planeGeometry args={[x2 - x1, 0.7]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={LINE.thin} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={LINE.thin} />
      {Object.entries(layout.devices).map(([id, spot]) => (
        <mesh key={id} rotation-x={-Math.PI / 2} position={[spot.x, 0.012, (spot.door[1] + z) / 2]}>
          <planeGeometry args={[0.5, z - spot.door[1]]} />
          <meshBasicMaterial color={PAPER_SHADE} />
        </mesh>
      ))}
    </group>
  );
}
