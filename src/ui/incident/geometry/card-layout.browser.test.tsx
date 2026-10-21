import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { cardProblems, cardsOutsideTheMap, INSPECTION_HELP, inspectionBoxOverCards, isReachable } from '@/testing/card-boxes';
import { coveredBy } from '@/testing/map-boxes';
import {
  GENTLE_WHEEL_PX,
  OFFICE_IP,
  bringTheLastLineIntoView,
  card,
  confirm,
  holdTheGrace,
  openByKeyboard,
  openCard,
  openTerminal,
  passTheGrace,
  reachWithWheel,
  releaseTheGrace,
  sendMessage,
  sendTo,
  showTheScreen,
  standStill,
  watchErrors,
} from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const SLOW_TEST_MS = 300_000;
const HTML_LAYER = '.html-layer';
const MAP_CARD = '.map-card .card';
const DRAWING = '.map-stage__svg';
const SUBMIT = 'Enviar solución';
const SEE_RESULT = 'Ver resultado';
const NEXT_CASE = 'Siguiente caso';
const KNOW_THE_CAUSE = 'Ya sé la causa';
const ASK_HINT = '¿Alguna pista?';
const BACK_TO_ROADMAP = 'Volver al roadmap';
const FULL_STARS = '3 de 3 estrellas';
const TERMINAL = 'Terminal de tu-laptop';
const FIREWALL = 'firewall tu-laptop';
const PRINTER = 'impresora';
const YOUR_LAPTOP = 'tu-laptop';
const LUCIA = 'laptop-lucia';
const OFFICE_ROUTER = 'router-oficina';
const INSPECTED_LAPTOP = /laptop-lucia/;
const THIRD_OPTION_OF_THE_GATEWAY = /laptop-andres no tiene/;
const RIGHT_OPTION_OF_THE_GATEWAY = /no tenía puerta de enlace predeterminada/;
const RIGHT_OPTION_OF_THE_GUARD = /descartó el paquete y no avisó/;
const WRONG_CAUSE_OF_CASE_1 = /servidor-internet está caído/;
const THIRD_CAUSE_OF_CASE_1 = /no tiene IP en su red local/;
const RIGHT_CAUSE_OF_CASE_1 = /Porque tu-laptop no tiene puerta de enlace predeterminada/;
const LOST_TO_ANDRES = /^Paquete: ping de tu-laptop a 192\.168\.2\.15\. Perdido\.$/;
const ARRIVED_AT_ANDRES = /^Paquete: ping de tu-laptop a laptop-andres\. Llegó\.$/;
const ANY_PACKET = /^Paquete:/;
const WARNED_PING = 'Paquete: ping de tu-laptop a 192.168.1.50. Apareció un aviso.';
const WARNED_PING_BOX = 'ping de tu-laptop a 192.168.1.50';
const SETTINGS_TAB = 'Ajustes de red';
const SETTINGS_CARD = 'Ajustes de red de tu-laptop';
const SERVICES_TAB = 'Servicios';
const SERVICES_CARD = 'Servicios de laptop-lucia';
const CLASSIFY_TAB = 'Clasificar';
const INSIDE_THE_BLOCK = 'Dentro de 192.168.1.0/24';
const OUTSIDE_THE_BLOCK = 'Fuera';
const ANDRES = 'laptop-andres';
const ROUTES_TAB = 'Tabla de rutas';
const YOUR_ROUTES_CARD = 'Tabla de rutas de tu-laptop';
const OFFICE_ROUTES_CARD = 'Tabla de rutas de router-oficina';
const ANYWHERE = '0.0.0.0/0';
const OTHER_OFFICE_BLOCK = '10.0.0.0/16';
const PROVIDER_HOP = '203.0.113.1 router-proveedor';
const BRANCH_HOP = '172.16.0.2 router-sucursal';
const ADD_ROUTE = 'Agregar ruta';
const TRANSLATIONS_TAB = 'Tabla de traducciones';
const TRANSLATIONS_CARD = 'Tabla de traducciones de router-oficina';
const NC_TO_THE_WEB_PORT = 'nc · puerto 80';
const AUTHORITATIVE = 'servidor-autoritativo';
const RECORDS_CARD = 'Registros de lucia.example';
const NAME_TRAY = 'Nombre';
const TYPE_TRAY = 'Tipo';
const VALUE_TRAY = 'Valor';
const BLOG_NAME = 'blog.lucia.example';
const WWW_NAME = 'www.lucia.example';
const CNAME_TYPE = 'CNAME';
const ADD_RECORD = 'Agregar registro';
const ALIAS_REFUSED = 'No se pudo agregar.';
const SEND = 'Enviar';
const RESOLVER = 'servidor-dns';
const CACHE_CARD = 'Caché de servidor-dns';
const ONE_MINUTE = 'Esperar 1 min';
const CLOCK_NOTE = 'El tiempo pasa para todo el mapa.';
const RIGHT_CAUSES_BEFORE_THE_LOOP = [
  /Porque el servicio escucha solo en 127\.0\.0\.1/,
  /Porque el nombre está mal escrito y no existe/,
  /Porque el archivo hosts de tu-laptop tiene una línea vieja/,
  /Porque router-oficina no tiene ruta por defecto/,
];
const THIRD_CAUSE_OF_THE_LOOP = /router-oficina descarta lo que va al servidor/;
const PROVIDER = 'router-proveedor';
const PROVIDER_ROUTES_CARD = 'Tabla de rutas de router-proveedor';
const REMOVE_THE_DEFAULT_ROUTE = /^Quitar 0\.0\.0\.0\/0/;
const SERVERS_BLOCK = '198.51.100.0/24';
const DESTINATION_HOP = '203.0.113.2 router-destino';
const PING = 'ping';
const DIG = 'dig';
const TRACEROUTE = 'traceroute';
const SECURITY_GROUP = 'Security Group servidor2';
const ECHO_REQUEST_CHIP = 'ICMP · Echo Request';
const ANYWHERE_CHIP = /Anywhere-IPv4/;
const PINNED = 'Fijada';
const PHONE_WINDOW = { width: 390, height: 844 };
const HOLDER = '.incident__inspection';
const SCROLLING_INSPECTION = '.incident__inspection[data-scrolls]';

