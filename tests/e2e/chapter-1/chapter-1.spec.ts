import { expect, test, type Locator, type Page } from '@playwright/test';
import { card, confirm, openCard, openTerminal, sendTo } from '@e2e/cards';
import { CHAPTER_1, IP, fixTheGateway, openTheSettings, sendThePacket, sendThePingAndTheTraceroute } from './chapter-1-play';
import { FULL_STARS } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { coveredBy, mapBoxes, overlappingPairs, overlaps, recordLabels, recordedLabels, type Box } from '@e2e/map-boxes';
import { CHAPTER_1_DONE, reloadWithProgress, startWithProgress } from '@e2e/saved-progress';
import { CHAPTER_2, LAST_BUILT_OF_CHAPTER_2 } from '@e2e/chapter-2/chapter-2-play';
import { freezeTime, standStill } from '@e2e/still-scene';

const LOCKED = '(bloqueado)';
const FIRST_PING_LINK = '1. El primer ping';
const CHAPTER_1_TITLE = 'Tu primer día';
const OFFICE_PIECES = ['laptop-lucia con candado', 'impresora con candado', 'laptop-andres con candado', 'router-oficina con candado'];
const SECOND_FLOOR = /laptop-andres|Piso 2/;
const GLOBE_AND_SERVER = /internet/;
const ROUTER = /router-oficina/;
const FULL_SIZE_LAPTOP_DISTANCE_PX = 99.3;
const SAME_PING_SENDS = 3;
const FLIGHT = 'g.map-flight';
const MAP_SVG = '.map-stage__svg';
const LONGER_THAN_A_TRIP_MS = 20_000;
const WINDOWS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
const SENDING: Record<string, (terminal: Locator) => Promise<void>> = {
  '01-06': (terminal) => sendTo(terminal, IP.andres),
  '01-10': sendThePingAndTheTraceroute,
};

async function expectFirstPingOpenWith(page: Page, progress: Record<string, number>) {
  await reloadWithProgress(page, progress);
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.locator('li[data-level-id="04-01"]')).not.toContainText(LOCKED);
}

async function expectApart(opened: Locator, target: Locator) {
  await expect(opened).toBeVisible();
  await expect(target).toBeVisible();
  expect(overlaps(await opened.boundingBox(), await target.boundingBox())).toBe(false);
}

async function openAndSend(page: Page, id: string, sending = SENDING[id]): Promise<Locator> {
  await page.goto(`/#/level/${id}`);
  const terminal = await openTerminal(page);
  await sending(terminal);
  return terminal;
}

async function openedBox(opened: Locator) {
  const box = await opened.boundingBox();
  if (box === null) throw new Error('the card is not on the screen');
  return box;
}

function distanceBetweenLaptops(boxes: Box[]): number | undefined {
  const [yours, lucia] = [/^tu-laptop$/, /^laptop-lucia/].map((name) => boxes.find((box) => name.test(box.name.trim())));
  if (yours === undefined || lucia === undefined) return undefined;
  return Math.hypot(lucia.x + lucia.width / 2 - (yours.x + yours.width / 2), lucia.y + lucia.height / 2 - (yours.y + yours.height / 2));
}

function inEachWindow(define: () => void) {
  for (const size of WINDOWS) {
    test.describe(`${size.width}×${size.height}`, () => {
      test.use({ viewport: size });
      define();
    });
  }
}

test('chapter 1 is played from 01-01 to 01-14, each incident opening the next, with 3 stars each', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  await page.goto('/');
  await page.getByRole('link', { name: '1. La oficina' }).click();
  for (const [index, { id, title, play }] of CHAPTER_1.entries()) {
    await expect(page.getByRole('heading', { level: 1, name: title }), id).toBeVisible();
    await play(page);
    const last = index === CHAPTER_1.length - 1;
    await page.getByRole('link', { name: last ? 'Volver al roadmap' : 'Siguiente incidente' }).click();
  }
  for (const { id } of CHAPTER_1) await expect(page.locator(`li[data-level-id="${id}"]`)).toContainText(FULL_STARS);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expect(page.getByRole('link', { name: `1. ${CHAPTER_2[0].title}` })).toHaveAttribute('href', `#/level/${CHAPTER_2[0].id}`);
  expect(errors).toEqual([]);
});

test('the roadmap lists the fourteen incidents of chapter 1 with their stars', async ({ page }) => {
  const errors = collectErrors(page);
  const earned = { '01-01': 3, '01-02': 2, '01-03': 1 };
  await startWithProgress(page, earned);
  await page.goto('/');
  await expect(page.locator('li[data-level-id^="01-"]')).toHaveCount(CHAPTER_1.length);
  await expect(page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2, name: CHAPTER_1_TITLE }) })).toContainText(`${Object.keys(earned).length}/${CHAPTER_1.length}`);
  for (const [index, { id, title }] of CHAPTER_1.entries()) {
    const item = page.locator(`li[data-level-id="${id}"]`);
    const stars = earned[id as keyof typeof earned] ?? 0;
    await expect(item).toContainText(`${index + 1}. ${title}`);
    await expect(item).toContainText(`${stars} de 3 estrellas`);
    if (index <= Object.keys(earned).length) await expect(item.getByRole('link', { name: title })).toHaveAttribute('href', `#/level/${id}`);
    else await expect(item).toContainText(LOCKED);
  }
  expect(errors).toEqual([]);
});

