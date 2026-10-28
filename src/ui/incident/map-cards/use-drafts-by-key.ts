import { useState } from 'react';

export interface DraftsByKey<Draft> {
  of: (key: string, fresh: Draft) => Draft;
  change: (key: string, fresh: Draft, patch: Partial<Draft>) => void;
}

/** Keeps one draft for each key (the device of a card, the firewall of its rules), so what the player half did for one is still there when the panel shows another and comes back. A key that has no draft yet reads as `fresh`, and a change patches the draft it finds, or `fresh` when it finds none, as a functional update, so two changes in one handler do not undo each other. */
export function useDraftsByKey<Draft extends object>(): DraftsByKey<Draft> {
  const [kept, setKept] = useState<Record<string, Draft>>({});
  return {
    of: (key, fresh) => kept[key] ?? fresh,
    change: (key, fresh, patch) => setKept((previous) => ({ ...previous, [key]: { ...(previous[key] ?? fresh), ...patch } })),
  };
}
