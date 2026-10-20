// @vitest-environment jsdom
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MAP_TEXT, stampLabel, stampOf, toPlainText } from '@/copy';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, triggerSpies, type MapRunFixture } from '@/testing/map-pieces';
import { frameOf } from '@/scene/frame';
import { layoutMap } from '@/scene/layout/map-layout';
import { readingOrder, type ReadingEntry } from '@/scene/marks/reading-order';
import { fanStamps, stampsByPlace } from '@/scene/marks/stamp-fan';
import type { InspectTrigger, TriggerProps } from '@/scene/overlay/inspect-trigger';
import { pieceDomId } from '@/scene/overlay/piece-label';
import { MapLabels } from './map-labels';
import { stampButtons, type InspectStampsTrigger } from './map-stamps';

const WORLD = officeTwoFloorsNet();
const PIECES = FLOORS_LABEL_PIECES;
const LAYOUT = layoutMap(WORLD, PIECES, { width: 1000 });
const FRAME = frameOf(1000, LAYOUT.size);
const toMarta = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(device('your-laptop'), OFFICE_FLOORS.floor1.marta), id, extras);
const toLucia = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(device('your-laptop'), OFFICE_FLOORS.floor1.lucia), id, extras);
const many = (count: number, make: (id: string) => MapRunFixture = toMarta, prefix = 'run') => Array.from({ length: count }, (_, index) => make(`${prefix}-${index + 1}`));

function draw(runs: readonly MapRunFixture[]) {
  const fans = fanStamps(stampsByPlace(runs, LAYOUT.drawn), LAYOUT.marks);
  const given = new Map<string, TriggerProps>();
  const givenToLists = new Map<string, TriggerProps>();
  const inspectTrigger: InspectTrigger = (pieceId) => {
    const props = triggerSpies();
    given.set(pieceId, props);
    return props;
  };
  const inspectStampsTrigger: InspectStampsTrigger = (ids) => {
    const props = triggerSpies();
    givenToLists.set(ids.join('|'), props);
    return props;
  };
  const view = render(
    <MapLabels
      pieces={PIECES}
      layout={LAYOUT}
      frame={FRAME}
      inspectTrigger={() => ({})}
      onActivate={() => undefined}
      fans={fans}
      stamp={stampButtons({ fans, runs, frame: FRAME, inspectTrigger, inspectStampsTrigger })}
    />,
  );
  const stamps = [...view.container.querySelectorAll<HTMLButtonElement>('button.stamp')];
  return { ...view, fans, stamps, given, givenToLists };
}

const nameOf = (run: MapRunFixture) => stampLabel(toPlainText(run.label), stampOf(run));

