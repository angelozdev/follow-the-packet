import { BROWSER_TEXT, endpointName, type TermText } from '@/copy';
import { urlOfChip } from '@/levels';
import type { SentPacket } from '@/game/flow-runs';
import { sendingOf, type Session } from '@/game/session';
import { originPieces, type SendPicks } from '@/game/view/cards/terminal/terminal-card';

interface BrowserAddress {
  id: string;
  label: TermText;
}

/** What the tab of the browser of an origin offers: its title, the origin and the message to send (the browser is a program of the device, so its requests leave from it) and the addresses it can open, each named by its url. */
export interface BrowserCard {
  pieceId: string;
  fromId: string;
  messageId: string;
  title: TermText;
  addresses: BrowserAddress[];
}

/** What the browser shows for an address it opened: the page the server sent, line by line, or the error in plain words. The words are the game's: they imitate no real browser. */
export type BrowserShows = { kind: 'page'; lines: string[] } | { kind: 'error'; text: TermText };

export interface BrowserView {
  address: TermText;
  shows: BrowserShows;
}

/** Returns the tab of the browser of an origin piece, or null when the piece is no origin or the incident offers no browser message. The browser is not a piece of the map: it is a card of the device it runs on. */
export function browserCard(session: Session, pieceId: string): BrowserCard | null {
  const offers = sendingOf(session);
  const fromId = Object.entries(originPieces(session)).find(([, piece]) => piece === pieceId)?.[0];
  const origin = offers?.send.from.find((chip) => chip.id === fromId);
  const message = offers?.send.message.find((chip) => chip.command === 'browser');
  if (!offers || !origin || !message) return null;
  return {
    pieceId,
    fromId: origin.id,
    messageId: message.id,
    title: BROWSER_TEXT.title(endpointName(origin.endpoint, session.world)),
    addresses: offers.send.to.flatMap((chip) => {
      const url = urlOfChip(chip);
      return url === undefined ? [] : [{ id: chip.id, label: url }];
    }),
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

/** Returns what the tab shows for the address picked: the url, and the page or the error of the last time the browser opened it since the world last changed. Null until it was opened, and for picks that are not the browser's or whose address is no url. */
export function browserView(session: Session, { from, to, message }: Partial<SendPicks>): BrowserView | null {
  const offers = sendingOf(session);
  const address = offers?.send.to.find((chip) => chip.id === to);
  const url = address && urlOfChip(address);
  const run = session.sent.find((candidate) => !candidate.route && candidate.fromId === from && candidate.toId === to && candidate.messageId === message);
  if (url === undefined || !run || offers?.send.message.find((chip) => chip.id === message)?.command !== 'browser') return null;
  return { address: url, shows: showsOf(run) };
}
