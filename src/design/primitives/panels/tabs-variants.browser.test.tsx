import { render } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { clickAt, standStill, tapAt } from '@/testing/browser-play';
import { tokenColor } from '@/testing/token-color';
import { Tabs, type TabItem, type TabsVariant } from './tabs';

const ITEMS: TabItem[] = ['Tabla de rutas', 'Tabla de traducciones', 'Registros', 'Caché'].map((label) => ({ id: label, label, panel: <p>{label}</p> }));
const [FIRST, SECOND, THIRD] = ITEMS;
const NARROW = '17rem';
const WIDE = '40rem';
const FADE_PX = 32;
const SLACK_PX = 1;
const SHOWN_PX = 20;
const GRAB_PX = 8;
const WHEEL_PX = 50;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
const VARIANTS: TabsVariant[] = ['pills', 'underline'];
const EDGES = [
  { side: 'right', index: 2, id: THIRD.id },
  { side: 'left', index: 1, id: SECOND.id },
] as const;

interface RowProps {
  variant: TabsVariant;
  width: string;
  onSelect?: (tabId: string) => void;
}

function Row({ variant, width, onSelect }: RowProps) {
  const [selected, setSelected] = useState(FIRST.id);
  return (
    <div style={{ width, padding: '1rem' }}>
      <Tabs
        name="Pestañas"
        variant={variant}
        tabs={ITEMS}
        selected={selected}
        onSelect={(tabId) => {
          onSelect?.(tabId);
          setSelected(tabId);
        }}
      />
    </div>
  );
}

function drawRow(props: RowProps) {
  const { container } = render(<Row {...props} />);
  const list = container.querySelector<HTMLElement>('[role="tablist"]') as HTMLElement;
  return { frame: container.firstElementChild as HTMLElement, list, tabs: [...list.querySelectorAll<HTMLElement>('[role="tab"]')] };
}

const rootToken = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function strokeOf(token: string): number {
  const probe = document.body.appendChild(document.createElement('div'));
  probe.style.borderBottom = `var(${token}) solid`;
  const { borderBottomWidth } = getComputedStyle(probe);
  probe.remove();
  return Number.parseFloat(borderBottomWidth);
}

const styleOf = (tab: HTMLElement) => getComputedStyle(tab);

async function straddle(list: HTMLElement, tab: HTMLElement, side: 'left' | 'right'): Promise<void> {
  const [bar, box] = [list.getBoundingClientRect(), tab.getBoundingClientRect()];
  list.scrollLeft += side === 'right' ? box.left - (bar.right - SHOWN_PX) : box.right - (bar.left + SHOWN_PX);
  await standStill();
  const [after, now] = [list.getBoundingClientRect(), tab.getBoundingClientRect()];
  const hidden = side === 'right' ? now.right > after.right && now.left < after.right - GRAB_PX : now.left < after.left && now.right > after.left + GRAB_PX;
  expect(hidden, `a tab is partly hidden at the ${side} edge of the bar`).toBe(true);
}

function clickTheEdge(list: HTMLElement, tab: HTMLElement, side: 'left' | 'right'): Promise<void> {
  const [bar, box] = [list.getBoundingClientRect(), tab.getBoundingClientRect()];
  return clickAt({ x: side === 'right' ? bar.right - GRAB_PX : bar.left + GRAB_PX, y: box.top + box.height / 2 });
}

function watchThePress(list: HTMLElement) {
  const press = { target: null as Element | null, scrollLeft: Number.NaN };
  list.addEventListener(
    'mousedown',
    (event) => {
      press.target = event.target as Element;
      press.scrollLeft = list.scrollLeft;
    },
    { capture: true, once: true },
  );
  return press;
}

