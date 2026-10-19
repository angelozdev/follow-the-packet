import { useLayoutEffect, type RefObject } from 'react';

/** Brings the element into view, the least the player has to scroll, once it mounts and each time `key` changes, and before the browser draws it: the card of a piece low in a drawing taller than the window, or docked under it, would otherwise open out of sight. It scrolls the stage, and the page under 901 px, and never the layer of the labels, which clips and does not scroll. */
export function useRevealCard(card: RefObject<HTMLElement | null>, key: string): void {
  useLayoutEffect(() => {
    card.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [card, key]);
}
