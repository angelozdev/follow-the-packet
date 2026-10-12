import { expect, test, type Locator, type Page } from '@playwright/test';
import { cardProblems, cardsOutsideTheMap, isReachable, reachWithWheel } from './card-boxes';
import { card, openCard, openTerminal, sendTo } from './cards';
import { IP, SETTINGS_CARD, SETTINGS_TAB, WATCH_CASES, fixTheGateway, sendThePingAndTheTraceroute } from '@e2e/chapter-1/chapter-1-play';
import { submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';
import { freezeTime, standStill, stepFrame } from './still-scene';

const DONE = 'Listo';
const SUBMIT = 'Enviar solución';
const SEE_RESULT = 'Ver resultado';
const NEXT_CASE = 'Siguiente caso';
const KNOW_THE_CAUSE = 'Ya sé la causa';
const ASK_HINT = '¿Alguna pista?';
const BACK_TO_ROADMAP = 'Volver al roadmap';
const TERMINAL = 'Terminal de tu-laptop';
const FIREWALL = 'firewall tu-laptop';
const PRINTER = 'impresora';
const INSPECTED_LAPTOP = /laptop-lucia/;
const THIRD_OPTION_OF_THE_GATEWAY = /laptop-andres no tiene/;
const RIGHT_OPTION_OF_THE_GATEWAY = /no tenía puerta de enlace predeterminada/;
const RIGHT_OPTION_OF_THE_GUARD = /descartó el paquete y no avisó/;
const WRONG_CAUSE_OF_CASE_1 = /servidor-internet está caído/;
const THIRD_CAUSE_OF_CASE_1 = /no tiene IP en su red local/;
const [CASE_1] = WATCH_CASES;
const WARNED_PING = 'Paquete: ping de tu-laptop a 192.168.1.50. Apareció un aviso.';
const WARNED_PING_BOX = 'ping de tu-laptop a 192.168.1.50';
const LONGER_THAN_THE_GRACE_MS = 800;
const PIECE_LABEL = '.map-button';
const GENTLE_WHEEL_PX = 60;
const SECURITY_GROUP = 'Security Group servidor2';
const ECHO_REQUEST_CHIP = 'ICMP · Echo Request';
const ANYWHERE_CHIP = /Anywhere-IPv4/;

const TALL_WINDOWS = [
  { name: '390 px wide', size: { width: 390, height: 844 } },
  { name: 'desktop width', size: { width: 1440, height: 900 } },
];
const LOW_WINDOWS = [
  { name: '390×700', size: { width: 390, height: 700 } },
  { name: '1280×720', size: { width: 1280, height: 720 } },
];

const LOW_MAP_WINDOWS = [
  { name: '1280×360', size: { width: 1280, height: 360 } },
  { name: '1000×700', size: { width: 1000, height: 700 } },
  { name: '700×600', size: { width: 700, height: 600 } },
  { name: '844×460', size: { width: 844, height: 460 } },
];
const INSPECTION_WINDOWS = [
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '390×844', size: { width: 390, height: 844 } },
  { name: '1000×700', size: { width: 1000, height: 700 } },
  { name: '1280×500', size: { width: 1280, height: 500 } },
];

interface Scene {
  name: string;
  level: string;
  reach: (page: Page) => Promise<void>;
  last: (page: Page) => Locator;
}

async function submit(page: Page) {
  await page.getByRole('button', { name: SUBMIT }).click();
}

async function askTheGatewayQuestion(page: Page) {
  await fixTheGateway(page);
  await submit(page);
}

async function answerTheGatewayQuestion(page: Page) {
  await askTheGatewayQuestion(page);
  await page.getByRole('button', { name: RIGHT_OPTION_OF_THE_GATEWAY }).click();
}

async function openTheCaseQuestion(page: Page) {
  await page.getByRole('button', { name: KNOW_THE_CAUSE }).click();
}

async function answerTheCaseQuestion(page: Page) {
  await openTheCaseQuestion(page);
  await page.getByRole('button', { name: WRONG_CAUSE_OF_CASE_1 }).click();
  await page.getByRole('button', { name: CASE_1.cause }).click();
}

async function finishTheGuard(page: Page) {
  const terminal = await openTerminal(page);
  await sendTo(terminal, IP.marta);
  await sendTo(terminal, IP.lucia);
  await submitAndFinish(page, RIGHT_OPTION_OF_THE_GUARD);
}

