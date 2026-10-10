import type { Network } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import { LINE, PAPER_SHADE } from '@/scene/theme';

const WALL_HEIGHT = 0.5;
const WALL_DEPTH = 0.12;

/** The network's slab, the floor its devices stand on: an office adds a low wall along its back edge. */
export function NetworkPiece({ variant, width, depth }: { variant: Network['kind']; width: number; depth: number }) {
  return (
    <group>
      <InkBox size={[width, 0.2, depth]} position={[0, -0.1, 0]} lineWidth={LINE.bold} />
      {variant === 'office' && <InkBox size={[width, WALL_HEIGHT, WALL_DEPTH]} position={[0, WALL_HEIGHT / 2, (WALL_DEPTH - depth) / 2]} fill={PAPER_SHADE} />}
    </group>
  );
}

/** The network's icon: its slab, with the office's wall behind it. */
export function NetworkIcon({ variant }: { variant: Network['kind'] }) {
  return (
    <InkIcon>
      <rect x="2" y="15" width="20" height="4" rx="0.5" />
      {variant === 'office' && <path d="M3 15V9h18v6" />}
    </InkIcon>
  );
}
