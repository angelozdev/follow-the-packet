import { createContext, useContext, useMemo } from 'react';

/**
 * Capa DOM fuera del árbol del Canvas donde drei monta los <Html>.
 * Por defecto drei los cuelga dentro del contenedor que React administra para el Canvas;
 * al salir de un nivel React y drei se pelean por ese nodo y lanzan
 * "Failed to execute 'removeChild' on 'Node'". Una capa propia evita el choque.
 */
export const HtmlLayerContext = createContext<HTMLElement | null>(null);

/** Valor para la prop `portal` de <Html>; undefined deja el comportamiento por defecto de drei. */
export function useHtmlPortal(): { current: HTMLElement } | undefined {
  const layer = useContext(HtmlLayerContext);
  return useMemo(() => (layer ? { current: layer } : undefined), [layer]);
}
