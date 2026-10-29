import { useId, useState } from 'react';

export const SYSTEM_WINDOW = { registry: 'registry', almanac: 'almanac' } as const;

export type SystemWindowId = (typeof SYSTEM_WINDOW)[keyof typeof SYSTEM_WINDOW];

export interface SystemWindowState<Id extends string> {
  open: Id | null;
  toggle: (id: Id) => void;
  close: () => void;
  buttonId: (id: Id) => string;
  controlsId: (id: Id) => string;
}

export function useSystemWindow<Id extends string>(available: readonly Id[]): SystemWindowState<Id> {
  const [wanted, setWanted] = useState<Id | null>(null);
  const base = useId();
  if (wanted !== null && !available.includes(wanted)) setWanted(null);
  const open = wanted !== null && available.includes(wanted) ? wanted : null;
  return {
    open,
    toggle: (id) => setWanted(open === id ? null : id),
    close: () => setWanted(null),
    buttonId: (id) => `${base}-${id}-button`,
    controlsId: (id) => `${base}-${id}-controls`,
  };
}
