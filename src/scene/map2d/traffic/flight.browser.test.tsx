import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping, tcp } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, mapRunWithPorts, type MapRunFixture } from '@/testing/map-pieces';
import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import { lengthOf, positionAt, type Point } from '@/scene/map2d/layout/graph';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { station } from '@/scene/map2d/layout/stations';
import { changeDistance } from '@/scene/map2d/marks/packet-tags';
import { fanStamps, stampsByPlace } from '@/scene/map2d/marks/stamp-fan';
import { wayOf } from '@/scene/map2d/marks/still-packets';
import { distanceAt, flightPlan, routeOf } from './flight-plan';
import { Traffic } from './traffic';

const WORLD = officeTwoFloorsNet();
const LAYOUT = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 1280 });
const NARROW_LAYOUT = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 360 });
const { floor1, officeRouter, server } = OFFICE_FLOORS;
const YOU = device('your-laptop');
const HALF_A_PIXEL = 0.5;
const NEAR_THE_ROUTER = 8;
const FIRST_LEG = 'TCP 51514 → 80';
const SECOND_LEG = 'TCP 40001 → 80';
const FIRST_REPLY = 'TCP 80 → 51514';
const SECOND_REPLY = 'TCP 80 → 40001';
const FRAME = 0.05;

const toLucia = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.lucia), id, extras);
const toTheServer = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, server.ip, 80), id, officeRouter.id, { replied: true });
const sentAs = (run: MapRunFixture, send: number) => ({ ...run, send });

function trafficOf(flows: readonly MapRunFixture[], sent: readonly ReturnType<typeof sentAs>[], layout = LAYOUT) {
  const fans = fanStamps(stampsByPlace([...flows, ...sent], layout.drawn), layout.marks);
  return (
    <svg width={layout.size.width} height={layout.size.height} viewBox={`0 0 ${layout.size.width} ${layout.size.height}`}>
      <Traffic flows={flows} sent={sent} layout={layout} fans={fans} still={false} />
    </svg>
  );
}

function fly(flows: readonly MapRunFixture[], sent: readonly ReturnType<typeof sentAs>[], layout = LAYOUT): SVGSVGElement {
  const view = render(trafficOf(flows, sent, layout));
  return view.container.querySelector('svg') as SVGSVGElement;
}

function planOf(run: MapRunFixture, layout = LAYOUT) {
  const way = wayOf(run, layout, graphOf(layout));
  const router = run.ports?.changesAt === undefined ? undefined : layout.stations[station.router(run.ports.changesAt)];
  const changesAt = changeDistance(way.path, router);
  return { way, changesAt, plan: flightPlan(way.path, way.look.end, 0, changesAt), route: routeOf(way.path, way.look.end) };
}

const at = (route: readonly Point[], distance: number): Point => positionAt(route, lengthOf(route), distance);
const packetOf = (svg: SVGSVGElement, id: string) => svg.querySelector(`g.map-flight[data-packet="${id}"]`) as SVGGElement;
const startOf = (packet: Element) => {
  const motion = packet.querySelector('animateMotion') as SVGAnimationElement;
  const begin = motion.getAttribute('begin') as string;
  return begin === 'indefinite' ? motion.getStartTime() : parseFloat(begin);
};
const glyphOf = (packet: Element, role: string) => packet.querySelector(`g.map-packet[data-role="${role}"]`) as SVGGElement;
const opacityOf = (element: Element | null) => (element === null ? 0 : Number(getComputedStyle(element).opacity));
const shown = (glyph: Element) => opacityOf(glyph.parentElement) === 1;

function centerOf(svg: SVGSVGElement, element: Element): Point {
  const [box, origin] = [element.getBoundingClientRect(), svg.getBoundingClientRect()];
  return [box.x + box.width / 2 - origin.x, box.y + box.height / 2 - origin.y];
}

