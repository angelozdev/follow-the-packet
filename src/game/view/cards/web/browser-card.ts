import { BROWSER_TEXT, endpointName, type TermText } from '@/copy';
import { browserAfter } from '@/engine';
import { urlOfChip } from '@/levels';
import type { SentPacket } from '@/game/flow-runs';
import { sendingOf, type Session } from '@/game/session';
import { replayOf } from '@/game/view/cards/table-card';
import { originPieces, type SendPicks } from '@/game/view/cards/terminal/terminal-card';

interface BrowserAddress {
  id: string;
  label: TermText;
}

/** A user the browser can sign in as: the message that signs in and the name the player reads. */
export interface BrowserUser {
  messageId: string;
  label: TermText;
}

/** A cookie the browser holds, as a row of the table of what it remembers: the site it came from, its name and its value. */
export interface RememberedCookie {
  id: string;
  site: string;
  name: string;
  value: string;
}

/** What the tab of the browser of an origin offers: its title, the origin and the message to open an address with (the browser is a program of the device, so its requests leave from it), the addresses it can open, each named by its url, the users it can sign in as (none when the incident offers no sign-in) and what it remembers: the cookies its device holds since the world last changed, or null while the player does not know the term `cookie`. */
export interface BrowserCard {
  pieceId: string;
  fromId: string;
  messageId: string;
  title: TermText;
  addresses: BrowserAddress[];
  users: BrowserUser[];
  remembered: RememberedCookie[] | null;
}

/** What the browser shows for an address it opened: the page the server sent, line by line, or the error in plain words. The words are the game's: they imitate no real browser. */
export type BrowserShows = { kind: 'page'; lines: string[] } | { kind: 'error'; text: TermText };

export interface BrowserView {
  address: TermText;
  shows: BrowserShows;
}

/** Returns the tab of the browser of an origin piece, or null when the piece is no origin or the incident offers no browser message that opens an address. The browser is not a piece of the map: it is a card of the device it runs on. The users are the browser messages that sign in, in the order the incident offers them; the cookies are read from the engine, which replays the sends since the world last changed (`browserAfter`). */
export function browserCard(session: Session, pieceId: string): BrowserCard | null {
  const offers = sendingOf(session);
  const fromId = Object.entries(originPieces(session)).find(([, piece]) => piece === pieceId)?.[0];
  const origin = offers?.send.from.find((chip) => chip.id === fromId);
  const messages = offers?.send.message.filter((chip) => chip.command === 'browser') ?? [];
  const opening = messages.find((chip) => chip.signIn === undefined);
  if (!offers || !origin || !opening) return null;
  return {
    pieceId,
    fromId: origin.id,
    messageId: opening.id,
    title: BROWSER_TEXT.title(endpointName(origin.endpoint, session.world)),
    addresses: offers.send.to.flatMap((chip) => {
      const url = urlOfChip(chip);
      return url === undefined ? [] : [{ id: chip.id, label: url }];
    }),
    users: messages.flatMap((chip) => (chip.signIn === undefined ? [] : [{ messageId: chip.id, label: chip.label }])),
    remembered: session.known.has('cookie') ? browserAfter(session.world, replayOf(session.history), origin.endpoint.id).map(({ site, name, value }) => ({ id: `${site}|${name}`, site, name, value })) : null,
  };
}

function errorOf({ trace }: SentPacket): TermText {
  switch (trace.outcome) {
    case 'refused':
      return BROWSER_TEXT.refused;
    case 'arrived-no-reply':
      return BROWSER_TEXT.noPage;
    default:
      return BROWSER_TEXT.noConnection;
  }
}

function showsOf(run: SentPacket): BrowserShows {
  const response = run.trace.app?.response;
  return run.trace.outcome === 'replied' && response ? { kind: 'page', lines: response.body === '' ? [] : response.body.split('\n') } : { kind: 'error', text: errorOf(run) };
}

/** Returns what the tab shows for the address picked: the url the browser went to, and the page or the error of the last time it asked that site, to open the address or to sign in, since the world last changed. Null until it did, and for picks that are not the browser's or whose address is no url. */
export function browserView(session: Session, { from, to, message }: Partial<SendPicks>): BrowserView | null {
  const offers = sendingOf(session);
  const address = offers?.send.to.find((chip) => chip.id === to);
  const url = address && urlOfChip(address);
  const browserMessages = new Set(offers?.send.message.filter((chip) => chip.command === 'browser').map((chip) => chip.id));
  const runs = session.sent.filter((candidate) => !candidate.route && candidate.fromId === from && candidate.toId === to && browserMessages.has(candidate.messageId));
  const last = runs.reduce<SentPacket | undefined>((latest, run) => (latest === undefined || run.send > latest.send ? run : latest), undefined);
  if (url === undefined || last === undefined || message === undefined || !browserMessages.has(message)) return null;
  return { address: last.packet.message?.url ?? url, shows: showsOf(last) };
}
