import type { Actor } from '@/engine';
import type { TermText } from './term-text';

export const MAP_TEXT = {
  barrier: (name: string): TermText => `{{security-group}} de ${name}`,
  gateway: '{{internet-gateway}}',
  gatewayPlain: 'entrada desde internet',
  locked: 'con candado',
  packet: (label: string) => `Paquete: ${label}`,
} as const;

export const INSPECTION_TEXT = {
  privateIp: '{{private-ip}}',
  publicIp: '{{public-ip}}',
  dnsNames: 'Nombres {{dns}}',
  linuxPing: 'Linux contesta el {{ping}}',
  doors: '{{security-group|Puerta}}',
  inbound: 'Deja entrar',
  noRules: 'Nada: no tiene {{rule|reglas}}.',
  ruleRow: (what: TermText, from: TermText): TermText => `${what} ← ${from}`,
  who: 'Quién es',
  ip: '{{public-ip|IP}}',
  does: 'Qué hace',
  gatewayDoes: 'Por aquí entra y sale el tráfico de internet.',
  result: 'Resultado',
  stoppedAt: 'Dónde y por qué se detuvo',
  yes: 'Sí',
  no: 'No',
  none: 'No tiene',
} as const;

export const ACTOR_ROLE_TEXT: Record<Actor['kind'], TermText> = {
  attacker: 'Alguien de internet que prueba puertas ajenas.',
  you: 'Tu computadora.',
};

export const LUCIA_TEXT = {
  name: 'Lucía',
  role: 'soporte',
  tasks: 'Tareas',
  pending: 'pendiente',
  done: 'hecha',
  steady: 'Tiempo funcionando sin cortes',
  intrusion: '¡Algo raro está entrando!',
  newTerms: 'Palabras nuevas',
  newBadge: 'nuevo',
  askHint: '¿Alguna pista?',
  hint: (number: number) => `Pista ${number}:`,
} as const;

export const TASK_CARD_TEXT = {
  noRules: 'No tiene reglas: no deja entrar nada.',
  slot: 'Regla nueva',
  what: 'Qué',
  from: 'Desde dónde',
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
  inspectHelp: 'Pasa el mouse o el foco por una pieza o un sello para ver cómo está.',
} as const;
