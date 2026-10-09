import type { Actor } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, PAPER_FILL } from '@/scene/theme';

const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL };

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return <InkBox size={[0.5, 0.5, 0.5]} position={[x, 0.25, z]} fill={ACTOR_FILL[variant]} />;
}

/** The actor's icon: its cube, filled for the attacker and drawn in outline for you. */
export function ActorIcon({ variant }: { variant: Actor['kind'] }) {
  return (
    <InkIcon>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" fill={variant === 'attacker' ? 'currentColor' : 'none'} />
      {variant === 'you' && <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />}
    </InkIcon>
  );
}
