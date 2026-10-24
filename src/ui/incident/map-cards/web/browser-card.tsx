import { useState } from 'react';
import { BROWSER_TEXT } from '@/copy';
import { Button, ChipTray } from '@/design';
import type { BrowserCard as Browser, BrowserView, SendPicks } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { TaggedText } from '@/ui/tagged-text';
import { FramedCard, trayChips, type CardFrame } from '@/ui/incident/map-cards/chip-card';

/** What the browser asks of its screen: what it shows for the address picked, and opening that address. */
export interface BrowserHandlers {
  view: (picks: Partial<SendPicks>) => BrowserView | null;
  onOpen: (picks: SendPicks) => void;
}

/** The address the player has picked in the browser of a device. It lives above the card, so a card that shows the browser as one tab among others keeps it when the player switches tabs. */
export interface BrowserDraft {
  address: string | null;
  setAddress: (address: string) => void;
}

export function useBrowserDraft(): BrowserDraft {
  const [address, setAddress] = useState<string | null>(null);
  return { address, setAddress };
}

function Seen({ view }: { view: BrowserView }) {
  return (
    <div role="group" aria-label={BROWSER_TEXT.sees} className="browser">
      <span className="caption caption--soft" aria-hidden="true">
        {BROWSER_TEXT.sees}
      </span>
      <code className="browser__address">{view.address}</code>
      {view.shows.kind === 'page' ? (
        view.shows.lines.map((line, index) => (
          <p key={index} className="browser__page">
            {line}
          </p>
        ))
      ) : (
        <p className="browser__error">
          <TaggedText text={view.shows.text} />
        </p>
      )}
    </div>
  );
}

/** Returns what the tab of the browser of a device puts in its card: a tray with the address of each url, «Abrir» and, once the address picked was opened since the world last changed, what the browser shows for it, as text of the card: the page the server sent or the error in plain words. The draft is the caller's. */
export function browserFrame(card: Browser, draft: BrowserDraft, { view, onOpen }: BrowserHandlers): CardFrame {
  const picks: Partial<SendPicks> = { from: card.fromId, ...(draft.address !== null && { to: draft.address }), message: card.messageId };
  const seen = view(picks);
  const open = () => {
    if (draft.address !== null) onOpen({ from: card.fromId, to: draft.address, message: card.messageId });
  };
  return {
    title: card.title,
    icon: <CardIcon kind="terminal" />,
    actions: (
      <Button variant="primary" disabled={draft.address === null} onClick={open}>
        {BROWSER_TEXT.open}
      </Button>
    ),
    body: (
      <>
        <ChipTray name={BROWSER_TEXT.address} chips={trayChips(card.addresses)} picked={draft.address} onPick={draft.setAddress} />
        <div aria-live="polite">{seen && <Seen view={seen} />}</div>
      </>
    ),
  };
}

interface BrowserCardProps extends BrowserHandlers {
  card: Browser;
  draft?: BrowserDraft;
  onClose: () => void;
}

/** The browser of a device as a card of its own, for a piece whose only card it is. It keeps its own draft unless the caller gives one. */
export function BrowserCard({ card, draft, onClose, ...handlers }: BrowserCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const own = useBrowserDraft();
  return <FramedCard frame={browserFrame(card, draft ?? own, handlers)} heading={heading} onClose={onClose} />;
}
