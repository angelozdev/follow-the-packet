import { useState } from 'react';
import { REGISTRY_TEXT, SYSTEMS_BAR_TEXT, SYSTEMS_TEXT } from '@/copy';
import { inspect, originPieces, panelOf, type PanelTabId, type Session } from '@/game';
import type { PanelChoice } from '@/ui/shell/panel/use-panel-choice';
import type { useSelection } from '@/ui/shell/use-selection';
import { SYSTEM_WINDOW, type SystemWindowId, type SystemWindowState } from '@/ui/shell/windows/use-system-window';
import type { System } from './systems-bar';

type Selection = Pick<ReturnType<typeof useSelection>, 'pieceId' | 'showPiece'>;

interface Tool {
  tab: PanelTabId;
  label: string;
}

const TOOLS: readonly Tool[] = [
  { tab: 'terminal', label: SYSTEMS_TEXT.terminal },
  { tab: 'browser', label: SYSTEMS_TEXT.browser },
];

const holdsTab = (session: Session, pieceId: string, tab: PanelTabId) => panelOf(session, pieceId).tabs.some(({ id }) => id === tab);

export function useSystems(session: Session, selection: Selection, panelChoice: PanelChoice, windows: SystemWindowState<SystemWindowId>, registryCount: number): System[] {
  const [lastOrigin, setLastOrigin] = useState<string | null>(null);
  const origins = Object.values(originPieces(session));
  const chosen = selection.pieceId;
  const tabInView = chosen === null ? undefined : panelChoice.tabOf(panelOf(session, chosen));
  if (chosen !== null && chosen !== lastOrigin && origins.includes(chosen) && TOOLS.some(({ tab }) => tab === tabInView)) setLastOrigin(chosen);
  const tools = TOOLS.flatMap(({ tab, label }) => {
    const holders = origins.filter((pieceId) => holdsTab(session, pieceId, tab));
    const target = lastOrigin !== null && holders.includes(lastOrigin) ? lastOrigin : holders[0];
    if (target === undefined) return [];
    const origin = holders.length > 1 ? inspect(session, target)?.title : undefined;
    const press = () => {
      windows.close();
      if (chosen === target && tabInView === tab) return;
      panelChoice.chooseTab(target, tab);
      selection.showPiece(target);
    };
    return [{ id: tab, label: origin === undefined ? label : SYSTEMS_BAR_TEXT.named(label, origin), onPress: press }];
  });
  const registryOpen = windows.open === SYSTEM_WINDOW.registry;
  const registry: System[] =
    registryCount === 0
      ? []
      : [
          {
            id: SYSTEM_WINDOW.registry,
            label: REGISTRY_TEXT.open(registryCount),
            onPress: () => windows.toggle(SYSTEM_WINDOW.registry),
            expanded: registryOpen,
            domId: windows.buttonId(SYSTEM_WINDOW.registry),
            controls: registryOpen ? windows.controlsId(SYSTEM_WINDOW.registry) : undefined,
          },
        ];
  return [...tools, ...registry];
}
