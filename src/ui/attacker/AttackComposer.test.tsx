// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level04 from '../../levels/04-iaas/04-too-wide';
import { AttackComposer } from './AttackComposer';

describe('AttackComposer', () => {
  it('arma el paquete con el origen, el destino y el servicio elegidos', async () => {
    if (level04.objective.kind !== 'attacker' || level04.solution.kind !== 'attacker') throw new Error('nivel 04-04 debe ser de atacante');
    const onLaunch = vi.fn();
    render(<AttackComposer objective={level04.objective} attempts={0} onLaunch={onLaunch} />);
    await userEvent.selectOptions(screen.getByLabelText('Desde'), 'Desde web (el servidor que controlas)');
    await userEvent.selectOptions(screen.getByLabelText('Hacia'), 'db por su IP privada · 172.31.40.10');
    await userEvent.selectOptions(screen.getByLabelText('Servicio'), 'PostgreSQL · TCP 5432');
    await userEvent.click(screen.getByRole('button', { name: 'Lanzar ataque' }));
    expect(onLaunch).toHaveBeenCalledWith(level04.solution.packet);
  });
});
