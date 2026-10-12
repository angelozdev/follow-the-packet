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
const OUTPUT_GROUP = 'Salida de dig';
const OUTPUT_FOLDED_LINES = 17;
const OUTPUT_SHOW = `Ver las ${OUTPUT_FOLDED_LINES} líneas restantes`;
const OUTPUT_HIDE = `Ocultar las ${OUTPUT_FOLDED_LINES} líneas restantes`;
const OUTPUT_FOLD_MARK = /líneas plegadas$/;
const OUTPUT_KEY_LINES = [/status: NOERROR/, ';; ANSWER SECTION:', /^www\.lucia\.example\.\t300/];
const OUTPUT_FIRST_FOLDED = '; <<>> DiG 9.18.50 <<>> www.lucia.example';
const OUTPUT_LAST_FOLDED = /MSG SIZE/;
const OUTPUT_LINES_ON_VIEW = 3;
const BLOCK_CAPTION = 'contorno del bloque';
const SHAPE_CAPTIONS = ['TCP pide', 'TCP contesta', 'UDP pide', 'UDP contesta'];
const INTRUDER_CAPTIONS = ['Echo Request · intruso', 'Echo Reply · intruso', ...SHAPE_CAPTIONS.map((caption) => `${caption} · intruso`)];
const MESSAGE_VARIANTS = ['note', 'success', 'warning', 'error'] as const;
const MESSAGES_DRAWN = { note: 1, success: 2, warning: 1, error: 4 };
const MESSAGE_TABS = { note: 'Nota', success: '✓ Correcto', warning: '! Aviso', error: '✕ Error' };
const REGULAR_STROKE_PX = 1;
const MESSAGE_FRAMES = { note: ['solid', REGULAR_STROKE_PX], success: ['solid', 2], warning: ['dashed', REGULAR_STROKE_PX], error: ['double', 4] };
const MESSAGE_TAB_LEFT_PX = { min: 11, max: 12 };
const MESSAGE_TAB_OVERLAP_PX = { min: 1, max: 2 };

