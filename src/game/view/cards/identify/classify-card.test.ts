import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { classifyIncident, identifyIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { bitsRow, classifyCard, insideBlockPieces, splitIp } from './classify-card';

const INCIDENT = classifyIncident();
const START = startSession([INCIDENT], INCIDENT.id);
const YOU = PIECE_ID.device('your-laptop');
const PRINTER = 'printer';
const ANDRES = 'andres-laptop';

const place = (session: Session, deviceId: string, binId: string): Session => sessionReducer(session, { type: 'answerCard', deviceId, picks: { bin: binId } });
const card = (session: Session) => {
  const found = classifyCard(session, YOU);
  if (!found) throw new Error('missing the classify card');
  return found;
};
const withBlock = (cidr: string): Session => {
  const incident = { ...INCIDENT, identify: { ...INCIDENT.identify, classify: { ...INCIDENT.identify.classify!, cidr } } };
  return startSession([incident], incident.id);
};

describe('classifyCard', () => {
  it('the bits row of an IP has its 32 bits in four numbers and marks the first ones the prefix fixes', () => {
    const numbers = card(START).numbers;
    expect(numbers.map((number) => number.decimal)).toEqual([192, 168, 1, 10]);
    expect(numbers.map((number) => number.bits.map(({ value }) => value).join(''))).toEqual(['11000000', '10101000', '00000001', '00001010']);
    expect(numbers.flatMap((number) => number.bits).filter((bit) => bit.fixed)).toHaveLength(24);
    expect(numbers.slice(0, 3).every((number) => number.bits.every((bit) => bit.fixed))).toBe(true);
    expect(numbers[3].bits.every((bit) => !bit.fixed)).toBe(true);
    expect(bitsRow('192.168.1.10', 28)[3].bits.map((bit) => bit.fixed)).toEqual([true, true, true, true, false, false, false, false]);
    expect(bitsRow('192.168.1.10', 0).flatMap((number) => number.bits).some((bit) => bit.fixed)).toBe(false);
  });

  it('shows the block with its mask and the owner with its IP and title', () => {
    expect(card(START)).toMatchObject({ deviceId: 'your-laptop', pieceId: YOU, block: '192.168.1.0/24', prefix: 24, blockNumbers: 3, mask: '255.255.255.0', ownerIp: '192.168.1.10', trayId: 'bin', entity: { kind: 'device', variant: 'laptop' } });
    expect(card(START).title).toBe('[[tu-laptop]]');
    expect(card(withBlock('192.168.0.0/16'))).toMatchObject({ prefix: 16, mask: '255.255.0.0' });
    expect(card(withBlock('192.168.1.0/28'))).toMatchObject({ prefix: 28, blockNumbers: null, mask: '255.255.255.240' });
  });

  it('an IP is split at the prefix into the part of the block and the part of the device, and only for a prefix that ends at a dot', () => {
    expect(splitIp('192.168.1.21', 24)).toEqual({ block: '192.168.1.', device: '21' });
    expect(splitIp('192.168.1.21', 16)).toEqual({ block: '192.168.', device: '1.21' });
    expect(splitIp('192.168.1.21', 8)).toEqual({ block: '192.', device: '168.1.21' });
    for (const prefix of [0, 20, 28, 32]) expect(splitIp('192.168.1.21', prefix), String(prefix)).toBeNull();
    const items = [...card(START).waiting, ...card(START).bins.flatMap((bin) => bin.items)];
    expect(items.map((item) => [item.deviceId, item.split])).toEqual([
      [PRINTER, { block: '192.168.1.', device: '21' }],
      [ANDRES, { block: '192.168.2.', device: '15' }],
    ]);
    expect(card(withBlock('192.168.1.0/28')).waiting.map((item) => item.split)).toEqual([null, null]);
  });

  it('an item with no answer waits to be classified and an answered one is in its bin', () => {
    expect(card(START).waiting.map((item) => item.deviceId)).toEqual([PRINTER, ANDRES]);
    expect(card(START).bins.map((bin) => bin.items)).toEqual([[], []]);
    expect(card(START).bins.map((bin) => [bin.id, bin.name])).toEqual([['inside', 'Dentro de 192.168.1.0/24'], ['outside', 'Fuera']]);
    const printerIn = place(START, PRINTER, 'inside');
    expect(card(printerIn).waiting.map((item) => item.deviceId)).toEqual([ANDRES]);
    expect(card(printerIn).bins.map((bin) => bin.items.map((item) => item.deviceId))).toEqual([[PRINTER], []]);
    const bothOut = place(printerIn, ANDRES, 'outside');
    expect(card(bothOut).waiting).toEqual([]);
    expect(card(bothOut).bins.map((bin) => bin.items.map((item) => item.deviceId))).toEqual([[PRINTER], [ANDRES]]);
    expect(card(place(bothOut, PRINTER, 'outside')).bins.map((bin) => bin.items.map((item) => item.deviceId))).toEqual([[], [PRINTER, ANDRES]]);
  });

  it('the line of a placed item says whether it fits, with the first numbers of its IP and the block', () => {
    const placed = place(place(START, PRINTER, 'inside'), ANDRES, 'outside');
    const lines = card(placed).bins.flatMap((bin) => bin.items).map((item) => [item.deviceId, item.line?.fits, item.line?.right, toPlainText(item.line?.text ?? '')]);
    expect(lines).toEqual([
      [PRINTER, true, true, 'Sus tres primeros números, 192.168.1, son los del bloque: cabe.'],
      [ANDRES, false, true, 'Sus tres primeros números, 192.168.2, no son 192.168.1: no cabe.'],
    ]);
    const swapped = place(place(START, PRINTER, 'outside'), ANDRES, 'inside');
    expect(card(swapped).bins.flatMap((bin) => bin.items).map((item) => [item.deviceId, item.line?.fits, item.line?.right])).toEqual([
      [ANDRES, false, false],
      [PRINTER, true, false],
    ]);
    expect(card(START).waiting.every((item) => item.line === null)).toBe(true);
  });

  it('writes the line with bits when the prefix does not end at a dot', () => {
    const placed = place(place(withBlock('192.168.1.0/28'), PRINTER, 'outside'), ANDRES, 'outside');
    expect(card(placed).bins[1].items.map((item) => toPlainText(item.line?.text ?? ''))).toEqual([
      'Sus primeros 28 bits no son los del bloque 192.168.1.0/28: no cabe.',
      'Sus primeros 28 bits no son los del bloque 192.168.1.0/28: no cabe.',
    ]);
    expect(toPlainText(card(place(withBlock('192.168.1.0/24'), PRINTER, 'inside')).bins[0].items[0].line?.text ?? '')).toContain('cabe');
  });

  it('only the owner of the card has it, and an answer outside the two bins leaves the item waiting', () => {
    expect(classifyCard(START, PIECE_ID.device(PRINTER))).toBeNull();
    expect(classifyCard(START, PIECE_ID.device(ANDRES))).toBeNull();
    expect(classifyCard(START, PIECE_ID.device('ghost'))).toBeNull();
    const identifying = identifyIncident();
    const plain = startSession([identifying], identifying.id);
    expect(classifyCard(plain, YOU)).toBeNull();
    expect(card({ ...START, answers: { [PRINTER]: { bin: 'nowhere' } } }).waiting.map((item) => item.deviceId)).toEqual([PRINTER, ANDRES]);
  });
});

describe('insideBlockPieces', () => {
  it('holds the owner from the start and each item once the player placed it in the first bin', () => {
    expect([...insideBlockPieces(START)]).toEqual([YOU]);
    const printerIn = place(START, PRINTER, 'inside');
    expect([...insideBlockPieces(printerIn)]).toEqual([YOU, PIECE_ID.device(PRINTER)]);
    expect([...insideBlockPieces(place(printerIn, ANDRES, 'outside'))]).toEqual([YOU, PIECE_ID.device(PRINTER)]);
    expect([...insideBlockPieces(place(printerIn, PRINTER, 'outside'))]).toEqual([YOU]);
  });

  it('is empty for an incident with no card that classifies', () => {
    const identifying = identifyIncident();
    expect([...insideBlockPieces(startSession([identifying], identifying.id))]).toEqual([]);
  });
});
