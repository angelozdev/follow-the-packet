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

const NEAREST: ScrollIntoViewOptions = { block: 'nearest', inline: 'nearest' };

/** Takes the element and the key of what it opens for; brings the element into view, the least the player has to scroll, once it mounts, each time `key` changes and each time the element or the layer that holds it changes size (the card grew with what it shows, or the drawing under a docked card grew), and before the browser draws it: the card of a piece low in a drawing taller than the window, or docked under it, would otherwise open out of sight, and one that grows or moves afterwards would leave its foot out of reach. It scrolls the stage, and the page under 901 px, and never the layer of the labels, which clips and does not scroll. When the element goes, or another key takes its place, every scroller above it goes back to where it was before the element came into view, so closing a card leaves the map where the player had it; a change of size does not record that place again. */
export function useRevealCard(card: RefObject<HTMLElement | null>, key: string): void {
  useLayoutEffect(() => {
    const element = card.current;
    if (element === null) return;
    const before = scrolledAround(element);
    element.scrollIntoView(NEAREST);
    const watcher = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => element.scrollIntoView(NEAREST));
    watcher?.observe(element);
    if (element.parentElement !== null) watcher?.observe(element.parentElement);
    return () => {
      watcher?.disconnect();
      for (const { scroller, left, top } of before) {
        scroller.scrollLeft = left;
        scroller.scrollTop = top;
      }
    };
  }, [card, key]);
}
