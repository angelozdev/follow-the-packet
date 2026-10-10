import type { Actor, Device, FirewallKind, Network } from '@/engine';

export interface Term {
  name: string;
  short?: string;
  definition: string;
}

export const TERMS = {
  device: { name: 'dispositivo', definition: 'Un equipo que puede enviar y recibir datos: una laptop, una impresora, un servidor.' },
  network: { name: 'red', definition: 'Un conjunto de dispositivos conectados entre sí que pueden intercambiar datos.' },
  'ip-address': {
    name: 'dirección IP',
    short: 'IP',
    definition: 'El número que identifica a un dispositivo dentro de una red, para que los datos lleguen a él.',
  },
  ipv4: { name: 'IPv4', definition: 'La versión 4 de IP: sus direcciones son cuatro números de 0 a 255 separados por puntos, como 192.168.1.20.' },
  packet: { name: 'paquete', definition: 'Un bloque de datos que viaja por una red con la dirección IP de origen y la de destino.' },
  ping: { name: 'ping', definition: 'Un comando que manda un paquete a una dirección IP y espera que vuelva otro: prueba el camino de ida y vuelta.' },
  protocol: {
    name: 'protocolo',
    definition: 'Un acuerdo entre dispositivos sobre cómo intercambiar datos: qué mensajes existen y qué significa cada uno.',
  },
  request: { name: 'solicitud', definition: 'Un mensaje que le pide algo a otro dispositivo.' },
  response: { name: 'respuesta', definition: 'El mensaje con que un dispositivo contesta una solicitud.' },
  icmp: { name: 'ICMP', definition: 'Internet Control Message Protocol: el protocolo de los mensajes de control entre dispositivos, como los del ping.' },
  'echo-request': { name: 'Echo Request', definition: 'La solicitud ICMP del ping (tipo 8): le pide al destino que conteste con un Echo Reply.' },
  'echo-reply': { name: 'Echo Reply', definition: 'La respuesta ICMP del ping (tipo 0). Solo se envía al recibir un Echo Request, y nadie la contesta.' },
  internet: { name: 'internet', definition: 'La red mundial formada por muchas redes unidas entre sí.' },
  router: { name: 'router', definition: 'Un dispositivo que conecta redes y reenvía cada paquete según su dirección IP de destino.' },
  'private-ip': {
    name: 'IP privada',
    definition: 'Una dirección IPv4 de uso interno (10.x, 172.16–31.x, 192.168.x): se repite en muchas redes e internet no la entrega.',
  },
  firewall: { name: 'firewall', definition: 'Un sistema que revisa el tráfico de un dispositivo y solo deja pasar lo que permite una de sus reglas.' },
  traffic: { name: 'tráfico', definition: 'Los paquetes que circulan por una red.' },
  rule: { name: 'regla', definition: 'Un permiso del firewall: dice qué tráfico puede pasar (Type) y desde dónde (Source).' },
  'ec2-instance': {
    name: 'instancia EC2',
    definition: 'Un servidor virtual en la nube de AWS (Amazon EC2), con su sistema operativo, sus IPs y sus Security Groups.',
  },
  vpc: { name: 'VPC', definition: 'Virtual Private Cloud: una red virtual aislada dentro de AWS, con su propio rango de IPs privadas.' },
  'security-group': {
    name: 'Security Group',
    short: 'SG',
    definition: 'Un firewall virtual de una instancia EC2: solo deja pasar el tráfico que permite una de sus reglas.',
  },
  'inbound-rule': {
    name: 'regla de entrada',
    definition: 'Inbound rule en la consola: un permiso del Security Group con Type (qué tráfico) y Source (su origen).',
  },
  'anywhere-ipv4': {
    name: 'Anywhere-IPv4',
    definition: 'Un Source de la consola que equivale a 0.0.0.0/0: cualquier dirección IPv4, también las de internet.',
  },
  'internet-gateway': {
    name: 'Internet gateway',
    definition: 'El componente de la VPC que permite la comunicación entre la VPC e internet, en los dos sentidos.',
  },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Dar solo los permisos necesarios para una tarea, y solo a quien los necesita.' },
  stateful: { name: 'stateful', definition: 'El Security Group recuerda cada conexión que deja pasar: su respuesta vuelve sin que se evalúen reglas.' },
  'outbound-rule': {
    name: 'regla de salida',
    definition: 'Outbound rule en la consola: un permiso del Security Group para el tráfico que sale, con Type y Destination.',
  },
  cidr: { name: 'CIDR', definition: 'Una notación para un rango de IPs, IP/número: /32 es una sola IP; /16, 65 536; 0.0.0.0/0, todas las IPv4.' },
  'vpc-range': { name: 'rango CIDR de la VPC', definition: 'El rango de IPs privadas de la VPC, escrito como un CIDR (por ejemplo 172.31.0.0/16).' },
  'public-ip': { name: 'IP pública', definition: 'La dirección IPv4 de una instancia que se alcanza desde internet.' },
  nat: {
    name: 'NAT',
    definition: 'Network Address Translation: al salir por el Internet gateway, la IP privada del remitente se cambia por su IP pública.',
  },
  dns: { name: 'DNS', definition: 'Domain Name System: el sistema que traduce un nombre a una IP.' },
  'public-dns-name': {
    name: 'nombre DNS público',
    definition: 'Public IPv4 DNS en la consola: el nombre público de la instancia. Desde dentro de la VPC resuelve a la IP privada.',
  },
  'private-dns-name': {
    name: 'nombre DNS privado',
    definition: 'Private IP DNS name en la consola: el nombre de la instancia que solo resuelve dentro de la VPC.',
  },
  tcpdump: { name: 'tcpdump', definition: 'Un programa de Linux que muestra los paquetes que pasan por la interfaz de red de la máquina.' },
  'icmp-echo-ignore-all': {
    name: 'icmp_echo_ignore_all',
    definition: 'Un ajuste del kernel de Linux: en 1, la instancia recibe el Echo Request pero no lo contesta.',
  },
  'default-sg': {
    name: 'Security Group default',
    definition: 'El Security Group que AWS crea con cada VPC: deja entrar solo el tráfico de lo que tiene ese mismo Security Group.',
  },
  'multiple-sgs': {
    name: 'varios Security Groups',
    definition: 'Una instancia puede tener varios Security Groups: sus reglas se suman y basta con que una permita el tráfico.',
  },
} as const satisfies Record<string, Term>;