const TALL_WINDOWS = [
  { name: '390 px wide', size: { width: 390, height: 844 } },
  { name: 'desktop width', size: { width: 1440, height: 900 } },
];
const LOW_WINDOWS = [
  { name: '390×700', size: { width: 390, height: 700 } },
  { name: '1280×720', size: { width: 1280, height: 720 } },
];
const LOW_MAP_WINDOWS = [
  { name: '1280×360', size: { width: 1280, height: 360 }, boxShows: true },
  { name: '1000×700', size: { width: 1000, height: 700 }, boxShows: false },
  { name: '700×600', size: { width: 700, height: 600 }, boxShows: true },
  { name: '844×460', size: { width: 844, height: 460 }, boxShows: true },
];
const FULL_WINDOWS = [
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '1440×900', size: { width: 1440, height: 900 } },
];
const INSPECTION_WINDOWS = [
  { name: '1280×800', size: { width: 1280, height: 800 } },
  { name: '390×844', size: PHONE_WINDOW },
  { name: '1000×700', size: { width: 1000, height: 700 } },
  { name: '1280×500', size: { width: 1280, height: 500 } },
];

interface Scene {
  name: string;
  level: string;
  reach: () => Promise<void>;
  last: () => Locator;
}

const button = (name: string | RegExp, exact = true) => page.getByRole('button', { name, exact });
const click = (target: Locator) => userEvent.click(target);
const doneOf = (name: string) => () => card(name).getByRole('button', { name: 'Listo', exact: true });
const opening = (name: string) => async () => {
  await openCard(name);
};

async function submit(): Promise<void> {
  await click(button(SUBMIT, false));
}

async function sendThePingAndTheTraceroute(): Promise<void> {
  const terminal = await openTerminal();
  await sendMessage(terminal, PING);
  await sendMessage(terminal, TRACEROUTE);
}

