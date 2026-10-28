import type { ReactNode } from 'react';
import type { TermText } from '@/copy';
import type { TrayChip } from '@/design';
import { TaggedText } from '@/ui/tagged-text';

/** Returns a card's chips as the chips of a tray, each label with its terms tagged. A chip is a control, not prose, so an IP in its label keeps the face of the chip. */
export function trayChips(chips: { id: string; label: TermText }[]): TrayChip[] {
  return chips.map(({ id, label }) => ({ id, label: <TaggedText text={label} ips={false} /> }));
}

/** What a card puts in the panel of its piece: what it shows, the actions of its foot and, when it has its own way out, what "Listo" does. The panel draws the body in the tab or ficha the card belongs to and the foot of the one that is chosen. */
export interface CardFrame {
  body: ReactNode;
  actions?: ReactNode;
  onDone?: () => void;
}
