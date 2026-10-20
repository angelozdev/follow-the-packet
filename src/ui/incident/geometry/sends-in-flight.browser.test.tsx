import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { INCIDENTS } from '@/levels';
import { OFFICE_IP, holdTheClock, openTerminal, passTime, releaseTheGrace, sendTo, showTheScreen, standStill } from '@/testing/browser-play';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const INCIDENT = '01-03';
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