async function fixTheGateway(): Promise<void> {
  await sendTo(await openTerminal(), OFFICE_IP.andres);
  await expect.element(button(LOST_TO_ANDRES, false)).toBeVisible();
  await click(page.getByRole('tab', { name: SETTINGS_TAB, exact: true }));
  const settings = card(SETTINGS_CARD);
  await click(settings.getByRole('button', { name: OFFICE_IP.router, exact: true }));
  await expect.poll(() => button(ANY_PACKET, false).elements().length).toBe(0);
  await confirm(settings);
  await expect.element(settings).not.toBeInTheDocument();
  await sendTo(await openTerminal(), OFFICE_IP.andres);
  await expect.element(button(ARRIVED_AT_ANDRES, false)).toBeVisible();
}

async function askTheGatewayQuestion(): Promise<void> {
  await fixTheGateway();
  await submit();
}

async function answerTheGatewayQuestion(): Promise<void> {
  await askTheGatewayQuestion();
  await click(button(RIGHT_OPTION_OF_THE_GATEWAY, false));
}

async function openTheCaseQuestion(): Promise<void> {
  await click(button(KNOW_THE_CAUSE, false));
}

async function answerTheCaseQuestion(): Promise<void> {
  await openTheCaseQuestion();
  await click(button(WRONG_CAUSE_OF_CASE_1, false));
  await click(button(RIGHT_CAUSE_OF_CASE_1, false));
}

async function finishTheGuard(): Promise<void> {
  const terminal = await openTerminal();
  await sendTo(terminal, OFFICE_IP.marta);
  await sendTo(terminal, OFFICE_IP.lucia);
  await submit();
  await click(button(RIGHT_OPTION_OF_THE_GUARD, false));
  await click(button(SEE_RESULT, false));
  await expect.element(page.getByText(FULL_STARS)).toBeVisible();
}

async function sendOnePing(): Promise<void> {
  await sendTo(await openTerminal(), OFFICE_IP.marta);
}

async function inspectBesideTheTerminal(): Promise<void> {
  await sendOnePing();
  await userEvent.hover(button(INSPECTED_LAPTOP, false));
  await expect.element(page.getByRole('heading', { name: INSPECTED_LAPTOP })).toBeVisible();
}

async function reachTheSettings(): Promise<void> {
  await openByKeyboard(YOUR_LAPTOP);
  await click(page.getByRole('tab', { name: SETTINGS_TAB, exact: true }));
}

async function reachTheServices(): Promise<void> {
  await openByKeyboard(LUCIA);
  await click(page.getByRole('tab', { name: SERVICES_TAB, exact: true }));
}

async function reachTheClassifyCard(): Promise<void> {
  await openByKeyboard(YOUR_LAPTOP);
  await click(page.getByRole('tab', { name: CLASSIFY_TAB, exact: true }));
}

async function placeInBin(classify: Locator, item: string, bin: string): Promise<void> {
  await click(classify.getByRole('button', { name: new RegExp(`^${item}`) }));
  await click(classify.getByRole('button', { name: `Poner ${item} en ${bin}`, exact: true }));
}

async function placeBothItems(): Promise<void> {
  await reachTheClassifyCard();
  const classify = card(YOUR_LAPTOP);
  await placeInBin(classify, PRINTER, INSIDE_THE_BLOCK);
  await placeInBin(classify, ANDRES, OUTSIDE_THE_BLOCK);
}

async function addRoute(routes: Locator, destination: string, nextHop: string): Promise<void> {
  await click(routes.getByRole('button', { name: destination, exact: true }));
  await click(routes.getByRole('button', { name: nextHop, exact: true }));
  await click(routes.getByRole('button', { name: ADD_ROUTE, exact: true }));
}

async function reachYourRoutes(): Promise<void> {
  await openByKeyboard(YOUR_LAPTOP);
  await click(page.getByRole('tab', { name: ROUTES_TAB, exact: true }));
}

async function reachTheOfficeRoutes(): Promise<void> {
  await openByKeyboard(OFFICE_ROUTER);
  const table = card(OFFICE_ROUTES_CARD);
  await addRoute(table, ANYWHERE, PROVIDER_HOP);
  await addRoute(table, OTHER_OFFICE_BLOCK, BRANCH_HOP);
}

