import { useState } from 'react';
import type { Panel, PanelTab, PanelTabId } from '@/game';

const SEPARATOR = '/';

export interface PanelChoice {
  tabOf: (panel: Panel) => PanelTabId;
  chooseTab: (pieceId: string, tabId: PanelTabId) => void;
  fichaOf: (pieceId: string, tab: PanelTab) => string;
  chooseFicha: (pieceId: string, tabId: PanelTabId, partId: string) => void;
}

/** Returns the tab and the ficha the player chose on each piece, which belong to the shell and not to the tabs, so they stay when the player selects another piece and comes back, and so a link from outside (the menu of a piece, a row of the registry) can set them. A choice that the panel no longer offers (the incident ended and only «Estado» is left) gives way to the tab the panel opens on, and to the first ficha. */
export function usePanelChoice(): PanelChoice {
  const [tabs, setTabs] = useState<Record<string, PanelTabId>>({});
  const [fichas, setFichas] = useState<Record<string, string>>({});
  return {
    tabOf: (panel) => {
      const chosen = tabs[panel.pieceId];
      return panel.tabs.some(({ id }) => id === chosen) ? chosen : panel.first;
    },
    chooseTab: (pieceId, tabId) => setTabs((previous) => ({ ...previous, [pieceId]: tabId })),
    fichaOf: (pieceId, tab) => {
      const chosen = fichas[`${pieceId}${SEPARATOR}${tab.id}`];
      return tab.parts.some(({ id }) => id === chosen) ? chosen : tab.parts[0].id;
    },
    chooseFicha: (pieceId, tabId, partId) => setFichas((previous) => ({ ...previous, [`${pieceId}${SEPARATOR}${tabId}`]: partId })),
  };
}
