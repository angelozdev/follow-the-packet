import type { Network } from '@/engine';
import { InkIcon } from './ink-icon';

/** The edge's icon: the arch, with the router's two antennas. */
export function EdgeIcon({ variant }: { variant: Network['edge'] }) {
  return (
    <InkIcon>
      <rect x="4" y="7" width="16" height="3" />
      <path d="M6 10v10M18 10v10" />
      {variant === 'router' && <path d="M9 7V3M15 7V3" />}
    </InkIcon>
  );
}
