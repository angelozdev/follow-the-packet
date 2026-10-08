// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import level01 from '../../levels/04-iaas/01-where-ping-dies';
import { RuleEditor } from './RuleEditor';

describe('RuleEditor', () => {
  it('agrega la regla elegida en qué y desde dónde', async () => {
    const onApply = vi.fn();
    render(<RuleEditor spec={level01.editable.rules!} network={level01.network} onApply={onApply} />);
    await userEvent.selectOptions(screen.getByLabelText('Qué'), 'ICMP · Echo Request ("Repetir solicitud")');
    await userEvent.selectOptions(screen.getByLabelText('Desde dónde'), 'SG servidor1');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar regla' }));
    expect(onApply).toHaveBeenCalledWith({
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: expect.objectContaining({ what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'sg', sgId: 'sg-servidor1' } }),
    });
  });

  it('borra una regla existente', async () => {
    const onApply = vi.fn();
    render(<RuleEditor spec={level01.editable.rules!} network={level01.network} onApply={onApply} />);
    await userEvent.click(screen.getByRole('button', { name: 'Borrar regla TCP 22 desde 198.51.100.7/32' }));
    expect(onApply).toHaveBeenCalledWith({ type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
  });
});
