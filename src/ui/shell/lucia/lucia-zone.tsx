import type { ReactNode } from 'react';

interface LuciaZoneProps {
  id: string;
  inert: boolean;
  children: ReactNode;
}

export function LuciaZone({ id, inert, children }: LuciaZoneProps) {
  return (
    <div id={id} className="incident__lucia" inert={inert}>
      {children}
    </div>
  );
}
