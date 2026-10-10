import type { ClientActor, FirewallKind, Network } from '@/engine';
import { nameTag, type TermText } from '@/copy/term-text';

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
  noRules: 'Ninguna: no deja entrar nada.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
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
  slot: { 'security-group': 'Regla de entrada nueva', 'host-firewall': 'Regla nueva' } satisfies Record<FirewallKind, string>,
  what: 'Type',
  from: 'Source',
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
} as const;

export const EXPLANATION_TEXT = {
  whatHappened: '¿Qué pasó?',
  asks: (question: TermText): TermText => `Lucía: «${question}»`,
  right: 'Correcto.',
  wrong: 'No es eso.',
  seeResult: 'Ver resultado',
} as const;

export const RESULT_TEXT = {
  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', explained: 'Explicaste qué pasó a la primera' },
  middle: { filter: 'Abriste solo lo justo', send: 'Lo resolviste sin pistas' },
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
  stampLegend: 'Sellos: ✓ llegó · ✕ lo frenaron · ? se perdió. Una pieza con candado no se puede cambiar en este incidente.',
} as const;