async function reachTheLoopCase(): Promise<void> {
  for (const cause of RIGHT_CAUSES_BEFORE_THE_LOOP) {
    await openTheCaseQuestion();
    await click(button(cause, false));
    await click(button(NEXT_CASE));
  }
}

async function openTheQuestionOfTheLoopCase(): Promise<void> {
  await reachTheLoopCase();
  await openTheCaseQuestion();
}

async function reachTheProviderRoutes(): Promise<void> {
  await reachTheLoopCase();
  await openByKeyboard(PROVIDER);
  const routes = card(PROVIDER_ROUTES_CARD);
  await click(routes.getByRole('button', { name: REMOVE_THE_DEFAULT_ROUTE }));
  await addRoute(routes, SERVERS_BLOCK, DESTINATION_HOP);
}

async function reachTheTranslations(): Promise<void> {
  for (const laptop of [YOUR_LAPTOP, LUCIA]) {
    const terminal = await openTerminal(laptop);
    await sendMessage(terminal, NC_TO_THE_WEB_PORT);
    await confirm(terminal);
    await expect.element(terminal).not.toBeInTheDocument();
  }
  await openByKeyboard(OFFICE_ROUTER);
  await click(page.getByRole('tab', { name: TRANSLATIONS_TAB, exact: true }));
}

async function pickInTray(table: Locator, tray: string, chip: string): Promise<void> {
  await click(table.getByRole('group', { name: tray }).getByRole('button', { name: chip, exact: true }));
}

async function reachTheRefusedAlias(): Promise<void> {
  await openByKeyboard(AUTHORITATIVE);
  const records = card(RECORDS_CARD);
  await pickInTray(records, NAME_TRAY, BLOG_NAME);
  await pickInTray(records, TYPE_TRAY, CNAME_TYPE);
  await pickInTray(records, VALUE_TRAY, WWW_NAME);
  await click(records.getByRole('button', { name: ADD_RECORD, exact: true }));
  await expect.element(records.getByRole('status')).toMatchTextContent(ALIAS_REFUSED);
}

async function waitAMinute(): Promise<void> {
  await click(button(ONE_MINUTE));
}

async function reachTheCacheAfterAMinute(): Promise<void> {
  await waitAMinute();
  const terminal = await openTerminal();
  await click(terminal.getByRole('button', { name: SEND, exact: true }));
  await confirm(terminal);
  await expect.element(terminal).not.toBeInTheDocument();
  await openByKeyboard(RESOLVER);
}

async function digTheName(): Promise<void> {
  await sendMessage(await openTerminal(), DIG);
}

async function sendFromTheTabbedTerminal(): Promise<void> {
  await openByKeyboard(YOUR_LAPTOP);
  await sendTo(card(TERMINAL), OFFICE_IP.andres);
}

