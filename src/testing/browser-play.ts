import { act, render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { expect, vi } from 'vitest';
import { page, userEvent, type Locator } from 'vitest/browser';
import { SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT } from '@/copy';
import { isReachable } from './card-boxes';

export const LONGER_THAN_THE_GRACE_MS = 800;

export const OFFICE_IP = {
  you: '192.168.1.10',
  lucia: '192.168.1.11',
  marta: '192.168.1.12',
  printer: '192.168.1.21',
  nobody: '192.168.1.50',
  router: '192.168.1.1',
  andres: '192.168.2.15',
  server: '198.51.100.50',
  otherOffice: '10.0.0.10',
} as const;

const YOUR_LAPTOP = 'tu-laptop';
const MAP_LABEL = 'button.map-button';
const STILL_FRAMES = 5;
const FRAME_BUDGET = 1200;
const WHEEL_PX = 300;
const MAX_TURNS = 40;
const SIDE_PANEL = '.incident__side';
const SLACK_PX = 1;
const WATCHED = '.card, .map-card, .map-button, button.stamp, .html-layer .caption, .incident__inspection, .incident__map, .incident__bar, .incident__side';
const MOUSE_AWAY = { x: 0, y: 0 };

interface WheelOptions {
  within?: Locator;
  wheelPx?: number;
}

interface StillOptions {
  quietFrames?: number;
  frameBudget?: number;
}

/** Returns the name of a label of two lines (the term and the name of the resource, as «Security Group servidor2») as a pattern that both engines of the locators match: the line break that the label draws with CSS is a space for the engine that runs in Playwright and the characters «\\a» for the one that runs in the page, which reads `.element()` and `expect.element`. */
export function twoLineName(first: string, second: string): RegExp {
  return new RegExp(`^${first}\\s+(\\\\a\\s+)?${second}$`);
}

/** Draws a screen of the game with the mouse away from every label, waits until the map shows its labels, and returns the view, so the test can take the screen down when it moves on to another. */
export async function showTheScreen(screen: ReactElement) {
  await moveTheMouseAway();
  const view = render(screen);
  await expect.poll(() => document.querySelectorAll(MAP_LABEL).length).toBeGreaterThan(0);
  return view;
}

/** Returns the card of a piece, found by its name as a screen reader hears it. */
export function card(name: string): Locator {
  return page.getByRole('dialog', { name });
}

/** Clicks the label of a piece with the mouse, as a player does, and returns the card that opens. */
export async function openCard(device: string): Promise<Locator> {
  await userEvent.click(page.getByRole('button', { name: device, exact: true }));
  const opened = card(device);
  await expect.element(opened).toBeVisible();
  return opened;
}

/** Opens the terminal of a laptop that sends, your own unless another is given. */
export async function openTerminal(laptop: string = YOUR_LAPTOP): Promise<Locator> {
  await userEvent.click(page.getByRole('button', { name: laptop, exact: true }));
  const terminal = card(`Terminal de ${laptop}`);
  await expect.element(terminal).toBeVisible();
  return terminal;
}

/** Focuses the label of a piece and presses Enter on it, which opens its card without a click: a title or a card can lie over a label in a low window, and a click would land on them. */
export async function openByKeyboard(label: string): Promise<void> {
  page.getByRole('button', { name: label, exact: true }).element().focus();
  await userEvent.keyboard('{Enter}');
}

/** Presses «Listo» on a card. */
export async function confirm(opened: Locator): Promise<void> {
  await userEvent.click(opened.getByRole('button', { name: TASK_CARD_TEXT.done, exact: true }));
}

/** Picks an address in the open terminal and sends the packet. */
export async function sendTo(terminal: Locator, ip: string): Promise<void> {
  await userEvent.click(terminal.getByRole('button', { name: ip, exact: true }));
  await userEvent.click(terminal.getByRole('button', { name: TERMINAL_TEXT.send, exact: true }));
}

/** Picks a message in the open terminal and sends it. */
export async function sendMessage(terminal: Locator, message: string): Promise<void> {
  await userEvent.click(terminal.getByRole('button', { name: message, exact: true }));
  await userEvent.click(terminal.getByRole('button', { name: TERMINAL_TEXT.send, exact: true }));
}

/** Checks «Sin animaciones» with a click, so the map draws the traces and labels of the packets and nothing moves. */
export async function drawWithoutAnimations(): Promise<void> {
  await userEvent.click(page.getByLabelText(SCREEN_TEXT.motion));
}

/** Moves the mouse to the top corner of the window, away from every label, so a hover left by the scene before does not open a box in this one. */
export async function moveTheMouseAway(): Promise<void> {
  await userEvent.hover(document.body, { position: MOUSE_AWAY });
}

/** Resolves after the next frame the browser draws. */
export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function sceneAsItStands(): string {
  return JSON.stringify([
    document.getAnimations().length,
    ...[...document.querySelectorAll(WATCHED)].map((element) => {
      const { x, y, width, height } = element.getBoundingClientRect();
      return [x, y, width, height, element.getAttribute('data-scrolls'), getComputedStyle(element).pointerEvents];
    }),
  ]);
}

/** Waits until the scene stands still, and only then returns, so the boxes are measured on a scene that no longer changes: the boxes of the cards, labels, stamps and the inspection box, the attributes that decide who takes the pointer and how many CSS animations run are the same in `quietFrames` frames in a row (five unless told). It counts frames and not milliseconds, so a slow machine takes longer and reads the same; it never moves the mouse, and a scene that has not settled after `frameBudget` frames (1200 unless told) throws. */
export async function standStill({ quietFrames = STILL_FRAMES, frameBudget = FRAME_BUDGET }: StillOptions = {}): Promise<void> {
  let before = '';
  let calm = 0;
  for (let frame = 0; frame < frameBudget; frame++) {
    await nextFrame();
    const now = sceneAsItStands();
    calm = now === before ? calm + 1 : 0;
    before = now;
    if (calm >= quietFrames) return;
  }
  throw new Error(`the scene did not stand still in ${frameBudget} frames`);
}

/** Holds the timers of the page that wait for a time to pass (the grace of the inspection box), so none ends on its own while the test measures: they end only in `passTheGrace`. Animation frames are left as they are. */
export function holdTheGrace(): void {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
}

/** Lets more time pass than the grace of the inspection box takes, so every timer armed along the way has ended. */
export async function passTheGrace(): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(LONGER_THAN_THE_GRACE_MS);
  });
}

