import { LOOPBACK_IP, type FirewallKind, type Network, type Reason } from '@/engine';
import { NOT_DELIVERED, deviceName } from './packet-labels';
import { word, type TermText } from './term-text';
import type { TermId } from './terms';
import { describeWebReason } from './web/web-reasons';

type FirewallSentence = (device: TermText) => TermText;
type Way = 'out' | 'in';
type Verdict = 'pass' | 'drop';
type FirewallReason = Extract<Reason, { firewallKind: FirewallKind }>;

/** Where a router stands for the player: drawn on the map and so named, or not drawn, and then only said to be inside the office or outside it. */
export type RouterPlace = 'named' | 'inside' | 'outside';
export type PlaceOf = (routerId: string) => RouterPlace;

const ALL_NAMED: PlaceOf = () => 'named';
const UNNAMED_PLACE: Record<Exclude<RouterPlace, 'named'>, string> = { inside: 'de la oficina', outside: 'de afuera de la oficina' };

const FIREWALL_STEP: Record<FirewallReason['code'], { way: Way; verdict: Verdict }> = {
  'firewall-out-pass': { way: 'out', verdict: 'pass' },
  'firewall-out-drop': { way: 'out', verdict: 'drop' },
  'firewall-in-pass': { way: 'in', verdict: 'pass' },
  'firewall-in-drop': { way: 'in', verdict: 'drop' },
};

const FIREWALL_TEXT: Record<FirewallKind, { term: TermId; rules: Record<Way, TermId>; pass: Record<Way, FirewallSentence>; drop: Record<Way, FirewallSentence> }> = {
  'security-group': {
    term: 'security-group',
    rules: { out: 'outbound-rule', in: 'inbound-rule' },
    pass: {
      out: (device) => `El {{security-group}} de ${device} lo deja salir.`,
      in: (device) => `El {{security-group}} de ${device} lo deja entrar.`,
    },
    drop: {
      out: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{outbound-rule}} lo deja salir.`,
      in: (device) => `Se queda en el {{security-group}} de ${device}: ninguna {{inbound-rule}} lo deja entrar.`,
    },
  },
  'host-firewall': {
    term: 'firewall',
    rules: { out: 'rule', in: 'rule' },
    pass: {
      out: (device) => `El {{firewall}} de ${device} lo deja salir.`,
      in: (device) => `El {{firewall}} de ${device} lo deja entrar.`,
    },
    drop: {
      out: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja salir.`,
      in: (device) => `Se queda en el {{firewall}} de ${device}: ninguna {{rule|regla}} lo deja entrar.`,
    },
  },
};

const CLOSED_OUTBOUND: FirewallSentence = (device) => `Se queda en el {{firewall}} de ${device}: su {{outbound|salida}} está cerrada, alguien la configuró así.`;

const NOTHING_CAME_BACK: TermText = 'No volvió ninguna respuesta.';
const KEEPS_GOING: TermText = 'Sigue su camino.';
const REPLY_ARRIVES: TermText = 'Llega la respuesta.';

const ROUTE_INSIDE: Record<Network['kind'], TermText> = {
  vpc: 'Viaja por dentro de la {{vpc}}.',
  office: 'Viaja por dentro de la {{network|red}} de la oficina.',
};

function refusedAtArrival(net: Network, deviceId: string): TermText {
  return `Llega, pero ${deviceName(net, deviceId)} lo rechaza.`;
}

function arrivedAt(net: Network, deviceId: string): TermText {
  return `Llega a ${deviceName(net, deviceId)}.`;
}

function protocolWord(known: ReadonlySet<TermId>, protocol: 'tcp' | 'udp'): TermText {
  return word(known, protocol, protocol.toUpperCase());
}

const SENDER_WARNS: TermText = 'El propio {{device|dispositivo}} avisa que no pudo entregar el {{packet|paquete}}.';

function routerDrops(known: ReadonlySet<TermId>): TermText {
  return `${word(known, 'drop', 'descarta')} el {{packet|paquete}}`;
}

function routerOutcome(warns: boolean): TermText {
  return warns ? 'y avisa a quien lo envió que no pudo entregarlo.' : 'y no avisa a nadie.';
}

interface RouterRef {
  ip?: string;
  start?: boolean;
  bare?: boolean;
}

