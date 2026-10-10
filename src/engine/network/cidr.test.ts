import { describe, expect, it } from 'vitest';
import { ipInCidr, isIpv4, isLoopbackIpv4, isPrivateCidr, isPrivateIpv4, parseCidr } from './cidr';

describe('isIpv4', () => {
  it('accepts valid IPs and rejects names and out-of-range octets', () => {
    expect(isIpv4('172.31.16.131')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv4('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com')).toBe(false);
  });
});

describe('isLoopbackIpv4', () => {
  it('accepts every 127.x.x.x address and nothing around the range', () => {
    expect(['127.0.0.1', '127.5.5.5', '127.255.255.255'].every(isLoopbackIpv4)).toBe(true);
    expect(['126.255.255.255', '128.0.0.1', '192.168.1.10'].some(isLoopbackIpv4)).toBe(false);
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

describe('isPrivateCidr', () => {
  it('accepts a range inside 10.0.0.0/8, 172.16.0.0/12 or 192.168.0.0/16 (RFC 1918)', () => {
    for (const range of ['192.168.1.0/24', '172.31.0.0/16', '10.0.0.0/8', '172.16.0.0/12']) expect(isPrivateCidr(range), range).toBe(true);
  });

  it('rejects a public range and a range that spills out of a private one', () => {
    for (const range of ['8.8.8.0/24', '172.32.0.0/16', '192.168.0.0/15', '172.0.0.0/11', '0.0.0.0/0']) expect(isPrivateCidr(range), range).toBe(false);
  });
});

describe('isPrivateIpv4', () => {
  it('knows the three private ranges of RFC 1918 and nothing else', () => {
    for (const ip of ['10.0.0.5', '172.16.0.1', '172.31.38.97', '192.168.1.10']) expect(isPrivateIpv4(ip), ip).toBe(true);
    for (const ip of ['172.32.0.1', '34.244.254.100', '203.0.113.66', '192.169.0.1']) expect(isPrivateIpv4(ip), ip).toBe(false);
  });
});
