import type { ClientActor, Device, FirewallKind, Network } from '@/engine';

export interface Term {
  name: string;
  short?: string;
  definition: string;
}

export const TERMS = {
  device: { name: 'dispositivo', definition: 'Un equipo que envía y recibe datos, como una laptop o una impresora. También se le llama host.' },
  network: { name: 'red', definition: 'Un conjunto de dispositivos conectados entre sí que pueden intercambiar datos. Cada uno tiene su dirección IP.' },
  'ip-address': {
    name: 'dirección IP',
    short: 'IP',
    definition: 'El identificador de un dispositivo en una red: los datos llegan al que tiene esa IP. Debe ser único en su red.',
  },
  ipv4: { name: 'IPv4', definition: 'La versión 4 de las direcciones IP: cuatro números de 0 a 255 separados por puntos, como 192.168.1.20.' },
  packet: { name: 'paquete', definition: 'Un bloque de datos que viaja por una red. Lleva un encabezado con la IP de origen y la IP de destino.' },
  header: {
    name: 'encabezado',
    definition: 'La parte del paquete que va antes del contenido. Lleva, entre otras cosas, la IP de origen y la IP de destino.',
  },
  'source-ip': { name: 'IP de origen', definition: 'La dirección IP del dispositivo que envía el paquete.' },
  'destination-ip': { name: 'IP de destino', definition: 'La dirección IP del dispositivo al que va el paquete: la red lo entrega al que tiene esa IP.' },
  ping: { name: 'ping', definition: 'Un comando que manda un Echo Request a una dirección IP y espera un Echo Reply: prueba si el destino contesta.' },
  protocol: {
    name: 'protocolo',
    definition: 'Un acuerdo entre dispositivos sobre cómo intercambiar datos: qué mensajes existen y qué significa cada uno.',
  },
  icmp: { name: 'ICMP', definition: 'Internet Control Message Protocol: el protocolo de los mensajes de control entre dispositivos, como los del ping.' },
  'echo-request': { name: 'Echo Request', definition: 'El mensaje ICMP con que empieza un ping: le pide al destino que conteste con un Echo Reply.' },
  'echo-reply': { name: 'Echo Reply', definition: 'El mensaje ICMP con que el destino contesta un Echo Request. Nadie contesta un Echo Reply.' },
  loopback: {
    name: 'loopback',
    definition: 'Las direcciones IP 127.x.x.x, como 127.0.0.1: son del propio dispositivo, y un paquete enviado a ellas no sale de él.',
  },
  localhost: { name: 'localhost', definition: 'Un nombre reservado para el propio dispositivo: apunta a la dirección de loopback, 127.0.0.1 en IPv4.' },
  rtt: {
    name: 'RTT',
    definition: 'Round-Trip Time, tiempo de ida y vuelta: el tiempo entre enviar un paquete y recibir lo que vuelve.',
  },
  timeout: {
    name: 'timeout',
    definition: 'Lo que ve quien envió un paquete y no recibió nada en el tiempo de espera: no sabe si se perdió o si nadie contestó.',
  },
  'host-unreachable': {
    name: 'Destination Host Unreachable',
    definition: 'Un aviso ICMP de que no se llegó al dispositivo de destino. Lo manda quien intentaba entregarle el paquete.',
  },
  lan: {
    name: 'red local',
    definition: 'Local Area Network (LAN): la red de un mismo lugar, como un piso. Dentro de ella, los paquetes se entregan directo.',
  },
  'default-gateway': {
    name: 'puerta de enlace predeterminada',
    definition: 'Un ajuste guardado: la IP a la que un dispositivo manda los paquetes que van a otra red local. Debe ser la de un router.',
  },
  hop: {
    name: 'salto',
    definition: 'Cada paso de un paquete por un router en su camino al destino: el número de saltos es el de routers que cruza.',
  },
  ttl: {
    name: 'TTL',
    definition: 'Time to Live: un número del encabezado. Cada router le resta al menos 1; si llega a 0, el paquete no se reenvía.',
  },
  'time-exceeded': {
    name: 'Time Exceeded',
    definition: 'Un aviso ICMP: un router lo manda a quien envió el paquete cuando su TTL llega a 0 y no puede reenviarlo.',
  },
  traceroute: {
    name: 'traceroute',
    definition: 'Un comando que lista los routers que avisan en un camino: manda paquetes con TTL 1, 2, 3… y anota sus Time Exceeded.',
  },
  internet: { name: 'internet', definition: 'La red mundial formada por muchas redes unidas entre sí.' },
  router: { name: 'router', definition: 'Un dispositivo que conecta redes: recibe paquetes que no son para él y los reenvía hacia la red de su IP de destino.' },
  'private-ip': {
    name: 'IP privada',
    definition: 'Una dirección IPv4 de uso interno (10.x, 172.16–31.x, 192.168.x): se repite en muchas redes e internet no la entrega.',
  },
  firewall: { name: 'firewall', definition: 'Un sistema que revisa el tráfico de un dispositivo y decide qué paquetes deja pasar y cuáles no.' },
  traffic: { name: 'tráfico', definition: 'Los paquetes que circulan por una red.' },
  drop: {
    name: 'descartar',
    definition: 'Tirar un paquete sin entregarlo ni reenviarlo. Quien lo tira puede avisar a quien lo envió o callar.',
  },
  rule: { name: 'regla', definition: 'Un permiso del firewall: dice qué tipo de tráfico deja pasar (Type) y de qué IP de origen (Source).' },
  allow: { name: 'permitir', definition: 'Dejar pasar un paquete por el firewall, porque una de sus reglas lo autoriza.' },
  deny: { name: 'denegar', definition: 'No dejar pasar un paquete por el firewall.' },
  'default-deny': {
    name: 'denegación por defecto',
    definition: 'Todo lo que ninguna regla permite queda denegado, sin que haga falta otra regla.',
  },
  inbound: {
    name: 'entrada',
    definition: 'El sentido del tráfico que llega a un dispositivo. Sus reglas dicen de qué IP de origen puede llegar (Source).',
  },
  outbound: {
    name: 'salida',
    definition: 'El sentido del tráfico que sale de un dispositivo. Sus reglas dicen a qué IP de destino puede ir (Destination).',
  },
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
  cidr: { name: 'CIDR', definition: 'Un bloque de IPs escrito IP/prefijo: /24 son 256 IPs; /32, una sola; 0.0.0.0/0, todas las IPv4.' },
  'vpc-range': { name: 'rango CIDR de la VPC', definition: 'El rango de IPs privadas de la VPC, escrito como un CIDR (por ejemplo 172.31.0.0/16).' },
  'public-ip': { name: 'IP pública', definition: 'Una dirección IPv4 que se alcanza desde internet, a diferencia de una IP privada.' },
  nat: {
    name: 'NAT',
    definition: 'Network Address Translation: cambia la IP privada de origen por una pública al salir de la red, y lo deshace al volver.',
  },
  dns: { name: 'DNS', definition: 'Domain Name System: el sistema que convierte un nombre de dominio en una IP. Usa el puerto 53.' },
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
  service: { name: 'servicio', definition: 'Un programa de un dispositivo que atiende los paquetes que le llegan de otros dispositivos.' },
  port: { name: 'puerto', definition: 'Un número de 1 a 65535 que, junto con la IP, dice a qué servicio de un dispositivo va un paquete.' },
  listen: { name: 'escuchar', definition: 'Un servicio escucha cuando espera paquetes en un puerto de una de las IPs del dispositivo.' },
  'ip-port': { name: 'IP:puerto', definition: 'La IP y el puerto juntos, como 192.168.1.40:22. Señalan un servicio concreto de un dispositivo concreto.' },
  'destination-port': { name: 'puerto de destino', definition: 'El puerto del servicio al que va el paquete.' },
  nc: { name: 'nc', definition: 'Una herramienta de consola. nc -vz IP puerto prueba si hay un servicio escuchando en ese puerto, sin enviarle datos.' },
  'client-server': {
    name: 'cliente y servidor',
    definition: 'El cliente inicia el contacto y el servidor espera y responde. Son roles de cada intercambio, no tipos de equipo.',
  },
  tcp: { name: 'TCP', definition: 'Transmission Control Protocol: abre una conexión, entrega los datos en orden y reenvía lo que se pierde.' },
  connection: { name: 'conexión', definition: 'Un intercambio TCP entre dos IP:puerto: se abre, se usa y se cierra.' },
  handshake: {
    name: 'saludo de tres pasos',
    definition: 'Así abre TCP una conexión: el cliente manda SYN, el servidor contesta SYN-ACK y el cliente confirma con ACK.',
  },
  'source-port': { name: 'puerto de origen', definition: 'El puerto desde el que sale el paquete. A ese puerto vuelve la respuesta.' },
  'ephemeral-port': {
    name: 'puerto efímero',
    definition: 'El puerto de origen que el dispositivo elige para cada intercambio nuevo. Su rango depende del sistema operativo.',
  },
  'closed-port': { name: 'puerto cerrado', definition: 'Un puerto donde nadie escucha. En TCP, el dispositivo lo avisa con un RST.' },
  rst: { name: 'RST', definition: 'Un paquete TCP que dice «aquí no hay conexión». Lo manda quien recibe un SYN en un puerto donde nadie escucha.' },
  'connection-refused': {
    name: 'Connection refused',
    definition: 'El error de quien conecta a un puerto que rechaza la conexión: llegó un RST. Casi siempre, un puerto cerrado.',
  },
  'filtered-port': { name: 'puerto filtrado', definition: 'Un puerto cuyo tráfico descarta un firewall: nadie contesta y quien envía solo ve un timeout.' },
  'listen-address': {
    name: 'dirección de escucha',
    definition: 'La IP en la que escucha un servicio: 127.0.0.1 atiende solo al propio dispositivo; 0.0.0.0, a todas sus IPs.',
  },
  bit: { name: 'bit', definition: 'La unidad mínima de datos: un 0 o un 1. Una IPv4 tiene 32 bits: cuatro números de 8 bits.' },
  prefix: { name: 'prefijo', definition: 'Los primeros bits de una IP, iguales para todo un bloque. Los demás bits distinguen a cada dispositivo del bloque.' },
  'subnet-mask': { name: 'máscara de subred', definition: 'El prefijo escrito como una IP: los bits en 1 son la parte fija. /24 es 255.255.255.0.' },
  'port-range': {
    name: 'rango de puertos',
    definition: 'El puerto o los puertos que permite una regla: uno solo (22) o un rango (7000-8000). Va junto al protocolo.',
  },
  ssh: { name: 'SSH', definition: 'Secure Shell: el servicio para manejar un servidor desde una consola remota. Escucha por costumbre en el puerto 22.' },
  'default-port': {
    name: 'puerto por defecto',
    definition: 'El puerto que usa un servicio si nadie lo cambia: 22 para SSH, 80, 443, 3306, 5432. Es costumbre: nada obliga a usarlo.',
  },
  /** The System Ports, 0 to 1023, as IANA assigns them. Source: RFC 6335 §6, «System Ports, also known as the Well Known Ports» (consulted 2026-10-11). */
  'well-known-ports': {
    name: 'puertos conocidos',
    definition: 'Los puertos del 0 al 1023, que IANA reserva para servicios comunes, como el 22 de SSH.',
  },
  route: { name: 'ruta', definition: 'Una instrucción de reenvío: los paquetes para un bloque de IPs van directo o a un router concreto.' },
  'routing-table': { name: 'tabla de rutas', definition: 'La lista de rutas de un dispositivo o router. Cada paquete que sale se compara con ella.' },
  'connected-route': {
    name: 'ruta de red conectada',
    definition: 'La ruta del bloque al que el dispositivo está conectado: esos paquetes se entregan directo, sin router.',
  },
  'default-route': {
    name: 'ruta por defecto',
    definition: 'La ruta 0.0.0.0/0: recibe lo que ninguna otra ruta cubre. Va a la puerta de enlace predeterminada.',
  },
  'next-hop': { name: 'siguiente salto', definition: 'La IP del router al que se entrega el paquete en el próximo paso de su camino.' },
  'net-unreachable': {
    name: 'Destination Net Unreachable',
    definition: 'Un aviso ICMP de que un router no tiene ruta a esa red. Es el par de Destination Host Unreachable.',
  },
  'most-specific-route': {
    name: 'ruta más específica',
    definition: 'Si varias rutas cubren un destino, gana la de prefijo más largo: /32 antes que /24, y /24 antes que 0.0.0.0/0.',
  },
  napt: {
    name: 'traducción de puertos',
    definition: 'NAT que también cambia el puerto de origen. Así muchas IPs privadas comparten una pública sin mezclarse.',
  },
  'translation-table': {
    name: 'tabla de traducciones',
    definition: 'La lista que guarda el router con cada IP:puerto privado y su IP:puerto público, para devolver cada respuesta.',
  },
  'port-forwarding': {
    name: 'reenvío de puertos',
    definition: 'Una traducción fija: lo que llega a la IP pública del router en un puerto va a un dispositivo interno.',
  },
  'domain-name': {
    name: 'nombre de dominio',
    definition: 'Un nombre legible, como lucia.example, escrito por niveles separados por puntos. Se lee de derecha a izquierda.',
  },
  'dns-query': { name: 'consulta DNS', definition: 'Una pregunta por un nombre. La respuesta trae su IP o dice que no existe. Suele viajar por UDP.' },
  resolver: { name: 'resolver', definition: 'El servidor DNS al que pregunta un dispositivo. Si no conoce la respuesta, la busca por él.' },
  udp: { name: 'UDP', definition: 'User Datagram Protocol: manda cada mensaje suelto, sin conexión ni confirmación. Si se pierde, UDP no lo reenvía.' },
  dig: { name: 'dig', definition: 'Una herramienta de consola que hace una consulta DNS y muestra la respuesta completa, con su estado.' },
  dhcp: { name: 'DHCP', definition: 'Dynamic Host Configuration Protocol: un servidor presta a cada dispositivo su IP, máscara, puerta de enlace y DNS.' },
  'authoritative-server': { name: 'servidor autoritativo', definition: 'El servidor DNS que guarda los registros de un dominio y da la respuesta definitiva.' },
  'dns-record': { name: 'registro DNS', definition: 'Una entrada del DNS con cuatro datos: nombre, tipo, valor y cuánto tiempo puede guardarse.' },
  'a-record': { name: 'registro A', definition: 'Un registro que asocia un nombre con una IPv4.' },
  'cname-record': {
    name: 'registro CNAME',
    definition: 'Un registro que hace de un nombre un alias de otro nombre, no de una IP. Ese nombre no puede tener más registros.',
  },
  'dns-cache': { name: 'caché DNS', definition: 'Las respuestas que el resolver guarda para no preguntar de nuevo, hasta que vence su tiempo de vida.' },
  'dns-ttl': { name: 'TTL de DNS', definition: 'Los segundos que una respuesta puede quedar en caché. No es el TTL de IP, que cuenta saltos.' },
  nxdomain: { name: 'NXDOMAIN', definition: 'La respuesta del DNS «ese nombre no existe». El resolver también la guarda en caché un tiempo.' },
  servfail: { name: 'SERVFAIL', definition: 'La respuesta del DNS «el servidor no pudo contestar». No dice si el nombre existe.' },
  'port-unreachable': { name: 'Port Unreachable', definition: 'Un aviso ICMP de que ningún programa escucha en ese puerto UDP. Es el par del RST de TCP.' },
  'hosts-file': { name: 'archivo hosts', definition: 'Un archivo del dispositivo que asocia nombres con IPs, sin usar DNS. Ahí suele estar localhost.' },
} as const satisfies Record<string, Term>;