describe('the stamps on the layer of the map', () => {
  it('draws a button for each stamp the fan shows and none for the stamps that went into the «+N», the oldest of the ones given', () => {
    const runs = many(5);
    const { stamps, fans } = draw(runs);
    expect(fans[0].stamps).toHaveLength(2);
    expect(stamps.map((button) => button.getAttribute('aria-label'))).toEqual([nameOf(runs[3]), nameOf(runs[4]), MAP_TEXT.moreStamps(3, 5)]);
    expect(stamps.map((button) => button.classList.contains('stamp--more'))).toEqual([false, false, true]);
    expect(stamps[2]).toHaveTextContent('+3');
  });

  it('puts each stamp at the pixels of its place in the fan, with the frame added', () => {
    const { stamps, fans } = draw(many(5));
    const holders = stamps.map((button) => button.closest<HTMLElement>('.map-stamp') as HTMLElement);
    const points = [...fans[0].stamps.map(({ point }) => point), (fans[0].more as { point: [number, number] }).point];
    expect(holders.map((holder) => [holder.style.left, holder.style.top])).toEqual(points.map(([x, y]) => [`${FRAME.x + x}px`, `${FRAME.y + y}px`]));
  });

  it('tells a screen reader the packet of each stamp and how it ended, from the run itself', () => {
    const runs = [toMarta('arrived'), toMarta('lost', { reached: false, replied: false }), toMarta('blocked', { reached: false, blocked: true })];
    const { stamps } = draw(runs);
    expect(stamps.map((button) => button.getAttribute('aria-label'))).toEqual(runs.map(nameOf));
    expect(stamps.map((button) => button.className)).toEqual(['stamp stamp--arrived', 'stamp stamp--lost', 'stamp stamp--blocked']);
    expect(new Set(stamps.map((button) => button.getAttribute('aria-label'))).size).toBe(3);
  });

  it('gives a stamp the trigger of its packet and «+N» the trigger of its list, which names every stamp of the place', async () => {
    const user = userEvent.setup();
    const runs = many(5);
    const { stamps, given, givenToLists } = draw(runs);
    const [drawn, other] = [runs[3], runs[4]];
    await user.hover(stamps[0]);
    await user.click(stamps[0]);
    expect(given.get(drawn.pieceId)?.onPointerEnter).toHaveBeenCalledTimes(1);
    expect(given.get(drawn.pieceId)?.onClick).toHaveBeenCalledTimes(1);
    expect(given.get(other.pieceId)?.onPointerEnter).not.toHaveBeenCalled();
    const listKey = runs.map(({ id }) => id).join('|');
    expect([...givenToLists.keys()]).toEqual([listKey]);
    await user.hover(stamps[2]);
    await user.click(stamps[2]);
    expect(givenToLists.get(listKey)?.onPointerEnter).toHaveBeenCalledTimes(1);
    expect(givenToLists.get(listKey)?.onClick).toHaveBeenCalledTimes(1);
    expect(given.get(drawn.pieceId)?.onClick).toHaveBeenCalledTimes(1);
  });

  it('wears the dot only on a «+N» that hides a stamp with a problem, and names it with the words of the problem', () => {
    const arrived = draw(many(5));
    expect(arrived.stamps[2].querySelector('.stamp__dot')).toBeNull();
    expect(arrived.stamps[2]).toHaveAccessibleName(MAP_TEXT.moreStamps(3, 5));
    arrived.unmount();
    const blocked = draw(many(4, (id) => toMarta(id, { reached: false, blocked: true })));
    const more = blocked.stamps.at(-1) as HTMLElement;
    expect(blocked.fans[0].more?.hidesProblem).toBe(true);
    expect(more.querySelector('.stamp__dot')).not.toBeNull();
    expect(more).toHaveAccessibleName(MAP_TEXT.moreStampsWithProblem(2, 4));
  });

  it('shows no dot when the problem stamps are all in sight and only stamps that arrived are in the «+N»', () => {
    const runs = [...many(2, (id) => toMarta(id, { reached: false, blocked: true }), 'blocked'), ...many(3, toMarta, 'arrived')];
    const { fans, stamps } = draw(runs);
    expect(fans[0].more?.hidesProblem).toBe(false);
    expect(stamps.filter((button) => button.classList.contains('stamp--blocked'))).toHaveLength(2);
    expect(stamps.every((button) => button.querySelector('.stamp__dot') === null)).toBe(true);
  });

  it('walks the buttons of the map in its reading order: each piece and then the stamps that stand beside it, with «+N» last', () => {
    const runs = [...many(5, toMarta, 'marta'), ...many(2, toLucia, 'lucia')];
    const { container, fans } = draw(runs);
    const buttons = [...container.querySelectorAll<HTMLElement>('button')];
    const moreOf = (id: string) => fans.flatMap(({ more }) => (more?.id === id ? [more] : []))[0];
    const identity = ({ kind, id }: ReadingEntry) => {
      if (kind === 'piece') return pieceDomId(id);
      if (kind === 'more') return MAP_TEXT.moreStamps(moreOf(id).count, moreOf(id).ids.length);
      return nameOf(runs.find((run) => run.id === id) as MapRunFixture);
    };
    expect(buttons.map((button) => button.id || button.getAttribute('aria-label'))).toEqual(readingOrder(LAYOUT, fans).map(identity));
    const kinds = buttons.map((button) => (button.classList.contains('stamp') ? 'stamp' : 'label'));
    expect(kinds.indexOf('stamp')).toBeGreaterThan(0);
    expect(kinds.indexOf('stamp')).toBeLessThan(kinds.lastIndexOf('label'));
  });
});
