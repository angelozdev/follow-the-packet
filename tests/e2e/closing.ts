import { expect, type Page } from '@playwright/test';

export const FULL_STARS = '3 de 3 estrellas';

/** Sends the solution, gives Lucía this answer and opens the result, which must show 3 stars. */
export async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: 'Enviar solución' }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}
