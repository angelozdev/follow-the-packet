import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const DOOR = 'puerta de servidor2';
const FULL_STARS = '3 de 3 estrellas';
const QUESTION = /¿Qué pasó\?/;
const CLOSE_TIMEOUT_MS = 15_000;

interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes: Box[] = await page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}

async function openDoor(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: DOOR, exact: true }).click();
  return page.getByRole('dialog', { name: DOOR });
}

async function explainAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: answer }).click({ timeout: CLOSE_TIMEOUT_MS });
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

async function playBoth(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  const first = await openDoor(page);
  await first.getByRole('button', { name: 'Ping', exact: true }).click();
  await first.getByRole('button', { name: 'servidor1', exact: true }).click();
  await first.getByRole('button', { name: 'Listo' }).click();
  await explainAndFinish(page, /no había ninguna para el ping de servidor1/);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abre lo justo' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'vuelva a hacer' })).toContainText('pendiente');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await openDoor(page);
  await second.getByRole('button', { name: /^Quitar la regla Echo Reply/ }).click();
  await second.getByRole('button', { name: 'Echo Request (ida)', exact: true }).click();
  await second.getByRole('button', { name: 'servidor1', exact: true }).click();
  await second.getByRole('button', { name: 'Listo' }).click();
  await explainAndFinish(page, /solo hace falta permitir la ida/);
}

test('04-01 and 04-02 reach 3 stars, and the progress survives a reload', async ({ page }) => {
  const errors = collectErrors(page);
  await playBoth(page);
  await page.goto('/#/');
  await page.reload();
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(FULL_STARS);
  await expect(page.locator('li[data-level-id="04-02"]')).toContainText(FULL_STARS);
  expect(errors).toEqual([]);
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('starts checked from the system preference, and both incidents still reach 3 stars', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/#/level/04-01');
    await expect(page.getByLabel('Sin animaciones')).toBeChecked();
    await playBoth(page);
    expect(errors).toEqual([]);
  });
});

test('a locked incident does not open from its URL', async ({ page }) => {
  await page.goto('/#/level/04-02');
  await expect(page.getByRole('heading', { name: 'Incidente bloqueado' })).toBeVisible();
});

test('labels and stamps do not overlap, and the open card does not cover its door', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('button', { name: DOOR, exact: true })).toBeVisible();
  await expect.poll(() => overlappingPairs(page)).toEqual([]);
  const card = await openDoor(page);
  const label = page.getByRole('button', { name: DOOR, exact: true });
  await expect.poll(async () => overlaps(await card.boundingBox(), await label.boundingBox())).toBe(false);
});

test('focus goes to the card heading when a door opens, and back to the door on Escape', async ({ page }) => {
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await expect(card.getByRole('heading', { level: 2 })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('button', { name: DOOR, exact: true })).toBeFocused();
});

test('focus goes to the question when the incident closes with the card still open', async ({ page }) => {
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await card.getByRole('button', { name: 'Ping', exact: true }).click();
  await card.getByRole('button', { name: 'servidor1', exact: true }).click();
  await expect(page.getByRole('heading', { name: QUESTION })).toBeFocused({ timeout: CLOSE_TIMEOUT_MS });
  await expect(card).toHaveCount(0);
});
