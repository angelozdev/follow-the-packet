import { describe, expect, it } from 'vitest';
import { TABLE_TEXT, toPlainText } from '@/copy';
import type { TermId } from '@/copy';
import { RECORD_PROBLEMS, ROUTE_PROBLEMS, applyAction } from '@/engine';
import { CHIP_PROBLEMS } from '@/levels';
import { NAME_SERVERS, OFFICE_FLOORS, filterIncident, namesSendIncident, withResolverCache } from '@/testing';
import { sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { cacheCard, recordsCard, routesCard, translationsCard, type TableCard } from './table-card';

const TRACE = { id: 'trace', label: '{{traceroute}}', command: 'traceroute', icmpType: 8 } as const;
const WITHOUT_TRACE = namesSendIncident();
const NAMES = { ...WITHOUT_TRACE, send: { ...WITHOUT_TRACE.send, message: [...WITHOUT_TRACE.send.message, TRACE] } };
const { officeRouter, provider, server, range } = OFFICE_FLOORS;
const { zone, resolver, authoritative } = NAME_SERVERS;
const START = startSession([NAMES], NAMES.id);
const YOU = PIECE_ID.device('your-laptop');
const OFFICE_ROUTER = PIECE_ID.router(officeRouter.id);
const PROVIDER = PIECE_ID.router(provider.id);
const RESOLVER = PIECE_ID.actor(resolver.id);
const AUTHORITATIVE = PIECE_ID.actor(authoritative.id);

function play(session: Session, ...actions: SessionAction[]): Session {
  return actions.reduce(sessionReducer, session);
}

const send = (toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId: 'you', toId, messageId });
const without = (session: Session, ...terms: TermId[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) });
const plain = (card: TableCard | null) => card?.rows.map((row) => row.cells.map((cell) => toPlainText(cell.text)));
const used = (card: TableCard | null) => card?.rows.filter((row) => row.inUse).map((row) => row.id);
const place = (tableId: string, picks: Record<string, string>): SessionAction => ({ type: 'placeEntry', tableId, picks });