const THE_TERMINAL: Scene = { name: 'the terminal', level: '01-11', reach: sendOnePing, last: doneOf(TERMINAL) };
const THE_PRINTER: Scene = { name: 'the card of the printer', level: '01-01', reach: opening(PRINTER), last: doneOf(PRINTER) };
const THE_SETTINGS: Scene = { name: 'the network settings', level: '01-07', reach: reachTheSettings, last: doneOf(SETTINGS_CARD) };
const THE_TABBED_TERMINAL: Scene = { name: 'the terminal, the first tab of the card of the laptop', level: '01-07', reach: sendFromTheTabbedTerminal, last: doneOf(TERMINAL) };
const THE_NAMES_TERMINAL: Scene = { name: 'the terminal, the first of the three tabs of the card of tu-laptop, with the answer of a dig', level: '02-10', reach: digTheName, last: doneOf(TERMINAL) };
const THE_SERVICES: Scene = { name: 'the services, a tab of the card of laptop-lucia', level: '02-03', reach: reachTheServices, last: doneOf(SERVICES_CARD) };
const THE_CLASSIFY: Scene = { name: 'the card that classifies, with nothing placed yet', level: '02-04', reach: reachTheClassifyCard, last: doneOf(YOUR_LAPTOP) };
const THE_PLACED_CLASSIFY: Scene = { name: 'the card that classifies, with both items placed and a line under each', level: '02-04', reach: placeBothItems, last: doneOf(YOUR_LAPTOP) };
const THE_ROUTES: Scene = { name: 'the routing table of your laptop, read only, a tab of its card', level: '02-06', reach: reachYourRoutes, last: doneOf(YOUR_ROUTES_CARD) };
const THE_EDITABLE_ROUTES: Scene = { name: 'the routing table of router-oficina, with its two routes written and its trays', level: '02-07', reach: reachTheOfficeRoutes, last: doneOf(OFFICE_ROUTES_CARD) };
const THE_PROVIDER_ROUTES: Scene = { name: 'the routes of router-proveedor, the fix of the loop, with the default route taken away and a route written', level: '02-14', reach: reachTheProviderRoutes, last: doneOf(PROVIDER_ROUTES_CARD) };
const THE_TRANSLATIONS: Scene = { name: 'the table of translations of router-oficina, read only, with the rows of two laptops', level: '02-08', reach: reachTheTranslations, last: doneOf(TRANSLATIONS_CARD) };
const THE_RECORDS: Scene = { name: 'the records of servidor-autoritativo, with an alias refused and the reason under the table', level: '02-11', reach: reachTheRefusedAlias, last: doneOf(RECORDS_CARD) };
const THE_CACHE: Scene = { name: 'the cache of servidor-dns, read only, a minute after the dig, with the clock of the game in the panel', level: '02-12', reach: reachTheCacheAfterAMinute, last: doneOf(CACHE_CARD) };
const THE_CLOCK: Scene = { name: 'the clock of the game below the card of Lucía, after a minute of waiting', level: '02-12', reach: waitAMinute, last: () => page.getByText(CLOCK_NOTE) };
const THE_FIREWALL: Scene = { name: 'the firewall with its tabs', level: '01-13', reach: opening(FIREWALL), last: doneOf(FIREWALL) };
const THE_TRACEROUTE: Scene = { name: 'the terminal with a traceroute', level: '01-10', reach: sendThePingAndTheTraceroute, last: doneOf(TERMINAL) };

const SCENES: Scene[] = [
  { name: 'Lucía alone', level: '01-11', reach: async () => undefined, last: () => button(ASK_HINT) },
  { name: 'the question after Lucía, unanswered', level: '01-07', reach: askTheGatewayQuestion, last: () => button(THIRD_OPTION_OF_THE_GATEWAY, false) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: () => button(SEE_RESULT) },
  { name: 'the result', level: '01-11', reach: finishTheGuard, last: () => page.getByRole('link', { name: BACK_TO_ROADMAP, exact: true }) },
  { name: 'the case, with its question open', level: '01-14', reach: openTheCaseQuestion, last: () => button(THIRD_CAUSE_OF_CASE_1, false) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: () => button(NEXT_CASE) },
  { name: 'the case with a fix, its tasks and its question open', level: '02-14', reach: openTheQuestionOfTheLoopCase, last: () => button(THIRD_CAUSE_OF_THE_LOOP, false) },
  THE_TERMINAL,
  { name: 'the terminal with a piece inspected', level: '01-11', reach: inspectBesideTheTerminal, last: doneOf(TERMINAL) },
  THE_PRINTER,
  THE_SETTINGS,
  THE_TABBED_TERMINAL,
  THE_NAMES_TERMINAL,
  THE_SERVICES,
  THE_ROUTES,
  THE_EDITABLE_ROUTES,
  THE_PROVIDER_ROUTES,
  THE_TRANSLATIONS,
  THE_RECORDS,
  THE_CACHE,
  THE_CLOCK,
  THE_FIREWALL,
];

const MAP_SCENES = [THE_TERMINAL, THE_TRACEROUTE, THE_PRINTER, THE_SETTINGS, THE_TABBED_TERMINAL, THE_NAMES_TERMINAL, THE_SERVICES, THE_ROUTES, THE_EDITABLE_ROUTES, THE_PROVIDER_ROUTES, THE_TRANSLATIONS, THE_RECORDS, THE_CACHE, THE_CLASSIFY, THE_PLACED_CLASSIFY, THE_FIREWALL];

