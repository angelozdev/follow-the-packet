import { describe, expect, it } from 'vitest';
import { ROUTE_DEFAULT, applyAction, simulate, simulateSequence, type Network } from '@/engine';
import { EVERY_TERM, NAME_SERVER_PIECES, OFFICE_FLOORS, actor, device, dig, lab03Net, officeTwoFloorsNet, officeWithNames, ping, tcp, tcpService, withDevice } from '@/testing';
import { OUTCOME_TEXT, describeOutcome, describeResult, deviceName, endpointName, isProblemStamp, packetLabel, packetMessage, packetPortLabels, packetShape, replyShape, roundTripText, serviceLabel, stampLabel, stampOf, tracerouteLabel, warningOf, type StampResult } from './packet-labels';
import { MAP_TEXT } from './screens/incident-ui';
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

  it('pings to 127.0.0.1, localhost and your own IP have different labels, each with the destination as the player wrote it', () => {
    const floors = officeTwoFloorsNet();
    const { you } = OFFICE_FLOORS.floor1;
    const labels = ['127.0.0.1', 'localhost', you, OFFICE_FLOORS.floor1.printer].map((to) => {
      const packet = ping(device('your-laptop'), to);
      return packetLabel(packet, simulate(floors, packet), floors);
    });
    expect(labels).toEqual(['{{ping}} de [[tu-laptop]] a 127.0.0.1', '{{ping}} de [[tu-laptop]] a localhost', `{{ping}} de [[tu-laptop]] a ${you}`, '{{ping}} de [[tu-laptop]] a [[impresora]]']);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('draw an Echo Reply as a reply, and an Echo Request or any other packet as a request', () => {
    expect(packetMessage({ protocol: 'icmp', icmpType: 0 })).toBe('echo-reply');
    expect(packetMessage({ protocol: 'icmp', icmpType: 8 })).toBe('echo-request');
    expect(packetMessage({ protocol: 'tcp' })).toBe('echo-request');
  });

  it('draw every protocol with its own shape, and the answer to a request with the shape of its protocol', () => {
    expect(packetShape({ protocol: 'icmp', icmpType: 8 })).toBe('echo-request');
    expect(packetShape({ protocol: 'icmp', icmpType: 0 })).toBe('echo-reply');
    expect(packetShape({ protocol: 'tcp' })).toBe('tcp-request');
    expect(packetShape({ protocol: 'udp' })).toBe('udp-request');
    expect((['echo-request', 'tcp-request', 'udp-request', 'echo-reply'] as const).map(replyShape)).toEqual(['echo-reply', 'tcp-reply', 'udp-reply', 'echo-reply']);
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

  it('names a +N for a screen reader with the stamps it hides first and the stamps of its place after', () => {
    expect(MAP_TEXT.moreStamps(2, 4)).toBe('2 sellos más. Abre la lista de los 4 sellos de este lugar.');
    expect(MAP_TEXT.moreStamps(12, 14)).toBe('12 sellos más. Abre la lista de los 14 sellos de este lugar.');
  });

  it('names a +N that hides a problem with the name of its list and then the states that count as a problem, in the words of the stamps and with no term', () => {
    const name = MAP_TEXT.moreStampsWithProblem(2, 5);
    expect(name.startsWith(MAP_TEXT.moreStamps(2, 5))).toBe(true);
    const sentence = name.slice(MAP_TEXT.moreStamps(2, 5).length).trim();
    expect(sentence).toBe(MAP_TEXT.hiddenProblem);
    const words = { blocked: 'bloqueado', lost: 'perdido', warned: 'aviso', intruder: 'entró y no debía' };
    const problems = (['arrived', 'blocked', 'lost', 'intruder', 'warned'] as const).filter(isProblemStamp);
    expect([...problems].sort()).toEqual(Object.keys(words).sort());
    for (const word of Object.values(words)) expect(sentence.toLowerCase()).toContain(word);
    expect(sentence.toLowerCase()).not.toContain('llegó');
    expect(termsIn(sentence)).toEqual([]);
    expect(toPlainText(sentence)).toBe(sentence);
  });

  it('a stamp is a problem when it is blocked, lost, warned or an intruder, and not when it arrived', () => {
    expect((['blocked', 'lost', 'warned', 'intruder'] as const).map(isProblemStamp)).toEqual([true, true, true, true]);
    expect(isProblemStamp('arrived')).toBe(false);
  });

  it('the state of a stamp comes from the result as it did before it moved here: a warning first, then reached, an intruder if it was not meant to, then blocked or lost', () => {
    const result = (changes: Partial<StampResult>): StampResult => ({ intruder: false, reached: false, blocked: false, warning: null, ...changes });
    const warning = { term: 'time-exceeded', by: 'router' } as const;
    expect(stampOf(result({ warning, reached: true, intruder: true, blocked: true }))).toBe('warned');
    expect(stampOf(result({ warning: { term: null, by: 'sender' } }))).toBe('warned');
    expect(stampOf(result({ reached: true }))).toBe('arrived');
    expect(stampOf(result({ reached: true, blocked: true }))).toBe('arrived');
    expect(stampOf(result({ reached: true, intruder: true, blocked: true }))).toBe('intruder');
    expect(stampOf(result({ blocked: true }))).toBe('blocked');
    expect(stampOf(result({ blocked: true, intruder: true }))).toBe('blocked');
    expect(stampOf(result({}))).toBe('lost');
    expect(stampOf(result({ intruder: true }))).toBe('lost');
  });

  it('names each notice by its term, and a net unreachable by none until its own term is known', () => {
    const from = device('your-laptop');
    expect(warningOf({ kind: 'host-unreachable', fromId: 'router-office', fromIp: '192.168.1.1' }, { from })).toMatchObject({ term: 'host-unreachable' });
    expect(warningOf({ kind: 'net-unreachable', fromId: 'router-office', fromIp: '192.168.1.1' }, { from })).toMatchObject({ term: null });
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

  it('names a packet by the term packet while ping is not a known term, and by ping once it is', () => {
    const packet = ping(device('servidor1'), '172.31.38.97');
    const trace = simulate(NET, packet);
    expect(packetLabel(packet, trace, NET, new Set<TermId>(['packet']))).toBe('{{packet}} de [[servidor1]] a [[servidor2]]');
    expect(packetLabel(packet, trace, NET, new Set<TermId>(['packet', 'ping']))).toBe('{{ping}} de [[servidor1]] a [[servidor2]]');
    expect(serviceLabel({ protocol: 'icmp', icmpType: 0 }, new Set<TermId>(['packet']))).toBe('{{packet}}');
    expect(serviceLabel({ protocol: 'icmp', icmpType: 0 }, new Set<TermId>(['echo-reply']))).toBe('{{echo-reply}}');
    expect(serviceLabel({ protocol: 'tcp', port: 22 }, new Set<TermId>())).toBe('TCP 22');
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
    expect(OUTCOME_TEXT[warned.outcome]).toBe('No llegó. Apareció un aviso: no se pudo llegar al destino.');
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

describe('tracerouteLabel', () => {
  const floors = officeTwoFloorsNet();
  const probe = { ...ping(device('your-laptop'), OFFICE_FLOORS.server.ip), ttl: 3 };
  const trace = simulate(floors, probe);

  it('names a traceroute as what it is, and not as the ping its last probe is', () => {
    expect(tracerouteLabel(probe, trace, floors, EVERY_TERM)).toBe('{{traceroute}} de [[tu-laptop]] a 198.51.100.50');
    expect(packetLabel(probe, trace, floors, EVERY_TERM)).toBe('{{ping}} de [[tu-laptop]] a 198.51.100.50');
  });

  it('names the device it reached, as a packet is named, and says packet while the term traceroute is unknown', () => {
    const reached = ping(device('your-laptop'), OFFICE_FLOORS.server.ip);
    expect(tracerouteLabel(reached, simulate(floors, reached), floors)).toBe('{{traceroute}} de [[tu-laptop]] a [[servidor-internet]]');
    expect(tracerouteLabel(probe, trace, floors, new Set<TermId>(['packet']))).toBe('{{packet}} de [[tu-laptop]] a 198.51.100.50');
  });
});

describe('describeOutcome', () => {
  const without = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));

  it('says only that a packet arrived while Echo Reply is not a known term', () => {
    expect(describeOutcome('replied', without('echo-reply'))).toBe('Llegó.');
    expect(describeOutcome('replied', EVERY_TERM)).toBe(OUTCOME_TEXT.replied);
    expect(describeOutcome('replied', without('echo-reply'), '[[impresora]]')).toBe('Llegó a [[impresora]].');
    expect(describeOutcome('replied', EVERY_TERM, '[[impresora]]')).toBe(OUTCOME_TEXT.replied);
  });

  it('says only that the packet did not reach its destination while the warning that came back is not a known term, never that nothing came back', () => {
    expect(describeOutcome('unreachable', without('host-unreachable'))).toBe('No llegó a su destino.');
    expect(describeOutcome('ttl-exceeded', without('time-exceeded'))).toBe('No llegó a su destino.');
    expect(describeOutcome('unreachable', EVERY_TERM)).toBe(OUTCOME_TEXT.unreachable);
    expect(describeOutcome('ttl-exceeded', EVERY_TERM)).toBe(OUTCOME_TEXT['ttl-exceeded']);
  });

  it('says that a router discarded the packet at TTL 0 in plain words, with the term drop only once it is known', () => {
    const early = describeOutcome('ttl-exceeded', without('drop'));
    expect(early).toBe('No llegó: el {{ttl}} llegó a 0 en un {{router}}, que lo descartó y avisó con {{time-exceeded}}.');
    expect(termsIn(early)).toEqual(['ttl', 'router', 'time-exceeded']);
    expect(describeOutcome('ttl-exceeded', without('drop', 'time-exceeded'))).toBe('No llegó a su destino.');
  });

  it('says that the waiting time passed and nothing came back, with the term timeout only once it is known', () => {
    expect(describeOutcome('timeout', without('timeout'))).toBe('Pasó el tiempo de espera y no volvió nada.');
    expect(describeOutcome('timeout', EVERY_TERM)).toBe(OUTCOME_TEXT.timeout);
    expect(OUTCOME_TEXT.timeout).toBe('{{timeout}}: pasó el tiempo de espera y no volvió nada.');
    expect(toPlainText(OUTCOME_TEXT.timeout)).not.toMatch(/No llegó/);
  });

  it('keeps the text of every other outcome whatever the player knows', () => {
    const none = new Set<TermId>();
    for (const outcome of ['refused', 'arrived-no-reply', 'unresolved', 'invalid-address', 'no-route', 'lost'] as const) {
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

const APP_PORT = 3000;
const WEB_PORT = 80;
const serving = (listen: 'all' | 'loopback' = 'all'): Network => withDevice(officeTwoFloorsNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [tcpService(APP_PORT, listen)] } });
const withoutTerms = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));

describe('the label of a packet with ports', () => {
  const floors = officeTwoFloorsNet();
  const { server } = OFFICE_FLOORS;
  const toLucia = tcp(device('your-laptop'), OFFICE_FLOORS.floor1.lucia, APP_PORT);
  const toServer = tcp(device('your-laptop'), server.ip, WEB_PORT);

  it('a tcp packet is labelled with its protocol and ports', () => {
    expect(packetLabel(toLucia, simulate(serving(), toLucia), serving())).toBe('{{tcp}} 51514 → 3000 de [[tu-laptop]] a [[laptop-lucia]]');
    expect(packetLabel(toServer, simulate(floors, toServer), floors, EVERY_TERM)).toBe('{{tcp}} 51514 → 80 de [[tu-laptop]] a [[servidor-internet]]');
    const named = officeWithNames();
    const question = dig(device('your-laptop'), `www.${NAME_SERVER_PIECES.zone}`);
    expect(packetLabel(question, simulate(named, question), named, EVERY_TERM)).toBe('{{udp}} 51514 → 53 de [[tu-laptop]] a [[servidor-dns]]');
    const given = { ...toLucia, sourcePort: 40000 };
    expect(packetLabel(given, simulate(serving(), given), serving())).toBe('{{tcp}} 40000 → 3000 de [[tu-laptop]] a [[laptop-lucia]]');
  });

  it('the label of a packet names its protocol only once the term of the protocol is known', () => {
    const trace = simulate(serving(), toLucia);
    const label = (known: ReadonlySet<TermId>) => packetLabel(toLucia, trace, serving(), known);
    expect(label(withoutTerms('tcp'))).toBe('{{packet}} al {{port|puerto}} 3000 de [[tu-laptop]] a [[laptop-lucia]]');
    expect(label(withoutTerms('tcp', 'port'))).toBe('{{packet}} de [[tu-laptop]] a [[laptop-lucia]]');
    expect(label(withoutTerms('source-port'))).toBe('{{tcp}} 3000 de [[tu-laptop]] a [[laptop-lucia]]');
    const question = dig(device('your-laptop'), `www.${NAME_SERVER_PIECES.zone}`);
    const named = officeWithNames();
    expect(packetLabel(question, simulate(named, question), named, withoutTerms('udp'))).toBe('{{packet}} al {{port|puerto}} 53 de [[tu-laptop]] a [[servidor-dns]]');
  });

  it('a translated packet is labelled with its private source port before the router and its public source port after it', () => {
    const fromLucia = { ...toServer, from: device('lucia-laptop') };
    const [first, second] = simulateSequence(floors, [{ packet: toServer, at: 0 }, { packet: fromLucia, at: 0 }]);
    const requests = (packet: typeof toServer, trace: typeof first, known?: ReadonlySet<TermId>) => packetPortLabels(packet, trace, known)?.map(({ request }) => request);
    expect(packetLabel(toServer, first, floors)).toBe('{{tcp}} 51514 → 80 de [[tu-laptop]] a [[servidor-internet]]');
    expect(requests(toServer, first)).toEqual(['{{tcp}} 51514 → 80', '{{tcp}} 40001 → 80']);
    expect(requests(fromLucia, second)).toEqual(['{{tcp}} 51514 → 80', '{{tcp}} 40002 → 80']);
    expect(requests(toServer, first, withoutTerms('tcp'))).toEqual(['{{packet}} al {{port|puerto}} 80', '{{packet}} al {{port|puerto}} 80']);
  });

  it('a packet that is not translated keeps one label along its whole path', () => {
    const inside = simulate(serving(), toLucia);
    expect(inside).not.toHaveProperty('translation');
    expect(packetPortLabels(toLucia, inside)?.map(({ request }) => request)).toEqual(['{{tcp}} 51514 → 3000']);
    const pinged = ping(device('your-laptop'), server.ip);
    const trace = simulate(floors, pinged);
    expect(trace.translation?.protocol).toBe('icmp');
    expect(trace.translation?.outside).toEqual({ ip: OFFICE_FLOORS.officeRouter.uplink });
    expect(packetPortLabels(pinged, trace)).toBeNull();
    expect(packetLabel(pinged, trace, floors)).toBe('{{ping}} de [[tu-laptop]] a [[servidor-internet]]');
    const vpc = lab03Net();
    const ssh = tcp(device('servidor1'), '172.31.38.97', 22);
    expect(packetPortLabels(ssh, simulate(vpc, ssh))).toBeNull();
    expect(packetLabel(ssh, simulate(vpc, ssh), vpc)).toBe('TCP 22 de [[servidor1]] a [[servidor2]]');
  });
});

describe('describeResult', () => {
  const lucia = OFFICE_FLOORS.floor1.lucia;
  const you = device('your-laptop');
  const udpToLucia = { ...tcp(you, lucia, 53), protocol: 'udp' } as const;

  it('the result of a refusal says whether nobody listens on the port or the service listens on another address', () => {
    const closed = simulate(withDevice(officeTwoFloorsNet(), 'lucia-laptop', {}), tcp(you, lucia, WEB_PORT));
    const wrong = simulate(serving('loopback'), tcp(you, lucia, APP_PORT));
    expect([closed.outcome, wrong.outcome]).toEqual(['refused', 'refused']);
    expect(describeResult(closed, EVERY_TERM)).toBe(OUTCOME_TEXT.refused);
    expect(describeResult(closed, EVERY_TERM)).toBe('Llegó, pero ningún programa lo estaba esperando.');
    expect(describeResult(wrong, EVERY_TERM)).toBe('Llegó, pero el {{service|servicio}} de ese {{port|puerto}} no escucha en la {{ip-address|IP}} a la que fue el paquete.');
    expect(describeResult(wrong, withoutTerms('listen-address'))).toBe('Llegó, pero lo rechazaron.');
    expect(describeResult(wrong, withoutTerms('service', 'port'))).toBe('Llegó, pero el servicio de ese puerto no escucha en la {{ip-address|IP}} a la que fue el paquete.');
    for (const text of [describeResult(closed, EVERY_TERM), describeResult(wrong, EVERY_TERM), describeResult(wrong, withoutTerms('listen-address'))]) {
      expect(toPlainText(text)).not.toMatch(/linux|windows|macos|firewall|sistema operativo|porque/i);
    }
  });

  it('the result of a Port Unreachable says the datagram arrived and no program received it, and never that a service did', () => {
    const closed = simulate(withDevice(officeTwoFloorsNet(), 'lucia-laptop', {}), udpToLucia);
    const wrong = simulate(withDevice(officeTwoFloorsNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [{ protocol: 'udp', port: 53, listen: 'loopback' }] } }), udpToLucia);
    for (const trace of [closed, wrong]) {
      expect([trace.outcome, trace.notice?.kind]).toEqual(['unreachable', 'port-unreachable']);
      expect(describeResult(trace, EVERY_TERM, '[[laptop-lucia]]')).toBe('Llegó a [[laptop-lucia]], pero ningún programa lo recibió: devolvió el aviso {{port-unreachable}}.');
      expect(describeResult(trace, EVERY_TERM)).toBe('Llegó, pero ningún programa lo recibió: el equipo devolvió el aviso {{port-unreachable}}.');
      expect(describeResult(trace, withoutTerms('port-unreachable'), '[[laptop-lucia]]')).toBe('Llegó, pero lo rechazaron.');
      expect(describeResult(trace, EVERY_TERM)).not.toBe(OUTCOME_TEXT.unreachable);
      expect(toPlainText(describeResult(trace, EVERY_TERM))).not.toMatch(/No llegó|servicio|recibió un/);
    }
  });

  it('keeps the text of every other result as describeOutcome gives it', () => {
    const floors = officeTwoFloorsNet();
    const nobody = simulate(floors, ping(you, OFFICE_FLOORS.floor1.nobody));
    const expired = simulate(floors, { ...ping(you, OFFICE_FLOORS.server.ip), ttl: 1 });
    const answered = simulate(floors, ping(you, OFFICE_FLOORS.floor1.printer));
    for (const trace of [nobody, expired, answered]) {
      for (const known of [EVERY_TERM, withoutTerms('host-unreachable', 'time-exceeded', 'echo-reply'), new Set<TermId>()]) {
        expect(describeResult(trace, known, '[[impresora]]')).toBe(describeOutcome(trace.outcome, known, '[[impresora]]'));
      }
    }
  });
});

describe('the warning of a trace', () => {
  const you = device('your-laptop');
  const from = you;
  const noRoutes = (): Network => applyAction(officeTwoFloorsNet(), { type: 'removeRoute', routerId: OFFICE_FLOORS.officeRouter.id, to: ROUTE_DEFAULT });

  it('a warning that a host sends is labelled as the host that returned it and not as a router', () => {
    const lucia = simulate(withDevice(officeTwoFloorsNet(), 'lucia-laptop', {}), { ...tcp(you, OFFICE_FLOORS.floor1.lucia, 53), protocol: 'udp' });
    const server = simulate(officeTwoFloorsNet(), { ...tcp(you, OFFICE_FLOORS.server.ip, 53), protocol: 'udp' });
    expect(lucia.notice).toMatchObject({ kind: 'port-unreachable', fromId: 'lucia-laptop' });
    expect(server.notice).toMatchObject({ kind: 'port-unreachable', fromId: OFFICE_FLOORS.server.id });
    expect(warningOf(lucia.notice!, { from })).toEqual({ term: 'port-unreachable', by: 'host' });
    expect(warningOf(server.notice!, { from })).toEqual({ term: 'port-unreachable', by: 'host' });
    const own = simulate(withDevice(officeTwoFloorsNet(), 'your-laptop', {}), { ...tcp(you, '127.0.0.1', 53), protocol: 'udp' });
    expect(own.notice).toMatchObject({ kind: 'port-unreachable', fromId: 'your-laptop' });
    expect(warningOf(own.notice!, { from })).toEqual({ term: 'port-unreachable', by: 'sender' });
    const routed = simulate(officeTwoFloorsNet(), { ...ping(you, OFFICE_FLOORS.server.ip), ttl: 1 });
    expect(warningOf(routed.notice!, { from }).by).toBe('router');
  });

  it('names the warning of a router with no route Destination Net Unreachable once that term is known, and by no term before', () => {
    const trace = simulate(noRoutes(), ping(you, OFFICE_FLOORS.server.ip));
    expect(trace.notice).toMatchObject({ kind: 'net-unreachable', fromId: OFFICE_FLOORS.officeRouter.id });
    expect(warningOf(trace.notice!, { from }, EVERY_TERM)).toEqual({ term: 'net-unreachable', by: 'router' });
    expect(warningOf(trace.notice!, { from }, withoutTerms('net-unreachable'))).toEqual({ term: null, by: 'router' });
    expect(warningOf(trace.notice!, { from })).toEqual({ term: null, by: 'router' });
    const noHost = simulate(officeTwoFloorsNet(), ping(you, OFFICE_FLOORS.server.nobody));
    expect(noHost.notice?.kind).toBe('host-unreachable');
    expect(warningOf(noHost.notice!, { from }, EVERY_TERM).term).toBe('host-unreachable');
  });
});

describe('the labels of a packet with ports along its legs', () => {
  const floors = officeTwoFloorsNet();
  const { server, officeRouter, floor2 } = OFFICE_FLOORS;
  const toServer = tcp(device('your-laptop'), server.ip, WEB_PORT);
  const toLucia = tcp(device('your-laptop'), OFFICE_FLOORS.floor1.lucia, APP_PORT);
  const labelsOf = (packet: typeof toServer, net: Network, known?: ReadonlySet<TermId>) => packetPortLabels(packet, simulate(net, packet), known);

  it('a packet that stays in the office has one leg: its ports as it left, and the reply with the ports swapped', () => {
    expect(labelsOf(toLucia, serving())).toEqual([{ request: '{{tcp}} 51514 → 3000', reply: '{{tcp}} 3000 → 51514' }]);
  });

  it('a question to a resolver outside the office is translated like any other packet that leaves it', () => {
    const question = dig(device('your-laptop'), `www.${NAME_SERVER_PIECES.zone}`);
    expect(labelsOf(question, officeWithNames())).toEqual([
      { request: '{{udp}} 51514 → 53', reply: '{{udp}} 53 → 51514' },
      { request: '{{udp}} 40001 → 53', reply: '{{udp}} 53 → 40001' },
    ]);
  });

  it('a packet that the NAT of the office translates has a second leg with the public source port, and the reply in each leg swaps that leg\'s ports', () => {
    expect(labelsOf(toServer, floors)).toEqual([
      { request: '{{tcp}} 51514 → 80', reply: '{{tcp}} 80 → 51514' },
      { request: '{{tcp}} 40001 → 80', reply: '{{tcp}} 80 → 40001' },
    ]);
    const second = simulateSequence(floors, [{ packet: toServer, at: 0 }, { packet: { ...toServer, from: device('lucia-laptop') }, at: 0 }])[1];
    expect(packetPortLabels({ ...toServer, from: device('lucia-laptop') }, second)?.[1].request).toBe('{{tcp}} 40002 → 80');
  });

  it('a packet from outside has its public port before the router and the port of the device after it', () => {
    const outside = [{ id: 'casa-lucia', name: 'casa-lucia', ip: '192.0.2.77', kind: 'home' }] as const;
    const forwarded = applyAction(
      applyAction(applyAction(floors, { type: 'addActor', actor: outside[0] }), { type: 'setServices', ownerId: 'andres-laptop', services: [tcpService(APP_PORT)] }),
      { type: 'setForwards', routerId: officeRouter.id, forwards: [{ protocol: 'tcp', publicPort: 8080, toDeviceId: 'andres-laptop', toPort: APP_PORT }] },
    );
    const packet = { from: actor('casa-lucia'), to: officeRouter.uplink, protocol: 'tcp', port: 8080 } as const;
    const trace = simulate(forwarded, packet);
    expect(trace.translation?.inside).toEqual({ ip: floor2.andres, port: APP_PORT });
    expect(packetPortLabels(packet, trace)).toEqual([
      { request: '{{tcp}} 51514 → 8080', reply: '{{tcp}} 8080 → 51514' },
      { request: '{{tcp}} 51514 → 3000', reply: '{{tcp}} 3000 → 51514' },
    ]);
  });

  it('a packet whose translation changes no port has one leg, and one with no ports at all has none, an ICMP translation included', () => {
    const pinged = ping(device('your-laptop'), server.ip);
    expect(simulate(floors, pinged).translation?.protocol).toBe('icmp');
    expect(packetPortLabels(pinged, simulate(floors, pinged))).toBeNull();
    const vpc = lab03Net();
    const ssh = tcp(device('servidor1'), '172.31.38.97', 22);
    expect(packetPortLabels(ssh, simulate(vpc, ssh))).toBeNull();
  });

  it('the legs follow what the player knows, and the reply keeps the port of the service until the source port is known', () => {
    expect(labelsOf(toServer, floors, withoutTerms('source-port'))).toEqual([
      { request: '{{tcp}} 80', reply: '{{tcp}} 80' },
    ]);
    expect(labelsOf(toServer, floors, withoutTerms('tcp'))?.[0].request).toBe('{{packet}} al {{port|puerto}} 80');
    expect(labelsOf(toServer, floors, withoutTerms('tcp', 'port'))?.[0].request).toBe('{{packet}}');
  });
});