export type TermId = keyof typeof TERMS;

export function isTermId(value: string): value is TermId {
  return Object.hasOwn(TERMS, value);
}

export type PacketMessage = 'echo-request' | 'echo-reply';

/** What a packet is drawn as: one of the messages a sender sends, or the warning that comes back to it. Every kind of warning (Destination Host Unreachable, Time Exceeded) is one look, named by its own term in the trace and by none here. */
export type PacketVariant = PacketMessage | 'warning';

export interface EntityVariants {
  network: Network['kind'];
  device: Device['kind'] | 'internet-server';
  firewall: FirewallKind;
  edge: Network['edge'];
  internet: 'internet';
  actor: ClientActor['kind'];
  packet: PacketVariant;
}

export type EntityKind = keyof EntityVariants;

type VariantOf<Kind extends EntityKind> = { kind: Kind; variant: EntityVariants[Kind] };

type PacketRef = { kind: 'packet'; variant: PacketMessage; intruder?: boolean } | { kind: 'packet'; variant: 'warning' };

/** One entity of the map in one of its variants, as the entity catalog draws it; a message a sender sends can also be an intruder's, and a warning never is: it comes from the network, not from the sender. */
export type EntityRef = { [Kind in Exclude<EntityKind, 'packet'>]: VariantOf<Kind> }[Exclude<EntityKind, 'packet'>] | PacketRef;

