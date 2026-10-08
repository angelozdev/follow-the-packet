// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level01 from '../../levels/04-iaas/01-where-ping-dies';
import { LevelScreen } from './LevelScreen';

// Sin JSX en la fábrica: vi.mock se sube al inicio del archivo, antes que el runtime de JSX.
vi.mock('../../scene/GameScene', () => ({ GameScene: () => null }));

describe('LevelScreen', () => {
  it('juega el nivel 1 de punta a punta y reporta 3 estrellas', async () => {
    const onFinish = vi.fn();
    render(<LevelScreen level={level01} reducedMotion onToggleMotion={() => {}} onFinish={onFinish} />);
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    await userEvent.click(screen.getByRole('button', { name: 'En la barrera de servidor2 (su SG de entrada)' }));
    await userEvent.selectOptions(screen.getByLabelText('Qué'), 'ICMP · Echo Request ("Repetir solicitud")');
    await userEvent.selectOptions(screen.getByLabelText('Desde dónde'), 'SG servidor1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar regla' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('3 de 3 estrellas')).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledWith(3);
  });

  it('si falla, ofrece pistas en escalera hasta la solución', async () => {
    render(<LevelScreen level={level01} reducedMotion onToggleMotion={() => {}} onFinish={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Empezar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dentro de servidor2 (Linux)' }));
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(screen.getByText('0 de 3 estrellas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pedir una pista' }));
    expect(screen.getByText(level01.hints[0])).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Pedir una pista' }));
    await userEvent.click(screen.getByRole('button', { name: 'Ver la solución' }));
    expect(screen.getByText(/Solución: Agregar en el SG servidor2/)).toBeInTheDocument();
  });
});
