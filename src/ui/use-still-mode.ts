import { useReducedMotion } from '@mantine/hooks';
import { useState } from 'react';

/** Returns whether the map is drawn without animations: the player's choice once made, the system's reduced-motion preference until then; and the function that records the choice. */
export function useStillMode(): [boolean, (still: boolean) => void] {
  const prefersStill = useReducedMotion(false, { getInitialValueInEffect: false });
  const [choice, setChoice] = useState<boolean | null>(null);
  return [choice ?? prefersStill, setChoice];
}