/** Records every error the page logs or throws from now on; `stop` gives the console back. */
export function watchErrors(): { errors: string[]; stop: () => void } {
  const errors: string[] = [];
  const logged = vi.spyOn(console, 'error').mockImplementation((...problem: unknown[]) => {
    errors.push(problem.map(String).join(' '));
  });
  const thrown = (event: ErrorEvent) => errors.push(event.message);
  window.addEventListener('error', thrown);
  return {
    errors,
    stop: () => {
      logged.mockRestore();
      window.removeEventListener('error', thrown);
    },
  };
}

/** Gives the page its own timers back. */
export function releaseTheGrace(): void {
  vi.useRealTimers();
}

function isInside(target: Element, scroller: Element): boolean {
  const [box, frame] = [target.getBoundingClientRect(), scroller.getBoundingClientRect()];
  const endsInside = box.bottom <= frame.bottom + SLACK_PX;
  return endsInside && (box.top >= frame.top - SLACK_PX || box.height > frame.height);
}

/** Turns the mouse wheel over the side panel, or over the scroller `within` when one is given, until the element can be reached, and, with a scroller, lies wholly inside it (an element taller than the scroller, such as the last field of an inspection box that the marks of the map cap, never can: its end in view is what counts); and returns whether it can. The wheel alone does it: nothing scrolls the element into view for the player. Each turn moves `wheelPx` pixels: a scroller that the page itself carries away needs turns short enough for the mouse to stay over it. */
export async function reachWithWheel(target: Locator, { within, wheelPx = WHEEL_PX }: WheelOptions = {}): Promise<boolean> {
  const scroller = within ?? page.elementLocator(document.querySelector(SIDE_PANEL) as Element);
  const readable = () => {
    const element = target.query();
    return element !== null && isReachable(element) && (within === undefined || isInside(element, within.element()));
  };
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (readable()) return true;
    await userEvent.wheel(scroller, { delta: { y: wheelPx } });
    await nextFrame();
    await nextFrame();
  }
  return readable();
}