async function sendOnePing(page: Page) {
  await sendTo(await openTerminal(page), IP.marta);
}

async function inspectBesideTheTerminal(page: Page) {
  await sendOnePing(page);
  await page.getByRole('button', { name: INSPECTED_LAPTOP }).hover();
  await expect(page.getByRole('heading', { name: INSPECTED_LAPTOP })).toBeVisible();
}

async function openTheLaptopByKeyboard(page: Page) {
  await page.getByRole('button', { name: 'tu-laptop', exact: true }).focus();
  await page.keyboard.press('Enter');
}

async function reachTheSettings(page: Page) {
  await openTheLaptopByKeyboard(page);
  await page.getByRole('tab', { name: SETTINGS_TAB, exact: true }).click();
}

async function sendFromTheTabbedTerminal(page: Page) {
  await openTheLaptopByKeyboard(page);
  await sendTo(card(page, TERMINAL), IP.andres);
}

function opening(name: string) {
  return async (page: Page) => {
    await openCard(page, name);
  };
}

function button(name: string) {
  return (page: Page) => page.getByRole('button', { name, exact: true });
}

function doneOf(name: string) {
  return (page: Page) => card(page, name).getByRole('button', { name: DONE, exact: true });
}

async function sendAPingAndATraceroute(page: Page) {
  await sendThePingAndTheTraceroute(await openTerminal(page));
}

const THE_TERMINAL: Scene = { name: 'the terminal', level: '01-11', reach: sendOnePing, last: doneOf(TERMINAL) };
const THE_PRINTER: Scene = { name: 'the card of the printer', level: '01-01', reach: opening(PRINTER), last: doneOf(PRINTER) };
const THE_SETTINGS: Scene = { name: 'the network settings', level: '01-07', reach: reachTheSettings, last: doneOf(SETTINGS_CARD) };
const THE_TABBED_TERMINAL: Scene = { name: 'the terminal, the first tab of the card of the laptop', level: '01-07', reach: sendFromTheTabbedTerminal, last: doneOf(TERMINAL) };
const THE_FIREWALL: Scene = { name: 'the firewall with its tabs', level: '01-13', reach: opening(FIREWALL), last: doneOf(FIREWALL) };
const THE_TRACEROUTE: Scene = { name: 'the terminal with a traceroute', level: '01-10', reach: sendAPingAndATraceroute, last: doneOf(TERMINAL) };

const SCENES: Scene[] = [
  { name: 'Lucía alone', level: '01-11', reach: async () => {}, last: button(ASK_HINT) },
  { name: 'the question after Lucía, unanswered', level: '01-07', reach: askTheGatewayQuestion, last: (page) => page.getByRole('button', { name: THIRD_OPTION_OF_THE_GATEWAY }) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: button(SEE_RESULT) },
  { name: 'the result', level: '01-11', reach: finishTheGuard, last: (page) => page.getByRole('link', { name: BACK_TO_ROADMAP, exact: true }) },
  { name: 'the case, with its question open', level: '01-14', reach: openTheCaseQuestion, last: (page) => page.getByRole('button', { name: THIRD_CAUSE_OF_CASE_1 }) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: button(NEXT_CASE) },
  THE_TERMINAL,
  { name: 'the terminal with a piece inspected', level: '01-11', reach: inspectBesideTheTerminal, last: doneOf(TERMINAL) },
  THE_PRINTER,
  THE_SETTINGS,
  THE_TABBED_TERMINAL,
  THE_FIREWALL,
];

const MAP_SCENES = [THE_TERMINAL, THE_TRACEROUTE, THE_PRINTER, THE_SETTINGS, THE_TABBED_TERMINAL, THE_FIREWALL];

async function passTheGrace(page: Page) {
  await page.clock.fastForward(LONGER_THAN_THE_GRACE_MS);
}

async function play(page: Page, scene: Scene) {
  await page.goto(`/#/level/${scene.level}`);
  await page.reload();
  await scene.reach(page);
}

async function playWithTheClockPaused(page: Page, scene: Scene, eachFrame: (page: Page) => Promise<void>) {
  await page.clock.resume();
  await page.goto(`/#/level/${scene.level}`);
  await page.reload();
  await page.locator(PIECE_LABEL).first().waitFor();
  await standStill(page);
  await freezeTime(page);
  await scene.reach(page);
  await standStill(page, { eachFrame });
}

