// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChipTray, Choice } from './choice';

describe('Choice', () => {
  it('is a toggle when it says whether it is pressed, and a plain action when it does not', () => {
    render(
      <>
        <Choice pressed>Echo Request</Choice>
        <Choice variant="option" pressed={false}>
          Una respuesta
        </Choice>
        <Choice>Devolver</Choice>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Echo Request' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Una respuesta' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Una respuesta' })).toHaveClass('option', { exact: true });
    expect(screen.getByRole('button', { name: 'Devolver' })).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('button', { name: 'Devolver' })).toHaveClass('chip', { exact: true });
  });

  it('in a tray, names the group, presses only the picked chip and reports the chip the player picks', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<ChipTray name="Type" chips={[{ id: 'request', label: 'Echo Request' }, { id: 'reply', label: 'Echo Reply' }]} picked="request" onPick={onPick} />);
    const tray = within(screen.getByRole('group', { name: 'Type' }));
    expect(tray.getAllByRole('button', { pressed: true }).map((chip) => chip.textContent)).toEqual(['Echo Request']);
    await user.click(tray.getByRole('button', { name: 'Echo Reply' }));
    expect(onPick).toHaveBeenCalledWith('reply');
  });
});
