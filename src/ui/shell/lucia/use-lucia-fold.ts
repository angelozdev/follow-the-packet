import { useId, useState } from 'react';

/** Returns the fold of the zone of Lucía: whether it is folded (never at first, and never kept after the screen goes), the id of the zone the arrow controls and what the arrow does. */
export function useLuciaFold() {
  const controls = useId();
  const [folded, setFolded] = useState(false);
  return { folded, controls, onToggle: () => setFolded((current) => !current) };
}
