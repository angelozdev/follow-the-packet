import { nameTag, parseTermText, toPlainText, type TermSegment, type TermText } from '@/copy';
import { characterCount, labelLines, labelWidth, type LabelExtras } from './metrics';

export const MIN_CUT = 12;
export const ELLIPSIS = '…';

function tagged(segment: TermSegment): TermText {
  if (segment.kind === 'name') return nameTag(segment.text);
  return segment.kind === 'term' ? `{{${segment.id}|${segment.text}}}` : segment.text;
}

function isOneLine(text: TermText): boolean {
  return labelLines(text).length === 1;
}

/** Takes the text of a label and the most characters it may show; returns it as it is when it has two lines or no more characters than that, and otherwise its first characters and an ellipsis, so it shows that many in all (never fewer than `MIN_CUT`), keeping the tags of its names and terms. */
export function cutLabel(text: TermText, characters: number): TermText {
  const shown = Math.max(characters, MIN_CUT);
  if (!isOneLine(text) || characterCount(toPlainText(text)) <= shown) return text;
  let remaining = shown - 1;
  const kept: TermSegment[] = [];
  for (const segment of parseTermText(text)) {
    if (remaining <= 0) break;
    const letters = Array.from(segment.text.normalize('NFC'));
    kept.push({ ...segment, text: letters.slice(0, remaining).join('') });
    remaining -= letters.length;
  }
  kept[kept.length - 1].text += ELLIPSIS;
  return kept.map(tagged).join('');
}

/** Takes the text of a label, what it wears and the width of the box the layout gave it; returns the text cut to the most characters whose label still fits that box, or the text itself when it fits, when it has two lines or when not even `MIN_CUT` characters would fit. */
export function labelFitting(text: TermText, extras: LabelExtras, boxWidth: number): TermText {
  if (!isOneLine(text) || labelWidth(text, extras) <= boxWidth) return text;
  for (let characters = characterCount(toPlainText(text)) - 1; characters >= MIN_CUT; characters--) {
    const cut = cutLabel(text, characters);
    if (labelWidth(cut, extras) <= boxWidth) return cut;
  }
  return text;
}

/** Takes the pieces of a map and the most characters a label may show; returns the pieces with every label of one line cut to that many (`cutLabel`). */
export function cutPieces<T extends { label: TermText }>(pieces: readonly T[], characters: number): T[] {
  return pieces.map((piece) => ({ ...piece, label: cutLabel(piece.label, characters) }));
}

/** Takes the pieces of a map; returns the characters of the longest label of one line among them, 0 when there is none. */
export function longestLabel(pieces: readonly { label: TermText }[]): number {
  return Math.max(0, ...pieces.filter(({ label }) => isOneLine(label)).map(({ label }) => characterCount(toPlainText(label))));
}
