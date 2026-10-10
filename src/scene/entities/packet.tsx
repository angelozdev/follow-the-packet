import { Billboard, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Shape, type Group } from 'three';
import type { PacketMessage, PacketVariant } from '@/copy';
import { cumulativeLengths, pathLength, pointAt, roundTrip, type Vec2, type Vec3 } from '@/scene/layout';
import { InkIcon } from '@/scene/ink';
import { DANGER, INK, LINE, PAPER_FILL } from '@/scene/theme';

export type PacketEnd = 'replied' | 'arrived' | 'blocked' | 'lost' | 'warned' | 'self-warned';

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
const DASH = { dashSize: 0.18, gapSize: 0.14 } as const;
const REPLY_MARK_DISTANCE = 0.6;
const WARNING_HALF_WIDTH = 0.283;
const WARNING_APEX = 0.343;
const WARNING_BASE = -0.17;
const WARNING_MARK_Z = 0.01;
const WARNING_BAR: { size: [number, number]; y: number } = { size: [0.052, 0.204], y: 0.063 };
const WARNING_DOT = { radius: 0.031, y: -0.11, segments: 12 };
const WARNING_TRIANGLE = new Shape().moveTo(0, WARNING_APEX).lineTo(WARNING_HALF_WIDTH, WARNING_BASE).lineTo(-WARNING_HALF_WIDTH, WARNING_BASE).closePath();
const WARNED_ENDS: readonly PacketEnd[] = ['warned', 'self-warned'];
const COMES_BACK: readonly PacketEnd[] = ['replied', 'warned'];

/** Returns the points a packet travels: its path, and the same path back when it is answered or a warning comes back along it. A warning the sender's own device generates comes back from nowhere: it appears at the end of the path. */
export function travelPath(path: Vec2[], end: PacketEnd): Vec2[] {
  return COMES_BACK.includes(end) ? roundTrip(path) : path;
}

function WarningShape() {
  return (
    <>
      <mesh>
        <shapeGeometry args={[WARNING_TRIANGLE]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh position={[0, WARNING_BAR.y, WARNING_MARK_Z]}>
        <planeGeometry args={WARNING_BAR.size} />
        <meshBasicMaterial color={PAPER_FILL} />
      </mesh>
      <mesh position={[0, WARNING_DOT.y, WARNING_MARK_Z]}>
        <circleGeometry args={[WARNING_DOT.radius, WARNING_DOT.segments]} />
        <meshBasicMaterial color={PAPER_FILL} />
      </mesh>
    </>
  );
}

/** The flat shape of a packet, facing the camera: a filled dot for an Echo Request and a ring for an Echo Reply, in ink; a rhombus in vermilion, filled or hollow, for an intruder; and an ink triangle with an exclamation mark cut out of it for a warning, which is never an intruder's. */
export function PacketGlyph({ message, intruder }: { message: PacketVariant; intruder: boolean }) {
  if (message === 'warning') {
    return (
      <Billboard>
        <WarningShape />
      </Billboard>
    );
  }
  const radius = intruder ? RHOMBUS_RADIUS : DOT_RADIUS;
  const segments = intruder ? RHOMBUS_SEGMENTS : ROUND_SEGMENTS;
  return (
    <Billboard>
      <mesh>
        {message === 'echo-request' ? <circleGeometry args={[radius, segments]} /> : <ringGeometry args={[radius * HOLLOW, radius, segments]} />}
        <meshBasicMaterial color={intruder ? DANGER : INK} />
      </mesh>
    </Billboard>
  );
}

function answerOf(end: PacketEnd, intruder: boolean): { message: PacketVariant; intruder: boolean } {
  return WARNED_ENDS.includes(end) ? { message: 'warning', intruder: false } : { message: 'echo-reply', intruder };
}

/** One packet travelling its path. An answered one comes back as an Echo Reply, and one that ends in a warning from a router as that warning, along the same path; a warning that the sender's own device generates does not travel: it appears at the end of the path and stays there until the run is over. At the end a blocked packet bursts and a lost one shrinks away. */
export function PacketRun({ path, message, intruder, end }: PacketLook) {
  const route = useMemo(() => travelPath(path, end), [path, end]);
  const lengths = useMemo(() => cumulativeLengths(route), [route]);
  const total = lengths.at(-1) ?? 0;
  const turn = COMES_BACK.includes(end) ? pathLength(path) : Infinity;
  const going = useRef<Group>(null);
  const back = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const appears = useRef<Group>(null);
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
    if (appears.current) appears.current.visible = over > 0;
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = route[route.length - 1];
  const answer = answerOf(end, intruder);
  return (
    <>
      <group ref={going} position={[startX, PACKET_Y, startZ]}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
      <group ref={back} position={[startX, PACKET_Y, startZ]} visible={false}>
        <PacketGlyph {...answer} />
      </group>
      {end === 'self-warned' && (
        <group ref={appears} position={[endX, PACKET_Y, endZ]} visible={false}>
          <PacketGlyph {...answer} />
        </group>
      )}
      <group ref={burst} position={[endX, PACKET_Y, endZ]} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={BURST_RING} />
          <meshBasicMaterial color={DANGER} />
        </mesh>
      </group>
    </>
  );
}

function markAt(path: Vec2[], distance: number): Vec3 {
  const [x, z] = pointAt(path, cumulativeLengths(path), distance);
  return [x, PACKET_Y, z];
}

/** A packet's path drawn without movement: a line in ink, vermilion when it is blocked and dashed when it is lost, with the packet's shape halfway and, when it was answered, an Echo Reply back near its start, or the warning that came back along the path. A warning that the sender's own device generates has no packet halfway, since nothing left: it stands at the end of the path. */
export function PacketTrace({ path, message, intruder, end }: PacketLook) {
  const length = pathLength(path);
  const answer = answerOf(end, intruder);
  return (
    <>
      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? DANGER : INK} lineWidth={LINE.heavy} dashed={end === 'lost'} {...DASH} />
      {end !== 'self-warned' && (
        <group position={markAt(path, length / 2)}>
          <PacketGlyph message={message} intruder={intruder} />
        </group>
      )}
      {COMES_BACK.includes(end) && (
        <group position={markAt(path, Math.min(REPLY_MARK_DISTANCE, length / 4))}>
          <PacketGlyph {...answer} />
        </group>
      )}
      {end === 'self-warned' && (
        <group position={markAt(path, length)}>
          <PacketGlyph {...answer} />
        </group>
      )}
    </>
  );
}

const PACKET_ICON_PATH = { round: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z', rhombus: 'M12 5l7 7-7 7-7-7z' } as const;
const WARNING_ICON_PATH = { triangle: 'M12 4.5l8.5 15h-17z', mark: 'M12 10v4.5M12 17.2h.01' } as const;

/** The packet's icon, the same shape as on the map: filled for an Echo Request, hollow for an Echo Reply, a rhombus for an intruder, a triangle with an exclamation mark for a warning. */
export function PacketIcon({ message, intruder }: { message: PacketVariant; intruder: boolean }) {
  if (message === 'warning') {
    return (
      <InkIcon>
        <path d={WARNING_ICON_PATH.triangle} />
        <path d={WARNING_ICON_PATH.mark} />
      </InkIcon>
    );
  }
  const request = message === 'echo-request';
  return (
    <InkIcon>
      <path d={PACKET_ICON_PATH[intruder ? 'rhombus' : 'round']} fill={request ? 'currentColor' : 'none'} strokeWidth={request ? 1.6 : 2.6} />
    </InkIcon>
  );
}
