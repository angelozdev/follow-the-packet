import { expect, test, type Locator, type Page } from '@playwright/test';
import { PROGRESS_KEY } from '@/storage/progress';
import { card, confirm, openCard, openTerminal, sendMessage, sendTo } from '@e2e/cards';
import { CHAPTER_1, IP, LOST_TO_SERVER, SETTINGS_BUTTON, SETTINGS_CARD, WATCH_CASES, fixTheGateway, sendOnlyThePing, sendThePacket, sendThePingAndTheTraceroute, sendThePingsWithTtl, sendTheTestsOfTheCase } from './chapter-1-play';
import { FULL_STARS, closeCase } from '@e2e/closing';
import { collectErrors } from '@e2e/console-errors';
import { coveredBy, mapArea, mapBoxes, outsideTheArea, overlappingPairs, overlaps, recordLabels, recordedLabels, type Box } from '@e2e/map-boxes';
import { CHAPTER_1_DONE, startWithProgress } from '@e2e/saved-progress';

const LOCKED = '(bloqueado)';
const FIRST_PING_LINK = '1. El primer ping';
const LAST_BUILT_OF_CHAPTER_1 = '01-14';
const CHAPTER_1_TITLE = 'Tu primer día';
const OFFICE_PIECES = ['laptop-lucia con candado', 'impresora con candado', 'laptop-andres con candado', 'router-oficina con candado'];
const SECOND_FLOOR = /laptop-andres|Piso 2/;
const GLOBE_AND_SERVER = /internet/;
const ROUTER = /router-oficina/;
const FULL_SIZE_LAPTOP_DISTANCE_PX = 99.3;
const LAPTOP_REACH_PX = { across: 56, down: 88 };
const A_ROUTER_OF_THE_PATH = /router-(oficina|proveedor|destino)|(?<!\d)(192\.168\.1\.1|203\.0\.113\.\d+)(?!\d)/;
const A_HOP = /salto|pasó por/i;
const THE_PING_TO_THE_SERVER = `ping de tu-laptop a ${IP.server}`;
const WINDOWS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
];
const SENDING: Record<string, (terminal: Locator) => Promise<void>> = {
  '01-06': (terminal) => sendTo(terminal, IP.andres),
  '01-08': async (terminal) => {
    await sendTo(terminal, IP.server);
    await sendTo(terminal, IP.otherOffice);
  },
  '01-09': sendThePingsWithTtl,
  '01-10': sendThePingAndTheTraceroute,
};

async function reloadWithProgress(page: Page, progress: Record<string, number>) {
  await page.evaluate(([key, saved]) => localStorage.setItem(key, saved), [PROGRESS_KEY, JSON.stringify(progress)]);
  await page.reload();
}

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

async function sendAndClose(page: Page, id: string, sending = SENDING[id]) {
  const terminal = await openAndSend(page, id, sending);
  await confirm(terminal);
  await expect(terminal).toBeHidden();
}

async function expectBesideYourLaptop(page: Page, stamp: Locator) {
  const [stampBox, label] = await Promise.all([stamp.boundingBox(), page.getByRole('button', { name: 'tu-laptop', exact: true }).boundingBox()]);
  if (stampBox === null || label === null) throw new Error('the stamp or the laptop is not on the screen');
  const [apart, below] = [stampBox.x + stampBox.width / 2 - (label.x + label.width / 2), stampBox.y + stampBox.height / 2 - (label.y + label.height / 2)];
  expect(Math.abs(apart)).toBeLessThanOrEqual(LAPTOP_REACH_PX.across);
  expect(below).toBeGreaterThan(0);
  expect(below).toBeLessThanOrEqual(LAPTOP_REACH_PX.down);
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

function fitTest(title: string, ids: string[]) {
  test(title, async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    for (const id of ids) {
      await sendAndClose(page, id);
      await expect.poll(async () => outsideTheArea(page, await mapArea(page)), id).toEqual([]);
    }
  });
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
  await expect(page.getByRole('link', { name: FIRST_PING_LINK })).toHaveAttribute('href', '#/level/04-01');
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
  await expectFirstPingOpenWith(page, { [LAST_BUILT_OF_CHAPTER_1]: 1 });
  expect(errors).toEqual([]);
});

