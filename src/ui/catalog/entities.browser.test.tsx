import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cdp, page, userEvent, type Locator } from 'vitest/browser';
import { CATALOG_TEXT, INTERFACE_TEXT, MESSAGE_TEXT, SCREEN_TEXT, TERMINAL_TEXT } from '@/copy';
import { emulateReducedMotion, moveTheMouseAway, reachWithWheel, watchErrors } from '@/testing/browser-play';
import { EntitiesPage } from './entities-page';

const WINDOW = { width: 1280, height: 3000 };
const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const CAPTURE = { comparatorName: 'pixelmatch', comparatorOptions: { allowedMismatchedPixelRatio: 0, allowedMismatchedPixels: 0, threshold: 0 } } as const;
const SAMPLE = INTERFACE_TEXT.sample;
const OUTLINE_CAPTION = 'contorno del bloque';
const SHAPE_CAPTIONS = ['TCP pide', 'TCP contesta', 'UDP pide', 'UDP contesta'];
const OUTLINE_AND_INTRUDER_CAPTIONS = [
  OUTLINE_CAPTION,
  ...SHAPE_CAPTIONS,
  'Echo Request · intruso',
  'Echo Reply · intruso',
  ...SHAPE_CAPTIONS.map((caption) => `${caption} · ${CATALOG_TEXT.intruder}`),
];
const OPTIONS = [SAMPLE.option, SAMPLE.chosen, SAMPLE.closed];
const LETTER = /^[A-Z]$/;
const TABLE_CAPTION = SAMPLE.table.caption;
const REMOVE_BUTTON = new RegExp(`^${SAMPLE.table.remove} `);
const MAP_CARD_WIDTH_PX = 352;
const MAP_CARD_ROOM_PX = 224;
const ROW_COPIES = 6;
const WHEEL_PX = 120;
const SCROLLBAR_PX = 12;
const FOCUS_RING_PX = 4;
const OUTPUT_GROUP = TERMINAL_TEXT.output.label.dig;
const OUTPUT_FOLDED_LINES = 17;
const OUTPUT_SHOW = TERMINAL_TEXT.output.show(OUTPUT_FOLDED_LINES);
const OUTPUT_HIDE = TERMINAL_TEXT.output.hide(OUTPUT_FOLDED_LINES);
const OUTPUT_FOLD_MARK = /líneas plegadas$/;
const OUTPUT_KEY_LINES = [/status: NOERROR/, ';; ANSWER SECTION:', /^www\.lucia\.example\.\t300/];
const OUTPUT_FIRST_FOLDED = '; <<>> DiG 9.18.50 <<>> www.lucia.example';
const OUTPUT_LAST_FOLDED = /MSG SIZE/;
const OUTPUT_LINES_ON_VIEW = 3;
const MESSAGE_VARIANTS = ['note', 'success', 'warning', 'error'] as const;
const MESSAGES_DRAWN = { note: 1, success: 2, warning: 1, error: 4 };
const MESSAGE_TABS = {
  note: MESSAGE_TEXT.note,
  success: `✓ ${MESSAGE_TEXT.success}`,
  warning: `! ${MESSAGE_TEXT.warning}`,
  error: `✕ ${MESSAGE_TEXT.error}`,
};

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface FrameNode {
  frame: { id: string; url: string };
  childFrames?: FrameNode[];
}

interface AccessibilityNode {
  role?: { value: string };
  name?: { value?: string };
}

interface DomSnapshot {
  documents: { documentURL: number; layout: { nodeIndex: number[]; text: number[] } }[];
  strings: string[];
}

function isInside(box: Box, region: Box): boolean {
  return box.x >= region.x && box.y >= region.y && box.x + box.width <= region.x + region.width && box.y + box.height <= region.y + region.height;
}

function boxOf(target: Locator | Element): DOMRect {
  return (target instanceof Element ? target : target.element()).getBoundingClientRect();
}

function inside(root: Locator | Element, selector: string): HTMLElement[] {
  return [...(root instanceof Element ? root : root.element()).querySelectorAll<HTMLElement>(selector)];
}

