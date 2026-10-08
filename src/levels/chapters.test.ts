import { describe, expect, it } from 'vitest';
import { syllabusChapters } from '@/testing';
import { CHAPTERS } from './chapters';

describe('chapters', () => {
  it('match the modules of syllabus.md', () => {
    expect(CHAPTERS).toEqual(syllabusChapters());
  });

  it('there are 20', () => {
    expect(CHAPTERS).toHaveLength(20);
  });
});