const shapeCenter = (svg: SVGSVGElement, glyph: Element) => centerOf(svg, glyph.querySelector('svg') as Element);
const distanceBetween = ([x, y]: Point, [otherX, otherY]: Point) => Math.hypot(x - otherX, y - otherY);

function visibleLabels(svg: SVGSVGElement, id: string): string[] {
  return [...svg.querySelectorAll(`.map-flight-tags g.packet-tag[data-packet="${id}"]`)].filter((label) => opacityOf(label.parentElement) === 1).map((label) => label.textContent ?? '');
}

describe('the packets in flight, in a browser', () => {
  it('at an exact instant the packet is where the plan says, to half a pixel', () => {
    const [flow, other, send] = [toLucia('flow'), toLucia('other'), toTheServer('send')];
    const svg = fly([flow, other], [sentAs(send, 1)]);
    svg.pauseAnimations();
    for (const run of [flow, send]) {
      const { plan, route } = planOf(run);
      const packet = packetOf(svg, run.id);
      for (const seconds of [0.3, plan.turn / 2, plan.turn - FRAME, plan.turn + FRAME, plan.turn + (plan.travel - plan.turn) / 2, plan.travel - FRAME]) {
        svg.setCurrentTime(startOf(packet) + seconds);
        const [going, answer] = [glyphOf(packet, 'going'), glyphOf(packet, 'answer')];
        const [visible, hidden] = seconds < plan.turn ? [going, answer] : [answer, going];
        expect(shown(visible), `${run.id} at ${seconds}`).toBe(true);
        expect(shown(hidden), `${run.id} at ${seconds}`).toBe(false);
        const [x, y] = shapeCenter(svg, visible);
        const [expectedX, expectedY] = at(route, distanceAt(plan, seconds));
        expect(Math.abs(x - expectedX), `${run.id} x at ${seconds}`).toBeLessThanOrEqual(HALF_A_PIXEL);
        expect(Math.abs(y - expectedY), `${run.id} y at ${seconds}`).toBeLessThanOrEqual(HALF_A_PIXEL);
      }
      svg.setCurrentTime(startOf(packet) + planOf(run).plan.duration + FRAME);
      expect(shown(glyphOf(packet, 'going')) || shown(glyphOf(packet, 'answer'))).toBe(false);
    }
  });

  it('a flow leaves 1.1 seconds after the flow before it and sends again every period', () => {
    const [first, second] = [toLucia('first'), toLucia('second')];
    const svg = fly([first, second], []);
    svg.pauseAnimations();
    const [firstPlan, secondPlan] = [planOf(first), planOf(second)];
    const shapesOf = (id: string) => [...svg.querySelectorAll(`g.map-flight[data-packet="${id}"]`)].flatMap((copy) => ['going', 'answer'].map((role) => glyphOf(copy, role)).filter(shown)).map((glyph) => shapeCenter(svg, glyph));
    const expectedAt = ({ plan, route }: ReturnType<typeof planOf>, seconds: number) => at(route, distanceAt(plan, seconds));
    svg.setCurrentTime(0.6);
    expect(shapesOf('first')).toHaveLength(1);
    expect(shapesOf('second')).toHaveLength(0);
    svg.setCurrentTime(1.1 + 0.4);
    expect(shapesOf('second')).toHaveLength(1);
    expect(distanceBetween(shapesOf('second')[0], expectedAt(secondPlan, 0.4))).toBeLessThanOrEqual(HALF_A_PIXEL);
    svg.setCurrentTime(3.5 + 0.4);
    expect(shapesOf('first').some((center) => distanceBetween(center, expectedAt(firstPlan, 0.4)) <= HALF_A_PIXEL)).toBe(true);
    svg.setCurrentTime(3.5 + 1.1 + 0.4);
    expect(shapesOf('second').some((center) => distanceBetween(center, expectedAt(secondPlan, 0.4)) <= HALF_A_PIXEL)).toBe(true);
  });

  it('a send that mounts after the clock has moved on starts from zero, and it starts once under StrictMode too', () => {
    const [first, second] = [toTheServer('first'), toTheServer('second')];
    const view = render(<StrictMode>{trafficOf([], [sentAs(first, 1)])}</StrictMode>);
    const svg = view.container.querySelector('svg') as SVGSVGElement;
    svg.pauseAnimations();
    svg.setCurrentTime(10);
    view.rerender(<StrictMode>{trafficOf([], [sentAs(second, 2)])}</StrictMode>);
    const { plan, route } = planOf(second);
    const packet = packetOf(svg, 'second');
    expect(startOf(packet)).toBeCloseTo(10, 6);
    svg.setCurrentTime(10 + 1);
    const [x, y] = shapeCenter(svg, glyphOf(packet, 'going'));
    const [expectedX, expectedY] = at(route, distanceAt(plan, 1));
    expect(Math.abs(x - expectedX)).toBeLessThanOrEqual(HALF_A_PIXEL);
    expect(Math.abs(y - expectedY)).toBeLessThanOrEqual(HALF_A_PIXEL);
    svg.setCurrentTime(10 + plan.duration + FRAME);
    expect(shown(glyphOf(packet, 'going')) || shown(glyphOf(packet, 'answer'))).toBe(false);
  });

  it('a blocked packet bursts at the end of its path, a lost one shrinks away there and the warning of its own device appears there, each for half a second', () => {
    const blocked = toLucia('blocked', { replied: false, reached: false, blocked: true });
    const lost = toLucia('lost', { replied: false, reached: false });
    const selfWarned = toLucia('self', { replied: false, warning: { term: 'time-exceeded', by: 'sender' } });
    const svg = fly([], [sentAs(blocked, 1), sentAs(lost, 2), sentAs(selfWarned, 3)]);
    svg.pauseAnimations();
    const [blockedPlan, lostPlan, selfPlan] = [planOf(blocked), planOf(lost), planOf(selfWarned)];
    const starts = Object.fromEntries(['blocked', 'lost', 'self'].map((id) => [id, startOf(packetOf(svg, id))]));
    const ring = packetOf(svg, 'blocked').querySelector('circle.map-burst') as SVGCircleElement;
    const going = glyphOf(packetOf(svg, 'lost'), 'going');
    const appears = glyphOf(packetOf(svg, 'self'), 'appears');
    const widthOf = (element: Element, id: string, { plan }: ReturnType<typeof planOf>, seconds: number) => {
      svg.setCurrentTime(starts[id] + plan.travel + seconds);
      return element.getBoundingClientRect().width;
    };
    const closeTo = (...widths: number[]) => widths.map((width) => expect.closeTo(width, 0));
    expect(opacityOf(ring.parentElement)).toBe(0);
    expect([0.05, 0.25, 0.45].map((seconds) => widthOf(ring, 'blocked', blockedPlan, seconds))).toEqual(closeTo(20 * 1.15, 20 * 1.75, 20 * 2.35));
    expect(opacityOf(ring.parentElement)).toBe(1);
    expect(distanceBetween(centerOf(svg, ring), blockedPlan.way.path.at(-1) as Point)).toBeLessThanOrEqual(HALF_A_PIXEL);
    expect(shown(glyphOf(packetOf(svg, 'blocked'), 'going'))).toBe(false);
    svg.setCurrentTime(starts.blocked + blockedPlan.plan.duration + FRAME);
    expect(opacityOf(ring.parentElement)).toBe(0);
    const shape = going.querySelector('svg') as Element;
    const whole = widthOf(shape, 'lost', lostPlan, -FRAME);
    expect(whole).toBeGreaterThan(10);
    expect([0.05, 0.25, 0.45].map((seconds) => widthOf(shape, 'lost', lostPlan, seconds))).toEqual(closeTo(whole * 0.9, whole * 0.5, whole * 0.1));
    expect(shown(going)).toBe(true);
    expect(distanceBetween(shapeCenter(svg, going), lostPlan.way.path.at(-1) as Point)).toBeLessThanOrEqual(HALF_A_PIXEL);
    svg.setCurrentTime(starts.lost + lostPlan.plan.duration + FRAME);
    expect(shown(going)).toBe(false);
    svg.setCurrentTime(starts.self + 0.1);
    expect(shown(appears)).toBe(true);
    expect(distanceBetween(shapeCenter(svg, appears), selfPlan.way.path.at(-1) as Point)).toBeLessThanOrEqual(HALF_A_PIXEL);
    svg.setCurrentTime(starts.self + selfPlan.plan.duration + FRAME);
    expect(shown(appears)).toBe(false);
  });

  it('the label of a translated packet changes at the router', () => {
    const run = toTheServer('nat');
    const svg = fly([], [sentAs(run, 1)]);
    svg.pauseAnimations();
    const { plan, route, changesAt } = planOf(run);
    const router = LAYOUT.stations[station.router(officeRouter.id)];
    const packet = packetOf(svg, 'nat');
    const start = startOf(packet);
    const passing = (changesAt as number) / 120;
    const coming = plan.turn + (plan.length - (changesAt as number)) / 120;
    const stand = (seconds: number) => {
      svg.setCurrentTime(start + seconds);
      return { labels: visibleLabels(svg, 'nat'), apart: distanceBetween(shapeCenter(svg, glyphOf(packet, seconds < plan.turn ? 'going' : 'answer')), router) };
    };
    expect(stand(passing - FRAME).labels).toEqual([FIRST_LEG]);
    expect(stand(passing + FRAME).labels).toEqual([SECOND_LEG]);
    expect(stand(passing - FRAME).apart).toBeLessThanOrEqual(NEAR_THE_ROUTER);
    expect(stand(passing + FRAME).apart).toBeLessThanOrEqual(NEAR_THE_ROUTER);
    expect(stand(coming - FRAME).labels).toEqual([SECOND_REPLY]);
    expect(stand(coming + FRAME).labels).toEqual([FIRST_REPLY]);
    expect(stand(coming - FRAME).apart).toBeLessThanOrEqual(NEAR_THE_ROUTER);
    expect(stand(coming + FRAME).apart).toBeLessThanOrEqual(NEAR_THE_ROUTER);
    expect(at(route, distanceAt(plan, passing))).toEqual(router);
    svg.setCurrentTime(start + plan.travel + FRAME);
    expect(visibleLabels(svg, 'nat')).toEqual([]);
  });

  it('the label of a packet flies above its shape and inside the drawing wherever the path runs', () => {
    const run = toTheServer('nat');
    const svg = fly([], [sentAs(run, 1)], NARROW_LAYOUT);
    svg.pauseAnimations();
    const { plan } = planOf(run, NARROW_LAYOUT);
    const packet = packetOf(svg, 'nat');
    const frame = svg.getBoundingClientRect();
    const samples = Array.from({ length: 41 }, (_, index) => (plan.turn * index) / 41);
    for (const seconds of samples) {
      svg.setCurrentTime(startOf(packet) + seconds);
      const labels = [...svg.querySelectorAll('.map-flight-tags g.packet-tag')].filter((label) => opacityOf(label.parentElement) === 1);
      expect(labels, `${seconds}`).toHaveLength(1);
      const box = (labels[0].querySelector('rect') as Element).getBoundingClientRect();
      expect(box.left, `${seconds}`).toBeGreaterThanOrEqual(frame.left - HALF_A_PIXEL);
      expect(box.right, `${seconds}`).toBeLessThanOrEqual(frame.right + HALF_A_PIXEL);
      expect(box.top, `${seconds}`).toBeGreaterThanOrEqual(frame.top - HALF_A_PIXEL);
      expect(box.bottom, `${seconds}`).toBeLessThanOrEqual(frame.bottom + HALF_A_PIXEL);
    }
  });
});