function theOne(root: Locator | Element, selector: string): HTMLElement {
  const [found, ...others] = inside(root, selector);
  if (found === undefined || others.length > 0) throw new Error(`«${selector}» does not match exactly one element`);
  return found;
}

function withText(elements: HTMLElement[], text: string | RegExp): HTMLElement[] {
  return elements.filter((element) => (typeof text === 'string' ? element.textContent === text : text.test(element.textContent ?? '')));
}

function frameOfThePage(node: FrameNode): string | null {
  if (node.frame.url === location.href) return node.frame.id;
  return node.childFrames?.map(frameOfThePage).find((id) => id !== null) ?? null;
}

async function openCatalog() {
  await moveTheMouseAway();
  const { container } = render(<EntitiesPage />);
  const pieces = page.getByRole('region', { name: CATALOG_TEXT.pieces });
  await expect.element(pieces.getByText(CATALOG_TEXT.intruder, { exact: true })).toBeVisible();
  return { container, pieces, elements: page.getByRole('region', { name: INTERFACE_TEXT.title }) };
}

function inAMapCard(container: HTMLElement, source: Element): HTMLElement {
  const holder = document.createElement('div');
  holder.className = 'map-card';
  holder.style.cssText = `position: fixed; top: 16px; left: 16px; z-index: 100; --card-width: ${MAP_CARD_WIDTH_PX}px; --card-room: ${MAP_CARD_ROOM_PX}px`;
  holder.append(source);
  container.append(holder);
  return holder;
}

beforeEach(async () => {
  await page.viewport(WINDOW.width, WINDOW.height);
  await emulateReducedMotion(true);
});