const TABLES_OUTPUT_AND_SERVICES = [THE_TRACEROUTE, THE_NAMES_TERMINAL, THE_SERVICES, THE_ROUTES, THE_EDITABLE_ROUTES, THE_PROVIDER_ROUTES, THE_TRANSLATIONS, THE_RECORDS, THE_CACHE];

async function wrongIpOfThePrinter(): Promise<void> {
  const printer = await openCard(PRINTER);
  await click(printer.getByRole('button', { name: 'Listo', exact: true }));
}

async function intruderAndRejection(): Promise<void> {
  const group = await openCard(SECURITY_GROUP);
  await click(group.getByRole('button', { name: ECHO_REQUEST_CHIP }));
  await click(group.getByRole('button', { name: ANYWHERE_CHIP }));
  await submit();
}

const MESSAGE_SCENES: Scene[] = [
  { name: 'the wrong IP of the printer', level: '01-01', reach: wrongIpOfThePrinter, last: doneOf(PRINTER) },
  { name: 'the question after Lucía, answered', level: '01-07', reach: answerTheGatewayQuestion, last: () => button(SEE_RESULT) },
  { name: 'the case, answered', level: '01-14', reach: answerTheCaseQuestion, last: () => button(NEXT_CASE) },
  { name: 'the intruder and the rejection of Lucía', level: '04-01', reach: intruderAndRejection, last: () => button(SUBMIT, false) },
];

function messagesCoveringWhatIsAbove(): string[] {
  return Array.from(document.querySelectorAll('.message')).flatMap((message) => {
    const tab = message.querySelector('.message__tab')?.getBoundingClientRect();
    const above = message.previousElementSibling?.getBoundingClientRect();
    if (tab === undefined || above === undefined || above.height === 0) return [];
    return tab.top < above.bottom ? [`${message.textContent?.slice(0, 40)}: its tab starts at ${tab.top} and the element above ends at ${above.bottom}`] : [];
  });
}

function show(level: string) {
  return showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={level} nextId={null} onFinish={() => undefined} />);
}

async function inTheScene<Seen>(scene: Scene, mode: 'live' | 'right-after-the-click' | 'at-rest', measure: () => Promise<Seen> | Seen): Promise<Seen> {
  if (mode !== 'live') holdTheGrace();
  const view = await show(scene.level);
  if (mode !== 'live') await standStill();
  await scene.reach();
  if (mode === 'at-rest') await passTheGrace();
  if (mode !== 'live') await standStill();
  const seen = await measure();
  view.unmount();
  releaseTheGrace();
  return seen;
}

function resetThePage(): void {
  window.scrollTo(0, 0);
}

function useWindow(size: { width: number; height: number }): void {
  beforeEach(() => page.viewport(size.width, size.height));
}

afterEach(async () => {
  releaseTheGrace();
  resetThePage();
  await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
});

