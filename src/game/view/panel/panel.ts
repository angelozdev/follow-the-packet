import { PIECE_TEXT, type TermText } from '@/copy';
import { ruleChipsOf } from '@/levels';
import { canConfigure, type Session } from '@/game/session';
import { firewallCard, type FirewallCard } from '@/game/view/cards/firewall-card';
import { pieceCard, type PieceTab } from '@/game/view/cards/piece-card';

export const PANEL_TABS = ['status', 'settings', 'tables', 'terminal', 'browser', 'questions'] as const;

export type PanelTabId = (typeof PANEL_TABS)[number];

export interface RulesPart {
  id: 'rules';
  label: TermText;
  card: FirewallCard;
  chips: NonNullable<ReturnType<typeof ruleChipsOf>>;
}

export type PanelPart = PieceTab | RulesPart;

/** How a tab holds its parts: a tab of `one` part is that part, `sections` are drawn one under the other and `fichas` are drawn one at a time. */
type Holds = 'one' | 'sections' | 'fichas';

export interface PanelTab {
  id: PanelTabId;
  label: TermText;
  holds: Holds;
  parts: PanelPart[];
}

export interface Panel {
  pieceId: string;
  tabs: PanelTab[];
  first: PanelTabId;
  roles?: TermText;
}

export const TAB_OF_PART: Record<PanelPart['id'], PanelTabId> = {
  settings: 'settings',
  services: 'settings',
  routes: 'tables',
  translations: 'tables',
  records: 'tables',
  cache: 'tables',
  sites: 'tables',
  rules: 'tables',
  terminal: 'terminal',
  browser: 'browser',
  identify: 'questions',
  classify: 'questions',
};

const HOLDS: Record<PanelTabId, Holds> = { status: 'one', settings: 'sections', tables: 'fichas', terminal: 'one', browser: 'one', questions: 'fichas' };

function rulesParts(session: Session, pieceId: string): RulesPart[] {
  const card = firewallCard(session, pieceId);
  const chips = card && ruleChipsOf(session.incident, card.firewallId);
  return card && chips && canConfigure(session, card.firewallId) ? [{ id: 'rules', label: card.title, card, chips }] : [];
}

/** Takes the session and the id of a piece and returns its panel: the tabs in the fixed order (`PANEL_TABS`), only the ones the piece has, and the tab it opens on. «Estado» is always there. Every card the piece opens today (`pieceCard`, and the rules of a firewall that the player can set) is a part of the tab its kind belongs to (`TAB_OF_PART`): the network settings and the services are the sections of «Ajustes», the tables, the rules of a firewall and the questions are the fichas of their tabs, and the terminal and the browser each fill their own. It opens on the tab the card of the piece opened first and on «Estado» when the piece has no card. A locked piece, and every piece once the incident is no longer playing, has only «Estado». The card of a server of the internet carries `roles`, the line that says its roles in words. The table of routes marks the row of the send numbered `markedSend` when one is given, and the one the last packet used when not. Pure, from the session. */
export function panelOf(session: Session, pieceId: string, markedSend?: number): Panel {
  const playing = session.phase === 'playing';
  const card = playing ? pieceCard(session, pieceId, markedSend) : null;
  const parts: PanelPart[] = playing ? [...(card?.tabs ?? []), ...rulesParts(session, pieceId)] : [];
  const tabs = PANEL_TABS.flatMap((id) => {
    const own = parts.filter((part) => TAB_OF_PART[part.id] === id);
    return id === 'status' || own.length > 0 ? [{ id, label: PIECE_TEXT.tabs[id], holds: HOLDS[id], parts: own }] : [];
  });
  return { pieceId, tabs, first: parts.length === 0 ? 'status' : TAB_OF_PART[card?.first ?? 'rules'], ...(card?.roles && { roles: card.roles }) };
}
