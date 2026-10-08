import { describe, expect, it } from 'vitest';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

describe('isIpv4', () => {
  it('accepts valid IPs and rejects names and out-of-range octets', () => {
    expect(isIpv4('172.31.16.131')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv4('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com')).toBe(false);
  });
});

describe('ipInCidr', () => {
  it('places lab 03 IPs in their subnets', () => {
    expect(ipInCidr('172.31.38.97', '172.31.0.0/16')).toBe(true);
    expect(ipInCidr('172.31.38.97', '172.31.32.0/20')).toBe(true);
    expect(ipInCidr('172.31.16.131', '172.31.32.0/20')).toBe(false);
  });

  it('0.0.0.0/0 includes any IP and /32 only one', () => {
    expect(ipInCidr('203.0.113.66', '0.0.0.0/0')).toBe(true);
    expect(ipInCidr('198.51.100.7', '198.51.100.7/32')).toBe(true);
    expect(ipInCidr('198.51.100.8', '198.51.100.7/32')).toBe(false);
  });
});

describe('parseCidr', () => {
  it('reads the base address and the prefix', () => {
    expect(parseCidr('172.31.0.0/16').prefix).toBe(16);
    expect(parseCidr('0.0.0.0/0').prefix).toBe(0);
  });

  it('rejects anything that is not address/prefix with a prefix from 0 to 32', () => {
    for (const bad of ['10.0.0.0/33', '10.0.0.0', '10.0.0.0/', '10.0.0.0/ 8', '10.0.0.0/8/9', ' 10.0.0.0/8', '10.0.0/8']) {
      expect(() => parseCidr(bad), bad).toThrow('invalid CIDR');
    }
  });
});
