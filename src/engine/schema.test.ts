import { describe, expect, it } from 'vitest';
import { lab03Net, withInstance } from './fixtures';
import { networkSchema, packetSchema } from './schema';

describe('networkSchema', () => {
  it('acepta la red del lab 03', () => {
    expect(networkSchema.safeParse(lab03Net()).success).toBe(true);
  });

  it('rechaza una IP privada fuera de su subred', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' });
    const result = networkSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('no está en 172.31.16.0/20');
  });

  it('rechaza un SG que no existe', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { sgIds: ['sg-fantasma'] });
    expect(networkSchema.safeParse(bad).success).toBe(false);
  });
});

describe('packetSchema', () => {
  it('exige icmpType en ICMP y port en TCP', () => {
    const from = { kind: 'instance', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });
});
