import { LOOPBACK_IP, type ClientActor, type Direction, type ExchangeKind, type FirewallKind, type Network, type Service, type UnreachableKind } from '@/engine';
import type { RouterPlace } from '@/copy/reasons';
import { nameTag, word, type TermText } from '@/copy/term-text';
import type { TermId } from '@/copy/terms';

const FIREWALL_LABEL: Record<FirewallKind, (name: string) => TermText> = {
  'security-group': (name) => `{{security-group}} ${nameTag(name)}`,
  'host-firewall': (name) => `{{firewall}} ${nameTag(name)}`,
};

const EDGE_LABEL: Record<Network['edge'], TermText> = {
  'internet-gateway': '{{internet-gateway}}',
  router: '{{router}}',
};

export const MAP_TEXT = {
  firewall: FIREWALL_LABEL,
  edge: EDGE_LABEL,
  internet: '{{internet}}',
  locked: 'con candado',
  alert: 'con alerta: entra algo que no debe',
} as const;

export const INSPECTION_TEXT = {
  type: 'Inspección',
  whatIs: 'Qué es',
  ipAddress: '{{ip-address}}',
  privateIp: '{{private-ip}}',
  publicIp: '{{public-ip}}',
  dnsNames: 'Nombres {{dns}}',
  echoIgnore: '{{icmp-echo-ignore-all}}',
  answersPing: '0: contesta el {{ping}}',
  ignoresPing: '1: no contesta el {{ping}}',
  firewalls: { 'security-group': '{{security-group|Security Groups}}', 'host-firewall': '{{firewall}}' } satisfies Record<FirewallKind, TermText>,
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': '{{rule|Reglas}} para lo que llega' } satisfies Record<FirewallKind, TermText>,
  directions: {
    'security-group': { inbound: '{{inbound-rule|Reglas de entrada}}', outbound: '{{outbound-rule|Reglas de salida}}' },
    'host-firewall': { inbound: '{{inbound|Entrada}}', outbound: '{{outbound|Salida}}' },
  } satisfies Record<FirewallKind, Record<Direction, TermText>>,
  noRules: { 'security-group': 'Ninguna: no deja entrar nada.', 'host-firewall': 'Ninguna.' } satisfies Record<FirewallKind, TermText>,
  noOutboundRules: 'Ninguna.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
  outboundRuleRow: (what: TermText, to: TermText): TermText => `${what} → ${to}`,
  who: 'Quién es',
  ip: '{{public-ip}}',
  does: 'Qué hace',
  edgeDoes: {
    'internet-gateway': 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
    router: 'Conecta la {{network|red}} de la oficina con {{internet}}.',
  } satisfies Record<Network['edge'], TermText>,
  internetDoes: 'Lleva cada {{packet|paquete}} de una {{network|red}} a otra.',
  message: 'Mensaje',
  result: 'Resultado',
  stoppedAt: 'Dónde y por qué se detuvo',
  none: 'No tiene',
  header: '{{header|Encabezado}}',
  requestHeader: '{{header|Encabezado}} del {{echo-request}}',
  replyHeader: '{{header|Encabezado}} del {{echo-reply}}',
  inLan: (header: TermText, known: ReadonlySet<TermId>): TermText => `${header} (en tu ${word(known, 'lan', 'red local')})`,
  headerChanges: 'Fuera de la oficina el {{header|encabezado}} cambia: lo verás en el capítulo 2.',
  source: (ip: string, known: ReadonlySet<TermId>): TermText => `${known.has('source-ip') ? '{{source-ip}}' : 'Origen'}: ${ip}`,
  destination: (ip: string, known: ReadonlySet<TermId>): TermText => `${known.has('destination-ip') ? '{{destination-ip}}' : 'Destino'}: ${ip}`,
  connection: 'En la red',
  connected: 'Conectado a la {{network|red}}.',
  disconnected: 'No está conectado: no forma parte de la {{network|red}}.',
  ttl: (ttl: number): TermText => `{{ttl}} al salir: ${ttl}`,
  passedThrough: 'Pasó por',
  hops: '{{hop|Saltos}}',
  router: (name: TermText, ip: string): TermText => `${name} (${ip})`,
  moreHops: (count: number): TermText => `y ${count} {{hop|${count === 1 ? 'salto' : 'saltos'}}} más`,
  routerIp: (lan: string): TermText => `{{ip-address|IP}} en ${lan}`,
  place: { inside: 'dentro de la oficina', outside: 'fuera de la oficina' } satisfies Record<Exclude<RouterPlace, 'named'>, TermText>,
  roundTrip: '{{rtt|Tiempo de ida y vuelta}}',
  exampleTime: 'Cifra de ejemplo.',
  services: '{{service|Servicios}}',
  noServices: 'Ninguno.',
  service: (service: Service, known: ReadonlySet<TermId>): TermText => {
    const what = known.has(service.protocol) ? `{{${service.protocol}}} ${service.port}` : `${word(known, 'port', 'puerto')} ${service.port}`;
    if (!known.has('listen-address')) return what;
    return `${what} · {{listen-address|${service.listen === 'all' ? 'escucha en todas las IPs' : `escucha solo en ${LOOPBACK_IP}`}}}`;
  },
  sourcePort: (port: number): TermText => `{{source-port|Puerto de origen}}: ${port}`,
  destinationPort: (port: number, known: ReadonlySet<TermId>): TermText => `${known.has('destination-port') ? '{{destination-port|Puerto de destino}}' : word(known, 'port', 'Puerto')}: ${port}`,
  outHeader: '{{header|Encabezado}} de ida',
  backHeader: '{{header|Encabezado}} de vuelta',
  inInternet: (header: TermText, known: ReadonlySet<TermId>): TermText => `${header} (en ${word(known, 'internet', 'internet')})`,
  handshake: '{{handshake|Saludo de tres pasos}}',
  datagrams: '{{udp|Consulta y respuesta}}',
  exchange: {
    kinds: { SYN: 'SYN', 'SYN-ACK': 'SYN-ACK', ACK: 'ACK', RST: '{{rst}}', query: 'consulta', response: 'respuesta' } satisfies Record<ExchangeKind, TermText>,
    unknownRst: 'rechazo',
    line: (number: number, said: TermText, from: TermText, to: TermText): TermText => `${number}. ${said}, de ${from} a ${to}`,
  },
  route: '{{route|Ruta que usó}}',
  routeLine: {
    kinds: { connected: 'ruta de red conectada', default: 'ruta por defecto', static: 'ruta' } as const,
    terms: { connected: 'connected-route', default: 'default-route', static: 'route' } as const,
    direct: 'directo',
    leavesBy: (ip: string): TermText => `sale por ${ip}`,
    nextHop: (ip: string): TermText => `{{next-hop|siguiente salto}} ${ip}`,
    mostSpecific: (others: string[]): TermText => `{{most-specific-route|es la más específica}}: también cubría ${others.join(' y ')}`,
    line: (holder: TermText, to: string, parts: TermText[]): TermText => [`${holder}: ${to}`, ...parts].join(' · '),
  },
  translation: '{{nat|Traducción}}',
  translationLine: {
    out: (inside: string, outside: string): TermText => `${inside} → ${outside}`,
    portsChanged: (known: ReadonlySet<TermId>): TermText => `Cambió la IP y el puerto de origen${known.has('napt') ? ' ({{napt}})' : ''}.`,
    icmp: (known: ReadonlySet<TermId>): TermText => `${word(known, 'icmp', 'ICMP')} no usa puertos: solo cambió la IP de origen.`,
    newRow: 'Es una fila nueva de la {{translation-table|tabla de traducciones}}.',
    sameRow: 'Usó la fila que la {{translation-table|tabla de traducciones}} ya tenía para ese origen.',
    forwarded: 'Un {{port-forwarding|reenvío de puertos}} lo entregó a ese dispositivo.',
    byRow: 'Una fila de la {{translation-table|tabla de traducciones}} lo entregó a ese dispositivo.',
  },
  dns: '{{dns}}',
  dnsLead: (device: TermText, name: string): TermText => `Antes de mandar el paquete, ${device} averigua la IP de ${name}.`,
  dnsAnswer: {
    record: (name: string, type: 'A' | 'CNAME', value: string, known: ReadonlySet<TermId>): TermText => `${name} ${word(known, type === 'A' ? 'a-record' : 'cname-record', type)} ${value}`,
    from: (resolver: TermText): TermText => `Contestó ${resolver}.`,
    nxdomain: (name: string): TermText => `{{nxdomain}}: ${name} no existe.`,
    servfail: (name: string): TermText => `{{servfail}}: no se pudo averiguar ${name}. No dice si el nombre existe.`,
    noIp: (name: string): TermText => `${name} no se convirtió en una IP.`,
    noAddress: (name: string, known: ReadonlySet<TermId>): TermText => `${name} existe, pero ${known.has('a-record') ? 'no tiene un {{a-record}}' : 'no tiene ninguna IP asociada'}.`,
    nobody: (resolver: TermText, known: ReadonlySet<TermId>): TermText => `${resolver} no contestó como ${known.has('resolver') ? 'un {{resolver}}' : 'un servidor de nombres'}.`,
    fromCache: (resolver: TermText): TermText => `La respuesta salió de la {{dns-cache|caché}} de ${resolver}.`,
    asked: (resolver: TermText): TermText => `${resolver} no la tenía en su {{dns-cache|caché}} y la buscó.`,
    ttl: (seconds: number, left: boolean): TermText => `{{dns-ttl|TTL}}: ${left ? 'quedan ' : ''}${seconds} s.`,
  },
} as const;

