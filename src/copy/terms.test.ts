import { describe, expect, it } from 'vitest';
import { TERMS, isTermId } from './terms';

const MAX_DEFINITION_LENGTH = 120;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

describe('term registry', () => {
  it.each(Object.entries(TERMS))('%s has a name and a short definition', (_id, term) => {
    expect(term.name.trim()).not.toBe('');
    expect(term.definition.trim()).not.toBe('');
    expect(term.definition.length).toBeLessThanOrEqual(MAX_DEFINITION_LENGTH);
  });

  it('ids are English kebab-case', () => {
    for (const id of Object.keys(TERMS)) expect(id).toMatch(KEBAB_CASE);
  });

  it('recognizes registered ids only', () => {
    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('firewall')).toBe(false);
    expect(isTermId('toString')).toBe(false);
  });
});
