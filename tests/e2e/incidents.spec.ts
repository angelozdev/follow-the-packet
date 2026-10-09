import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const SG_SERVIDOR2 = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';
const ANYWHERE = 'Anywhere-IPv4 (0.0.0.0/0)';
const SUBMIT = 'Enviar solución';
const INTRUDING = 'algo prohibido está entrando';
const INSPECTED_SERVER = 'servidor2 con candado';
const INSPECTION_TITLE = 'servidor2';
const FULL_STARS = '3 de 3 estrellas';
const QUESTION = /¿Qué pasó\?/;

interface Box {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Size = Pick<Box, 'width' | 'height'>;

function overlaps(a: Omit<Box, 'name'> | null, b: Omit<Box, 'name'> | null): boolean {
  return a !== null && b !== null && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function isInside(outer: Size, inner: Omit<Box, 'name'> | null): boolean {
  return inner !== null && inner.x >= 0 && inner.y >= 0 && inner.x + inner.width <= outer.width && inner.y + inner.height <= outer.height;
}

async function windowSize(page: Page): Promise<Size> {
  return page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));
}

async function mapBoxes(page: Page): Promise<Box[]> {
  return page.locator('.map-button, button.stamp').evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { name: element.getAttribute('aria-label') ?? element.textContent ?? '', x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }),
  );
}

async function overlappingPairs(page: Page): Promise<string[]> {
  const boxes = await mapBoxes(page);
  return boxes.flatMap((a, index) => boxes.slice(index + 1).filter((b) => overlaps(a, b)).map((b) => `${a.name} / ${b.name}`));
}

async function openDoor(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: SG_SERVIDOR2, exact: true }).click();
  return page.getByRole('dialog', { name: SG_SERVIDOR2 });
}

async function placeRule(card: Locator, source: string) {
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await card.getByRole('button', { name: source, exact: true }).click();
}

async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: SUBMIT }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

async function playBoth(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  const first = await openDoor(page);
  await placeRule(first, SG_SERVIDOR1);
  await first.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /no había ninguna para el ping de servidor1/);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abre lo justo' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'vuelva a hacer' })).toContainText('pendiente');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await openDoor(page);
  await second.getByRole('button', { name: /^Quitar la regla ICMP · Echo Reply/ }).click();
  await placeRule(second, SG_SERVIDOR1);
  await second.getByRole('button', { name: 'Listo' }).click();
  await submitAndFinish(page, /solo hace falta permitir la ida/);
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

test('labels and stamps do not overlap, and the open card does not cover its Security Group', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.getByRole('button', { name: SG_SERVIDOR2, exact: true })).toBeVisible();
  await expect.poll(() => overlappingPairs(page)).toEqual([]);
  const card = await openDoor(page);
  const label = page.getByRole('button', { name: SG_SERVIDOR2, exact: true });
  await expect.poll(async () => overlaps(await card.boundingBox(), await label.boundingBox())).toBe(false);
});

test('the inspection box floats inside the window and covers no label or stamp', async ({ page }) => {
  await page.goto('/#/level/04-01');
  await expect(page.locator('button.stamp').first()).toBeVisible();
  await page.getByRole('button', { name: INSPECTED_SERVER, exact: true }).hover();
  const inspection = page.getByRole('region', { name: INSPECTION_TITLE, exact: true });
  await expect(inspection).toBeVisible();
  const rect = await inspection.boundingBox();
  expect(isInside(await windowSize(page), rect)).toBe(true);
  const covered = (await mapBoxes(page)).filter((other) => overlaps(rect, other)).map((other) => other.name);
  expect(covered).toEqual([]);
});

test('focus goes to the card heading when a Security Group opens, and back to it on Escape', async ({ page }) => {
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await expect(card.getByRole('heading', { level: 2 })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page.getByRole('button', { name: SG_SERVIDOR2, exact: true })).toBeFocused();
});

test('a term shows its definition inside the window, also from a chip of the open card', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/level/04-01');
  const size = await windowSize(page);
  const tooltip = page.locator('body > [role="tooltip"]');
  await page.getByRole('region', { name: /Lucía/ }).getByText('ping', { exact: true }).first().hover();
  await expect(tooltip).toContainText('Echo Request');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  const card = await openDoor(page);
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).getByText('Echo Request', { exact: true }).hover();
  await expect(tooltip).toContainText('tipo 8');
  expect(isInside(size, await tooltip.boundingBox())).toBe(true);
  expect(errors).toEqual([]);
});

test('sending with Anywhere-IPv4 open gets Lucía’s reply, and with the card still open the fix closes it and focuses the question', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/#/level/04-01');
  const card = await openDoor(page);
  await placeRule(card, ANYWHERE);
  await page.getByRole('button', { name: SUBMIT }).click();
  await expect(page.getByRole('status')).toContainText(INTRUDING);
  await expect(page.getByRole('heading', { name: QUESTION })).toHaveCount(0);
  await card.getByRole('button', { name: /^Quitar la regla/ }).click();
  await expect(page.getByRole('status')).toBeEmpty();
  await placeRule(card, SG_SERVIDOR1);
  await page.getByRole('button', { name: SUBMIT }).click();
  await expect(page.getByRole('heading', { name: QUESTION })).toBeFocused();
  await expect(card).toHaveCount(0);
  expect(errors).toEqual([]);
});