export const ACTOR_ROLE_TEXT: Record<ClientActor['kind'], TermText> = {
  attacker: 'Alguien de internet que prueba si los {{security-group|Security Groups}} ajenos lo dejan entrar.',
  you: 'Tu computadora.',
  home: 'Una casa fuera de la oficina, conectada a {{internet}}.',
};

export const LUCIA_TEXT = {
  name: 'Lucía',
  role: 'soporte',
  tasks: 'Tareas',
  pending: 'pendiente',
  done: 'hecha',
  submit: 'Enviar solución',
  failing: (task: TermText): TermText => `Todavía no se cumple: «${task}»`,
  intruding: 'Además, algo prohibido está entrando.',
  intrusion: '¡Algo raro está entrando!',
  newBadge: 'nuevo',
  glossary: 'Glosario',
  askHint: '¿Alguna pista?',
  hint: (number: number) => `Pista ${number}:`,
} as const;

export const TASK_CARD_TEXT = {
  noRules: {
    'security-group': 'No tiene {{inbound-rule|reglas de entrada}}: no deja entrar nada.',
    'host-firewall': 'Este {{firewall}} no tiene {{rule|reglas}}.',
  } satisfies Record<FirewallKind, TermText>,
  noOutboundRules: {
    'security-group': 'Este {{security-group}} no tiene {{outbound-rule|reglas de salida}}: su salida está cerrada.',
    'host-firewall': 'Este {{firewall}} tiene la {{outbound}} cerrada: alguien lo configuró así.',
  } satisfies Record<FirewallKind, TermText>,
  slot: { 'security-group': 'Regla de entrada nueva', 'host-firewall': 'Regla nueva' } satisfies Record<FirewallKind, string>,
  outboundSlot: { 'security-group': 'Regla de salida nueva', 'host-firewall': 'Regla nueva' } satisfies Record<FirewallKind, string>,
  tabsName: 'Sentido del tráfico',
  tabs: {
    'security-group': { inbound: '{{inbound-rule}}', outbound: '{{outbound-rule}}' },
    'host-firewall': { inbound: '{{inbound}}', outbound: '{{outbound}}' },
  } satisfies Record<FirewallKind, Record<Direction, TermText>>,
  arrow: { inbound: '←', outbound: '→' } satisfies Record<Direction, string>,
  what: 'Type',
  from: 'Source',
  to: 'Destination',
  done: 'Listo',
  remove: (rule: string) => `Quitar la regla ${rule}`,
  giveBack: (chip: string) => `Devolver ${chip} a su bandeja`,
} as const;

