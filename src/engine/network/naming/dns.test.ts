import { describe, expect, it } from 'vitest';
import { privateDnsName, publicDnsName, resolveName } from './dns';
import { OFFICE, lab03Net, officeNet } from '@/testing';

describe('EC2 DNS names', () => {
  it('follow the format seen in lab 03', () => {
    expect(publicDnsName('34.244.254.100', 'eu-west-1')).toBe('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com');
    expect(privateDnsName('172.31.38.97', 'eu-west-1')).toBe('ip-172-31-38-97.eu-west-1.compute.internal');
  });
});

describe('resolveName (lab 03, V3)', () => {
  const net = lab03Net();
  const publicName = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

  it('from inside the VPC, the public name gives the private IP', () => {
    expect(resolveName(net, publicName, true)).toBe('172.31.38.97');
  });

  it('from outside, the same name gives the public IP', () => {
    expect(resolveName(net, publicName, false)).toBe('34.244.254.100');
  });

  it('the private name does not resolve from outside', () => {
    expect(resolveName(net, 'ip-172-31-38-97.eu-west-1.compute.internal', false)).toBeNull();
  });

  it('an unknown name does not resolve', () => {
    expect(resolveName(net, 'no-existe.example', true)).toBeNull();
  });

  it('an office has no region, so no EC2 name resolves there', () => {
    expect(resolveName(officeNet(), privateDnsName(OFFICE.printer, 'eu-west-1'), true)).toBeNull();
  });
});
