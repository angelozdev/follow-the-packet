import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Actor } from '@/engine';
import { boxEdgePoints } from './edges';
import { useHtmlPortal } from './html-layer';
import type { DeviceSpot, Layout, Vec2, Vec3 } from './layout';
import { ACCENT, INK, PAPER_FILL, PAPER_SHADE } from './theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const PULSE_SPEED = 4;
const PULSE_AMPLITUDE = 0.35;
const PULSE_STILL_SCALE = 1.5;
const WARNING_Y = 2.1;

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

export function Sheet({ layout }: { layout: Layout }) {
  return <InkBox size={[layout.sheet.width, 0.2, layout.sheet.depth]} position={[0, -0.1, 0]} lineWidth={2} />;
}

export function Road({ layout }: { layout: Layout }) {
  const { roadZ: z, roadFromX: x1, roadToX: x2 } = layout;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[(x1 + x2) / 2, 0.012, z]}>
        <planeGeometry args={[x2 - x1, 0.7]} />
        <meshBasicMaterial color={PAPER_SHADE} />
      </mesh>
      <Line points={[[x1, 0.02, z - 0.35], [x2, 0.02, z - 0.35]]} color={INK} lineWidth={1} />
      <Line points={[[x1, 0.02, z + 0.35], [x2, 0.02, z + 0.35]]} color={INK} lineWidth={1} />
      {Object.entries(layout.devices).map(([id, spot]) => (
        <mesh key={id} rotation-x={-Math.PI / 2} position={[spot.x, 0.012, (spot.door[1] + z) / 2]}>
          <planeGeometry args={[0.5, z - spot.door[1]]} />
          <meshBasicMaterial color={PAPER_SHADE} />
        </mesh>
      ))}
    </group>
  );
}

/** A device's building; it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function Building({ spot, shaking, still }: { spot: DeviceSpot; shaking: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = shaking && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <InkBox size={[1.6, 1.1, 1.2]} position={[spot.x, 0.55, spot.z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[spot.x, 1.16, spot.z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[spot.x, 0.28, spot.z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
      {shaking && still && (
        <Html portal={portal} position={[spot.x, WARNING_Y, spot.z]} center>
          <span className="stamp stamp--drop" aria-hidden="true">
            !
          </span>
        </Html>
      )}
    </group>
  );
}

/** A device's Security Group barrier; its bar pulses while its task card is open, or stays thicker without animations. */
export function Barrier({ spot, active, still }: { spot: DeviceSpot; active: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = spot.firewall;
  useFrame(({ clock }) => {
    if (!bar.current) return;
    const pulse = still ? PULSE_STILL_SCALE : 1 + Math.abs(Math.sin(clock.elapsedTime * PULSE_SPEED)) * PULSE_AMPLITUDE;
    const scale = active ? pulse : 1;
    bar.current.scale.set(1, scale, scale);
  });
  return (
    <group>
      <InkBox size={[0.1, 0.5, 0.1]} position={[x - 0.6, 0.25, z]} />
      <InkBox size={[0.1, 0.5, 0.1]} position={[x + 0.6, 0.25, z]} />
      <group ref={bar} position={[x, 0.46, z]}>
        <InkBox size={[1.2, 0.07, 0.07]} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />
      </group>
    </group>
  );
}

export function Gateway({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group>
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z - 0.65]} />
      <InkBox size={[0.22, 1.3, 0.22]} position={[x, 0.65, z + 0.65]} />
      <InkBox size={[0.3, 0.2, 1.6]} position={[x, 1.38, z]} fill={PAPER_SHADE} />
    </group>
  );
}

export function ActorMark({ position, actor }: { position: Vec2; actor: Actor }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={actor.kind === 'attacker' ? INK : PAPER_FILL} />;
}
