import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type ReactNode } from 'react';
import type { Group } from 'three';
import type { EntityVariants } from '@/copy';
import { boxEdgePoints } from '@/scene/edges';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, LINE, PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const DOUBLE_BORDER_GAP = 0.16;
const MAT: Vec3 = [2.1, 0.04, 1.8];
const BAY_HEIGHTS = [0.3, 0.6, 0.9];

type Spot = { x: number; z: number };

/** Every kind of device the map draws: the ones of a network and the server of the internet. */
export type DeviceVariant = EntityVariants['device'];

function Server({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
    </>
  );
}

function InternetServer({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1, 1.2, 1]} position={[x, 0.6, z]} />
      <InkBox size={[1.1, 0.1, 1.1]} position={[x, 1.25, z]} fill={PAPER_SHADE} />
      {BAY_HEIGHTS.map((y) => (
        <InkBox key={y} size={[0.7, 0.14, 0.04]} position={[x, y, z + 0.52]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
      ))}
      <InkBox size={[0.06, 0.25, 0.06]} position={[x + 0.3, 1.425, z]} lineWidth={LINE.thin} />
    </>
  );
}

function Laptop({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.12, 1]} position={[x, 0.06, z]} />
      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
    </>
  );
}

function Printer({ x, z }: Spot) {
  return (
    <>
      <InkBox size={[1.4, 0.6, 1]} position={[x, 0.3, z]} />
      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
    </>
  );
}

const DEVICE_SHAPE: Record<DeviceVariant, (spot: Spot) => ReactNode> = { laptop: Laptop, printer: Printer, 'ec2-instance': Server, 'internet-server': InternetServer };
const DEVICE_BOX: Record<DeviceVariant, { size: Vec3; y: number }> = {
  laptop: { size: [1.4, 1.02, 1], y: 0.51 },
  printer: { size: [1.4, 1.11, 1.4], y: 0.555 },
  'ec2-instance': { size: [1.7, 1.22, 1.3], y: 0.61 },
  'internet-server': { size: [1.1, 1.55, 1.1], y: 0.775 },
};

function DoubleBorder({ x, z, variant }: Spot & { variant: DeviceVariant }) {
  const { size, y } = DEVICE_BOX[variant];
  const [w, h, d] = size.map((side) => side + DOUBLE_BORDER_GAP);
  return (
    <group position={[x, y, z]}>
      <Line points={boxEdgePoints(w, h, d)} segments color={INK} lineWidth={LINE.regular} />
    </group>
  );
}

/** A device of the network, drawn by its variant: on a paper mat while selected; shaking while something forbidden gets in, or with a double border without animations. */
export function DevicePiece({ position, variant, selected, intruded, still }: { position: Vec2; variant: DeviceVariant; selected: boolean; intruded: boolean; still: boolean }) {
  const group = useRef<Group>(null);
  const [x, z] = position;
  const Shape = DEVICE_SHAPE[variant];
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      {selected && <InkBox size={MAT} position={[x, MAT[1] / 2, z]} fill={PAPER_SHADE} lineWidth={LINE.thin} />}
      <Shape x={x} z={z} />
      {intruded && still && <DoubleBorder x={x} z={z} variant={variant} />}
    </group>
  );
}

const DEVICE_ICON: Record<DeviceVariant, ReactNode> = {
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1" />
      <path d="M3 19l2-4h14l2 4z" />
    </>
  ),
  printer: (
    <>
      <path d="M7 10V4h10v6" />
      <rect x="3" y="10" width="18" height="7" rx="1" />
      <path d="M7 17v3h10v-3" />
    </>
  ),
  'ec2-instance': (
    <>
      <rect x="4" y="5" width="16" height="3" />
      <rect x="5" y="8" width="14" height="12" />
      <rect x="10" y="14" width="4" height="6" />
    </>
  ),
  'internet-server': (
    <>
      <rect x="7" y="6" width="10" height="15" />
      <path d="M9.5 10h5M9.5 13.5h5M9.5 17h5M12 6V2" />
    </>
  ),
};

/** The device's icon: the front of its piece. */
export function DeviceIcon({ variant }: { variant: DeviceVariant }) {
  return <InkIcon>{DEVICE_ICON[variant]}</InkIcon>;
}
