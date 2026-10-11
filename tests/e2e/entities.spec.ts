import { expect, test, type Locator, type Page } from '@playwright/test';
import { reachWithWheel } from './card-boxes';
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
const TABLE_CAPTION = 'Rutas de router-oficina';
const EMPTY_TABLE = 'Sin rutas.';
const ROW_IN_USE = 'en uso';
const REMOVE_BUTTON = /^Quitar /;
const MAP_CARD_WIDTH_PX = 352;
const MAP_CARD_ROOM_PX = 224;
const ROW_COPIES = 6;
const WHEEL_PX = 120;
const SCROLLBAR_PX = 12;
const FOCUS_RING_PX = 4;

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

  test('the interface specimen of Table is part of the capture', async ({ page }) => {
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    const tables = elements.getByRole('table', { name: TABLE_CAPTION });
    await expect(tables).toHaveCount(2);
    const [filled, empty] = [tables.first(), tables.last()];
    await expect(filled.getByRole('button', { name: REMOVE_BUTTON })).toHaveCount(2);
    await expect(filled.getByText(ROW_IN_USE, { exact: true })).toBeVisible();
    await expect(empty.getByText(EMPTY_TABLE, { exact: true })).toBeVisible();
    const region = await elements.boundingBox();
    if (region === null) throw new Error('the interface section is not on the page');
    for (const table of [filled, empty]) {
      const box = await table.boundingBox();
      if (box === null) throw new Error('a specimen of Table is not drawn');
      expect(box.x).toBeGreaterThanOrEqual(region.x);
      expect(box.y).toBeGreaterThanOrEqual(region.y);
      expect(box.x + box.width).toBeLessThanOrEqual(region.x + region.width);
      expect(box.y + box.height).toBeLessThanOrEqual(region.y + region.height);
    }
  });

  test('the focus ring of a remove button fits inside the wrapper of the Table', async ({ page }) => {
    await openCatalog(page);
    const filled = page.getByRole('region', { name: INTERFACE }).getByRole('table', { name: TABLE_CAPTION }).first();
    const [last] = await filled.getByRole('button', { name: REMOVE_BUTTON }).all().then((buttons) => buttons.slice(-1));
    await last.focus();
    const [button, wrapper] = await Promise.all([last.boundingBox(), filled.locator('xpath=..').boundingBox()]);
    if (button === null || wrapper === null) throw new Error('the Table is not drawn');
    expect(button.x + button.width + FOCUS_RING_PX).toBeLessThanOrEqual(wrapper.x + wrapper.width);
    expect(button.y - FOCUS_RING_PX).toBeGreaterThanOrEqual(wrapper.y);
    expect(button.y + button.height + FOCUS_RING_PX).toBeLessThanOrEqual(wrapper.y + wrapper.height);
  });

  test('a long Table in a card on the map stays inside the card and scrolls there', async ({ page }) => {
    await openCatalog(page);
    await page.evaluate(
      ([caption, width, room, copies]) => {
        const source = [...document.querySelectorAll('table')].find((table) => table.caption?.textContent === caption)?.closest('.card');
        const rows = source?.querySelectorAll('tbody tr');
        if (!source || !rows) throw new Error('the specimen of Table is not on the page');
        const card = source.cloneNode(true) as Element;
        const body = card.querySelector('tbody');
        for (let copy = 0; copy < copies; copy++) for (const row of rows) body?.append(row.cloneNode(true));
        const holder = document.createElement('div');
        holder.className = 'map-card';
        holder.dataset.testid = 'long-table';
        holder.style.cssText = `position: fixed; top: 16px; left: 16px; z-index: 100; --card-width: ${width}px; --card-room: ${room}px`;
        holder.append(card);
        document.body.append(holder);
      },
      [TABLE_CAPTION, MAP_CARD_WIDTH_PX, MAP_CARD_ROOM_PX, ROW_COPIES] as const,
    );
    const holder = page.getByTestId('long-table');
    const card = holder.locator('.card');
    const wrapper = holder.locator('.table');
    const lastRow = holder.locator('tbody tr').last();
    const [before, cardBox, tableBox] = await Promise.all([wrapper.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight })), card.boundingBox(), holder.locator('table').boundingBox()]);
    if (cardBox === null || tableBox === null) throw new Error('the card of the long Table is not drawn');
    expect(cardBox.height, 'the card keeps the height the map gives it').toBeLessThanOrEqual(MAP_CARD_ROOM_PX + 1);
    expect(before.scrollHeight, 'the Table has more rows than it shows').toBeGreaterThan(before.clientHeight + 1);
    expect(await wrapper.evaluate((element) => getComputedStyle(element).overflowY), 'the Table scrolls in its wrapper').toBe('auto');
    expect(await wrapper.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width), 'the wrapper draws its own scrollbar').toBe(`${SCROLLBAR_PX}px`);
    const band = await card.locator('.card__band').boundingBox();
    if (band === null) throw new Error('the card of the long Table has no band');
    expect(band.y, 'the band of the card stays at its top').toBeGreaterThanOrEqual(cardBox.y);
    expect(band.y + band.height, 'the band stays above the Table').toBeLessThanOrEqual(tableBox.y);
    expect(await reachWithWheel(page, lastRow, { within: wrapper, wheelPx: WHEEL_PX }), 'the last row comes into view with the wheel').toBe(true);
    const [shown, finalCard] = await Promise.all([wrapper.boundingBox(), card.boundingBox()]);
    if (shown === null || finalCard === null) throw new Error('the card of the long Table lost a part');
    expect(finalCard.height, 'scrolling does not grow the card').toBeCloseTo(cardBox.height, 0);
    expect(shown.y + shown.height, 'the Table ends inside the card').toBeLessThanOrEqual(finalCard.y + finalCard.height);
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
