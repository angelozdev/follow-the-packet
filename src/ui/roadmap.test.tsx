// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ROADMAP_TEXT } from '@/copy';
import type { LevelEntry } from '@/levels';
import { Roadmap } from './roadmap';

const LEVELS: LevelEntry[] = [
  { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
  { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
  { id: '04-03', chapter: 4, order: 3, title: 'El intruso', role: 'attacker' },
];
const EARNED_STARS = 2;

function levelItem(id: string): HTMLElement {
  const item = document.querySelector<HTMLElement>(`[data-level-id="${id}"]`);
  if (!item) throw new Error(`missing level ${id}`);
  return item;
}

afterEach(cleanup);

describe('roadmap with levels', () => {
  it('shows how many levels of the chapter have a star', () => {
    render(<Roadmap levels={LEVELS} progress={{ '04-01': EARNED_STARS }} />);
    expect(screen.getByText('1/3')).toBeTruthy();
  });

  it('links the first level to its page', () => {
    render(<Roadmap levels={LEVELS} progress={{}} />);
    expect(screen.getByRole('link', { name: '1. El primer ping' }).getAttribute('href')).toBe('#/level/04-01');
  });

  it('locks a level until the previous one has a star', () => {
    render(<Roadmap levels={LEVELS} progress={{ '04-01': EARNED_STARS }} />);
    expect(screen.getByRole('link', { name: '2. Abre lo justo' }).getAttribute('href')).toBe('#/level/04-02');
    const locked = levelItem('04-03');
    expect(within(locked).queryByRole('link')).toBeNull();
    expect(locked.textContent).toContain(ROADMAP_TEXT.locked);
  });

  it('reads the stars of a level to screen readers', () => {
    render(<Roadmap levels={LEVELS} progress={{ '04-01': EARNED_STARS }} />);
    expect(within(levelItem('04-01')).getByText(ROADMAP_TEXT.starsOf(EARNED_STARS))).toBeTruthy();
  });
});
