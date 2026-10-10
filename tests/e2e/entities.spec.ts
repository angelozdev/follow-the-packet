import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectErrors } from './console-errors';

const FONT_HOSTS = /fonts\.(googleapis|gstatic)\.com/;
const PIECES = 'Piezas del mapa';
const INTERFACE = 'Elementos de la interfaz';
const FOCUSED_OPTION = 'Una respuesta posible';
const LAST_CAPTION = 'intruso';
const WATCH_MS = 7000;
const STAMP = 'Enviar solución';
const DISABLED_STAMP = 'Enviar';
const OPTIONS = ['Una respuesta posible', 'La respuesta elegida', 'Una respuesta que ya no se puede elegir'];
const LETTER = /^[A-Z]$/;
const TILT_DEGREES = -2;
const PRESS_PX = 2;

test.use({ viewport: { width: 1280, height: 2200 }, deviceScaleFactor: 1 });

interface Look {
  textTransform: string;
  borderStyle: string;
  borderColor: string;
  color: string;
  emphasis: string;
  radius: number;
  height: number;
  tilt: number;
  lift: number;
}

async function lookOf(button: Locator): Promise<Look> {
  return button.evaluate((element) => {
    const style = getComputedStyle(element);
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-emphasis)';
    document.body.append(probe);
    const emphasis = getComputedStyle(probe).color;
    probe.remove();
    const matrix = new DOMMatrix(style.transform);
    return {
      textTransform: style.textTransform,
      borderStyle: style.borderTopStyle,
      borderColor: style.borderTopColor,
      color: style.color,
      emphasis,
      radius: Number.parseFloat(style.borderTopLeftRadius),
      height: element.getBoundingClientRect().height,
      tilt: (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI,
      lift: matrix.f,
    };
  });
}

async function pressedLookOf(page: Page, button: Locator): Promise<Look> {
  await button.hover();
  await page.mouse.down();
  try {
    return await lookOf(button);
  } finally {
    await page.mouse.up();
  }
}

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

  test('the primary button looks like a stamp and does not move when pressed under reduced motion', async ({ page }) => {
    await openCatalog(page);
    const stamp = page.getByRole('region', { name: INTERFACE }).getByRole('button', { name: STAMP, exact: true });
    const rest = await lookOf(stamp);
    expect(rest.textTransform).toBe('uppercase');
    expect(rest.borderStyle).toBe('dashed');
    expect(rest.borderColor).toBe(rest.emphasis);
    expect(rest.color).toBe(rest.emphasis);
    expect(rest.radius).toBeGreaterThanOrEqual(rest.height / 2);
    expect(rest.tilt).toBeCloseTo(TILT_DEGREES, 1);
    const pressed = await pressedLookOf(page, stamp);
    expect(pressed.tilt).toBeCloseTo(rest.tilt, 5);
    expect(pressed.lift).toBeCloseTo(rest.lift, 5);
  });

  test('the disabled primary button keeps the tilt of the stamp and does not move when pressed', async ({ page }) => {
    await openCatalog(page);
    const disabled = page.getByRole('region', { name: INTERFACE }).getByRole('button', { name: DISABLED_STAMP, exact: true }).first();
    await expect(disabled).toBeDisabled();
    const rest = await lookOf(disabled);
    expect(rest.tilt).toBeCloseTo(TILT_DEGREES, 1);
    expect(rest.color).not.toBe(rest.emphasis);
    await disabled.hover({ force: true });
    await page.mouse.down();
    const pressed = await lookOf(disabled);
    await page.mouse.up();
    expect(pressed.tilt).toBeCloseTo(TILT_DEGREES, 1);
    expect(pressed.lift).toBeCloseTo(rest.lift, 5);
  });

  test('the options of the interface specimen show the letters A, B and C and keep their sentence as their accessible name', async ({ page }) => {
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    for (const sentence of OPTIONS) await expect(elements.getByRole('button', { name: sentence, exact: true })).toBeVisible();
    const browser = await page.context().newCDPSession(page);
    const names = (await browser.send('Accessibility.getFullAXTree')).nodes.filter((node) => node.role?.value === 'button' && OPTIONS.some((sentence) => node.name?.value?.includes(sentence)));
    expect(names.map((node) => node.name?.value)).toEqual(OPTIONS);
    const snapshot = await browser.send('DOMSnapshot.captureSnapshot', { computedStyles: [] });
    const [document] = snapshot.documents;
    const drawn = document.layout.nodeIndex.flatMap((_, index) => snapshot.strings[document.layout.text[index]] ?? []);
    expect(drawn.filter((text) => LETTER.test(text))).toEqual(['A', 'B', 'C']);
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

test('without reduced motion the pressed primary button moves 2 px down and keeps its tilt', async ({ page }) => {
  await openCatalog(page);
  const stamp = page.getByRole('region', { name: INTERFACE }).getByRole('button', { name: STAMP, exact: true });
  const rest = await lookOf(stamp);
  const pressed = await pressedLookOf(page, stamp);
  expect(pressed.tilt).toBeCloseTo(TILT_DEGREES, 1);
  expect(pressed.lift - rest.lift).toBeCloseTo(PRESS_PX, 1);
});

test('the roadmap does not link to the entity catalog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Sigue el paquete' })).toBeVisible();
  await expect(page.locator('a[href="#/entidades"]')).toHaveCount(0);
});
