import { nameTag, type TermText } from '@/copy/term-text';
import type { EntityKind, EntityRef, EntityVariants } from '@/copy/terms';

export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Los capítulos van de cero a especialista en AWS, nivel por nivel. Termina cada incidente para abrir el siguiente.',
  tier: ({ number, name }: { number: number; name: string }) => `Nivel ${number} · ${name}`,
  chapter: (number: number) => `Capítulo ${number}`,
  optional: 'Opcional',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

/** The word each kind of message wears on its tab, and the word a screen reader hears before its text. */
export const MESSAGE_TEXT = { note: 'Nota', success: 'Correcto', warning: 'Aviso', error: 'Error' } as const;

export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes el incidente anterior.` },
  back: 'Volver al roadmap',
} as const;

const ENTITY_NAMES: { [Kind in EntityKind]: Record<EntityVariants[Kind], TermText> } = {
  network: { office: 'red de la oficina', vpc: 'VPC', block: 'contorno del bloque' },
  device: { laptop: 'laptop', printer: 'impresora', 'ec2-instance': 'instancia EC2', 'internet-server': 'servidor de internet' },
  firewall: { 'host-firewall': 'firewall de la laptop', 'security-group': 'Security Group' },
  edge: { router: 'router', 'internet-gateway': 'Internet gateway' },
  internet: { internet: 'internet' },
  actor: { attacker: nameTag('Atacante'), you: nameTag('Tu Mac'), home: nameTag('Casa de Lucía') },
  packet: { 'echo-request': 'Echo Request', 'echo-reply': 'Echo Reply', 'tcp-request': 'TCP pide', 'tcp-reply': 'TCP contesta', 'udp-request': 'UDP pide', 'udp-reply': 'UDP contesta', warning: 'aviso' },
};

export const CATALOG_TEXT = {
  title: 'Catálogo de entidades',
  lede: 'Cada pieza del mapa en sus variantes y sus estados, con su ícono.',
  pieces: 'Piezas del mapa',
  icons: 'Íconos',
  intruder: 'intruso',
  more: {
    stamps: (hidden: number) => `${hidden} sellos más`,
    stampsWithProblem: (hidden: number) => `${hidden} sellos más, alguno bloqueado, perdido, con un aviso o que entró y no debía`,
  },
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
    warned: 'volvió un aviso',
  },
} as const;

export const INTERFACE_TEXT = {
  title: 'Elementos de la interfaz',
  family: { buttons: 'Botones', choices: 'Fichas y opciones', cards: 'Tarjetas', text: 'Textos y etiquetas', tabs: 'Pestañas', tables: 'Tablas', output: 'Código', messages: 'Avisos y errores' },
  variant: {
    primary: 'principal',
    secondary: 'secundario',
    small: 'pequeño',
    disabled: 'deshabilitado',
    primaryLink: 'enlace principal',
    link: 'enlace',
    textLink: 'enlace de texto',
    chip: 'ficha',
    segmented: 'bandeja partida en dos',
    chipPressed: 'ficha elegida',
    chipNamePressed: 'ficha elegida con nombre',
    tray: 'bandeja',
    slotEmpty: 'hueco vacío',
    slotFull: 'hueco con ficha',
    options: 'opciones con letra: libre, elegida y cerrada',
    right: 'respuesta correcta',
    wrong: 'respuesta incorrecta',
    card: 'tarjeta con su título en la franja',
    cardTitled: 'tarjeta con su título bajo la franja',
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
    tabs: 'pestañas: elegida y sin elegir',
    tabsUnderline: 'pestañas de dentro de otra pestaña: elegida y sin elegir',
    table: 'tabla: una fila fija, una que se quita y una en uso',
    tableEmpty: 'tabla vacía',
    output: 'tarjeta terminal con la salida de dig plegada',
    httpMessage: 'caja del paquete con un mensaje HTTP',
    window: 'ventana de sistema: su nombre, su X y su contenido',
    note: 'nota',
    success: 'acierto',
    warning: 'aviso',
    error: 'error',
  },
  sample: {
    chips: ['{{icmp}} · {{echo-request}}', '{{icmp}} · {{echo-reply}}'],
    namedChip: `${nameTag('tu-laptop')} ({{ip-address|IP}} 192.168.1.10)`,
    origin: nameTag('tu-laptop'),
    addresses: ['192.168.1.20', '192.168.1.11'],
    text: `El {{security-group}} de ${nameTag('servidor2')} no deja entrar el {{ping}}.`,
    windowName: 'Registro',
    option: 'Una respuesta posible',
    chosen: 'La respuesta elegida',
    closed: 'Una respuesta que ya no se puede elegir',
    chapterNumber: 2,
    chapterTitle: 'Un capítulo que todavía no abre',
    yesNo: '¿Está en la red?',
    yes: 'Sí',
    no: 'No',
    feedback: 'Por qué la respuesta es así.',
    tabs: { name: 'Sentido de las reglas', in: 'Entrada', out: 'Salida', inner: { name: 'Tablas del router', labels: ['Tabla de rutas', 'Tabla de traducciones'] } },
    table: {
      title: 'Tabla de rutas',
      owner: nameTag('router-oficina'),
      caption: 'Rutas de router-oficina',
      columns: { to: 'Destino', via: 'Por dónde sale' },
      routes: [
        { to: '192.168.1.0/24', via: 'directo' },
        { to: '0.0.0.0/0', via: `203.0.113.1 ${nameTag('router-proveedor')}` },
        { to: '10.0.0.0/16', via: `172.16.0.2 ${nameTag('router-sucursal')}` },
      ],
      empty: 'Sin rutas.',
      inUse: 'en uso',
      remove: 'Quitar',
    },
    dig: { name: 'www.lucia.example', address: '198.51.100.50', server: '198.51.100.8', ttl: 300, queryMs: 2 },
    message: { lines: ['HTTP/1.1 200 OK', 'Content-Type: text/plain; charset=utf-8', 'Content-Length: 9', '', 'La tienda'] },
    messages: {
      note: 'La zona también tiene sus registros propios. Aquí no se editan.',
      success: 'Sus tres primeros números son los del bloque: cabe.',
      warning: 'El propio dispositivo avisa que no pudo entregar el paquete.',
      error: 'Sus tres primeros números no son los del bloque: no cabe.',
    },
  },
} as const;

/** Returns the name of an entity in this variant, as the catalog shows it; an actor is a character, so its name is marked as a name, and an intruder's packet says so. */
export function entityName(entity: EntityRef): TermText {
  const names: Record<string, TermText> = ENTITY_NAMES[entity.kind];
  const name = names[entity.variant];
  return entity.kind === 'packet' && 'intruder' in entity && entity.intruder ? `${name} · ${CATALOG_TEXT.intruder}` : name;
}
