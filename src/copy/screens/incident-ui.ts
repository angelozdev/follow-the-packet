import type { ClientActor, Direction, FirewallKind, Network, UnreachableKind } from '@/engine';
import type { RouterPlace } from '@/copy/reasons';
import { nameTag, type TermText } from '@/copy/term-text';
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
  alert: 'con alerta: entra algo prohibido',
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
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': '{{rule|Reglas}}' } satisfies Record<FirewallKind, TermText>,
  directions: {
    'security-group': { inbound: '{{inbound-rule|Reglas de entrada}}', outbound: '{{outbound-rule|Reglas de salida}}' },
    'host-firewall': { inbound: '{{inbound|Entrada}}', outbound: '{{outbound|Salida}}' },
  } satisfies Record<FirewallKind, Record<Direction, TermText>>,
  noRules: 'Ninguna: no deja entrar nada.',
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
  replyHeader: '{{header|Encabezado}} del {{echo-reply}}',
  source: (ip: string, known: ReadonlySet<TermId>): TermText => `${known.has('source-ip') ? '{{source-ip}}' : 'Origen'}: ${ip}`,
  destination: (ip: string, known: ReadonlySet<TermId>): TermText => `${known.has('destination-ip') ? '{{destination-ip}}' : 'Destino'}: ${ip}`,
  connection: 'Conexión',
  connected: 'Conectado a la {{network|red}}.',
  disconnected: 'No está conectado: no forma parte de la {{network|red}}.',
  ttl: (ttl: number): TermText => `{{ttl}}: ${ttl}`,
  passedThrough: 'Pasó por',
  hops: '{{hop|Saltos}}',
  router: (name: TermText, ip: string): TermText => `${name} (${ip})`,
  place: { inside: 'dentro de la oficina', outside: 'fuera de la oficina' } satisfies Record<Exclude<RouterPlace, 'named'>, TermText>,
  roundTrip: '{{rtt|Tiempo de ida y vuelta}}',
  exampleTime: 'Cifra de ejemplo.',
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
    'host-firewall': 'No tiene {{rule|reglas}}: no deja entrar nada.',
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
  incomplete: 'Elige una ficha de cada bandeja.',
  send: 'Enviar',
  route: {
    label: 'Salida de traceroute',
    hop: (hop: number, address: TermText): TermText => `${hop}\u00a0\u00a0${address}`,
    aside: (time: string | null, mark: string | null): string => [time, mark].filter((part): part is string => part !== null).join(' '),
    silent: '*',
    marks: { host: '!H', net: '!N' } satisfies Record<UnreachableKind, string>,
    notes: {
      silent: '«*» es un salto que no contestó.',
      host: '«!H»: el equipo con esa IP avisó con {{host-unreachable}} que no pudo llegar al dispositivo de destino.',
      net: '«!N»: el equipo con esa IP avisó que no pudo llegar a la red de destino.',
      times: 'Los tiempos son cifras de ejemplo.',
    } satisfies Record<'silent' | 'times' | UnreachableKind, TermText>,
  },
} as const;

export const SETTINGS_TEXT = {
  entry: (device: TermText): TermText => `Ajustes de red ${device}`,
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
