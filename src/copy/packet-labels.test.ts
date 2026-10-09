import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine';
import { actor, device, lab03Net, ping } from '@/testing';
import { endpointName, packetLabel, serviceLabel } from './packet-labels';

const NET = lab03Net();

describe('packet labels', () => {
  it('name the service, the source and the destination device', () => {
    const packet = ping(device('servidor1'), '172.31.38.97');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de servidor1 a servidor2');
  });

  it('name an actor, and the internet probe that is not on the map', () => {
    const packet = ping(actor('attacker'), '34.244.254.100');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de Atacante a servidor2');
    expect(endpointName(actor('probe-internet'), NET)).toBe('Internet');
  });

  it('keep the address when the packet reached no device', () => {
    const packet = ping(device('servidor1'), 'no-existe.example');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de servidor1 a no-existe.example');
  });

  it('tag Echo Reply and leave TCP plain', () => {
    expect(serviceLabel({ protocol: 'icmp', icmpType: 0 })).toBe('{{echo-reply}}');
    expect(serviceLabel({ protocol: 'tcp', port: 22 })).toBe('TCP 22');
  });
});
