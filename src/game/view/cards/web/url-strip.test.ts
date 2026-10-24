import { describe, expect, it } from 'vitest';
import { URL_STRIP_TEXT } from '@/copy';
import { addressByPartsIncident, sendIncident, webSendIncident } from '@/testing';
import { startSession } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { terminalCard } from '@/game/view/cards/terminal/terminal-card';
import { stripAddress, urlStrip } from './url-strip';

const BY_PARTS = addressByPartsIncident();
const LUCIA = PIECE_ID.device('lucia-laptop');
const ORDER_7 = '3000/pedidos-id=7';

describe('urlStrip', () => {
  it('has a tray for each part of the url, in the order of the url, with the values the chips give', () => {
    const strip = urlStrip(BY_PARTS.send.to);
    expect(strip?.name).toBe(URL_STRIP_TEXT.name);
    expect(strip?.parts.map(({ name, label, chips }) => [name, label, chips.map((chip) => chip.label)])).toEqual([
      ['scheme', 'Esquema', ['http']],
      ['host', 'Nombre', ['localhost']],
      ['port', 'Puerto', ['3000', '80']],
      ['path', 'Path', ['/pedidos', '/pedido']],
      ['query', 'Query string', ['?id=7', '?id=8']],
    ]);
  });

  it('finds the address chip whose parts are picked, and none while a part is missing', () => {
    const strip = urlStrip(BY_PARTS.send.to)!;
    const picked = { scheme: 'http', host: 'localhost', port: '3000', path: '/pedidos', query: 'id=7' };
    expect(stripAddress(strip, picked)).toBe(ORDER_7);
    expect(stripAddress(strip, { ...picked, port: '80', query: 'id=8' })).toBe('80/pedidos-id=8');
    expect(stripAddress(strip, { ...picked, query: undefined })).toBeUndefined();
    expect(stripAddress(strip, {})).toBeUndefined();
  });

  it('is null when a chip gives its whole url, when an address is no url and when one chip is all there is', () => {
    expect(urlStrip(webSendIncident().send.to)).toBeNull();
    expect(urlStrip([...BY_PARTS.send.to.slice(0, 2), { id: 'plain', address: '192.168.1.20' }])).toBeNull();
    expect(urlStrip(BY_PARTS.send.to.slice(0, 1))).toBeNull();
  });
});

describe('the terminal of an incident that gives its urls by parts', () => {
  it('carries the strip in place of the tray of addresses, and the tray of an origin or a message with one chip stays fixed', () => {
    const card = terminalCard(startSession([BY_PARTS], BY_PARTS.id), LUCIA);
    expect(card?.strip?.parts.map((part) => part.name)).toEqual(['scheme', 'host', 'port', 'path', 'query']);
    expect(card?.trays).toEqual([]);
    expect(card?.fixed).toEqual({ from: 'lucia', message: 'curl' });
  });

  it('keeps the tray of whole urls and carries no strip when the urls come whole or the address is no url', () => {
    const whole = webSendIncident();
    expect(terminalCard(startSession([whole], whole.id), PIECE_ID.device('your-laptop'))?.strip).toBeUndefined();
    const plain = sendIncident();
    expect(terminalCard(startSession([plain], plain.id), PIECE_ID.device('your-laptop'))?.strip).toBeUndefined();
  });
});
