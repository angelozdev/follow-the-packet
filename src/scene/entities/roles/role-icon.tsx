import type { ReactNode } from 'react';
import type { Role } from '@/copy';
import { InkIcon } from '@/scene/entities/icons/ink-icon';

const PICTOGRAMS: Record<Role, ReactNode> = {
  resolver: (
    <>
      <circle cx="11.1" cy="12.55" r="2.6" />
      <path d="M13 14.45l2.5 2.6" />
    </>
  ),
  authoritative: (
    <>
      <circle className="map-piece__ink" cx="12" cy="13.5" r="3.6" />
      <path className="map-piece__paper" d="M10.2 13.6l1.4 1.5 2.4-3" />
    </>
  ),
  web: <path d="M10.6 10.2l-2.6 3.3 2.6 3.3M13.4 10.2l2.6 3.3-2.6 3.3M12.6 9.8l-1.2 7.4" />,
  proxy: <path d="M8.8 10.75h6.4M13 8.75l2.2 2-2.2 2M15.2 16.25H8.8M11 14.25l-2.2 2 2.2 2" />,
  app: <path className="map-piece__ink" d="M9.3 9.8v7.4l5.4-3.7z" />,
};

/** Takes the role of a server of the internet; returns its tower as the catalog draws it, with the same face and the same antenna, but with the pictogram of the role in the place of the three bays and the face tinted with the colour of the role (`.role-face`, in `src/styles.css`). The pictogram is in ink and each role has a shape of its own, so the colour is only a second cue. */
export function RoleIcon({ role }: { role: Role }) {
  return (
    <InkIcon>
      <rect className="role-face" data-role={role} x="7" y="6" width="10" height="15" />
      <path d="M12 6V2" />
      <g className="role-mark" data-role={role}>
        {PICTOGRAMS[role]}
      </g>
    </InkIcon>
  );
}