describe('the cards of the game in a real browser', () => {
  it('a card opened on a narrow map never scrolls the layer of the labels, so the labels keep their place over the drawing', { timeout: SLOW_TEST_MS }, async () => {
    await page.viewport(PHONE_WINDOW.width, PHONE_WINDOW.height);
    await show(THE_TRANSLATIONS.level);
    const layer = document.querySelector(HTML_LAYER) as HTMLElement;
    const drawing = document.querySelector(DRAWING) as Element;
    const scrolled = () => [layer.scrollLeft, layer.scrollTop];
    const router = button(OFFICE_ROUTER);
    const routerOverTheDrawing = () => {
      const [label, map] = [router.element().getBoundingClientRect(), drawing.getBoundingClientRect()];
      return [label.left - map.left, label.top - map.top];
    };
    await standStill();
    const home = routerOverTheDrawing();
    const terminal = await openTerminal(LUCIA);
    await standStill();
    expect(scrolled(), 'with the terminal of the laptop at the right edge open').toEqual([0, 0]);
    expect(routerOverTheDrawing(), 'the label of the router stands over the drawing where it stood, with the terminal open').toEqual(home);
    await confirm(terminal);
    await expect.element(terminal).not.toBeInTheDocument();
    await standStill();
    expect(scrolled(), 'after it closes').toEqual([0, 0]);
    expect(routerOverTheDrawing(), 'and after it closes').toEqual(home);
  });

  it('the tab of a Message in the cards of the game covers nothing of the element above it', { timeout: SLOW_TEST_MS }, async () => {
    for (const scene of MESSAGE_SCENES) {
      await inTheScene(scene, 'live', async () => {
        await expect.poll(() => document.querySelector('.message'), { message: scene.name }).not.toBeNull();
        expect(messagesCoveringWhatIsAbove(), scene.name).toEqual([]);
      });
    }
  });

  it('no card is clipped and cards never overlap, at 390 px and at desktop width', { timeout: SLOW_TEST_MS }, async () => {
    const watching = watchErrors();
    const problems: string[] = [];
    for (const { name, size } of TALL_WINDOWS) {
      await page.viewport(size.width, size.height);
      let helpSeen = 0;
      for (const scene of SCENES) {
        await inTheScene(scene, 'at-rest', () => {
          helpSeen += document.querySelectorAll(INSPECTION_HELP).length;
          problems.push(...cardProblems().map((problem) => `${name}, ${scene.name}: ${problem}`));
        });
      }
      expect(helpSeen, `${name}: the inspection help is on the page, so the check of the cards over it looks at something`).toBeGreaterThan(0);
    }
    watching.stop();
    expect(problems).toEqual([]);
    expect(watching.errors).toEqual([]);
  });
});

describe.each(LOW_WINDOWS)('$name', ({ size }) => {
  useWindow(size);

  it('the last element of every card can be reached by scrolling on a low screen', { timeout: SLOW_TEST_MS }, async () => {
    const stuck: string[] = [];
    for (const scene of SCENES) {
      await inTheScene(scene, 'live', async () => {
        const last = scene.last();
        if (!(await reachWithWheel(last))) stuck.push(scene.name);
      });
    }
    expect(stuck).toEqual([]);
  });
});

describe.each(INSPECTION_WINDOWS)('$name', ({ size }) => {
  useWindow(size);

  it('an inspection box that does not fit scrolls under the mouse to its last line, and its band stays in view', { timeout: SLOW_TEST_MS }, async () => {
    holdTheGrace();
    await show('01-05');
    const terminal = await openTerminal();
    await sendTo(terminal, OFFICE_IP.nobody);
    await confirm(terminal);
    await expect.element(terminal).not.toBeInTheDocument();
    const stamp = button(WARNED_PING);
    const box = page.getByRole('region', { name: WARNED_PING_BOX, exact: true });
    const holder = document.querySelector(HOLDER) as HTMLElement;
    const bodyOfTheBox = () => box.element().querySelector('.card__body') as HTMLElement;
    const inView = () => holder.getBoundingClientRect().bottom <= window.innerHeight;

    await userEvent.hover(stamp);
    await expect.element(box).toBeVisible();
    await expect.poll(() => document.querySelectorAll(SCROLLING_INSPECTION).length, { message: 'the box sees that its text does not fit' }).toBe(1);
    if (inView()) {
      await userEvent.hover(page.elementLocator(bodyOfTheBox()));
      await passTheGrace();
      await expect.element(box, { message: 'the preview stays while the mouse is over it' }).toBeVisible();
      await expect.element(box, { message: 'a preview is not pinned' }).not.toMatchTextContent(PINNED);
    } else {
      expect(window.scrollY, 'a hover leaves the page where it is, so the holder under the map stays out of view').toBe(0);
    }

    await click(stamp);

    await expect.element(box, { message: 'the click pins the box' }).toMatchTextContent(PINNED);
    await expect.poll(inView, { message: 'the pin brings the holder of the box into view' }).toBe(true);
    await userEvent.hover(page.elementLocator(bodyOfTheBox()));
    await passTheGrace();
    await expect.element(box, { message: 'the box stays while the mouse is over it' }).toBeVisible();
    expect(getComputedStyle(bodyOfTheBox(), '::-webkit-scrollbar').width, 'the body draws its own scrollbar, so a scroller that hides it still shows there is more').not.toBe('auto');
    await bringTheLastLineIntoView(box);
  });
});

