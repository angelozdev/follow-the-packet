import { expect, test, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const FONT_HOSTS = /fonts\.(googleapis|gstatic)\.com/;
const PIECES = 'Piezas del mapa';
const INTERFACE = 'Elementos de la interfaz';
const FOCUSED_OPTION = 'Una respuesta posible';
const LAST_CAPTION = 'intruso';
const WATCH_MS = 7000;

test.use({ viewport: { width: 1280, height: 2200 }, deviceScaleFactor: 1 });

async function openCatalog(page: Page) {
  await page.route(FONT_HOSTS, (route) => route.abort());
  await page.goto('/#/entidades');
  const pieces = page.getByRole('region', { name: PIECES });
  await expect(pieces.getByText(LAST_CAPTION, { exact: true })).toBeVisible();
  return pieces;
}

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the entity catalog draws every entity in every variant and state as recorded', async ({ page }) => {
    const errors = collectErrors(page);
    const pieces = await openCatalog(page);
    await expect(page.getByLabel('Sin animaciones')).toBeChecked();
    await expect(pieces).toHaveScreenshot('entities.png', { maxDiffPixels: 0, threshold: 0 });
    expect(errors).toEqual([]);
  });

  test('the interface elements are drawn in every variant and state as recorded, with the focus ring on an option', async ({ page }) => {
    const errors = collectErrors(page);
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    await elements.getByRole('button', { name: FOCUSED_OPTION }).focus();
    await expect(elements).toHaveScreenshot('interface.png', { maxDiffPixels: 0, threshold: 0 });
    expect(errors).toEqual([]);
  });
});

test('the entity catalog also runs with its animations, without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await openCatalog(page);
  await expect(page.getByLabel('Sin animaciones')).not.toBeChecked();
  await page.evaluate((watchMs) => new Promise<void>((done) => {
    const start = performance.now();
    const tick = () => (performance.now() - start >= watchMs ? done() : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }), WATCH_MS);
  expect(errors).toEqual([]);
});

test('the roadmap does not link to the entity catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('a[href="#/entidades"]')).toHaveCount(0);
});
