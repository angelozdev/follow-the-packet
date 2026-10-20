import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { nameTag, type TermId } from '@/copy';
import { Button, Card } from '@/design';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, tcp } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapPiece, mapRunWithPorts, type MapPieceFixture, type MapRunFixture } from '@/testing/map-pieces';
import { ROOM_UNDER_THE_DRAWING } from '@/scene/cards/placement';
import { MapStage } from '@/scene/map-stage';
import { pieceDomId } from '@/scene/overlay/piece-label';

const WORLD = officeTwoFloorsNet();
const PIECES = FLOORS_LABEL_PIECES;
const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const PHONE = { width: 390, height: 844 };
const TOO_NARROW_FOR_A_CARD = { width: 300, height: 640 };
const LOW_DESKTOP = { width: 1280, height: 360 };
const WIDE_DESKTOP = { width: 1440, height: 900 };
const WIDE_AND_LOW = { width: 1440, height: 500 };
const DESKTOP = { width: 1280, height: 800 };
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const CARD_NAME = 'Terminal de prueba';
const DONE = 'Listo';
const CAPTION = 'Origen';
const CARD = '.map-card';
const LAYER = '.html-layer';
const EPSILON = 0.5;
const BODY_LINES = 18;
const SHORT_CARD_LINES = 1;
const FOOT_HIT_POINTS = [0.5, 0.25, 0.75];
const INSPECTION_LAYER = 35;
const TITLE_BAR_LAYER = 40;
const FIREWALL = 'firewall:your-firewall';
const ROUTER = 'edge:router-office';
const YOUR_LAPTOP = 'device:your-laptop';
const { officeRouter, server } = OFFICE_FLOORS;
const YOU = device('your-laptop');
const GHOST = mapPiece({ kind: 'device', variant: 'laptop' }, 'ghost-laptop', nameTag('laptop-fantasma'));

function focusAfterTheCommit(heading: HTMLElement | null): void {
  if (heading !== null) requestAnimationFrame(() => heading.focus());
}

function TallCard({ lines = BODY_LINES }: { lines?: number }) {
  return (
    <Card role="dialog" aria-label={CARD_NAME} header={{ title: <h2 tabIndex={-1} ref={focusAfterTheCommit}>{CARD_NAME}</h2> }}>
      <div className="chip-card">
        <div className="chip-card__body">
          <span className="caption caption--soft">{CAPTION}</span>
          {Array.from({ length: lines }, (_, line) => (
            <p key={line}>Línea {line + 1} de lo que muestra la tarjeta</p>
          ))}
        </div>
        <div className="chip-card__actions">
          <Button>{DONE}</Button>
        </div>
      </div>
    </Card>
  );
}

function Screen({ openPieceId, lines, still = true, flows = [], pieces = PIECES }: { openPieceId: string | null; lines?: number; still?: boolean; flows?: readonly MapRunFixture[]; pieces?: readonly MapPieceFixture[] }) {
  return (
    <main className="incident incident--map2d">
      <div className="incident__map">
        <header className="incident__bar">
          <h1>Incidente de prueba</h1>
        </header>
        <MapStage
          world={WORLD}
          pieces={pieces}
          known={NOTHING_KNOWN}
          blockName={null}
          activePieceId={openPieceId}
          still={still}
          flows={flows}
          sent={[]}
          inspectTrigger={() => ({})}
          inspectStampsTrigger={() => ({})}
          onActivate={() => undefined}
          overlay={openPieceId === null ? null : <TallCard lines={lines} />}
        />
      </div>
      <div className="incident__inspection" />
      <aside className="incident__side" />
    </main>
  );
}

async function mountScreen(size: { width: number; height: number }, props: Partial<Parameters<typeof Screen>[0]> = {}) {
  await page.viewport(size.width, size.height);
  const view = render(<Screen openPieceId={null} {...props} />);
  await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBe(PIECES.length);
  const open = (openPieceId: string | null, lines?: number) => view.rerender(<Screen {...props} openPieceId={openPieceId} lines={lines} />);
  return { ...view, open };
}

