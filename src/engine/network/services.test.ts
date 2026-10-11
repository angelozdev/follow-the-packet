import { describe, expect, it } from 'vitest';
import { tcpService } from '@/testing';
import { listensOn, lookupService } from './services';
import type { Service } from './types';

const APP_PORT = 3000;
const NETWORK_IP = '192.168.1.11';
const PUBLIC_IP = '34.244.254.100';
const LOOPBACK_IPS = ['127.0.0.1', '127.5.5.5', '127.255.255.254'];
const NOT_LOOPBACK_IPS = ['126.255.255.255', '128.0.0.1', NETWORK_IP, PUBLIC_IP];

const onAll = tcpService(APP_PORT);
const onLoopback = tcpService(APP_PORT, 'loopback');
const lookup = (services: Service[], ip: string, protocol: Service['protocol'] = 'tcp', port = APP_PORT) => lookupService(services, protocol, port, ip);

describe('lookupService', () => {
  it('a service on all addresses accepts a packet to any IP of the device', () => {
    for (const ip of [NETWORK_IP, PUBLIC_IP, ...LOOPBACK_IPS]) {
      expect(listensOn(onAll, ip), ip).toBe(true);
      expect(lookup([onAll], ip), ip).toBe('accepts');
    }
  });

  it('a service on the loopback address accepts only a packet to 127.x.x.x', () => {
    for (const ip of LOOPBACK_IPS) {
      expect(listensOn(onLoopback, ip), ip).toBe(true);
      expect(lookup([onLoopback], ip), ip).toBe('accepts');
    }
    for (const ip of NOT_LOOPBACK_IPS) {
      expect(listensOn(onLoopback, ip), ip).toBe(false);
      expect(lookup([onLoopback], ip), ip).not.toBe('accepts');
    }
  });

  it('a service on the loopback address refuses a packet to the IP of the device on the network', () => {
    expect(lookup([onLoopback], NETWORK_IP)).toBe('wrong-address');
    expect(lookup([onLoopback], PUBLIC_IP)).toBe('wrong-address');
  });

  it('a port nobody listens on is closed, whatever the IP', () => {
    expect(lookup([], NETWORK_IP)).toBe('closed');
    expect(lookup([onAll], NETWORK_IP, 'tcp', APP_PORT + 1)).toBe('closed');
    expect(lookup([onLoopback], '127.0.0.1', 'tcp', APP_PORT + 1)).toBe('closed');
  });

  it('a service answers only the protocol it listens on', () => {
    const dns: Service = { protocol: 'udp', port: 53, listen: 'all' };
    expect(lookup([dns], NETWORK_IP, 'udp', 53)).toBe('accepts');
    expect(lookup([dns], NETWORK_IP, 'tcp', 53)).toBe('closed');
    expect(lookup([onAll], NETWORK_IP, 'udp', APP_PORT)).toBe('closed');
  });

  it('a port with a service on every address and another on the loopback address accepts any IP', () => {
    expect(lookup([onLoopback, onAll], NETWORK_IP)).toBe('accepts');
    expect(lookup([onAll, onLoopback], '127.0.0.1')).toBe('accepts');
  });
});