export const TERMINAL_TEXT = {
  title: (origin: TermText): TermText => `Terminal de ${origin}`,
  trays: { from: 'Origen', to: 'Destino', message: 'Mensaje' },
  ping: (address: string, ttl?: number): TermText => (ttl === undefined ? `ping ${address}` : `ping -t ${ttl} ${address}`),
  traceroute: (address: string): TermText => `traceroute -I ${address}`,
  packet: (origin: TermText, address: string): TermText => `paquete de ${origin} a ${address}`,
  handmade: (message: TermText, address: string): TermText => `paquete armado a mano: ${message} → ${address}`,
  nc: (address: string, port: number): TermText => `nc -vz -w 3 ${address} ${port}`,
  dig: (name: string): TermText => `dig ${name}`,
  incomplete: 'Elige una ficha de cada bandeja.',
  send: 'Enviar',
  output: {
    label: { nc: 'Salida de nc', dig: 'Salida de dig' },
    folded: (count: number): string => `⋯ ${count === 1 ? '1 línea plegada' : `${count} líneas plegadas`}`,
    show: (count: number): string => (count === 1 ? 'Ver la línea restante' : `Ver las ${count} líneas restantes`),
    hide: (count: number): string => (count === 1 ? 'Ocultar la línea restante' : `Ocultar las ${count} líneas restantes`),
    notes: {
      nc: 'El tiempo es una cifra de ejemplo.',
      dig: 'El id, el tiempo, la fecha y el tamaño son cifras de ejemplo.',
    } satisfies Record<'nc' | 'dig', TermText>,
  },
  route: {
    label: 'Salida de traceroute',
    hop: (hop: number, address: TermText): TermText => `${hop}\u00a0\u00a0${address}`,
    aside: (time: string | null, mark: string | null): string => [time, mark].filter((part): part is string => part !== null).join(' '),
    silent: '*',
    marks: { host: '!H', net: '!N' } satisfies Record<UnreachableKind, string>,
    notes: {
      silent: '«*» es un salto que no contestó a tiempo.',
      host: '«!H»: el equipo con esa IP avisó con {{host-unreachable}} que no pudo llegar al dispositivo de destino.',
      net: '«!N»: el equipo con esa IP avisó que no pudo llegar a la red de destino.',
      times: 'Los tiempos son cifras de ejemplo.',
    } satisfies Record<'silent' | 'times' | UnreachableKind, TermText>,
  },
} as const;