describe('routesCard', () => {
  it('the routes card of a device lists its connected route and its default route', () => {
    const card = routesCard(START, YOU);
    expect(card).toMatchObject({ kind: 'routes', tableId: null, ownerId: 'your-laptop', pieceId: YOU, trays: null, add: null, problem: null, note: null });
    expect(toPlainText(card?.title ?? '')).toBe('Tabla de rutas de tu-laptop');
    expect(plain(card)).toEqual([
      ['192.168.1.0/24', 'directo'],
      ['0.0.0.0/0', '192.168.1.1 router-office'],
    ]);
    expect(card?.rows.map((row) => row.entryId)).toEqual([null, null]);
    expect(card?.rows.every((row) => !row.inUse)).toBe(true);
  });

  it('the column of the next hop is called Por dónde sale until next-hop is known', () => {
    const labels = (session: Session) => routesCard(session, YOU)?.columns.map((column) => toPlainText(column.label));
    expect(labels(without(START, 'next-hop'))).toEqual(['Destino', 'Por dónde sale']);
    expect(labels(START)).toEqual(['Destino', 'Siguiente salto']);
    const tray = (session: Session) => routesCard(session, PROVIDER)?.trays?.map((entry) => entry.label);
    expect(tray(without(START, 'next-hop'))).toEqual(['Destino', 'Por dónde sale']);
    expect(tray(START)).toEqual(['Destino', 'Siguiente salto']);
  });

  it('the row the last packet used is marked', () => {
    const toLucia = play(START, send('lucia', 'ping'));
    expect(used(routesCard(toLucia, YOU))).toEqual(['connected:192.168.1.0/24']);
    const toServer = play(toLucia, send('server', 'ping'));
    expect(used(routesCard(toServer, YOU))).toEqual(['default:default']);
    expect(used(routesCard(toServer, OFFICE_ROUTER))).toEqual(['default:default']);
    expect(used(routesCard(toServer, PROVIDER))).toEqual([`static:${server.range}`]);
    expect(used(routesCard(START, YOU))).toEqual([]);
  });

  it('a send that is a traceroute marks no row', () => {
    expect(used(routesCard(play(START, send('server', 'trace')), YOU))).toEqual([]);
    expect(used(routesCard(play(START, send('server', 'ping'), send('server', 'trace')), YOU))).toEqual([]);
  });

  it('a router whose table the incident lets the player edit offers the trays, a button for each route that is not connected, and the label of the button that adds one', () => {
    const card = routesCard(START, PROVIDER);
    expect(card).toMatchObject({ kind: 'routes', tableId: 'routes', ownerId: provider.id, add: 'Agregar ruta' });
    expect(card?.trays?.map(({ name, label, chips }) => ({ name, label, chips: chips.map((chip) => chip.id) }))).toEqual([
      { name: 'destination', label: 'Destino', chips: ['default', range] },
      { name: 'nextHop', label: 'Siguiente salto', chips: [officeRouter.id] },
    ]);
    expect(card?.rows.map((row) => row.entryId)).toEqual([null, null, server.range, range]);
  });

  it('a router and a device whose table nobody offers show it read only once routing-table is known, and a device that does not send shows none', () => {
    expect(routesCard(START, OFFICE_ROUTER)).toMatchObject({ tableId: null, trays: null, add: null });
    expect(routesCard(START, OFFICE_ROUTER)?.rows.every((row) => row.entryId === null)).toBe(true);
    expect(routesCard(without(START, 'routing-table'), OFFICE_ROUTER)).toBeNull();
    expect(routesCard(without(START, 'routing-table'), YOU)).toBeNull();
    expect(routesCard(START, PIECE_ID.device('printer'))).toBeNull();
    expect(routesCard(START, PIECE_ID.actor(server.id))).toBeNull();
    expect(routesCard(without(START, 'routing-table'), PROVIDER)).not.toBeNull();
  });

  it('names a next hop the map draws and says where one it does not draw stands', () => {
    const naming = plain(routesCard(START, OFFICE_ROUTER));
    expect(naming?.at(-1)).toEqual(['0.0.0.0/0', `${provider.towardOffice} router-provider`]);
    const hidden = startSession([{ ...NAMES, shown: ['your-laptop', officeRouter.id, resolver.id] }], NAMES.id);
    expect(plain(routesCard(hidden, OFFICE_ROUTER))?.at(-1)).toEqual(['0.0.0.0/0', 'fuera de la oficina']);
  });

  it('writes the router alone for a route whose router shares no link with the holder, and never calls it direct', () => {
    const farAway = applyAction(NAMES.base!, { type: 'addRoute', routerId: officeRouter.id, route: { to: '10.0.0.0/16', next: OFFICE_FLOORS.backbone.id } });
    const session = startSession([{ ...NAMES, base: farAway }], NAMES.id);
    expect(plain(routesCard(session, OFFICE_ROUTER))?.at(-1)).toEqual(['10.0.0.0/16', 'router-backbone']);
    const hidden = startSession([{ ...NAMES, base: farAway, shown: ['your-laptop', officeRouter.id] }], NAMES.id);
    expect(plain(routesCard(hidden, OFFICE_ROUTER))?.at(-1)).toEqual(['10.0.0.0/16', 'fuera de la oficina']);
  });

  it('is null in an incident that is not a send', () => {
    expect(routesCard(startSession([filterIncident('04-01')], '04-01'), PIECE_ID.device('servidor1'))).toBeNull();
  });
});

describe('translationsCard', () => {
  const nc = (toId: string): SessionAction => send(toId, 'nc');

  it('the translations card lists the rows of the sent packets in order', () => {
    const sent = play(START, nc('server'), send('server', 'ping'), nc('lucia'), nc('server'), send('www', 'dig'));
    expect(sent.history).toHaveLength(5);
    const card = translationsCard(sent, OFFICE_ROUTER);
    expect(card).toMatchObject({ kind: 'translations', tableId: null, ownerId: officeRouter.id, trays: null, add: null });
    expect(toPlainText(card?.title ?? '')).toBe('Tabla de traducciones de router-office');
    expect(card?.columns.map((column) => toPlainText(column.label))).toEqual(['Protocolo', 'IP:puerto privado', 'IP:puerto público']);
    expect(plain(card)).toEqual([
      ['TCP', '192.168.1.10:51514', `${officeRouter.uplink}:40001`],
      ['TCP', '192.168.1.10:51516', `${officeRouter.uplink}:40002`],
      ['UDP', '192.168.1.10:51517', `${officeRouter.uplink}:40003`],
    ]);
  });

  it('keeps a row that a later send of the same chips replaced in the list of the last sends', () => {
    const twice = play(START, nc('server'), nc('server'));
    expect(twice.sent).toHaveLength(1);
    expect(twice.history).toHaveLength(2);
    expect(translationsCard(twice, OFFICE_ROUTER)?.rows).toHaveLength(2);
  });

  it('marks the row the last packet used, and a ping makes no row and uses none', () => {
    const sent = play(START, nc('server'), nc('server'));
    expect(translationsCard(sent, OFFICE_ROUTER)?.rows.map((row) => row.inUse)).toEqual([false, true]);
    const pinged = play(sent, send('server', 'ping'));
    expect(used(translationsCard(pinged, OFFICE_ROUTER))).toEqual([]);
    expect(translationsCard(pinged, OFFICE_ROUTER)?.rows).toHaveLength(2);
    expect(used(translationsCard(play(sent, nc('lucia')), OFFICE_ROUTER))).toEqual([]);
  });

  it('has no rows before anything is sent, loses them when the world changes, and is the card of the router that translates and nothing else', () => {
    expect(translationsCard(START, OFFICE_ROUTER)?.rows).toEqual([]);
    const sent = play(START, nc('server'));
    expect(translationsCard(play(sent, { type: 'setSetting', deviceId: 'your-laptop', settingId: 'resolver', chipId: 'none' }), OFFICE_ROUTER)?.rows).toEqual([]);
    expect(translationsCard(sent, PROVIDER)).toBeNull();
    expect(translationsCard(sent, YOU)).toBeNull();
    expect(translationsCard(without(sent, 'translation-table'), OFFICE_ROUTER)).toBeNull();
  });
});

