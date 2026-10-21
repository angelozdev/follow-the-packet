import type { AddressChip, CaseSpec, ExplanationOption, MessageChip, OriginChip } from '@/levels/contract/incident';
import {
  ADDRESS,
  BRANCH_LAN,
  DEFAULT_ROUTE_LOST,
  DOMAIN,
  HOSTNAME,
  IP,
  LOOP,
  LOOP_CAUSE,
  LOOP_FIX,
  LOOP_FIX_PIECES,
  LOOPBACK_SITE_PIECES,
  LOST_WAY_PIECES,
  MESSAGE,
  NAME,
  NAME_TEST_PIECES,
  ORIGIN,
  PING_WITH_TTL,
  PORT,
  PRINTER_DNS_PIECES,
  SERVICES_PIECES,
  SITE_ON_LOOPBACK,
  STALE_SHOP,
  STALE_SHOP_PIECES,
} from '@/levels/02-ports-and-names/shared';

type Place = 0 | 1 | 2;
type Reply = readonly [text: string, feedback: string];
type Options = CaseSpec['cause']['options'];

interface Tests {
  from: OriginChip;
  to: AddressChip[];
  message: MessageChip[];
}

type Draft = Omit<CaseSpec, 'id' | 'send'> & { tests: Tests };

function option([text, feedback]: Reply, correct: boolean): ExplanationOption {
  return { text, feedback, correct };
}

/** Returns the question of a case with its three options: the right reply at `place` (0 is the first option) and the two wrong ones, in the order given, around it. Each wrong reply is a real mistake whose feedback points at the evidence that refutes it. */
function cause(question: string, place: Place, right: Reply, wrong: [Reply, Reply]): CaseSpec['cause'] {
  const options = wrong.map((reply) => option(reply, false));
  options.splice(place, 0, option(right, true));
  return { question, options: options as Options };
}

/** Returns case number `number` of the on-call incident: what its terminal can send, then the rest of its draft (changes to the world before the incident, pieces it draws, report, fix, hints and cause). */
function onCallCase(number: number, { tests, ...draft }: Draft): CaseSpec {
  return { id: `case-${number}`, ...draft, send: { from: [tests.from], to: tests.to, message: tests.message } };
}

