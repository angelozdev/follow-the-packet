import { expect, test, type Locator, type Page } from '@playwright/test';
import { cardProblems, reachWithWheel } from './card-boxes';
import { card, openCard, openTerminal, sendTo } from './cards';
import { IP, SETTINGS_BUTTON, SETTINGS_CARD, WATCH_CASES, fixTheGateway } from '@e2e/chapter-1/chapter-1-play';
import { submitAndFinish } from './closing';
import { collectErrors } from './console-errors';
import { CHAPTER_1_DONE, startWithProgress } from './saved-progress';

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

const TALL_WINDOWS = [
  { name: '390 px wide', size: { width: 390, height: 844 } },
  { name: 'desktop width', size: { width: 1440, height: 900 } },
];
const LOW_WINDOWS = [
  { name: '390×700', size: { width: 390, height: 700 } },
  { name: '1280×720', size: { width: 1280, height: 720 } },
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

async function openTheSettings(page: Page) {
  await page.getByRole('button', { name: SETTINGS_BUTTON, exact: true }).click();
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

const SCENES: Scene[] = [
  { name: 'Lucía alone', level: '01-11', reach: async () => {}, last: button(ASK_HINT) },
  { name: 'the question after Lucía, unanswered', level: '01-07', reach: askTheGatewayQuestion, last: (page) => page.getByRole('button', { name: THIRD_OPTION_OF_THE_GATEWAY }) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: button(SEE_RESULT) },
  { name: 'the result', level: '01-11', reach: finishTheGuard, last: (page) => page.getByRole('link', { name: BACK_TO_ROADMAP, exact: true }) },
  { name: 'the case, with its question open', level: '01-14', reach: openTheCaseQuestion, last: (page) => page.getByRole('button', { name: THIRD_CAUSE_OF_CASE_1 }) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: button(NEXT_CASE) },
  { name: 'the terminal', level: '01-11', reach: sendOnePing, last: doneOf(TERMINAL) },
  { name: 'the terminal with a piece inspected', level: '01-11', reach: inspectBesideTheTerminal, last: doneOf(TERMINAL) },
  { name: 'the card of the printer', level: '01-01', reach: opening(PRINTER), last: doneOf(PRINTER) },
  { name: 'the network settings', level: '01-07', reach: openTheSettings, last: doneOf(SETTINGS_CARD) },
  { name: 'the firewall with its tabs', level: '01-13', reach: opening(FIREWALL), last: doneOf(FIREWALL) },
];

async function play(page: Page, scene: Scene) {
  await page.goto(`/#/level/${scene.level}`);
  await page.reload();
  await scene.reach(page);
}

test.beforeEach(async ({ page }) => {
  await startWithProgress(page, CHAPTER_1_DONE);
});

test('no card is clipped and cards never overlap, at 390 px and at desktop width', async ({ page }) => {
  test.slow();
  const errors = collectErrors(page);
  const problems: string[] = [];
  for (const { name, size } of TALL_WINDOWS) {
    await page.setViewportSize(size);
    for (const scene of SCENES) {
      await play(page, scene);
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
