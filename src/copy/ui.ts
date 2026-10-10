import { nameTag, type TermText } from './term-text';
import type { EntityKind, EntityRef, EntityVariants } from './terms';

export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Los capítulos van de cero a especialista en AWS, nivel por nivel. Termina cada incidente para abrir el siguiente.',
  tier: ({ number, name }: { number: number; name: string }) => `Nivel ${number} · ${name}`,
  optional: 'Opcional',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes el incidente anterior.` },
  back: 'Volver al roadmap',
} as const;

const ENTITY_NAMES: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermText> } = {
  network: { office: 'red de la oficina', vpc: 'VPC' },
  device: { laptop: 'laptop', printer: 'impresora', 'ec2-instance': 'instancia EC2' },
  firewall: { 'host-firewall': 'firewall de la laptop', 'security-group': 'Security Group' },
  edge: { router: 'router', 'internet-gateway': 'Internet gateway' },
  internet: { internet: 'internet' },
  actor: { attacker: nameTag('Atacante'), you: nameTag('Tu Mac'), home: nameTag('Casa de Lucía') },
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

export const INTERFACE_TEXT = {
  title: 'Elementos de la interfaz',
  family: { buttons: 'Botones', choices: 'Fichas y opciones', cards: 'Tarjetas', text: 'Textos y etiquetas' },
  variant: {
    primary: 'principal',
    secondary: 'secundario',
    small: 'pequeño',
    disabled: 'deshabilitado',
    primaryLink: 'enlace principal',
    link: 'enlace',
    textLink: 'enlace de texto',
    chip: 'ficha',
    chipPressed: 'ficha elegida',
    chipNamePressed: 'ficha elegida con nombre',
    tray: 'bandeja',
    slotEmpty: 'hueco vacío',
    slotFull: 'hueco con ficha',
    option: 'opción',
    optionChosen: 'opción elegida',
    optionClosed: 'opción cerrada',
    right: 'respuesta correcta',
    wrong: 'respuesta incorrecta',
    card: 'tarjeta',
    cardSoon: 'tarjeta próxima',
    terminal: 'tarjeta terminal',
    caption: 'leyenda',
    fieldCaption: 'leyenda de un campo',
    roleCaption: 'leyenda del rol',
    text: 'texto con término, término nuevo y nombre propio',
    muted: 'texto secundario',
    stars: 'estrellas',
    alert: 'alerta',
    reply: 'respuesta de Lucía',
  },
  sample: {
    chips: ['{{icmp}} · {{echo-request}}', '{{icmp}} · {{echo-reply}}'],
    namedChip: `${nameTag('tu-laptop')} ({{ip-address|IP}} 192.168.1.10)`,
    origin: nameTag('tu-laptop'),
    addresses: ['192.168.1.20', '192.168.1.11'],
    text: `El {{security-group}} de ${nameTag('servidor2')} no deja entrar el {{ping}}.`,
    option: 'Una respuesta posible',
    chosen: 'La respuesta elegida',
    closed: 'Una respuesta que ya no se puede elegir',
    feedback: 'Por qué la respuesta es así.',
  },
} as const;

/** Returns the name of an entity in this variant, as the catalog shows it; an actor is a character, so its name is marked as a name, and an intruder's packet says so. */
export function entityName(entity: EntityRef): TermText {
  const names: Record<string, TermText> = ENTITY_NAMES[entity.kind];
  const name = names[entity.variant];
  return entity.kind === 'packet' && entity.intruder ? `${name} · ${CATALOG_TEXT.intruder}` : name;
}