afterEach(async () => {
  await emulateReducedMotion(false);
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

it('the entity catalog draws every entity in every variant and state as recorded', async () => {
  const watched = watchErrors();
  try {
    const { pieces } = await openCatalog();
    await expect.element(page.getByLabelText(SCREEN_TEXT.motion)).toBeChecked();
    const region = boxOf(pieces);
    for (const caption of OUTLINE_AND_INTRUDER_CAPTIONS) {
      expect(isInside(boxOf(pieces.getByRole('figure', { name: caption, exact: true })), region), `the specimen «${caption}» lies inside the captured region`).toBe(true);
    }
    await expect.element(pieces).toMatchScreenshot('entities', CAPTURE);
    expect(watched.errors).toEqual([]);
  } finally {
    watched.stop();
  }
});

it('the interface elements are drawn in every variant and state as recorded, with the focus ring on an option', async () => {
  const watched = watchErrors();
  try {
    const { elements } = await openCatalog();
    await userEvent.tab();
    const option = elements.getByRole('button', { name: SAMPLE.option }).element() as HTMLElement;
    option.focus();
    expect(option.matches(':focus-visible'), 'the option wears the focus ring').toBe(true);
    await expect.element(elements).toMatchScreenshot('interface', CAPTURE);
    expect(watched.errors).toEqual([]);
  } finally {
    watched.stop();
  }
});

it('the options of the interface specimen show the letters A, B and C and keep their sentence as their accessible name', async () => {
  const { elements } = await openCatalog();
  for (const sentence of OPTIONS) await expect.element(elements.getByRole('button', { name: sentence, exact: true })).toBeVisible();
  const session = cdp();
  const { frameTree } = (await session.send('Page.getFrameTree')) as unknown as { frameTree: FrameNode };
  const frameId = frameOfThePage(frameTree);
  expect(frameId, 'the frame of the test is in the frame tree').not.toBeNull();
  const { nodes } = (await session.send('Accessibility.getFullAXTree', { frameId: frameId as string })) as unknown as { nodes: AccessibilityNode[] };
  const names = nodes.filter((node) => node.role?.value === 'button' && OPTIONS.some((sentence) => node.name?.value?.includes(sentence)));
  expect(names.map((node) => node.name?.value)).toEqual(OPTIONS);
  const snapshot = (await session.send('DOMSnapshot.captureSnapshot', { computedStyles: [] })) as unknown as DomSnapshot;
  const thePage = snapshot.documents.find((document) => snapshot.strings[document.documentURL] === location.href);
  expect(thePage, 'the page of the test is in the snapshot').toBeDefined();
  const { layout } = thePage as DomSnapshot['documents'][number];
  const drawn = layout.nodeIndex.flatMap((_, index) => snapshot.strings[layout.text[index]] ?? []);
  expect(drawn.filter((text) => LETTER.test(text))).toEqual(['A', 'B', 'C']);
});

it('the interface specimen of Table is part of the capture', async () => {
  const { elements } = await openCatalog();
  const tables = elements.getByRole('table', { name: TABLE_CAPTION });
  expect(tables.elements()).toHaveLength(2);
  const [filled, empty] = [tables.first(), tables.last()];
  expect(filled.getByRole('button', { name: REMOVE_BUTTON }).elements()).toHaveLength(2);
  await expect.element(filled.getByText(SAMPLE.table.inUse, { exact: true })).toBeVisible();
  await expect.element(empty.getByText(SAMPLE.table.empty, { exact: true })).toBeVisible();
  const region = boxOf(elements);
  for (const table of [filled, empty]) expect(isInside(boxOf(table), region), 'a specimen of Table is inside the captured region').toBe(true);
});

it('the interface specimen of the output card is part of the capture', async () => {
  const { elements } = await openCatalog();
  const output = elements.getByRole('group', { name: OUTPUT_GROUP });
  await expect.element(output).toBeVisible();
  expect(inside(output, 'code')).toHaveLength(OUTPUT_LINES_ON_VIEW);
  for (const key of OUTPUT_KEY_LINES) {
    const [line, ...others] = withText(inside(output, '.output__line--key'), key);
    expect(line, `the key line ${key} is drawn`).toBeDefined();
    expect(others, `the key line ${key} is drawn once`).toHaveLength(0);
    await expect.element(line).toBeVisible();
  }
  expect(output.getByText(OUTPUT_FOLD_MARK).elements()).toHaveLength(OUTPUT_LINES_ON_VIEW);
  expect(output.getByText(OUTPUT_FIRST_FOLDED).elements()).toHaveLength(0);
  await expect.element(elements.getByRole('button', { name: OUTPUT_SHOW })).toHaveAttribute('aria-expanded', 'false');
  expect(isInside(boxOf(output), boxOf(elements)), 'the specimen is inside the captured region').toBe(true);
});

it('the focus ring of a remove button fits inside the wrapper of the Table', async () => {
  const { elements } = await openCatalog();
  const filled = elements.getByRole('table', { name: TABLE_CAPTION }).first();
  const last = filled.getByRole('button', { name: REMOVE_BUTTON }).last();
  (last.element() as HTMLElement).focus();
  const [button, wrapper] = [boxOf(last), boxOf(filled.element().parentElement as HTMLElement)];
  expect(button.x + button.width + FOCUS_RING_PX).toBeLessThanOrEqual(wrapper.x + wrapper.width);
  expect(button.y - FOCUS_RING_PX).toBeGreaterThanOrEqual(wrapper.y);
  expect(button.y + button.height + FOCUS_RING_PX).toBeLessThanOrEqual(wrapper.y + wrapper.height);
});

it('a long Table in a card on the map stays inside the card and scrolls there', async () => {
  const { container } = await openCatalog();
  const source = [...document.querySelectorAll('table')].find((table) => table.caption?.textContent === TABLE_CAPTION)?.closest('.card');
  const rows = source?.querySelectorAll('tbody tr');
  if (!source || !rows) throw new Error('the specimen of Table is not on the page');
  const card = source.cloneNode(true) as Element;
  const body = card.querySelector('tbody');
  for (let copy = 0; copy < ROW_COPIES; copy++) for (const row of rows) body?.append(row.cloneNode(true));
  const holder = inAMapCard(container, card);
  const [wrapper, table] = [theOne(holder, '.table'), theOne(holder, 'table')];
  const cardBox = boxOf(theOne(holder, '.card'));
  expect(cardBox.height, 'the card keeps the height the map gives it').toBeLessThanOrEqual(MAP_CARD_ROOM_PX + 1);
  expect(wrapper.scrollHeight, 'the Table has more rows than it shows').toBeGreaterThan(wrapper.clientHeight + 1);
  expect(getComputedStyle(wrapper).overflowY, 'the Table scrolls in its wrapper').toBe('auto');
  expect(getComputedStyle(wrapper, '::-webkit-scrollbar').width, 'the wrapper draws its own scrollbar').toBe(`${SCROLLBAR_PX}px`);
  const band = boxOf(theOne(holder, '.card__band'));
  expect(band.y, 'the band of the card stays at its top').toBeGreaterThanOrEqual(cardBox.y);
  expect(band.y + band.height, 'the band stays above the Table').toBeLessThanOrEqual(boxOf(table).y);
  const lastRow = page.elementLocator(inside(holder, 'tbody tr').at(-1) as HTMLElement);
  expect(await reachWithWheel(lastRow, { within: page.elementLocator(wrapper), wheelPx: WHEEL_PX }), 'the last row comes into view with the wheel').toBe(true);
  const finalCard = boxOf(theOne(holder, '.card'));
  expect(finalCard.height, 'scrolling does not grow the card').toBeCloseTo(cardBox.height, 0);
  expect(boxOf(wrapper).bottom, 'the Table ends inside the card').toBeLessThanOrEqual(finalCard.bottom);
});

it('an unfolded output in a card on the map stays inside the card, scrolls in its body and keeps the foot in view', async () => {
  const { container, elements } = await openCatalog();
  await userEvent.click(elements.getByRole('button', { name: OUTPUT_SHOW }));
  await expect.element(elements.getByRole('button', { name: OUTPUT_HIDE })).toBeVisible();
  const source = document.querySelector(`[aria-label="${OUTPUT_GROUP}"]`)?.closest('.card');
  if (!source) throw new Error('the specimen of the output is not on the page');
  const holder = inAMapCard(container, source.cloneNode(true) as Element);
  const [card, body, foot] = [theOne(holder, '.card'), theOne(holder, '.chip-card__body'), theOne(holder, '.chip-card__actions')];
  const cardBox = boxOf(card);
  expect(cardBox.height, 'the card keeps the height the map gives it').toBeLessThanOrEqual(MAP_CARD_ROOM_PX + 1);
  expect(body.scrollHeight, 'the output has more lines than it shows').toBeGreaterThan(body.clientHeight + 1);
  expect(getComputedStyle(body).overflowY, 'the body of the card scrolls').toBe('auto');
  expect(getComputedStyle(body, '::-webkit-scrollbar').width, 'the body draws its own scrollbar').toBe(`${SCROLLBAR_PX}px`);
  expect(boxOf(theOne(holder, '.card__band')).y, 'the band of the card stays at its top').toBeGreaterThanOrEqual(cardBox.y);
  expect(boxOf(foot).bottom, 'the foot stays inside the card').toBeLessThanOrEqual(cardBox.bottom);
  const lastLine = withText(inside(holder, `[aria-label="${OUTPUT_GROUP}"] code`), OUTPUT_LAST_FOLDED).at(-1) as HTMLElement;
  expect(await reachWithWheel(page.elementLocator(lastLine), { within: page.elementLocator(body), wheelPx: WHEEL_PX }), 'the last line comes into view with the wheel').toBe(true);
  const finalCard = boxOf(card);
  expect(finalCard.height, 'scrolling does not grow the card').toBeCloseTo(cardBox.height, 0);
  expect(boxOf(body).bottom, 'the output ends above the foot').toBeLessThanOrEqual(boxOf(foot).y);
  expect(boxOf(foot).bottom, 'the foot is still inside the card').toBeLessThanOrEqual(finalCard.bottom);
});

it('the interface specimens of Message are part of the capture', async () => {
  const { elements } = await openCatalog();
  const region = boxOf(elements);
  for (const variant of MESSAGE_VARIANTS) {
    const drawn = inside(elements, `.message--${variant}`);
    expect(drawn).toHaveLength(MESSAGES_DRAWN[variant]);
    expect(theOne(drawn[0], '.message__tab').textContent, `the tab of a ${variant} message`).toBe(MESSAGE_TABS[variant]);
    for (const message of drawn) {
      expect(isInside(boxOf(message), region), `the ${variant} frame is inside the captured region`).toBe(true);
      expect(isInside(boxOf(theOne(message, '.message__tab')), region), `the ${variant} tab is inside the captured region`).toBe(true);
    }
  }
});