describe('recordsCard', () => {
  it('the records card hides the records of the zone itself under one muted line', () => {
    const card = recordsCard(START, AUTHORITATIVE);
    expect(card).toMatchObject({ kind: 'records', tableId: 'records', ownerId: authoritative.id, add: 'Agregar registro' });
    expect(toPlainText(card?.title ?? '')).toBe(`Registros de ${zone}`);
    expect(card?.columns.map((column) => toPlainText(column.label))).toEqual(['Nombre', 'Tipo', 'Valor', 'TTL']);
    expect(plain(card)).toEqual([
      [`www.${zone}`, 'A', server.ip, '300 s'],
      [`blog.${zone}`, 'CNAME', `www.${zone}`, '300 s'],
    ]);
    expect(card?.rows.every((row) => row.entryId !== null)).toBe(true);
    expect(toPlainText(card?.note ?? '')).toBe(TABLE_TEXT.records.own);
    expect(card?.trays?.map(({ name, chips }) => [name, chips.length])).toEqual([['name', 1], ['type', 2], ['value', 1]]);
  });

  it('the column of the time to live waits for dns-ttl, and a zone with no record of its own shows no line', () => {
    expect(recordsCard(without(START, 'dns-ttl'), AUTHORITATIVE)?.columns.map((column) => column.id)).toEqual(['name', 'type', 'value']);
    expect(plain(recordsCard(without(START, 'dns-ttl'), AUTHORITATIVE))?.[0]).toHaveLength(3);
  });

  it('is the card of the server whose table the incident offers and nothing else', () => {
    expect(recordsCard(START, RESOLVER)).toBeNull();
    expect(recordsCard(START, YOU)).toBeNull();
    expect(recordsCard(START, PIECE_ID.actor('ghost'))).toBeNull();
  });
});

