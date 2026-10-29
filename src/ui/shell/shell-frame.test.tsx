// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LUCIA_TEXT, PIECE_TEXT, SCREEN_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { IncidentScreen } from '@/ui/incident/incident-screen';

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, width: 1060, height: 800 }),
}));

const INCIDENT = '04-01';
const LOCKED_SERVER = 'servidor2 con candado';
const CHOSEN = 'servidor2';
const ZONES = ['.incident__strip', '.incident__lucia', '.incident__map', '.incident__panel', '.incident__status'];
const LUCIA_ZONE = '.incident__lucia';
const WITH_A_CLOCK = '02-12';
const DIAGNOSING = INCIDENTS.find((incident) => incident.mechanic === 'diagnose')?.id ?? '';
const CARDS_OF_THE_ZONE: [string, number][] = [
  [INCIDENT, 1],
  [WITH_A_CLOCK, 2],
  [DIAGNOSING, 2],
];
const REACHABLE = 'button, summary, a[href], input, [tabindex]';

function renderScreen() {
  render(<IncidentScreen incidents={INCIDENTS} incidentId={INCIDENT} nextId={null} onFinish={vi.fn()} />);
}

function renderIncident(incidentId: string) {
  return render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={vi.fn()} />);
}

function arrow(): HTMLElement {
  return screen.getByRole('button', { name: LUCIA_TEXT.foldLabel });
}

function stored(): string {
  return JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage)]);
}

function zone(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`${selector} is not on the page`);
  return found;
}

describe('the frame of the incident screen', () => {
  it('the X of the panel of a piece frees the choice, brings the help back and gives the focus to the piece', async () => {
    const user = userEvent.setup();
    renderScreen();
    const label = screen.getByRole('button', { name: LOCKED_SERVER });
    await user.click(label);
    expect(label).toHaveAttribute('data-pinned');

    await user.click(within(screen.getByRole('region', { name: CHOSEN })).getByRole('button', { name: PIECE_TEXT.closeLabel }));

    expect(screen.queryByRole('region', { name: CHOSEN })).toBeNull();
    expect(screen.getByText(SCREEN_TEXT.inspectHelp)).toBeInTheDocument();
    expect(label).not.toHaveAttribute('data-pinned');
    expect(label).toHaveFocus();
  });

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

describe('the fold of the zone of Lucía', () => {
  it('Lucía starts unfolded in every incident and her fold is not kept to the next one', async () => {
    const user = userEvent.setup();
    const before = stored();

    for (const { id } of INCIDENTS) {
      const view = renderIncident(id);
      expect(arrow(), id).toHaveAttribute('aria-expanded', 'true');
      await user.click(arrow());
      expect(arrow(), id).toHaveAttribute('aria-expanded', 'false');
      view.unmount();
    }

    expect(stored(), 'the fold is saved nowhere').toBe(before);
  });

  it('folded, Lucía is her band with her name, her role and an arrow with aria-expanded, and nothing else of her zone can be reached', async () => {
    const user = userEvent.setup();
    for (const [id, count] of CARDS_OF_THE_ZONE) {
      const view = renderIncident(id);
      const lucia = zone(LUCIA_ZONE);
      const cards = [...lucia.querySelectorAll<HTMLElement>(':scope > .card')];
      expect(cards, id).toHaveLength(count);
      for (const card of cards) expect(card, id).toBeVisible();

      await user.click(arrow());

      expect(arrow(), id).toHaveAttribute('aria-expanded', 'false');
      expect(arrow(), id).toHaveAttribute('aria-controls', lucia.id);
      expect(lucia.id, id).not.toBe('');
      expect(within(lucia).getByRole('heading', { name: LUCIA_TEXT.name }), id).toBeVisible();
      expect(within(lucia).getByText(LUCIA_TEXT.role), id).toBeVisible();
      expect(within(lucia).getAllByRole('button'), id).toEqual([arrow()]);
      expect(within(lucia).getAllByRole('heading'), id).toHaveLength(1);
      for (const card of cards.slice(1)) expect(card, id).not.toBeVisible();
      const others = [...lucia.querySelectorAll<HTMLElement>(REACHABLE)].filter((element) => element !== arrow());
      expect(others.length, id).toBeGreaterThan(0);
      for (const element of others) expect(element, id).not.toBeVisible();

      await user.click(arrow());

      expect(arrow(), id).toHaveAttribute('aria-expanded', 'true');
      for (const card of cards) expect(card, id).toBeVisible();
      view.unmount();
    }
  });
});
