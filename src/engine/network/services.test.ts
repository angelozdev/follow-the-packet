import { describe, expect, it } from 'vitest';
import { LOOPBACK_IP } from '@/engine/network/addressing/cidr';
import { tcpService } from '@/testing';
import { acceptingService, listensOn, lookupService } from './services';
import type { Process, Service } from './types';

const APP_PORT = 3000;
const NETWORK_IP = '192.168.1.11';
const PUBLIC_IP = '34.244.254.100';
const OTHER_LOOPBACK_IP = '127.5.5.5';
const LOOPBACK_IPS = [LOOPBACK_IP, OTHER_LOOPBACK_IP, '127.255.255.254'];
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

  it('a service on the loopback address accepts only a packet to 127.0.0.1', () => {
    expect(listensOn(onLoopback, LOOPBACK_IP)).toBe(true);
    expect(lookup([onLoopback], LOOPBACK_IP)).toBe('accepts');
    for (const ip of [OTHER_LOOPBACK_IP, ...NOT_LOOPBACK_IPS]) {
      expect(listensOn(onLoopback, ip), ip).toBe(false);
      expect(lookup([onLoopback], ip), ip).toBe('wrong-address');
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

describe('a service and its process', () => {
  const stopped: Process = { id: 'reports', name: 'reportes', running: false };
  const running: Process = { ...stopped, running: true };
  const fromReports: Service = { ...onAll, processId: stopped.id };

  it('a service of a stopped process does not listen', () => {
    expect(lookupService([fromReports], 'tcp', APP_PORT, NETWORK_IP, [stopped])).toBe('stopped');
    expect(acceptingService([fromReports], 'tcp', APP_PORT, NETWORK_IP, [stopped])).toBeUndefined();
    expect(lookupService([fromReports, onLoopback], 'tcp', APP_PORT, NETWORK_IP, [stopped])).toBe('wrong-address');
  });

  it('a service of a running process listens as before', () => {
    expect(lookupService([fromReports], 'tcp', APP_PORT, NETWORK_IP, [running])).toBe('accepts');
    expect(acceptingService([fromReports], 'tcp', APP_PORT, NETWORK_IP, [running])).toBe(fromReports);
  });

  it('a service with no process listens as before', () => {
    expect(lookupService([onAll], 'tcp', APP_PORT, NETWORK_IP, [stopped])).toBe('accepts');
    expect(lookupService([onAll], 'tcp', APP_PORT, NETWORK_IP)).toBe('accepts');
    expect(lookupService([], 'tcp', APP_PORT, NETWORK_IP, [stopped])).toBe('closed');
  });
});
