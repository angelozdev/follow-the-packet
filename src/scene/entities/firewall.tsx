import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { ACCENT } from '@/scene/theme';

const PULSE_SPEED = 4;
const PULSE_AMPLITUDE = 0.35;
const PULSE_STILL_SCALE = 1.5;

/** A firewall standing in front of its device: its bar pulses while its task card is open, or stays thicker without animations. */
export function FirewallPiece({ position, selected, still }: { position: Vec2; selected: boolean; still: boolean }) {
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
      <group ref={bar} position={[x, 0.46, z]}>
        <InkBox size={[1.2, 0.07, 0.07]} position={[0, 0, 0]} fill={ACCENT} lineWidth={1} />
      </group>
    </group>
  );
}
