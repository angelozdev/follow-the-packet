import { describe, expect, it } from 'vitest';
import { MAP_TEXT, toPlainText } from '@/copy';
import { applyAction, type ServerActor, type Service, type Site } from '@/engine';
import { INCIDENTS } from '@/levels';
import { PORT, SERVER } from '@/levels/03-the-web-inside/shared';
import { startSession, type Session } from '@/game/session';
import { pieceCard } from '@/game/view/cards/piece-card';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceViews } from '@/game/view/pieces';
import { markOf, rolesOf } from './roles';

type Page = Site['pages'][number];

const FIXED_PAGE: Page = { path: '/', methods: ['GET'], handler: { kind: 'fixed', body: 'Hola.' } };
const ORDER_PAGE: Page = { path: '/pedidos', methods: ['GET'], handler: { kind: 'order-read' } };
const LOGIN_PAGE: Page = { path: '/login', methods: ['POST'], handler: { kind: 'login', body: 'Hola.' } };
const ORDER_BOOK: NonNullable<Site['orders']> = { template: 'Pedido {id}.', start: [] };
const USERS: NonNullable<Site['accounts']> = { users: [{ name: 'lucia', password: 'clave', role: 'admin' }], realm: 'admin', unauthorizedBody: 'No.', forbiddenBody: 'No.' };

const FORWARDS: NonNullable<Site['proxy']> = { prefixes: ['/pedidos'], origins: [{ ip: '198.51.100.61', port: 3000 }] };
const site = (id: string, pages: Page[], extra: Partial<Site> = {}): Site => ({ id, names: [], pages, notFoundBody: 'No hay nada.', ...extra });
const serving = (...sites: Site[]): Service => ({ protocol: 'tcp', port: 80, listen: 'all', web: { sites, defaultSiteId: sites[0].id } });
const server = (parts: Partial<ServerActor> = {}): ServerActor => ({ id: 'servidor', name: 'servidor', kind: 'server', ip: '198.51.100.9', latencyMs: 5, ...parts });

describe('the roles of a server', () => {
  it('a server of names has the role its dns says', () => {
    expect(rolesOf(server({ dns: { role: 'resolver' } }))).toEqual(['resolver']);
    expect(rolesOf(server({ dns: { role: 'authoritative' } }))).toEqual(['authoritative']);
  });

  it('a server whose web service serves only fixed pages has the web role', () => {
    expect(rolesOf(server({ services: [serving(site('shop', [FIXED_PAGE]))] }))).toEqual(['web']);
    expect(rolesOf(server({ services: [serving(site('empty', []))] }))).toEqual(['web']);
  });

  it('a server whose site keeps orders or logs users in has the app role', () => {
    expect(rolesOf(server({ services: [serving(site('orders', [ORDER_PAGE], { orders: ORDER_BOOK }))] }))).toEqual(['app']);
    expect(rolesOf(server({ services: [serving(site('admin', [FIXED_PAGE, LOGIN_PAGE], { accounts: USERS }))] }))).toEqual(['app']);
  });

  it('a server with no dns and no web service has no role', () => {
    expect(rolesOf(server())).toEqual([]);
    expect(rolesOf(server({ services: [{ protocol: 'tcp', port: 22, listen: 'all' }, { protocol: 'udp', port: 53, listen: 'all' }] }))).toEqual([]);
  });

  it('a server with a shop and an app gives both roles, the one that redirects the packet first', () => {
    const both = server({ services: [serving(site('shop', [FIXED_PAGE]), site('orders', [ORDER_PAGE], { orders: ORDER_BOOK }))] });
    expect(rolesOf(both)).toEqual(['app', 'web']);
  });

  it('a server whose site forwards a path has the proxy role and its mark wins over the web and the app', () => {
    const forwarding = site('shop', [FIXED_PAGE], { proxy: FORWARDS });
    expect(rolesOf(server({ services: [serving(forwarding)] }))).toEqual(['proxy', 'web']);
    const withApp = server({ services: [serving(forwarding, site('orders', [ORDER_PAGE], { orders: ORDER_BOOK }))] });
    expect(rolesOf(withApp)).toEqual(['proxy', 'app', 'web']);
    expect(markOf(rolesOf(withApp))).toBe('proxy');
    expect(rolesOf(server({ services: [serving(site('shop', [FIXED_PAGE]))] }))).toEqual(['web']);
  });

  it('the mark is the one of the role that redirects the packet: proxy over app over web', () => {
    expect(markOf(['web', 'proxy', 'app'])).toBe('proxy');
    expect(markOf(['web', 'app'])).toBe('app');
    expect(markOf(['web'])).toBe('web');
    expect(markOf(['authoritative'])).toBe('authoritative');
    expect(markOf([])).toBeUndefined();
  });
});

