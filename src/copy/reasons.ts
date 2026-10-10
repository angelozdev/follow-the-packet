import type { FirewallKind, Network, Reason } from '@/engine';
import { deviceName } from './packet-labels';
import type { TermText } from './term-text';

type FirewallSentence = (device: TermText) => TermText;

const FIREWALL_TEXT: Record<FirewallKind, { passOut: FirewallSentence; dropOut: FirewallSentence; passIn: FirewallSentence; dropIn: FirewallSentence }> = {
  'security-group': {
    passOut: (device) => `El {{security-group}} de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{outbound-rule}} lo deja salir.`,
    passIn: (device) => `El {{security-group}} de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{inbound-rule}} lo deja entrar.`,
  },
  'host-firewall': {
    passOut: (device) => `El {{firewall}} de ${device} lo deja salir.`,
    dropOut: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja salir.`,
    passIn: (device) => `El {{firewall}} de ${device} lo deja entrar.`,
    dropIn: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja entrar.`,
  },
};

const ROUTE_INSIDE: Record<Network['kind'], TermText> = {
  vpc: 'Viaja por dentro de la {{vpc}}.',
  office: 'Viaja por dentro de la {{network|red}} de la oficina.',
};

function replyText(net: Network, deviceId: string): TermText {
  const device = net.devices.find((d) => d.id === deviceId);
  const kind = net.firewalls.find((f) => device?.firewallIds.includes(f.id))?.kind;
  if (kind === 'security-group') return 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.';
  if (kind === 'host-firewall') return `La respuesta vuelve sola: el {{firewall}} de ${deviceName(net, deviceId)} recuerda la conversación.`;
  return 'La respuesta vuelve por el mismo camino.';
}

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

/** Turns an engine reason into the sentence the player reads, with its terms tagged. */
export function describeReason(reason: Reason, net: Network): TermText {
  switch (reason.code) {
    case 'address-invalid':
      return `${reason.address} no es una dirección {{ipv4}} válida: cada uno de sus cuatro números debe ir de 0 a 255. El {{packet|paquete}} no sale del {{device|dispositivo}}.`;
    case 'address-localhost':
      return `El {{device|dispositivo}} ya conoce el nombre {{localhost}}: significa ${reason.ip}, una dirección de {{loopback}}. No pregunta a nadie.`;
    case 'dns-unresolved':
      return `El {{dns}} no conoce ${reason.name} cuando se pregunta desde ${side(reason.fromInside)} de la {{vpc}}.`;
    case 'dns-resolved':
      return `El {{dns}} convierte ${reason.name} en ${reason.ip} (se preguntó desde ${side(reason.fromInside)} de la {{vpc}}).`;
    case 'route-private-from-outside':
      return 'Internet no entrega paquetes a una {{private-ip}}: la misma IP se repite en muchas redes.';
    case 'route-no-device':
      return 'Ningún {{device|dispositivo}} de la {{network|red}} tiene esa IP: el {{packet|paquete}} no llega a nadie.';
    case 'route-private':
      return ROUTE_INSIDE[net.kind];
    case 'route-no-public-device':
      return `Ninguna {{ec2-instance}} tiene la {{public-ip}} ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${deviceName(net, reason.deviceId)} no tiene {{public-ip}}: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el {{internet-gateway}} y su remitente cambia de ${reason.from} a ${reason.to}: eso es {{nat}}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el {{internet-gateway}}.';
    case 'route-self':
      return 'Va a la propia IP del dispositivo: no sale a la red.';
    case 'route-loopback':
      return `${reason.ip} es una dirección de {{loopback}}: el {{packet|paquete}} se entrega al propio {{device|dispositivo}} y no sale a la {{network|red}}.`;
    case 'firewall-out-pass':
      return FIREWALL_TEXT[reason.firewallKind].passOut(deviceName(net, reason.deviceId));
    case 'firewall-out-drop':
      return FIREWALL_TEXT[reason.firewallKind].dropOut(deviceName(net, reason.deviceId));
    case 'firewall-in-pass':
      return FIREWALL_TEXT[reason.firewallKind].passIn(deviceName(net, reason.deviceId));
    case 'firewall-in-drop':
      return FIREWALL_TEXT[reason.firewallKind].dropIn(deviceName(net, reason.deviceId));
    case 'host-unsolicited-icmp':
      return 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.';
    case 'host-ignores-echo':
      return `Llega, pero ${deviceName(net, reason.deviceId)} tiene {{icmp-echo-ignore-all}} en 1 y no contesta.`;
    case 'host-replies':
      return `${deviceName(net, reason.deviceId)} contesta.`;
    case 'host-refused':
      return `Llega, pero ningún programa escucha en el puerto ${reason.port}: ${deviceName(net, reason.deviceId)} lo rechaza.`;
    case 'host-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'host-udp-no-service':
      return `Llega por UDP al puerto ${reason.port}, pero en este juego ningún programa UDP contesta.`;
    case 'reply-stateful':
      return replyText(net, reason.deviceId);
  }
}
