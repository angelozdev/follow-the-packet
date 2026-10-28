import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { MAP_TEXT, stampLabel, stampOf, toPlainText, type TermId } from '@/copy';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, triggerSpies, type MapRunFixture } from '@/testing/map-pieces';
import { StampMore } from '@/scene/entities/stamp';
import { FAN_PITCH, type Mark } from '@/scene/layout/arrange/geometry';
import { layoutMap } from '@/scene/layout/map-layout';
import { GameScene } from '@/scene/game-scene';
import { MapStage } from '@/scene/map-stage';
import { fanStamps, stampsByPlace } from '@/scene/marks/stamp-fan';
import { readingOrder } from '@/scene/marks/reading-order';
import { pieceDomId } from '@/scene/overlay/piece-label';

const MARTA_DOOR = 'door:marta-laptop';
const WIDTH = 1000;
const USUAL_LETTER = 18;
const SMALL_LETTER = 14;
const HALF_A_PIXEL = 0.5;
const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const WORLD = officeTwoFloorsNet();
const PIECES = FLOORS_LABEL_PIECES;

const toMarta = (id: string, extras: Partial<MapRunFixture> = {}, sender = 'your-laptop') => mapRun(WORLD, ping(device(sender), OFFICE_FLOORS.floor1.marta), id, extras);
const many = (count: number, extras: Partial<MapRunFixture> = {}, prefix = 'run') => Array.from({ length: count }, (_, index) => toMarta(`${prefix}-${index + 1}`, extras));
const nameOf = (run: MapRunFixture) => stampLabel(toPlainText(run.label), stampOf(run));

function stage(runs: readonly MapRunFixture[], sent: readonly (MapRunFixture & { send: number })[] = []) {
  return (
    <div data-testid="box" style={{ width: WIDTH, position: 'relative' }}>
      <MapStage world={WORLD} pieces={PIECES} known={NOTHING_KNOWN} blockName={null} activePieceId={null} still flows={runs} sent={sent} inspectTrigger={() => ({})} inspectStampsTrigger={() => ({})} onActivate={() => undefined} />
    </div>
  );
}

async function mountStage(runs: readonly MapRunFixture[], sent: readonly (MapRunFixture & { send: number })[] = []) {
  await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
  const view = render(stage(runs, sent));
  const box = view.getByTestId('box');
  await expect.poll(() => box.querySelectorAll('button.map-button').length).toBe(PIECES.length);
  const layout = layoutMap(WORLD, PIECES, { width: WIDTH });
  const fans = fanStamps(stampsByPlace([...runs, ...sent], layout.drawn), layout.marks);
  const origin = () => (box.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
  const centerOf = (element: Element) => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - origin().left, y: rect.top + rect.height / 2 - origin().top };
  };
  const stamps = () => stampsIn(box);
  return { ...view, box, layout, fans, origin, centerOf, stamps };
}

const stampsIn = (box: HTMLElement) => [...box.querySelectorAll<HTMLButtonElement>('button.stamp')];

async function stampsDrawn(view: ReturnType<typeof render>, count: number): Promise<HTMLButtonElement[]> {
  const box = view.getByTestId('box');
  await expect.poll(() => stampsIn(box).length).toBe(count);
  return stampsIn(box);
}

function colorOf(token: string): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  document.body.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

const markOf = (marks: readonly Mark[], station: string) => marks.find((mark) => mark.station === station) as Mark;

function pointAt({ x, y }: { x: number; y: number }, origin: DOMRect) {
  return { x: origin.left + x, y: origin.top + y };
}

function buttonAt(point: { x: number; y: number }): Element | null {
  return document.elementFromPoint(point.x, point.y)?.closest('button') ?? null;
}