/** Returns how a sentence names a router: by its name (and the IP of its interface when given) when the map draws it, and otherwise only as a router of the office or from outside it, never by name nor by IP. At the start of a sentence it takes a capital; `bare` leaves out where it is, for a sentence that already says so. */
function routerRef(net: Network, known: ReadonlySet<TermId>, placeOf: PlaceOf, routerId: string, { ip, start = false, bare = false }: RouterRef = {}): TermText {
  const place = placeOf(routerId);
  if (place === 'named') return ip ? `${deviceName(net, routerId)} (${ip})` : deviceName(net, routerId);
  const article = start ? 'Un' : 'un';
  return `${article} ${known.has('router') ? '{{router}}' : 'router'}${bare ? '' : ` ${UNNAMED_PLACE[place]}`}`;
}

function sought(reason: Extract<Reason, { code: 'forward-no-owner' }>): TermText {
  return reason.viaGateway ? `${reason.ip}, su {{default-gateway}},` : reason.ip;
}

function replyText(net: Network, deviceId: string, known: ReadonlySet<TermId>): TermText {
  const device = net.devices.find((d) => d.id === deviceId);
  const kind = net.firewalls.find((f) => device?.firewallIds.includes(f.id))?.kind;
  if (kind === 'security-group') return known.has('stateful') ? 'La respuesta vuelve sola: el {{security-group}} es {{stateful}} y recuerda la conversación.' : REPLY_ARRIVES;
  if (kind === 'host-firewall') return REPLY_ARRIVES;
  return REPLY_ARRIVES;
}

const NO_IP_FOR = (name: string): TermText => `${name} no se convirtió en una IP.`;

type DnsAsk = Extract<Reason, { code: 'dns-answered' | 'dns-cached' | 'dns-nxdomain' | 'dns-servfail' | 'dns-no-address' }>;

/** Writes the question a device put to its resolver, with the terms the player knows tagged: `[[tu-laptop]] hizo una consulta DNS por www.lucia.example a [[servidor-dns]], su resolver`. */
function dnsQuestion(net: Network, known: ReadonlySet<TermId>, reason: DnsAsk): TermText {
  const asked = known.has('dns-query') ? 'hizo una {{dns-query|consulta DNS}} por' : 'preguntó por';
  const resolver = known.has('resolver') ? ', su {{resolver}}' : '';
  return `${deviceName(net, reason.deviceId)} ${asked} ${reason.name} a ${deviceName(net, reason.resolverId)}${resolver}`;
}

/** Writes what a resolver answered with an address: the IP, or the alias and the IP it leads to. */
function answerText(net: Network, known: ReadonlySet<TermId>, reason: Extract<DnsAsk, { ip: string }>): TermText {
  const question = dnsQuestion(net, known, reason);
  return reason.canonical ? `${question}: ${reason.name} es un ${word(known, 'cname-record', 'alias')} de ${reason.canonical}, que es ${reason.ip}.` : `${question}: la respuesta es ${reason.ip}.`;
}

function secondsLeft(seconds: number): string {
  return seconds === 1 ? 'le queda 1 segundo' : `le quedan ${seconds} segundos`;
}

/** Writes an answer that came from the cache of the resolver. The cache is a hidden cause: while `dns-cache` is unknown the text is the one of any answer, because the player saw an IP come back and nothing more; the seconds that are left come with the term `dns-ttl`, and only once it is known. */
function cachedText(net: Network, known: ReadonlySet<TermId>, reason: Extract<Reason, { code: 'dns-cached' }>): TermText {
  const answer = answerText(net, known, reason);
  if (!known.has('dns-cache')) return answer;
  const from = `${answer} Salió de la {{dns-cache|caché}} de ${deviceName(net, reason.resolverId)}.`;
  return known.has('dns-ttl') ? `${from} A la respuesta ${secondsLeft(reason.ttlLeft)} de {{dns-ttl|TTL}}.` : from;
}

/** Writes a name that the hosts file of the device answered. While `hosts-file` is unknown the text says what the player saw: the device already knew the IP and asked nobody. */
function hostsFileText(net: Network, known: ReadonlySet<TermId>, reason: Extract<Reason, { code: 'dns-hosts-file' }>): TermText {
  const device = deviceName(net, reason.deviceId);
  return known.has('hosts-file')
    ? `${device} encontró ${reason.name} en su {{hosts-file|archivo hosts}}: es ${reason.ip}. No preguntó a nadie.`
    : `${device} ya sabía que ${reason.name} es ${reason.ip}: no preguntó a nadie.`;
}

