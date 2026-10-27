const MIN_GAP_PX = 4;
const MIN_BUTTON_GAP_PX = 6;

/** Returns one line per defect in the cards on the page: content a card cuts off or lets spill, two cards that overlap in the part each shows (a card inside a region that scrolls counts only where the region shows it), a primary button that touches what is above it, buttons that touch each other, and a last button that touches the bottom edge of its card. A gap above a stamp and from a card's bottom edge counts when it is at least `gap` pixels, and a gap between two buttons when it is at least `buttonGap`. */
export function cardProblems(gap: number = MIN_GAP_PX, buttonGap: number = MIN_BUTTON_GAP_PX): string[] {
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

  const shownPart = (card: Element): Rect => {
    const box = visibleBoxOf(card, document.body);
    return { ...box, bottom: box.bottom + lipOf(card) };
  };
  for (const [index, upper] of cards.entries()) {
    for (const lower of cards.slice(index + 1)) {
      if (overlap(shownPart(upper), shownPart(lower))) problems.push(`${nameOf(upper)} overlaps ${nameOf(lower)}`);
    }
  }
  return problems;
}

/** Returns one line per card of the map that sticks out of it above or below, which cuts its band or its foot off, and per card beside its piece that rises under the title bar that floats over the top of the map: the map holds a card whatever the window, and a card taller than the map scrolls its body. */
export function cardsOutsideTheMap(): string[] {
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
}

/** True when the element lies wholly in the window and is what a click lands on at its middle and at a quarter of its width from each side, so nothing covers it and no ancestor cuts it off. Self-contained, so a Playwright test can pass it to `locator.evaluate`. */
export function isReachable(element: Element): boolean {
  const { left, top, width, height } = element.getBoundingClientRect();
  if (left < 0 || top < 0 || left + width > window.innerWidth || top + height > window.innerHeight) return false;
  return [0.5, 0.25, 0.75].every((fraction) => {
    const hit = document.elementFromPoint(left + width * fraction, top + height / 2);
    return hit !== null && element.contains(hit);
  });
}

/** Returns whether the inspection box is on show (drawn, not held back) and one line per card of the map that it covers. */
export function inspectionBoxOverCards(): { shown: boolean; covered: string[] } {
  const EPSILON = 0.5;
  const box = document.querySelector('.incident__inspection > .card');
  if (box === null || getComputedStyle(box).visibility === 'hidden') return { shown: false, covered: [] };
  const taken = box.getBoundingClientRect();
  const covered = [...document.querySelectorAll('.map-card .card')].flatMap((card) => {
    const { left, top, right, bottom } = card.getBoundingClientRect();
    const overlaps = left < taken.right - EPSILON && taken.left < right - EPSILON && top < taken.bottom - EPSILON && taken.top < bottom - EPSILON;
    return overlaps ? [`the inspection box covers the card ${card.querySelector('h2')?.textContent?.trim() ?? 'of the map'}`] : [];
  });
  return { shown: true, covered };
}
