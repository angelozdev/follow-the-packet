import type { IdentifyCard } from '@/game';
import { useIdentifyDrafts, type IdentifyDraft } from '@/ui/incident/map-cards/identify-card';
import { useClassifyDraft, type ClassifyDraft } from '@/ui/incident/map-cards/identify/classify-card';
import { useEntryDrafts, type EntryDrafts } from '@/ui/incident/map-cards/table-card';
import { useRuleDrafts, type RuleDraft } from '@/ui/incident/map-cards/task-card';
import { useTerminalDraft, type TerminalDraft } from '@/ui/incident/map-cards/terminal/terminal-card';
import { useBrowserDraft, type BrowserDraft } from '@/ui/incident/map-cards/web/browser-card';

export interface PanelDrafts {
  terminal: TerminalDraft;
  browser: BrowserDraft;
  identify: (card: IdentifyCard) => IdentifyDraft;
  classify: ClassifyDraft;
  entries: EntryDrafts;
  rules: (firewallId: string) => RuleDraft;
}

/** Returns what the player has half done in the cards of the panel: the terminal, the browser, the questions of each device, the item picked up to classify, the trays of the tables and the slots of the rules of each firewall. They live above the tabs and above the piece, so none is lost when the player changes tab, ficha or piece. */
export function usePanelDrafts(): PanelDrafts {
  return {
    terminal: useTerminalDraft(),
    browser: useBrowserDraft(),
    identify: useIdentifyDrafts(),
    classify: useClassifyDraft(),
    entries: useEntryDrafts(),
    rules: useRuleDrafts(),
  };
}
