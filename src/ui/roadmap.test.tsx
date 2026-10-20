// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ROADMAP_TEXT } from '@/copy';
import { INCIDENTS, TIERS, type LevelEntry } from '@/levels';
import { Roadmap } from './roadmap';

const LEVELS: LevelEntry[] = [
  { id: '04-01', chapter: 4, order: 1, title: 'El primer ping', role: 'defender' },
  { id: '04-02', chapter: 4, order: 2, title: 'Abre lo justo', role: 'defender' },
  { id: '04-03', chapter: 4, order: 3, title: 'El intruso', role: 'attacker' },
];
const EARNED_STARS = 2;
const FUNDAMENTALS = 'Nivel 1 · Fundamentos';
const CHAPTER_1_TITLE = 'Tu primer día';
const INCIDENTS_OF_CHAPTER_1 = 14;

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

describe('roadmap of the game chapters', () => {
  it('groups the chapters under a heading per level, in game order', () => {
    render(<Roadmap levels={LEVELS} progress={{}} />);
    expect(screen.getAllByRole('region')).toHaveLength(TIERS.length);
    const headings = within(screen.getByRole('region', { name: FUNDAMENTALS })).getAllByRole('heading');
    expect(headings.map((heading) => heading.textContent)).toEqual([FUNDAMENTALS, 'La noche de guardia', 'Tu cuenta de AWS']);
  });

  it('marks the optional chapter inside its title, and only that one', () => {
    render(<Roadmap levels={LEVELS} progress={{}} />);
    const marks = screen.getAllByText(ROADMAP_TEXT.optional);
    expect(marks).toHaveLength(1);
    expect(marks[0].closest('h2')).toHaveTextContent('Datos en movimiento');
  });
});

describe('roadmap of chapter 1', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('the roadmap lists the fourteen incidents of chapter 1 with their stars', () => {
    const consoleErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const earned: Record<string, number> = { '01-01': 3, '01-02': 2, '01-03': 1 };
    const opened = Object.keys(earned).length;
    render(<Roadmap levels={INCIDENTS} progress={earned} />);
    const incidents = INCIDENTS.filter(({ chapter }) => chapter === 1);
    expect(incidents).toHaveLength(INCIDENTS_OF_CHAPTER_1);
    expect(document.querySelectorAll('li[data-level-id^="01-"]')).toHaveLength(INCIDENTS_OF_CHAPTER_1);
    const chapter = screen.getByRole('heading', { level: 2, name: CHAPTER_1_TITLE }).closest('li');
    expect(chapter).toHaveTextContent(`${opened}/${INCIDENTS_OF_CHAPTER_1}`);
    incidents.forEach(({ id, order, title }, index) => {
      const item = levelItem(id);
      const name = `${order}. ${title}`;
      expect(item).toHaveTextContent(name);
      expect(item).toHaveTextContent(ROADMAP_TEXT.starsOf(earned[id] ?? 0));
      if (index <= opened) expect(within(item).getByRole('link', { name })).toHaveAttribute('href', `#/level/${id}`);
      else expect(item).toHaveTextContent(ROADMAP_TEXT.locked);
    });
    expect(consoleErrors).not.toHaveBeenCalled();
  });
});
