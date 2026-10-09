import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { FirewallKind } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { ACCENT, INK, PAPER_SHADE } from '@/scene/theme';

const PULSE_SPEED = 4;
const PULSE_AMPLITUDE = 0.35;
const PULSE_STILL_SCALE = 1.5;
const BAR: Record<FirewallKind, { size: Vec3; y: number }> = {
  'security-group': { size: [1.2, 0.07, 0.07], y: 0.46 },
  'host-firewall': { size: [1.2, 0.24, 0.1], y: 0.36 },
};
const BRICK_JOINTS: Vec3[] = [
  [-0.6, 0, 0.051], [0.6, 0, 0.051],
  [-0.3, 0.12, 0.051], [-0.3, 0, 0.051], [0.3, 0.12, 0.051], [0.3, 0, 0.051],
  [0, 0, 0.051], [0, -0.12, 0.051],
];

/** A firewall standing in front of its device, a bar between two posts: a thin bar for a Security Group, a brick wall for the firewall of a laptop. The bar turns vermilion while it stops a packet; it pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, variant, selected, blocking, still }: { position: Vec2; variant: FirewallKind; selected: boolean; blocking: boolean; still: boolean }) {
  const bar = useRef<Group>(null);
  const [x, z] = position;
  useFrame(({ clock }) => {
    if (!bar.current) return;
    const pulse = still ? PULSE_STILL_SCALE : 1 + Math.abs(Math.sin(clock.elapsedTime * PULSE_SPEED)) * PULSE_AMPLITUDE;
    const scale = selected ? pulse : 1;
    bar.current.scale.set(1, scale, scale);
  });
  return (
    <group>
      <InkBox size={[0.1, 0.5, 0.1]} position={[x - 0.6, 0.25, z]} />
      <InkBox size={[0.1, 0.5, 0.1]} position={[x + 0.6, 0.25, z]} />
      <group ref={bar} position={[x, BAR[variant].y, z]}>
        <InkBox size={BAR[variant].size} position={[0, 0, 0]} fill={blocking ? ACCENT : PAPER_SHADE} lineWidth={1} />
        {variant === 'host-firewall' && <Line points={BRICK_JOINTS} segments color={INK} lineWidth={1} />}
      </group>
    </group>
  );
}

/** The firewall's icon: two posts and its bar, thin for a Security Group and of bricks for the firewall of a laptop. */
export function FirewallIcon({ variant }: { variant: FirewallKind }) {
  return (
    <InkIcon>
      <path d="M5 7v13M19 7v13" />
      {variant === 'security-group' ? (
        <rect x="5" y="10" width="14" height="2" />
      ) : (
        <>
          <rect x="5" y="9" width="14" height="7" />
          <path d="M5 12.5h14M9.5 9v3.5M14.5 9v3.5M12 12.5V16" />
        </>
      )}
    </InkIcon>
  );
}
