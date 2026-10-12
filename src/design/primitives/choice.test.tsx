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
    expect(tray.getByRole('button', { name: 'Echo Reply' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(tray.getByRole('button', { name: 'Echo Reply' }));
    expect(onPick).toHaveBeenCalledWith('reply');
  });

  it('a pressed chip is still announced as pressed, whatever it looks like', () => {
    render(
      <>
        <Choice pressed>Sí</Choice>
        <Choice pressed={false}>No</Choice>
        <Choice variant="option" pressed>
          Una respuesta
        </Choice>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Una respuesta' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('an option keeps its sentence as its name and puts no letter in the page text', () => {
    const sentences = ['Origen: la impresora.', 'Origen: tu laptop.', 'Origen: el router.'];
    const { container } = render(
      <ol className="options">
        {sentences.map((sentence) => (
          <li key={sentence}>
            <Choice variant="option" pressed={false}>
              {sentence}
            </Choice>
          </li>
        ))}
      </ol>,
    );
    for (const sentence of sentences) expect(screen.getByRole('button', { name: sentence })).toBeInTheDocument();
    expect(container.textContent).toBe(sentences.join(''));
  });
});

describe('ChipTray, segmented', () => {
  const YES_NO = [
    { id: 'yes', label: 'Sí' },
    { id: 'no', label: 'No' },
  ];

  it('a segmented tray wears the class of its variant and keeps each chip announced as pressed or not', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<ChipTray name="¿Está en la red?" variant="segmented" chips={YES_NO} picked="no" onPick={onPick} />);
    const tray = screen.getByRole('group', { name: '¿Está en la red?' });
    expect(tray).toHaveClass('tray tray--segmented', { exact: true });
    expect(within(tray).getByRole('button', { name: 'Sí' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(tray).getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(tray).getByRole('button', { name: 'Sí' })).toHaveClass('chip', { exact: true });
    await user.click(within(tray).getByRole('button', { name: 'Sí' }));
    expect(onPick).toHaveBeenCalledWith('yes');
  });

  it('a tray is the plain one unless it asks for the segmented variant', () => {
    render(<ChipTray name="Type" chips={YES_NO} picked={null} onPick={vi.fn()} />);
    expect(screen.getByRole('group', { name: 'Type' })).toHaveClass('tray', { exact: true });
  });
});

describe('ChipTray, of actions', () => {
  it('a tray that gives no picked chip draws plain buttons, announces none as pressed and reports the chip the player presses', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    render(<ChipTray name="Esperar" chips={[{ id: 'minute', label: 'Esperar 1 min' }, { id: 'five', label: 'Esperar 5 min' }]} onPick={onPick} />);
    const tray = within(screen.getByRole('group', { name: 'Esperar' }));
    for (const chip of tray.getAllByRole('button')) {
      expect(chip).not.toHaveAttribute('aria-pressed');
      expect(chip).toHaveClass('chip', { exact: true });
    }
    await user.click(tray.getByRole('button', { name: 'Esperar 5 min' }));
    await user.click(tray.getByRole('button', { name: 'Esperar 5 min' }));
    expect(onPick).toHaveBeenCalledTimes(2);
    expect(onPick).toHaveBeenLastCalledWith('five');
  });
});
