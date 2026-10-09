import { Line } from '@react-three/drei';
import { boxEdgePoints } from './edges';
import type { Vec3 } from './layout';
import { INK, PAPER_FILL } from './theme';

/** A paper box with ink edges: the brick every map piece is built from. */
export function InkBox({ size, position, fill = PAPER_FILL, lineWidth = 1.5 }: { size: Vec3; position: Vec3; fill?: string; lineWidth?: number }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={fill} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={boxEdgePoints(size[0], size[1], size[2])} segments color={INK} lineWidth={lineWidth} />
    </group>
  );
}
