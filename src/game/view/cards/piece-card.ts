import { PIECE_TEXT, type TermText } from '@/copy';
import type { PieceCard as OpensFirst } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from '@/game/view/piece-id';
import { identifyCard, type IdentifyCard } from './identify-card';
import { classifyCard, type ClassifyCard } from './identify/classify-card';
import { servicesCard, settingsCard, type ServicesCard, type SettingsCard } from './settings-card';
import { cacheCard, recordsCard, routesCard, translationsCard, type TableCard, type TableKind } from './table-card';
import { terminalCard, type TerminalCard } from './terminal/terminal-card';

export type PieceTabId = 'terminal' | 'identify' | 'classify' | 'settings' | 'services' | 'routes' | 'translations' | 'records' | 'cache';

interface TabOf<Id extends PieceTabId, Card> {
  id: Id;
  label: TermText;
  card: Card;
}

type TableTab = { [Kind in TableKind]: TabOf<Kind, TableCard> }[TableKind];

/** A card of a piece with the name of its tab. The title of the dialog is the title of the tab chosen. */
export type PieceTab = TabOf<'terminal', TerminalCard> | TabOf<'identify', IdentifyCard> | TabOf<'classify', ClassifyCard> | TabOf<'settings', SettingsCard> | TabOf<'services', ServicesCard> | TableTab;

export interface PieceCard {
  pieceId: string;
  tabs: PieceTab[];
  tabbed: boolean;
  first: PieceTabId;
}

const OPENS_FIRST: Partial<Record<OpensFirst, PieceTabId>> = { terminal: 'terminal', settings: 'settings', services: 'services', routes: 'routes', records: 'records' };

function tabs(session: Session, pieceId: string): PieceTab[] {
  const tab = <Id extends PieceTabId, Card>(id: Id, card: Card | null): TabOf<Id, Card>[] => (card === null ? [] : [{ id, label: PIECE_TEXT.tabs[id], card }]);
  return [
    ...tab('terminal', terminalCard(session, pieceId)),
    ...tab('identify', identifyCard(session, pieceId)),
    ...tab('classify', classifyCard(session, pieceId)),
    ...tab('settings', settingsCard(session, pieceId)),
    ...tab('services', servicesCard(session, pieceId)),
    ...tab('routes', routesCard(session, pieceId)),
    ...tab('translations', translationsCard(session, pieceId)),
    ...tab('records', recordsCard(session, pieceId)),
    ...tab('cache', cacheCard(session, pieceId)),
  ];
}

function firstOf(session: Session, pieceId: string, available: PieceTab[]): PieceTabId {
  const ref = parsePieceId(pieceId);
  const named = ref && 'id' in ref && session.incident.mechanic === 'send' ? session.incident.send.opensFirst?.[ref.id] : undefined;
  const wanted = named && OPENS_FIRST[named];
  return available.find((candidate) => candidate.id === wanted)?.id ?? available[0].id;
}

/** Returns the cards a piece opens from its one button, each as a tab, in the order they are offered when the incident names none: the terminal, the questions of an identify incident, the card that classifies, the network settings, the services, the table of routes, the table of translations, the records of a zone and the cache. A piece with several cards is `tabbed`; one with a single card opens it as it always did, with no tabs. The tab that opens first is the one the incident names for the piece (`send.opensFirst`) when the piece has that card, and the first of the list otherwise. Null for a piece with no card (a firewall opens its task card, which is not a tab, and a locked piece opens nothing). */
export function pieceCard(session: Session, pieceId: string): PieceCard | null {
  const available = tabs(session, pieceId);
  return available.length === 0 ? null : { pieceId, tabs: available, tabbed: available.length > 1, first: firstOf(session, pieceId, available) };
}
