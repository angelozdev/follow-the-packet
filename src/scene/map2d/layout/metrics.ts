import { parseTermText, toPlainText, type TermSegment, type TermText } from '@/copy';

export const CELL = 7.2;
export const LABEL_PAD = 14;
export const LABEL_HEIGHT = 20;
export const LINE_HEIGHT = 16;
export const LOCK_WIDTH = 26;
export const ALERT_WIDTH = 22;
export const MAX_NAME_LENGTH = 32;

export interface LabelExtras {
  locked?: boolean;
  alert?: boolean;
}

export interface LabelBox {
  width: number;
  height: number;
}

/** Returns how many cells a text takes in the monospaced font: one for every character the player sees, an accented letter and an arrow included, whether the accent is composed or not. */
export function characterCount(text: string): number {
  return Array.from(text.normalize('NFC')).length;
}

/** Takes the text of a label (with its term and name tags) and whether it wears the lock and the alert; returns its width in whole pixels, rounded up so the model errs wide against the 7.2 px cell: the cells of the text read by the player, the padding and border, and the lock and the alert when they are there. */
export function labelWidth(text: TermText, { locked = false, alert = false }: LabelExtras = {}): number {
  const textWidth = Math.ceil(characterCount(toPlainText(text)) * CELL);
  return textWidth + LABEL_PAD + (locked ? LOCK_WIDTH : 0) + (alert ? ALERT_WIDTH : 0);
}

function plainWords(segments: TermSegment[]): string {
  return segments
    .map((segment) => segment.text)
    .join('')
    .trim();
}

/** Takes the text of a label that names a resource, such as the label of a firewall, and returns its lines: the words before the name of the resource (the name of its term) and the name of the resource. A label with no resource name, or that is only a name, is one line. */
export function labelLines(text: TermText): string[] {
  const segments = parseTermText(text);
  const nameAt = segments.findIndex((segment) => segment.kind === 'name');
  if (nameAt <= 0) return [plainWords(segments)];
  return [plainWords(segments.slice(0, nameAt)), plainWords(segments.slice(nameAt))];
}

/** Takes the lines of a label and returns its box: as wide as its longest line, 20 px tall for the first line and 16 px more for each other line. The lock and the alert are not counted: where they sit in a label of two lines is not decided. */
export function labelBox(lines: readonly string[]): LabelBox {
  return { width: Math.max(...lines.map((line) => labelWidth(line))), height: LABEL_HEIGHT + (lines.length - 1) * LINE_HEIGHT };
}
