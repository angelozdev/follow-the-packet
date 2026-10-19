import { useLayoutEffect, type RefObject } from 'react';

interface Scrolled {
  scroller: Element;
  left: number;
  top: number;
}

function scrolledAround(element: HTMLElement): Scrolled[] {
  const found: Scrolled[] = [];
  for (let parent = element.parentElement; parent !== null; parent = parent.parentElement) found.push({ scroller: parent, left: parent.scrollLeft, top: parent.scrollTop });
  return found;
}

/** Brings the element into view, the least the player has to scroll, once it mounts and each time `key` changes, and before the browser draws it: the card of a piece low in a drawing taller than the window, or docked under it, would otherwise open out of sight. It scrolls the stage, and the page under 901 px, and never the layer of the labels, which clips and does not scroll. When the element goes, or another key takes its place, every scroller above it goes back to where it was before the element came into view, so closing a card leaves the map where the player had it. */
export function useRevealCard(card: RefObject<HTMLElement | null>, key: string): void {
  useLayoutEffect(() => {
    const element = card.current;
    if (element === null) return;
    const before = scrolledAround(element);
    element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    return () => {
      for (const { scroller, left, top } of before) {
        scroller.scrollLeft = left;
        scroller.scrollTop = top;
      }
    };
  }, [card, key]);
}
