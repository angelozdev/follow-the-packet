import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine';
import { EVERY_TERM, OFFICE_FLOORS, actor, device, lab03Net, officeTwoFloorsNet, ping } from '@/testing';
import { OUTCOME_TEXT, describeOutcome, deviceName, endpointName, packetLabel, packetMessage, roundTripText, serviceLabel, stampLabel, warningOf } from './packet-labels';
import { termsIn, toPlainText } from './term-text';
import type { TermId } from './terms';

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

  it('names the stamp of a warning for a screen reader', () => {
    const label = stampLabel('ping de tu-laptop a 192.168.1.99', 'warned');
    expect(label).toBe('Paquete: ping de tu-laptop a 192.168.1.99. Apareció un aviso.');
    const others = (['arrived', 'blocked', 'lost', 'intruder'] as const).map((state) => stampLabel('ping de tu-laptop a 192.168.1.99', state));
    expect(others).not.toContain(label);
    expect(label).not.toMatch(/windows|linux|macos|arp|destination|unreachable|time exceeded|ttl|icmp|router/i);
  });

  it('names each notice by its term, and a net unreachable by the host one, which shares its ICMP type', () => {
    const from = device('your-laptop');
    expect(warningOf({ kind: 'host-unreachable', fromId: 'router-office', fromIp: '192.168.1.1' }, { from })).toMatchObject({ term: 'host-unreachable' });
    expect(warningOf({ kind: 'net-unreachable', fromId: 'router-office', fromIp: '192.168.1.1' }, { from })).toMatchObject({ term: 'host-unreachable' });
    expect(warningOf({ kind: 'time-exceeded', fromId: 'router-office', fromIp: '192.168.1.1' }, { from })).toMatchObject({ term: 'time-exceeded' });
  });

  it('says that a warning comes from the sender only when its own device generated it, and from a router otherwise', () => {
    const floors = officeTwoFloorsNet();
    const own = simulate(floors, ping(device('your-laptop'), OFFICE_FLOORS.floor1.nobody));
    const routed = simulate(floors, { ...ping(device('your-laptop'), OFFICE_FLOORS.server.ip), ttl: 1 });
    expect(warningOf(own.notice!, { from: device('your-laptop') })).toEqual({ term: 'host-unreachable', by: 'sender' });
    expect(warningOf(routed.notice!, { from: device('your-laptop') })).toEqual({ term: 'time-exceeded', by: 'router' });
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

  it('says that a packet with no way out never left the device, and that a warning came back for an IP nobody has', () => {
    const floors = officeTwoFloorsNet();
    const stays = simulate(floors, ping(device('guest-laptop'), OFFICE_FLOORS.floor1.lucia));
    const warned = simulate(floors, ping(device('your-laptop'), OFFICE_FLOORS.floor1.nobody));
    expect([stays.outcome, warned.outcome]).toEqual(['no-route', 'unreachable']);
    expect(OUTCOME_TEXT[stays.outcome]).toBe('No salió del dispositivo: no tiene por dónde sacar el paquete.');
    expect(OUTCOME_TEXT[warned.outcome]).toBe('No llegó: volvió un aviso de que no se pudo llegar al destino.');
    expect([...termsIn(OUTCOME_TEXT['no-route']), ...termsIn(OUTCOME_TEXT.unreachable)]).toEqual([]);
  });

  it('says that a router dropped the packet when its TTL reached zero, and names a router and a server of the internet', () => {
    const floors = officeTwoFloorsNet();
    const expired = simulate(floors, { ...ping(device('your-laptop'), OFFICE_FLOORS.server.ip), ttl: 1 });
    expect(expired.outcome).toBe('ttl-exceeded');
    expect(OUTCOME_TEXT[expired.outcome]).toBe('No llegó: el {{ttl}} llegó a 0 en un {{router}}, que lo {{drop|descartó}} y avisó con {{time-exceeded}}.');
    expect(termsIn(OUTCOME_TEXT['ttl-exceeded'])).toEqual(['ttl', 'router', 'drop', 'time-exceeded']);
    expect([OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.server.id].map((id) => deviceName(floors, id))).toEqual(['[[router-office]]', '[[servidor-internet]]']);
    const answered = ping(device('your-laptop'), OFFICE_FLOORS.server.ip);
    expect(packetLabel(answered, simulate(floors, answered), floors)).toBe('{{ping}} de [[tu-laptop]] a [[servidor-internet]]');
  });
});

describe('describeOutcome', () => {
  const without = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));

  it('says only that a packet arrived while Echo Reply is not a known term', () => {
    expect(describeOutcome('replied', without('echo-reply'))).toBe('Llegó.');
    expect(describeOutcome('replied', EVERY_TERM)).toBe(OUTCOME_TEXT.replied);
  });

  it('says only that the packet did not reach its destination while the warning that came back is not a known term, never that nothing came back', () => {
    expect(describeOutcome('unreachable', without('host-unreachable'))).toBe('No llegó a su destino.');
    expect(describeOutcome('ttl-exceeded', without('time-exceeded'))).toBe('No llegó a su destino.');
    expect(describeOutcome('unreachable', EVERY_TERM)).toBe(OUTCOME_TEXT.unreachable);
    expect(describeOutcome('ttl-exceeded', EVERY_TERM)).toBe(OUTCOME_TEXT['ttl-exceeded']);
  });

  it('keeps the text of every other outcome whatever the player knows', () => {
    const none = new Set<TermId>();
    for (const outcome of ['timeout', 'refused', 'arrived-no-reply', 'unresolved', 'invalid-address', 'no-route', 'lost'] as const) {
      expect(describeOutcome(outcome, none)).toBe(OUTCOME_TEXT[outcome]);
    }
  });
});


describe('roundTripText', () => {
  it('writes the time the engine gives in milliseconds, with the decimal comma', () => {
    expect(roundTripText(84)).toBe('84 ms');
    expect(roundTripText(0.05)).toBe('0,05 ms');
    expect(roundTripText(2.5)).toBe('2,5 ms');
  });

  it('drops the noise that adding decimals leaves, and never rounds a figure the engine gave', () => {
    expect(roundTripText(0.1 + 0.2)).toBe('0,3 ms');
    expect(roundTripText(0.125)).toBe('0,125 ms');
  });
});
