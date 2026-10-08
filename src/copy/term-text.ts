import { TERMS, isTermId, type TermId } from './terms';

export type TermText = string;

export type TermSegment = { kind: 'text'; text: string } | { kind: 'term'; id: TermId; text: string };

const TAG = /\{\{([a-z0-9-]+)(?:\|([^}]+))?\}\}/g;

/** Splits a text into plain and term segments: `{{term-id}}` shows the term's name and `{{term-id|words}}` shows the given words; throws on an unregistered term. */
export function parseTermText(text: TermText): TermSegment[] {
  const segments: TermSegment[] = [];
  const tags = new RegExp(TAG);
  let cursor = 0;
  for (let match = tags.exec(text); match !== null; match = tags.exec(text)) {
    const [tag, id, words] = match;
    if (!isTermId(id)) throw new Error(`unknown term: ${id}`);
    if (match.index > cursor) segments.push({ kind: 'text', text: text.slice(cursor, match.index) });
    segments.push({ kind: 'term', id, text: words ?? TERMS[id].name });
    cursor = match.index + tag.length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', text: text.slice(cursor) });
  return segments;
}

/** Returns the ids of the terms a text uses, in order of appearance. */
export function termsIn(text: TermText): TermId[] {
  return parseTermText(text).flatMap((segment) => (segment.kind === 'term' ? [segment.id] : []));
}

/** Returns the text as the player reads it, with every tag replaced by its words. */
export function toPlainText(text: TermText): string {
  return parseTermText(text)
    .map((segment) => segment.text)
    .join('');
}
