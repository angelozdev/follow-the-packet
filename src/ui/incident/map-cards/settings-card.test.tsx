// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useReducer } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TASK_CARD_TEXT, TERMS } from '@/copy';
import { sessionReducer, settingsCard, startSession } from '@/game';
import { PIECE_ID } from '@/game/view/piece-id';
import { gatewayIncident } from '@/testing/incidents';
import { SettingsCard } from './settings-card';

const INCIDENT = gatewayIncident();
const ENTRY = PIECE_ID.device('your-laptop');
const TITLE = 'Ajustes de red de tu-laptop';
const TRAY = TERMS['default-gateway'].name;
const ROUTER = '192.168.1.1';

function Hosted({ onClose }: { onClose: () => void }) {
  const [session, dispatch] = useReducer(sessionReducer, undefined, () => startSession([INCIDENT], INCIDENT.id));
  const card = settingsCard(session, ENTRY);
  if (!card) throw new Error('missing the settings card');
  return (
    <>
      <span data-testid="gateway">{session.world.devices.find((device) => device.id === 'your-laptop')?.gateway ?? 'none'}</span>
      <SettingsCard card={card} onPick={(settingId, chipId) => dispatch({ type: 'setSetting', deviceId: card.deviceId, settingId, chipId })} onClose={onClose} />
    </>
  );
}

const chip = (name: string) => screen.getByRole('button', { name });
const pressed = (name: string) => chip(name).getAttribute('aria-pressed');

describe('settings card', () => {
  it('shows the gateway tray in the card and reports the pick', async () => {
    const user = userEvent.setup();
    const card = settingsCard(startSession([INCIDENT], INCIDENT.id), ENTRY);
    if (!card) throw new Error('missing the settings card');
    const handlers = { onPick: vi.fn(), onClose: vi.fn() };
    render(<SettingsCard card={card} {...handlers} />);
    expect(screen.getByRole('dialog', { name: TITLE })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
    expect(screen.getAllByRole('group').map((group) => group.getAttribute('aria-label'))).toEqual([TRAY]);
    expect(pressed('Ninguna')).toBe('true');
    expect(pressed(ROUTER)).toBe('false');
    await user.click(chip(ROUTER));
    expect(handlers.onPick).toHaveBeenCalledExactlyOnceWith('gateway', 'router');
    expect(handlers.onClose).not.toHaveBeenCalled();
    await user.click(chip(TASK_CARD_TEXT.done));
    expect(handlers.onClose).toHaveBeenCalledOnce();
  });

  it('calls the setting by its term, the default gateway, and not by the label of any operating system', () => {
    render(<Hosted onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog', { name: TITLE });
    expect(screen.getByRole('group', { name: TRAY })).toBeInTheDocument();
    expect(TRAY).toBe('puerta de enlace predeterminada');
    expect(dialog).toHaveTextContent(TRAY);
    expect(dialog.textContent).not.toMatch(/router/i);
  });

  it('shows the chip that matches the world after each pick, and the world changes with it', async () => {
    const user = userEvent.setup();
    render(<Hosted onClose={vi.fn()} />);
    expect(screen.getByTestId('gateway')).toHaveTextContent('none');
    await user.click(chip(ROUTER));
    expect(screen.getByTestId('gateway')).toHaveTextContent(ROUTER);
    expect(pressed(ROUTER)).toBe('true');
    expect(pressed('Ninguna')).toBe('false');
    await user.click(chip('Ninguna'));
    expect(screen.getByTestId('gateway')).toHaveTextContent('none');
    expect(pressed('Ninguna')).toBe('true');
  });

  it('Escape closes the card', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Hosted onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });
});