describe('the look of a row of tabs by variant', () => {
  it('an underlined row draws no pill: no fill, no frame, no rounding, and only the chosen tab is bold, in ink and underlined with a thick stroke', () => {
    const { tabs } = drawRow({ variant: 'underline', width: WIDE });
    const [chosen, ...others] = tabs;
    for (const tab of tabs) {
      const style = styleOf(tab);
      expect(style.backgroundColor, `${tab.textContent} has no fill`).toBe(TRANSPARENT);
      expect(style.borderRadius, `${tab.textContent} is not rounded`).toBe('0px');
      expect([style.borderTopWidth, style.borderLeftWidth, style.borderRightWidth], `${tab.textContent} has no frame`).toEqual(['0px', '0px', '0px']);
    }
    const heavy = strokeOf('--stroke-heavy');
    expect(strokeOf('--stroke-thin'), 'the stroke is thicker than the rule').toBeLessThan(heavy);
    expect(Number.parseFloat(styleOf(chosen).borderBottomWidth), 'the chosen tab is underlined with the heavy stroke').toBe(heavy);
    expect(styleOf(chosen).borderBottomStyle).toBe('solid');
    expect(styleOf(chosen).borderBottomColor, 'the underline is ink').toBe(tokenColor('--color-ink'));
    expect(styleOf(chosen).color).toBe(tokenColor('--color-ink'));
    expect(styleOf(chosen).fontWeight).toBe(rootToken('--weight-bold'));
    for (const tab of others) {
      expect(styleOf(tab).fontWeight, `${tab.textContent} is not bold`).toBe(rootToken('--weight-regular'));
      expect(styleOf(tab).color, `${tab.textContent} is in the soft ink`).toBe(tokenColor('--color-ink-soft'));
      expect(styleOf(tab).borderBottomColor, `${tab.textContent} has no underline`).toBe(TRANSPARENT);
    }
  });

  it('an underlined row has a thin rule under the whole row and smaller text than the pills', () => {
    const { list, tabs } = drawRow({ variant: 'underline', width: WIDE });
    expect(getComputedStyle(list).backgroundImage, 'the rule is drawn in the soft ink').toContain(tokenColor('--color-ink-soft'));
    const pills = drawRow({ variant: 'pills', width: WIDE }).tabs[0];
    expect(Number.parseFloat(styleOf(tabs[0]).fontSize)).toBeLessThan(Number.parseFloat(styleOf(pills).fontSize));
  });

  it('a row of pills keeps its pills: ink fill and paper text on the chosen tab, a frame and rounding on every tab, all bold', () => {
    const { tabs } = drawRow({ variant: 'pills', width: WIDE });
    const [chosen, ...others] = tabs;
    expect(styleOf(chosen).backgroundColor).toBe(tokenColor('--color-ink'));
    expect(styleOf(chosen).color).toBe(tokenColor('--color-on-fill'));
    for (const tab of others) expect(styleOf(tab).backgroundColor, `${tab.textContent} has the paper fill`).toBe(tokenColor('--color-page'));
    for (const tab of tabs) {
      expect(styleOf(tab).borderRadius, `${tab.textContent} is rounded`).not.toBe('0px');
      expect(Number.parseFloat(styleOf(tab).borderTopWidth), `${tab.textContent} has a frame`).toBe(strokeOf('--stroke-bold'));
      expect(styleOf(tab).fontWeight).toBe(rootToken('--weight-bold'));
    }
  });

  it('a pills row is the default when the variant is not given', () => {
    const { container } = render(<Tabs name="Pestañas" tabs={ITEMS} selected={FIRST.id} onSelect={() => undefined} />);
    expect(getComputedStyle(container.querySelector('[role="tab"]') as HTMLElement).borderRadius).not.toBe('0px');
  });

  it('an underlined tab keeps its width and place when it becomes the chosen one', async () => {
    const { tabs } = drawRow({ variant: 'underline', width: WIDE });
    const boxes = () => tabs.map((tab) => tab.getBoundingClientRect()).map(({ left, width }) => ({ left, width }));
    const before = boxes();
    await userEvent.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    boxes().forEach(({ left, width }, index) => {
      expect(width, `${tabs[index].textContent} keeps its width`).toBeCloseTo(before[index].width, 1);
      expect(left, `${tabs[index].textContent} keeps its place`).toBeCloseTo(before[index].left, 1);
    });
  });

  it('an underlined row that does not fit stays on one line and scrolls sideways, and its card does not', () => {
    const { frame, list, tabs } = drawRow({ variant: 'underline', width: NARROW });
    expect(list.scrollWidth, 'the row has more tabs than room').toBeGreaterThan(list.clientWidth);
    expect(new Set(tabs.map((tab) => tab.getBoundingClientRect().top)).size, 'every tab is on the same line').toBe(1);
    expect(frame.scrollWidth, 'the card around the tabs does not scroll sideways').toBeLessThanOrEqual(frame.clientWidth);
  });
});

