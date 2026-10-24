import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';

const CHAPTER = 3;

describe('the incidents of chapter 3', () => {
  it('are registered in order, from 03-01 with no gap', () => {
    const chapter = INCIDENTS.filter((incident) => incident.chapter === CHAPTER);
    expect(chapter.map(({ id }) => id)).toEqual(chapter.map((_, index) => `03-${String(index + 1).padStart(2, '0')}`));
  });
});