function side(fromInside: boolean): string {
  return fromInside ? 'dentro' : 'fuera';
}

/** True when the device has a firewall of its own kind and every one of them has no rule to let anything out: the outbound side was set closed. */
function hasClosedOutbound(net: Network, deviceId: string): boolean {
  const owner = net.devices.find((device) => device.id === deviceId);
  const firewalls = net.firewalls.filter((firewall) => firewall.kind === 'host-firewall' && owner?.firewallIds.includes(firewall.id));
  return firewalls.length > 0 && firewalls.every((firewall) => firewall.outbound.length === 0);
}

function firewallReason(reason: FirewallReason, net: Network, known: ReadonlySet<TermId>): TermText {
  const { way, verdict } = FIREWALL_STEP[reason.code];
  const text = FIREWALL_TEXT[reason.firewallKind];
  const device = deviceName(net, reason.deviceId);
  if (!known.has(text.term)) return verdict === 'pass' ? KEEPS_GOING : NOTHING_CAME_BACK;
  if (way === 'out' && verdict === 'drop' && reason.firewallKind === 'host-firewall' && known.has('outbound') && hasClosedOutbound(net, reason.deviceId)) return CLOSED_OUTBOUND(device);
  if (verdict === 'drop' && !known.has(text.rules[way])) return `El {{${text.term}}} de ${device} ${word(known, 'drop', 'descartó')} el ${word(known, 'packet', 'paquete')} sin avisar.`;
  return text[verdict][way](device);
}

interface HiddenCause {
  term: TermId;
  text: TermText;
}

function warning(term: TermId): HiddenCause {
  return { term, text: NOT_DELIVERED };
}

/** Returns the term that names what hid the packet from its sender and the only thing the player can say while that term is unknown, or null when the reason hides nothing. A warning that came back says only that the packet did not reach its destination, and is hidden by the term of its own kind (a router with no route by net-unreachable, never by host-unreachable); a silence (a firewall that drops, a laptop that ignores Echo Request) says that nothing came back; a refusal because of the listening address, a refusal because the process that listened is no longer running, and a UDP datagram that a host answers with Port Unreachable, say only that the packet arrived and was rejected; a packet from outside that no row or forward takes says that nothing came back, and one that a forward or a row delivers says only that it arrived at the device. */
function hiddenCause(reason: Reason, net: Network): HiddenCause | null {
  switch (reason.code) {
    case 'forward-no-owner':
      return warning('host-unreachable');
    case 'forward-no-route':
      return reason.warns ? warning('net-unreachable') : null;
    case 'forward-no-host':
      return reason.warns ? warning('host-unreachable') : null;
    case 'forward-ttl-exceeded':
      return warning('time-exceeded');
    case 'host-ignores-echo':
      return { term: 'icmp-echo-ignore-all', text: NOTHING_CAME_BACK };
    case 'host-wrong-address':
      return { term: 'listen-address', text: refusedAtArrival(net, reason.deviceId) };
    case 'host-udp-closed':
      return { term: 'port-unreachable', text: refusedAtArrival(net, reason.deviceId) };
    case 'process-stopped':
      return { term: 'process', text: refusedAtArrival(net, reason.deviceId) };
    case 'dns-nxdomain':
      return { term: 'nxdomain', text: NO_IP_FOR(reason.name) };
    case 'dns-servfail':
      return { term: 'servfail', text: NO_IP_FOR(reason.name) };
    case 'nat-no-translation':
      return { term: 'translation-table', text: NOTHING_CAME_BACK };
    case 'nat-forwarded':
      return { term: reason.fixed ? 'port-forwarding' : 'translation-table', text: arrivedAt(net, reason.deviceId) };
    default:
      return null;
  }
}

