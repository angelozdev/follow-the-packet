import type { Page } from '@playwright/test';
import { mapBoxes as mapBoxesInPage, type Box } from '@/testing/map-boxes';

const PIECE_LABELS = '.map-button';
const RECORDED_LABELS = 'recordedLabels';

/** Returns the box of every label, every stamp and every floor name on the map, named as a screen reader reads it. */
export async function mapBoxes(page: Page): Promise<Box[]> {
  return page.evaluate(mapBoxesInPage);
}

/** Starts recording the boxes of the labels of the pieces after every change the page makes to itself, from now on. */
export async function recordLabels(page: Page): Promise<void> {
  await page.evaluate(
    ([selector, key]) => {
      const recorded: unknown[] = [];
      Reflect.set(window, key, recorded);
      new MutationObserver(() => {
        const boxes = [...document.querySelectorAll(selector)].map((element) => {
          const rect = element.getBoundingClientRect();
          return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        if (boxes.length > 0) recorded.push(boxes);
      }).observe(document, { subtree: true, childList: true, attributes: true });
    },
    [PIECE_LABELS, RECORDED_LABELS] as const,
  );
}

/** Returns the boxes of the labels of the pieces as they stood after each change of the page since `recordLabels`, in order. */
export async function recordedLabels(page: Page): Promise<Box[][]> {
  return page.evaluate((key) => Reflect.get(window, key), RECORDED_LABELS);
}
