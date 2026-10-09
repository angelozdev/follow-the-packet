import { describe, expect, it } from 'vitest';
import { simulate, type Reason } from '@/engine';
import { device, lab03Net, ping } from '@/testing';
import { describeReason } from './reasons';
import { termsIn, toPlainText } from './term-text';

const NET = lab03Net();
const SG_IN_DROP = 'Se queda en el {{security-group}} de servidor2: ninguna {{inbound-rule}} lo deja entrar.';
const PUBLIC_NAME = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

const CASES: [Reason, string][] = [
  [{ code: 'dns-unresolved', name: 'db.internal', fromInside: false }, 'El {{dns}} no conoce db.internal cuando se pregunta desde fuera de la {{vpc}}.'],
  [
    { code: 'dns-resolved', name: PUBLIC_NAME, ip: '172.31.38.97', fromInside: true },
    `El {{dns}} convierte ${PUBLIC_NAME} en 172.31.38.97 (se preguntó desde dentro de la {{vpc}}).`,
  ],
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.'],
  [{ code: 'route-no-device', ip: '192.168.1.30' }, 'Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
  [{ code: 'route-no-public-device', ip: '52.0.0.1' }, 'Ninguna {{ec2-instance}} tiene la {{public-ip}} 52.0.0.1.'],
  [{ code: 'route-no-public-ip', deviceId: 'servidor1' }, 'servidor1 no tiene {{public-ip}}: no puede salir a internet.'],
  [
    { code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' },
    'Sale por el {{internet-gateway}} y su remitente cambia de 172.31.16.131 a 54.78.154.66: eso es {{nat}}.',
  ],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],
  [{ code: 'route-self', deviceId: 'your-laptop' }, 'Va a la propia IP del dispositivo: no sale a la red.'],
  [{ code: 'firewall-out-pass', deviceId: 'servidor1' }, 'El {{security-group}} de servidor1 lo deja salir.'],
  [{ code: 'firewall-out-drop', deviceId: 'servidor1' }, 'Se queda en el {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.'],
  [{ code: 'firewall-in-pass', deviceId: 'servidor2' }, 'El {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'firewall-in-drop', deviceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'host-unsolicited-icmp', deviceId: 'servidor2', icmpType: 0 }, 'Llega un {{echo-reply}} que nadie pidió: servidor2 no contesta.'],
  [{ code: 'host-ignores-echo', deviceId: 'servidor2' }, 'Llega, pero servidor2 tiene {{icmp-echo-ignore-all}} en 1 y no contesta.'],
  [{ code: 'host-replies', deviceId: 'servidor2' }, 'servidor2 contesta.'],
  [{ code: 'host-refused', deviceId: 'servidor2', port: 80 }, 'Llega, pero ningún programa escucha en el puerto 80: servidor2 lo rechaza.'],
  [{ code: 'host-accepts', deviceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'host-udp-no-service', deviceId: 'servidor2', port: 53 }, 'Llega por UDP al puerto 53, pero en este juego ningún programa UDP contesta.'],
  [{ code: 'reply-stateful', deviceId: 'servidor2' }, 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.'],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it.each(CASES)('tags only registered terms: %o', (reason) => {
    expect(() => termsIn(describeReason(reason, NET))).not.toThrow();
  });

  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
    const trace = simulate(NET, ping(device('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });
});
