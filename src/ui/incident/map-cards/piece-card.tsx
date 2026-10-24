import { useState, type Dispatch } from 'react';
import { PIECE_TEXT } from '@/copy';
import { Tabs } from '@/design';
import { browserView, terminalLine, toolOutputs, tracerouteLines, type PieceCard as Piece, type PieceTab, type PieceTabId, type SendPicks, type Session, type SessionAction } from '@/game';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { FramedCard, type CardFrame } from './chip-card';
import { IdentifyCard, identifyFrame, useIdentifyDraft } from './identify-card';
import { ClassifyCard, classifyFrame, useClassifyDraft } from './identify/classify-card';
import { ServicesCard, SettingsCard, servicesFrame, settingsFrame } from './settings-card';
import { TableCard, tableFrame, useEntryDrafts, type TableHandlers } from './table-card';
import { TerminalCard, terminalFrame, useTerminalDraft, type TerminalDraft, type TerminalHandlers } from './terminal/terminal-card';
import { BrowserCard, browserFrame, useBrowserDraft, type BrowserDraft, type BrowserHandlers } from './web/browser-card';

type Picks = Record<string, string>;

/** What the cards of a piece ask of their screen. */
export interface PieceHandlers extends TableHandlers {
  terminal: TerminalHandlers;
  browser: BrowserHandlers;
  onAnswer: (deviceId: string, picks: Picks) => void;
  onPick: (deviceId: string, settingId: string, chipId: string) => void;
}

/** Wires what the cards of a piece ask to the session: what the terminal prints is read from it, and each move the player makes is an action of its reducer. `onPickOrigin` is how the screen moves the card to the piece of another origin. */
export function pieceHandlers(session: Session, dispatch: Dispatch<SessionAction>, onPickOrigin: (fromId: string) => void): PieceHandlers {
  const send = ({ from, to, message }: SendPicks) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message });
  return {
    terminal: {
      describe: (picks) => terminalLine(session, picks),
      route: (picks) => tracerouteLines(session, picks),
      printed: (picks) => toolOutputs(session, picks),
      onPickOrigin,
      onSend: send,
    },
    browser: { view: (picks) => browserView(session, picks), onOpen: send },
    onAnswer: (deviceId, picks) => dispatch({ type: 'answerCard', deviceId, picks }),
    onPick: (deviceId, settingId, chipId) => dispatch({ type: 'setSetting', deviceId, settingId, chipId }),
    onPlace: (tableId, picks) => dispatch({ type: 'placeEntry', tableId, picks }),
    onRemove: (tableId, entryId) => dispatch({ type: 'removeEntry', tableId, entryId }),
  };
}

interface PieceCardProps extends PieceHandlers {
  card: Piece;
  onClose: () => void;
}

type TabOf<Id extends PieceTabId> = Extract<PieceTab, { id: Id }>;

function tabOf<Id extends PieceTabId>(card: Piece, id: Id): TabOf<Id> | undefined {
  return card.tabs.find((tab): tab is TabOf<Id> => tab.id === id);
}

interface Drawn {
  handlers: PieceHandlers;
  terminal: TerminalDraft;
  browser: BrowserDraft;
  onClose: () => void;
}

function Single({ tab, handlers, terminal, browser, onClose }: Drawn & { tab: PieceTab }) {
  switch (tab.id) {
    case 'terminal':
      return <TerminalCard card={tab.card} draft={terminal} {...handlers.terminal} onClose={onClose} />;
    case 'browser':
      return <BrowserCard card={tab.card} draft={browser} {...handlers.browser} onClose={onClose} />;
    case 'identify':
      return <IdentifyCard key={tab.card.deviceId} card={tab.card} onAnswer={(picks) => handlers.onAnswer(tab.card.deviceId, picks)} onClose={onClose} />;
    case 'classify':
      return <ClassifyCard key={tab.card.deviceId} card={tab.card} onAnswer={handlers.onAnswer} onClose={onClose} />;
    case 'settings':
      return <SettingsCard key={tab.card.deviceId} card={tab.card} onPick={(settingId, chipId) => handlers.onPick(tab.card.deviceId, settingId, chipId)} onClose={onClose} />;
    case 'services':
      return <ServicesCard key={tab.card.deviceId} card={tab.card} onPick={(settingId, chipId) => handlers.onPick(tab.card.deviceId, settingId, chipId)} onClose={onClose} />;
    case 'routes':
    case 'translations':
    case 'records':
    case 'cache':
    case 'sites':
      return <TableCard key={tab.card.ownerId} card={tab.card} onPlace={handlers.onPlace} onRemove={handlers.onRemove} onClose={onClose} />;
  }
}

