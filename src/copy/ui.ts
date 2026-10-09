import { nameTag, type TermText } from './term-text';
import type { EntityKind, EntityRef, EntityVariants } from './terms';

export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes los incidentes anteriores.` },
  back: 'Volver al roadmap',
} as const;

const ENTITY_NAMES: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermText> } = {
  network: { office: 'red de la oficina', vpc: 'VPC' },
  device: { laptop: 'laptop', printer: 'impresora', 'ec2-instance': 'instancia EC2' },
  firewall: { 'host-firewall': 'firewall de la laptop', 'security-group': 'Security Group' },
  edge: { router: 'router', 'internet-gateway': 'Internet gateway' },
  internet: { internet: 'internet' },
  actor: { attacker: nameTag('Atacante'), you: nameTag('Tu Mac') },
  packet: { 'echo-request': 'Echo Request', 'echo-reply': 'Echo Reply' },
};

export const CATALOG_TEXT = {
  title: 'Catálogo de entidades',
  lede: 'Cada pieza del mapa en sus variantes y sus estados, con su ícono.',
  pieces: 'Piezas del mapa',
  icons: 'Íconos',
  intruder: 'intruso',
  state: {
    normal: 'normal',
    locked: 'con candado',
    configurable: 'configurable',
    selected: 'seleccionado',
    alert: 'alerta',
    blocking: 'bloqueó algo',
    replied: 'llegó y volvió',
    arrived: 'llegó',
    blocked: 'bloqueado',
    lost: 'perdido',
  },
} as const;

/** Returns the name of an entity in this variant, as the catalog shows it; an actor is a character, so its name is marked as a name, and an intruder's packet says so. */
export function entityName(entity: EntityRef): TermText {
  const names: Record<string, TermText> = ENTITY_NAMES[entity.kind];
  const name = names[entity.variant];
  return entity.kind === 'packet' && entity.intruder ? `${name} · ${CATALOG_TEXT.intruder}` : name;
}
