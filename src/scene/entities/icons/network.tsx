import type { EntityVariants } from '@/copy';
import { InkIcon } from './ink-icon';

/** Every look a network has: the slab of an office or of a VPC, and the outline of a block, which is drawn only with its border. */
export type NetworkVariant = EntityVariants['network'];

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
