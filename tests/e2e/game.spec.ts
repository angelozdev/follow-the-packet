import { expect, test, type Page } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    // Las fuentes de Google pueden fallar sin red; no es un error del juego.
    if (message.type() === 'error' && !/Failed to load resource/.test(message.text())) errors.push(message.text());
  });
  return errors;
}

async function winLevel1(page: Page) {
  await page.goto('/');
  await page.getByRole('link', { name: /¿Dónde muere el ping\?/ }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByRole('button', { name: 'En la barrera de servidor2 (su SG de entrada)' }).click();
  await page.getByLabel('Qué').selectOption({ label: 'ICMP · Echo Request ("Repetir solicitud")' });
  await page.getByLabel('Desde dónde').selectOption({ label: 'SG servidor1' });
  await page.getByRole('button', { name: 'Agregar regla' }).click();
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
}

test('nivel 1 de punta a punta, con 3 estrellas', async ({ page }) => {
  const errors = collectErrors(page);
  await winLevel1(page);
  await expect(page.getByText('3 de 3 estrellas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('el progreso sobrevive a recargar', async ({ page }) => {
  await winLevel1(page);
  await expect(page.getByText('3 de 3 estrellas')).toBeVisible();
  await page.goto('/#/');
  await page.reload();
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText('3 de 3 estrellas');
  await expect(page.locator('li[data-level-id="04-02"] a')).toBeVisible();
});

test('cada nivel carga sin errores y deja una captura para revisar', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  const ids = await page.locator('li[data-level-id]').evaluateAll((items) => items.map((item) => item.getAttribute('data-level-id') ?? ''));
  expect(ids.length).toBeGreaterThan(0);
  for (const id of ids) {
    await page.goto(`/#/level/${id}`);
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `test-results/levels/${id}.png` });
  }
  expect(errors).toEqual([]);
});
