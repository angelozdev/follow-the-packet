import { describe, expect, it } from 'vitest';
import { echoFrom, sshFromYou } from '@/testing';
import { checkRules, matchesPeer, matchesWhat } from './rules';
import type { SecurityGroup } from '@/engine/network/types';

const echoRequest = { protocol: 'icmp', icmpType: 8 } as const;
const echoReply = { protocol: 'icmp', icmpType: 0 } as const;

describe('matchesWhat', () => {
  it('lab 03, V5: an Echo Reply rule does not match an Echo Request', () => {
    expect(matchesWhat({ kind: 'icmp', icmpType: 0 }, echoRequest)).toBe(false);
    expect(matchesWhat({ kind: 'icmp', icmpType: 8 }, echoRequest)).toBe(true);
    expect(matchesWhat({ kind: 'icmp', icmpType: 'all' }, echoReply)).toBe(true);
  });

  it('lab 03, step 3: SSH (TCP 22) does not match a ping', () => {
    expect(matchesWhat({ kind: 'tcp', fromPort: 22, toPort: 22 }, echoRequest)).toBe(false);
  });

  it('respects port ranges and "all traffic"', () => {
    expect(matchesWhat({ kind: 'tcp', fromPort: 1000, toPort: 2000 }, { protocol: 'tcp', port: 1500 })).toBe(true);
    expect(matchesWhat({ kind: 'tcp', fromPort: 1000, toPort: 2000 }, { protocol: 'udp', port: 1500 })).toBe(false);
    expect(matchesWhat({ kind: 'all' }, { protocol: 'udp', port: 53 })).toBe(true);
  });
});

describe('matchesPeer', () => {
  it('a CIDR compares the IP; a security group compares membership', () => {
    expect(matchesPeer({ kind: 'cidr', cidr: '198.51.100.7/32' }, { ip: '198.51.100.7', sgIds: [] })).toBe(true);
    expect(matchesPeer({ kind: 'sg', sgId: 'sg-servidor1' }, { ip: '172.31.16.131', sgIds: ['sg-servidor1'] })).toBe(true);
    expect(matchesPeer({ kind: 'sg', sgId: 'sg-servidor1' }, { ip: '172.31.16.131', sgIds: [] })).toBe(false);
  });
});

describe('checkRules', () => {
  const groups: SecurityGroup[] = [
    { id: 'sg-a', name: 'a', inbound: [sshFromYou('ssh')], outbound: [] },
    { id: 'sg-b', name: 'b', inbound: [echoFrom('echo', 'sg-servidor1')], outbound: [] },
  ];

  it('the rules of several security groups add up: one matching both what and from is enough', () => {
    const result = checkRules(groups, 'inbound', echoRequest, { ip: '172.31.16.131', sgIds: ['sg-servidor1'] });
    expect(result.allowed).toBe(true);
    expect(result.checks).toEqual([
      { sgId: 'sg-a', ruleId: 'ssh', what: false, from: false },
      { sgId: 'sg-b', ruleId: 'echo', what: true, from: true },
    ]);
  });

  it('lab 03, V4: your IP is in the SSH rule, but the ping does not match on what', () => {
    const result = checkRules(groups, 'inbound', echoRequest, { ip: '198.51.100.7', sgIds: [] });
    expect(result.allowed).toBe(false);
    expect(result.checks[0]).toEqual({ sgId: 'sg-a', ruleId: 'ssh', what: false, from: true });
  });

  it('with no rules nothing gets through (a security group only allows)', () => {
    expect(checkRules([], 'inbound', echoRequest, { ip: '1.2.3.4', sgIds: [] })).toEqual({ allowed: false, checks: [] });
  });
});