function Tabbed({ card, handlers, terminal, browser, onClose }: Drawn & { card: Piece }) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const [chosen, choose] = useState<{ pieceId: string; tab: PieceTabId } | null>(null);
  const identify = useIdentifyDraft(tabOf(card, 'identify')?.card ?? null);
  const classify = useClassifyDraft();
  const entries = useEntryDrafts();
  const refocus = () => heading.current?.focus();
  const frameOf = (tab: PieceTab): CardFrame => {
    switch (tab.id) {
      case 'terminal':
        return terminalFrame(tab.card, terminal, handlers.terminal);
      case 'browser':
        return browserFrame(tab.card, browser, handlers.browser);
      case 'identify':
        return identifyFrame(tab.card, identify, { onAnswer: (picks) => handlers.onAnswer(tab.card.deviceId, picks), onClose });
      case 'classify':
        return classifyFrame(tab.card, classify, { onAnswer: handlers.onAnswer }, refocus);
      case 'settings':
        return settingsFrame(tab.card, (settingId, chipId) => handlers.onPick(tab.card.deviceId, settingId, chipId));
      case 'services':
        return servicesFrame(tab.card, (settingId, chipId) => handlers.onPick(tab.card.deviceId, settingId, chipId));
      case 'routes':
      case 'translations':
      case 'records':
      case 'cache':
      case 'sites':
        return tableFrame(tab.card, entries, handlers, refocus);
    }
  };
  const frames = card.tabs.map((tab) => ({ tab, frame: frameOf(tab) }));
  const selected = chosen?.pieceId === card.pieceId && card.tabs.some((tab) => tab.id === chosen.tab) ? chosen.tab : card.first;
  const shown = frames.find(({ tab }) => tab.id === selected) ?? frames[0];
  return (
    <FramedCard frame={shown.frame} heading={heading} onClose={onClose}>
      <Tabs
        name={PIECE_TEXT.tabsName}
        selected={selected}
        onSelect={(tabId) => {
          const tab = card.tabs.find((candidate) => candidate.id === tabId);
          if (tab) choose({ pieceId: card.pieceId, tab: tab.id });
        }}
        tabs={frames.map(({ tab, frame }) => ({ id: tab.id, label: <TaggedText text={tab.label} />, panel: frame.body }))}
      />
    </FramedCard>
  );
}

/** The card a piece opens from its one button. A piece with a single card opens that card as it always did; a piece with several opens one card with a tab for each, and the title, the icon and the foot ("Enviar", "Agregar", "Listo") are those of the tab chosen. It opens on the tab the model says. Radix mounts only the panel of the tab chosen, so what the player has half done (the chips of the terminal, the address of the browser, the trays of an entry, what was unfolded in the output, the item picked up to classify) lives here, above the tabs, and switching tabs loses none of it. Moving to the card of another piece (the terminal does when the player picks another origin) keeps the draft of the terminal, whether the new piece shows it alone or in tabs, and goes back to the first tab of the new piece. */
export function PieceCard({ card, onClose, ...handlers }: PieceCardProps) {
  const terminal = useTerminalDraft(tabOf(card, 'terminal')?.card ?? null);
  const browser = useBrowserDraft();
  return card.tabbed ? (
    <Tabbed card={card} handlers={handlers} terminal={terminal} browser={browser} onClose={onClose} />
  ) : (
    <Single tab={card.tabs[0]} handlers={handlers} terminal={terminal} browser={browser} onClose={onClose} />
  );
}