describe.each(VARIANTS)('a %s row: its sideways scroll never gets in the way of a click', (variant) => {
  it.each(EDGES)('one click on the visible edge of a tab that the $side fade half hides selects it on the first try and brings it whole in view, clear of the fade', async ({ side, index, id }) => {
    const onSelect = vi.fn();
    const { list, tabs } = drawRow({ variant, width: NARROW, onSelect });
    const tab = tabs[index];
    if (side === 'left') list.scrollLeft = list.scrollWidth;
    await straddle(list, tab, side);
    const scrolled = list.scrollLeft;
    const press = watchThePress(list);
    await clickTheEdge(list, tab, side);
    await standStill();
    expect(press.target?.closest('[role="tab"]'), 'the press landed on the tab that was aimed at').toBe(tab);
    expect(press.scrollLeft, 'nothing moved the row before the press landed').toBe(scrolled);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(id);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    const [box, bar] = [tab.getBoundingClientRect(), list.getBoundingClientRect()];
    expect(box.left, 'the tab starts inside the bar').toBeGreaterThanOrEqual(bar.left - SLACK_PX);
    expect(box.right, 'the tab ends inside the bar').toBeLessThanOrEqual(bar.right + SLACK_PX);
    expect(side === 'right' ? bar.right - box.right : box.left - bar.left, 'the tab is clear of the fade').toBeGreaterThanOrEqual(FADE_PX - SLACK_PX);
  });

  it('one tap with a finger on the visible edge of a tab that the right fade half hides selects it on the first try', async () => {
    const onSelect = vi.fn();
    const { list, tabs } = drawRow({ variant, width: NARROW, onSelect });
    const tab = tabs[2];
    await straddle(list, tab, 'right');
    const bar = list.getBoundingClientRect();
    await tapAt({ x: bar.right - GRAB_PX, y: tab.getBoundingClientRect().top + tab.getBoundingClientRect().height / 2 });
    await standStill();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(THIRD.id);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab.getBoundingClientRect().right, 'the tab ends before the fade of the right edge').toBeLessThanOrEqual(bar.right - FADE_PX + SLACK_PX);
  });

  it('a sideways wheel over the row scrolls it and selects nothing, and the next click on the visible edge of a tab selects it on the first try', async () => {
    const onSelect = vi.fn();
    const { list, tabs } = drawRow({ variant, width: NARROW, onSelect });
    await userEvent.wheel(list, { delta: { x: WHEEL_PX } });
    await expect.poll(() => list.scrollLeft, { message: 'the wheel scrolls the row' }).toBeGreaterThan(0);
    await standStill();
    expect(onSelect, 'scrolling the row selects nothing').not.toHaveBeenCalled();
    expect(tabs[0], 'the chosen tab is still the one that was chosen').toHaveAttribute('aria-selected', 'true');
    const bar = list.getBoundingClientRect();
    const hidden = tabs.find((tab) => tab !== tabs[0] && tab.getBoundingClientRect().right > bar.right && tab.getBoundingClientRect().left < bar.right - GRAB_PX);
    expect(hidden, 'another tab is partly hidden at the right edge').toBeDefined();
    const tab = hidden as HTMLElement;
    await clickTheEdge(list, tab, 'right');
    await standStill();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(tab.textContent);
    expect(tab).toHaveAttribute('aria-selected', 'true');
    const box = tab.getBoundingClientRect();
    expect(box.right, 'the tab ends before the fade of the right edge').toBeLessThanOrEqual(list.getBoundingClientRect().right - FADE_PX + SLACK_PX);
  });
});
