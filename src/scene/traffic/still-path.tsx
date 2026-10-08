import { Line } from '@react-three/drei';
import type { Vec2, Vec3 } from '@/scene/layout';
import { ACCENT, INK } from '@/scene/theme';
import { PACKET_Y } from './packet-run';

const STILL_LINE_WIDTH = 2.5;

/** A flow's path drawn without movement: ink when it gets in, vermilion up to where it stops. */
export function StillPath({ path, reached }: { path: Vec2[]; reached: boolean }) {
  return <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={reached ? INK : ACCENT} lineWidth={STILL_LINE_WIDTH} />;
}
