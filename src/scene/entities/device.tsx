import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { useHtmlPortal } from '@/scene/html-layer';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { PAPER_SHADE } from '@/scene/theme';

const SHAKE_SPEED = 40;
const SHAKE_AMPLITUDE = 0.05;
const WARNING_Y = 2.1;

/** A device: it shakes while something forbidden gets in, or shows a fixed warning mark without animations. */
export function DevicePiece({ position, intruded, still }: { position: Vec2; intruded: boolean; still: boolean }) {
  const portal = useHtmlPortal();
  const group = useRef<Group>(null);
  const [x, z] = position;
  useFrame(({ clock }) => {
    if (group.current) group.current.position.x = intruded && !still ? Math.sin(clock.elapsedTime * SHAKE_SPEED) * SHAKE_AMPLITUDE : 0;
  });
  return (
    <group ref={group}>
      <InkBox size={[1.6, 1.1, 1.2]} position={[x, 0.55, z]} />
      <InkBox size={[1.7, 0.12, 1.3]} position={[x, 1.16, z]} fill={PAPER_SHADE} />
      <InkBox size={[0.4, 0.55, 0.04]} position={[x, 0.28, z + 0.62]} fill={PAPER_SHADE} lineWidth={1} />
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
