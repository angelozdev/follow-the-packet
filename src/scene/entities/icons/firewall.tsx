import type { FirewallKind } from '@/engine';
import { InkIcon } from './ink-icon';

/** The firewall's icon: two posts and its bar, thin for a Security Group and of bricks for the firewall of a laptop. */
export function FirewallIcon({ variant }: { variant: FirewallKind }) {
  return (
    <InkIcon>
      <path d="M5 7v13M19 7v13" />
      {variant === 'security-group' ? (
        <rect x="5" y="10" width="14" height="2" />
      ) : (
        <>
          <rect x="5" y="9" width="14" height="7" />
          <path d="M5 12.5h14M9.5 9v3.5M14.5 9v3.5M12 12.5V16" />
        </>
      )}
    </InkIcon>
  );
}