/** The term that names each variant of each entity, or null while the ladder has no term for it. */
export const ENTITY_TERMS: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermId | null> } = {
  network: { office: 'network', vpc: 'vpc' },
  device: { laptop: 'device', printer: 'device', 'ec2-instance': 'ec2-instance', 'internet-server': 'device' },
  firewall: { 'host-firewall': 'firewall', 'security-group': 'security-group' },
  edge: { router: 'router', 'internet-gateway': 'internet-gateway' },
  internet: { internet: 'internet' },
  actor: { you: null, attacker: null, home: null },
  packet: { 'echo-request': 'echo-request', 'echo-reply': 'echo-reply', warning: null },
};

/** The entity whose icon goes with each term that names one: a term that names several variants (device) shows the first one, `packet`, which names every packet, shows an Echo Request, and the terms of the two warnings, which name no variant of their own, show the warning. A term left out, like least-privilege, has no icon. */
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
  'host-unreachable': { kind: 'packet', variant: 'warning' },
  'time-exceeded': { kind: 'packet', variant: 'warning' },
};

/** Returns the term that names an entity in this variant, or null when it has none yet. */
export function entityTerm(entity: EntityRef): TermId | null {
  const terms: Record<string, TermId | null> = ENTITY_TERMS[entity.kind];
  return terms[entity.variant];
}

function variantsOf<Kind extends EntityKind>(kind: Kind): EntityVariants[Kind][] {
  return Object.keys(ENTITY_TERMS[kind]) as EntityVariants[Kind][];
}

/** Every entity in every variant, in the order of ENTITY_TERMS, with each message a sender sends also as an intruder's. */
export const ENTITY_REFS: EntityRef[] = [
  ...variantsOf('network').map((variant) => ({ kind: 'network', variant }) as const),
  ...variantsOf('device').map((variant) => ({ kind: 'device', variant }) as const),
  ...variantsOf('firewall').map((variant) => ({ kind: 'firewall', variant }) as const),
  ...variantsOf('edge').map((variant) => ({ kind: 'edge', variant }) as const),
  ...variantsOf('internet').map((variant) => ({ kind: 'internet', variant }) as const),
  ...variantsOf('actor').map((variant) => ({ kind: 'actor', variant }) as const),
  ...variantsOf('packet').flatMap((variant): EntityRef[] =>
    variant === 'warning' ? [{ kind: 'packet', variant }] : [{ kind: 'packet', variant }, { kind: 'packet', variant, intruder: true }],
  ),
];
