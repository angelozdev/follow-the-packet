import { describe, expect, it } from 'vitest';
import { parseTermText, termsIn, toPlainText, unofficialNames } from './term-text';

describe('parseTermText', () => {
  it('keeps a text without tags as one plain segment', () => {
    expect(parseTermText('servidor1 no contesta.')).toEqual([{ kind: 'text', text: 'servidor1 no contesta.' }]);
  });

  it('shows a tag with the official name of its term', () => {
    expect(parseTermText('Mira el {{security-group}} de servidor2.')).toEqual([
      { kind: 'text', text: 'Mira el ' },
      { kind: 'term', id: 'security-group', text: 'Security Group' },
      { kind: 'text', text: ' de servidor2.' },
    ]);
  });

  it('a tag can show its own words', () => {
    expect(parseTermText('{{inbound-rule|Reglas de entrada}}')).toEqual([{ kind: 'term', id: 'inbound-rule', text: 'Reglas de entrada' }]);
  });

  it('parses a resource name as its own segment', () => {
    const text = '{{security-group}} [[servidor2]]';
    expect(parseTermText(text)).toEqual([
      { kind: 'term', id: 'security-group', text: 'Security Group' },
      { kind: 'text', text: ' ' },
      { kind: 'name', text: 'servidor2' },
    ]);
    expect(toPlainText(text)).toBe('Security Group servidor2');
  });

  it('rejects a name tag that is not closed', () => {
    expect(() => parseTermText('[[servidor2')).toThrow('malformed term tag: [[servidor2');
  });

  it('rejects a tag whose term is not registered', () => {
    expect(() => parseTermText('La {{puerta}} bloquea.')).toThrow('unknown term: puerta');
  });

  it.each([
    ['capitals in the id', '{{Security-Group}}', 'unknown term: Security-Group'],
    ['an underscore in the id', '{{security_group}}', 'unknown term: security_group'],
    ['spaces around the id', '{{ security-group }}', 'unknown term:  security-group '],
    ['an empty word after the bar', '{{rule|}}', 'malformed term tag: {{rule|}}'],
    ['a tag opened inside the words', '{{rule|a {{b}}', 'unknown term: b'],
    ['a name every object inherits', '{{constructor}}', 'unknown term: constructor'],
    ['an unclosed tag', 'La {{rule falla.', 'malformed term tag: {{rule falla.'],
    ['a stray closing brace pair', 'La rule}} falla.', 'malformed term tag: }}'],
    ['a stray closing name tag', 'servidor2]] falla.', 'malformed term tag: ]]'],
  ])('rejects a malformed tag: %s', (_name, text, message) => {
    expect(() => parseTermText(text)).toThrow(message);
    expect(() => termsIn(text)).toThrow(message);
    expect(() => toPlainText(text)).toThrow(message);
  });
});

describe('termsIn and toPlainText', () => {
  const text = 'Un {{ping}} pasa si una {{inbound-rule}} del {{security-group}} lo permite.';

  it('lists the terms in order', () => {
    expect(termsIn(text)).toEqual(['ping', 'inbound-rule', 'security-group']);
  });

  it('reads the way the player sees it', () => {
    expect(toPlainText(text)).toBe('Un ping pasa si una regla de entrada del Security Group lo permite.');
  });

  it('does not count a resource name as a term', () => {
    expect(termsIn('El {{security-group}} de [[servidor2]]')).toEqual(['security-group']);
  });
});

describe('unofficialNames', () => {
  it('accepts the official name and the registered short form', () => {
    expect(unofficialNames(['El {{security-group}} de servidor2', '{{security-group|SG}} servidor1', 'Sin términos'])).toEqual([]);
  });

  it('ignores a resource name, whatever its words', () => {
    expect(unofficialNames(['{{security-group}} [[puerta]]'])).toEqual([]);
  });

  it('names each term shown with other words', () => {
    expect(unofficialNames(['La {{security-group|puerta}} de servidor2', '{{anywhere-ipv4|Todo internet}}'])).toEqual([
      'security-group: puerta',
      'anywhere-ipv4: Todo internet',
    ]);
  });
});
