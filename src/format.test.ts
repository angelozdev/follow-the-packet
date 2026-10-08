import { describe, expect, it } from 'vitest';
import { actor, inst, lab03Net, ping } from './engine/fixtures';
import { formatPacket, formatPeer, formatSolution, formatWhat } from './format';
import level01 from './levels/04-iaas/01-where-ping-dies';

describe('formatos', () => {
  it('describe el qué de una regla en lenguaje simple', () => {
    expect(formatWhat({ kind: 'icmp', icmpType: 8 })).toBe('ICMP · Echo Request');
    expect(formatWhat({ kind: 'icmp', icmpType: 0 })).toBe('ICMP · Echo Reply');
    expect(formatWhat({ kind: 'tcp', fromPort: 22, toPort: 22 })).toBe('TCP 22');
    expect(formatWhat({ kind: 'all' })).toBe('Todo el tráfico');
  });

  it('describe el desde dónde por nombre de SG o por CIDR', () => {
    const net = lab03Net();
    expect(formatPeer({ kind: 'sg', sgId: 'sg-servidor1' }, net)).toBe('SG servidor1');
    expect(formatPeer({ kind: 'cidr', cidr: '0.0.0.0/0' }, net)).toBe('0.0.0.0/0');
  });

  it('describe un paquete', () => {
    const net = lab03Net();
    expect(formatPacket(ping(inst('servidor1'), '172.31.38.97'), net)).toBe('ping de servidor1 a 172.31.38.97');
    expect(formatPacket(ping(actor('probe-internet'), '34.244.254.100'), net)).toBe('ping de Internet a 34.244.254.100');
  });

  it('describe la solución de un nivel', () => {
    expect(formatSolution(level01)).toBe('Agregar en el SG servidor2: ICMP · Echo Request desde SG servidor1.');
  });
});
