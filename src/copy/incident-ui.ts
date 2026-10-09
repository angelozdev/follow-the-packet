import type { Actor, FirewallKind, Network } from '@/engine';
import { nameTag, type TermText } from './term-text';

const FIREWALL_LABEL: Record<FirewallKind, (name: string) => TermText> = {
  'security-group': (name) => `{{security-group}} ${nameTag(name)}`,
  'host-firewall': (name) => `firewall ${nameTag(name)}`,
};

const EDGE_LABEL: Record<Network['edge'], TermText> = {
  'internet-gateway': '{{internet-gateway}}',
  router: 'router',
};

export const MAP_TEXT = {
  firewall: FIREWALL_LABEL,
  edge: EDGE_LABEL,
  internet: 'internet',
  locked: 'con candado',
  alert: 'con alerta: entra algo prohibido',
  packet: (label: string) => `Paquete: ${label}`,
} as const;

export const INSPECTION_TEXT = {
  whatIs: 'Qué es',
  privateIp: '{{private-ip}}',
  publicIp: '{{public-ip}}',
  dnsNames: 'Nombres {{dns}}',
  echoIgnore: '{{icmp-echo-ignore-all}}',
  answersPing: '0: contesta el {{ping}}',
  ignoresPing: '1: no contesta el {{ping}}',
  firewalls: { 'security-group': '{{security-group|Security Groups}}', 'host-firewall': 'Firewall' } satisfies Record<FirewallKind, TermText>,
  inbound: { 'security-group': '{{inbound-rule|Reglas de entrada}}', 'host-firewall': 'Reglas de entrada' } satisfies Record<FirewallKind, TermText>,
  noRules: 'Ninguna: no deja entrar nada.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
  who: 'Quién es',
  ip: '{{public-ip}}',
  does: 'Qué hace',
  edgeDoes: {
    'internet-gateway': 'Por aquí entra y sale el tráfico entre la {{vpc}} e internet.',
    router: 'Por aquí entra y sale el tráfico entre la oficina e internet.',
  } satisfies Record<Network['edge'], TermText>,
  internetDoes: 'Lleva los paquetes de una red a otra.',
  result: 'Resultado',
  stoppedAt: 'Dónde y por qué se detuvo',
  none: 'No tiene',
} as const;

export const ACTOR_ROLE_TEXT: Record<Actor['kind'], TermText> = {
  attacker: 'Alguien de internet que prueba si los {{security-group|Security Groups}} ajenos lo dejan entrar.',
  you: 'Tu computadora.',
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
  noRules: 'No tiene {{inbound-rule|reglas de entrada}}: no deja entrar nada.',
  slot: 'Regla de entrada nueva',
  what: 'Type',
  from: 'Source',
  done: 'Listo',
  remove: (rule: string) => `Quitar la regla ${rule}`,
  giveBack: (chip: string) => `Devolver ${chip} a su bandeja`,
} as const;

export const EXPLANATION_TEXT = {
  asks: 'Lucía: «¿Qué pasó?»',
  right: 'Correcto.',
  wrong: 'No es eso.',
  seeResult: 'Ver resultado',
} as const;

export const RESULT_TEXT = {
  title: 'Incidente cerrado',
  stars: { closed: 'Cerraste el incidente', tight: 'Abriste solo lo justo', explained: 'Explicaste qué pasó a la primera' },
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
} as const;