/** Turns an engine reason into the sentence the player reads, with the terms they know tagged; while the term that names a hidden cause is unknown, the sentence says only what the player saw: that nothing came back, that the packet did not reach its destination, or that it arrived and was rejected. `placeOf` says where each router stands for the player: one the map does not draw is never named, by name or by IP. */
export function describeReason(reason: Reason, net: Network, known: ReadonlySet<TermId>, placeOf: PlaceOf = ALL_NAMED): TermText {
  const hidden = hiddenCause(reason, net);
  const router = (routerId: string, options?: RouterRef) => routerRef(net, known, placeOf, routerId, options);
  if (hidden && !known.has(hidden.term)) return hidden.text;
  switch (reason.code) {
    case 'address-invalid':
      return `${reason.address} no es una dirección {{ipv4}} válida: cada uno de sus cuatro números debe ir de 0 a 255. El {{packet|paquete}} no sale del {{device|dispositivo}}.`;
    case 'address-localhost':
      return `El {{device|dispositivo}} ya conoce el nombre {{localhost}}: significa ${reason.ip}, una dirección de {{loopback}}. No pregunta a nadie.`;
    case 'dns-unresolved':
      return `El {{dns}} no conoce ${reason.name} cuando se pregunta desde ${side(reason.fromInside)} de la {{vpc}}.`;
    case 'dns-resolved':
      return `El {{dns}} convierte ${reason.name} en ${reason.ip} (se preguntó desde ${side(reason.fromInside)} de la {{vpc}}).`;
    case 'dns-answered':
      return answerText(net, known, reason);
    case 'dns-cached':
      return cachedText(net, known, reason);
    case 'dns-hosts-file':
      return hostsFileText(net, known, reason);
    case 'dns-nxdomain':
      return `${deviceName(net, reason.resolverId)} contestó {{nxdomain}}: el nombre ${reason.name} no existe.`;
    case 'dns-servfail':
      return `${deviceName(net, reason.resolverId)} contestó {{servfail}}: no pudo averiguar ${reason.name}. No dice si el nombre existe.`;
    case 'dns-no-address':
      return `${dnsQuestion(net, known, reason)}: el nombre existe, pero ${known.has('a-record') ? 'no tiene un {{a-record}}' : 'no tiene ninguna IP asociada'}.`;
    case 'dns-resolver-silent':
      return `${deviceName(net, reason.deviceId)} preguntó por ${reason.name} a ${reason.ip}, ${known.has('resolver') ? 'su {{resolver}}' : 'su servidor de nombres'}, y no recibió respuesta a su pregunta.`;
    case 'dns-no-resolver': {
      const host = (net.routers ?? []).some((candidate) => candidate.id === reason.hostId) ? router(reason.hostId) : deviceName(net, reason.hostId);
      return `${deviceName(net, reason.deviceId)} preguntó por ${reason.name} a ${reason.ip}, y ${host} no le contestó como ${known.has('resolver') ? 'un {{resolver}}' : 'un servidor de nombres'}.`;
    }
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
    case 'route-no-gateway':
      return `${reason.ip} no está en la {{lan}} de ${deviceName(net, reason.deviceId)}, y ${deviceName(net, reason.deviceId)} no tiene {{default-gateway}}: no sabe por dónde sacar el {{packet|paquete}}.`;
    case 'route-not-connected':
      return `${deviceName(net, reason.deviceId)} no tiene conexión a la {{network|red}}: ni envía ni recibe {{packet|paquetes}}.`;
    case 'route-gateway-not-a-router':
      return `La IP ${reason.ip}, la {{default-gateway}} guardada, es de ${deviceName(net, reason.deviceId)}, que no es un {{router}}: recibe el {{packet|paquete}}, no lo pasa a otra red y no vuelve nada.`;
    case 'route-leaves-office':
      return `${reason.ip} está fuera de la {{network|red}} de la oficina: el {{packet|paquete}} va a la {{default-gateway}}, que lo saca de ella.`;
    case 'forward-no-owner':
      return `${deviceName(net, reason.deviceId)} buscó en su {{network|red}} quién tenía la IP ${sought(reason)} y nadie contestó. ${SENDER_WARNS}`;
    case 'forward-hop':
      return `Pasa por ${router(reason.routerId, { ip: reason.ip })}, un {{hop|salto}} más: el {{ttl}} baja a ${reason.ttlLeft}.`;
    case 'forward-ttl-exceeded':
      return `El {{ttl}} llega a 0 en ${router(reason.routerId, { ip: reason.ip })}: el {{router}} ${routerDrops(known)} y avisa a quien lo envió con {{time-exceeded}}.`;
    case 'forward-no-route':
      return `${router(reason.routerId, { start: true })} no sabe a qué {{router}} mandar un {{packet|paquete}} para ${reason.ip}: lo ${word(known, 'drop', 'descarta')} ${routerOutcome(reason.warns)}`;
    case 'forward-no-host':
      return `${router(reason.routerId, { start: true })} tiene conectada la {{network|red}} de ${reason.ip}, pero ningún {{device|dispositivo}} tiene esa IP: ${routerDrops(known)} ${routerOutcome(reason.warns)}`;
    case 'forward-private-dropped':
      return `${reason.ip} es una {{private-ip}}: se repite en muchas redes y {{internet}} no la entrega. ${router(reason.routerId, { start: true, bare: true })}, ya fuera de la oficina, ${word(known, 'drop', 'descartó')} el {{packet|paquete}} y no avisó.`;
    case 'forward-router-replies': {
      const owner = placeOf(reason.routerId) === 'named' ? `${router(reason.routerId)}, un {{router}}` : router(reason.routerId);
      return `La IP ${reason.ip} es de ${owner}: el {{packet|paquete}} llega a él, no sigue de largo, y contesta.`;
    }
    case 'nat-no-translation':
      return `${router(reason.routerId, { start: true })} no tiene ninguna fila en su {{translation-table|tabla de traducciones}} para el ${word(known, 'port', 'puerto')} ${reason.port} de ${reason.ip} (${protocolWord(known, reason.protocol)}). No sabe a qué ${word(known, 'device', 'dispositivo')} entregar el ${word(known, 'packet', 'paquete')}: no lo entrega a nadie.`;
    case 'nat-forwarded': {
      const where = `${word(known, 'port', 'puerto')} ${reason.port} de ${reason.ip} (${protocolWord(known, reason.protocol)})`;
      const to = `${deviceName(net, reason.deviceId)}, al ${word(known, 'port', 'puerto')} ${reason.toPort}`;
      return reason.fixed
        ? `${router(reason.routerId, { start: true })} tiene un {{port-forwarding|reenvío de puertos}}: lo que llega al ${where} va a ${to}.`
        : `En la {{translation-table|tabla de traducciones}} de ${router(reason.routerId)} hay una fila para el ${where}: lleva el ${word(known, 'packet', 'paquete')} a ${to}.`;
    }
    case 'firewall-out-pass':
    case 'firewall-out-drop':
    case 'firewall-in-pass':
    case 'firewall-in-drop':
      return firewallReason(reason, net, known);
    case 'host-unsolicited-icmp':
      return 'Un {{echo-reply}} es una respuesta: llegó, y nadie lo contesta.';
    case 'host-ignores-echo':
      return `Llega, pero ${deviceName(net, reason.deviceId)} tiene {{icmp-echo-ignore-all}} en 1 y no contesta.`;
    case 'host-replies':
      return `${deviceName(net, reason.deviceId)} contesta.`;
    case 'host-refused':
      return `Llega, pero ningún ${word(known, 'service', 'programa')} ${word(known, 'listen', 'escucha')} en el ${word(known, 'port', 'puerto')} ${reason.port}: ${deviceName(net, reason.deviceId)} lo rechaza.`;
    case 'host-wrong-address':
      return `${refusedAtArrival(net, reason.deviceId)} El ${word(known, 'service', 'servicio')} del ${word(known, 'port', 'puerto')} ${reason.port} tiene como {{listen-address}} ${LOOPBACK_IP}, y el ${word(known, 'packet', 'paquete')} va a ${reason.ip}.`;
    case 'host-accepts':
      return `Un programa escucha en el puerto ${reason.port} y acepta.`;
    case 'process-stopped':
      return `Llega, pero el {{process|proceso}} que escuchaba en el ${word(known, 'port', 'puerto')} ${reason.port} terminó: ${deviceName(net, reason.deviceId)} lo rechaza.`;
    case 'host-udp-closed':
      return `Llega por ${word(known, 'udp', 'UDP')} al ${word(known, 'port', 'puerto')} ${reason.port}, pero ningún programa escucha ahí: ${deviceName(net, reason.deviceId)} avisa con {{port-unreachable}}.`;
    case 'web-site-chosen':
    case 'web-default-site':
    case 'web-answered':
      return describeWebReason(reason, net, known);
    case 'reply-stateful':
      return replyText(net, reason.deviceId, known);
  }
}
