// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CASE_TEXT, PIECE_TEXT, SCREEN_TEXT, SYSTEMS_TEXT, TERMINAL_TEXT, WINDOW_TEXT, toPlainText } from '@/copy';
import type { Incident, SendIncident } from '@/levels';
import { OFFICE_FLOORS } from '@/testing/fixtures';
import { CHAPTER_1_TERMS, diagnoseIncident, gatewayIncident } from '@/testing/incidents';
import { IncidentScreen } from '@/ui/incident/incident-screen';

const mapSheet = vi.hoisted(() => ({ width: 1060, height: 800 }));

vi.mock('@mantine/hooks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mantine/hooks')>()),
  useElementSize: () => ({ ref: () => undefined, ...mapSheet }),
}));

const TOP_STRIP = '.incident__strip';
const MAP = '.incident__map';
const LUCIA = '.incident__lucia';
const PANEL = '.incident__panel';
const STRIP = '.incident__status';
const BAR = '.incident__systems';
const COVERED_ZONES = [MAP, LUCIA, PANEL];
const FREE_ZONES = [TOP_STRIP, STRIP];
const TERMINAL = PIECE_TEXT.tabs.terminal;
const SETTINGS = 'Ajustes';
const TABLES = 'Tablas';
const ROUTES = 'Tabla de rutas';
const REGISTRY_BUTTON = /^Registro \(\d+\)$/;
const SEE_ROW = 'Ver fila en la tabla de rutas';
const PRINTER = OFFICE_FLOORS.floor1.printer;
const ANDRES = OFFICE_FLOORS.floor2.andres;
const PING_PRINTER = 'ping de tu-laptop a impresora';
const GATEWAY = { ...gatewayIncident(), introduces: [...CHAPTER_1_TERMS] };
const ROUTED: SendIncident = { ...gatewayIncident(), send: { ...gatewayIncident().send, to: [...gatewayIncident().send.to, { id: 'server', address: OFFICE_FLOORS.server.ip }] } };
const DIAGNOSE = diagnoseIncident();
const LOOPBACK = '127.0.0.1';

type User = ReturnType<typeof userEvent.setup>;

function renderIncident(incident: Incident) {
  return render(<IncidentScreen incidents={[incident]} incidentId={incident.id} nextId={null} onFinish={vi.fn()} />);
}

function elementOf(selector: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`nothing on the page matches ${selector}`);
  return found;
}

const thePanel = () => within(elementOf(PANEL)).getByRole('region');
const theWindow = () => screen.getByRole('dialog', { name: SYSTEMS_TEXT.registry });
const noWindow = () => screen.queryByRole('dialog');
const barButton = (name: string | RegExp) => within(elementOf(BAR)).getByRole('button', { name });
const registro = () => barButton(REGISTRY_BUTTON);
const pieceLabel = (name: string) => screen.getAllByRole('button', { name }).find((candidate) => candidate.classList.contains('map-button')) as HTMLElement;

async function sendTo(user: User, address: string) {
  await user.click(barButton(TERMINAL));
  await user.click(within(thePanel()).getByRole('button', { name: address }));
  await user.click(within(thePanel()).getByRole('button', { name: TERMINAL_TEXT.send }));
}

async function setTheGateway(user: User) {
  await user.click(pieceLabel('tu-laptop'));
  await user.click(within(thePanel()).getByRole('tab', { name: SETTINGS }));
  await user.click(within(thePanel()).getByRole('button', { name: OFFICE_FLOORS.floor1.gateway }));
}

