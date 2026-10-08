import { createContext, useContext, useMemo } from 'react';

export const HtmlLayerContext = createContext<HTMLElement | null>(null);

/** Returns the value for the portal prop of drei <Html>, or undefined to keep drei's default. */
export function useHtmlPortal(): { current: HTMLElement } | undefined {
  const layer = useContext(HtmlLayerContext);
  return useMemo(() => (layer ? { current: layer } : undefined), [layer]);
}
