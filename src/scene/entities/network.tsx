import { Line } from '@react-three/drei';
import type { EntityVariants } from '@/copy';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2, Vec3 } from '@/scene/layout';
import { INK, LINE, PAPER_SHADE } from '@/scene/theme';
import { MapTag } from './packet';

const WALL_HEIGHT = 0.5;
const WALL_DEPTH = 0.12;
const OUTLINE_Y = 0.03;
const OUTLINE_DASH = { dashSize: 0.28, gapSize: 0.2 } as const;

/** Every look a network has: the slab of an office or of a VPC, and the outline of a block, which is drawn only with its border. */
export type NetworkVariant = EntityVariants['network'];

function outlinePoints(x: number, z: number, width: number, depth: number): Vec3[] {
  const [left, right, back, front] = [x - width / 2, x + width / 2, z - depth / 2, z + depth / 2];
  return [[left, OUTLINE_Y, back], [right, OUTLINE_Y, back], [right, OUTLINE_Y, front], [left, OUTLINE_Y, front], [left, OUTLINE_Y, back]];
}

/** The name of an outline: the block in CIDR notation, drawn as a map label at a point of the ground. */
export interface OutlineName {
  text: string;
  at: Vec2;
}

/** The network's slab, the floor its devices stand on, centered on the origin or, for one floor of an office, on `x`: an office adds a low wall along its back edge. The `block` variant is the same slab drawn as a dashed outline on the ground, with no fill, around the pieces the player placed inside a block of IPs; it is centered on `x` and `z` and wears its `name` (the block, such as 192.168.1.0/24) as a map label when it has one. */
export function NetworkPiece({ variant, width, depth, x = 0, z = 0, name }: { variant: NetworkVariant; width: number; depth: number; x?: number; z?: number; name?: OutlineName }) {
  if (variant === 'block') {
    return (
      <group>
        <Line points={outlinePoints(x, z, width, depth)} color={INK} lineWidth={LINE.regular} dashed {...OUTLINE_DASH} />
        {name && <MapTag text={name.text} apart={name.at} beside />}
      </group>
    );
  }
  return (
    <group>
      <InkBox size={[width, 0.2, depth]} position={[x, -0.1, 0]} lineWidth={LINE.bold} />
      {variant === 'office' && <InkBox size={[width, WALL_HEIGHT, WALL_DEPTH]} position={[x, WALL_HEIGHT / 2, (WALL_DEPTH - depth) / 2]} fill={PAPER_SHADE} />}
    </group>
  );
}

/** The network's icon: its slab, with the office's wall behind it, or, for the block, a dashed outline. */
export function NetworkIcon({ variant }: { variant: NetworkVariant }) {
  if (variant === 'block') {
    return (
      <InkIcon>
        <rect x="3" y="7" width="18" height="10" rx="0.5" strokeDasharray="3 2.4" />
      </InkIcon>
    );
  }
  return (
    <InkIcon>
      <rect x="2" y="15" width="20" height="4" rx="0.5" />
      {variant === 'office' && <path d="M3 15V9h18v6" />}
    </InkIcon>
  );
}
