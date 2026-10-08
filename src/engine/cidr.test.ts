import { describe, expect, it } from 'vitest';
import { ipInCidr, isIpv4, parseCidr } from './cidr';

describe('isIpv4', () => {
  it('acepta IPs válidas y rechaza nombres y octetos fuera de rango', () => {
    expect(isIpv4('172.31.16.131')).toBe(true);
    expect(isIpv4('256.1.1.1')).toBe(false);
    expect(isIpv4('ec2-34-244-254-100.eu-west-1.compute.amazonaws.com')).toBe(false);
  });
});

describe('ipInCidr', () => {
  it('ubica IPs del lab 03 en sus subredes', () => {
    expect(ipInCidr('172.31.38.97', '172.31.0.0/16')).toBe(true);
    expect(ipInCidr('172.31.38.97', '172.31.32.0/20')).toBe(true);
    expect(ipInCidr('172.31.16.131', '172.31.32.0/20')).toBe(false);
  });

  it('0.0.0.0/0 incluye cualquier IP y /32 solo una', () => {
    expect(ipInCidr('203.0.113.66', '0.0.0.0/0')).toBe(true);
    expect(ipInCidr('198.51.100.7', '198.51.100.7/32')).toBe(true);
    expect(ipInCidr('198.51.100.8', '198.51.100.7/32')).toBe(false);
  });
});

describe('parseCidr', () => {
  it('rechaza prefijos inválidos', () => {
    expect(() => parseCidr('10.0.0.0/33')).toThrow('CIDR inválido');
    expect(() => parseCidr('10.0.0.0')).toThrow('CIDR inválido');
  });
});
