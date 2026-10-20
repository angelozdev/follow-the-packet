import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { OFFICE_IP, holdTheClock, openTerminal, passTime, releaseTheGrace, sendMessage, sendTo, showTheScreen, standStill } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INCIDENT = '01-03';
const NAMES_INCIDENT = '02-10';
const PING = 'ping';
const QUESTION_FLIGHT = 'sent-you-name-www-ping-question';
const PING_FLIGHT = 'sent-you-name-www-ping';
const QUESTION_STAMP = /^Paquete: UDP 51514 → 53 de tu-laptop a servidor-dns/;
const PING_STAMP = /^Paquete: ping de tu-laptop a servidor-internet/;
const MAP_STAGE = 'svg.map-stage__svg';
const PACKET_SHAPES = ['going', 'answer'];
const A_FRAME_SECONDS = 0.05;
const FLIGHT = 'g.map-flight';
const TRIP_CLOCK = `${FLIGHT} animateMotion`;
const ANY_PACKET = /^Paquete:/;
const SENDS = 3;
const MS_PER_SECOND = 1000;
const BETWEEN_SENDS_MS = 1000;

function flightsInTheAir(): number {
  return document.querySelectorAll(FLIGHT).length;
}

function tripSeconds(): number {
  const clock = document.querySelector(TRIP_CLOCK)?.getAttribute('dur');
  if (clock === null || clock === undefined) throw new Error('no packet is in the air');
  return Number.parseFloat(clock);
}

function flightOf(id: string): SVGGElement {
  return document.querySelector(`${FLIGHT}[data-packet="${id}"]`) as SVGGElement;
}

function startOf(flight: Element): number {
  return (flight.querySelector('animateMotion') as SVGAnimationElement).getStartTime();
}

function isShown(flight: Element, shape: string): boolean {
  const glyph = flight.querySelector(`g.map-packet[data-role="${shape}"]`) as Element;
  return Number(getComputedStyle(glyph.parentElement as Element).opacity) === 1;
}

function isInTheAir(flight: Element): boolean {
  return PACKET_SHAPES.some((shape) => isShown(flight, shape));
}

afterEach(() => {
  releaseTheGrace();
});

describe('the sends of one combination on the screen of 01-03', () => {
  it('in 03 the same ping sent three times is one stamp and, on the 2D map, three packets in the air at once, and the first two go when their own trips end', async () => {
    holdTheClock();
    await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={() => undefined} />);
    const terminal = await openTerminal();
    await standStill();

    for (let send = 1; send <= SENDS; send += 1) {
      await sendTo(terminal, OFFICE_IP.printer);
      await expect.poll(flightsInTheAir, { message: `after send ${send}` }).toBe(send);
      await passTime(BETWEEN_SENDS_MS);
    }
    await expect.element(page.getByRole('button', { name: ANY_PACKET })).toBeVisible();
    expect(page.getByRole('button', { name: ANY_PACKET }).elements(), 'the three sends are one stamp').toHaveLength(1);
    const trip = tripSeconds() * MS_PER_SECOND;
    expect(trip, 'the trip outlasts the three sends, so they are in the air together').toBeGreaterThan(SENDS * BETWEEN_SENDS_MS);

    await passTime(trip - SENDS * BETWEEN_SENDS_MS - BETWEEN_SENDS_MS / 2);
    expect(flightsInTheAir(), 'just before the first trip ends, the three are still in the air').toBe(SENDS);
    await passTime(BETWEEN_SENDS_MS);
    await expect.poll(flightsInTheAir, { message: 'the first goes when its own trip ends' }).toBe(SENDS - 1);
    await passTime(BETWEEN_SENDS_MS);
    await expect.poll(flightsInTheAir, { message: 'the second goes when its own trip ends' }).toBe(SENDS - 2);
    await passTime(trip);
    expect(flightsInTheAir(), 'the last send stays in the list once its trip ends, finished and invisible').toBe(1);
    expect(page.getByRole('button', { name: ANY_PACKET }).elements(), 'and the stamp stays').toHaveLength(1);
  });
});

describe('the send by name on the screen of 02-10', () => {
  it('in 02-10 a ping by name draws the question first and the ping after it, each with its stamp', async () => {
    holdTheClock();
    await showTheScreen(<IncidentScreen incidents={INCIDENTS} incidentId={NAMES_INCIDENT} nextId={null} onFinish={() => undefined} />);
    const terminal = await openTerminal();
    await standStill();

    await sendMessage(terminal, PING);
    await expect.poll(flightsInTheAir).toBe(2);
    expect([...document.querySelectorAll(FLIGHT)].map((flight) => flight.getAttribute('data-packet')), 'the question is drawn before the ping').toEqual([QUESTION_FLIGHT, PING_FLIGHT]);
    await expect.element(page.getByRole('button', { name: QUESTION_STAMP })).toBeVisible();
    await expect.element(page.getByRole('button', { name: PING_STAMP })).toBeVisible();
    expect(page.getByRole('button', { name: ANY_PACKET }).elements(), 'one stamp for the question and one for the ping').toHaveLength(2);

    const stage = document.querySelector(MAP_STAGE) as SVGSVGElement;
    stage.pauseAnimations();
    const [question, ping] = [flightOf(QUESTION_FLIGHT), flightOf(PING_FLIGHT)];
    const asked = startOf(question);
    const wait = startOf(ping) - asked;
    expect(wait, 'the ping leaves after its question has gone and come back').toBeGreaterThan(0);

    stage.setCurrentTime(asked + A_FRAME_SECONDS);
    expect([isShown(question, 'going'), isInTheAir(ping)], 'at first only the question flies, on its way to the resolver').toEqual([true, false]);
    stage.setCurrentTime(asked + wait - A_FRAME_SECONDS);
    expect([isShown(question, 'answer'), isInTheAir(ping)], 'the ping waits while the answer is still on its way back').toEqual([true, false]);
    stage.setCurrentTime(asked + wait + A_FRAME_SECONDS);
    expect([isInTheAir(question), isShown(ping, 'going')], 'when the answer is back the question is over and the ping leaves').toEqual([false, true]);
  });
});
