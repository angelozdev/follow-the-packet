import { describe, expect, it } from 'vitest';
import { docChapters, docTiers, syllabusChapters } from '@/testing';
import { CHAPTERS, TIERS } from './chapters';

const CHAPTER_COUNT = 33;
const COURSE_INTRODUCTION = 1;

describe('chapters', () => {
  it('match the chapter map of the chapters doc, in game order', () => {
    expect(CHAPTERS.map(({ number, tier, title, modules, optional = false }) => ({ number, tier, title, modules, optional }))).toEqual(docChapters());
  });

  it('there are 33, numbered from 1', () => {
    expect(CHAPTERS.map((chapter) => chapter.number)).toEqual(Array.from({ length: CHAPTER_COUNT }, (_, index) => index + 1));
  });

  it('their levels match the levels of the chapters doc', () => {
    expect(TIERS).toEqual(docTiers());
  });

  it('name only modules of syllabus.md', () => {
    const modules = new Set(syllabusChapters().map((module) => module.number));
    expect(CHAPTERS.flatMap((chapter) => chapter.modules).filter((module) => !modules.has(module))).toEqual([]);
  });

  it('play every course module but the introduction', () => {
    const played = new Set(CHAPTERS.flatMap((chapter) => chapter.modules));
    expect(syllabusChapters().filter((module) => !played.has(module.number)).map((module) => module.number)).toEqual([COURSE_INTRODUCTION]);
  });
});
