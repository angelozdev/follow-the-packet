import type { ReactNode } from 'react';

/** A 24×24 ink icon in the text's colour (`currentColor`), hidden from screen readers: the text beside it names what it shows. */
export function InkIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="entity-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