test.use({ viewport: { width: 1280, height: 3000 }, deviceScaleFactor: 1 });

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

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isInside(box: Box, region: Box): boolean {
  return box.x >= region.x && box.y >= region.y && box.x + box.width <= region.x + region.width && box.y + box.height <= region.y + region.height;
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

  test('the interface specimen of the output card is part of the capture', async ({ page }) => {
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    const output = elements.getByRole('group', { name: OUTPUT_GROUP });
    await expect(output).toBeVisible();
    await expect(output.locator('code')).toHaveCount(OUTPUT_LINES_ON_VIEW);
    for (const key of OUTPUT_KEY_LINES) await expect(output.locator('.output__line--key').filter({ hasText: key })).toBeVisible();
    await expect(output.getByText(OUTPUT_FOLD_MARK)).toHaveCount(OUTPUT_LINES_ON_VIEW);
    await expect(output.getByText(OUTPUT_FIRST_FOLDED)).toHaveCount(0);
    await expect(elements.getByRole('button', { name: OUTPUT_SHOW })).toHaveAttribute('aria-expanded', 'false');
    const [region, box] = await Promise.all([elements.boundingBox(), output.boundingBox()]);
    if (region === null || box === null) throw new Error('the output specimen is not drawn');
    expect(isInside(box, region), 'the specimen is inside the captured region').toBe(true);
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

  test('an unfolded output in a card on the map stays inside the card, scrolls in its body and keeps the foot in view', async ({ page }) => {
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    await elements.getByRole('button', { name: OUTPUT_SHOW }).click();
    await expect(elements.getByRole('button', { name: OUTPUT_HIDE })).toBeVisible();
    await page.evaluate(
      ([group, width, room]) => {
        const source = document.querySelector(`[aria-label="${group}"]`)?.closest('.card');
        if (!source) throw new Error('the specimen of the output is not on the page');
        const holder = document.createElement('div');
        holder.className = 'map-card';
        holder.dataset.testid = 'long-output';
        holder.style.cssText = `position: fixed; top: 16px; left: 16px; z-index: 100; --card-width: ${width}px; --card-room: ${room}px`;
        holder.append(source.cloneNode(true));
        document.body.append(holder);
      },
      [OUTPUT_GROUP, MAP_CARD_WIDTH_PX, MAP_CARD_ROOM_PX] as const,
    );
    const holder = page.getByTestId('long-output');
    const card = holder.locator('.card');
    const body = holder.locator('.chip-card__body');
    const lastLine = holder.getByRole('group', { name: OUTPUT_GROUP }).locator('code').filter({ hasText: OUTPUT_LAST_FOLDED });
    const [before, cardBox] = await Promise.all([body.evaluate((element) => ({ clientHeight: element.clientHeight, scrollHeight: element.scrollHeight })), card.boundingBox()]);
    if (cardBox === null) throw new Error('the card of the long output is not drawn');
    expect(cardBox.height, 'the card keeps the height the map gives it').toBeLessThanOrEqual(MAP_CARD_ROOM_PX + 1);
    expect(before.scrollHeight, 'the output has more lines than it shows').toBeGreaterThan(before.clientHeight + 1);
    expect(await body.evaluate((element) => getComputedStyle(element).overflowY), 'the body of the card scrolls').toBe('auto');
    expect(await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width), 'the body draws its own scrollbar').toBe(`${SCROLLBAR_PX}px`);
    const [band, foot] = await Promise.all([card.locator('.card__band').boundingBox(), holder.locator('.chip-card__actions').boundingBox()]);
    if (band === null || foot === null) throw new Error('the card of the long output lost its band or its foot');
    expect(band.y, 'the band of the card stays at its top').toBeGreaterThanOrEqual(cardBox.y);
    expect(foot.y + foot.height, 'the foot stays inside the card').toBeLessThanOrEqual(cardBox.y + cardBox.height);
    expect(await reachWithWheel(page, lastLine, { within: body, wheelPx: WHEEL_PX }), 'the last line comes into view with the wheel').toBe(true);
    const [shown, finalCard, finalFoot] = await Promise.all([body.boundingBox(), card.boundingBox(), holder.locator('.chip-card__actions').boundingBox()]);
    if (shown === null || finalCard === null || finalFoot === null) throw new Error('the card of the long output lost a part');
    expect(finalCard.height, 'scrolling does not grow the card').toBeCloseTo(cardBox.height, 0);
    expect(shown.y + shown.height, 'the output ends above the foot').toBeLessThanOrEqual(finalFoot.y);
    expect(finalFoot.y + finalFoot.height, 'the foot is still inside the card').toBeLessThanOrEqual(finalCard.y + finalCard.height);
  });

  test('the specimens of the outline of the block and of the intruders are part of the capture', async ({ page }) => {
    const pieces = await openCatalog(page);
    const region = await pieces.boundingBox();
    if (region === null) throw new Error('the pieces section is not on the page');
    for (const caption of [BLOCK_CAPTION, ...SHAPE_CAPTIONS, ...INTRUDER_CAPTIONS]) {
      const drawn = pieces.getByText(caption, { exact: true });
      await expect(drawn, caption).toHaveCount(1);
      const box = await drawn.boundingBox();
      if (box === null) throw new Error(`the caption ${caption} is not drawn`);
      expect(isInside(box, region), `${caption} is inside the captured region`).toBe(true);
    }
  });

  test('the interface specimens of Message are part of the capture', async ({ page }) => {
    await openCatalog(page);
    const elements = page.getByRole('region', { name: INTERFACE });
    const region = await elements.boundingBox();
    if (region === null) throw new Error('the interface section is not on the page');
    for (const variant of MESSAGE_VARIANTS) {
      const drawn = elements.locator(`.message--${variant}`);
      await expect(drawn).toHaveCount(MESSAGES_DRAWN[variant]);
      await expect(drawn.locator('.message__tab').first()).toHaveText(MESSAGE_TABS[variant]);
      for (const message of await drawn.all()) {
        const [frame, tab] = await Promise.all([message.boundingBox(), message.locator('.message__tab').boundingBox()]);
        if (frame === null || tab === null) throw new Error(`a ${variant} message is not drawn`);
        expect(isInside(frame, region), `the ${variant} frame is inside the captured region`).toBe(true);
        expect(isInside(tab, region), `the ${variant} tab is inside the captured region`).toBe(true);
      }
    }
  });

  test('each variant of Message is told apart by a mark or a border shape and not only by colour', async ({ page }) => {
    await openCatalog(page);
    const looks = await page.getByRole('region', { name: INTERFACE }).locator('.message').evaluateAll((messages) =>
      messages.map((message) => {
        const frame = getComputedStyle(message);
        const tab = message.querySelector('.message__tab');
        if (tab === null) throw new Error('a message has no tab');
        const tabStyle = getComputedStyle(tab);
        return {
          variant: [...message.classList].find((name) => name.startsWith('message--'))?.replace('message--', ''),
          frame: [frame.borderTopStyle, Number.parseFloat(frame.borderTopWidth)],
          tab: tab.textContent,
          tabBorder: tabStyle.borderTopStyle,
          transform: tabStyle.textTransform,
        };
      }),
    );
    expect(looks).toHaveLength(Object.values(MESSAGES_DRAWN).reduce((sum, count) => sum + count, 0));
    for (const look of looks) {
      expect(look.frame, `the frame of a ${look.variant} message`).toEqual(MESSAGE_FRAMES[look.variant as keyof typeof MESSAGE_FRAMES]);
      expect(look.tab, `the tab of a ${look.variant} message`).toBe(MESSAGE_TABS[look.variant as keyof typeof MESSAGE_TABS]);
      expect(look.transform).toBe('uppercase');
    }
    const shapes = MESSAGE_VARIANTS.map((variant) => JSON.stringify([MESSAGE_FRAMES[variant], MESSAGE_TABS[variant]]));
    expect(new Set(shapes).size, 'no two variants share a frame and a word').toBe(MESSAGE_VARIANTS.length);
    expect(new Set(MESSAGE_VARIANTS.map((variant) => JSON.stringify(MESSAGE_FRAMES[variant]))).size, 'no two variants share a frame').toBe(MESSAGE_VARIANTS.length);
    expect(looks.find((look) => look.variant === 'warning')?.tabBorder, 'the tab of a warning is dashed like its frame').toBe('dashed');
  });

  test('the tab of a Message sticks out above its frame without covering the message above it', async ({ page }) => {
    await openCatalog(page);
    await page.evaluate((variants) => {
      const stack = document.createElement('div');
      stack.dataset.testid = 'message-stack';
      stack.style.cssText = 'position: relative; width: 20rem; padding: 0 1rem 1rem';
      for (const variant of [...variants, 'error']) {
        const source = document.querySelector(`.catalog__specimen .message--${variant}`);
        if (source === null) throw new Error(`the specimen of ${variant} is not on the page`);
        stack.append(source.cloneNode(true));
      }
      document.body.append(stack);
      stack.scrollIntoView();
    }, MESSAGE_VARIANTS);
    const messages = page.getByTestId('message-stack').locator('.message');
    await expect(messages).toHaveCount(MESSAGE_VARIANTS.length + 1);
    const boxes = await messages.evaluateAll((nodes) =>
      nodes.map((node) => {
        const [frame, tab] = [node.getBoundingClientRect(), node.querySelector('.message__tab')?.getBoundingClientRect()];
        if (tab === undefined) throw new Error('a message has no tab');
        const above = document.elementFromPoint(frame.x + frame.width / 2, frame.y + frame.height / 2);
        const onTab = document.elementFromPoint(tab.x + tab.width / 2, tab.y + tab.height / 2);
        return {
          frame: { top: frame.top, bottom: frame.bottom, left: frame.left, right: frame.right },
          tab: { top: tab.top, bottom: tab.bottom, left: tab.left, right: tab.right },
          frameOnTop: above?.closest('.message') === node,
          tabOnTop: onTab?.closest('.message__tab') === node.querySelector('.message__tab'),
        };
      }),
    );
    boxes.forEach((box, index) => {
      expect(box.tab.top, `the tab ${index} sticks out above its frame`).toBeLessThan(box.frame.top);
      expect(box.tab.bottom - box.frame.top, `the tab ${index} sits on the top edge of its frame`).toBeGreaterThanOrEqual(MESSAGE_TAB_OVERLAP_PX.min);
      expect(box.tab.bottom - box.frame.top, `the tab ${index} does not sink into its frame`).toBeLessThanOrEqual(MESSAGE_TAB_OVERLAP_PX.max);
      expect(box.tab.left - box.frame.left, `the tab ${index} starts at the left of its frame`).toBeGreaterThanOrEqual(MESSAGE_TAB_LEFT_PX.min);
      expect(box.tab.left - box.frame.left, `the tab ${index} starts near the corner of its frame`).toBeLessThanOrEqual(MESSAGE_TAB_LEFT_PX.max);
      expect(box.tab.right, `the tab ${index} ends before the right edge of its frame`).toBeLessThanOrEqual(box.frame.right);
      expect(box.frameOnTop, `nothing covers the middle of the message ${index}`).toBe(true);
      expect(box.tabOnTop, `the tab ${index} is not covered by anything`).toBe(true);
      if (index === 0) return;
      expect(box.tab.top, `the tab ${index} stays below the message above it`).toBeGreaterThan(boxes[index - 1].frame.bottom);
    });
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
