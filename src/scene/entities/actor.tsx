import type { Actor } from '@/engine';
import { InkBox } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL };

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={ACTOR_FILL[variant]} />;
}
