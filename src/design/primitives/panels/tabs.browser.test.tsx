import { render } from '@testing-library/react';
import { userEvent } from 'vitest/browser';
import { expect, it } from 'vitest';
import { standStill } from '@/testing/browser-play';
import { Tabs, type TabItem } from './tabs';

const TABS: TabItem[] = ['Terminal', 'Navegador', 'Ajustes de red', 'Tabla de rutas'].map((label) => ({ id: label, label, panel: <p>{label}</p> }));
const NARROW = '17rem';
const WIDE = '40rem';
const FADE_PX = 32;
const SLACK_PX = 1;

function drawTabs(width: string): { frame: HTMLElement; list: HTMLElement } {
  const { container } = render(
    <div style={{ width, padding: '1rem' }}>
      <Tabs name="Tarjetas" tabs={TABS} selected={TABS[0].id} onSelect={() => undefined} />
    </div>,
  );
  const frame = container.firstElementChild as HTMLElement;
  return { frame, list: frame.querySelector('[role="tablist"]') as HTMLElement };
}

const fadeOf = (list: HTMLElement) => ({
  start: Number.parseFloat(getComputedStyle(list).getPropertyValue('--tabs-fade-start')),
  end: Number.parseFloat(getComputedStyle(list).getPropertyValue('--tabs-fade-end')),
});

it('a bar of tabs wider than its card scrolls by itself and the card does not', () => {
  const { frame, list } = drawTabs(NARROW);
  expect(list.scrollWidth, 'the bar has more tabs than room').toBeGreaterThan(list.clientWidth);
  expect(frame.scrollWidth, 'the card around the tabs does not scroll sideways').toBeLessThanOrEqual(frame.clientWidth);
});

it('a bar of tabs fades only the edge that hides tabs', async () => {
  const { list } = drawTabs(NARROW);
  await expect.poll(() => fadeOf(list), { message: 'at the start only the right edge fades' }).toEqual({ start: 0, end: FADE_PX });
  list.scrollLeft = list.scrollWidth;
  await expect.poll(() => fadeOf(list), { message: 'at the end only the left edge fades' }).toEqual({ start: FADE_PX, end: 0 });
  list.scrollLeft = (list.scrollWidth - list.clientWidth) / 2;
  await expect.poll(() => fadeOf(list), { message: 'in the middle both edges fade' }).toEqual({ start: FADE_PX, end: FADE_PX });
});

it('a bar of tabs with room for all of them fades nothing and scrolls nowhere', async () => {
  const { list } = drawTabs(WIDE);
  await standStill();
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  expect(fadeOf(list)).toEqual({ start: 0, end: 0 });
});

it('the arrow keys bring the tab they select into view, clear of the fade', async () => {
  const { list } = drawTabs(NARROW);
  const [first, , third] = [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
  first.focus();
  for (const key of ['{ArrowRight}', '{ArrowRight}']) {
    await userEvent.keyboard(key);
    await standStill();
  }
  const [tab, bar] = [third.getBoundingClientRect(), list.getBoundingClientRect()];
  expect(third).toHaveFocus();
  expect(tab.left, 'the tab starts inside the bar').toBeGreaterThanOrEqual(bar.left - SLACK_PX);
  expect(tab.right, 'the tab ends before the fade of the right edge').toBeLessThanOrEqual(bar.right - FADE_PX + SLACK_PX);
});
