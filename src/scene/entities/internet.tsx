import { Billboard, Line } from '@react-three/drei';
import { InkIcon } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const RADIUS = 0.62;
const LINE_RADIUS = RADIUS * 1.01;
const SEGMENTS = 48;
const CENTER_Y = RADIUS + 0.04;

function circle(radius: number, toPoint: (cos: number, sin: number) => Vec3): Vec3[] {
  return Array.from({ length: SEGMENTS + 1 }, (_, index) => {
    const angle = (index / SEGMENTS) * Math.PI * 2;
    return toPoint(Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
}

const OUTLINE = circle(RADIUS * 1.02, (a, b) => [a, b, 0]);
const EQUATOR = circle(LINE_RADIUS, (a, b) => [a, 0, b]);
const MERIDIAN_X = circle(LINE_RADIUS, (a, b) => [0, a, b]);
const MERIDIAN_Z = circle(LINE_RADIUS, (a, b) => [a, b, 0]);

/** The internet, outside every network: a paper globe with an ink equator and two meridians. */
export function InternetPiece({ position }: { position: Vec2 }) {
  const [x, z] = position;
  return (
    <group position={[x, CENTER_Y, z]}>
      <mesh>
        <sphereGeometry args={[RADIUS, 32, 24]} />
        <meshStandardMaterial color={PAPER_FILL} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={EQUATOR} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_X} color={INK} lineWidth={1} />
      <Line points={MERIDIAN_Z} color={INK} lineWidth={1} />
      <Billboard>
        <Line points={OUTLINE} color={INK} lineWidth={1.5} />
      </Billboard>
    </group>
  );
}

/** The internet's icon: the globe with its equator and a meridian. */
export function InternetIcon() {
  return (
    <InkIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </InkIcon>
  );
}
