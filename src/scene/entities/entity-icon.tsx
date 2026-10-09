import type { EntityRef } from '@/copy';
import { ActorIcon } from './actor';
import { DeviceIcon } from './device';
import { EdgeIcon } from './edge';
import { FirewallIcon } from './firewall';
import { InternetIcon } from './internet';
import { NetworkIcon } from './network';
import { PacketIcon } from './packet';

/** Draws the icon of any entity in any variant. */
export function EntityIcon({ entity }: { entity: EntityRef }) {
  switch (entity.kind) {
    case 'network':
      return <NetworkIcon variant={entity.variant} />;
    case 'device':
      return <DeviceIcon variant={entity.variant} />;
    case 'firewall':
      return <FirewallIcon variant={entity.variant} />;
    case 'edge':
      return <EdgeIcon variant={entity.variant} />;
    case 'internet':
      return <InternetIcon />;
    case 'actor':
      return <ActorIcon variant={entity.variant} />;
    case 'packet':
      return <PacketIcon message={entity.variant} intruder={entity.intruder ?? false} />;
  }
}
