import { createContext, useContext, useMemo } from 'react';

export const HtmlLayerContext = createContext<HTMLElement | null>(null);

/** Returns the value for the portal prop of drei <Html>, or undefined to keep drei's default. */
export function useHtmlPortal(): { current: HTMLElement } | undefined {
  const layer = useContext(HtmlLayerContext);
  return useMemo(() => (layer ? { current: layer } : undefined), [layer]);
}

/** The CSS selector of what the map floats over itself and the player reads: the label of a piece, the stamp of a packet and the name of a floor. The cards and the tags of the packets are not in it. */
export const MAP_MARKS = '.map-button, button.stamp, .html-layer .caption:not(.caption--soft)';
