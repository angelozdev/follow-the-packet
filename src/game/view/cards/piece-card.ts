import { MAP_TEXT, PIECE_TEXT, type TermText } from '@/copy';
import type { PieceCard as OpensFirst } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from '@/game/view/piece-id';
import { rolesOf } from '@/game/view/roles/roles';
import { identifyCard, type IdentifyCard } from './identify-card';
import { classifyCard, type ClassifyCard } from './identify/classify-card';
import { servicesCard, settingsCard, type ServicesCard, type SettingsCard } from './settings-card';
import { cacheCard, recordsCard, routesCard, translationsCard, type TableCard, type TableKind } from './table-card';
import { terminalCard, type TerminalCard } from './terminal/terminal-card';
import { browserCard, type BrowserCard } from './web/browser-card';
import { sitesCard } from './web/sites-card';

export type PieceTabId = 'terminal' | 'browser' | 'identify' | 'classify' | 'settings' | 'services' | 'routes' | 'translations' | 'records' | 'cache' | 'sites';

interface TabOf<Id extends PieceTabId, Card> {
  id: Id;
  label: TermText;
  card: Card;
}

type TableTab = { [Kind in TableKind]: TabOf<Kind, TableCard> }[TableKind];

/** A card of a piece with the name of its tab. The title of the dialog is the title of the tab chosen. */
export type PieceTab = TabOf<'terminal', TerminalCard> | TabOf<'browser', BrowserCard> | TabOf<'identify', IdentifyCard> | TabOf<'classify', ClassifyCard> | TabOf<'settings', SettingsCard> | TabOf<'services', ServicesCard> | TableTab;

export interface PieceCard {
  pieceId: string;
  tabs: PieceTab[];
  tabbed: boolean;
  first: PieceTabId;
  roles?: TermText;
}

const OPENS_FIRST: Record<OpensFirst, PieceTabId> = { terminal: 'terminal', browser: 'browser', settings: 'settings', services: 'services', routes: 'routes', records: 'records', sites: 'sites' };

function tabs(session: Session, pieceId: string): PieceTab[] {
  const tab = <Id extends PieceTabId, Card>(id: Id, card: Card | null): TabOf<Id, Card>[] => (card === null ? [] : [{ id, label: PIECE_TEXT.parts[id], card }]);
  return [
    ...tab('terminal', terminalCard(session, pieceId)),
    ...tab('browser', browserCard(session, pieceId)),
    ...tab('identify', identifyCard(session, pieceId)),
    ...tab('classify', classifyCard(session, pieceId)),
    ...tab('settings', settingsCard(session, pieceId)),
    ...tab('services', servicesCard(session, pieceId)),
    ...tab('routes', routesCard(session, pieceId)),
    ...tab('translations', translationsCard(session, pieceId)),
    ...tab('records', recordsCard(session, pieceId)),
    ...tab('sites', sitesCard(session, pieceId)),
    ...tab('cache', cacheCard(session, pieceId)),
  ];
}

function firstOf(session: Session, pieceId: string, available: PieceTab[]): PieceTabId {
  const ref = parsePieceId(pieceId);
  const named = ref && 'id' in ref && session.incident.mechanic === 'send' ? session.incident.send.opensFirst?.[ref.id] : undefined;
  const wanted = named && OPENS_FIRST[named];
  return available.find((candidate) => candidate.id === wanted)?.id ?? available[0].id;
}

function rolesLine(session: Session, pieceId: string): { roles?: TermText } {
  const ref = parsePieceId(pieceId);
  const actor = ref?.kind === 'actor' ? session.world.actors.find(({ id }) => id === ref.id) : undefined;
  const roles = actor?.kind === 'server' ? rolesOf(actor) : [];
  return roles.length === 0 ? {} : { roles: MAP_TEXT.rolesLine(roles, session.known) };
}

/** Returns the cards a piece opens from its one button, each as a tab, in the order they are offered when the incident names none: the terminal, the browser, the questions of an identify incident, the card that classifies, the network settings, the services, the table of routes, the table of translations, the records of a zone, the sites of a web server and the cache. A piece with several cards is `tabbed`; one with a single card opens it as it always did, with no tabs. The tab that opens first is the one the incident names for the piece (`send.opensFirst`) when the piece has that card, and the first of the list otherwise. Null for a piece with no card (a firewall opens its task card, which is not a tab, and a locked piece opens nothing). The card of a server of the internet carries `roles`, the line that says its roles in words, with the terms the player knows. */
export function pieceCard(session: Session, pieceId: string): PieceCard | null {
  const available = tabs(session, pieceId);
  return available.length === 0 ? null : { pieceId, tabs: available, tabbed: available.length > 1, first: firstOf(session, pieceId, available), ...rolesLine(session, pieceId) };
}
