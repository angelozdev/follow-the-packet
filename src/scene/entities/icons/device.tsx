import type { ReactNode } from 'react';
import type { EntityVariants } from '@/copy';
import { InkIcon } from './ink-icon';

/** Every kind of device the map draws: the ones of a network and the server of the internet. */
export type DeviceVariant = EntityVariants['device'];

const DEVICE_ICON: Record<DeviceVariant, ReactNode> = {
  laptop: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1" />
      <path d="M3 19l2-4h14l2 4z" />
    </>
  ),
  printer: (
    <>
      <path d="M7 10V4h10v6" />
      <rect x="3" y="10" width="18" height="7" rx="1" />
      <path d="M7 17v3h10v-3" />
    </>
  ),
  'ec2-instance': (
    <>
      <rect x="4" y="5" width="16" height="3" />
      <rect x="5" y="8" width="14" height="12" />
      <rect x="10" y="14" width="4" height="6" />
    </>
  ),
  'internet-server': (
    <>
      <rect x="7" y="6" width="10" height="15" />
      <path d="M9.5 10h5M9.5 13.5h5M9.5 17h5M12 6V2" />
    </>
  ),
};

/** The device's icon: the front of its piece. */
export function DeviceIcon({ variant }: { variant: DeviceVariant }) {
  return <InkIcon>{DEVICE_ICON[variant]}</InkIcon>;
}
