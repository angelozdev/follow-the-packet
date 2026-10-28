// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMS } from '@/copy';
import { inspect, sessionReducer, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { gatewayIncident } from '@/testing/incidents';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';

const INCIDENT = gatewayIncident();
const ENTRY = PIECE_ID.device('your-laptop');
const SECTION = 'Ajustes de red';
const TRAY = TERMS['default-gateway'].name;
const ROUTER = '192.168.1.1';

function Hosted() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([INCIDENT], INCIDENT.id));
  return (
    <>
      <span data-testid="gateway">{session.world.devices.find((device) => device.id === 'your-laptop')?.gateway ?? 'none'}</span>
      <ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, ENTRY)} pieceId={ENTRY} heading={createRef()} onClose={vi.fn()} onChoose={vi.fn()} />
    </>
  );
}

const chip = (name: string) => screen.getByRole('button', { name });
const pressed = (name: string) => chip(name).getAttribute('aria-pressed');
const openSettings = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole('tab', { name: 'Ajustes' }));

describe('settings card', () => {
  it('shows the gateway tray under its name in Ajustes and reports the pick', async () => {
    const user = userEvent.setup();
    const session = startSession([INCIDENT], INCIDENT.id);
    const dispatch = vi.fn();
    const onClose = vi.fn();
    render(<ShellPanel session={session} dispatch={dispatch} inspection={inspect(session, ENTRY)} pieceId={ENTRY} heading={createRef()} onClose={onClose} onChoose={vi.fn()} />);
    await openSettings(user);
    const panel = screen.getByRole('region', { name: 'tu-laptop' });
    expect(within(panel).getByRole('heading', { name: SECTION })).toBeInTheDocument();
    expect(within(panel).getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual([TRAY]);
    expect(pressed('Ninguna')).toBe('true');
    expect(pressed(ROUTER)).toBe('false');
    await user.click(chip(ROUTER));
    expect(dispatch).toHaveBeenCalledExactlyOnceWith({ type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'router' });
    expect(within(panel).queryByRole('button', { name: TASK_CARD_TEXT.done }), 'a setting has no way out of its own').toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls the setting by its term, the default gateway, and not by the label of any operating system', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    await openSettings(user);
    const panel = screen.getByRole('region', { name: 'tu-laptop' });
    expect(screen.getByRole('group', { name: TRAY })).toBeInTheDocument();
    expect(TRAY).toBe('puerta de enlace predeterminada');
    expect(panel).toHaveTextContent(TRAY);
    expect(panel.textContent).not.toMatch(/router/i);
  });

  it('shows the chip that matches the world after each pick, and the world changes with it', async () => {
    const user = userEvent.setup();
    render(<Hosted />);
    await openSettings(user);
    expect(screen.getByTestId('gateway')).toHaveTextContent('none');
    await user.click(chip(ROUTER));
    expect(screen.getByTestId('gateway')).toHaveTextContent(ROUTER);
    expect(pressed(ROUTER)).toBe('true');
    expect(pressed('Ninguna')).toBe('false');
    await user.click(chip('Ninguna'));
    expect(screen.getByTestId('gateway')).toHaveTextContent('none');
    expect(pressed('Ninguna')).toBe('true');
  });

  it('Escape in the panel closes nothing: only the screen gives the focus back to the piece', async () => {
    const user = userEvent.setup();
    const session = startSession([INCIDENT], INCIDENT.id);
    const onClose = vi.fn();
    render(<ShellPanel session={session} dispatch={vi.fn()} inspection={inspect(session, ENTRY)} pieceId={ENTRY} heading={createRef()} onClose={onClose} onChoose={vi.fn()} />);
    await openSettings(user);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('region', { name: 'tu-laptop' })).toBeInTheDocument();
  });
});