export type TermId = keyof typeof TERMS;

export function isTermId(value: string): value is TermId {
  return Object.hasOwn(TERMS, value);
}

export type PacketMessage = 'echo-request' | 'echo-reply';

export interface EntityVariants {
  network: Network['kind'];
  device: Device['kind'];
  firewall: FirewallKind;
  edge: Network['edge'];
  internet: 'internet';
  actor: Actor['kind'];
  packet: PacketMessage;
}

export type EntityKind = keyof EntityVariants;

type VariantOf<Kind extends EntityKind> = { kind: Kind; variant: EntityVariants[Kind] };

/** One entity of the map in one of its variants, as the entity catalog draws it; a packet can also be an intruder's. */
export type EntityRef = { [Kind in EntityKind]: Kind extends 'packet' ? VariantOf<Kind> & { intruder?: boolean } : VariantOf<Kind> }[EntityKind];

/** The term that names each variant of each entity, or null while the ladder has no term for it. */
export const ENTITY_TERMS: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermId | null> } = {
  network: { office: 'network', vpc: 'vpc' },
  device: { laptop: 'device', printer: 'device', 'ec2-instance': 'ec2-instance' },
  firewall: { 'host-firewall': 'firewall', 'security-group': 'security-group' },
  edge: { router: 'router', 'internet-gateway': 'internet-gateway' },
  internet: { internet: 'internet' },
  actor: { you: null, attacker: null, home: null },
  packet: { 'echo-request': 'echo-request', 'echo-reply': 'echo-reply' },
};

/** The entity whose icon goes with each term that names one: a term that names several variants (device) shows the first one, and `packet`, which names every packet, shows an Echo Request. A term left out, like least-privilege, has no icon. */
export const TERM_ENTITY: Partial<Record<TermId, EntityRef>> = {
  network: { kind: 'network', variant: 'office' },
  device: { kind: 'device', variant: 'laptop' },
  packet: { kind: 'packet', variant: 'echo-request' },
  internet: { kind: 'internet', variant: 'internet' },
  router: { kind: 'edge', variant: 'router' },
  firewall: { kind: 'firewall', variant: 'host-firewall' },
  vpc: { kind: 'network', variant: 'vpc' },
  'ec2-instance': { kind: 'device', variant: 'ec2-instance' },
  'security-group': { kind: 'firewall', variant: 'security-group' },
  'internet-gateway': { kind: 'edge', variant: 'internet-gateway' },
  'echo-request': { kind: 'packet', variant: 'echo-request' },
  'echo-reply': { kind: 'packet', variant: 'echo-reply' },
};

/** Returns the term that names an entity in this variant, or null when it has none yet. */
export function entityTerm(entity: EntityRef): TermId | null {
  const terms: Record<string, TermId | null> = ENTITY_TERMS[entity.kind];
  return terms[entity.variant];
}

function variantsOf<Kind extends EntityKind>(kind: Kind): EntityVariants[Kind][] {
  return Object.keys(ENTITY_TERMS[kind]) as EntityVariants[Kind][];
}

/** Every entity in every variant, in the order of ENTITY_TERMS, with each packet also as an intruder's. */
export const ENTITY_REFS: EntityRef[] = [
  ...variantsOf('network').map((variant) => ({ kind: 'network', variant }) as const),
  ...variantsOf('device').map((variant) => ({ kind: 'device', variant }) as const),
  ...variantsOf('firewall').map((variant) => ({ kind: 'firewall', variant }) as const),
  ...variantsOf('edge').map((variant) => ({ kind: 'edge', variant }) as const),
  ...variantsOf('internet').map((variant) => ({ kind: 'internet', variant }) as const),
  ...variantsOf('actor').map((variant) => ({ kind: 'actor', variant }) as const),
  ...variantsOf('packet').flatMap((variant) => [{ kind: 'packet', variant } as const, { kind: 'packet', variant, intruder: true } as const]),
];
