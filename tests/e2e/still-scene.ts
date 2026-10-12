import type { Page } from '@playwright/test';

const STILL_FRAMES = 5;
const FRAME_BUDGET = 1200;
const FRAME_MS = 16;

const FREEZE_AHEAD_MS = 60_000;
const WATCHED = '.card, .map-card, .map-button, button.stamp, .html-layer .caption, .incident__inspection, .incident__map, .incident__bar, .incident__side';

interface StillOptions {
  quietFrames?: number;
  frameBudget?: number;
  eachFrame?: (page: Page) => Promise<void>;
}

/** Pauses the clock of the page, which must have `page.clock.install()` called before it loaded: from now on no timer of the page fires and no animation frame runs by itself, until `stepFrame` or `page.clock` moves the time. It pauses a minute ahead of the time the page shows, because the clock keeps flowing until the call arrives and pausing in the past is an error. It is how a test keeps a timer of the page, such as the grace of the inspection box that starts when the focus leaves a piece, from ending at some moment of the real time, so the page stays in the state a click left it in. */
export async function freezeTime(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + FREEZE_AHEAD_MS);
}

/** Moves the paused clock of the page one frame forward, which fires the timers and draws the frame that are due in `FRAME_MS`. Pass it as `eachFrame` of `standStill` to stand a paused scene still. */
export async function stepFrame(page: Page): Promise<void> {
  await page.clock.runFor(FRAME_MS);
}

/** Returns what the scene looks like after the next frame the browser draws: the boxes of the cards, the labels, the stamps and the inspection box, the attributes that decide who takes the pointer, and how many CSS animations run. The frame is the one a ResizeObserver is told about, which the browser draws whatever the clock of the page says, so it comes even when the clock is paused. */
async function readAfterAFrame(page: Page): Promise<string> {
  return page.evaluate(
    (selector) =>
      new Promise<string>((read) => {
        const watcher = new ResizeObserver(() => {
          watcher.disconnect();
          read(
            JSON.stringify([
              document.getAnimations().length,
              ...[...document.querySelectorAll(selector)].map((element) => {
                const { x, y, width, height } = element.getBoundingClientRect();
                return [x, y, width, height, element.getAttribute('data-scrolls'), getComputedStyle(element).pointerEvents];
              }),
            ]),
          );
        });
        watcher.observe(document.documentElement);
      }),
    WATCHED,
  );
}

/** Waits until the scene stands still, and only then returns, so the boxes are measured on a scene that no longer changes: what `readAfterAFrame` reads is the same in `quietFrames` frames in a row (five unless told). It counts frames and not milliseconds, so a slow machine takes longer and reads the same: what the page does after a change (the map moving a card in the next frame, a box measured by a ResizeObserver that sets the attribute `data-scrolls`) is a chain of frames, and `quietFrames` is longer than that chain. It never moves the mouse or touches the page, so a box that the pointer on a label brings up is part of the scene it waits for. With `eachFrame`, the test moves the clock before each frame is read: `stepFrame` for a paused page (which draws no frame by itself, and where the time it moves is the only time that passes, so a timer that is not due after those frames has not fired), or a jump of `page.clock.fastForward` past the timers of the page, so the scene it waits for is the one at rest, with every timer that was armed along the way fired. A scene that has not settled after `frameBudget` frames (1200 unless told) throws, and nothing is measured on it. */
export async function standStill(page: Page, { quietFrames = STILL_FRAMES, frameBudget = FRAME_BUDGET, eachFrame }: StillOptions = {}): Promise<void> {
  let before = '';
  let calm = 0;
  for (let frame = 0; frame < frameBudget; frame++) {
    await eachFrame?.(page);
    const now = await readAfterAFrame(page);
    calm = now === before ? calm + 1 : 0;
    before = now;
    if (calm >= quietFrames) return;
  }
  throw new Error(`the scene did not stand still in ${frameBudget} frames`);
}