export const SETTINGS_TEXT = {
  entry: (device: TermText): TermText => `Ajustes de red de ${device}`,
  title: (device: TermText): TermText => `Ajustes de red de ${device}`,
} as const;

export const CASE_TEXT = {
  title: (number: number, total: number): string => `Caso ${number} de ${total}`,
  says: (report: TermText): TermText => `Lucía: «${report}»`,
  tests: (origin: TermText): TermText => `Pruebas que puedes enviar desde ${origin}`,
  sent: 'enviada',
  unsent: 'sin enviar',
  know: 'Ya sé la causa',
  next: 'Siguiente caso',
} as const;

export const EXPLANATION_TEXT = {
  type: 'Pregunta',
  whatHappened: '¿Qué pasó?',
  asks: (question: TermText): TermText => `Lucía: «${question}»`,
  right: 'Correcto.',
  wrong: 'No es eso.',
  seeResult: 'Ver resultado',
} as const;

const WITHOUT_HINTS = 'Lo resolviste sin pistas';

const CASE_LIST = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });

export const RESULT_TEXT = {
  type: 'Resultado',
  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', explained: 'Explicaste qué pasó a la primera' },
  middle: { filter: 'Abriste solo lo justo', send: WITHOUT_HINTS, identify: WITHOUT_HINTS },
  cases: {
    stars: { closed: 'Cerraste todos los casos', middle: 'Resolviste todos los casos sin pedir pistas', explained: 'Nombraste la causa de cada caso a la primera' },
    title: 'Tus casos',
    allFirstTry: (total: number): string => `Nombraste la causa de los ${total} casos a la primera.`,
    missed: (numbers: number[]): string => `No acertaste a la primera ${numbers.length === 1 ? 'el caso' : 'los casos'} ${CASE_LIST.format(numbers.map(String))}.`,
  },
  earned: 'conseguida',
  missed: 'sin conseguir',
  takeaway: 'Lo que te llevas',
  next: 'Siguiente incidente',
  back: 'Volver al roadmap',
} as const;

export const SCREEN_TEXT = {
  back: '← Roadmap',
  motion: 'Sin animaciones',
  inspectHelp: 'Pasa el mouse o el foco por una pieza o un sello para ver qué es y cómo está.',
  stampLegend: 'Sellos: ✓ llegó · ✕ lo frenaron · ? se perdió · ! apareció un aviso. Una pieza con candado no se puede cambiar en este incidente.',
} as const;
