import { TERMS, isTermId, type Term, type TermId } from './terms';

export type TermText = string;

export type TermSegment = { kind: 'text'; text: string } | { kind: 'term'; id: TermId; text: string } | { kind: 'name'; text: string };

const TAG = /\{\{([^}|]+)(?:\|([^{}]+))?\}\}|\[\[([^[\]{}]+)\]\]/g;
const BROKEN_TAG = /\{\{[^}]*\}{0,2}|\}\}|\[\[[^\]]*\]{0,2}|\]\]/;

function plain(text: string): TermSegment {
  const broken = BROKEN_TAG.exec(text);
  if (broken) throw new Error(`malformed term tag: ${broken[0]}`);
  return { kind: 'text', text };
}

function taggedSegment([, id, words, name]: RegExpExecArray): TermSegment {
  if (name !== undefined) return { kind: 'name', text: name };
  if (!isTermId(id)) throw new Error(`unknown term: ${id}`);
  return { kind: 'term', id, text: words ?? TERMS[id].name };
}

/** Marks a resource's or actor's own name, so the player sees it apart from the entity: `[[servidor2]]`. */
export function nameTag(name: string): TermText {
  return `[[${name}]]`;
}

/** Writes a word as the tagged term when the player knows it, and as the plain word before. */
export function word(known: ReadonlySet<TermId>, term: TermId, text: string): TermText {
  return known.has(term) ? `{{${term}|${text}}}` : text;
}

/** Splits a text into plain, term and name segments: `{{term-id}}` shows the term's name, `{{term-id|words}}` shows the given words and `[[name]]` shows a resource's own name; throws on an unregistered term and on any `{{`, `}}`, `[[` or `]]` that is not a well-formed tag. */
export function parseTermText(text: TermText): TermSegment[] {
  const segments: TermSegment[] = [];
  const tags = new RegExp(TAG);
  let cursor = 0;
  for (let match = tags.exec(text); match !== null; match = tags.exec(text)) {
    const segment = taggedSegment(match);
    if (match.index > cursor) segments.push(plain(text.slice(cursor, match.index)));
    segments.push(segment);
    cursor = match.index + match[0].length;
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
      if (segment.kind !== 'term') return [];
      const term: Term = TERMS[segment.id];
      return segment.text === term.name || segment.text === term.short ? [] : [`${segment.id}: ${segment.text}`];
    }),
  );
}