async function playUntilItRests(page: Page, scene: Scene) {
  await playWithTheClockPaused(page, scene, passTheGrace);
}

async function wrongIpOfThePrinter(page: Page) {
  const printer = await openCard(page, PRINTER);
  await printer.getByRole('button', { name: DONE, exact: true }).click();
}

async function intruderAndRejection(page: Page) {
  const group = await openCard(page, SECURITY_GROUP);
  await group.getByRole('button', { name: ECHO_REQUEST_CHIP }).click();
  await group.getByRole('button', { name: ANYWHERE_CHIP }).click();
  await submit(page);
}

async function messagesCoveringWhatIsAbove(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.message')).flatMap((message) => {
      const tab = message.querySelector('.message__tab')?.getBoundingClientRect();
      const above = message.previousElementSibling?.getBoundingClientRect();
      if (tab === undefined || above === undefined || above.height === 0) return [];
      return tab.top < above.bottom ? [`${message.textContent?.slice(0, 40)}: its tab starts at ${tab.top} and the element above ends at ${above.bottom}`] : [];
    }),
  );
}

const MESSAGE_SCENES: Scene[] = [
  { name: 'the wrong IP of the printer', level: '01-01', reach: wrongIpOfThePrinter, last: doneOf(PRINTER) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: button(SEE_RESULT) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: button(NEXT_CASE) },
  { name: 'the intruder and the rejection of Lucía', level: '04-01', reach: intruderAndRejection, last: button(SUBMIT) },
];

const MOVING_SCENE_LAST_FRAME = 40;
const MOVING_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  const box = document.getElementById('box');
  const watcher = new ResizeObserver(() => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => box.setAttribute('data-scrolls', 'true');
    channel.port2.postMessage(null);
  });
  let frame = 0;
  const move = () => {
    frame += 1;
    box.style.left = frame + 'px';
    if (frame < ${MOVING_SCENE_LAST_FRAME}) requestAnimationFrame(move);
    else {
      watcher.observe(box);
      box.style.width = '160px';
    }
  };
  requestAnimationFrame(move);
</script>`;
const RESTLESS_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  let frame = 0;
  const sway = () => {
    frame += 1;
    document.getElementById('box').style.left = frame + 'px';
    requestAnimationFrame(sway);
  };
  requestAnimationFrame(sway);
</script>`;
const FRAME_BUDGET_OF_THE_RESTLESS_SCENE = 30;
const SLOW_TIMER_MS = 600_000;
const PAUSED_SCENE = `
<div class="card" id="box" style="position: absolute; left: 0; top: 0; width: 100px; height: 40px"></div>
<script>
  const box = document.getElementById('box');
  setTimeout(() => box.remove(), ${SLOW_TIMER_MS});
  let frame = 0;
  const move = () => {
    frame += 1;
    box.style.left = frame + 'px';
    if (frame < ${MOVING_SCENE_LAST_FRAME}) requestAnimationFrame(move);
  };
  requestAnimationFrame(move);
</script>`;

test.beforeEach(async ({ page }) => {
  await startWithProgress(page, CHAPTER_1_DONE);
});

test('a box is measured only once the scene stands still', async ({ page }) => {
  await page.setContent(MOVING_SCENE);
  await standStill(page);
  const measured = await page.evaluate(() => {
    const box = document.getElementById('box');
    return box === null ? null : { left: box.getBoundingClientRect().left, width: box.getBoundingClientRect().width, scrolls: box.getAttribute('data-scrolls') };
  });
  expect(measured).toEqual({ left: MOVING_SCENE_LAST_FRAME, width: 160, scrolls: 'true' });
});

test('a scene that never stands still is reported and not measured', async ({ page }) => {
  await page.setContent(RESTLESS_SCENE);
  await expect(standStill(page, { frameBudget: FRAME_BUDGET_OF_THE_RESTLESS_SCENE })).rejects.toThrow(`did not stand still in ${FRAME_BUDGET_OF_THE_RESTLESS_SCENE} frames`);
});

