import { describe, expect, it } from 'vitest';
import { parseTermText, termsIn, toPlainText } from './term-text';

describe('parseTermText', () => {
  it('keeps a text without tags as one plain segment', () => {
    expect(parseTermText('servidor1 no contesta.')).toEqual([{ kind: 'text', text: 'servidor1 no contesta.' }]);
  });

  it('shows a tag with the name of its term', () => {
    expect(parseTermText('Mira la {{security-group}} de servidor2.')).toEqual([
      { kind: 'text', text: 'Mira la ' },
      { kind: 'term', id: 'security-group', text: 'puerta' },
      { kind: 'text', text: ' de servidor2.' },
    ]);
  });

  it('a tag can show its own words', () => {
    expect(parseTermText('{{rule|Reglas}}')).toEqual([{ kind: 'term', id: 'rule', text: 'Reglas' }]);
  });

  it('rejects a tag whose term is not registered', () => {
    expect(() => parseTermText('El {{firewall}} bloquea.')).toThrow('unknown term: firewall');
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
  ])('rejects a malformed tag: %s', (_name, text, message) => {
    expect(() => parseTermText(text)).toThrow(message);
    expect(() => termsIn(text)).toThrow(message);
    expect(() => toPlainText(text)).toThrow(message);
  });
});

describe('termsIn and toPlainText', () => {
  const text = 'Un {{ping}} pasa si una {{rule|regla}} de la {{security-group}} lo permite.';

  it('lists the terms in order', () => {
    expect(termsIn(text)).toEqual(['ping', 'rule', 'security-group']);
  });

  it('reads the way the player sees it', () => {
    expect(toPlainText(text)).toBe('Un ping pasa si una regla de la puerta lo permite.');
  });
});
