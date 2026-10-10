import type { Page } from '@playwright/test';

export interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** True when two boxes on the screen overlap; a missing box overlaps nothing. */
export function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** Returns the box of every label and every stamp on the map, named as a screen reader reads it. */
export async function mapBoxes(page: Page): Promise<Box[]> {
  return page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

/** Returns every pair of labels or stamps of the map that overlap, as "a / b". */
export async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes = await mapBoxes(page);
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}
