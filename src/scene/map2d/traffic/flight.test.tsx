// @vitest-environment jsdom
import { act, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping, tcp } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, mapRunWithPorts, type MapRunFixture } from '@/testing/map-pieces';
import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { fanStamps, stampsByPlace } from '@/scene/map2d/marks/stamp-fan';
import { translationAt, wayOf } from '@/scene/map2d/marks/still-packets';
import { FlightBody } from './flight';
import { FLOW_OFFSET, FLOW_PERIOD, flightPlan, flowCycles, keyframes, labelRide, motionOf, routeOf, sendCycle } from './flight-plan';
import { pathData } from './still-trace';
import { FlightLabels, Traffic, useSendsInTheAir } from './traffic';

const WORLD = officeTwoFloorsNet();
const LAYOUT = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 1280 });
const { floor1, officeRouter, server } = OFFICE_FLOORS;
const YOU = device('your-laptop');
const ANIMATIONS = 'animate, animateMotion, animateTransform';
const SVG = 'http://www.w3.org/2000/svg';

const toLucia = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.lucia), id, extras);
const toTheServer = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, server.ip, 80), id, officeRouter.id, { replied: true });
const toItself = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, floor1.you, 80), id);
const sentAs = (run: MapRunFixture, send: number) => ({ ...run, send });

function Stage({ flows, sent, still }: { flows: readonly MapRunFixture[]; sent: readonly ReturnType<typeof sentAs>[]; still: boolean }) {
  const inTheAir = useSendsInTheAir(sent, LAYOUT, still);
  const fans = fanStamps(stampsByPlace([...flows, ...sent], LAYOUT.drawn), LAYOUT.marks);
  return (
    <div>
      <svg>
        <Traffic flows={flows} sent={sent} inTheAir={inTheAir} layout={LAYOUT} fans={fans} still={still} />
      </svg>
      {!still && (
        <svg className="flight-labels">
          <FlightLabels flows={flows} inTheAir={inTheAir} layout={LAYOUT} />
        </svg>
      )}
    </div>
  );
}

const trafficOf = (flows: readonly MapRunFixture[], sent: readonly ReturnType<typeof sentAs>[], still: boolean) => <Stage flows={flows} sent={sent} still={still} />;

function draw(flows: readonly MapRunFixture[], sent: readonly ReturnType<typeof sentAs>[] = [], still = false): SVGSVGElement {
  return render(trafficOf(flows, sent, still)).container.querySelector('svg') as SVGSVGElement;
}

function planOf(run: MapRunFixture) {
  const way = wayOf(run, LAYOUT, graphOf(LAYOUT));
  const changesAt = translationAt(run, way.path, LAYOUT);
  return { way, changesAt, plan: flightPlan(way.path, way.look.end, 0, changesAt) };
}

const attributesOf = (element: Element, ...names: string[]) => names.map((name) => element.getAttribute(name));
const packetsOf = (svg: ParentNode, id: string) => [...svg.querySelectorAll(`g.map-flight[data-packet="${id}"]`)];
const motionOfPacket = (packet: Element) => packet.querySelector('animateMotion') as Element;
const glyphOf = (packet: Element, role: string) => packet.querySelector(`g.map-packet[data-role="${role}"]`);
const animateOf = (element: Element | null) => element?.parentElement?.querySelector(':scope > animate') as Element;
const labelSvgOf = (svg: Element) => svg.parentElement?.querySelector('svg.flight-labels') ?? null;
const labelsOf = (svg: Element) => [...(labelSvgOf(svg)?.querySelectorAll('.map-flight-tags g.packet-tag') ?? [])];

describe('SMIL in React', () => {
  it('React passes the attributes of an animateMotion to the DOM as they are', () => {
    const view = render(
      <svg>
        <g>
          <animateMotion path="M 0 0 L 100 0" dur="2s" begin="1.5s" calcMode="linear" keyPoints="0;1;1" keyTimes="0;0.8;1" repeatCount="indefinite" />
        </g>
      </svg>,
    );
    const motion = view.container.querySelector('animateMotion') as Element;
    expect(motion.namespaceURI).toBe(SVG);
    expect(attributesOf(motion, 'path', 'dur', 'begin', 'calcMode', 'keyPoints', 'keyTimes', 'repeatCount')).toEqual(['M 0 0 L 100 0', '2s', '1.5s', 'linear', '0;1;1', '0;0.8;1', 'indefinite']);
  });
});

