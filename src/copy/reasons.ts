import { describePacket, type Network, type Reason } from '@/engine';

function instanceName(net: Network, instanceId: string): string {
  return net.instances.find((i) => i.id === instanceId)?.name ?? instanceId;
}

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

export function describeReason(reason: Reason, net: Network): string {
  switch (reason.code) {
    case 'dns-unresolved':
      return `Nadie responde por el nombre ${reason.name} desde ${side(reason.fromInside)} de la VPC.`;
    case 'dns-resolved':
      return `${reason.name} → ${reason.ip} (preguntando desde ${side(reason.fromInside)} de la VPC)`;
    case 'route-private-from-outside':
      return `${reason.ip} es una IP privada: solo existe dentro de la VPC. Desde internet no hay camino.`;
    case 'route-no-private-instance':
      return `Ninguna instancia tiene la IP ${reason.ip}.`;
    case 'route-private':
      return 'Viaja por dentro de la VPC, con IPs privadas.';
    case 'route-no-public-instance':
      return `Ninguna instancia de la VPC tiene la IP pública ${reason.ip}.`;
    case 'route-no-public-ip':
      return `${instanceName(net, reason.instanceId)} no tiene IP pública: no puede salir a internet.`;
    case 'route-nat':
      return `Sale por el internet gateway: el origen cambia de ${reason.from} a ${reason.to}.`;
    case 'route-from-internet':
      return 'Entra desde internet por el internet gateway.';
    case 'sg-out-pass':
      return `La salida de ${instanceName(net, reason.instanceId)} lo deja salir.`;
    case 'sg-out-drop':
      return `Ninguna regla de salida de ${instanceName(net, reason.instanceId)} coincide.`;
    case 'sg-in-pass':
      return `El SG de ${instanceName(net, reason.instanceId)} lo deja entrar.`;
    case 'sg-in-drop':
      return `Descartado en silencio: ninguna regla de entrada de ${instanceName(net, reason.instanceId)} coincide en qué y desde dónde a la vez.`;
    case 'linux-unsolicited-icmp':
      return `Llega un ${describePacket({ protocol: 'icmp', icmpType: reason.icmpType })} que nadie pidió: Linux no contesta.`;
    case 'linux-ignores-echo':
      return `Llega, pero Linux de ${instanceName(net, reason.instanceId)} tiene icmp_echo_ignore_all=1 y no contesta.`;
    case 'linux-replies':
      return `Linux de ${instanceName(net, reason.instanceId)} contesta.`;
    case 'linux-refused':
      return `Llega, pero nada escucha en el puerto ${reason.port}: Linux contesta "connection refused".`;
    case 'linux-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'linux-udp-no-service':
      return `Llega un paquete UDP ${reason.port}, pero en este juego ningún servicio UDP contesta.`;
    case 'reply-stateful':
      return 'La respuesta vuelve sola: el SG es stateful y recuerda la conversación.';
  }
}
