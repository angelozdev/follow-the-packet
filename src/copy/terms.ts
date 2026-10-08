export interface Term {
  name: string;
  definition: string;
}

export const TERMS = {
  server: { name: 'servidor', definition: 'Una computadora en la nube que corre tus programas. En AWS se llama instancia EC2.' },
  vpc: { name: 'red privada (VPC)', definition: 'Tu red dentro de AWS. Los servidores de adentro se hablan entre sí.' },
  'private-ip': { name: 'IP privada', definition: 'La dirección de un servidor dentro de la red privada. Desde internet no se llega a ella.' },
  ping: { name: 'ping', definition: 'Un mensaje corto que pregunta «¿estás ahí?». Si vuelve la respuesta, hay camino.' },
  'security-group': { name: 'puerta', definition: 'Security Group (SG): la puerta de cada servidor. Solo deja pasar lo que una regla permite.' },
  rule: { name: 'regla', definition: 'Un permiso de la puerta con dos partes: qué puede pasar y desde dónde.' },
  icmp: { name: 'ICMP', definition: 'El tipo de mensaje que usa el ping: avisos cortos entre máquinas.' },
  'echo-request': { name: 'Echo Request', definition: 'La ida del ping: «¿estás ahí?».' },
  'echo-reply': { name: 'Echo Reply', definition: 'La vuelta del ping: «sí, aquí estoy».' },
  'least-privilege': { name: 'mínimo privilegio', definition: 'Abrir solo lo justo: lo que hace falta y solo para quien lo necesita.' },
  stateful: { name: 'stateful', definition: 'La puerta recuerda la conversación: la respuesta a algo que salió vuelve sin otra regla.' },
  'outbound-rule': { name: 'regla de salida', definition: 'Un permiso para lo que sale del servidor.' },
  cidr: { name: 'CIDR', definition: 'Una forma de escribir un rango de IPs: /32 es una sola IP y 0.0.0.0/0 es todo internet.' },
  'vpc-range': { name: 'rango de la VPC', definition: 'Todas las IPs privadas de tu red, escritas como un CIDR.' },
  'public-ip': { name: 'IP pública', definition: 'La dirección de un servidor en internet.' },
  'internet-gateway': { name: 'internet gateway', definition: 'La entrada y la salida entre tu red privada e internet.' },
  nat: { name: 'NAT', definition: 'El cambio del remitente al salir a internet: la IP privada se cambia por la pública.' },
  dns: { name: 'DNS', definition: 'La agenda de internet: convierte un nombre en una IP.' },
  'public-dns-name': { name: 'nombre público', definition: 'El nombre DNS de un servidor en internet. Desde dentro de la red da la IP privada.' },
  'private-dns-name': { name: 'nombre privado', definition: 'El nombre DNS de un servidor que solo funciona dentro de la red privada.' },
  tcpdump: { name: 'tcpdump', definition: 'Un programa que muestra los paquetes que llegan a un servidor y salen de él.' },
  'linux-ignore-ping': { name: 'Linux ignora el ping', definition: 'Un ajuste de Linux: el ping llega, pero nadie lo contesta.' },
  'default-sg': { name: 'puerta default', definition: 'El SG que AWS crea con cada red: deja entrar solo a sus propios miembros.' },
  'multiple-sgs': { name: 'varias puertas', definition: 'Un servidor puede tener varias puertas: pasa lo que permita cualquiera de ellas.' },
} as const satisfies Record<string, Term>;

export type TermId = keyof typeof TERMS;

export function isTermId(value: string): value is TermId {
  return Object.hasOwn(TERMS, value);
}
