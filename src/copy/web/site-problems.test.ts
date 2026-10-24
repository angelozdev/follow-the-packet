import { describe, expect, it } from 'vitest';
import { SITE_PROBLEMS } from '@/engine';
import { toPlainText } from '@/copy/term-text';
import { SITE_PROBLEM_TEXT } from './site-problems';

describe('the sentences of a site the engine does not take', () => {
  it('has a text for every code the engine gives, and no other', () => {
    expect(Object.keys(SITE_PROBLEM_TEXT).sort()).toEqual([...SITE_PROBLEMS].sort());
    for (const code of SITE_PROBLEMS) expect(toPlainText(SITE_PROBLEM_TEXT[code]), code).not.toBe('');
  });

  it('says what each code means in plain words, with no code on the screen and no term the player has not met', () => {
    for (const text of Object.values(SITE_PROBLEM_TEXT)) {
      expect(text).not.toMatch(/[a-z]+-[a-z]+-|\{\{/);
    }
    expect(SITE_PROBLEM_TEXT['name-has-site']).toContain('un solo sitio por nombre');
  });
});
