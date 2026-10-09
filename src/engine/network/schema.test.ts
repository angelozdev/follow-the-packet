import { describe, expect, it } from 'vitest';
import { echoFrom, lab03Net, officeNet, withDevice, withInbound } from '@/testing';
import { networkSchema, packetSchema } from './schema';
import type { Firewall, Network } from './types';

const OS_FIREWALL: Firewall = { id: 'fw-os', name: 'os', kind: 'host-firewall', inbound: [], outbound: [] };
const SECURITY_GROUP: Firewall = { id: 'sg-x', name: 'x', kind: 'security-group', inbound: [], outbound: [] };

function problems(net: unknown): string[] {
  const result = networkSchema.safeParse(net);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

function withFirewall(net: Network, firewall: Firewall): Network {
  return { ...net, firewalls: [...net.firewalls, firewall] };
}

const BROKEN: [string, Network, string][] = [
  ['a VPC without a region', { ...lab03Net(), region: undefined }, 'a VPC needs a region'],
  ['a VPC without subnets', { ...lab03Net(), subnets: [] }, 'a VPC needs at least one subnet'],
  ['a private IP outside its subnet', withDevice(lab03Net(), 'servidor1', { privateIp: '172.31.38.5' }), 'servidor1: 172.31.38.5 is not in 172.31.16.0/20'],
  ['an EC2 instance without a Security Group', withDevice(lab03Net(), 'servidor1', { firewallIds: [] }), 'servidor1: a device in a VPC needs at least one Security Group'],
  ['a firewall that does not exist', withDevice(lab03Net(), 'servidor1', { firewallIds: ['sg-fantasma'] }), 'servidor1: firewall sg-fantasma does not exist'],
  ['an office with a region', { ...officeNet(), region: 'eu-west-1' }, 'an office network has no region'],
  ['an office with subnets', { ...officeNet(), subnets: [{ id: 'subnet-a', az: 'eu-west-1a', cidr: '192.168.1.0/25' }] }, 'an office network has no subnets'],
  ['an office device with a public IP', withDevice(officeNet(), 'printer', { publicIp: '54.78.154.66' }), 'printer: an office device has no public IP'],
  ['an office device in a subnet', withDevice(officeNet(), 'printer', { subnetId: 'subnet-a' }), 'printer: an office device has no subnet'],
  ['an office device outside the office range', withDevice(officeNet(), 'printer', { privateIp: '192.168.2.20' }), 'printer: 192.168.2.20 is not in 192.168.1.0/24'],
  ['an office with a public range', { ...officeNet(), cidr: '8.8.8.0/24' }, '8.8.8.0/24 is not a private range (RFC 1918)'],
  ['an office range wider than a private range', { ...officeNet(), cidr: '192.168.0.0/15' }, '192.168.0.0/15 is not a private range (RFC 1918)'],
  ['a Security Group in an office', withFirewall(officeNet(), SECURITY_GROUP), 'sg-x: an office firewall is a host firewall'],
  [
    'a host firewall with a Security Group as Source',
    withFirewall(lab03Net(), { ...OS_FIREWALL, inbound: [echoFrom('echo', 'sg-servidor1')] }),
    'fw-os/echo: only a Security Group takes a Security Group as source',
  ],
  [
    'a Security Group whose Source is a host firewall',
    withInbound(withFirewall(lab03Net(), OS_FIREWALL), 'sg-servidor2', echoFrom('echo', 'fw-os')),
    'sg-servidor2/echo: fw-os is not a Security Group of this network',
  ],
  [
    'a device whose firewalls mix kinds',
    withDevice(withFirewall(officeNet(), SECURITY_GROUP), 'your-laptop', { firewallIds: ['fw-lucia', 'sg-x'] }),
    'your-laptop: its firewalls mix kinds',
  ],
];

describe('networkSchema', () => {
  it('accepts the lab 03 VPC and the chapter 1 office', () => {
    expect(problems(lab03Net())).toEqual([]);
    expect(problems(officeNet())).toEqual([]);
  });

  it('accepts an office whose laptop has its host firewall', () => {
    expect(problems(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }))).toEqual([]);
  });

  it.each(BROKEN)('rejects %s', (_name, net, message) => {
    expect(problems(net)).toContain(message);
  });
});

describe('packetSchema', () => {
  it('requires icmpType for ICMP and port for TCP', () => {
    const from = { kind: 'device', id: 'servidor1' } as const;
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'tcp' }).success).toBe(false);
    expect(packetSchema.safeParse({ from, to: '172.31.38.97', protocol: 'icmp', icmpType: 8 }).success).toBe(true);
  });
});
