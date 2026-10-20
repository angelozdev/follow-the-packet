import { InkIcon } from './ink-icon';

/** The internet's icon: the globe with its equator and a meridian. */
export function InternetIcon() {
  return (
    <InkIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </InkIcon>
  );
}
