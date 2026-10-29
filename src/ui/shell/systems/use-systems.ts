import { useState } from 'react';
import { REGISTRY_TEXT, SYSTEMS_TEXT } from '@/copy';
import { originPieces, panelOf, type PanelTabId, type Session } from '@/game';
import type { PanelChoice } from '@/ui/shell/panel/use-panel-choice';
import type { RegistryBox } from '@/ui/shell/status/use-registry-box';
import type { useSelection } from '@/ui/shell/use-selection';
import type { System } from './systems-bar';

type Selection = Pick<ReturnType<typeof useSelection>, 'pieceId' | 'showPiece'>;

const TOOLS = [
  { tab: 'terminal', label: SYSTEMS_TEXT.terminal },
  { tab: 'browser', label: SYSTEMS_TEXT.browser },
] as const satisfies readonly { tab: PanelTabId; label: string }[];

const holdsTab = (session: Session, pieceId: string, tab: PanelTabId) => panelOf(session, pieceId).tabs.some(({ id }) => id === tab);

export function useSystems(session: Session, selection: Selection, panelChoice: PanelChoice, registry: RegistryBox): System[] {
  const [lastOrigin, setLastOrigin] = useState<string | null>(null);
  const origins = Object.values(originPieces(session));
  const chosen = selection.pieceId;
  const tabInView = chosen === null ? undefined : panelChoice.tabOf(panelOf(session, chosen));
  if (chosen !== null && chosen !== lastOrigin && origins.includes(chosen) && TOOLS.some(({ tab }) => tab === tabInView)) setLastOrigin(chosen);
  const tools = TOOLS.flatMap(({ tab, label }) => {
    const holders = origins.filter((pieceId) => holdsTab(session, pieceId, tab));
    const target = lastOrigin !== null && holders.includes(lastOrigin) ? lastOrigin : holders[0];
    if (target === undefined) return [];
    const press = () => {
      if (chosen === target && tabInView === tab) return;
      panelChoice.chooseTab(target, tab);
      selection.showPiece(target);
    };
    return [{ id: tab, label, onPress: press }];
  });
  const registrySystem: System[] =
    registry.count === 0 ? [] : [{ id: 'registry', label: REGISTRY_TEXT.open(registry.count), onPress: registry.toggle, expanded: registry.open, domId: registry.buttonId, controls: registry.open ? registry.listId : undefined }];
  return [...tools, ...registrySystem];
}
