// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MAP_TEXT, stampLabel, type StampState } from '@/copy';
import { triggerSpies } from '@/testing/map-pieces';
import { MAP_MARKS } from '@/scene/html-layer';
import type { TriggerProps } from '@/scene/overlay/inspect-trigger';
import { MORE_SPECIMENS, StampButton, StampMore } from './stamp';

const STATES: StampState[] = ['arrived', 'blocked', 'lost', 'intruder', 'warned'];
const GLYPHS: Record<StampState, string> = { arrived: '✓', blocked: '✕', lost: '?', intruder: '✓', warned: '!' };
const PACKET = 'ping de tu-laptop a impresora';
const TIGHT_FROM = 10;

function drawMore(hidden: number, { total = hidden + 2, hidesProblem = false, trigger = {} }: { total?: number; hidesProblem?: boolean; trigger?: TriggerProps } = {}) {
  const view = render(<StampMore hidden={hidden} total={total} hidesProblem={hidesProblem} trigger={trigger} />);
  const button = view.container.querySelector('button') as HTMLButtonElement;
  return { ...view, button };
}

async function hoverFocusAndClick(button: HTMLElement, given: ReturnType<typeof triggerSpies>) {
  const user = userEvent.setup();
  await user.hover(button);
  expect(given.onPointerEnter).toHaveBeenCalledTimes(1);
  await user.unhover(button);
  expect(given.onPointerLeave).toHaveBeenCalledTimes(1);
  await user.tab();
  expect(button).toHaveFocus();
  expect(given.onFocus).toHaveBeenCalledTimes(1);
  await user.tab();
  expect(given.onBlur).toHaveBeenCalledTimes(1);
  await user.click(button);
  expect(given.onClick).toHaveBeenCalledTimes(1);
}

describe('the buttons of the stamps', () => {
  it('«+N» is a button with the class of a stamp, its number as text and the name of its list', () => {
    const { button } = drawMore(3, { total: 5 });
    expect(screen.getByRole('button', { name: MAP_TEXT.moreStamps(3, 5) })).toBe(button);
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('stamp', 'stamp--more');
    expect(button).toHaveTextContent('+3');
    expect(button.matches(MAP_MARKS)).toBe(true);
    expect(button.getAttribute('aria-label')).not.toContain('+');
  });

  it('«+N» wears the smaller letter from ten hidden stamps and the usual one below', () => {
    for (const hidden of [2, 5, TIGHT_FROM - 1]) {
      const { button, unmount } = drawMore(hidden);
      expect(button, `+${hidden}`).not.toHaveClass('stamp--tight');
      unmount();
    }
    for (const hidden of [TIGHT_FROM, 12, 99]) {
      const { button, unmount } = drawMore(hidden);
      expect(button, `+${hidden}`).toHaveClass('stamp', 'stamp--more', 'stamp--tight');
      expect(button).toHaveTextContent(`+${hidden}`);
      unmount();
    }
  });

  it('hovering, focusing and clicking «+N» call the trigger of its list, as a stamp does of its packet', async () => {
    const list = triggerSpies();
    const { button, unmount } = drawMore(3, { trigger: list });
    await hoverFocusAndClick(button, list);
    unmount();
    const packet = triggerSpies();
    render(<StampButton state="blocked" name={PACKET} trigger={packet} />);
    await hoverFocusAndClick(screen.getByRole('button'), packet);
  });

  it('a stamp that is pinned wears the mark the box leaves on the stamp that opened it, «+N» included', () => {
    const { button, unmount } = drawMore(3, { trigger: { 'data-pinned': true } });
    expect(button).toHaveAttribute('data-pinned');
    unmount();
    render(<StampButton state="lost" name={PACKET} trigger={{ 'data-pinned': true }} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-pinned');
  });

  it('a stamp tells a screen reader its packet and how it ended', () => {
    const names = STATES.map((state) => {
      const { unmount } = render(<StampButton state={state} name={PACKET} trigger={{}} />);
      const button = screen.getByRole('button', { name: stampLabel(PACKET, state) });
      expect(button).toHaveClass('stamp', `stamp--${state}`);
      expect(button.matches(MAP_MARKS)).toBe(true);
      const mark = button.querySelector('[aria-hidden="true"]');
      expect(mark?.textContent, state).toBe(GLYPHS[state]);
      expect(button.textContent, state).toBe(GLYPHS[state]);
      unmount();
      return stampLabel(PACKET, state);
    });
    expect(new Set(names).size).toBe(STATES.length);
    names.forEach((name) => expect(name).toContain(PACKET));
  });

  it('«+N» wears a dot only when it hides a stamp with a problem, and its name says so instead of the dot', () => {
    const calm = drawMore(2, { total: 4 });
    expect(calm.button.querySelector('.stamp__dot')).toBeNull();
    expect(calm.button).toHaveAccessibleName(MAP_TEXT.moreStamps(2, 4));
    calm.unmount();
    const alarmed = drawMore(2, { total: 4, hidesProblem: true });
    const dot = alarmed.button.querySelector('.stamp__dot');
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot?.textContent).toBe('');
    expect(alarmed.button).toHaveAccessibleName(MAP_TEXT.moreStampsWithProblem(2, 4));
    expect(alarmed.button).toHaveTextContent('+2');
  });

  it('offers the specimens of «+N» for the catalog: both sizes of the letter, and the dot with and without', () => {
    const drawn = MORE_SPECIMENS.map(({ hidden, hidesProblem }) => {
      const { button, unmount } = drawMore(hidden, { total: hidden, hidesProblem });
      const look = { html: button.outerHTML, tight: button.classList.contains('stamp--tight'), dot: button.querySelector('.stamp__dot') !== null };
      unmount();
      return look;
    });
    expect(drawn.length).toBeGreaterThanOrEqual(3);
    expect(new Set(drawn.map(({ html }) => html)).size).toBe(drawn.length);
    expect(new Set(drawn.map(({ tight }) => tight))).toEqual(new Set([true, false]));
    expect(new Set(drawn.map(({ dot }) => dot))).toEqual(new Set([true, false]));
    expect(MORE_SPECIMENS.every(({ hidden }) => hidden >= 2)).toBe(true);
  });
});
