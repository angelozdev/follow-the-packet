import { describe, expect, it } from 'vitest';
import { lab03Net, withInstance } from '@/testing';
import { networkSchema, packetSchema } from './schema';

describe('networkSchema', () => {
  it('accepts the lab 03 network', () => {
    expect(networkSchema.safeParse(lab03Net()).success).toBe(true);
  });

  it('rejects a private IP outside its subnet', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' });
    const result = networkSchema.safeParse(bad);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('is not in 172.31.16.0/20');
  });

  it('rejects a security group that does not exist', () => {
    const bad = withInstance(lab03Net(), 'servidor1', { sgIds: ['sg-fantasma'] });
    expect(networkSchema.safeParse(bad).success).toBe(false);
  });
});

describe('packetSchema', () => {
  it('requires icmpType for ICMP and port for TCP', () => {
    const from = { kind: 'instance', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });
});
