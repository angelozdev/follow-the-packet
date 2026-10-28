import { useState } from 'react';
import { BROWSER_TEXT, TABLE_TEXT } from '@/copy';
import { Button, ChipTray, Table } from '@/design';
import type { BrowserCard as Browser, BrowserView, RememberedCookie, SendPicks } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';
import { trayChips, type CardFrame } from '@/ui/incident/map-cards/card-frame';

/** What the browser asks of its screen: what it shows for the address picked, opening that address and signing in as a user (a send, like opening). */
export interface BrowserHandlers {
  view: (picks: Partial<SendPicks>) => BrowserView | null;
  onOpen: (picks: SendPicks) => void;
  onSignIn: (picks: SendPicks) => void;
}

/** The address and the user the player has picked in the browser of a device (the user is the id of the message that signs in as that user). They live above the tabs of the panel, so the panel keeps them when the player switches tabs and pieces. */
export interface BrowserDraft {
  address: string | null;
  setAddress: (address: string) => void;
  user: string | null;
  setUser: (user: string) => void;
}

export function useBrowserDraft(): BrowserDraft {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  return { address, setAddress, user, setUser };
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

function Remembered({ cookies }: { cookies: RememberedCookie[] }) {
  const { title, caption, rows, columns, empty } = BROWSER_TEXT.memory;
  return (
    <div role="group" aria-label={title} className="remembers">
      <span className="caption caption--soft" aria-hidden="true">
        {title}
      </span>
      <p className="muted">
        <TaggedText text={rows} />
      </p>
      <Table
        caption={caption}
        columns={Object.entries(columns).map(([id, label]) => ({ id, label }))}
        rows={cookies.map(({ id, site, name, value }) => ({ id, cells: [site, name, value].map((cell, index) => <code key={index}>{cell}</code>) }))}
        emptyText={empty}
        inUseText={TABLE_TEXT.inUse}
        removeText={TABLE_TEXT.remove}
      />
    </div>
  );
}

/** Returns what the tab of the browser of a device puts in its card: a tray with the address of each url, «Abrir», the tray of the users it can sign in as and «Iniciar sesión» when the incident offers a sign-in, once the address picked was opened or signed in to since the world last changed what the browser shows for it, as text of the card (the page the server sent or the error in plain words), and, once the player knows the term, a table of the cookies the browser holds. The draft is the caller's. */
export function browserFrame(card: Browser, draft: BrowserDraft, { view, onOpen, onSignIn }: BrowserHandlers): CardFrame {
  const picks: Partial<SendPicks> = { from: card.fromId, ...(draft.address !== null && { to: draft.address }), message: card.messageId };
  const seen = view(picks);
  const open = () => {
    if (draft.address !== null) onOpen({ from: card.fromId, to: draft.address, message: card.messageId });
  };
  const signIn = () => {
    if (draft.address !== null && draft.user !== null) onSignIn({ from: card.fromId, to: draft.address, message: draft.user });
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
        {card.users.length > 0 && (
          <>
            <ChipTray name={BROWSER_TEXT.user} chips={trayChips(card.users.map(({ messageId, label }) => ({ id: messageId, label })))} picked={draft.user} onPick={draft.setUser} />
            <Button variant="small" disabled={draft.address === null || draft.user === null} onClick={signIn}>
              {BROWSER_TEXT.signIn}
            </Button>
          </>
        )}
        <div aria-live="polite">{seen && <Seen view={seen} />}</div>
        {card.remembered && <Remembered cookies={card.remembered} />}
      </>
    ),
  };
}
