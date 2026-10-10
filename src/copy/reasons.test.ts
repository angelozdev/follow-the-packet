import { describe, expect, it } from 'vitest';
import { simulate, type Reason } from '@/engine';
import { OFFICE_FLOORS, device, lab03Net, officeNet, officeTwoFloorsNet, ping, withDevice } from '@/testing';
import { describeReason } from './reasons';
import { termsIn, toPlainText } from './term-text';

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
  [{ code: 'host-udp-no-service', deviceId: 'servidor2', port: 53 }, 'Llega por UDP al puerto 53, pero en este juego ningún programa UDP contesta.'],
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
    '[[impresora]] tiene la IP 192.168.1.21, la {{default-gateway}} que se configuró, pero no es un {{router}}: recibe el {{packet|paquete}}, no lo reenvía y no vuelve nada.',
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

describe('describeReason', () => {
  it.each(CASES)('describes %o', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it.each(CASES)('tags only registered terms: %o', (reason) => {
    expect(() => termsIn(describeReason(reason, NET))).not.toThrow();
  });

  it('describes address-invalid, address-localhost and route-loopback with registered terms only', () => {
    for (const [reason, text, terms] of ADDRESS_CASES) {
      expect(describeReason(reason, NET)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
    }
    const invalid = describeReason(ADDRESS_CASES[0][0], NET);
    expect(termsIn(invalid)).not.toContain('dns');
    expect(toPlainText(invalid)).not.toMatch(/dns|nombre/i);
  });

  it('describes route-no-gateway, route-not-connected, route-gateway-not-a-router and forward-no-owner with registered terms only', () => {
    for (const [reason, text, terms] of DELIVERY_CASES) {
      expect(describeReason(reason, FLOORS)).toBe(text);
      expect(termsIn(text)).toEqual(terms);
      expect(toPlainText(text)).not.toMatch(/\b(arp|mac)\b/i);
    }
  });

  it('an office names its own network and its own firewalls, not the VPC nor a Security Group', () => {
    const office = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    expect(describeReason({ code: 'route-private' }, office)).toBe('Viaja por dentro de la {{network|red}} de la oficina.');
    expect(describeReason({ code: 'reply-stateful', deviceId: 'lucia-laptop' }, office)).toBe(
      'La respuesta vuelve sola: el {{firewall}} de [[lucia-laptop]] recuerda la conversación.',
    );
    expect(describeReason({ code: 'reply-stateful', deviceId: 'printer' }, office)).toBe('La respuesta vuelve por el mismo camino.');
  });

  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
    const trace = simulate(NET, ping(device('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });
});
