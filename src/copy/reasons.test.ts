import { describe, expect, it } from 'vitest';
import type { Reason } from '@/engine';
import { simulate } from '@/engine/simulation/simulate';
import { inst, lab03Net, ping } from '@/testing';
import { describeReason } from './reasons';

const NET = lab03Net();
const SG_IN_DROP = 'Descartado en silencio: ninguna regla de entrada de servidor2 coincide en qué y desde dónde a la vez.';

const CASES: [Reason, string][] = [
  [{ code: 'dns-unresolved', name: 'db.internal', fromInside: false }, 'Nadie responde por el nombre db.internal desde fuera de la VPC.'],
  [
    { code: 'dns-resolved', name: 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com', ip: '172.31.38.97', fromInside: true },
    'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com → 172.31.38.97 (preguntando desde dentro de la VPC)',
  ],
  [{ code: 'route-private-from-outside', ip: '172.31.38.97' }, '172.31.38.97 es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.'],
  [{ code: 'route-no-private-instance', ip: '172.31.99.9' }, 'Ninguna instancia tiene la IP 172.31.99.9.'],
  [{ code: 'route-private' }, 'Viaja por dentro de la VPC, con IPs privadas.'],
  [{ code: 'route-no-public-instance', ip: '52.0.0.1' }, 'Ninguna instancia de la VPC tiene la IP pública 52.0.0.1.'],
  [{ code: 'route-no-public-ip', instanceId: 'servidor1' }, 'servidor1 no tiene IP pública: no puede salir a internet.'],
  [{ code: 'route-nat', from: '172.31.16.131', to: '54.78.154.66' }, 'Sale por el internet gateway: el origen cambia de 172.31.16.131 a 54.78.154.66.'],
  [{ code: 'route-from-internet' }, 'Entra desde internet por el internet gateway.'],
  [{ code: 'sg-out-pass', instanceId: 'servidor1' }, 'La salida de servidor1 lo deja salir.'],
  [{ code: 'sg-out-drop', instanceId: 'servidor1' }, 'Ninguna regla de salida de servidor1 coincide.'],
  [{ code: 'sg-in-pass', instanceId: 'servidor2' }, 'El SG de servidor2 lo deja entrar.'],
  [{ code: 'sg-in-drop', instanceId: 'servidor2' }, SG_IN_DROP],
  [{ code: 'linux-unsolicited-icmp', instanceId: 'servidor2', icmpType: 0 }, 'Llega un ICMP echo reply que nadie pidió: Linux no contesta.'],
  [{ code: 'linux-ignores-echo', instanceId: 'servidor2' }, 'Llega, pero Linux de servidor2 tiene icmp_echo_ignore_all=1 y no contesta.'],
  [{ code: 'linux-replies', instanceId: 'servidor2' }, 'Linux de servidor2 contesta.'],
  [{ code: 'linux-refused', instanceId: 'servidor2', port: 80 }, 'Llega, pero nada escucha en el puerto 80: Linux contesta "connection refused".'],
  [{ code: 'linux-accepts', instanceId: 'servidor2', port: 22 }, 'Un programa escucha en el puerto 22 y acepta.'],
  [{ code: 'linux-udp-no-service', instanceId: 'servidor2', port: 53 }, 'Llega un paquete UDP 53, pero en este juego ningún servicio UDP contesta.'],
  [{ code: 'reply-stateful', instanceId: 'servidor2' }, 'La respuesta vuelve sola: el SG es stateful y recuerda la conversación.'],
];

describe('describeReason', () => {
  it.each(CASES)('describes %o in Spanish', (reason, text) => {
    expect(describeReason(reason, NET)).toBe(text);
  });

  it('describes the step where a ping without an ICMP rule dies', () => {
    const trace = simulate(NET, ping(inst('servidor1'), '172.31.38.97'));
    expect(describeReason(trace.steps.at(-1)!.reason, NET)).toBe(SG_IN_DROP);
  });
});
