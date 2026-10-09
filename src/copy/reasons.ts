import type { Network, Reason } from '@/engine';
import { deviceName } from './packet-labels';
import type { TermText } from './term-text';

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

/** Turns an engine reason into the sentence the player reads, with its terms tagged. */
export function describeReason(reason: Reason, net: Network): TermText {
  switch (reason.code) {
    case 'dns-unresolved':
      return `El {{dns}} no conoce ${reason.name} cuando se pregunta desde ${side(reason.fromInside)} de la {{vpc}}.`;
    case 'dns-resolved':
      return `El {{dns}} convierte ${reason.name} en ${reason.ip} (se preguntó desde ${side(reason.fromInside)} de la {{vpc}}).`;
    case 'route-private-from-outside':
      return `${reason.ip} es una {{private-ip}}: desde internet no hay camino hasta ella.`;
    case 'route-no-private-instance':
      return `Ninguna {{ec2-instance}} tiene la {{private-ip}} ${reason.ip}.`;
    case 'route-private':
      return 'Viaja por dentro de la {{vpc}}.';
    case 'route-no-public-instance':
      return `Ninguna {{ec2-instance}} tiene la {{public-ip}} ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${deviceName(net, reason.instanceId)} no tiene {{public-ip}}: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el {{internet-gateway}} y su remitente cambia de ${reason.from} a ${reason.to}: eso es {{nat}}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el {{internet-gateway}}.';
    case 'sg-out-pass':
      return `El {{security-group}} de ${deviceName(net, reason.instanceId)} lo deja salir.`;
    case 'sg-out-drop':
      return `Se queda en el {{security-group}} de ${deviceName(net, reason.instanceId)}: ninguna {{outbound-rule}} lo deja salir.`;
    case 'sg-in-pass':
      return `El {{security-group}} de ${deviceName(net, reason.instanceId)} lo deja entrar.`;
    case 'sg-in-drop':
      return `Se queda en el {{security-group}} de ${deviceName(net, reason.instanceId)}: ninguna {{inbound-rule}} lo deja entrar.`;
    case 'linux-unsolicited-icmp':
      return `Llega un {{echo-reply}} que nadie pidió: ${deviceName(net, reason.instanceId)} no contesta.`;
    case 'linux-ignores-echo':
      return `Llega, pero ${deviceName(net, reason.instanceId)} tiene {{icmp-echo-ignore-all}} en 1 y no contesta.`;
    case 'linux-replies':
      return `${deviceName(net, reason.instanceId)} contesta.`;
    case 'linux-refused':
      return `Llega, pero ningún programa escucha en el puerto ${reason.port}: ${deviceName(net, reason.instanceId)} lo rechaza.`;
    case 'linux-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'linux-udp-no-service':
      return `Llega por UDP al puerto ${reason.port}, pero en este juego ningún programa UDP contesta.`;
    case 'reply-stateful':
      return 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.';
  }
}
