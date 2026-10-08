import { describe, expect, it } from 'vitest';
import level01 from './04-iaas/01-where-ping-dies';
import { applyAction } from './apply';
import { applySolution, evaluateDefender } from './evaluate';

describe('evaluateDefender (nivel 04-01)', () => {
  it('quitar el SSH que ya existía no rompe la evaluación ni castiga (Review Focus 4)', () => {
    const net = applyAction(applySolution(level01), { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'ssh-2' });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(true);
    expect(result.tight).toBe(true);
  });

  it('abrir Echo Request a todo internet incumple el objetivo (el atacante entra)', () => {
    const net = applyAction(level01.network, {
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: { id: 'world', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } },
    });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(false);
    expect(result.mustBlock[0].ok).toBe(false);
  });

  it('todos los tipos ICMP desde el SG de servidor1 cumple, pero abre de más', () => {
    const net = applyAction(level01.network, {
      type: 'addRule',
      sgId: 'sg-servidor2',
      rule: { id: 'all-icmp', what: { kind: 'icmp', icmpType: 'all' }, peer: { kind: 'sg', sgId: 'sg-servidor1' } },
    });
    const result = evaluateDefender(level01, net);
    expect(result.objective).toBe(true);
    expect(result.tight).toBe(false);
  });
});
