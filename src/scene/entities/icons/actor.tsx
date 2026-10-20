import type { ClientActor } from '@/engine';
import { InkIcon } from './ink-icon';

const ACTOR_ICON: Record<ClientActor['kind'], { body: string; filled: boolean; detail?: string }> = {
  attacker: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: true },
  you: { body: 'M12 3l8 4.5v9L12 21l-8-4.5v-9z', filled: false, detail: 'M4 7.5l8 4.5 8-4.5M12 12v9' },
  home: { body: 'M4 11l8-7 8 7v9H4z', filled: false, detail: 'M10 20v-5h4v5' },
};

/** The actor's icon: its cube, filled for the attacker and drawn in outline for you, and a house for a home. */
export function ActorIcon({ variant }: { variant: ClientActor['kind'] }) {
  const { body, filled, detail } = ACTOR_ICON[variant];
  return (
    <InkIcon>
      <path d={body} fill={filled ? 'currentColor' : 'none'} />
      {detail && <path d={detail} />}
    </InkIcon>
  );
}
