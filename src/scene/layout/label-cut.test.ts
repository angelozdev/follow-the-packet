import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag, parseTermText, toPlainText } from '@/copy';
import { NAME_SERVERS, OFFICE_FLOORS, officeTwoFloorsNet } from '@/testing';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { MIN_WIDTH, type RowLayout, type RowPiece } from './arrange/geometry';
import { layoutStack } from './arrange/stack';
import { ELLIPSIS, MIN_CUT, cutLabel, cutPieces, labelFitting, longestLabel } from './label-cut';
import { layoutMap } from './map-layout';
import { characterCount, labelWidth } from './metrics';

const WORLD = officeTwoFloorsNet();
const LONG_NAME = NAME_SERVERS.down.id;
const LONG_LABEL = nameTag(LONG_NAME);
const SERVER_ID = `device:${OFFICE_FLOORS.server.id}`;
const FIREWALL_ID = 'firewall:your-firewall';
const LOCKED = { locked: true };
const WIDEST_NAME = 'x'.repeat(32);
const WHOLE_LABEL_FITS_FROM = 382;
const WIDENED_AT_360 = 384;
const SCREENS = Array.from({ length: 41 }, (_, step) => MIN_WIDTH + step);

const withServerNamed = (name: string): RowPiece[] => FLOORS_LABEL_PIECES.map((piece) => (piece.id === SERVER_ID ? { ...piece, label: nameTag(name), locked: true } : piece));
const withWideFirewall = (pieces: RowPiece[]): RowPiece[] => pieces.map((piece) => (piece.kind === 'firewall' ? { ...piece, label: MAP_TEXT.firewall['host-firewall'](WIDEST_NAME) } : piece));
const shownCharacters = (text: string) => characterCount(toPlainText(text));
const keptOf = (layout: RowLayout) => shownCharacters(labelFitting(LONG_LABEL, LOCKED, layout.labels[SERVER_ID].width));

describe('cutLabel', () => {
  it('keeps the first characters and ends in an ellipsis, so the label shows as many characters as it is given', () => {
    const cut = cutLabel(LONG_LABEL, 26);
    expect(ELLIPSIS).toBe('…');
    expect(toPlainText(cut)).toBe('servidor-autoritativo-not…');
    expect(shownCharacters(cut)).toBe(26);
  });

  it('keeps the name tag of a name', () => {
    expect(parseTermText(cutLabel(LONG_LABEL, 26))).toEqual([{ kind: 'name', text: 'servidor-autoritativo-not…' }]);
  });

  it('keeps the term of a label and the words after it, and cuts inside the term when the cut falls there', () => {
    const label = '{{router}} de la oficina de Lucía';
    const plain = toPlainText(label);
    const cut = cutLabel(label, 20);
    expect(toPlainText(cut)).toBe(`${plain.slice(0, 19)}${ELLIPSIS}`);
    expect(parseTermText(cut).map(({ kind }) => kind)).toEqual(['term', 'text']);
    const floor = parseTermText(cutLabel('{{router|Enrutador de la oficina}} de Lucía', MIN_CUT));
    expect(floor.map(({ kind }) => kind)).toEqual(['term']);
    expect(floor.map(({ text }) => text).join('')).toBe('Enrutador d…');
  });

  it('counts an accented letter as one character, composed or not', () => {
    const composed = nameTag('laptop-lucía-lucía-lucía');
    const decomposed = nameTag('laptop-lucía-lucía-lucía'.normalize('NFD'));
    expect(toPlainText(cutLabel(composed, 14))).toBe('laptop-lucía-…');
    expect(toPlainText(cutLabel(decomposed, 14))).toBe('laptop-lucía-…');
  });

  it('leaves a label that has no more characters than it is given', () => {
    expect(cutLabel(nameTag('laptop-lucia'), 12)).toBe(nameTag('laptop-lucia'));
    expect(cutLabel(LONG_LABEL, 30)).toBe(LONG_LABEL);
    expect(cutLabel(LONG_LABEL, 99)).toBe(LONG_LABEL);
  });

  it('never leaves fewer than 12 characters, however few it is given', () => {
    expect(MIN_CUT).toBe(12);
    for (const given of [0, 1, 5, 11]) expect(shownCharacters(cutLabel(LONG_LABEL, given)), `${given}`).toBe(MIN_CUT);
  });

  it('never cuts a label of two lines, the word of its term and the name of its resource', () => {
    const firewall = MAP_TEXT.firewall['host-firewall'](LONG_NAME);
    expect(cutLabel(firewall, MIN_CUT)).toBe(firewall);
  });
});