test('with the clock paused the scene still moves to its rest frame by frame, and a timer that is not due has not fired', async ({ page }) => {
  await page.clock.install();
  await page.setContent(PAUSED_SCENE);
  await freezeTime(page);
  await standStill(page, { eachFrame: stepFrame });
  const left = () => page.evaluate(() => document.getElementById('box')?.getBoundingClientRect().left ?? null);
  expect(await left()).toBe(MOVING_SCENE_LAST_FRAME);
  await page.clock.fastForward(SLOW_TIMER_MS);
  await standStill(page, { eachFrame: stepFrame });
  expect(await left()).toBeNull();
});

test('the tab of a Message in the cards of the game covers nothing of the element above it', async ({ page }) => {
  for (const scene of MESSAGE_SCENES) {
    await play(page, scene);
    await expect(page.locator('.message').first(), scene.name).toBeVisible();
    expect(await messagesCoveringWhatIsAbove(page), scene.name).toEqual([]);
  }
});

test('no card is clipped and cards never overlap, at 390 px and at desktop width', async ({ page }) => {
  test.slow();
  await page.clock.install();
  const errors = collectErrors(page);
  const problems: string[] = [];
  for (const { name, size } of TALL_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await playUntilItRests(page, scene);
      problems.push(...(await cardProblems(page)).map((problem) => `${name}, ${scene.name}: ${problem}`));
    }
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});

test('the last element of every card can be reached by scrolling on a low screen', async ({ page }) => {
  test.slow();
  const stuck: string[] = [];
  for (const { name, size } of LOW_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await play(page, scene);
      const last = scene.last(page);
      if (await reachWithWheel(page, last)) await last.click({ trial: true, timeout: 2000 });
      else stuck.push(`${name}, ${scene.name}`);
    }
  }
  expect(stuck).toEqual([]);
});

test('an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view', async ({ page }) => {
  test.slow();
  await page.clock.install();
  for (const { name, size } of INSPECTION_WINDOWS) {
    await page.setViewportSize(size);
    await page.goto('/#/level/01-05');
    await page.reload();
    await sendTo(await openTerminal(page), IP.nobody);
    await page.getByRole('button', { name: WARNED_PING, exact: true }).hover();
    const box = page.getByRole('region', { name: WARNED_PING_BOX, exact: true });
    const body = box.locator('.card__body');
    await expect(box, name).toBeVisible();
    await expect(page.locator('.incident__inspection[data-scrolls]'), `${name}: the box sees that its text does not fit`).toHaveCount(1);
    const shown = await body.boundingBox();
    if (shown === null) throw new Error('the inspection box is not on the page');
    await page.mouse.move(shown.x + shown.width / 2, shown.y + Math.min(shown.height, size.height - shown.y) / 2);
    await page.clock.fastForward(LONGER_THAN_THE_GRACE_MS);
    await expect(box, `${name}: the box stays while the mouse is over it`).toBeVisible();
    expect(await body.evaluate((element) => getComputedStyle(element, '::-webkit-scrollbar').width), `${name}: the body draws its own scrollbar, so a scroller that hides it still shows there is more`).not.toBe('auto');
    const last = box.locator('dd').last();
    expect(await reachWithWheel(page, last, { within: body, wheelPx: GENTLE_WHEEL_PX }), `${name}: the last line comes into view`).toBe(true);
    const [band, text, within] = await Promise.all([box.locator('.card__band').boundingBox(), last.boundingBox(), body.boundingBox()]);
    if (band === null || text === null || within === null) throw new Error('the inspection box lost a part');
    expect(band.y, `${name}: the band stays in the window`).toBeGreaterThanOrEqual(0);
    expect(band.y + band.height, `${name}: the band stays above the body`).toBeLessThanOrEqual(within.y + 1);
    expect(text.y + text.height, `${name}: the last line ends inside the body`).toBeLessThanOrEqual(within.y + within.height + 1);
  }
});

test('a card beside a piece stays inside the map, with its foot in view, in a low or narrow window', async ({ page }) => {
  test.slow();
  await page.clock.install();
  const problems: string[] = [];
  for (const { name, size } of LOW_MAP_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of MAP_SCENES) {
      await playUntilItRests(page, scene);
      problems.push(...(await cardsOutsideTheMap(page)).map((problem) => `${name}, ${scene.name}: ${problem}`));
      if (!(await isReachable(page, scene.last(page)))) problems.push(`${name}, ${scene.name}: its foot is out of reach`);
    }
  }
  expect(problems).toEqual([]);
});
