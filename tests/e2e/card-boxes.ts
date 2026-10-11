import type { Locator, Page } from '@playwright/test';

export const MIN_GAP_PX = 4;
export const MIN_BUTTON_GAP_PX = 6;

const WHEEL_PX = 300;
const MAX_TURNS = 40;
const SIDE_PANEL = '.incident__side';
const HIT_POINTS = [0.5, 0.25, 0.75];

/** Returns one line per defect in the cards on the page: content a card cuts off or lets spill, two cards that overlap, a card over the help of the inspection box, a primary button that touches what is above it, buttons that touch each other, and a last button that touches the bottom edge of its card. A gap above a stamp and from a card's bottom edge counts when it is at least `minGap` pixels, and a gap between two buttons when it is at least `minButtonGap`. */
export async function cardProblems(page: Page, minGap: number = MIN_GAP_PX, minButtonGap: number = MIN_BUTTON_GAP_PX): Promise<string[]> {
  return page.evaluate(([gap, buttonGap]) => {
    interface Rect {
      left: number;
      top: number;
      right: number;
      bottom: number;
    }
    const EPSILON = 0.5;
    const problems: string[] = [];
    const rectOf = (element: Element): Rect => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    };
    const paddingBoxOf = (element: Element): Rect => {
      const { left, top } = element.getBoundingClientRect();
      return { left: left + element.clientLeft, top: top + element.clientTop, right: left + element.clientLeft + element.clientWidth, bottom: top + element.clientTop + element.clientHeight };
    };
    const isEmpty = (rect: Rect) => rect.right - rect.left <= 0 || rect.bottom - rect.top <= 0;
    const overlap = (a: Rect, b: Rect) => a.left < b.right - EPSILON && b.left < a.right - EPSILON && a.top < b.bottom - EPSILON && b.top < a.bottom - EPSILON;
    const sideBySide = (a: Rect, b: Rect) => a.left < b.right - EPSILON && b.left < a.right - EPSILON;
    const inside = (inner: Rect, outer: Rect) => inner.left >= outer.left - EPSILON && inner.top >= outer.top - EPSILON && inner.right <= outer.right + EPSILON && inner.bottom <= outer.bottom + EPSILON;
    const inClosedDetails = (element: Element) => {
      const closed = element.closest('details:not([open])');
      return closed !== null && element !== closed && !element.closest('summary');
    };
    const shown = (element: Element) => !element.closest('.sr-only') && !inClosedDetails(element) && !isEmpty(rectOf(element));
    const overflowOf = (element: Element): 'clips' | 'scrolls' | 'visible' => {
      const { overflowX, overflowY } = getComputedStyle(element);
      if ([overflowX, overflowY].some((value) => value === 'auto' || value === 'scroll')) return 'scrolls';
      return [overflowX, overflowY].some((value) => value === 'hidden' || value === 'clip') ? 'clips' : 'visible';
    };
    const paints = (element: Element) => {
      const style = getComputedStyle(element);
      const hasText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
      const hasBorder = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth].some((width) => Number.parseFloat(width) > 0);
      const hasFill = style.backgroundColor !== 'rgba(0, 0, 0, 0)' || style.backgroundImage !== 'none';
      return element.matches('svg, img, canvas') || hasText || hasBorder || hasFill || style.boxShadow !== 'none';
    };
    const lipOf = (element: Element) => {
      const [, offset] = getComputedStyle(element).boxShadow.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/) ?? [];
      return Math.max(Number(offset ?? 0), 0);
    };
    const withLip = (element: Element): Rect => {
      const rect = rectOf(element);
      return { ...rect, bottom: rect.bottom + lipOf(element) };
    };
    const describe = (element: Element) => `${element.tagName.toLowerCase()} «${(element.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 32)}»`;
    const nameOf = (card: Element) => card.getAttribute('aria-label') ?? document.getElementById(card.getAttribute('aria-labelledby') ?? '')?.textContent?.trim() ?? describe(card);
    const ancestorsOf = (element: Element): Element[] => {
      const found: Element[] = [];
      for (let parent = element.parentElement; parent; parent = parent.parentElement) found.push(parent);
      return found;
    };
    const visibleBoxOf = (element: Element, card: Element): Rect => {
      const within = ancestorsOf(element).slice(0, ancestorsOf(element).indexOf(card) + 1);
      return within.filter((ancestor) => overflowOf(ancestor) !== 'visible').reduce((box, ancestor) => {
        const clip = paddingBoxOf(ancestor);
        return { left: Math.max(box.left, clip.left), top: Math.max(box.top, clip.top), right: Math.min(box.right, clip.right), bottom: Math.min(box.bottom, clip.bottom) };
      }, rectOf(element));
    };

    const cards = [...document.querySelectorAll('.card')].filter(shown);

    for (const card of cards) {
      const cardBox = rectOf(card);
      const inner = [...card.querySelectorAll('*')].filter(shown);
      for (const element of [card, ...inner]) {
        if (overflowOf(element) === 'clips' && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1 || element.scrollTop !== 0 || element.scrollLeft !== 0)) {
          problems.push(`${nameOf(card)}: ${describe(element)} hides content that does not fit`);
        }
      }
      const cutOff: string[] = [];
      const spilled: string[] = [];
      for (const element of inner) {
        const box = rectOf(element);
        const chain = ancestorsOf(element).filter((ancestor) => overflowOf(ancestor) !== 'visible' && !inside(box, paddingBoxOf(ancestor)));
        const blocker = chain.find((ancestor) => overflowOf(ancestor) === 'clips' || card.contains(ancestor));
        if (blocker && overflowOf(blocker) === 'clips') cutOff.push(`${describe(element)} by ${describe(blocker)}`);
        else if (!blocker && !inside(box, cardBox)) spilled.push(describe(element));
      }
      if (cutOff.length > 0) problems.push(`${nameOf(card)}: ${cutOff.length} elements are cut off, the first ${cutOff[0]}`);
      if (spilled.length > 0) problems.push(`${nameOf(card)}: ${spilled.length} elements spill out of the card, the first ${spilled[0]}`);

      for (const stamp of inner.filter((element) => element.matches('.btn--primary'))) {
        const stampBox = rectOf(stamp);
        const others = inner.filter((element) => element !== stamp && !stamp.contains(element) && !element.contains(stamp) && paints(element));
        let nearest: { gap: number; element: Element } | null = null;
        for (const element of others) {
          const box = visibleBoxOf(element, card);
          if (isEmpty(box)) continue;
          if (overlap(stampBox, box)) problems.push(`${nameOf(card)}: ${describe(stamp)} overlaps ${describe(element)}`);
          else if (box.bottom <= stampBox.top + EPSILON && sideBySide(stampBox, box) && (nearest === null || stampBox.top - box.bottom < nearest.gap)) nearest = { gap: stampBox.top - box.bottom, element };
        }
        if (nearest && nearest.gap < gap) problems.push(`${nameOf(card)}: ${describe(stamp)} is ${nearest.gap.toFixed(1)}px under ${describe(nearest.element)}`);
      }

      const buttons = inner.filter((element) => element.matches('.btn'));
      for (const [index, upper] of buttons.entries()) {
        for (const lower of buttons.slice(index + 1)) {
          const [a, b] = [withLip(upper), withLip(lower)];
          const [first, second] = a.top <= b.top ? [a, b] : [b, a];
          if (overlap(a, b)) problems.push(`${nameOf(card)}: ${describe(upper)} overlaps ${describe(lower)}`);
          else if (sideBySide(a, b) && second.top - first.bottom < buttonGap) problems.push(`${nameOf(card)}: ${describe(upper)} and ${describe(lower)} are ${(second.top - first.bottom).toFixed(1)}px apart`);
        }
      }
      const lowest = buttons.map(withLip).sort((a, b) => b.bottom - a.bottom)[0];
      if (lowest && paddingBoxOf(card).bottom - lowest.bottom < gap) problems.push(`${nameOf(card)}: its last button is ${(paddingBoxOf(card).bottom - lowest.bottom).toFixed(1)}px from the bottom edge`);
    }

    for (const [index, upper] of cards.entries()) {
      for (const lower of cards.slice(index + 1)) {
        if (overlap(withLip(upper), withLip(lower))) problems.push(`${nameOf(upper)} overlaps ${nameOf(lower)}`);
      }
    }
    const helps = [...document.querySelectorAll('.incident__inspection > p')].filter(shown);
    for (const card of cards) {
      for (const help of helps) {
        if (overlap(withLip(card), rectOf(help))) problems.push(`${nameOf(card)} overlaps the inspection help ${describe(help)}`);
      }
    }
    return problems;
  }, [minGap, minButtonGap] as const);
}