describe('labelFitting', () => {
  it('is the label itself when its box holds it', () => {
    expect(labelFitting(LONG_LABEL, LOCKED, labelWidth(LONG_LABEL, LOCKED))).toBe(LONG_LABEL);
    expect(labelFitting(LONG_LABEL, LOCKED, 1000)).toBe(LONG_LABEL);
  });

  it('cuts to the most characters whose label, with the lock, still fits the box', () => {
    for (let box = labelWidth(cutLabel(LONG_LABEL, MIN_CUT), LOCKED); box < labelWidth(LONG_LABEL, LOCKED); box++) {
      const shown = labelFitting(LONG_LABEL, LOCKED, box);
      expect(labelWidth(shown, LOCKED), `${box} px`).toBeLessThanOrEqual(box);
      expect(labelWidth(cutLabel(LONG_LABEL, shownCharacters(shown) + 1), LOCKED), `${box} px`).toBeGreaterThan(box);
    }
    expect(toPlainText(labelFitting(LONG_LABEL, LOCKED, 224))).toBe('servidor-autoritativo-not…');
  });

  it('gives the lock and the alert their room: the same box holds fewer characters', () => {
    expect(shownCharacters(labelFitting(LONG_LABEL, {}, 224))).toBe(29);
    expect(shownCharacters(labelFitting(LONG_LABEL, LOCKED, 224))).toBe(26);
    expect(shownCharacters(labelFitting(LONG_LABEL, { locked: true, alert: true }, 224))).toBe(22);
  });

  it('leaves the label whole when its box holds fewer than 12 characters, and cuts to 12 when it holds them', () => {
    const twelve = labelWidth(cutLabel(LONG_LABEL, MIN_CUT), LOCKED);
    expect(labelFitting(LONG_LABEL, LOCKED, twelve - 1)).toBe(LONG_LABEL);
    expect(shownCharacters(labelFitting(LONG_LABEL, LOCKED, twelve))).toBe(MIN_CUT);
  });

  it('never cuts a label of two lines, whatever its box', () => {
    const firewall = MAP_TEXT.firewall['host-firewall'](LONG_NAME);
    expect(labelFitting(firewall, LOCKED, 40)).toBe(firewall);
  });
});

describe('cutPieces and longestLabel', () => {
  const pieces = withWideFirewall(withServerNamed(LONG_NAME));

  it('cuts the label of every piece to the characters it is told and leaves the label of two lines as it is', () => {
    const cut = cutPieces(pieces, 20);
    expect(cut.map(({ id, label }) => [id, label])).toEqual(pieces.map(({ id, label }) => [id, cutLabel(label, 20)]));
    expect(cut.find(({ id }) => id === SERVER_ID)?.label).toBe(cutLabel(LONG_LABEL, 20));
    expect(cut.find(({ id }) => id === FIREWALL_ID)?.label).toBe(pieces.find(({ id }) => id === FIREWALL_ID)?.label);
  });

  it('counts the characters of the longest label of one line, and ignores the labels of two lines', () => {
    expect(longestLabel(pieces)).toBe(characterCount(LONG_NAME));
    expect(longestLabel(withWideFirewall(FLOORS_LABEL_PIECES))).toBe(characterCount('servidor-internet'));
    expect(longestLabel([])).toBe(0);
  });
});