const twoFrames = () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
const find = <Element extends HTMLElement | SVGElement>(container: ParentNode, selector: string) => container.querySelector(selector) as Element;
const rectOf = (element: Element) => element.getBoundingClientRect();
const overlap = (a: DOMRect, b: DOMRect) => a.left < b.right - EPSILON && b.left < a.right - EPSILON && a.top < b.bottom - EPSILON && b.top < a.bottom - EPSILON;

function problemsOfTheCard(container: HTMLElement): string[] {
  const holder = container.querySelector<HTMLElement>(CARD);
  const foot = [...container.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.textContent === DONE);
  if (holder === null || foot === undefined) return ['the card is not drawn'];
  const [map, bar, card, reach] = [rectOf(find(container, '.incident__map')), rectOf(find(container, '.incident__bar')), rectOf(find(holder, '.card')), rectOf(foot)];
  const problems: string[] = [];
  if (card.top < map.top - EPSILON) problems.push(`sticks out of the map by ${(map.top - card.top).toFixed(1)}px above`);
  if (card.bottom > map.bottom + EPSILON) problems.push(`sticks out of the map by ${(card.bottom - map.bottom).toFixed(1)}px below`);
  if (card.left < map.left - EPSILON || card.right > map.right + EPSILON) problems.push(`sticks out of the map sideways: ${card.left.toFixed(1)} to ${card.right.toFixed(1)} in ${map.left} to ${map.right}`);
  if (!holder.classList.contains('map-card--dock') && card.top < bar.bottom - EPSILON) problems.push(`rises ${(bar.bottom - card.top).toFixed(1)}px under the title bar`);
  if (reach.top < 0 || reach.left < 0 || reach.bottom > window.innerHeight || reach.right > window.innerWidth) problems.push(`its foot is out of the window: top ${reach.top.toFixed(1)}, bottom ${reach.bottom.toFixed(1)} in ${window.innerHeight}`);
  const covered = FOOT_HIT_POINTS.some((share) => {
    const hit = document.elementFromPoint(reach.left + reach.width * share, reach.top + reach.height / 2);
    return hit === null || !foot.contains(hit);
  });
  if (covered) problems.push('something covers its foot');
  return problems;
}

function stackingContextOf(element: Element): Element {
  for (let parent = element.parentElement; parent !== null; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    const positioned = style.position !== 'static' && style.zIndex !== 'auto';
    if (positioned || style.opacity !== '1' || style.transform !== 'none' || style.isolation === 'isolate' || style.filter !== 'none') return parent;
  }
  return document.documentElement;
}

const zIndexOf = (element: Element) => {
  const { zIndex } = getComputedStyle(element);
  return zIndex === 'auto' ? 0 : Number(zIndex);
};

