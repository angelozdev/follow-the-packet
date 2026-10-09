import { Line } from '@react-three/drei';
import type { ReactNode } from 'react';
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

/** A 24×24 ink icon in the text's colour (`currentColor`), hidden from screen readers: the text beside it names what it shows. */
export function InkIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="entity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
