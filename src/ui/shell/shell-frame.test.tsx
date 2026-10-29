// @vitest-environment jsdom
import { render, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LUCIA_TEXT, SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { IncidentScreen } from '@/ui/incident/incident-screen';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, width: 1060, height: 800 }),
}));

const INCIDENT = '04-01';
const LOCKED_SERVER = 'servidor2 con candado';
const ZONES = ['.incident__strip', '.incident__lucia', '.incident__map', '.incident__panel', '.incident__status'];

function renderScreen() {
  render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={vi.fn()} />);
}

function zone(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`${selector} is not on the page`);
  return found;
}

describe('the frame of the incident screen', () => {
  it('the zones of the screen follow the reading order: strip, Lucía, map, panel and status bar', () => {
    renderScreen();
    const main = zone('main.incident');
    const zones = ZONES.map(zone);

    expect(zones.map((found) => found.parentElement)).toEqual(zones.map(() => main));
    expect([...main.children].filter((child) => zones.includes(child as HTMLElement))).toEqual(zones);
    expect(within(zones[0]).getByRole('heading', { level: 1 })).toHaveTextContent(INCIDENTS.find(({ id }) => id === INCIDENT)?.title ?? '');
    expect(within(zones[0]).getByRole('link', { name: SCREEN_TEXT.back })).toBeInTheDocument();
    expect(within(zones[1]).getByRole('button', { name: LUCIA_TEXT.submit })).toBeInTheDocument();
    expect(within(zones[2]).getByRole('button', { name: LOCKED_SERVER })).toBeInTheDocument();
    expect(within(zones[3]).getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(within(zones[4]).getByRole('log')).toBeInTheDocument();
  });
});