describe('the registry in a system window', () => {
  it('with three sends the registry opens in a window, and Esc, the X and the same button close it with the focus back on the button', async () => {
    const user = userEvent.setup();
    renderIncident(GATEWAY);
    await sendTo(user, PRINTER);
    await sendTo(user, ANDRES);
    await sendTo(user, PRINTER);
    const button = registro();
    expect(noWindow()).toBeNull();

    await user.click(button);
    expect(within(theWindow()).getByRole('list', { name: REGISTRY_BUTTON })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(theWindow()).toContainElement(document.activeElement as HTMLElement);

    await user.keyboard('{Escape}');
    expect(noWindow()).toBeNull();
    await waitFor(() => expect(button).toHaveFocus());
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button);
    await user.click(within(theWindow()).getByRole('button', { name: WINDOW_TEXT.closeLabel }));
    expect(noWindow()).toBeNull();
    await waitFor(() => expect(button).toHaveFocus());

    await user.click(button);
    expect(theWindow()).toBeInTheDocument();
    await user.click(button);
    expect(noWindow()).toBeNull();
    expect(button).toHaveFocus();
  });

  it('with a system window open the map, the card of Lucía and the panel are inert, and the strip, the newest line and the bar are not', async () => {
    const user = userEvent.setup();
    renderIncident(GATEWAY);
    await sendTo(user, PRINTER);
    for (const selector of [...COVERED_ZONES, ...FREE_ZONES]) expect(elementOf(selector), `${selector} before`).not.toHaveAttribute('inert');

    await user.click(registro());
    for (const selector of COVERED_ZONES) expect(elementOf(selector), `${selector} while the window is open`).toHaveAttribute('inert');
    for (const selector of FREE_ZONES) expect(elementOf(selector), `${selector} while the window is open`).not.toHaveAttribute('inert');
    expect(screen.getByRole('log').closest('[inert]')).toBeNull();
    expect(registro().closest('[inert]')).toBeNull();

    const motion = screen.getByRole('checkbox', { name: SCREEN_TEXT.motion });
    await user.click(motion);
    expect(motion).toBeChecked();
    expect(theWindow()).toBeInTheDocument();

    await user.click(registro());
    for (const selector of COVERED_ZONES) expect(elementOf(selector), `${selector} after`).not.toHaveAttribute('inert');
  });

  it('the button of the open window closes it in one click', async () => {
    const user = userEvent.setup();
    renderIncident(GATEWAY);
    await sendTo(user, PRINTER);

    await user.click(registro());
    expect(theWindow()).toBeInTheDocument();
    await user.click(registro());

    expect(noWindow()).toBeNull();
    expect(registro()).toHaveAttribute('aria-expanded', 'false');
  });

  it('Terminal closes the open window and opens its tab', async () => {
    const user = userEvent.setup();
    renderIncident(GATEWAY);
    await sendTo(user, PRINTER);
    await user.click(within(thePanel()).getByRole('tab', { name: SETTINGS }));
    await user.click(registro());
    expect(theWindow()).toBeInTheDocument();

    await user.click(barButton(TERMINAL));

    expect(noWindow()).toBeNull();
    expect(within(thePanel()).getByRole('tab', { name: TERMINAL })).toHaveAttribute('aria-selected', 'true');
    expect(within(thePanel()).getByRole('heading', { name: 'tu-laptop' })).toHaveFocus();
    expect(registro()).toHaveAttribute('aria-expanded', 'false');
  });

  it('choosing a row of the registry closes the window and the panel shows its box', async () => {
    const user = userEvent.setup();
    renderIncident(GATEWAY);
    await sendTo(user, ANDRES);
    await sendTo(user, PRINTER);
    await user.click(registro());

    await user.click(within(theWindow()).getByRole('button', { name: new RegExp(`^${PING_PRINTER}`) }));

    expect(noWindow()).toBeNull();
    expect(thePanel()).toHaveAccessibleName(PING_PRINTER);
  });

  it('Ver fila inside the window closes it, opens Tablas on the ficha of routes and leaves the focus on the heading of the panel', async () => {
    const user = userEvent.setup();
    renderIncident(ROUTED);
    await setTheGateway(user);
    await sendTo(user, ANDRES);
    await user.click(registro());

    await user.click(within(theWindow()).getByRole('button', { name: SEE_ROW }));

    expect(noWindow()).toBeNull();
    expect(thePanel()).toHaveAccessibleName('router-office');
    expect(within(thePanel()).getByRole('tab', { name: TABLES })).toHaveAttribute('aria-selected', 'true');
    expect(within(thePanel()).getByRole('tab', { name: ROUTES })).toHaveAttribute('aria-selected', 'true');
    expect(within(thePanel()).getByRole('heading', { name: 'router-office' })).toHaveFocus();
  });

  it('a registry that runs out of lines closes its window', async () => {
    const user = userEvent.setup();
    renderIncident(DIAGNOSE);
    await sendTo(user, LOOPBACK);
    await user.click(registro());
    expect(theWindow()).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: CASE_TEXT.know }));
    await user.click(screen.getByRole('button', { name: toPlainText(DIAGNOSE.diagnose.cases[0].cause.options.find((option) => option.correct)?.text ?? '') }));
    await user.click(screen.getByRole('button', { name: CASE_TEXT.next }));

    expect(noWindow()).toBeNull();
    expect(screen.queryByRole('button', { name: REGISTRY_BUTTON })).toBeNull();
  });
});
