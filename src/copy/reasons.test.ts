import { describe, expect, it } from 'vitest';
import { ROUTE_DEFAULT, applyAction, simulate, type Firewall, type Reason } from '@/engine';
import { EVERY_TERM, OFFICE, OFFICE_FLOORS, actor, allOut, device, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, tcpService, withDevice } from '@/testing';
import { OUTCOME_TEXT, deviceName } from './packet-labels';
import { describeReason, type PlaceOf, type RouterPlace } from './reasons';
import { termsIn, toPlainText } from './term-text';
import type { TermId } from './terms';

const NET = lab03Net();
const SG_IN_DROP = 'Se queda en el {{security-group}} de [[servidor2]]: ninguna {{inbound-rule}} lo deja entrar.';
const PUBLIC_NAME = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

const CASES: [Reason, string][] = [
  [{ code: 'dns-unresolved', name: 'db.internal', fromInside: false }, 'El {{dns}} no conoce db.internal cuando se pregunta desde fuera de la {{vpc}}.'],
  [
    { code: 'dns-resolved', name: PUBLIC_NAME, ip: '172.31.38.97', fromInside: true },
    `El {{dns}} convierte ${PUBLIC_NAME} en 172.31.38.97 (se preguntó desde dentro de la {{vpc}}).`,
  ],
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.'],
  [{ code: 'route-no-device', ip: '192.168.1.30' }, 'Ningún {{device|dispositivo}} de la {{network|red}} tiene esa IP: el {{packet|paquete}} no llega a nadie.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
  [{ code: 'route-no-public-device', ip: '52.0.0.1' }, 'Ninguna {{ec2-instance}} tiene la {{public-ip}} 52.0.0.1.'],
  [{ code: 'route-no-public-ip', deviceId: 'servidor1' }, '[[servidor1]] no tiene {{public-ip}}: no puede salir a internet.'],
  [
    { code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' },
    'Sale por el {{internet-gateway}} y su remitente cambia de 172.31.16.131 a 54.78.154.66: eso es {{nat}}.',
  ],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],
  [{ code: 'route-self', deviceId: 'your-laptop' }, 'Va a la propia IP del dispositivo: no sale a la red.'],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'security-group' }, 'El {{security-group}} de [[servidor1]] lo deja salir.'],
  [
    { code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'security-group' },
    'Se queda en el {{security-group}} de [[servidor1]]: ninguna {{outbound-rule}} lo deja salir.',
  ],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'security-group' }, 'El {{security-group}} de [[servidor2]] lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' }, SG_IN_DROP],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'El {{firewall}} de [[servidor1]] lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'host-firewall' }, 'Se queda en el {{firewall}} de [[servidor1]]: ninguna {{rule|regla}} lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'El {{firewall}} de [[servidor2]] lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'host-firewall' }, 'Se queda en el {{firewall}} de [[servidor2]]: ninguna {{rule|regla}} lo deja entrar.'],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.'],
  [{ code: 'host-ignores-echo', deviceId: 'servidor2' }, 'Llega, pero [[servidor2]] tiene {{icmp-echo-ignore-all}} en 1 y no contesta.'],
  [{ code: 'host-replies', deviceId: 'servidor2' }, '[[servidor2]] contesta.'],
  [{ code: 'host-refused', deviceId: 'servidor2', port: 80 }, 'Llega, pero ningún programa escucha en el puerto 80: [[servidor2]] lo rechaza.'],
  [{ code: 'host-accepts', deviceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'host-udp-closed', deviceId: 'servidor2', port: 53 }, 'Llega por {{udp|UDP}} al {{port|puerto}} 53, pero ningún programa escucha ahí: [[servidor2]] avisa con {{port-unreachable}}.'],
  [{ code: 'reply-stateful', deviceId: 'servidor2' }, 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.'],
];

const ADDRESS_CASES: [Reason, string, string[]][] = [
  [
    { code: 'address-invalid', address: '192.168.1.300' },
    '192.168.1.300 no es una dirección {{ipv4}} válida: cada uno de sus cuatro números debe ir de 0 a 255. El {{packet|paquete}} no sale del {{device|dispositivo}}.',
    ['ipv4', 'packet', 'device'],
  ],
  [
    { code: 'address-localhost', ip: '127.0.0.1' },
    'El {{device|dispositivo}} ya conoce el nombre {{localhost}}: significa 127.0.0.1, una dirección de {{loopback}}. No pregunta a nadie.',
    ['device', 'localhost', 'loopback'],
  ],
  [
    { code: 'route-loopback', deviceId: 'your-laptop', ip: '127.5.5.5' },
    '127.5.5.5 es una dirección de {{loopback}}: el {{packet|paquete}} se entrega al propio {{device|dispositivo}} y no sale a la {{network|red}}.',
    ['loopback', 'packet', 'device', 'network'],
  ],
];

const FLOORS = officeTwoFloorsNet();
const { floor1, floor2 } = OFFICE_FLOORS;
const SENDER_WARNS = 'El propio {{device|dispositivo}} avisa que no pudo entregar el {{packet|paquete}}.';

