import type { Actor } from '@/engine';
import { InkBox, InkIcon } from '@/scene/ink';
import type { Vec2 } from '@/scene/layout';
import { INK, LINE, PAPER_FILL, PAPER_SHADE } from '@/scene/theme';

const CUBE = 0.5;
const ACTOR_FILL: Record<Actor['kind'], string> = { attacker: INK, you: PAPER_FILL, home: PAPER_FILL };
const ROOF_PITCH = 0.6;
const ROOF_SIDES = [-1, 1] as const;

function Roof({ x, z }: { x: number; z: number }) {
  return (
    <>
      {ROOF_SIDES.map((side) => (
        <group key={side} position={[x + side * 0.14, 0.6, z]} rotation-z={-side * ROOF_PITCH}>
          <InkBox size={[0.36, 0.05, 0.62]} position={[0, 0, 0]} fill={PAPER_SHADE} lineWidth={LINE.thin} />
        </group>
      ))}
    </>
  );
}

/** Someone on the internet, outside the network: an ink cube for the attacker, a paper cube for you, and a paper cube under a roof for a home. */
export function ActorPiece({ position, variant }: { position: Vec2; variant: Actor['kind'] }) {
  const [x, z] = position;
  return (
    <>
      <InkBox size={[CUBE, CUBE, CUBE]} position={[x, CUBE / 2, z]} fill={ACTOR_FILL[variant]} />
      {variant === 'home' && <Roof x={x} z={z} />}
    </>
  );
}

const ACTOR_ICON: Record<Actor['kind'], { body: string; filled: boolean; detail?: string }> = {
  attacker: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: true },
  you: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: false, detail: 'M4 7.5l8 4.5 8-4.5M12 12v9' },
  home: { body: 'M4 11l8-7 8 7v9H4z', filled: false, detail: 'M10 20v-5h4v5' },
};

/** The actor's icon: its cube, filled for the attacker and drawn in outline for you, and a house for a home. */
export function ActorIcon({ variant }: { variant: Actor['kind'] }) {
  const { body, filled, detail } = ACTOR_ICON[variant];
  return (
    <InkIcon>
      <path d={body} fill={filled ? 'currentColor' : 'none'} />
      {detail && <path d={detail} />}
    </InkIcon>
  );
}