const SHOP = startSession(INCIDENTS, '03-04');
const fresh = (session: Session) => pieceViews(session).find((piece) => piece.id === PIECE_ID.actor(SERVER.fresh.id));
const ORDERS_WEB = { sites: [site('orders', [ORDER_PAGE], { orders: ORDER_BOOK })], defaultSiteId: 'orders' };
const SHOP_AND_ORDERS_WEB = { sites: [site('shop', [FIXED_PAGE]), site('orders', [ORDER_PAGE], { orders: ORDER_BOOK })], defaultSiteId: 'shop' };
const withWeb = (session: Session, web: typeof ORDERS_WEB): Session => ({ ...session, world: applyAction(session.world, { type: 'setWebService', ownerId: SERVER.fresh.id, port: PORT.web, web }) });

describe('the roles of a server on the map', () => {
  it('the roles of a server come from the world each time the pieces are listed, so a move that changes the world changes them', () => {
    expect(fresh(SHOP)).toMatchObject({ roles: ['web'], role: 'web' });
    const changed = withWeb(SHOP, ORDERS_WEB);
    expect(fresh(changed)).toMatchObject({ roles: ['app'], role: 'app' });
    expect(fresh(SHOP)).toMatchObject({ roles: ['web'], role: 'web' });
    expect(Object.keys(SHOP)).not.toContain('roles');
  });

  it('a server that forwards a path wears the proxy mark on the map and says both roles in words', () => {
    const forwarding = withWeb(SHOP, { sites: [site('shop', [FIXED_PAGE], { proxy: FORWARDS })], defaultSiteId: 'shop' });
    expect(fresh(forwarding)).toMatchObject({ roles: ['proxy', 'web'], role: 'proxy' });
    expect(toPlainText(pieceCard(forwarding, PIECE_ID.actor(SERVER.fresh.id))?.roles ?? '')).toBe('Papeles: proxy inverso y servidor web');
    expect(fresh(SHOP)).toMatchObject({ roles: ['web'], role: 'web' });
  });

  it('pieceViews gives roles to a server of the internet and to no other piece', () => {
    const pieces = pieceViews(SHOP);
    const servers = pieces.filter((piece) => piece.kind === 'device' && piece.variant === 'internet-server');
    expect(servers.map(({ anchorId, roles, role }) => ({ anchorId, roles, role }))).toEqual([
      { anchorId: SERVER.resolver.id, roles: ['resolver'], role: 'resolver' },
      { anchorId: SERVER.fresh.id, roles: ['web'], role: 'web' },
    ]);
    for (const piece of pieces.filter((each) => !servers.includes(each))) {
      expect(piece, piece.id).not.toHaveProperty('roles');
      expect(piece, piece.id).not.toHaveProperty('role');
    }
  });

  it('a server with no role has no roles on its piece', () => {
    const bare = startSession(INCIDENTS, '02-12');
    const servers = pieceViews(bare).filter((piece) => piece.kind === 'device' && piece.variant === 'internet-server');
    expect(servers.map((piece) => piece.anchorId)).toContain(SERVER.fresh.id);
    expect(pieceViews(bare).find((piece) => piece.id === PIECE_ID.actor(SERVER.fresh.id))).not.toHaveProperty('roles');
  });

  it('a server with two roles says both in words and wears one mark', () => {
    const both = withWeb(SHOP, SHOP_AND_ORDERS_WEB);
    expect(fresh(both)).toMatchObject({ roles: ['app', 'web'], role: 'app' });
    const card = pieceCard(both, PIECE_ID.actor(SERVER.fresh.id));
    expect(toPlainText(card?.roles ?? '')).toBe('Papeles: app, servidor de origen y servidor web');
  });

  it('the card of a server says its roles in words, with the terms the player knows', () => {
    expect(pieceCard(SHOP, PIECE_ID.actor(SERVER.fresh.id))?.roles).toBe(MAP_TEXT.rolesLine(['web'], SHOP.known));
    expect(toPlainText(pieceCard(SHOP, PIECE_ID.actor(SERVER.resolver.id))?.roles ?? '')).toBe('Papel: resolutor de DNS');
    expect(pieceCard(SHOP, PIECE_ID.device('your-laptop'))).not.toHaveProperty('roles');
  });
});