/** Returns one line per card of the map that sticks out of it above or below, which cuts its band or its foot off, and per card beside its piece that rises under the title bar that floats over the top of the map: the map holds a card whatever the window, and a card taller than the map scrolls its body. */
export async function cardsOutsideTheMap(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const EPSILON = 0.5;
    const map = document.querySelector('.incident__map')?.getBoundingClientRect();
    const bar = document.querySelector('.incident__bar')?.getBoundingClientRect();
    if (!map || !bar) return [];
    return [...document.querySelectorAll('.map-card')].flatMap((holder) => {
      const card = holder.querySelector('.card');
      if (!card) return [];
      const { top, bottom } = card.getBoundingClientRect();
      const name = card.querySelector('h2')?.textContent?.trim() ?? 'a card';
      const beside = holder.matches('.map-card--left, .map-card--right');
      const problems: string[] = [];
      if (top < map.top - EPSILON) problems.push(`${name} sticks out of the map by ${(map.top - top).toFixed(1)}px above`);
      else if (beside && top < bar.bottom - EPSILON) problems.push(`${name} rises ${(bar.bottom - top).toFixed(1)}px under the title bar`);
      if (bottom > map.bottom + EPSILON) problems.push(`${name} sticks out of the map by ${(bottom - map.bottom).toFixed(1)}px below`);
      return problems;
    });
  });
}