describe('Traffic', () => {
  it('without animations nothing is animated', () => {
    const runs = [toLucia('answered'), toTheServer('nat'), toLucia('blocked', { replied: false, reached: false, blocked: true }), toLucia('lost', { replied: false, reached: false })];
    const svg = draw(runs, [sentAs(toLucia('sent'), 1)], true);
    expect(svg.parentElement?.querySelectorAll(ANIMATIONS)).toHaveLength(0);
    expect(labelSvgOf(svg)).toBeNull();
    expect(svg.querySelectorAll('g.map-trace')).toHaveLength(5);
    expect(svg.querySelector('g.map-flight')).toBeNull();
    expect(svg.querySelector('g.map-flights')).toBeNull();
    const flying = draw(runs, [], false);
    expect(flying.querySelectorAll(ANIMATIONS).length).toBeGreaterThan(0);
    expect(labelSvgOf(flying)).not.toBeNull();
    expect(flying.querySelector('g.map-trace')).toBeNull();
    expect(flying.querySelector('g.map-traffic')).toBeNull();
  });

  it('a live flow is a group that an animateMotion carries along the route of its packet, with the shape going and the ring coming back', () => {
    const run = toLucia('answered');
    const svg = draw([run]);
    const { way, plan } = planOf(run);
    const [cycle] = flowCycles(plan, 0);
    const [packet] = packetsOf(svg, 'answered');
    const motion = motionOfPacket(packet);
    const { keyTimes, keyPoints } = motionOf(plan, cycle.period);
    expect(plan.end).toBe('replied');
    expect(attributesOf(motion, 'path', 'calcMode', 'keyPoints', 'keyTimes', 'begin', 'dur', 'repeatCount')).toEqual([pathData(routeOf(way.path, plan.end)), 'linear', keyPoints.join(';'), keyTimes.join(';'), '0s', `${cycle.period}s`, 'indefinite']);
    expect(glyphOf(packet, 'going')?.getAttribute('data-shape')).toBe('echo-request');
    expect(glyphOf(packet, 'answer')?.getAttribute('data-shape')).toBe('echo-reply');
    expect(glyphOf(packet, 'appears')).toBeNull();
    expect(attributesOf(animateOf(glyphOf(packet, 'going')), 'attributeName', 'calcMode', 'values', 'keyTimes')).toEqual(['opacity', 'discrete', '1;0;0', `0;${plan.turn / cycle.period};1`]);
    expect(attributesOf(animateOf(glyphOf(packet, 'answer')), 'values', 'keyTimes')).toEqual(['0;1;0;0', `0;${plan.turn / cycle.period};${plan.travel / cycle.period};1`]);
    expect(glyphOf(packet, 'going')?.parentElement?.getAttribute('opacity')).toBe('0');
    expect(packet.querySelectorAll('g.map-flight__body')).toHaveLength(1);
  });

  it('flows leave 1.1 seconds after the one before them, and a trip longer than the period draws a copy for every period it lasts', () => {
    const [near, far] = [toLucia('near'), toTheServer('far')];
    const svg = draw([near, far]);
    const [nearPlan, farPlan] = [planOf(near).plan, planOf(far).plan];
    expect(flowCycles(farPlan, 1).length).toBeGreaterThan(1);
    expect(packetsOf(svg, 'near')).toHaveLength(flowCycles(nearPlan, 0).length);
    const copies = packetsOf(svg, 'far');
    const expected = flowCycles(farPlan, 1);
    expect(copies).toHaveLength(expected.length);
    expect(copies.map((copy) => attributesOf(motionOfPacket(copy), 'begin', 'dur', 'repeatCount'))).toEqual(expected.map(({ begin, period }) => [`${begin}s`, `${period}s`, 'indefinite']));
    expect(expected[1].begin - expected[0].begin).toBeCloseTo(FLOW_PERIOD, 9);
    expect(expected[0].begin).toBe(FLOW_OFFSET);
  });

  it('a send is a group that begins when it is mounted and that a new send number mounts again', () => {
    const first = toLucia('first');
    const view = render(trafficOf([], [sentAs(first, 1)], false));
    const [packet] = packetsOf(view.container, 'first');
    expect(attributesOf(motionOfPacket(packet), 'begin', 'repeatCount')).toEqual(['indefinite', '1']);
    view.rerender(trafficOf([], [sentAs(first, 1)], false));
    expect(packetsOf(view.container, 'first')).toEqual([packet]);
    view.rerender(trafficOf([], [sentAs(first, 2)], false));
    const [earlier, later] = packetsOf(view.container, 'first');
    expect(earlier).toBe(packet);
    expect(later).not.toBe(packet);
    expect(attributesOf(motionOfPacket(later), 'begin', 'repeatCount')).toEqual(['indefinite', '1']);
    view.rerender(trafficOf([], [sentAs(first, 3)], false));
    expect(packetsOf(view.container, 'first')).toHaveLength(3);
  });

  it('a combination that leaves the sent list takes its flights with it, and the others stay', () => {
    const [first, second] = [toLucia('first'), toLucia('second')];
    const view = render(trafficOf([], [sentAs(first, 1), sentAs(second, 2)], false));
    view.rerender(trafficOf([], [sentAs(first, 3), sentAs(second, 2)], false));
    expect(packetsOf(view.container, 'first')).toHaveLength(2);
    view.rerender(trafficOf([], [sentAs(second, 2)], false));
    expect(packetsOf(view.container, 'first')).toHaveLength(0);
    expect(packetsOf(view.container, 'second')).toHaveLength(1);
    view.rerender(trafficOf([], [], false));
    expect(view.container.querySelectorAll('g.map-flight')).toHaveLength(0);
  });

  it('a new send joins the flights in the air without moving or mounting again any of them', () => {
    const [first, second] = [toLucia('first'), toLucia('second')];
    const view = render(trafficOf([], [sentAs(first, 1), sentAs(second, 2)], false));
    const flights = view.container.querySelector('g.map-flights') as Element;
    const before = [...flights.children];
    const watcher = new MutationObserver(() => undefined);
    watcher.observe(flights, { childList: true });
    view.rerender(trafficOf([], [sentAs(first, 3), sentAs(second, 2)], false));
    const records = watcher.takeRecords();
    watcher.disconnect();
    expect(records.flatMap(({ removedNodes }) => [...removedNodes])).toEqual([]);
    expect(records.flatMap(({ addedNodes }) => [...addedNodes])).toHaveLength(1);
    expect(before.every((flight) => flight.isConnected)).toBe(true);
    expect(flights.children).toHaveLength(3);
  });

  it('a translated packet wears a label for each leg and direction, each shown while the packet is in that leg, and beside the packet', () => {
    const run = toTheServer('nat');
    const svg = draw([], [sentAs(run, 1)]);
    const { way, plan } = planOf(run);
    const labels = labelsOf(svg);
    expect(labels.map((label) => label.textContent)).toEqual(['TCP 51514 → 80', 'TCP 40001 → 80', 'TCP 80 → 40001', 'TCP 80 → 51514']);
    const { period } = sendCycle(plan);
    plan.labels.forEach((window, index) => {
      const { keyTimes, values } = keyframes(period, [[0, 0], [window.from, 1], [window.to, 0]]);
      expect(attributesOf(animateOf(labels[index]), 'keyTimes', 'values')).toEqual([keyTimes.join(';'), values.join(';')]);
    });
    const tags = (labelSvgOf(svg) as Element).querySelector('.map-flight-tag') as Element;
    const ride = labelRide(routeOf(way.path, plan.end), { width: Math.max(...labels.map((label) => Number(label.querySelector('rect')?.getAttribute('width')))), height: 20 }, LAYOUT.size, period);
    expect(attributesOf(motionOfPacket(tags), 'path', 'keyTimes', 'keyPoints', 'begin')).toEqual([pathData(ride.centers), ride.keyTimes.join(';'), ride.keyPoints.join(';'), 'indefinite']);
    expect(labels[0].closest('.map-flight-tags')).not.toBeNull();
    expect(svg.querySelector('.map-flight-tags')).toBeNull();
    expect(svg.querySelector('.packet-tag')).toBeNull();
    expect(svg.compareDocumentPosition(labelSvgOf(svg) as Element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a packet with no ports wears no label, and neither does the packet whose warning its own device generates', () => {
    const svg = draw([toLucia('ping'), toItself('itself')], [sentAs(toItself('self'), 1)]);
    expect(labelSvgOf(svg)?.querySelector('.map-flight-tag[data-packet="ping"]')).toBeNull();
    expect(labelSvgOf(svg)?.querySelector('.map-flight-tag[data-packet="self"]')).not.toBeNull();
    expect(labelsOf(svg).map((label) => label.getAttribute('data-packet'))).not.toContain('ping');
    const selfWarned = mapRunWithPorts(WORLD, tcp(YOU, floor1.you, 80), 'warned-by-itself', undefined, { replied: false, warning: { term: 'time-exceeded', by: 'sender' } });
    expect(planOf(selfWarned).plan.end).toBe('self-warned');
    const alone = draw([], [sentAs(selfWarned, 1)]);
    expect(labelsOf(alone)).toHaveLength(0);
  });

  it('a blocked packet bursts with a ring that grows, a lost one shrinks, and a warning of its own device appears at the end of the path', () => {
    const blocked = toLucia('blocked', { replied: false, reached: false, blocked: true });
    const lost = toLucia('lost', { replied: false, reached: false });
    const warned = toLucia('self', { replied: false, warning: { term: 'time-exceeded', by: 'sender' } });
    const svg = draw([], [sentAs(blocked, 1), sentAs(lost, 2), sentAs(warned, 3)]);
    const [blockedPacket] = packetsOf(svg, 'blocked');
    const blockedPlan = planOf(blocked).plan;
    const ring = blockedPacket.querySelector('circle.map-burst') as Element;
    expect(ring).not.toBeNull();
    const burstScale = ring.parentElement?.querySelector('animateTransform') as Element;
    expect(attributesOf(burstScale, 'type', 'attributeName')).toEqual(['scale', 'transform']);
    expect(burstScale.getAttribute('values')?.split(';').map(Number)).toEqual([1, 1, 2.5]);
    expect(animateOf(ring).getAttribute('values')).toBe('0;1;0');
    expect(blockedPlan.ending?.kind).toBe('burst');
    const [lostPacket] = packetsOf(svg, 'lost');
    const shrink = glyphOf(lostPacket, 'going')?.parentElement?.querySelector('animateTransform') as Element;
    expect(shrink.getAttribute('values')?.split(';').map(Number)).toEqual([1, 1, 0]);
    expect(lostPacket.querySelector('circle.map-burst')).toBeNull();
    const [selfPacket] = packetsOf(svg, 'self');
    expect(glyphOf(selfPacket, 'going')).toBeNull();
    expect(glyphOf(selfPacket, 'appears')?.getAttribute('data-shape')).toBe('warning');
    expect(attributesOf(motionOfPacket(selfPacket), 'keyPoints', 'keyTimes')).toEqual(['1;1', '0;1']);
  });

  it('draws no packet that starts at a piece the map does not draw', () => {
    const fromThePrinter = mapRun(WORLD, ping(device('printer'), floor1.lucia), 'from-the-printer');
    const svg = draw([fromThePrinter, toLucia('drawn')]);
    expect(packetsOf(svg, 'from-the-printer')).toHaveLength(0);
    expect(packetsOf(svg, 'drawn').length).toBeGreaterThan(0);
  });
});

describe('Traffic in a browser that animates by hand', () => {
  const begins = vi.fn();
  const ends = vi.fn();

  beforeAll(() => {
    Object.assign(Element.prototype, { beginElementAt: begins, endElement: ends });
  });

  afterAll(() => {
    Reflect.deleteProperty(Element.prototype, 'beginElementAt');
    Reflect.deleteProperty(Element.prototype, 'endElement');
  });

  beforeEach(() => {
    begins.mockClear();
    ends.mockClear();
  });

  it('a send begins its animations once its wait has gone by, and ends them when it goes', () => {
    const run = toLucia('asked');
    const { way, changesAt } = planOf(run);
    const waiting = flightPlan(way.path, way.look.end, 2.5, changesAt);
    const view = render(
      <svg>
        <FlightBody flying={{ way, changesAt }} plan={waiting} cycle={sendCycle(waiting)} />
      </svg>,
    );
    const animations = view.container.querySelectorAll(ANIMATIONS).length;
    expect(animations).toBeGreaterThan(2);
    expect(begins).toHaveBeenCalledTimes(animations);
    expect(begins.mock.calls.every(([wait]) => wait === 2.5)).toBe(true);
    expect(ends).not.toHaveBeenCalled();
    view.unmount();
    expect(ends).toHaveBeenCalledTimes(animations);
  });

  it('a send that is rendered again, with the same props or with a fresh equal array of sends, does not begin again', () => {
    const run = toTheServer('flying');
    const view = render(trafficOf([], [sentAs(run, 1)], false));
    const animations = view.container.querySelectorAll(ANIMATIONS).length;
    expect(begins).toHaveBeenCalledTimes(animations);
    view.rerender(trafficOf([], [sentAs(run, 1)], false));
    view.rerender(trafficOf([toLucia('flow')], [sentAs({ ...run }, 1)], false));
    expect(begins).toHaveBeenCalledTimes(animations);
    expect(ends).not.toHaveBeenCalled();
  });

  it('a flow begins nothing by hand, and a send mounted under StrictMode begins as many times as the mount is run', () => {
    const view = render(<StrictMode>{trafficOf([toLucia('flow')], [sentAs(toLucia('sent'), 1)], false)}</StrictMode>);
    const animationsOfSend = packetsOf(view.container, 'sent')[0].querySelectorAll(ANIMATIONS).length;
    expect(begins).toHaveBeenCalledTimes(2 * animationsOfSend);
    expect(ends).toHaveBeenCalledTimes(animationsOfSend);
  });
});

describe('the sends of one combination, sent again while the first still flies', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const labelsOfTheSend = (container: ParentNode) => container.querySelectorAll('svg.flight-labels g.map-flight-tag[data-packet="nat"]');
  const packetsOfTheSend = (container: ParentNode) => container.querySelectorAll('g.map-flight[data-packet="nat"]');
  const pass = (milliseconds: number) => act(() => vi.advanceTimersByTime(milliseconds));

  it('each send flies until its own trip ends, with its label beside it, and the last one stays once its trip is over', () => {
    const run = toTheServer('nat');
    const trip = Math.ceil(planOf(run).plan.duration * 1000);
    const view = render(trafficOf([], [sentAs(run, 1)], false));
    const [first] = packetsOfTheSend(view.container);
    pass(trip / 2);
    view.rerender(trafficOf([], [sentAs(run, 2)], false));
    const [, second] = packetsOfTheSend(view.container);
    expect([packetsOfTheSend(view.container).length, labelsOfTheSend(view.container).length]).toEqual([2, 2]);
    pass(trip / 2 + 1);
    expect([...packetsOfTheSend(view.container)]).toEqual([second]);
    expect(labelsOfTheSend(view.container)).toHaveLength(1);
    expect(second).not.toBe(first);
    pass(trip);
    expect([...packetsOfTheSend(view.container)]).toEqual([second]);
  });

  it('three sends of the same ping in a row are three packets in the air at once, and each goes in its own time', () => {
    const run = toLucia('ping');
    const trip = Math.ceil(planOf(run).plan.duration * 1000);
    const view = render(trafficOf([], [sentAs(run, 1)], false));
    pass(trip / 4);
    view.rerender(trafficOf([], [sentAs(run, 2)], false));
    pass(trip / 4);
    view.rerender(trafficOf([], [sentAs(run, 3)], false));
    expect(packetsOf(view.container, 'ping')).toHaveLength(3);
    pass(trip / 2 + 1);
    expect(packetsOf(view.container, 'ping')).toHaveLength(2);
    pass(trip / 4);
    expect(packetsOf(view.container, 'ping')).toHaveLength(1);
  });

  it('an earlier send stays the same group while the list is drawn again', () => {
    const run = toTheServer('nat');
    const view = render(trafficOf([], [sentAs(run, 1)], false));
    const [first] = packetsOfTheSend(view.container);
    view.rerender(trafficOf([], [sentAs(run, 2)], false));
    view.rerender(trafficOf([], [sentAs(run, 2)], false));
    expect(packetsOfTheSend(view.container)).toHaveLength(2);
    expect(packetsOfTheSend(view.container)[0]).toBe(first);
  });
});
