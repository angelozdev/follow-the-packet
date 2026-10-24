import compare from 'just-compare';
import { SITES_TEXT, deviceName } from '@/copy';
import { webServiceAt, type Site } from '@/engine';
import type { TableSpec } from '@/levels';
import { canEdit, type Session } from '@/game/session';
import { code, problemOf, tableSpec, trayOf, words, type TableCard, type TableRowView } from '@/game/view/cards/table-card';
import { parsePieceId } from '@/game/view/piece-id';

type SitesSpec = Extract<TableSpec, { kind: 'sites' }>;

function contentOf({ pages, notFoundBody, orders }: Site) {
  return { pages, notFoundBody, ...(orders && { orders }) };
}

function servesCell(spec: SitesSpec, site: Site) {
  const chip = spec.trays.serves.find(({ value }) => compare(value, contentOf(site)));
  if (chip) return words(chip.label);
  const [page] = site.pages;
  return site.pages.length === 1 && page.handler.kind === 'fixed' ? words(page.handler.body) : code(site.pages.map(({ path }) => path).join(', '));
}

function siteRow(spec: SitesSpec, site: Site, isDefault: boolean): TableRowView {
  const names = site.names.length === 0 ? SITES_TEXT.anyName : site.names.join(', ');
  return { id: site.id, entryId: null, cells: [code(isDefault ? SITES_TEXT.byDefault(names) : names), servesCell(spec, site)], inUse: false };
}

/** Returns the «Sitios» card of the owner of a table of sites, the web service on the port of the table: a row for each site, with the names it answers to (the default site says so, and a default site with no name answers to any name) and what it serves, in the words of the chip of the table whose content it is or, when no chip stands for it, the body of its only page when that page is fixed and otherwise the paths of its pages. The player only adds sites, so no row can be taken away. An owner the incident offers editing for gets the trays of the name and of what the site serves, the button that adds it and the problem the engine gave to the last site it refused; once the session no longer accepts edits (`canEdit`), it is the same table read only. Null for a piece that owns no table of sites. */
export function sitesCard(session: Session, pieceId: string): TableCard | null {
  const ref = parsePieceId(pieceId);
  if (ref?.kind !== 'device' && ref?.kind !== 'actor') return null;
  const spec = tableSpec(session, ref.id, 'sites');
  const web = spec?.kind === 'sites' ? webServiceAt(session.world, ref.id, spec.port) : undefined;
  if (spec?.kind !== 'sites' || !web) return null;
  const editable = canEdit(session);
  return {
    kind: 'sites',
    tableId: editable ? spec.id : null,
    ownerId: ref.id,
    pieceId,
    title: SITES_TEXT.title(deviceName(session.world, ref.id)),
    columns: [
      { id: 'name', label: SITES_TEXT.name },
      { id: 'serves', label: SITES_TEXT.serves },
    ],
    rows: web.sites.map((site) => siteRow(spec, site, site.id === web.defaultSiteId)),
    empty: SITES_TEXT.empty,
    note: null,
    trays: editable ? [trayOf('name', SITES_TEXT.name, spec.trays.name), trayOf('serves', SITES_TEXT.serves, spec.trays.serves)] : null,
    add: editable ? SITES_TEXT.add : null,
    problem: editable ? problemOf(session, spec) : null,
  };
}
