import type { PanelPart } from '@/game';
import type { CardFrame } from '@/ui/incident/map-cards/card-frame';
import { identifyFrame } from '@/ui/incident/map-cards/identify-card';
import { classifyFrame } from '@/ui/incident/map-cards/identify/classify-card';
import { servicesFrame, settingsFrame } from '@/ui/incident/map-cards/settings-card';
import { tableFrame } from '@/ui/incident/map-cards/table-card';
import { rulesFrame } from '@/ui/incident/map-cards/task-card';
import { terminalFrame } from '@/ui/incident/map-cards/terminal/terminal-card';
import { browserFrame } from '@/ui/incident/map-cards/web/browser-card';
import type { PanelHandlers } from './panel-handlers';
import type { PanelDrafts } from './use-panel-drafts';

interface FrameContext {
  handlers: PanelHandlers;
  drafts: PanelDrafts;
  onClose: () => void;
  refocus: () => void;
}

/** Returns the frame of a part of a panel: the one `switch` over the twelve kinds of card that a piece can have, which the table of contents of the shell is to replace. */
export function frameOfPart(part: PanelPart, { handlers, drafts, onClose, refocus }: FrameContext): CardFrame {
  switch (part.id) {
    case 'terminal':
      return terminalFrame(part.card, drafts.terminal, handlers.terminal);
    case 'browser':
      return browserFrame(part.card, drafts.browser, handlers.browser);
    case 'identify':
      return identifyFrame(part.card, drafts.identify(part.card), { onAnswer: (picks) => handlers.onAnswer(part.card.deviceId, picks), onClose });
    case 'classify':
      return classifyFrame(part.card, drafts.classify, { onAnswer: handlers.onAnswer }, refocus);
    case 'settings':
      return settingsFrame(part.card, (settingId, chipId) => handlers.onPick(part.card.deviceId, settingId, chipId));
    case 'services':
      return servicesFrame(part.card, (settingId, chipId) => handlers.onPick(part.card.deviceId, settingId, chipId));
    case 'routes':
    case 'translations':
    case 'records':
    case 'cache':
    case 'sites':
      return tableFrame(part.card, drafts.entries, handlers, refocus);
    case 'rules':
      return rulesFrame(part.card, part.chips, drafts.rules(part.card.firewallId), handlers.rules(part.card.firewallId), refocus);
  }
}
