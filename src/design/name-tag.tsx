import type { ReactNode } from 'react';

/** A resource's or an actor's own name, drawn apart from the entity it names: monospace in a shaded box, like the value of the Name tag in AWS. */
export function NameTag({ children }: { children: ReactNode }) {
  return <span className="name-tag">{children}</span>;
}