describe('the stamps of the 2D map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('three stamps of one place stand 25 px apart across the link and a fifth makes «+3»', async () => {
    const three = many(3);
    const { box, layout, centerOf, stamps, rerender } = await mountStage(three);
    const mark = markOf(layout.marks, MARTA_DOOR);
    const along = mark.axis;
    const across = along === 'x' ? 'y' : 'x';
    const [alongAt, acrossAt] = [mark.point[along === 'x' ? 0 : 1], mark.point[across === 'x' ? 0 : 1]];
    await expect.poll(() => stamps().length).toBe(3);
    const centers = stamps().map(centerOf);
    centers.forEach((center, index) => {
      expect(Math.abs(center[along] - (alongAt + (index - 1) * FAN_PITCH)), `stamp ${index + 1} along the fan`).toBeLessThanOrEqual(HALF_A_PIXEL);
      expect(Math.abs(center[across] - acrossAt), `stamp ${index + 1} across the fan`).toBeLessThanOrEqual(HALF_A_PIXEL);
    });
    expect(stamps().some((button) => button.classList.contains('stamp--more'))).toBe(false);
    rerender(stage(many(5)));
    await expect.poll(() => stamps().length).toBe(3);
    const fifth = stamps();
    expect(fifth.map((button) => button.classList.contains('stamp--more'))).toEqual([false, false, true]);
    expect(fifth[2]).toHaveTextContent('+3');
    expect(fifth[2].getAttribute('aria-label')).toBe(MAP_TEXT.moreStamps(3, 5));
    fifth.map(centerOf).forEach((center, index) => {
      expect(Math.abs(center[along] - (alongAt + (index - 1) * FAN_PITCH)), `of five, stamp ${index + 1} along the fan`).toBeLessThanOrEqual(HALF_A_PIXEL);
      expect(Math.abs(center[across] - acrossAt), `of five, stamp ${index + 1} across the fan`).toBeLessThanOrEqual(HALF_A_PIXEL);
    });
    expect(box.querySelectorAll('button.stamp')).toHaveLength(3);
  });

  it('the flows of the incident stand at the low end of the fan and the packets the player sent after them, in the order they were given', async () => {
    const flow = toMarta('flow', {}, 'lucia-laptop');
    const sent = [{ ...toMarta('first-sent', {}, 'andres-laptop'), send: 2 }, { ...toMarta('second-sent'), send: 1 }];
    const { layout, centerOf, stamps } = await mountStage([flow], sent);
    await expect.poll(() => stamps().length).toBe(3);
    const mark = markOf(layout.marks, MARTA_DOOR);
    expect(stamps().map((button) => button.getAttribute('aria-label'))).toEqual([flow, ...sent].map(nameOf));
    const along = stamps().map((button) => centerOf(button)[mark.axis]);
    expect(along).toEqual([...along].sort((a, b) => a - b));
  });

  it('the stamp under the pointer or with the focus comes to the front and «+N» stays on top otherwise', async () => {
    const { stamps, origin, centerOf } = await mountStage(many(5));
    await expect.poll(() => stamps().length).toBe(3);
    const [first, second, more] = stamps();
    const between = (a: Element, b: Element) => {
      const [from, to] = [centerOf(a), centerOf(b)];
      return pointAt({ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }, origin());
    };
    const underSecondAndMore = between(second, more);
    const underFirstAndSecond = between(first, second);
    expect(buttonAt(underSecondAndMore), 'at rest «+N» covers the stamp before it').toBe(more);
    expect(buttonAt(underFirstAndSecond), 'at rest a stamp covers the one before it').toBe(second);

    await userEvent.hover(second);
    await expect.poll(() => buttonAt(underSecondAndMore)).toBe(second);
    await userEvent.hover(first);
    await expect.poll(() => buttonAt(underFirstAndSecond)).toBe(first);
    await expect.poll(() => buttonAt(underSecondAndMore)).toBe(more);
    await userEvent.hover(more);
    expect(buttonAt(underSecondAndMore)).toBe(more);
    await userEvent.unhover(more);

    second.focus();
    await expect.poll(() => buttonAt(underSecondAndMore)).toBe(second);
    first.focus();
    await expect.poll(() => buttonAt(underFirstAndSecond)).toBe(first);
    await expect.poll(() => buttonAt(underSecondAndMore)).toBe(more);
    first.blur();
    await expect.poll(() => buttonAt(underFirstAndSecond)).toBe(second);
  });

  it('the stage gives each stamp the trigger of its packet and «+N» the trigger of the list of its place', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const runs = many(5);
    const [ofAPacket, ofTheList] = [triggerSpies(), triggerSpies()];
    const asked: string[] = [];
    const view = render(
      <div data-testid="box" style={{ width: WIDTH, position: 'relative' }}>
        <MapStage
          world={WORLD}
          pieces={PIECES}
          known={NOTHING_KNOWN}
          blockName={null}
          activePieceId={null}
          still
          flows={runs}
          sent={[]}
          inspectTrigger={(pieceId) => (asked.push(pieceId), ofAPacket)}
          inspectStampsTrigger={(packetIds) => (asked.push(packetIds.join('|')), ofTheList)}
          onActivate={() => undefined}
        />
      </div>,
    );
    const [first, , more] = await stampsDrawn(view, 3);
    await userEvent.click(first);
    expect(ofAPacket.onClick).toHaveBeenCalledTimes(1);
    expect(ofTheList.onClick).not.toHaveBeenCalled();
    await userEvent.click(more);
    expect(ofTheList.onClick).toHaveBeenCalledTimes(1);
    expect(ofAPacket.onClick).toHaveBeenCalledTimes(1);
    expect(asked).toContain(runs[3].pieceId);
    expect(asked).toContain(runs.map(({ id }) => id).join('|'));
  });

  it('the scene hands the stage the flows, the packets sent and what inspects a list of stamps, and a stamp stands for each', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const flows = [toMarta('flow', {}, 'lucia-laptop')];
    const sent = [{ ...toMarta('sent-a'), send: 1 }, { ...toMarta('sent-b', {}, 'andres-laptop'), send: 2 }, { ...toMarta('sent-c', {}, 'lucia-laptop'), send: 3 }];
    const lists = triggerSpies();
    const asked = new Set<string>();
    const view = render(
      <div data-testid="box" style={{ width: WIDTH, position: 'relative' }}>
        <GameScene world={WORLD} pieces={PIECES} flows={flows} sent={sent} still activePieceId={null} inspectTrigger={() => ({})} inspectStampsTrigger={(packetIds) => (asked.add(packetIds.join('|')), lists)} onActivate={() => undefined} />
      </div>,
    );
    const drawn = await stampsDrawn(view, 3);
    expect(drawn.map((button) => button.classList.contains('stamp--more'))).toEqual([false, false, true]);
    await userEvent.click(drawn[2]);
    expect(lists.onClick).toHaveBeenCalledTimes(1);
    expect(asked).toEqual(new Set(['flow|sent-a|sent-b|sent-c']));
  });

  it('a stamp tells a screen reader its packet and how it ended', async () => {
    const runs = [toMarta('arrived'), toMarta('lost', { reached: false, replied: false }), toMarta('blocked', { reached: false, blocked: true })];
    const { stamps } = await mountStage(runs);
    await expect.poll(() => stamps().length).toBe(3);
    expect(stamps().map((button) => button.getAttribute('aria-label'))).toEqual(runs.map(nameOf));
    expect(stamps().map((button) => button.textContent)).toEqual(['✓', '?', '✕']);
  });

  it('the Tab key walks the buttons of the map in its reading order, each piece followed by the stamps beside it', async () => {
    const runs = many(5);
    const { box, layout, fans, stamps } = await mountStage(runs);
    await expect.poll(() => stamps().length).toBe(3);
    const order = readingOrder(layout, fans);
    const identity = ({ kind, id }: (typeof order)[number]) => {
      if (kind === 'piece') return pieceDomId(id);
      if (kind === 'more') return MAP_TEXT.moreStamps(3, 5);
      return nameOf(runs.find((run) => run.id === id) as MapRunFixture);
    };
    const walked: (string | null)[] = [];
    for (let step = 0; step < order.length; step += 1) {
      await userEvent.tab();
      const reached = document.activeElement as HTMLElement;
      expect(box.contains(reached)).toBe(true);
      walked.push(reached.id || reached.getAttribute('aria-label'));
    }
    expect(walked).toEqual(order.map(identity));
    const kinds = order.map(({ kind }) => kind);
    expect(kinds.indexOf('stamp')).toBeGreaterThan(0);
    expect(kinds.lastIndexOf('piece')).toBeGreaterThan(kinds.indexOf('stamp'));
  });

  it('«+N» wears a dot in the colour of danger on its lower right edge when it hides a problem, and the ring stays ink', async () => {
    const { stamps, rerender } = await mountStage(many(4, { reached: false, blocked: true }));
    await expect.poll(() => stamps().length).toBe(3);
    const more = stamps().at(-1) as HTMLElement;
    const dot = more.querySelector('.stamp__dot') as HTMLElement;
    expect(dot).not.toBeNull();
    const [ring, dotBox, style] = [more.getBoundingClientRect(), dot.getBoundingClientRect(), getComputedStyle(dot)];
    expect(style.backgroundColor).toBe(colorOf('--color-danger'));
    expect(style.borderTopColor).toBe(colorOf('--color-surface'));
    expect(getComputedStyle(more).borderTopColor).toBe(colorOf('--color-ink'));
    expect(dotBox.left + dotBox.width / 2).toBeGreaterThan(ring.left + ring.width / 2);
    expect(dotBox.top + dotBox.height / 2).toBeGreaterThan(ring.top + ring.height / 2);
    expect(dotBox.left).toBeGreaterThanOrEqual(ring.left - HALF_A_PIXEL);
    expect(dotBox.right).toBeLessThanOrEqual(ring.right + HALF_A_PIXEL);
    expect(dotBox.bottom).toBeLessThanOrEqual(ring.bottom + HALF_A_PIXEL);
    rerender(stage(many(5)));
    await expect.poll(() => stamps().at(-1)?.getAttribute('aria-label')).toBe(MAP_TEXT.moreStamps(3, 5));
    expect(stamps().at(-1)?.querySelector('.stamp__dot')).toBeNull();
  });

  it('the number of «+N» fits inside its ring with the letter it wears, from +2 to the +99 the plan counts on', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { container } = render(
      <div>
        {[2, 9, 10, 12, 99].map((hidden) => (
          <StampMore key={hidden} hidden={hidden} total={hidden + 2} hidesProblem={hidden === 12} trigger={{}} />
        ))}
      </div>,
    );
    const buttons = [...container.querySelectorAll<HTMLButtonElement>('button.stamp--more')];
    const sizes = buttons.map((button) => getComputedStyle(button).fontSize);
    expect(sizes).toEqual([USUAL_LETTER, USUAL_LETTER, SMALL_LETTER, SMALL_LETTER, SMALL_LETTER].map((size) => `${size}px`));
    for (const button of buttons) {
      const number = button.querySelector('span') as HTMLElement;
      expect(number.offsetWidth, button.textContent ?? '').toBeLessThanOrEqual(button.clientWidth);
      expect(getComputedStyle(button).width).toBe('32px');
    }
  });
});