test('04-01 opens after 01-14 has a star', async ({ page }) => {
  const errors = collectErrors(page);
  await startWithProgress(page, { '01-13': 3 });
  await page.goto('/');
  await expect(page.locator('li[data-level-id="04-01"]')).toContainText(LOCKED);
  await expectFirstPingOpenWith(page, { [LAST_BUILT_OF_CHAPTER_1]: 1 });
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

test('in 11 the stamp of the ping to laptop-marta tells a screen reader that the firewall blocked it', async ({ page }) => {
  await startWithProgress(page, { '01-10': 1 });
  await page.goto('/#/level/01-11');
  await sendTo(await openTerminal(page), IP.marta);
  await expect(page.getByRole('button', { name: /^Paquete: ping de tu-laptop a laptop-marta\. Bloqueado\.$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Paquete:.*Perdido/ })).toHaveCount(0);
});

test('in 10 the question about the broken stretch cannot be answered from the map before a traceroute, and the routers that answered appear after it, with the lost ping still just outside tu-laptop', async ({ page }) => {
  await startWithProgress(page, { '01-09': 1 });
  const terminal = await openAndSend(page, '01-10', sendOnlyThePing);
  const lost = page.getByRole('button', { name: LOST_TO_SERVER });
  await expect(lost).toBeVisible();
  await lost.hover();
  const why = page.getByRole('region', { name: THE_PING_TO_THE_SERVER });
  await expect(why).toContainText('timeout: pasó el tiempo de espera y no volvió nada.');
  const routersOnTheMap = async () => (await mapBoxes(page)).map(({ name }) => name).filter((name) => A_ROUTER_OF_THE_PATH.test(name));
  const [boxBefore, pageBefore] = await Promise.all([why.innerText(), page.locator('body').innerText()]);
  expect(await routersOnTheMap()).toEqual([]);
  expect([boxBefore, pageBefore].filter((text) => A_ROUTER_OF_THE_PATH.test(text))).toEqual([]);
  expect(A_HOP.test(boxBefore)).toBe(false);

  await sendMessage(terminal, 'traceroute');
  await expect(terminal.getByRole('list', { name: 'Salida de traceroute' })).toBeVisible();
  await expect.poll(routersOnTheMap).toEqual([expect.stringMatching(/^router-oficina/), expect.stringMatching(/^router-proveedor/)]);
  await lost.hover();
  await expect(why).toContainText('timeout: pasó el tiempo de espera y no volvió nada.');
  expect(A_ROUTER_OF_THE_PATH.test(await why.innerText()) || A_HOP.test(await why.innerText())).toBe(false);
  await expectBesideYourLaptop(page, lost);
});

test('in 07 picking the gateway in the Ajustes de red card changes the stamps of the ping', async ({ page }) => {
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

    test('in 05 the warning for 192.168.1.50 appears at your own laptop and does not travel', async ({ page }) => {
      await startWithProgress(page, { '01-04': 1 });
      await page.goto('/#/level/01-05');
      await sendTo(await openTerminal(page), IP.nobody);
      const warning = page.getByRole('button', { name: /^Paquete: ping de tu-laptop a 192\.168\.1\.50\. Apareció un aviso\.$/ });
      await expect(warning).toBeVisible();
      await page.keyboard.press('Escape');
      await expectBesideYourLaptop(page, warning);
      await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(1);
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
    });

    test('after the pings of 08, no label or stamp overlaps, and the lost ping says why', async ({ page }) => {
      await startWithProgress(page, { '01-07': 1 });
      await sendAndClose(page, '01-08');
      await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(2);
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
      await page.getByRole('button', { name: /^Paquete: ping de tu-laptop a 10\.0\.0\.10\. Perdido\.$/ }).hover();
      const why = page.getByRole('region', { name: 'ping de tu-laptop a 10.0.0.10' });
      await expect(why).toContainText('10.0.0.10 es una IP privada: se repite en muchas redes y internet no la entrega');
      await expect(why).toContainText('Un router, ya fuera de la oficina, descartó el paquete y no avisó');
      await expect(why).not.toContainText('router-proveedor');
    });

    test('after the four tests of case 1 of 14, no stamp overlaps another', async ({ page }) => {
      await startWithProgress(page, CHAPTER_1_DONE);
      await page.goto('/#/level/01-14');
      const terminal = await sendTheTestsOfTheCase(page, WATCH_CASES[0]);
      await confirm(terminal);
      await expect(terminal).toBeHidden();
      await expect(page.getByRole('button', { name: /^Paquete:/ })).toHaveCount(WATCH_CASES[0].sends.length);
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
    });

    test('in 01-09 and 01-10 no label or stamp of the map overlaps once the player has sent its messages', async ({ page }) => {
      await startWithProgress(page, { '01-08': 1, '01-09': 1 });
      for (const id of ['01-09', '01-10']) {
        await sendAndClose(page, id);
        await expect.poll(() => overlappingPairs(page), id).toEqual([]);
      }
    });

    test('in 01-10, before the traceroute, no label or stamp of the map overlaps, and the lost ping stands just outside tu-laptop', async ({ page }) => {
      await startWithProgress(page, { '01-09': 1 });
      await sendAndClose(page, '01-10', sendOnlyThePing);
      const lost = page.getByRole('button', { name: LOST_TO_SERVER });
      await expect(lost).toBeVisible();
      await expect.poll(() => overlappingPairs(page)).toEqual([]);
      await expectBesideYourLaptop(page, lost);
    });

    test('in 01-07 the open settings card covers none of the pieces of the office, and no label or stamp overlaps', async ({ page }) => {
      await startWithProgress(page, { '01-06': 1 });
      await page.goto('/#/level/01-07');
      await page.getByRole('button', { name: SETTINGS_BUTTON, exact: true }).click();
      const settings = card(page, SETTINGS_CARD);
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

  fitTest('in 06, 08 and 10 the whole map and its labels fit the area of the map at full size', ['01-06', '01-08', '01-10']);

  test('in 10, before the traceroute, the whole map and its labels fit the area of the map at full size, with nothing sent and with the ping sent', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    await page.goto('/#/level/01-10');
    await expect.poll(async () => outsideTheArea(page, await mapArea(page)), 'nothing sent').toEqual([]);
    await sendAndClose(page, '01-10', sendOnlyThePing);
    await expect(page.getByRole('button', { name: LOST_TO_SERVER })).toBeVisible();
    await expect.poll(async () => outsideTheArea(page, await mapArea(page)), 'the ping sent').toEqual([]);
  });

  test('in 14 the whole map and its labels fit the area of the map at full size, in each of its seven cases', async ({ page }) => {
    await startWithProgress(page, CHAPTER_1_DONE);
    await page.goto('/#/level/01-14');
    for (const [index, watchCase] of WATCH_CASES.entries()) {
      const terminal = await sendTheTestsOfTheCase(page, watchCase);
      await confirm(terminal);
      await expect(terminal).toBeHidden();
      await expect.poll(async () => outsideTheArea(page, await mapArea(page)), `case ${index + 1}`).toEqual([]);
      await closeCase(page, watchCase.cause, index === WATCH_CASES.length - 1);
    }
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
