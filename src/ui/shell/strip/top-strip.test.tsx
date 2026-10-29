// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CLOCK_TEXT, LUCIA_TEXT, PIECE_TEXT, TERMINAL_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const mapSize = vi.hoisted(() => ({ width: 1060, height: 800 }));

vi.mock('@mantine/hooks', async (importOriginal) => {
  const original = await importOriginal<typeof import('@mantine/hooks')>();
  return { ...original, useElementSize: () => ({ ...original.useElementSize(), ...mapSize }) };
});

const TOP_STRIP = '.incident__strip';
const LUCIA_ZONE = '.incident__lucia';
const BAR = '.incident__systems';
const INCIDENT_WITH_A_CLOCK = '02-12';
const INCIDENT_WITHOUT_A_CLOCK = '01-01';
const FIVE_MINUTES = 'Esperar 5 min';
const ONE_MINUTE = 'Esperar 1 min';
const TIME_AT_START = '0 min 00 s';
const TIME_AFTER_FIVE_MINUTES = '5 min 00 s';

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing on the page matches ${selector}`);
  return found;
}

const renderIncident = (incidentId: string) => render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={vi.fn()} />);
const theClock = () => within(elementOf(TOP_STRIP)).queryByRole('region', { name: CLOCK_TEXT.title });
const send = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(within(elementOf(BAR)).getByRole('button', { name: PIECE_TEXT.tabs.terminal }));
  await user.click(screen.getByRole('button', { name: TERMINAL_TEXT.send }));
};

describe('the clock of the game in the top strip', () => {
  it('the clock is a region of the top strip named Reloj del juego, only in an incident that has one and while it is open', async () => {
    const user = userEvent.setup();
    const view = renderIncident(INCIDENT_WITHOUT_A_CLOCK);
    expect(screen.queryByRole('region', { name: CLOCK_TEXT.title }), 'an incident with no clock draws none').toBeNull();
    view.unmount();

    renderIncident(INCIDENT_WITH_A_CLOCK);
    const clock = theClock();
    expect(clock, 'the clock is in the top strip').not.toBeNull();
    if (clock === null) return;
    expect(within(clock).getByText(TIME_AT_START)).toBeInTheDocument();
    expect(within(clock).getByRole('button', { name: ONE_MINUTE })).toBeInTheDocument();
    expect(within(clock).getByRole('button', { name: FIVE_MINUTES })).toBeInTheDocument();
    expect(within(elementOf(LUCIA_ZONE)).queryByRole('region', { name: CLOCK_TEXT.title }), 'and not in the zone of Lucía').toBeNull();

    await send(user);
    await user.click(within(clock).getByRole('button', { name: FIVE_MINUTES }));
    expect(within(clock).getByText(TIME_AFTER_FIVE_MINUTES)).toBeInTheDocument();
    await send(user);
    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    expect(theClock(), 'once the incident is over the clock goes').toBeNull();
  });
});
