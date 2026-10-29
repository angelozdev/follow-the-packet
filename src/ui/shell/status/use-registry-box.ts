import { useId, useState } from 'react';
import type { RegistryLine } from '@/game';

export interface RegistryBox {
  count: number;
  open: boolean;
  toggle: () => void;
  buttonId: string;
  listId: string;
}

export function useRegistryBox(lines: RegistryLine[]): RegistryBox {
  const [wanted, setWanted] = useState(false);
  const buttonId = useId();
  const listId = useId();
  const count = lines.length;
  if (count === 0 && wanted) setWanted(false);
  return { count, open: wanted && count > 0, toggle: () => setWanted(!wanted), buttonId, listId };
}