describe.each([...LOW_WINDOWS, ...LOW_MAP_WINDOWS])('$name', ({ size }) => {
  useWindow(size);

  it('the body of the card that classifies scrolls to its last bin, under the mouse, and its foot stays in view', { timeout: SLOW_TEST_MS }, async () => {
    await inTheScene(THE_PLACED_CLASSIFY, 'live', async () => {
      await standStill();
      const classify = card(YOUR_LAPTOP);
      const body = classify.element().querySelector('.chip-card__body') as HTMLElement;
      const lastBin = classify.getByRole('button', { name: `Poner aquí en ${OUTSIDE_THE_BLOCK}`, exact: true });
      expect(body.scrollHeight > body.clientHeight, 'the body does not fit, so it scrolls').toBe(true);
      expect(isReachable(lastBin.element()), 'the last bin starts out of reach').toBe(false);
      expect(await reachWithWheel(lastBin, { within: page.elementLocator(body), wheelPx: GENTLE_WHEEL_PX }), 'the wheel brings the last bin into view').toBe(true);
      expect(isReachable(THE_PLACED_CLASSIFY.last().element()), 'the foot stays in reach').toBe(true);
      expect(cardsOutsideTheMap(), 'the card stays inside the map').toEqual([]);
    });
  });
});

describe.each(LOW_MAP_WINDOWS)('$name', ({ name, size }) => {
  useWindow(size);

  it('a card beside a piece stays inside the map, with its foot in view, in a low or narrow window', { timeout: SLOW_TEST_MS }, async () => {
    const problems: string[] = [];
    for (const scene of MAP_SCENES) {
      for (const mode of ['right-after-the-click', 'at-rest'] as const) {
        await inTheScene(scene, mode, () => {
          problems.push(...cardsOutsideTheMap().map((problem) => `${name}, ${scene.name}, ${mode}: ${problem}`));
          const last = scene.last().query();
          if (last === null || !isReachable(last)) problems.push(`${name}, ${scene.name}, ${mode}: its foot is out of reach`);
        });
      }
    }
    expect(problems).toEqual([]);
  });
});

describe.each(FULL_WINDOWS)('$name', ({ name, size }) => {
  useWindow(size);

  it('the cards of tables, output and services cover no piece of the map', { timeout: SLOW_TEST_MS }, async () => {
    const covered: string[] = [];
    for (const scene of TABLES_OUTPUT_AND_SERVICES) {
      await inTheScene(scene, 'at-rest', () => {
        const opened = (document.querySelector(MAP_CARD) as Element).getBoundingClientRect();
        covered.push(...coveredBy(opened).map((piece) => `${name}, ${scene.name}: the card covers ${piece}`));
      });
    }
    expect(covered).toEqual([]);
  });
});

describe.each(LOW_MAP_WINDOWS)('$name', ({ name, size, boxShows }) => {
  useWindow(size);

  it('the inspection box covers no card of the map, right after the click and at rest, in a low or narrow window', { timeout: SLOW_TEST_MS }, async () => {
    const covered = new Set<string>();
    let framesWithABox = 0;
    for (const scene of MAP_SCENES) {
      const sample = () => {
        const seen = inspectionBoxOverCards();
        if (seen.shown) framesWithABox += 1;
        for (const problem of seen.covered) covered.add(`${name}, ${scene.name}: ${problem}`);
      };
      holdTheGrace();
      const view = await show(scene.level);
      await standStill();
      await scene.reach();
      sample();
      await standStill({ onFrame: sample });
      await passTheGrace();
      await standStill({ onFrame: sample });
      view.unmount();
      releaseTheGrace();
    }
    expect([...covered]).toEqual([]);
    expect(framesWithABox > 0, 'the box was up in some of the frames exactly where this window leaves it room, so the test looked at something').toBe(boxShows);
  });
});
