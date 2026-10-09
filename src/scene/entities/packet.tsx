import { Billboard, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import type { PacketMessage } from '@/copy';
import { cumulativeLengths, pathLength, pointAt, roundTrip, type Vec2, type Vec3 } from '@/scene/layout';
import { InkIcon } from '@/scene/ink';
import { ACCENT, INK } from '@/scene/theme';

export type PacketEnd = 'replied' | 'arrived' | 'blocked' | 'lost';

export interface PacketLook {
  path: Vec2[];
  message: PacketMessage;
  intruder: boolean;
  end: PacketEnd;
}

export const PACKET_SPEED = 3.2;
export const PACKET_END_S = 0.5;
export const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const RHOMBUS_RADIUS = 0.26;
const HOLLOW = 0.55;
const ROUND_SEGMENTS = 24;
const RHOMBUS_SEGMENTS = 4;
const BURST_GROWTH = 3;
const BURST_RING: [number, number, number] = [0.22, 0.3, 24];
const TRACE_LINE_WIDTH = 2.5;
const DASH = { dashSize: 0.18, gapSize: 0.14 } as const;
const REPLY_MARK_DISTANCE = 0.6;

/** Returns the points a packet travels: its path, and the same path back when it is answered. */
export function travelPath(path: Vec2[], end: PacketEnd): Vec2[] {
  return end === 'replied' ? roundTrip(path) : path;
}

/** The flat shape of a packet, facing the camera: a filled dot for an Echo Request and a ring for an Echo Reply, in ink; a rhombus in vermilion, filled or hollow, for an intruder. */
export function PacketGlyph({ message, intruder }: { message: PacketMessage; intruder: boolean }) {
  const radius = intruder ? RHOMBUS_RADIUS : DOT_RADIUS;
  const segments = intruder ? RHOMBUS_SEGMENTS : ROUND_SEGMENTS;
  return (
    <Billboard>
      <mesh>
        {message === 'echo-request' ? <circleGeometry args={[radius, segments]} /> : <ringGeometry args={[radius * HOLLOW, radius, segments]} />}
        <meshBasicMaterial color={intruder ? ACCENT : INK} />
      </mesh>
    </Billboard>
  );
}

/** One packet travelling its path. An answered one comes back as an Echo Reply; at the end a blocked one bursts and a lost one shrinks away. */
export function PacketRun({ path, message, intruder, end }: PacketLook) {
  const route = useMemo(() => travelPath(path, end), [path, end]);
  const lengths = useMemo(() => cumulativeLengths(route), [route]);
  const total = lengths.at(-1) ?? 0;
  const turn = end === 'replied' ? pathLength(path) : Infinity;
  const going = useRef<Group>(null);
  const back = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const travelled = useRef(0);
  useFrame((_, delta) => {
    travelled.current += delta * PACKET_SPEED;
    const over = travelled.current - total;
    const fading = end === 'lost' && over > 0 && over < PACKET_END_S;
    const [x, z] = pointAt(route, lengths, travelled.current);
    for (const [glyph, shown] of [
      [going.current, travelled.current <= turn],
      [back.current, travelled.current > turn],
    ] as const) {
      if (!glyph) continue;
      glyph.position.set(x, PACKET_Y, z);
      glyph.visible = shown && (over <= 0 || fading);
      glyph.scale.setScalar(fading ? 1 - over / PACKET_END_S : 1);
    }
    if (burst.current) {
      burst.current.visible = end === 'blocked' && over > 0;
      burst.current.scale.setScalar(1 + Math.max(over, 0) * BURST_GROWTH);
    }
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = route[route.length - 1];
  return (
    <>
      <group ref={going} position={[startX, PACKET_Y, startZ]}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
      <group ref={back} position={[startX, PACKET_Y, startZ]} visible={false}>
        <PacketGlyph message="echo-reply" intruder={intruder} />
      </group>
      <group ref={burst} position={[endX, PACKET_Y, endZ]} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={BURST_RING} />
          <meshBasicMaterial color={ACCENT} />
        </mesh>
      </group>
    </>
  );
}

function markAt(path: Vec2[], distance: number): Vec3 {
  const [x, z] = pointAt(path, cumulativeLengths(path), distance);
  return [x, PACKET_Y, z];
}

/** A packet's path drawn without movement: a line in ink, vermilion when it is blocked and dashed when it is lost, with the packet's shape halfway and, when it was answered, an Echo Reply back near its start. */
export function PacketTrace({ path, message, intruder, end }: PacketLook) {
  const length = pathLength(path);
  return (
    <>
      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? ACCENT : INK} lineWidth={TRACE_LINE_WIDTH} dashed={end === 'lost'} {...DASH} />
      <group position={markAt(path, length / 2)}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
      {end === 'replied' && (
        <group position={markAt(path, Math.min(REPLY_MARK_DISTANCE, length / 4))}>
          <PacketGlyph message="echo-reply" intruder={intruder} />
        </group>
      )}
    </>
  );
}

const PACKET_ICON_PATH = { round: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z', rhombus: 'M12 5l7 7-7 7-7-7z' } as const;

/** The packet's icon, the same shape as on the map: filled for an Echo Request, hollow for an Echo Reply, a rhombus for an intruder. */
export function PacketIcon({ message, intruder }: { message: PacketMessage; intruder: boolean }) {
  const request = message === 'echo-request';
  return (
    <InkIcon>
      <path d={PACKET_ICON_PATH[intruder ? 'rhombus' : 'round']} fill={request ? 'currentColor' : 'none'} strokeWidth={request ? 1.6 : 2.6} />
    </InkIcon>
  );
}
