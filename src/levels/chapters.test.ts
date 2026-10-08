import { describe, expect, it } from 'vitest';
import { syllabusChapters } from '../test-utils/repo';
import { CHAPTERS } from './chapters';

describe('capítulos', () => {
  it('coinciden con los módulos de syllabus.md', () => {
    expect(CHAPTERS).toEqual(syllabusChapters());
  });

  it('son 20', () => {
    expect(CHAPTERS).toHaveLength(20);
  });
});
