import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { CATALOG_COLUMNS, STAGE } from './catalog-cells';
import { CatalogScene2D } from './catalog-scene';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const HALF_A_PIXEL = 0.5;
const DRAWN = 'path, rect, circle, ellipse, polygon, line, .map-button, button.stamp';

function mount(still: boolean) {
  return render(
    <main className="catalog">
      <section className="catalog__section">
        <CatalogScene2D still={still} />
      </section>
    </main>,
  );
}

function sticksOut(inner: DOMRect, outer: DOMRect): boolean {
  return inner.left < outer.left - HALF_A_PIXEL || inner.top < outer.top - HALF_A_PIXEL || inner.right > outer.right + HALF_A_PIXEL || inner.bottom > outer.bottom + HALF_A_PIXEL;
}

describe('the 2D entity catalog in a browser', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('nothing of a specimen is drawn outside its stage, with animations and without them', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    for (const still of [true, false]) {
      const { container, unmount } = mount(still);
      const stages = [...container.querySelectorAll('.catalog2d__stage')];
      expect(stages.length).toBeGreaterThan(0);
      const outside = stages.flatMap((stage) => {
        const box = stage.getBoundingClientRect();
        return [...stage.querySelectorAll(DRAWN)].filter((drawn) => sticksOut(drawn.getBoundingClientRect(), box)).map((drawn) => `${stage.closest('figure')?.getAttribute('data-specimen')}: ${drawn.tagName}.${drawn.getAttribute('class')}`);
      });
      expect(outside, still ? 'still' : 'moving').toEqual([]);
      unmount();
    }
  });

  it('the label of a piece stands above the piece and never over it', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { container } = mount(true);
    const labelled = [...container.querySelectorAll('.catalog2d__stage')].filter((stage) => stage.querySelector('.map-button') !== null);
    expect(labelled.length).toBeGreaterThan(0);
    const over = labelled.filter((stage) => {
      const label = (stage.querySelector('.map-button') as Element).getBoundingClientRect();
      const piece = (stage.querySelector('.map-piece') as Element).getBoundingClientRect();
      return label.bottom > piece.top;
    });
    expect(over.map((stage) => stage.closest('figure')?.getAttribute('data-specimen'))).toEqual([]);
  });

  it('keeps its 5 columns and fits on a desktop, and scrolls inside its own box on a phone without scrolling the page', async () => {
    await page.viewport(PHONE_VIEWPORT.width, PHONE_VIEWPORT.height);
    const { container } = mount(true);
    const canvas = container.querySelector('.catalog2d') as HTMLElement;
    const fullRow = [...container.querySelectorAll('.catalog2d__row')].find((row) => row.querySelectorAll('figure').length === CATALOG_COLUMNS) as Element;
    const lefts = [...fullRow.querySelectorAll('figure')].map((each) => each.getBoundingClientRect().left - fullRow.getBoundingClientRect().left);
    expect(lefts).toEqual(Array.from({ length: CATALOG_COLUMNS }, (_, column) => column * STAGE.width));
    expect(canvas.scrollWidth).toBeGreaterThan(canvas.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    await expect.poll(() => canvas.scrollWidth <= canvas.clientWidth).toBe(true);
  });

  it('every caption fits inside the width of its specimen', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { container } = mount(true);
    const captions = [...container.querySelectorAll<HTMLElement>('figcaption')];
    expect(captions.length).toBeGreaterThan(0);
    expect(captions.filter((caption) => caption.scrollWidth > caption.clientWidth).map((caption) => caption.textContent)).toEqual([]);
    expect(captions.filter((caption) => caption.getBoundingClientRect().width > STAGE.width + HALF_A_PIXEL).map((caption) => caption.textContent)).toEqual([]);
  });
});
