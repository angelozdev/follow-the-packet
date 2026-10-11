import { expect, type Page } from '@playwright/test';

export const FULL_STARS = '3 de 3 estrellas';

/** Sends the solution, gives Lucía this answer and opens the result, which must show 3 stars. */
export async function submitAndFinish(page: Page, answer: RegExp) {
  await page.getByRole('button', { name: 'Enviar solución' }).click();
  await page.getByRole('button', { name: answer }).click();
  await page.getByRole('button', { name: 'Ver resultado' }).click();
  await expect(page.getByText(FULL_STARS)).toBeVisible();
}

/** Names the cause of the case on the card: opens its question, picks the option that says this, and goes on to the next case or, after the last, to the result, which must show 3 stars. */
export async function closeCase(page: Page, cause: RegExp, last: boolean) {
  await page.getByRole('button', { name: 'Ya sé la causa' }).click();
  await page.getByRole('button', { name: cause }).click();
  await page.getByRole('button', { name: last ? 'Ver resultado' : 'Siguiente caso' }).click();
  if (last) await expect(page.getByText(FULL_STARS)).toBeVisible();
}
