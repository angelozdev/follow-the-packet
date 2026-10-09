import { describe, expect, it } from 'vitest';
import { simulate, type Reason } from '@/engine';
import { inst, lab03Net, ping } from '@/testing';
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
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, '172.31.38.97 es una {{private-ip}}: desde internet no hay camino hasta ella.'],
  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ninguna {{ec2-instance}} tiene la {{private-ip}} 172.31.99.9.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la {{vpc}}.'],
  [{ code: 'route-no-public-instance', ip: '52.0.0.1' }, 'Ninguna {{ec2-instance}} tiene la {{public-ip}} 52.0.0.1.'],
  [{ code: 'route-no-public-ip', instanceId: 'servidor1' }, 'servidor1 no tiene {{public-ip}}: no puede salir a internet.'],
  [
    { code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' },
    'Sale por el {{internet-gateway}} y su remitente cambia de 172.31.16.131 a 54.78.154.66: eso es {{nat}}.',
  ],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el {{internet-gateway}}.'],
  [{ code: 'sg-out-pass', instanceId: 'servidor1' }, 'El {{security-group}} de servidor1 lo deja salir.'],
  [{ code: 'sg-out-drop', instanceId: 'servidor1' }, 'Se queda en el {{security-group}} de servidor1: ninguna {{outbound-rule}} lo deja salir.'],
  [{ code: 'sg-in-pass', instanceId: 'servidor2' }, 'El {{security-group}} de servidor2 lo deja entrar.'],
  [{ code: 'sg-in-drop', instanceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'linux-unsolicited-icmp', instanceId: 'servidor2', icmpType: 0 }, 'Llega un {{echo-reply}} que nadie pidió: servidor2 no contesta.'],
  [{ code: 'linux-ignores-echo', instanceId: 'servidor2' }, 'Llega, pero servidor2 tiene {{icmp-echo-ignore-all}} en 1 y no contesta.'],
  [{ code: 'linux-replies', instanceId: 'servidor2' }, 'servidor2 contesta.'],
  [{ code: 'linux-refused', instanceId: 'servidor2', port: 80 }, 'Llega, pero ningún programa escucha en el puerto 80: servidor2 lo rechaza.'],
  [{ code: 'linux-accepts', instanceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'linux-udp-no-service', instanceId: 'servidor2', port: 53 }, 'Llega por UDP al puerto 53, pero en este juego ningún programa UDP contesta.'],
  [{ code: 'reply-stateful', instanceId: 'servidor2' }, 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.'],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it.each(CASES)('tags only registered terms: %o', (reason) => {
    expect(() => termsIn(describeReason(reason, NET))).not.toThrow();
  });

  it('a ping without an ICMP rule stops at the Security Group, named by its official name', () => {
    const trace = simulate(NET, ping(inst('servidor1'), '172.31.38.97'));
    const text = describeReason(trace.steps.at(-1)!.reason, NET);
    expect(text).toBe(SG_IN_DROP);
    expect(toPlainText(text)).toBe('Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.');
  });
});