describe('layoutMap with a label of one line that would make the map wider than its screen', () => {
  const pieces = withServerNamed(LONG_NAME);

  it('has the whole name, locked, widen the snake at 360 px when the rule is not applied', () => {
    expect(layoutStack(WORLD, pieces, MIN_WIDTH).size.width).toBe(WIDENED_AT_360);
  });

  it('cuts it to the characters that fit and keeps its lock, and the map is as wide as its screen', () => {
    const layout = layoutMap(WORLD, pieces, { width: MIN_WIDTH });
    expect(layout.mode).toBe('stack');
    expect(layout.size.width).toBe(MIN_WIDTH);
    expect(layout.labels[SERVER_ID].width).toBe(labelWidth(cutLabel(LONG_LABEL, 26), LOCKED));
    expect(toPlainText(labelFitting(LONG_LABEL, LOCKED, layout.labels[SERVER_ID].width))).toBe('servidor-autoritativo-not…');
  });

  it('cuts fewer characters the more room the map has, and none once the whole label fits, and the map is never wider than its screen', () => {
    const kept = SCREENS.map((width) => keptOf(layoutMap(WORLD, pieces, { width })));
    SCREENS.forEach((width, index) => {
      expect(layoutMap(WORLD, pieces, { width }).size.width, `${width} px`).toBe(width);
      if (index > 0) expect(kept[index], `${width} px`).toBeGreaterThanOrEqual(kept[index - 1]);
      if (width >= WHOLE_LABEL_FITS_FROM) expect(kept[index], `${width} px`).toBe(characterCount(LONG_NAME));
    });
    expect(kept[0]).toBeGreaterThanOrEqual(MIN_CUT);
    expect(kept[SCREENS.indexOf(375)]).toBeGreaterThan(kept[0]);
    expect(kept[SCREENS.indexOf(WHOLE_LABEL_FITS_FROM - 1)]).toBeLessThan(characterCount(LONG_NAME));
  });

  it('cuts the most characters that fit: with one more, the snake would be wider than its screen', () => {
    for (const width of SCREENS.filter((each) => each < WHOLE_LABEL_FITS_FROM)) {
      const characters = keptOf(layoutMap(WORLD, pieces, { width }));
      expect(layoutStack(WORLD, cutPieces(pieces, characters), width).size.width, `${width} px`).toBe(width);
      expect(layoutStack(WORLD, cutPieces(pieces, characters + 1), width).size.width, `${width} px`).toBeGreaterThan(width);
    }
  });

  it('applies one shared count to the map: every label of one line no longer than it keeps its whole text', () => {
    const layout = layoutMap(WORLD, pieces, { width: MIN_WIDTH });
    const others = pieces.filter(({ id, kind }) => id !== SERVER_ID && kind !== 'firewall');
    expect(others.length).toBeGreaterThan(4);
    for (const piece of others) expect(layout.labels[piece.id].width, piece.id).toBe(labelWidth(piece.label, { locked: piece.locked, alert: piece.state === 'intruded' }));
  });

  it('leaves the snake as it always was when the whole label fits', () => {
    for (const width of [WHOLE_LABEL_FITS_FROM, 390, 768, 900]) {
      expect(layoutMap(WORLD, pieces, { width }), `${width} px`).toEqual({ ...layoutStack(WORLD, pieces, width), mode: 'stack' });
    }
  });

  it('cuts nothing when 12 characters would still leave the map wider than its screen, and never cuts the label of two lines that is the cause: the map widens as it always did', () => {
    const wide = withWideFirewall(pieces);
    expect(layoutStack(WORLD, cutPieces(wide, MIN_CUT), MIN_WIDTH).size.width).toBeGreaterThan(MIN_WIDTH);
    for (const width of [MIN_WIDTH, 390, 420]) {
      const layout = layoutMap(WORLD, wide, { width });
      expect(layout, `${width} px`).toEqual({ ...layoutStack(WORLD, wide, width), mode: 'stack' });
      expect(layout.size.width, `${width} px`).toBeGreaterThan(width);
      expect(layout.labels[SERVER_ID].width, `${width} px`).toBe(labelWidth(LONG_LABEL, LOCKED));
      expect(layout.labels[FIREWALL_ID].width, `${width} px`).toBe(labelWidth(WIDEST_NAME, LOCKED));
    }
  });
});
