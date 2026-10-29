// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EXPLANATION_TEXT, LUCIA_TEXT, PIECE_TEXT, TERMINAL_TEXT } from '@/copy';
import { INCIDENTS } from '@/levels';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const sheet = vi.hoisted(() => ({ width: 1060, height: 800 }));

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, ...sheet }),
}));

const STRIP = '.incident__status';
const PANEL_ZONE = '.incident__panel';
const NO_TOOLS = '01-01';
const ROUTING = '02-06';
const TWO_ORIGINS = '02-03';
const WEB = '03-03';
const YOUR_LAPTOP = 'tu-laptop';
const OTHER_LAPTOP = 'laptop-lucia';
const OTHER_PIECE = /^laptop-marta/;
const FIREWALL_PIECE = /^firewall tu-laptop/;
const PRINTER_IP = '192.168.1.21';
const LOOPBACK_IP = '127.0.0.1';
const NC_TO_THE_APP = 'nc · puerto 3000';
const TERMINAL = PIECE_TEXT.tabs.terminal;
const BROWSER = 'Navegador';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const SYSTEM_BUTTON = new RegExp(`^(${TERMINAL}|${BROWSER}|Registro \\(\\d+\\))$`);

type User = ReturnType<typeof userEvent.setup>;

function renderIncident(incidentId: string) {
  return render(<IncidentScreen incidents={INCIDENTS} incidentId={incidentId} nextId={null} onFinish={vi.fn()} />);
}

function zone(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`${selector} is not on the page`);
  return found;
}

function thePanel(): HTMLElement {
  const panel = zone(PANEL_ZONE).querySelector<HTMLElement>(':scope > section');
  if (panel === null) throw new Error('the panel is not in its zone');
  return panel;
}

const sorted = (names: string[]) => [...names].sort();

const systemsOfTheStrip = () =>
  sorted(
    within(zone(STRIP))
      .queryAllByRole('button')
      .map((button) => button.textContent?.trim() ?? '')
      .filter((name) => SYSTEM_BUTTON.test(name)),
  );

const pieceLabel = (name: RegExp) => screen.getAllByRole('button', { name }).find((candidate) => candidate.classList.contains('map-button')) as HTMLElement;

const button = (name: string | RegExp) => within(zone(STRIP)).getByRole('button', { name });

async function sendPing(user: User, address: string) {
  const panel = thePanel();
  await user.click(within(panel).getByRole('button', { name: address }));
  await user.click(within(panel).getByRole('button', { name: TERMINAL_TEXT.send }));
}

describe('the bar of systems', () => {
  it('the bar draws Terminal, Navegador and Registro (N) only where the incident offers them: nothing in 01-01 and, in 02-06, Terminal, and Registro (N) once a packet is sent', async () => {
    const user = userEvent.setup();
    const bare = renderIncident(NO_TOOLS);
    expect(systemsOfTheStrip()).toEqual([]);
    bare.unmount();

    const routing = renderIncident(ROUTING);
    expect(systemsOfTheStrip()).toEqual([TERMINAL]);
    await user.click(button(TERMINAL));
    await sendPing(user, PRINTER_IP);
    expect(systemsOfTheStrip()).toEqual(sorted([TERMINAL, 'Registro (1)']));
    routing.unmount();

    renderIncident(WEB);
    expect(systemsOfTheStrip()).toEqual(sorted([TERMINAL, BROWSER]));
  });

  it('Terminal opens the Terminal tab of the piece of the last origin the player used, and of the first send.from that has one before any', async () => {
    const user = userEvent.setup();
    renderIncident(TWO_ORIGINS);

    await user.click(button(TERMINAL));
    expect(thePanel(), 'before any origin was used, the first of send.from').toHaveAccessibleName(YOUR_LAPTOP);
    expect(within(thePanel()).getByRole('tab', { name: TERMINAL })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(thePanel()).getByRole('button', { name: OTHER_LAPTOP }));
    await user.click(within(thePanel()).getByRole('button', { name: LOOPBACK_IP }));
    await user.click(within(thePanel()).getByRole('button', { name: NC_TO_THE_APP }));
    await user.click(within(thePanel()).getByRole('button', { name: TERMINAL_TEXT.send }));
    await user.click(pieceLabel(OTHER_PIECE));
    expect(thePanel(), 'another piece is chosen').toHaveAccessibleName(/^laptop-marta/);

    await user.click(button(TERMINAL));
    expect(thePanel(), 'the last origin used').toHaveAccessibleName(OTHER_LAPTOP);
    expect(within(thePanel()).getByRole('tab', { name: TERMINAL })).toHaveAttribute('aria-selected', 'true');
  });

  it('Navegador does the same with the piece that has the browser', async () => {
    const user = userEvent.setup();
    renderIncident(WEB);

    await user.click(button(BROWSER));
    expect(thePanel(), 'before any origin was used, the first of send.from that has a browser').toHaveAccessibleName(YOUR_LAPTOP);
    expect(within(thePanel()).getByRole('tab', { name: BROWSER })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(thePanel()).getByRole('tab', { name: TERMINAL }));
    await user.click(within(thePanel()).getByRole('button', { name: OTHER_LAPTOP }));
    await user.click(pieceLabel(FIREWALL_PIECE));
    await user.click(button(BROWSER));

    expect(thePanel(), 'the browser of the last origin the player chose').toHaveAccessibleName(OTHER_LAPTOP);
    expect(within(thePanel()).getByRole('tab', { name: BROWSER })).toHaveAttribute('aria-selected', 'true');
  });

  it('a button whose tab is already in view does nothing more', async () => {
    const user = userEvent.setup();
    renderIncident(ROUTING);
    await user.click(button(TERMINAL));
    const panel = thePanel();
    await user.click(button(TERMINAL));

    expect(button(TERMINAL), 'the focus stays on the button').toHaveFocus();
    expect(thePanel()).toBe(panel);
    expect(within(panel).getByRole('tab', { name: TERMINAL })).toHaveAttribute('aria-selected', 'true');
  });

  it('the focus goes to the heading of the panel after Terminal or Navegador', async () => {
    const user = userEvent.setup();
    renderIncident(WEB);

    await user.click(button(TERMINAL));
    expect(within(thePanel()).getByRole('heading', { name: YOUR_LAPTOP })).toHaveFocus();

    await user.click(button(BROWSER));
    expect(within(thePanel()).getByRole('tab', { name: BROWSER })).toHaveAttribute('aria-selected', 'true');
    expect(within(thePanel()).getByRole('heading', { name: YOUR_LAPTOP })).toHaveFocus();
  });

  it('Terminal and Navegador are not drawn once the incident is over and Registro stays', async () => {
    const user = userEvent.setup();
    renderIncident(ROUTING);
    await user.click(button(TERMINAL));
    await sendPing(user, PRINTER_IP);
    await sendPing(user, '192.168.2.15');
    expect(systemsOfTheStrip()).toEqual(sorted([TERMINAL, 'Registro (2)']));

    await user.click(screen.getByRole('button', { name: LUCIA_TEXT.submit }));
    await user.click(screen.getByRole('button', { name: /^Porque ninguna otra fila cubre/ }));
    await user.click(screen.getByRole('button', { name: EXPLANATION_TEXT.seeResult }));

    expect(systemsOfTheStrip()).toEqual(['Registro (2)']);
    expect(button(REGISTRY_BUTTON)).toBeEnabled();
  });
});
