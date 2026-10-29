import { useId, useState } from 'react';
import type { RegistryLine } from '@/game';

export interface RegistryBox {
  count: number;
  open: boolean;
  toggle: () => void;
  buttonId: string;
  listId: string;
}

/** Takes the lines of the registry and returns the state of its box: how many lines there are, whether the box is open, what opens and closes it and the ids that tie the button to the list. A box that was open when the lines ran out stays closed when a line comes back, and with no line it is never open. */
export function useRegistryBox(lines: RegistryLine[]): RegistryBox {
  const [wanted, setWanted] = useState(false);
  const buttonId = useId();
  const listId = useId();
  const count = lines.length;
  if (count === 0 && wanted) setWanted(false);
  return { count, open: wanted && count > 0, toggle: () => setWanted(!wanted), buttonId, listId };
}