test('chapter 1 opens at 01-01 and 04-01 opens once the incident before it has a star', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.getByRole('link', { name: '1. La oficina' })).toHaveAttribute('href', '#/level/01-01');
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText(LOCKED);
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expectFirstPingOpenWith(page, { [LAST_BUILT_OF_CHAPTER_2]: 1 });
  expect(errors).toEqual([]);
});

test('04-01 stays locked after 01-14 has a star and opens after the last built incident of chapter 2 has one', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-13': 3 });
  await page.goto('/');
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await reloadWithProgress(page, { '01-14': 1 });
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expectFirstPingOpenWith(page, { [LAST_BUILT_OF_CHAPTER_2]: 1 });
  expect(errors).toEqual([]);
});

test('04-01 stays open with its stored stars although chapter 1 has none, and 04-02 opens after it', async ({ page }) => {
  await startWithProgress(page, { '04-01': 2 });
  await page.goto('/');
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toHaveAttribute('href', '#/level/04-01');
  await expect(page.getByRole('link', { name: '2. Abre lo justo' })).toBeVisible();
  await expect(page.locator('li[data-level-id="01-02"]')).toContainText(LOCKED);
  await page.getByRole('link', { name: FIRST_PING_LINK }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'El primer ping' })).toBeVisible();
});

test('in 05 the stamp of the ping to laptop-marta tells a screen reader that it was lost, not blocked', async ({ page }) => {
  await startWithProgress(page, { '01-04': 1 });
  await page.goto('/#/level/01-05');
  await sendTo(await openTerminal(page), IP.marta);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a laptop-marta\. Perdido\.$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Paquete:.*Bloqueado/ })).toHaveCount(0);
});

test('in 03 the same ping sent three times is one stamp and, on the 2D map, three packets in the air at once, and the first two go when their own trips end', async ({ page }) => {
  await page.clock.install();
  await startWithProgress(page, { '01-02': 1 });
  await page.goto('/#/level/01-03');
  const terminal = await openTerminal(page);
  await standStill(page);
  await freezeTime(page);
  const drawsFlights = (await page.locator(MAP_SVG).count()) > 0;
  for (let send = 1; send <= SAME_PING_SENDS; send += 1) {
    await sendTo(terminal, IP.printer);
    await expect(page.locator(FLIGHT), `after send ${send}`).toHaveCount(drawsFlights ? send : 0);
  }
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
  await page.clock.runFor(LONGER_THAN_A_TRIP_MS);
  await expect(page.locator(FLIGHT), 'once every trip is over, only the last send stays').toHaveCount(drawsFlights ? 1 : 0);
  await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
});

test('in 11 the stamp of the ping to laptop-marta tells a screen reader that the firewall blocked it', async ({ page }) => {
  await startWithProgress(page, { '01-10': 1 });
  await page.goto('/#/level/01-11');
  await sendTo(await openTerminal(page), IP.marta);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a laptop-marta\. Bloqueado\.$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Paquete:.*Perdido/ })).toHaveCount(0);
});

test('in 07 picking the gateway in the Ajustes de red tab changes the stamps of the ping', async ({ page }) => {
  await startWithProgress(page, { '01-06': 1 });
  await page.goto('/#/level/01-07');
  await fixTheGateway(page);
});

test('in 13 the tabs Entrada and Salida of the firewall card are reached and switched with the keyboard', async ({ page }) => {
  await startWithProgress(page, { '01-12': 1 });
  await page.goto('/#/level/01-13');
  const firewall = await openCard(page, 'firewall tu-laptop');
  const [inbound, outbound] = [/^entrada$/i, /^salida$/i].map((name) => firewall.getByRole('tab', { name }));
  await expect(firewall.getByRole('heading', { level: 2 })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(inbound).toBeFocused();
  await expect(inbound).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(outbound).toBeFocused();
  await expect(outbound).toHaveAttribute('aria-selected', 'true');
  await expect(inbound).toHaveAttribute('aria-selected', 'false');
  await expect(firewall.getByRole('tabpanel')).toContainText('cerrada');
  await page.keyboard.press('Home');
  await expect(inbound).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(outbound).toHaveAttribute('aria-selected', 'true');
});

test.describe('Sin animaciones', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  inEachWindow(() => {
    test('in 01-01 the open card of the printer covers none of the pieces the player compares', async ({ page }) => {
      await page.goto('/#/level/01-01');
      const printer = await openCard(page, 'impresora');
      for (const piece of ['impresora', 'laptop-marta con candado', 'laptop-lucia', 'laptop-visita']) {
        await expectApart(printer, page.getByRole('button', { name: piece, exact: true }));
      }
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
    });

    test('in 01-02 the open terminal covers neither the printer, nor laptop-marta, nor the packet once sent', async ({ page }) => {
      await startWithProgress(page, { '01-01': 3 });
      await page.goto('/#/level/01-02');
      await sendThePacket(page);
      const terminal = card(page, 'Terminal de tu-laptop');
      await expectApart(terminal, page.getByRole('button', { name: 'impresora con candado', exact: true }));
      await expectApart(terminal, page.getByRole('button', { name: 'laptop-marta con candado', exact: true }));
      await expect(page.getByRole('button', { name: /^Paquete: paquete de tu-laptop a impresora\. Llegó\.$/ })).toBeVisible();
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
    });

    test('in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps', async ({ page }) => {
      await startWithProgress(page, { '01-06': 1 });
      await page.goto('/#/level/01-07');
      const settings = await openTheSettings(page);
      for (const piece of OFFICE_PIECES) await expectApart(settings, page.getByRole('button', { name: piece, exact: true }));
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
      await confirm(settings);
      const terminal = await openTerminal(page);
      await sendTo(terminal, IP.andres);
      for (const piece of OFFICE_PIECES) await expectApart(terminal, page.getByRole('button', { name: piece, exact: true }));
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
    });
  });
});

