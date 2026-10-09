import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { Device } from '@/engine';
import { boxEdgePoints } from '@/scene/edges';
import { InkBox } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const DOUBLE_BORDER_GAP = 0.16;
const MAT: Vec3 = [2.1, 0.04, 1.8];

type Spot = { x: number; z: number };

function Server({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Laptop({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.12, 1]} position={[x, 0.06, z]} />
      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Printer({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.6, 1]} position={[x, 0.3, z]} />
      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

const DEVICE_SHAPE: Record<Device['kind'], (spot: Spot) => ReactNode> = { laptop: Laptop, printer: Printer, 'ec2-instance': Server };
const DEVICE_BOX: Record<Device['kind'], { size: Vec3; y: number }> = {
  laptop: { size: [1.4, 1.02, 1], y: 0.51 },
  printer: { size: [1.4, 1.11, 1.4], y: 0.555 },
  'ec2-instance': { size: [1.7, 1.22, 1.3], y: 0.61 },
};

function DoubleBorder({ x, z, variant }: Spot & { variant: Device['kind'] }) {
  const { size, y } = DEVICE_BOX[variant];
  const [w, h, d] = size.map((side) => side + DOUBLE_BORDER_GAP);
  return (
    <group position={[x, y, z]}>
      <Line points={boxEdgePoints(w, h, d)} segments color={INK} lineWidth={1.5} />
    </group>
  );
}

/** A device of the network, drawn by its variant: on a paper mat while selected; shaking while something forbidden gets in, or with a double border without animations. */
export function DevicePiece({ position, variant, selected, intruded, still }: { position: Vec2; variant: Device['kind']; selected: boolean; intruded: boolean; still: boolean }) {
  const group = useRef<Group>(null);
  const [x, z] = position;
  const Shape = DEVICE_SHAPE[variant];
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={1} />}
      <Shape x={x} z={z} />
      {intruded && still && <DoubleBorder x={x} z={z} variant={variant} />}
    </group>
  );
}
