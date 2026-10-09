import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Device } from '@/engine';
import { useHtmlPortal } from '@/scene/html-layer';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const WARNING_Y = 2.1;

function Server({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Laptop({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.4, 0.12, 1]} position={[x, 0.06, z]} />
      <InkBox size={[1.1, 0.02, 0.45]} position={[x, 0.13, z + 0.12]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[1.4, 0.9, 0.08]} position={[x, 0.57, z - 0.46]} />
      <InkBox size={[1.2, 0.7, 0.02]} position={[x, 0.57, z - 0.41]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

function Printer({ x, z }: { x: number; z: number }) {
  return (
    <>
      <InkBox size={[1.4, 0.6, 1]} position={[x, 0.3, z]} />
      <InkBox size={[1, 0.04, 0.3]} position={[x, 0.62, z - 0.2]} fill={PAPER_SHADE} lineWidth={1} />
      <InkBox size={[0.8, 0.5, 0.03]} position={[x, 0.86, z - 0.24]} />
      <InkBox size={[0.9, 0.05, 0.4]} position={[x, 0.3, z + 0.7]} fill={PAPER_SHADE} lineWidth={1} />
    </>
  );
}

const DEVICE_SHAPE = { laptop: Laptop, printer: Printer, 'ec2-instance': Server } satisfies Record<Device['kind'], (spot: { x: number; z: number }) => unknown>;

/** A device of the network, drawn by its variant: it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function DevicePiece({ position, variant, intruded, still }: { position: Vec2; variant: Device['kind']; intruded: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  const [x, z] = position;
  const Shape = DEVICE_SHAPE[variant];
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <Shape x={x} z={z} />
      {intruded && still && (
        <Html portal={portal} position={[x, WARNING_Y, z]} center>
          <span className="stamp stamp--blocked" aria-hidden="true">
            !
          </span>
        </Html>
      )}
    </group>
  );
}
