import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine';
import { actor, device, lab03Net, ping } from '@/testing';
import { OUTCOME_TEXT, deviceName, endpointName, packetLabel, packetMessage, serviceLabel, stampLabel } from './packet-labels';
import { termsIn, toPlainText } from './term-text';

const NET = lab03Net();

describe('packet labels', () => {
  it('name the service, the source and the destination device', () => {
    const packet = ping(device('servidor1'), '172.31.38.97');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de [[servidor1]] a [[servidor2]]');
  });

  it('name an actor, and the internet probe that is not on the map', () => {
    const packet = ping(actor('attacker'), '34.244.254.100');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de [[Atacante]] a [[servidor2]]');
    expect(endpointName(actor('probe-internet'), NET)).toBe('Internet');
  });

  it('mark the name of a device, or the id that stands for it when the network has no such device', () => {
    expect(deviceName(NET, 'servidor1')).toBe('[[servidor1]]');
    expect(deviceName(NET, 'ghost')).toBe('[[ghost]]');
  });

  it('keep the address when the packet reached no device', () => {
    const packet = ping(device('servidor1'), 'no-existe.example');
    expect(packetLabel(packet, simulate(NET, packet), NET)).toBe('{{ping}} de [[servidor1]] a no-existe.example');
  });

  it('draw an Echo Reply as a reply, and an Echo Request or any other packet as a request', () => {
    expect(packetMessage({ protocol: 'icmp', icmpType: 0 })).toBe('echo-reply');
    expect(packetMessage({ protocol: 'icmp', icmpType: 8 })).toBe('echo-request');
    expect(packetMessage({ protocol: 'tcp' })).toBe('echo-request');
  });

  it('name a stamp by its packet and by how it ended, so a screen reader tells ✓, ✕ and ? apart', () => {
    const labels = (['arrived', 'blocked', 'lost', 'intruder'] as const).map((state) => stampLabel('ping de tu-laptop a impresora', state));
    expect(labels[0]).toBe('Paquete: ping de tu-laptop a impresora. Llegó.');
    expect(new Set(labels).size).toBe(4);
  });

  it('tag Echo Reply and leave TCP plain', () => {
    expect(serviceLabel({ protocol: 'icmp', icmpType: 0 })).toBe('{{echo-reply}}');
    expect(serviceLabel({ protocol: 'tcp', port: 22 })).toBe('TCP 22');
  });

  it('says that an invalid address never left the device', () => {
    const packet = ping(device('servidor1'), '172.31.38.300');
    const trace = simulate(NET, packet);
    expect(trace.outcome).toBe('invalid-address');
    expect(OUTCOME_TEXT[trace.outcome]).toBe('No salió del dispositivo: la dirección no es una {{ipv4}} válida.');
    expect(termsIn(OUTCOME_TEXT['invalid-address'])).toEqual(['ipv4']);
    expect(toPlainText(OUTCOME_TEXT['invalid-address'])).not.toMatch(/dns|nombre/i);
  });
});