export const CASES: CaseSpec[] = [
  onCallCase(1, {
    tests: { from: ORIGIN.you, to: [ADDRESS.www], message: [MESSAGE.dig, MESSAGE.ping, MESSAGE.ncWeb] },
    changes: [SITE_ON_LOOPBACK],
    shown: LOOPBACK_SITE_PIECES,
    report: `Tu {{nc}} a ${HOSTNAME.www}, {{port|puerto}} ${PORT.web}, no conecta. Haz tres pruebas, en orden: el {{dig}} (¿el nombre da una {{ip-address|IP}}?), el {{ping}} (¿hay camino hasta ella?) y el {{nc}} (¿contesta el puerto?).`,
    hints: ['Mira hasta dónde llega cada prueba, en orden. La primera que falla marca por dónde seguir.', `Mira la caja de ${NAME.freshServer}: dice dónde escucha cada uno de sus servicios.`],
    cause: cause(
      `¿Por qué no conecta el {{nc}} a ${HOSTNAME.www}?`,
      1,
      [
        `Porque el servicio escucha solo en ${IP.loopback}.`,
        `El {{ping}} vuelve: hay camino. El {{nc}} llegó, pero ${NAME.freshServer} contestó con un {{rst}}, y por eso el {{nc}} muestra {{connection-refused}}. Alguien cambió la configuración de ${NAME.freshServer}: su servicio del {{port|puerto}} ${PORT.web} ahora tiene como {{listen-address|dirección de escucha}} ${IP.loopback}. Esa dirección atiende solo al propio servidor, no a quien llega por la red.`,
      ],
      [
        [
          'Porque el nombre no se convierte en la IP del servidor.',
          `El {{dig}} volvió con la {{ip-address|IP}} ${IP.freshServer}, y el {{ping}} al mismo nombre vuelve. El nombre sí se convierte en una IP.`,
        ],
        ['Porque un firewall descarta el paquete.', `Un {{firewall}} que descarta no contesta nada, y el {{nc}} solo vería un {{timeout}}. Aquí llegó un {{rst}} de ${NAME.freshServer}: el paquete llegó y fue rechazado.`],
      ],
    ),
  }),
  onCallCase(2, {
    tests: { from: ORIGIN.you, to: [ADDRESS.mistyped], message: [MESSAGE.dig, MESSAGE.ncWeb] },
    shown: NAME_TEST_PIECES,
    report: `Tu {{nc}} a ${HOSTNAME.typo}, {{port|puerto}} ${PORT.web}, no conecta.`,
    hints: [`Mira la caja del {{dig}}: dice qué contestó ${NAME.resolver}.`, `Compara el nombre de tu {{nc}} con ${HOSTNAME.www}.`],
    cause: cause(
      `¿Por qué no conecta el {{nc}} a ${HOSTNAME.typo}?`,
      2,
      [
        'Porque el nombre está mal escrito y no existe.',
        `La consulta salió, llegó a ${NAME.resolver} y volvió con {{nxdomain}}: ese nombre no existe. Sin una {{ip-address|IP}}, el {{nc}} no tiene adónde ir y ni siquiera sale. El nombre del sitio es ${HOSTNAME.www}, con tres w.`,
      ],
      [
        [`Porque el servidor no contesta en el puerto ${PORT.web}.`, `El {{nc}} ni siquiera salió de ${NAME.you}: nunca supo a qué servidor ir. Ningún {{packet|paquete}} llegó al servidor del sitio.`],
        [`Porque ${NAME.router} perdió una ruta.`, `La consulta sí pasó por ${NAME.router} y volvió con su respuesta. El {{nc}} no salió, pero no por una {{route|ruta}}: no tenía una {{ip-address|IP}} a la que ir.`],
      ],
    ),
  }),
  onCallCase(3, {
    tests: { from: ORIGIN.you, to: [ADDRESS.shop], message: [MESSAGE.dig, MESSAGE.ping] },
    changes: STALE_SHOP,
    shown: STALE_SHOP_PIECES,
    report: `El {{ping}} a ${HOSTNAME.shop} no vuelve, pero el {{dig}} al mismo nombre da ${IP.server}. Alguien agregó a ${NAME.authoritative} un {{a-record|registro A}} de ese nombre. Y alguien cambió la configuración de ${NAME.you}.`,
    hints: ['Compara adónde fue el {{dig}} con adónde fue el {{ping}}.', `Mira la caja del {{ping}}: dice de dónde sacó ${NAME.you} la {{ip-address|IP}}.`],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a ${HOSTNAME.shop}?`,
      0,
      [
        `Porque el {{hosts-file|archivo hosts}} de ${NAME.you} tiene una línea vieja.`,
        `El {{ping}} le pide la {{ip-address|IP}} al sistema operativo, que suele leer primero el {{hosts-file|archivo hosts}}. En ${NAME.you}, ese archivo tiene una línea vieja: ${HOSTNAME.shop} es ${IP.staleHost}, una IP que nadie tiene. Por eso un {{router}} avisó con {{host-unreachable}}. El {{dig}} le pregunta directo al {{dns}}, no lee ese archivo, y el {{dns}} tiene la IP buena: ${IP.server}.`,
      ],
      [
        [
          `Porque ${NAME.resolver} tiene guardada en su caché la respuesta vieja.`,
          `El {{dig}} le preguntó a ${NAME.resolver} y volvió con la IP buena, ${IP.server}. Si ${NAME.resolver} guardara una respuesta vieja, el {{dig}} la mostraría.`,
        ],
        [`Porque ${NAME.server} está caído.`, `El {{ping}} no fue a ${NAME.server}: fue a la ${IP.staleHost}, una IP que nadie tiene. La IP de ${NAME.server} es la ${IP.server}, la que dio el {{dig}}.`],
      ],
    ),
  }),
  onCallCase(4, {
    tests: { from: ORIGIN.you, to: [ADDRESS.server, ADDRESS.otherOffice], message: [MESSAGE.ping] },
    changes: [DEFAULT_ROUTE_LOST],
    shown: LOST_WAY_PIECES,
    report: `El {{ping}} de ${NAME.you} a ${NAME.server} no vuelve.`,
    hints: ['Compara los dos {{ping|pings}} del caso: ¿cuál vuelve y cuál no?', 'Mira de qué {{router}} viene el aviso del {{ping}} que no vuelve.'],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a ${NAME.server}?`,
      2,
      [
        `Porque ${NAME.router} no tiene {{default-route|ruta por defecto}}.`,
        `Alguien cambió la configuración de ${NAME.router}: le quitó la {{default-route|ruta por defecto}} y solo conserva la {{route|ruta}} a ${BRANCH_LAN.cidr}, la de la otra oficina. Por eso el {{ping}} a ${IP.otherOfficePrinter} vuelve. Para ${IP.server} no tiene ninguna ruta, y avisó con {{net-unreachable}}.`,
      ],
      [
        [`Porque ${NAME.server} está caído.`, `El aviso {{net-unreachable}} no lo mandó ${NAME.server}: lo mandó ${NAME.router}, desde la ${IP.router}. El {{ping}} no pasó de ahí.`],
        [
          `Porque el {{firewall}} de ${NAME.you} no deja salir los {{ping|pings}}.`,
          `El {{ping}} sí salió de ${NAME.you}: su {{firewall}} deja salir todo, y el {{ping}} a ${IP.otherOfficePrinter} vuelve. El aviso lo mandó ${NAME.router}.`,
        ],
      ],
    ),
  }),
  onCallCase(5, {
    tests: { from: ORIGIN.you, to: [ADDRESS.server], message: [MESSAGE.ping, MESSAGE.traceroute, PING_WITH_TTL[1], PING_WITH_TTL[2], PING_WITH_TTL[3]] },
    changes: LOOP,
    shown: LOOP_FIX_PIECES,
    fix: LOOP_FIX,
    report: `Ningún {{ping}} de ${NAME.you} a ${NAME.server} vuelve. Para cerrar el caso, nombra la causa y haz que el {{ping}} vuelva.`,
    hints: ['Mira de qué {{router}} viene el aviso de cada {{ping}}. Prueba con {{ttl}} 1, 2 y 3.', `Corre un {{traceroute}} a ${NAME.server} y fíjate si las {{ip-address|IP}} se repiten.`],
    cause: cause(
      `¿Por qué no vuelve ningún {{ping}} a ${NAME.server}?`,
      0,
      [
        'Porque el {{packet|paquete}} da vueltas entre dos {{router|routers}}.',
        `El {{ttl}} baja en cada {{hop|salto}} hasta llegar a 0. Los avisos de {{time-exceeded}} vienen de dos {{router|routers}} que se alternan, y el {{traceroute}} repite sus {{ip-address|IP}}: la ${IP.router} y la ${IP.provider}. ${LOOP_CAUSE} Para arreglarlo, ${NAME.provider} tiene que mandar lo que va a ${NAME.server} hacia ${NAME.destination}.`,
      ],
      [
        [`Porque ${NAME.server} está sobrecargado.`, 'El aviso que vuelve es {{time-exceeded}}, y lo manda un {{router}}, no el servidor: el {{ping}} ni llegó a él.'],
        [
          `Porque ${NAME.router} descarta lo que va al servidor.`,
          `${NAME.router} no descarta nada: le pasa el {{packet|paquete}} a ${NAME.provider}, y ${NAME.provider} se lo devuelve. Por eso los avisos vienen de los dos.`,
        ],
      ],
    ),
  }),
  onCallCase(6, {
    tests: { from: ORIGIN.you, to: [ADDRESS.lucia], message: [MESSAGE.ncSsh, MESSAGE.ncApp] },
    shown: SERVICES_PIECES,
    report: `Tu {{nc}} al {{port|puerto}} ${PORT.app} de ${NAME.lucia} no conecta.`,
    hints: ['Compara los dos {{nc}}: ¿cuál vuelve y cuál no recibe nada?', `Mira la caja del {{firewall}} de ${NAME.lucia}: dice qué deja entrar.`],
    cause: cause(
      `¿Por qué no conecta el {{nc}} al {{port|puerto}} ${PORT.app} de ${NAME.lucia}?`,
      1,
      [
        `Porque el {{firewall}} de ${NAME.lucia} no deja entrar el ${PORT.app}.`,
        `El {{nc}} al ${PORT.ssh} vuelve: ${NAME.lucia} sí atiende por la red. El del ${PORT.app} no recibe nada, ni un rechazo: el {{firewall}} de ${NAME.lucia} descarta ese {{packet|paquete}} sin avisar, porque su única regla de {{inbound|entrada}} es la del {{port|puerto}} ${PORT.ssh}.`,
      ],
      [
        [`Porque nadie escucha en el puerto ${PORT.app} de ${NAME.lucia}.`, `Si nadie escuchara y el {{packet|paquete}} llegara, ${NAME.lucia} contestaría con un {{rst}} y el {{nc}} mostraría {{connection-refused}}. Aquí no volvió nada, ni un rechazo.`],
        [`Porque la app de ${NAME.lucia} escucha solo en la {{ip-address|IP}} ${IP.loopback}.`, `Una app que escucha solo en ${IP.loopback} también rechazaría con un {{rst}} a quien llega por la red. Aquí no volvió nada: el {{packet|paquete}} se descartó antes.`],
      ],
    ),
  }),
  onCallCase(7, {
    tests: { from: ORIGIN.andres, to: [ADDRESS.www], message: [MESSAGE.dig] },
    shown: PRINTER_DNS_PIECES,
    report: `El {{dig}} de ${NAME.andres} a ${HOSTNAME.www} no obtiene respuesta.`,
    hints: ['Mira dónde terminó el {{dig}} y quién avisó.', `Mira a quién le hizo la consulta ${NAME.andres}: la caja del {{dig}} lo dice.`],
    cause: cause(
      `¿Por qué no obtiene respuesta el {{dig}} de ${NAME.andres}?`,
      2,
      [
        `Porque la ${NAME.printer} es su servidor {{dns}} y no atiende {{dns}}.`,
        `El {{dig}} fue a la ${NAME.printer}, el servidor {{dns}} de ${NAME.andres}. Ningún programa de la ${NAME.printer} escucha en el {{port|puerto}} {{udp|UDP}} ${PORT.dns}, y por eso avisó con {{port-unreachable}}.`,
      ],
      [
        ['Porque el nombre no existe.', 'Si el nombre no existiera, el {{dns}} contestaría {{nxdomain}}. Aquí no contestó ningún {{dns}}: avisó la impresora.'],
        [
          `Porque un servidor {{authoritative-server|autoritativo}} de ${DOMAIN.site} está caído.`,
          'Si un servidor autoritativo fallara, el {{resolver}} contestaría {{servfail}}. Aquí no contestó ningún servidor {{dns}}: la impresora avisó antes.',
        ],
      ],
    ),
  }),
];