/** True when the element lies wholly in the window and is what a click lands on at its middle and at a quarter of its width from each side, so nothing covers it and no ancestor cuts it off. */
export async function isReachable(page: Page, target: Locator): Promise<boolean> {
  const [box, viewport] = await Promise.all([target.boundingBox(), page.viewportSize()]);
  if (box === null || viewport === null || box.x < 0 || box.y < 0 || box.x + box.width > viewport.width || box.y + box.height > viewport.height) return false;
  return target.evaluate(
    (element, fractions) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return fractions.every((fraction) => {
        const hit = document.elementFromPoint(left + width * fraction, top + height / 2);
        return hit !== null && element.contains(hit);
      });
    },
    HIT_POINTS,
  );
}

async function isInside(target: Locator, scroller: Locator): Promise<boolean> {
  const [box, frame] = await Promise.all([target.boundingBox(), scroller.boundingBox()]);
  return box !== null && frame !== null && box.y >= frame.y - 1 && box.y + box.height <= frame.y + frame.height + 1;
}

interface WheelOptions {
  within?: Locator;
  wheelPx?: number;
}

/** Turns the mouse wheel over the side panel, or over the scroller `within` when one is given, until the element can be reached, and, with a scroller, lies wholly inside it; and returns whether it can. The wheel alone does it: nothing scrolls the element into view for the player. Each turn moves `wheelPx` pixels: a scroller that the page itself carries away needs turns short enough for the mouse to stay over it. */
export async function reachWithWheel(page: Page, target: Locator, { within, wheelPx = WHEEL_PX }: WheelOptions = {}): Promise<boolean> {
  const [panel, viewport] = await Promise.all([(within ?? page.locator(SIDE_PANEL)).boundingBox(), page.viewportSize()]);
  if (panel === null || viewport === null) throw new Error('the scroller is not on the page');
  const readable = async () => (await isReachable(page, target)) && (within === undefined || (await isInside(target, within)));
  const shownTop = Math.max(panel.y, 0);
  const shownBottom = Math.min(panel.y + panel.height, viewport.height);
  await page.mouse.move(panel.x + panel.width / 2, (shownTop + shownBottom) / 2);
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    if (await readable()) return true;
    await page.mouse.wheel(0, wheelPx);
    await page.evaluate(() => new Promise<void>((settled) => requestAnimationFrame(() => requestAnimationFrame(() => settled()))));
  }
  return readable();
}
