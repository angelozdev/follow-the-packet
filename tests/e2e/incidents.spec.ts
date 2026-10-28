import { expect, test, type Locator, type Page } from '@playwright/test';
import { FULL_STARS, submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { CHAPTER_3_DONE, startWithProgress } from './saved-progress';

const SG_SERVIDOR2 = 'Security Group servidor2';
const ECHO_REQUEST = 'ICMP · Echo Request';
const SG_SERVIDOR1 = 'SG servidor1';


async function openDoor(page: Page): Promise<Locator> {
  await page.locator('.incident__map').getByRole('button', { name: SG_SERVIDOR2, exact: true }).click();
  return page.getByRole('region', { name: SG_SERVIDOR2, exact: true });
}

async function placeRule(card: Locator, source: string) {
  await card.getByRole('button', { name: ECHO_REQUEST, exact: true }).click();
  await card.getByRole('button', { name: source, exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await startWithProgress(page, CHAPTER_3_DONE);
});

async function playBoth(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: '1. El primer ping' }).click();
  const first = await openDoor(page);
  await placeRule(first, SG_SERVIDOR1);
  await submitAndFinish(page, /no había ninguna para el ping de servidor1/);

  await page.getByRole('link', { name: 'Siguiente incidente' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Abre lo justo' })).toBeVisible();
  await expect(page.getByRole('listitem').filter({ hasText: 'vuelva a hacer' })).toContainText('pendiente');
  await expect(page.getByRole('region', { name: SG_SERVIDOR2, exact: true })).toHaveCount(0);
  const second = await openDoor(page);
  await second.getByRole('button', { name: /^Quitar la regla ICMP · Echo Reply/ }).click();
  await placeRule(second, SG_SERVIDOR1);
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