describe('a rejected entry', () => {
  const records = NAMES.send.tables![1];
  const custom = (value: string[]) => {
    if (records.kind !== 'records') throw new Error('expected the table of records');
    const labelled = (names: string[]) => names.map((name) => ({ id: name, label: name, value: name }));
    const types = [{ id: 'A', label: 'A', value: 'A' }, { id: 'CNAME', label: 'CNAME', value: 'CNAME' }] as const;
    return { ...NAMES, send: { ...NAMES.send, tables: [NAMES.send.tables![0], { ...records, trays: { name: labelled([`www.${zone}`, `blog.${zone}`, zone, `tienda.${zone}`]), type: [...types], value: labelled(value) } }] } };
  };
  const session = (incident: ReturnType<typeof custom>) => startSession([incident], incident.id);
  const problem = (s: Session, pieceId: string) => toPlainText((pieceId === PROVIDER ? routesCard(s, pieceId) : recordsCard(s, pieceId))?.problem ?? '');

  it('a rejected entry carries the problem the engine gave', () => {
    const start = session(custom([server.ip, `www.${zone}`]));
    const pick = (name: string, type: string, value: string) => place('records', { name, type, value });
    expect(problem(play(start, pick(`www.${zone}`, 'A', server.ip)), AUTHORITATIVE)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['already-there'])}`);
    expect(problem(play(start, pick(`blog.${zone}`, 'A', server.ip)), AUTHORITATIVE)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['name-is-an-alias'])}`);
    expect(problem(play(start, pick(`www.${zone}`, 'CNAME', `www.${zone}`)), AUTHORITATIVE)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['cname-with-other-records'])}`);
    expect(problem(play(start, pick(zone, 'CNAME', `www.${zone}`)), AUTHORITATIVE)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['cname-at-apex'])}`);
    expect(problem(play(start, pick(`tienda.${zone}`, 'A', `www.${zone}`)), AUTHORITATIVE)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['a-record-needs-ip'])}`);
    expect(problem(play(start, place('routes', { destination: range, nextHop: officeRouter.id })), PROVIDER)).toBe(`No se pudo agregar. ${toPlainText(TABLE_TEXT.problems['destination-has-route'])}`);
  });

  it('says nothing about the other table, goes with the next entry, and is the same text for the same refusal', () => {
    const start = session(custom([server.ip, `www.${zone}`]));
    const refused = play(start, place('records', { name: `www.${zone}`, type: 'A', value: server.ip }));
    expect(refused.entryProblem).toEqual({ tableId: 'records', code: 'already-there' });
    expect(routesCard(refused, PROVIDER)?.problem).toBeNull();
    const accepted = play(refused, place('records', { name: `tienda.${zone}`, type: 'A', value: server.ip }));
    expect(recordsCard(accepted, AUTHORITATIVE)?.problem).toBeNull();
    expect(recordsCard(accepted, AUTHORITATIVE)?.rows).toHaveLength(3);
  });

  it('has a text for every code the engine and the contract can give', () => {
    for (const code of [...RECORD_PROBLEMS, ...ROUTE_PROBLEMS, ...CHIP_PROBLEMS]) expect(toPlainText(TABLE_TEXT.problems[code]), code).not.toBe('');
    expect(Object.keys(TABLE_TEXT.problems).sort()).toEqual([...RECORD_PROBLEMS, ...ROUTE_PROBLEMS, ...CHIP_PROBLEMS].sort());
  });

  it('says what each code means in plain words, with no code on the screen', () => {
    for (const text of Object.values(TABLE_TEXT.problems)) expect(toPlainText(text)).not.toMatch(/[a-z]+-[a-z]+-/);
    expect(toPlainText(TABLE_TEXT.problems['cname-at-apex'])).toContain('La zona ya tiene sus propios registros');
    expect(toPlainText(TABLE_TEXT.problems['destination-has-route'])).toContain('En este juego');
  });
});

describe('cacheCard', () => {
  it('the cache card lists the answers with the seconds left', () => {
    const asked = play(START, send('www', 'dig'));
    const card = cacheCard(asked, RESOLVER);
    expect(card).toMatchObject({ kind: 'cache', tableId: null, ownerId: resolver.id, trays: null, add: null });
    expect(toPlainText(card?.title ?? '')).toBe('Caché de servidor-dns');
    expect(card?.columns.map((column) => toPlainText(column.label))).toEqual(['Nombre', 'Tipo', 'Valor', 'Quedan']);
    expect(plain(card)).toEqual([[`www.${zone}`, 'A', server.ip, '300 s']]);
    expect(plain(cacheCard(play(asked, { type: 'wait', seconds: 60 }), RESOLVER))).toEqual([[`www.${zone}`, 'A', server.ip, '240 s']]);
    expect(plain(cacheCard(play(asked, { type: 'wait', seconds: 300 }), RESOLVER))).toEqual([]);
  });

  it('shows the cache of the world before anything is sent, measured against the clock of the game', () => {
    const seeded = withResolverCache(NAMES.base!, [{ name: `www.${zone}`, type: 'A', value: server.ip, expiresAt: 240 }]);
    const start = startSession([{ ...NAMES, base: seeded }], NAMES.id);
    expect(plain(cacheCard(start, RESOLVER))).toEqual([[`www.${zone}`, 'A', server.ip, '240 s']]);
    expect(plain(cacheCard(play(start, { type: 'wait', seconds: 60 }), RESOLVER))).toEqual([[`www.${zone}`, 'A', server.ip, '180 s']]);
    expect(cacheCard(play(start, { type: 'wait', seconds: 300 }), RESOLVER)?.empty).toBe(TABLE_TEXT.cache.empty);
  });

  it('skips a traceroute, measures against the second of the clock and not the one of the last send, and is the card of a resolver once dns-cache is known', () => {
    const waited = play(START, send('www', 'dig'), { type: 'wait', seconds: 60 }, send('server', 'trace'));
    expect(plain(cacheCard(waited, RESOLVER))).toEqual([[`www.${zone}`, 'A', server.ip, '240 s']]);
    expect(cacheCard(START, AUTHORITATIVE)).toBeNull();
    expect(cacheCard(START, YOU)).toBeNull();
    expect(cacheCard(without(START, 'dns-cache'), RESOLVER)).toBeNull();
  });
});
