import { Billboard, Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import { Shape, type Group } from 'three';
import { replyShape, type PacketShape, type PacketVariant } from '@/copy';
import { useHtmlPortal } from '@/scene/html-layer';
import { cumulativeLengths, pathLength, pointAt, roundTrip, tagAt, type PacketTags, type Vec2, type Vec3 } from '@/scene/layout';
import { InkIcon } from '@/scene/ink';
import { DANGER, INK, LINE, PAPER_FILL } from '@/scene/theme';

export type PacketEnd = 'replied' | 'arrived' | 'blocked' | 'lost' | 'warned' | 'self-warned';

export interface PacketLook {
  path: Vec2[];
  message: PacketShape;
  intruder: boolean;
  end: PacketEnd;
  tags?: PacketTags;
}

export const PACKET_SPEED = 3.2;
export const PACKET_END_S = 0.5;
export const PACKET_Y = 0.3;
const DOT_RADIUS = 0.17;
const SQUARE_RADIUS = 0.23;
const HEXAGON_RADIUS = 0.21;
const HOLLOW = 0.55;
const ROUND_SEGMENTS = 24;
const SQUARE_SEGMENTS = 4;
const HEXAGON_SEGMENTS = 6;
const SQUARE_TURN = Math.PI / 4;
const INTRUDER_BORDER = { gap: 1.55, width: 0.045 } as const;
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
const TAG_LAYERS: [number, number] = [12, 2];

/** Returns the points a packet travels: its path, and the same path back when it is answered or a warning comes back along it. A warning the sender's own device generates comes back from nowhere: it appears at the end of the path. */
export function travelPath(path: Vec2[], end: PacketEnd): Vec2[] {
  return COMES_BACK.includes(end) ? roundTrip(path) : path;
}

/** The label of a packet with ports, beside it on the HTML layer: its protocol and ports as they are in the leg where the packet is. It takes no pointer and no screen reader, because the stamp of the packet already tells it. */
function PacketTag({ text }: { text: string }) {
  const portal = useHtmlPortal();
  return (
    <Html portal={portal} center zIndexRange={TAG_LAYERS}>
      <span className="packet-tag" aria-hidden="true">
        {text}
      </span>
    </Html>
  );
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

/** How one packet is drawn on the map: a regular polygon of `sides` sides, turned `turn` radians, of this `radius`, filled when it asks and a ring when it answers (`hollow`). A dot has 24 sides, TCP is a square and UDP a hexagon, so the shape says the protocol. */
export interface PacketShapeLook {
  sides: number;
  turn: number;
  radius: number;
  hollow: boolean;
}

const DOT: Pick<PacketShapeLook, 'sides' | 'turn' | 'radius'> = { sides: ROUND_SEGMENTS, turn: 0, radius: DOT_RADIUS };
const SQUARE: Pick<PacketShapeLook, 'sides' | 'turn' | 'radius'> = { sides: SQUARE_SEGMENTS, turn: SQUARE_TURN, radius: SQUARE_RADIUS };
const HEXAGON: Pick<PacketShapeLook, 'sides' | 'turn' | 'radius'> = { sides: HEXAGON_SEGMENTS, turn: 0, radius: HEXAGON_RADIUS };

/** The shape of every packet that a sender sends or that answers it: ICMP is a dot, TCP a square and UDP a hexagon, each filled to ask and a ring to answer. */
export const PACKET_SHAPES: Record<PacketShape, PacketShapeLook> = {
  'echo-request': { ...DOT, hollow: false },
  'echo-reply': { ...DOT, hollow: true },
  'tcp-request': { ...SQUARE, hollow: false },
  'tcp-reply': { ...SQUARE, hollow: true },
  'udp-request': { ...HEXAGON, hollow: false },
  'udp-reply': { ...HEXAGON, hollow: true },
};

function GlyphMesh({ shape, color }: { shape: PacketShapeLook; color: string }) {
  const { sides, turn, radius, hollow } = shape;
  return (
    <mesh>
      {hollow ? <ringGeometry args={[radius * HOLLOW, radius, sides, 1, turn]} /> : <circleGeometry args={[radius, sides, turn]} />}
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function IntruderBorder({ shape }: { shape: PacketShapeLook }) {
  const outer = shape.radius * INTRUDER_BORDER.gap;
  return (
    <mesh>
      <ringGeometry args={[outer - INTRUDER_BORDER.width, outer, shape.sides, 1, shape.turn]} />
      <meshBasicMaterial color={DANGER} />
    </mesh>
  );
}

/** The flat shape of a packet, facing the camera: the shape of its protocol (a dot for ICMP, a square for TCP, a hexagon for UDP), filled when it asks and a ring when it answers, in ink; the same shape in vermilion with a second border of the same shape around it for an intruder, so the shape says the protocol and the border says the role; and an ink triangle with an exclamation mark cut out of it for a warning, which is never an intruder's. */
export function PacketGlyph({ message, intruder }: { message: PacketVariant; intruder: boolean }) {
  if (message === 'warning') {
    return (
      <Billboard>
        <WarningShape />
      </Billboard>
    );
  }
  const shape = PACKET_SHAPES[message];
  return (
    <Billboard>
      <GlyphMesh shape={shape} color={intruder ? DANGER : INK} />
      {intruder && <IntruderBorder shape={shape} />}
    </Billboard>
  );
}

function answerOf(end: PacketEnd, message: PacketShape, intruder: boolean): { message: PacketVariant; intruder: boolean } {
  return WARNED_ENDS.includes(end) ? { message: 'warning', intruder: false } : { message: replyShape(message), intruder };
}

/** One packet travelling its path. An answered one comes back as the ring of its protocol, and one that ends in a warning from a router as that warning, along the same path; a warning that the sender's own device generates does not travel: it appears at the end of the path and stays there until the run is over. At the end a blocked packet bursts and a lost one shrinks away. */
export function PacketRun({ path, message, intruder, end, tags }: PacketLook) {
  const route = useMemo(() => travelPath(path, end), [path, end]);
  const lengths = useMemo(() => cumulativeLengths(route), [route]);
  const total = lengths.at(-1) ?? 0;
  const turn = COMES_BACK.includes(end) ? pathLength(path) : Infinity;
  const going = useRef<Group>(null);
  const back = useRef<Group>(null);
  const burst = useRef<Group>(null);
  const appears = useRef<Group>(null);
  const tagged = useRef<Group>(null);
  const travelled = useRef(0);
  const [tag, setTag] = useState<string | null>(tags ? tagAt(tags, 0, false) : null);
  const shownTag = useRef(tag);
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
    tagged.current?.position.set(x, PACKET_Y, z);
    if (!tags) return;
    const returning = travelled.current > turn;
    const text = over > 0 || (returning && end !== 'replied') ? null : tagAt(tags, returning ? pathLength(path) - (travelled.current - turn) : travelled.current, returning);
    if (text !== shownTag.current) {
      shownTag.current = text;
      setTag(text);
    }
  });
  const [startX, startZ] = path[0];
  const [endX, endZ] = route[route.length - 1];
  const answer = answerOf(end, message, intruder);
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
      {tags && (
        <group ref={tagged} position={[startX, PACKET_Y, startZ]}>
          {tag !== null && <PacketTag text={tag} />}
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

/** A packet's path drawn without movement: a line in ink, vermilion when it is blocked and dashed when it is lost, with the packet's shape halfway, its label (when it has ports) as it is in the leg where the packet stands, and, when it was answered, an Echo Reply back near its start, or the warning that came back along the path. A warning that the sender's own device generates has no packet halfway, since nothing left: it stands at the end of the path. */
export function PacketTrace({ path, message, intruder, end, tags }: PacketLook) {
  const length = pathLength(path);
  const answer = answerOf(end, message, intruder);
  return (
    <>
      <Line points={path.map(([x, z]): Vec3 => [x, PACKET_Y, z])} color={end === 'blocked' ? DANGER : INK} lineWidth={LINE.heavy} dashed={end === 'lost'} {...DASH} />
      {end !== 'self-warned' && (
        <group position={markAt(path, length / 2)}>
          <PacketGlyph message={message} intruder={intruder} />
          {tags && <PacketTag text={tagAt(tags, length / 2, false)} />}
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

const PACKET_ICON_PATH: Record<'round' | 'square' | 'hexagon', { shape: string; border: string }> = {
  round: { shape: 'M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z', border: 'M12 3.4a8.6 8.6 0 1 0 0 17.2a8.6 8.6 0 1 0 0-17.2z' },
  square: { shape: 'M7.5 7.5h9v9h-9z', border: 'M3.5 3.5h17v17h-17z' },
  hexagon: { shape: 'M6 12l3-5h6l3 5l-3 5H9z', border: 'M2.5 12l4.6-8.3h9.8l4.6 8.3l-4.6 8.3H7.1z' },
};
const PACKET_ICON_FORM: Record<PacketShape, keyof typeof PACKET_ICON_PATH> = {
  'echo-request': 'round',
  'echo-reply': 'round',
  'tcp-request': 'square',
  'tcp-reply': 'square',
  'udp-request': 'hexagon',
  'udp-reply': 'hexagon',
};
const WARNING_ICON_PATH = { triangle: 'M12 4.5l8.5 15h-17z', mark: 'M12 10v4.5M12 17.2h.01' } as const;

/** The packet's icon, the same shape as on the map: the shape of its protocol, filled for a packet that asks and hollow for one that answers, with a second border of the same shape around it for an intruder, and a triangle with an exclamation mark for a warning. */
export function PacketIcon({ message, intruder }: { message: PacketVariant; intruder: boolean }) {
  if (message === 'warning') {
    return (
      <InkIcon>
        <path d={WARNING_ICON_PATH.triangle} />
        <path d={WARNING_ICON_PATH.mark} />
      </InkIcon>
    );
  }
  const paths = PACKET_ICON_PATH[PACKET_ICON_FORM[message]];
  const asks = !PACKET_SHAPES[message].hollow;
  return (
    <InkIcon>
      <path d={paths.shape} fill={asks ? 'currentColor' : 'none'} strokeWidth={asks ? 1.6 : 2.6} />
      {intruder && <path d={paths.border} />}
    </InkIcon>
  );
}
