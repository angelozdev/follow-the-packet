import { describe, expect, it } from 'vitest';
import { applyAction, type Site } from '@/engine';
import { OFFICE_FLOORS, webSendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { sitesCard } from './sites-card';

const WEB = webSendIncident();
const web = startSession([WEB], WEB.id);
const { server } = OFFICE_FLOORS;
const SERVER = PIECE_ID.actor(server.id);
const place = (session: Session, name: string, serves: string): Session => sessionReducer(session, { type: 'placeEntry', tableId: 'sites', picks: { name, serves } });
const SHOP_ROW = { id: 'shop', entryId: null, cells: [{ text: 'www.lucia.example · sitio por defecto', code: true }, { text: 'La tienda', code: false }], inUse: false };

describe('sitesCard', () => {
  it('the sites card lists the name and what each site serves and marks the default one', () => {
    const card = sitesCard(web, SERVER);
    expect(card).toMatchObject({
      kind: 'sites',
      tableId: 'sites',
      ownerId: server.id,
      pieceId: SERVER,
      title: '{{virtual-host|Sitios}} de [[servidor-internet]]',
      columns: [{ id: 'name', label: 'Nombre' }, { id: 'serves', label: 'Qué sirve' }],
      rows: [SHOP_ROW],
      empty: 'Este servidor no tiene sitios.',
      note: null,
      add: 'Agregar sitio',
      problem: null,
    });
    const placed = sitesCard(place(web, 'blog', 'serve-blog'), SERVER);
    expect(placed?.rows).toEqual([SHOP_ROW, { id: 'blog.lucia.example', entryId: null, cells: [{ text: 'blog.lucia.example', code: true }, { text: 'El blog', code: false }], inUse: false }]);
  });

  it('offers a tray for the name and a tray for what the site serves, with the chips of the table', () => {
    expect(sitesCard(web, SERVER)?.trays).toEqual([
      { name: 'name', label: 'Nombre', chips: [{ id: 'blog', label: 'blog.lucia.example' }, { id: 'blogs', label: 'blogs.lucia.example' }, { id: 'shop-name', label: 'www.lucia.example' }] },
      { name: 'serves', label: 'Qué sirve', chips: [{ id: 'serve-blog', label: 'El blog' }, { id: 'serve-shop', label: 'La tienda' }] },
    ]);
  });

  it('says what a site serves by its pages when no chip of the table stands for its content, and names the default site with no name as any name', () => {
    const docs: Site = { id: 'docs', names: [], notFoundBody: 'Nada.', pages: [{ path: '/', methods: ['GET'], handler: { kind: 'fixed', body: 'Guía' } }, { path: '/guia', methods: ['GET'], handler: { kind: 'fixed', body: 'Guía' } }] };
    const world = applyAction(web.world, { type: 'setServices', ownerId: server.id, services: [{ protocol: 'tcp', port: 80, listen: 'all', web: { sites: [docs, { ...docs, id: 'guide', names: ['guia.lucia.example'] }], defaultSiteId: 'docs' } }] });
    expect(sitesCard({ ...web, world }, SERVER)?.rows.map(({ cells }) => cells.map(({ text }) => text))).toEqual([
      ['cualquier nombre · sitio por defecto', '/, /guia'],
      ['guia.lucia.example', '/, /guia'],
    ]);
  });

  it('shows the problem the engine gave to the last site it refused, in the words of the table', () => {
    const refused = sitesCard(place(web, 'shop-name', 'serve-blog'), SERVER);
    expect(refused?.problem).toBe('No se pudo agregar. Ese nombre ya tiene un sitio en este servidor, y un servidor guarda un solo sitio por nombre.');
    expect(refused?.rows).toEqual([SHOP_ROW]);
  });

  it('stays on the card as the same table read only once the session no longer accepts edits', () => {
    const closed = sitesCard({ ...place(web, 'shop-name', 'serve-blog'), phase: 'explaining' }, SERVER);
    expect(closed).toMatchObject({ tableId: null, trays: null, add: null, problem: null });
    expect(closed?.rows).toEqual([SHOP_ROW]);
  });

  it('is null for a piece that has no table of sites', () => {
    expect(sitesCard(web, PIECE_ID.device('your-laptop'))).toBeNull();
    expect(sitesCard(web, PIECE_ID.actor('nobody'))).toBeNull();
  });
});
