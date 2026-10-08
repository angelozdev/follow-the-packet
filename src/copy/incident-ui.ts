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