describe('the card of the 2D map in the browser', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('a card opened on a narrow map never scrolls the layer of the labels', async () => {
    for (const [name, size] of [['390 px', PHONE], ['300 px, where the card cannot fit the map', TOO_NARROW_FOR_A_CARD]] as const) {
      const view = await mountScreen(size);
      const layer = find<HTMLElement>(view.container, LAYER);
      const svg = find<SVGSVGElement>(view.container, 'svg');
      const router = find<HTMLElement>(view.container, `#${pieceDomId(ROUTER)}`);
      const placeOf = () => ({ x: rectOf(router).left - rectOf(svg).left, y: rectOf(router).top - rectOf(svg).top });
      const home = placeOf();
      const scrolled = () => [layer.scrollLeft, layer.scrollTop];

      view.open(YOUR_LAPTOP);
      await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
      await expect.poll(() => document.activeElement?.textContent).toBe(CARD_NAME);
      expect(scrolled(), `${name}, with the card of the laptop open`).toEqual([0, 0]);
      expect(placeOf(), `${name}, the label of the router stands where it stood`).toEqual(home);

      view.open(null);
      await expect.poll(() => view.container.querySelector(CARD)).toBeNull();
      router.focus();
      expect(document.activeElement, name).toBe(router);
      expect(scrolled(), `${name}, after it closes and the label takes the focus`).toEqual([0, 0]);
      expect(placeOf(), `${name}, after it closes`).toEqual(home);
      view.unmount();
    }
  });

  it('a card beside a piece stays inside the map, with its foot in view, at 390 px and at 1280×360', async () => {
    for (const [name, size] of [['390 px', PHONE], ['1280×360', LOW_DESKTOP]] as const) {
      const view = await mountScreen(size);
      for (const { id } of PIECES) {
        view.open(id);
        await expect.poll(() => problemsOfTheCard(view.container), { message: `${name}, ${id}` }).toEqual([]);
      }
      view.unmount();
    }
  });

  it('a card that grows after it opens is brought into view again, so its foot stays in reach', async () => {
    for (const [name, size] of [['1440×900', WIDE_DESKTOP], ['1440×500', WIDE_AND_LOW]] as const) {
      const view = await mountScreen(size);
      for (const { id } of PIECES) {
        view.open(id, SHORT_CARD_LINES);
        await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
        await twoFrames();
        view.open(id);
        await expect.poll(() => problemsOfTheCard(view.container), { message: `${name}, ${id}` }).toEqual([]);
        view.open(null);
        await expect.poll(() => view.container.querySelector(CARD)).toBeNull();
      }
      view.unmount();
    }
  });

  it('a card docked under a drawing that grows is brought into view again', async () => {
    const [router, internet, farServer] = [ROUTER, 'internet:internet', 'device:internet-server'];
    const before = PIECES.filter(({ id }) => ![router, internet, farServer].includes(id));
    await page.viewport(LOW_DESKTOP.width, LOW_DESKTOP.height);
    const view = render(<Screen openPieceId={YOUR_LAPTOP} lines={SHORT_CARD_LINES} pieces={before} />);
    await expect.poll(() => view.container.querySelectorAll('button.map-button').length).toBe(before.length);
    await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
    const svg = find<SVGSVGElement>(view.container, 'svg');
    const small = rectOf(svg).height;
    await expect.poll(() => problemsOfTheCard(view.container)).toEqual([]);

    view.rerender(<Screen openPieceId={YOUR_LAPTOP} lines={SHORT_CARD_LINES} pieces={PIECES} />);

    await expect.poll(() => rectOf(svg).height).toBeGreaterThan(small);
    await expect.poll(() => problemsOfTheCard(view.container)).toEqual([]);
    view.unmount();
  });

  it('when the card closes the stage and the page are back where they were when it opened, and so are the labels in the window', async () => {
    for (const [name, size, openPieceId] of [['390 px', PHONE, ROUTER], ['1280×360', LOW_DESKTOP, YOUR_LAPTOP]] as const) {
      const view = await mountScreen(size);
      const stage = find(view.container, '.map-stage');
      const label = find(view.container, `#${pieceDomId(openPieceId)}`);
      const scrolls = () => [stage.scrollTop, document.documentElement.scrollTop];
      const home = { scrolls: scrolls(), place: rectOf(label).toJSON() };

      view.open(openPieceId);
      await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
      expect(scrolls().reduce((total, offset) => total + offset, 0), `${name}, the card was brought into view`).toBeGreaterThan(0);

      view.open(null);
      await expect.poll(() => view.container.querySelector(CARD)).toBeNull();
      expect(scrolls(), `${name}, after it closes`).toEqual(home.scrolls);
      expect(rectOf(label).toJSON(), `${name}, the label stands where it stood in the window`).toEqual(home.place);
      view.unmount();
    }
  });

  it('a card covers no label and no piece of the map, docked or beside, as the browser draws it', async () => {
    for (const [name, size] of [['1280×800', DESKTOP], ['390 px', PHONE]] as const) {
      const view = await mountScreen(size);
      const marks = [...view.container.querySelectorAll('button.map-button, g.map-piece')];
      expect(marks.length).toBeGreaterThan(PIECES.length);
      for (const { id, kind } of PIECES.filter(({ kind: each }) => each !== 'firewall')) {
        view.open(id);
        await expect.poll(() => problemsOfTheCard(view.container), { message: `${name}, ${id}` }).toEqual([]);
        const holder = find(view.container, CARD);
        const covered = marks.filter((mark) => overlap(rectOf(holder), rectOf(mark))).map((mark) => mark.getAttribute('id') ?? mark.getAttribute('data-piece') ?? mark.tagName);
        expect(covered, `${name}, ${kind} ${id}`).toEqual([]);
      }
      view.unmount();
    }
  });

  it('while a card is open the sheet leaves the room a docked card needs under the drawing, and the layer covers it', async () => {
    const view = await mountScreen(PHONE);
    const sheet = find(view.container, '.map-stage__sheet');
    const svg = find<SVGSVGElement>(view.container, 'svg');
    const closed = rectOf(sheet).height;
    expect(rectOf(find(view.container, LAYER)).height).toBe(closed);

    view.open(ROUTER);
    await expect.poll(() => rectOf(sheet).height).toBe(closed + ROOM_UNDER_THE_DRAWING);
    expect(rectOf(sheet).bottom - rectOf(svg).bottom).toBe(ROOM_UNDER_THE_DRAWING);
    expect(rectOf(find(view.container, LAYER)).height).toBe(closed + ROOM_UNDER_THE_DRAWING);

    view.open(null);
    await expect.poll(() => rectOf(sheet).height).toBe(closed);
  });

  it('a piece the layout holds no box for opens no card', async () => {
    const view = await mountScreen(DESKTOP, { pieces: [...PIECES, GHOST] });
    view.open(GHOST.id);
    expect(view.container.querySelector(CARD)).toBeNull();
    expect(view.container.querySelectorAll('button.map-button')).toHaveLength(PIECES.length);
    view.open(FIREWALL);
    await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
  });

  it('what a card holds keeps the style it has outside the map: its captions stay in the flow of the card', async () => {
    const view = await mountScreen(DESKTOP);
    const outside = render(<span className="caption caption--soft">{CAPTION}</span>, { container: document.body.appendChild(document.createElement('div')) });
    const reference = getComputedStyle(find(outside.container, '.caption'));

    view.open(FIREWALL);
    await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
    const caption = find(view.container, `${CARD} .caption`);
    const style = getComputedStyle(caption);
    expect([style.position, style.whiteSpace]).toEqual([reference.position, reference.whiteSpace]);
    expect(rectOf(caption).bottom).toBeLessThanOrEqual(rectOf(find(view.container, `${CARD} .chip-card__body p`)).top + EPSILON);
  });

  it('an open card stands above the labels that fly, and below the inspection box and the title bar', async () => {
    const flying = mapRunWithPorts(WORLD, tcp(YOU, server.ip, 80), 'to-the-server', officeRouter.id, { replied: true });
    const view = await mountScreen(DESKTOP, { still: false, flows: [flying] });
    const labels = find<SVGSVGElement>(view.container, '.map-stage__flight-labels');

    view.open(FIREWALL);
    await expect.poll(() => view.container.querySelector(CARD)).not.toBeNull();
    const holder = find(view.container, CARD);
    expect(getComputedStyle(holder).position).toBe('absolute');
    expect(stackingContextOf(holder)).toBe(stackingContextOf(labels));
    expect(zIndexOf(holder)).toBeGreaterThan(zIndexOf(labels));
    expect(zIndexOf(holder)).toBeLessThan(zIndexOf(find(view.container, '.incident__inspection')));
    expect(zIndexOf(find(view.container, '.incident__inspection'))).toBe(INSPECTION_LAYER);
    expect(zIndexOf(find(view.container, '.incident__bar'))).toBe(TITLE_BAR_LAYER);
    expect(zIndexOf(holder)).toBeLessThan(zIndexOf(find(view.container, '.incident__bar')));
  });
});
