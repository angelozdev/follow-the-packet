import { TERMS, isTermId, type Term, type TermId } from './terms';

export type TermText = string;

export type TermSegment = { kind: 'text'; text: string } | { kind: 'term'; id: TermId; text: string };

const TAG = /\{\{([^}|]+)(?:\|([^{}]+))?\}\}/g;
const BROKEN_TAG = /\{\{[^}]*\}{0,2}|\}\}/;

function plain(text: string): TermSegment {
  const broken = BROKEN_TAG.exec(text);
  if (broken) throw new Error(`malformed term tag: ${broken[0]}`);
  return { kind: 'text', text };
}

/** Splits a text into plain and term segments: `{{term-id}}` shows the term's name and `{{term-id|words}}` shows the given words; throws on an unregistered term and on any `{{` or `}}` that is not a well-formed tag. */
export function parseTermText(text: TermText): TermSegment[] {
  const segments: TermSegment[] = [];
  const tags = new RegExp(TAG);
  let cursor = 0;
  for (let match = tags.exec(text); match !== null; match = tags.exec(text)) {
    const [tag, id, words] = match;
    if (!isTermId(id)) throw new Error(`unknown term: ${id}`);
    if (match.index > cursor) segments.push(plain(text.slice(cursor, match.index)));
    segments.push({ kind: 'term', id, text: words ?? TERMS[id].name });
    cursor = match.index + tag.length;
  }
  if (cursor < text.length) segments.push(plain(text.slice(cursor)));
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

/** Returns, as "term-id: words", every term the texts show with words other than its official name or its short form. */
export function unofficialNames(texts: TermText[]): string[] {
  return texts.flatMap((text) =>
    parseTermText(text).flatMap((segment) => {
      if (segment.kind === 'text') return [];
      const term: Term = TERMS[segment.id];
      return segment.text === term.name || segment.text === term.short ? [] : [`${segment.id}: ${segment.text}`];
    }),
  );
}
