import { describe, expect, it } from 'vitest';
import { lab03Net } from '@/testing';
import { formatPeer, formatWhat } from './rule-labels';

describe('rule labels', () => {
  it('describes what a rule allows in plain words', () => {
    expect(formatWhat({ kind: 'icmp', icmpType: 8 })).toBe('ICMP · Echo Request');
    expect(formatWhat({ kind: 'icmp', icmpType: 0 })).toBe('ICMP · Echo Reply');
    expect(formatWhat({ kind: 'tcp', fromPort: 22, toPort: 22 })).toBe('TCP 22');
    expect(formatWhat({ kind: 'all' })).toBe('Todo el tráfico');
  });

  it('describes where a rule allows from, by security group name or by CIDR', () => {
    const net = lab03Net();
    expect(formatPeer({ kind: 'sg', sgId: 'sg-servidor1' }, net)).toBe('SG servidor1');
    expect(formatPeer({ kind: 'cidr', cidr: '0.0.0.0/0' }, net)).toBe('0.0.0.0/0');
  });
});