test.describe(`${WINDOWS[0].width}×${WINDOWS[0].height}`, () => {
  test.use({ viewport: WINDOWS[0] });

  test('at 1280×800, after a traceroute, the terminal keeps Enviar and Listo in view', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    const terminal = await openAndSend(page, '01-10');
    await expect(terminal.getByRole('list', { name: 'Salida de traceroute' })).toBeVisible();
    const box = await openedBox(terminal);
    for (const name of ['Enviar', 'Listo']) {
      const action = terminal.getByRole('button', { name, exact: true });
      await expect(action).toBeInViewport({ ratio: 1 });
      const actionBox = await action.boundingBox();
      if (actionBox === null) throw new Error(`${name} is not on the screen`);
      expect(actionBox.y + actionBox.height, name).toBeLessThanOrEqual(box.y + box.height);
    }
  });
});

inEachWindow(() => {
  test('in 06 the open terminal covers neither the router nor the labels of the second floor', async ({ page }) => {
    await startWithProgress(page, { '01-05': 1 });
    const terminal = await openAndSend(page, '01-06');
    await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
    const names = (await mapBoxes(page)).map(({ name }) => name);
    expect(names).toEqual(expect.arrayContaining(['Piso 2', expect.stringMatching(ROUTER), expect.stringMatching(/^laptop-andres/)]));
    const covered = await coveredBy(page, await openedBox(terminal));
    expect(covered.filter((name) => ROUTER.test(name) || SECOND_FLOOR.test(name))).toEqual([]);
  });

  test('in 06 and 08 the map is at full size: two laptops of a floor stand as far apart as at any window', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    for (const id of ['01-06', '01-08']) {
      await page.goto(`/#/level/${id}`);
      await expect(page.getByRole('button', { name: 'tu-laptop', exact: true })).toBeVisible();
      const boxes = await mapBoxes(page);
      const [yours, lucia] = [/^tu-laptop$/, /^laptop-lucia/].map((name) => boxes.find((box) => name.test(box.name.trim())));
      if (yours === undefined || lucia === undefined) throw new Error(`the two laptops are not on the map of ${id}`);
      const apart = Math.hypot(lucia.x + lucia.width / 2 - (yours.x + yours.width / 2), lucia.y + lucia.height / 2 - (yours.y + yours.height / 2));
      expect(apart, id).toBeCloseTo(FULL_SIZE_LAPTOP_DISTANCE_PX, 0);
    }
  });

  test('the labels of the map stand where they belong from the first moment they show', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    await page.goto('/');
    await recordLabels(page);
    await page.goto('/#/level/01-08');
    await expect.poll(async () => distanceBetweenLaptops(await mapBoxes(page)), 'the labels settle').toBeCloseTo(FULL_SIZE_LAPTOP_DISTANCE_PX, 0);
    const distances = (await recordedLabels(page)).map(distanceBetweenLaptops).filter((distance) => distance !== undefined);
    expect(new Set(distances.map((distance) => distance.toFixed(2))).size, `the distances the laptops stood at: ${distances.map((distance) => distance.toFixed(2)).join(', ')}`).toBe(1);
  });

  test('in 10 the open terminal, with the traceroute listed, covers neither the globe nor the server', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    const terminal = await openAndSend(page, '01-10');
    await expect(terminal.getByRole('list', { name: 'Salida de traceroute' })).toBeVisible();
    const watched = (await mapBoxes(page)).map(({ name }) => name).filter((name) => GLOBE_AND_SERVER.test(name));
    expect(watched).toHaveLength(2);
    const covered = await coveredBy(page, await openedBox(terminal));
    expect(covered.filter((name) => GLOBE_AND_SERVER.test(name))).toEqual([]);
  });
});