const DELIVERY_CASES: [Reason, string, string[]][] = [
  [
    { code: 'route-no-gateway', deviceId: 'your-laptop', ip: floor2.andres },
    '192.168.2.15 no está en la {{lan}} de [[tu-laptop]], y [[tu-laptop]] no tiene {{default-gateway}}: no sabe por dónde sacar el {{packet|paquete}}.',
    ['lan', 'default-gateway', 'packet'],
  ],
  [
    { code: 'route-not-connected', deviceId: 'guest-laptop' },
    '[[laptop-visita]] no tiene conexión a la {{network|red}}: ni envía ni recibe {{packet|paquetes}}.',
    ['network', 'packet'],
  ],
  [
    { code: 'route-gateway-not-a-router', deviceId: 'printer', ip: floor1.printer },
    'La IP 192.168.1.21, la {{default-gateway}} guardada, es de [[impresora]], que no es un {{router}}: recibe el {{packet|paquete}}, no lo pasa a otra red y no vuelve nada.',
    ['default-gateway', 'router', 'packet'],
  ],
  [
    { code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: false },
    `[[tu-laptop]] buscó en su {{network|red}} quién tenía la IP 192.168.1.99 y nadie contestó. ${SENDER_WARNS}`,
    ['network', 'device', 'packet'],
  ],
  [
    { code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: true },
    `[[tu-laptop]] buscó en su {{network|red}} quién tenía la IP 192.168.1.99, su {{default-gateway}}, y nadie contestó. ${SENDER_WARNS}`,
    ['network', 'default-gateway', 'device', 'packet'],
  ],
];

const { officeRouter, provider, server } = OFFICE_FLOORS;

const ROUTER_CASES: [Reason, string, string[]][] = [
  [
    { code: 'forward-hop', routerId: officeRouter.id, ip: floor1.gateway, ttlLeft: 63 },
    'Pasa por [[router-office]] (192.168.1.1), un {{hop|salto}} más: el {{ttl}} baja a 63.',
    ['hop', 'ttl'],
  ],
  [
    { code: 'forward-ttl-exceeded', routerId: provider.id, ip: provider.towardOffice },
    'El {{ttl}} llega a 0 en [[router-provider]] (203.0.113.1): el {{router}} {{drop|descarta}} el {{packet|paquete}} y avisa a quien lo envió con {{time-exceeded}}.',
    ['ttl', 'router', 'drop', 'packet', 'time-exceeded'],
  ],
  [
    { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: true },
    '[[router-provider]] no sabe a qué {{router}} mandar un {{packet|paquete}} para 8.8.8.8: lo {{drop|descarta}} y avisa a quien lo envió que no pudo entregarlo.',
    ['router', 'packet', 'drop'],
  ],
  [
    { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: false },
    '[[router-provider]] no sabe a qué {{router}} mandar un {{packet|paquete}} para 8.8.8.8: lo {{drop|descarta}} y no avisa a nadie.',
    ['router', 'packet', 'drop'],
  ],
  [
    { code: 'forward-private-dropped', routerId: provider.id, ip: '10.0.0.10' },
    '10.0.0.10 es una {{private-ip}}: se repite en muchas redes y {{internet}} no la entrega. [[router-provider]], ya fuera de la oficina, {{drop|descartó}} el {{packet|paquete}} y no avisó.',
    ['private-ip', 'internet', 'drop', 'packet'],
  ],
  [
    { code: 'forward-router-replies', routerId: officeRouter.id, ip: floor1.gateway },
    'La IP 192.168.1.1 es de [[router-office]], un {{router}}: el {{packet|paquete}} llega a él, no sigue de largo, y contesta.',
    ['router', 'packet'],
  ],
];

