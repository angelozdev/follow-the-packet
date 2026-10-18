import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const NARROW_QUERY = '(max-width: 900px)';
const BOX = { width: 200, height: 50 };
const LETTERS_IN_SHORT_WORD = 1;
const LETTERS_IN_LONG_WORD = 4;
const WHEEL_STEP = 100;
const SCROLLER_HEIGHT = 100;
const SCROLLED_CONTENT_HEIGHT = 1000;
const HEX_COLOUR = /^#[0-9a-f]{6}$/;

function columnsOf(element: Element): number {
  return getComputedStyle(element).gridTemplateColumns.split(' ').length;
}

describe('the browser project', () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('measures the real box of an element, which jsdom cannot', () => {
    const { getByTestId } = render(
      <div data-testid="box" style={{ width: BOX.width, height: BOX.height }}>
        <span data-testid="short" style={{ font: '16px monospace' }}>
          {'m'.repeat(LETTERS_IN_SHORT_WORD)}
        </span>
        <br />
        <span data-testid="long" style={{ font: '16px monospace' }}>
          {'m'.repeat(LETTERS_IN_LONG_WORD)}
        </span>
      </div>,
    );
    const box = getByTestId('box').getBoundingClientRect();
    const short = getByTestId('short').getBoundingClientRect();
    const long = getByTestId('long').getBoundingClientRect();
    expect([box.width, box.height]).toEqual([BOX.width, BOX.height]);
    expect(short.width).toBeGreaterThan(0);
    expect(long.width).toBeCloseTo(short.width * (LETTERS_IN_LONG_WORD / LETTERS_IN_SHORT_WORD), 0);
  });

  it('page.viewport changes the width that the media queries of the game read', async () => {
    const { getByTestId } = render(<div data-testid="incident" className="incident" />);
    const incident = getByTestId('incident');
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    expect(window.innerWidth).toBe(DESKTOP_VIEWPORT.width);
    expect(window.matchMedia(NARROW_QUERY).matches).toBe(false);
    expect(columnsOf(incident)).toBe(2);
    await page.viewport(PHONE_VIEWPORT.width, PHONE_VIEWPORT.height);
    expect(window.innerWidth).toBe(PHONE_VIEWPORT.width);
    expect(window.matchMedia(NARROW_QUERY).matches).toBe(true);
    expect(columnsOf(incident)).toBe(1);
  });

  it('a wheel over a scroller moves it by the wheel and not by scrollIntoView', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { getByTestId } = render(
      <div data-testid="scroller" style={{ height: SCROLLER_HEIGHT, overflow: 'auto' }}>
        <div style={{ height: SCROLLED_CONTENT_HEIGHT }} />
      </div>,
    );
    const scroller = getByTestId('scroller');
    const wheels: { deltaY: number; isTrusted: boolean }[] = [];
    scroller.addEventListener('wheel', ({ deltaY, isTrusted }) => wheels.push({ deltaY, isTrusted }));
    expect(scroller.scrollTop).toBe(0);
    await userEvent.wheel(scroller, { delta: { y: WHEEL_STEP } });
    await expect.poll(() => scroller.scrollTop).toBeGreaterThan(0);
    expect(wheels).toEqual([{ deltaY: WHEEL_STEP, isTrusted: true }]);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('the stylesheet and the tokens of the game are loaded in the browser project', () => {
    const { getByTestId } = render(<div data-testid="layer" className="html-layer" />);
    const root = getComputedStyle(document.documentElement);
    const pageColour = root.getPropertyValue('--color-page').trim();
    expect(pageColour).toMatch(HEX_COLOUR);
    expect(pageColour).toBe(root.getPropertyValue('--palette-paper').trim());
    expect(getComputedStyle(document.body).margin).toBe('0px');
    expect(getComputedStyle(getByTestId('layer')).pointerEvents).toBe('none');
  });
});