const TRIP_CASES: [Reason, string, string[]][] = [
  [
    { code: 'route-leaves-office', ip: server.ip },
    '198.51.100.50 está fuera de la {{network|red}} de la oficina: el {{packet|paquete}} va a la {{default-gateway}}, que lo saca de ella.',
    ['network', 'packet', 'default-gateway'],
  ],
  [
    { code: 'forward-no-host', routerId: OFFICE_FLOORS.backbone.id, ip: '198.51.100.77', warns: true },
    '[[router-backbone]] tiene conectada la {{network|red}} de 198.51.100.77, pero ningún {{device|dispositivo}} tiene esa IP: {{drop|descarta}} el {{packet|paquete}} y avisa a quien lo envió que no pudo entregarlo.',
    ['network', 'device', 'drop', 'packet'],
  ],
  [
    { code: 'forward-no-host', routerId: OFFICE_FLOORS.backbone.id, ip: '198.51.100.77', warns: false },
    '[[router-backbone]] tiene conectada la {{network|red}} de 198.51.100.77, pero ningún {{device|dispositivo}} tiene esa IP: {{drop|descarta}} el {{packet|paquete}} y no avisa a nadie.',
    ['network', 'device', 'drop', 'packet'],
  ],
  [{ code: 'host-replies', deviceId: server.id }, '[[servidor-internet]] contesta.', []],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o', (reason, text) => {
    expect(describeReason(reason, NET, EVERY_TERM)).toBe(text);
  });

  it.each(CASES)('tags only registered terms: %o', (reason) => {
    expect(() => termsIn(describeReason(reason, NET, EVERY_TERM))).not.toThrow();
  });

  it('describes address-invalid, address-localhost and route-loopback with registered terms only', () => {
    for (const [reason, text, terms] of ADDRESS_CASES) {
      expect(describeReason(reason, NET, EVERY_TERM)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
    }
    const invalid = describeReason(ADDRESS_CASES[0][0], NET, EVERY_TERM);
    expect(termsIn(invalid)).not.toContain('dns');
    expect(toPlainText(invalid)).not.toMatch(/dns|nombre/i);
  });

  it('describes route-no-gateway, route-not-connected, route-gateway-not-a-router and forward-no-owner with registered terms only', () => {
    for (const [reason, text, terms] of DELIVERY_CASES) {
      expect(describeReason(reason, FLOORS, EVERY_TERM)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
      expect(toPlainText(text)).not.toMatch(/\b(arp|mac)\b/i);
    }
  });

  it('describes forward-hop, forward-ttl-exceeded, forward-no-route, forward-private-dropped and forward-router-replies with registered terms only', () => {
    for (const [reason, text, terms] of ROUTER_CASES) {
      expect(describeReason(reason, FLOORS, EVERY_TERM)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
      expect(toPlainText(text)).not.toMatch(/\b(nat|windows|linux|macos)\b|ruta|ARP/i);
    }
  });

  it('describes the exit from the office, a router that finds no host, and a server that answers, naming routers and servers', () => {
    for (const [reason, text, terms] of TRIP_CASES) {
      expect(describeReason(reason, FLOORS, EVERY_TERM)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
    }
    expect(deviceName(FLOORS, server.id)).toBe('[[servidor-internet]]');
  });

  it('the trip out of the office never names NAT or the public IP, in any step the player reads', () => {
    const packets = [ping(device('your-laptop'), server.ip), { ...ping(device('your-laptop'), server.ip), ttl: 2 }, ping(device('your-laptop'), '10.0.0.10')];
    for (const packet of packets) {
      for (const step of simulate(FLOORS, packet).steps) {
        const text = describeReason(step.reason, FLOORS, EVERY_TERM);
        expect(() => termsIn(text)).not.toThrow();
        expect(termsIn(text)).not.toContain('nat');
        expect(termsIn(text)).not.toContain('public-ip');
        expect(toPlainText(text)).not.toMatch(/\bnat\b|IP pública/i);
      }
    }
  });

  it('an office names its own network and its own firewalls, not the VPC nor a Security Group', () => {
    const office = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    expect(describeReason({ code: 'route-private' }, office, EVERY_TERM)).toBe('Viaja por dentro de la {{network|red}} de la oficina.');
    expect(describeReason({ code: 'reply-stateful', deviceId: 'lucia-laptop' }, office, EVERY_TERM)).toBe('Llega la respuesta.');
    expect(describeReason({ code: 'reply-stateful', deviceId: 'printer' }, office, EVERY_TERM)).toBe('Llega la respuesta.');
  });

  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
    const trace = simulate(NET, ping(device('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET, EVERY_TERM);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });
});

const NOTHING_CAME_BACK = 'No volvió ninguna respuesta.';
const without = (...terms: TermId[]): ReadonlySet<TermId> => new Set([...EVERY_TERM].filter((term) => !terms.includes(term)));
const dropAt = (code: 'firewall-in-drop' | 'firewall-out-drop', firewallKind: 'host-firewall' | 'security-group'): Reason => ({ code, deviceId: 'servidor2', firewallKind });

const NOT_DELIVERED = 'No llegó a su destino.';

const HIDDEN_CAUSES: [Reason, TermId, string][] = [
  [dropAt('firewall-in-drop', 'host-firewall'), 'firewall', NOTHING_CAME_BACK],
  [dropAt('firewall-out-drop', 'host-firewall'), 'firewall', NOTHING_CAME_BACK],
  [dropAt('firewall-in-drop', 'security-group'), 'security-group', NOTHING_CAME_BACK],
  [dropAt('firewall-out-drop', 'security-group'), 'security-group', NOTHING_CAME_BACK],
  [{ code: 'host-ignores-echo', deviceId: 'servidor2' }, 'icmp-echo-ignore-all', NOTHING_CAME_BACK],
  [{ code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: false }, 'host-unreachable', NOT_DELIVERED],
  [{ code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: true }, 'host-unreachable', NOT_DELIVERED],
  [{ code: 'forward-no-host', routerId: OFFICE_FLOORS.backbone.id, ip: '198.51.100.77', warns: true }, 'host-unreachable', NOT_DELIVERED],
  [{ code: 'forward-ttl-exceeded', routerId: provider.id, ip: provider.towardOffice }, 'time-exceeded', NOT_DELIVERED],
];

describe('describeReason with what the player knows', () => {
  it('describes a reason with the terms the player knows', () => {
    const drop = dropAt('firewall-in-drop', 'host-firewall');
    expect(describeReason(drop, NET, without('firewall', 'rule', 'drop'))).toBe(NOTHING_CAME_BACK);
    expect(describeReason(drop, NET, without('rule', 'drop'))).toBe('El {{firewall}} de [[servidor2]] descartó el {{packet|paquete}} sin avisar.');
    expect(describeReason(drop, NET, without('rule'))).toBe('El {{firewall}} de [[servidor2]] {{drop|descartó}} el {{packet|paquete}} sin avisar.');
    expect(describeReason(drop, NET, EVERY_TERM)).toBe('Se queda en el {{firewall}} de [[servidor2]]: ninguna {{rule|regla}} lo deja entrar.');
    const sgOut = dropAt('firewall-out-drop', 'security-group');
    expect(describeReason(sgOut, NET, without('security-group'))).toBe(NOTHING_CAME_BACK);
    expect(describeReason(sgOut, NET, without('outbound-rule'))).toBe('El {{security-group}} de [[servidor2]] {{drop|descartó}} el {{packet|paquete}} sin avisar.');
    expect(describeReason(sgOut, NET, EVERY_TERM)).toBe('Se queda en el {{security-group}} de [[servidor2]]: ninguna {{outbound-rule}} lo deja salir.');
  });

  it('a host firewall with no outbound rule says its outbound side was set closed, and one with a rule that does not match says that no rule lets the packet out', () => {
    const closed: Firewall = { id: 'fw-you', name: 'your-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
    const guarding = (firewall: Firewall) => withDevice({ ...officeNet(), firewalls: [firewall] }, 'your-laptop', { firewallIds: [firewall.id] });
    const drop: Reason = { code: 'firewall-out-drop', deviceId: 'your-laptop', firewallKind: 'host-firewall' };
    const noRuleLetsItOut = 'Se queda en el {{firewall}} de [[your-laptop]]: ninguna {{rule|regla}} lo deja salir.';
    const setClosed = describeReason(drop, guarding(closed), EVERY_TERM);
    expect(setClosed).toBe('Se queda en el {{firewall}} de [[your-laptop]]: su {{outbound|salida}} está cerrada, alguien la configuró así.');
    expect(toPlainText(setClosed)).not.toMatch(/por defecto|de fábrica|normalmente|siempre|todos los firewalls|un firewall (cierra|bloquea)/i);
    expect(describeReason(drop, guarding({ ...closed, outbound: [allOut('fw-you-out')] }), EVERY_TERM)).toBe(noRuleLetsItOut);
    expect(describeReason(drop, guarding(closed), without('outbound'))).toBe(noRuleLetsItOut);
    expect(describeReason(drop, guarding(closed), without('firewall'))).toBe(NOTHING_CAME_BACK);
  });

  it('says nothing of a closed side for a Security Group, whose outbound drop keeps its own sentence', () => {
    const sgOut: Reason = { code: 'firewall-out-drop', deviceId: 'servidor1', firewallKind: 'security-group' };
    expect(describeReason(sgOut, NET, EVERY_TERM)).toBe('Se queda en el {{security-group}} de [[servidor1]]: ninguna {{outbound-rule}} lo deja salir.');
  });

  it.each(HIDDEN_CAUSES)('says only what the player saw while the term of the cause is unknown: %o', (reason, term, text) => {
    expect(describeReason(reason, FLOORS, without(term))).toBe(text);
    expect(describeReason(reason, FLOORS, EVERY_TERM)).not.toBe(text);
  });

  it('never says that nothing came back when a warning did', () => {
    const warnings = HIDDEN_CAUSES.filter(([, , text]) => text === NOT_DELIVERED);
    expect(warnings).toHaveLength(4);
    for (const [reason, term] of warnings) expect(describeReason(reason, FLOORS, without(term))).not.toBe(NOTHING_CAME_BACK);
  });

  it('the text of a warning quotes no operating system and says only what the player saw', () => {
    const quotesAnOperatingSystem = /windows|linux|macos|mac os|ubuntu|android|\b(arp|mac)\b|reply from|request timed out|general failure|icmp_seq|bytes from|ttl expired in transit|time to live exceeded|destination (host|net) unreachable/i;
    const warnings = HIDDEN_CAUSES.filter(([, , text]) => text === NOT_DELIVERED);
    for (const [reason, term] of warnings) {
      expect(describeReason(reason, FLOORS, without(term))).toBe(NOT_DELIVERED);
      expect(toPlainText(describeReason(reason, FLOORS, EVERY_TERM))).not.toMatch(quotesAnOperatingSystem);
    }
    const sent = [
      ping(device('your-laptop'), floor1.nobody),
      { ...ping(device('your-laptop'), OFFICE_FLOORS.server.ip), ttl: 1 },
      ping(device('your-laptop'), '8.8.8.8'),
      ping(device('your-laptop'), '198.51.100.77'),
    ].map((packet) => simulate(FLOORS, packet));
    const warned = sent.filter((trace) => trace.notice);
    expect(warned.map((trace) => trace.notice?.kind)).toContain('host-unreachable');
    expect(warned.map((trace) => trace.notice?.kind)).toContain('time-exceeded');
    for (const trace of warned) {
      for (const text of [OUTCOME_TEXT[trace.outcome], ...trace.steps.map((step) => describeReason(step.reason, FLOORS, EVERY_TERM))]) {
        expect(toPlainText(text)).not.toMatch(quotesAnOperatingSystem);
      }
    }
  });

  it('the text of a warning that the sender generates itself says that its own device warns, and that of a router names the router', () => {
    const own = describeReason({ code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: false }, FLOORS, EVERY_TERM);
    expect(toPlainText(own)).toMatch(/propio dispositivo avisa/);
    const routed = describeReason({ code: 'forward-ttl-exceeded', routerId: provider.id, ip: provider.towardOffice }, FLOORS, EVERY_TERM);
    expect(toPlainText(routed)).toContain('router-provider');
  });

  it('keeps the text of a router that drops without warning, since no warning hides behind an unknown term', () => {
    const silent: Reason = { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: false };
    expect(describeReason(silent, FLOORS, without('host-unreachable'))).toBe(describeReason(silent, FLOORS, EVERY_TERM));
  });

  it('a firewall that drops tags only the terms the player knows, whichever of its terms is missing', () => {
    const drops = HIDDEN_CAUSES.flatMap(([reason]) => (reason.code === 'firewall-in-drop' || reason.code === 'firewall-out-drop' ? [reason] : []));
    expect(drops).toHaveLength(4);
    for (const reason of drops) {
      for (const missing of ['firewall', 'security-group', 'rule', 'outbound-rule', 'inbound-rule', 'drop', 'packet'] as const) {
        const known = without(missing);
        expect(termsIn(describeReason(reason, NET, known)).filter((tagged) => !known.has(tagged))).toEqual([]);
      }
    }
  });

  it('a firewall the player does not know yet leaves no sentence about letting a packet through', () => {
    const passes: Reason[] = [
      { code: 'firewall-in-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' },
      { code: 'firewall-out-pass', deviceId: 'servidor2', firewallKind: 'host-firewall' },
    ];
    for (const pass of passes) {
      expect(describeReason(pass, NET, without('firewall'))).toBe('Sigue su camino.');
      expect(termsIn(describeReason(pass, NET, without('firewall')))).toEqual([]);
    }
  });

  it('the reply through the firewall of a laptop gives no reason for letting it through', () => {
    const office = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    for (const known of [EVERY_TERM, without('firewall'), without('stateful', 'firewall', 'rule')]) {
      const text = describeReason({ code: 'reply-stateful', deviceId: 'lucia-laptop' }, office, known);
      expect(text).toBe('Llega la respuesta.');
      expect(toPlainText(text)).not.toMatch(/conversación|recuerda|mismo camino|porque|stateful/i);
    }
  });

  it('the reply to a device with no firewall gives no reason either, and no reply text of an office says the same road', () => {
    const office = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    for (const deviceId of ['lucia-laptop', 'printer', 'your-laptop']) {
      for (const known of [EVERY_TERM, without('firewall'), without('stateful', 'firewall', 'rule')]) {
        const text = describeReason({ code: 'reply-stateful', deviceId }, office, known);
        expect(text, deviceId).toBe('Llega la respuesta.');
        expect(toPlainText(text), deviceId).not.toMatch(/conversación|recuerda|mismo camino|porque|stateful/i);
      }
    }
  });

  it('the reply through a Security Group names stateful only once that term is known', () => {
    const reply: Reason = { code: 'reply-stateful', deviceId: 'servidor2' };
    expect(describeReason(reply, NET, EVERY_TERM)).toBe('La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.');
    expect(describeReason(reply, NET, without('stateful'))).toBe('Llega la respuesta.');
  });
});

describe('describeReason for a router the map does not draw', () => {
  const placed = (place: RouterPlace): PlaceOf => () => place;
  const OUTSIDE = 'de afuera de la oficina';
  const ROUTER_REASONS: [Reason, string][] = [
    [{ code: 'forward-hop', routerId: provider.id, ip: provider.towardOffice, ttlLeft: 62 }, `Pasa por un {{router}} ${OUTSIDE}, un {{hop|salto}} más: el {{ttl}} baja a 62.`],
    [
      { code: 'forward-ttl-exceeded', routerId: provider.id, ip: provider.towardOffice },
      `El {{ttl}} llega a 0 en un {{router}} ${OUTSIDE}: el {{router}} {{drop|descarta}} el {{packet|paquete}} y avisa a quien lo envió con {{time-exceeded}}.`,
    ],
    [
      { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: true },
      `Un {{router}} ${OUTSIDE} no sabe a qué {{router}} mandar un {{packet|paquete}} para 8.8.8.8: lo {{drop|descarta}} y avisa a quien lo envió que no pudo entregarlo.`,
    ],
    [
      { code: 'forward-no-host', routerId: OFFICE_FLOORS.backbone.id, ip: '198.51.100.77', warns: false },
      `Un {{router}} ${OUTSIDE} tiene conectada la {{network|red}} de 198.51.100.77, pero ningún {{device|dispositivo}} tiene esa IP: {{drop|descarta}} el {{packet|paquete}} y no avisa a nadie.`,
    ],
    [
      { code: 'forward-private-dropped', routerId: provider.id, ip: '10.0.0.10' },
      '10.0.0.10 es una {{private-ip}}: se repite en muchas redes y {{internet}} no la entrega. Un {{router}}, ya fuera de la oficina, {{drop|descartó}} el {{packet|paquete}} y no avisó.',
    ],
    [
      { code: 'forward-router-replies', routerId: provider.id, ip: provider.towardOffice },
      `La IP 203.0.113.1 es de un {{router}} ${OUTSIDE}: el {{packet|paquete}} llega a él, no sigue de largo, y contesta.`,
    ],
  ];

  it.each(ROUTER_REASONS)('says a router outside the office without its name or its IP: %o', (reason, text) => {
    expect(describeReason(reason, FLOORS, EVERY_TERM, placed('outside'))).toBe(text);
    expect(describeReason(reason, FLOORS, EVERY_TERM, placed('outside'))).not.toContain('router-');
    expect(describeReason(reason, FLOORS, EVERY_TERM, placed('named'))).toBe(describeReason(reason, FLOORS, EVERY_TERM));
  });

  it('says a router of the office that is not drawn as one of the office, and writes the word router plain while it is unknown', () => {
    const hop: Reason = { code: 'forward-hop', routerId: officeRouter.id, ip: floor1.gateway, ttlLeft: 63 };
    expect(describeReason(hop, FLOORS, EVERY_TERM, placed('inside'))).toBe('Pasa por un {{router}} de la oficina, un {{hop|salto}} más: el {{ttl}} baja a 63.');
    expect(describeReason(hop, FLOORS, without('router'), placed('inside'))).toBe('Pasa por un router de la oficina, un {{hop|salto}} más: el {{ttl}} baja a 63.');
  });

  it('asks only about the routers the reason names', () => {
    const asked: string[] = [];
    const placeOf: PlaceOf = (id) => {
      asked.push(id);
      return 'named';
    };
    describeReason({ code: 'host-replies', deviceId: server.id }, FLOORS, EVERY_TERM, placeOf);
    describeReason({ code: 'forward-hop', routerId: provider.id, ip: provider.towardOffice, ttlLeft: 62 }, FLOORS, EVERY_TERM, placeOf);
    expect(asked).toEqual([provider.id]);
  });
});

describe('describeReason for a router that discards a packet', () => {
  const FORWARD_DROPS: Reason[] = [
    { code: 'forward-ttl-exceeded', routerId: provider.id, ip: provider.towardOffice },
    { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: true },
    { code: 'forward-no-host', routerId: OFFICE_FLOORS.backbone.id, ip: '198.51.100.77', warns: false },
    { code: 'forward-private-dropped', routerId: provider.id, ip: '10.0.0.10' },
  ];

  it.each(FORWARD_DROPS)('says discards in plain words, with no tag, while the term drop is not known: %o', (reason) => {
    const early = describeReason(reason, FLOORS, without('drop'));
    expect(termsIn(early)).not.toContain('drop');
    expect(toPlainText(early)).toBe(toPlainText(describeReason(reason, FLOORS, EVERY_TERM)));
    expect(toPlainText(early)).toMatch(/descarta|descartó/);
    expect(termsIn(describeReason(reason, FLOORS, EVERY_TERM))).toContain('drop');
  });
});

describe('describeReason for a refusal because of the listening address', () => {
  const wrongAddress: Reason = { code: 'host-wrong-address', deviceId: 'servidor2', port: 3000, ip: '172.31.38.97' };
  const ARRIVED_AND_REFUSED = 'Llega, pero [[servidor2]] lo rechaza.';
  const KNOWN_TEXT = `${ARRIVED_AND_REFUSED} El {{service|servicio}} del {{port|puerto}} 3000 tiene como {{listen-address}} 127.0.0.1, y el {{packet|paquete}} va a 172.31.38.97.`;

  it('names the service, its listening address and the IP the packet goes to once the listening address is known', () => {
    const text = describeReason(wrongAddress, NET, EVERY_TERM);
    expect(text).toBe(KNOWN_TEXT);
    expect(termsIn(text)).toEqual(['service', 'port', 'listen-address', 'packet']);
    expect(toPlainText(text)).toBe('Llega, pero servidor2 lo rechaza. El servicio del puerto 3000 tiene como dirección de escucha 127.0.0.1, y el paquete va a 172.31.38.97.');
  });

  it('says only that the packet arrived and was rejected while the listening address is unknown', () => {
    const text = describeReason(wrongAddress, NET, without('listen-address'));
    expect(text).toBe(ARRIVED_AND_REFUSED);
    expect(termsIn(text)).toEqual([]);
    expect(toPlainText(text)).not.toMatch(/escucha|programa|servicio|puerto|dirección/i);
  });

  it('tags only the terms the player knows, whichever of its terms is missing', () => {
    for (const missing of ['service', 'port', 'packet', 'listen-address'] as const) {
      const known = without(missing);
      const text = describeReason(wrongAddress, NET, known);
      expect(() => termsIn(text), missing).not.toThrow();
      expect(termsIn(text).filter((tagged) => !known.has(tagged)), missing).toEqual([]);
    }
  });

  it('never says that no program listens, since one does, and gives no reason for a reply to come back', () => {
    for (const known of [EVERY_TERM, without('listen-address'), without('service', 'port', 'packet')]) {
      expect(toPlainText(describeReason(wrongAddress, NET, known))).not.toMatch(/ningún programa|nadie escucha|stateful|conversación|recuerda|porque/i);
    }
  });

  it('names a server of the internet and a device the same way', () => {
    const text = describeReason({ ...wrongAddress, deviceId: OFFICE_FLOORS.server.id, ip: OFFICE_FLOORS.server.ip }, FLOORS, EVERY_TERM);
    expect(toPlainText(text)).toContain('servidor-internet');
    expect(toPlainText(text)).toContain(OFFICE_FLOORS.server.ip);
  });

  it('is what a loopback service answers a packet to the IP of its device with', () => {
    const net = withDevice(officeNet(), 'lucia-laptop', { host: { ignoreIcmpEcho: false, services: [tcpService(3000, 'loopback')] } });
    const trace = simulate(net, tcp(device('your-laptop'), OFFICE.lucia, 3000));
    expect(trace.outcome).toBe('refused');
    const reason = trace.steps.at(-1)!.reason;
    expect(reason).toEqual({ code: 'host-wrong-address', deviceId: 'lucia-laptop', port: 3000, ip: OFFICE.lucia });
    expect(toPlainText(describeReason(reason, net, EVERY_TERM))).toContain(`va a ${OFFICE.lucia}`);
  });
});

describe('describeReason for a datagram that a host answers with Port Unreachable', () => {
  const closed: Reason = { code: 'host-udp-closed', deviceId: 'servidor2', port: 53 };
  const ARRIVED_AND_REFUSED = 'Llega, pero [[servidor2]] lo rechaza.';
  const KNOWN_TEXT = 'Llega por {{udp|UDP}} al {{port|puerto}} 53, pero ningún programa escucha ahí: [[servidor2]] avisa con {{port-unreachable}}.';

  it('names the protocol, the port and the warning the host sent once Port Unreachable is known', () => {
    const text = describeReason(closed, NET, EVERY_TERM);
    expect(text).toBe(KNOWN_TEXT);
    expect(termsIn(text)).toEqual(['udp', 'port', 'port-unreachable']);
    expect(toPlainText(text)).toBe('Llega por UDP al puerto 53, pero ningún programa escucha ahí: servidor2 avisa con Port Unreachable.');
  });

  it('says only that the datagram arrived and was rejected while Port Unreachable is unknown', () => {
    const text = describeReason(closed, NET, without('port-unreachable'));
    expect(text).toBe(ARRIVED_AND_REFUSED);
    expect(termsIn(text)).toEqual([]);
    expect(toPlainText(text)).not.toMatch(/udp|puerto|programa|escucha|aviso|avisa/i);
  });

  it('tags only the terms the player knows, whichever of its terms is missing', () => {
    for (const missing of ['udp', 'port', 'port-unreachable'] as const) {
      const known = without(missing);
      const text = describeReason(closed, NET, known);
      expect(() => termsIn(text), missing).not.toThrow();
      expect(termsIn(text).filter((tagged) => !known.has(tagged)), missing).toEqual([]);
    }
    expect(describeReason(closed, NET, without('udp', 'port'))).toBe('Llega por UDP al puerto 53, pero ningún programa escucha ahí: [[servidor2]] avisa con {{port-unreachable}}.');
  });

  it('quotes no operating system and gives no reason for a reply to come back', () => {
    const quotesAnOperatingSystem = /windows|linux|macos|mac os|ubuntu|android|reply from|icmp_seq|bytes from|destination port unreachable/i;
    for (const known of [EVERY_TERM, without('port-unreachable'), without('udp', 'port')]) {
      expect(toPlainText(describeReason(closed, NET, known))).not.toMatch(quotesAnOperatingSystem);
      expect(toPlainText(describeReason(closed, NET, known))).not.toMatch(/stateful|conversación|recuerda|porque/i);
    }
  });

  it('is what a host with no program on a udp port gives, for a device and for a server of the internet', () => {
    const { server } = OFFICE_FLOORS;
    const datagram = (to: string, port: number) => ({ from: device('your-laptop'), to, protocol: 'udp', port }) as const;
    const device_ = simulate(officeNet(), datagram(OFFICE.lucia, 53));
    expect(device_.steps.at(-1)?.reason).toEqual({ code: 'host-udp-closed', deviceId: 'lucia-laptop', port: 53 });
    expect(toPlainText(describeReason(device_.steps.at(-1)!.reason, officeNet(), EVERY_TERM))).toBe('Llega por UDP al puerto 53, pero ningún programa escucha ahí: lucia-laptop avisa con Port Unreachable.');
    const toServer = simulate(FLOORS, datagram(server.ip, 123));
    expect(toServer.steps.at(-1)?.reason).toEqual({ code: 'host-udp-closed', deviceId: server.id, port: 123 });
    expect(toPlainText(describeReason(toServer.steps.at(-1)!.reason, FLOORS, EVERY_TERM))).toContain('servidor-internet');
  });
});

describe('the router of the office that has no route for the destination', () => {
  it('says it does not know where to send the packet, drops it and warns, as any router with no route does', () => {
    const noRoutes = applyAction(FLOORS, { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT });
    const reason = simulate(noRoutes, ping(device('your-laptop'), server.ip)).steps.at(-1)?.reason;
    expect(reason).toEqual({ code: 'forward-no-route', routerId: officeRouter.id, ip: server.ip, warns: true });
    const text = describeReason(reason!, noRoutes, EVERY_TERM);
    expect(text).toBe('[[router-office]] no sabe a qué {{router}} mandar un {{packet|paquete}} para 198.51.100.50: lo {{drop|descarta}} y avisa a quien lo envió que no pudo entregarlo.');
    expect(termsIn(text)).toEqual(['router', 'packet', 'drop']);
  });
});

describe('what comes from outside to the public IP of the router', () => {
  const unsolicited: Reason = { code: 'nat-no-translation', routerId: officeRouter.id, protocol: 'tcp', ip: officeRouter.uplink, port: 40009 };
  const byForward: Reason = { code: 'nat-forwarded', routerId: officeRouter.id, deviceId: 'andres-laptop', protocol: 'tcp', ip: officeRouter.uplink, port: 8080, toPort: 3000, fixed: true };
  const byRow: Reason = { code: 'nat-forwarded', routerId: officeRouter.id, deviceId: 'your-laptop', protocol: 'udp', ip: officeRouter.uplink, port: 40001, toPort: 51514, fixed: false };
  const withHome = applyAction(FLOORS, { type: 'addActor', actor: { id: 'casa-lucia', name: 'casa-lucia', ip: '192.0.2.77', kind: 'home' } });
  const NONE = without(...EVERY_TERM);
  const NO_ROW_TEXT = '[[router-office]] no tiene ninguna fila en su {{translation-table|tabla de traducciones}} para el {{port|puerto}} 40009 de 203.0.113.10 ({{tcp|TCP}}). No sabe a qué {{device|dispositivo}} entregar el {{packet|paquete}}: no lo entrega a nadie.';

  it('the text of an unsolicited packet says it is not delivered and never that NAT blocks it', () => {
    expect(describeReason(unsolicited, FLOORS, EVERY_TERM)).toBe(NO_ROW_TEXT);
    const trace = simulate(withHome, { from: actor('casa-lucia'), to: officeRouter.uplink, protocol: 'tcp', port: 40009 });
    expect(trace.steps.map((step) => step.reason)).toEqual([{ ...unsolicited }]);
    const neverBlocks = /bloque|filtr|firewall|segur|protege|rechaz|nega|prohib|stateful/i;
    for (const known of [EVERY_TERM, NONE, without('translation-table'), without('nat')]) {
      const texts = [...trace.steps.map((step) => describeReason(step.reason, withHome, known)), OUTCOME_TEXT[trace.outcome]];
      for (const text of texts) expect(toPlainText(text)).not.toMatch(neverBlocks);
    }
    expect(toPlainText(describeReason(unsolicited, FLOORS, EVERY_TERM))).toMatch(/no lo entrega a nadie/);
    expect(toPlainText(describeReason({ ...unsolicited, protocol: 'udp' }, FLOORS, EVERY_TERM))).toMatch(/\(UDP\)/);
  });

  it('says only what the player saw while the table of translations is unknown', () => {
    expect(describeReason(unsolicited, FLOORS, without('translation-table'))).toBe(NOTHING_CAME_BACK);
    expect(describeReason(byRow, FLOORS, without('translation-table'))).toBe('Llega a [[tu-laptop]].');
    expect(describeReason(byForward, FLOORS, without('port-forwarding'))).toBe('Llega a [[laptop-andres]].');
    expect(describeReason(byForward, FLOORS, without('translation-table'))).toBe(describeReason(byForward, FLOORS, EVERY_TERM));
  });

  it('names the forward or the row, the device and both ports', () => {
    expect(describeReason(byForward, FLOORS, EVERY_TERM)).toBe(
      '[[router-office]] tiene un {{port-forwarding|reenvío de puertos}}: lo que llega al {{port|puerto}} 8080 de 203.0.113.10 ({{tcp|TCP}}) va a [[laptop-andres]], al {{port|puerto}} 3000.',
    );
    expect(describeReason(byRow, FLOORS, EVERY_TERM)).toBe(
      'En la {{translation-table|tabla de traducciones}} de [[router-office]] hay una fila para el {{port|puerto}} 40001 de 203.0.113.10 ({{udp|UDP}}): lleva el {{packet|paquete}} a [[tu-laptop]], al {{port|puerto}} 51514.',
    );
  });

  it('tags only the terms the player knows, whichever of its terms is missing, and names a router the map does not draw by its place only', () => {
    for (const reason of [unsolicited, byForward, byRow]) {
      for (const missing of ['translation-table', 'port-forwarding', 'port', 'tcp', 'udp', 'device', 'packet', 'router'] as const) {
        const known = without(missing);
        expect(termsIn(describeReason(reason, FLOORS, known)).filter((tagged) => !known.has(tagged)), `${reason.code} without ${missing}`).toEqual([]);
      }
      const unnamed = toPlainText(describeReason(reason, FLOORS, EVERY_TERM, (): RouterPlace => 'inside'));
      expect(unnamed).not.toContain('router-office');
    }
    expect(toPlainText(describeReason(unsolicited, FLOORS, EVERY_TERM, (): RouterPlace => 'inside'))).toMatch(/^Un router de la oficina no tiene ninguna fila/);
  });
});
