import type { NetworkAction } from '@/engine';
import { ruleIdFor, type AddressChip, type CaseSpec, type ExplanationOption, type MessageChip, type OriginChip } from '@/levels/contract/incident';
import { ADDRESS, DEVICE, FIREWALL, IP, LOOP, LOOP_CAUSE, LOOP_PIECES, LUCIA_FIREWALL, MESSAGE, NAME, ORIGIN, PING_WITH_TTL, TO, WATCH_FIREWALL_PIECES, WATCH_GATEWAY_PIECES, WATCH_PRINTER_PIECES, WATCH_SECOND_FLOOR_PIECES, WHAT, letEverythingOut } from '@/levels/01-first-day/shared';

type Place = 0 | 1 | 2;
type Reply = readonly [text: string, feedback: string];

interface Probe {
  changes?: NetworkAction[];
  shown: string[];
  from: OriginChip;
  to: AddressChip[];
  message?: MessageChip[];
  report: string;
  hints: [string, string];
  cause: CaseSpec['cause'];
}

const ARRANGEMENTS: Record<Place, (right: ExplanationOption, first: ExplanationOption, second: ExplanationOption) => CaseSpec['cause']['options']> = {
  0: (right, first, second) => [right, first, second],
  1: (right, first, second) => [first, right, second],
  2: (right, first, second) => [first, second, right],
};

function option([text, feedback]: Reply, correct: boolean): ExplanationOption {
  return { text, feedback, correct };
}

/** Returns the question of a case with its three options: the right reply at `place` (0 is the first option) and the two wrong ones, in the order given, around it. Each wrong reply is a real mistake whose feedback points at the evidence that refutes it. */
function cause(question: string, place: Place, right: Reply, [first, second]: [Reply, Reply]): CaseSpec['cause'] {
  return { question, options: ARRANGEMENTS[place](option(right, true), option(first, false), option(second, false)) };
}

/** Returns case number `number` of the final watch: the tests its origin can send (a ping unless it offers other messages), the changes it makes to the world before the incident (never to the case before), the pieces its screen draws (only what the case uses), what Lucía reports, its two hints and its question of cause. */
function watchCase(number: number, { changes, shown, from, to, message = [MESSAGE.ping], report, hints, cause: question }: Probe): CaseSpec {
  return { id: `case-${number}`, ...(changes && { changes }), shown, report, send: { from: [from], to, message }, hints, cause: question };
}

/** The four tests of the ladder, from the closest to the farthest: the loopback of the laptop, its own IP, the IP of its router and the server of the internet. Case 1 guides the player with them and case 7 offers them again. */
const FROM_YOUR_LAPTOP: AddressChip[] = [ADDRESS.loopback, ADDRESS.you, ADDRESS.gateway, ADDRESS.server];

/** Takes the rule 01-13 wrote out of your laptop, so its outbound side has no rule at all. */
const CLOSE_YOUR_OUTBOUND: NetworkAction = {
  type: 'removeRule',
  firewallId: FIREWALL.you,
  direction: 'outbound',
  ruleId: ruleIdFor(WHAT.echoRequest.id, TO.lucia.id, 'outbound'),
};

/** Opens the outbound side of your laptop again: the rule 01-13 wrote lets out only the ping to laptop-lucia, and a case that tests other destinations must not stop at your own firewall. It takes that rule out and lets everything out, so the firewall has one rule and not two. */
const OPEN_YOUR_OUTBOUND: NetworkAction[] = [CLOSE_YOUR_OUTBOUND, { type: 'addRule', firewallId: FIREWALL.you, direction: 'outbound', rule: letEverythingOut(`${FIREWALL.you}-out`) }];

function withoutGateway(deviceId: string): NetworkAction {
  return { type: 'setGateway', deviceId };
}

export const CASES: CaseSpec[] = [
  watchCase(1, {
    changes: [...OPEN_YOUR_OUTBOUND, withoutGateway(DEVICE.you.id)],
    shown: WATCH_GATEWAY_PIECES,
    from: ORIGIN.you,
    to: FROM_YOUR_LAPTOP,
    report: `Tu {{ping}} a ${NAME.server} no vuelve. Haz cuatro pruebas, en orden, de la más cercana a la más lejana: el {{loopback}} de tu laptop (${IP.loopback}), tu {{ip-address|IP}} (${IP.you}), el {{router}} (${IP.router}) y el servidor.`,
    hints: [
      'Mira hasta dónde llegan las pruebas, en orden. La primera que falla marca por dónde seguir.',
      `Mira la caja del {{ping}} a ${NAME.server}: en «Dónde y por qué se detuvo» está lo que pasó.`,
    ],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a ${NAME.server}?`,
      1,
      [
        `Porque ${NAME.you} no tiene {{default-gateway}}.`,
        `El {{ping}} al {{router}} vuelve, pero ${NAME.you} no tiene guardada su {{default-gateway}}: no sabe por dónde sacar el ping al servidor, y por eso ni sale.`,
      ],
      [
        [`Porque ${NAME.server} está caído y no contesta.`, `El {{ping}} ni siquiera salió de ${NAME.you}: nunca pasó por un {{router}}, y menos llegó al servidor.`],
        [`Porque ${NAME.you} no tiene {{ip-address|IP}} en su {{lan|red local}}.`, `El {{ping}} a tu propia IP, la ${IP.you}, vuelve: ${NAME.you} sí tiene IP.`],
      ],
    ),
  }),
  watchCase(2, {
    changes: OPEN_YOUR_OUTBOUND,
    shown: WATCH_PRINTER_PIECES,
    from: ORIGIN.you,
    to: [ADDRESS.typo, ADDRESS.printer],
    report: `Anoté la ${IP.typo} como la {{ip-address|IP}} de la ${NAME.printer}, y el {{ping}} a esa IP no vuelve.`,
    hints: [`Mira quién mandó el aviso del {{ping}} a la ${IP.typo}: la caja lo dice.`, `Compara la ${IP.typo} con la IP que muestra la caja de la ${NAME.printer}.`],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a la ${IP.typo}?`,
      2,
      [
        'Porque la {{ip-address|IP}} está mal escrita y nadie la tiene.',
        `${NAME.you} buscó la ${IP.typo} en su red y nadie contestó, así que avisó con {{host-unreachable}}. La ${NAME.printer} tiene otra IP, la ${IP.printer}, y el {{ping}} a esa IP sí vuelve.`,
      ],
      [
        [`Porque la ${NAME.printer} está apagada y no contesta.`, `La ${NAME.printer} contesta en su IP, la ${IP.printer}. El aviso lo mandó ${NAME.you}, no ella.`],
        [
          `Porque el {{firewall}} de la ${NAME.printer} bloquea el {{ping}}.`,
          `El aviso viene de ${NAME.you}, no de la ${NAME.printer}. Y el {{ping}} a la ${IP.printer}, la IP de la ${NAME.printer}, vuelve sin que nada lo bloquee.`,
        ],
      ],
    ),
  }),
  watchCase(3, {
    changes: [withoutGateway(DEVICE.andres.id)],
    shown: WATCH_SECOND_FLOOR_PIECES,
    from: ORIGIN.andres,
    to: [ADDRESS.loopback, ADDRESS.andres, ADDRESS.secondFloorRouter, ADDRESS.printer],
    report: `El {{ping}} de ${NAME.andres} a la ${NAME.printer} del piso 1 no vuelve.`,
    hints: ['Compara los {{ping|pings}} que vuelven con el que no. ¿Hasta dónde llega cada uno?', `Mira la caja del {{ping}} a la ${NAME.printer}: dice dónde se detuvo y por qué.`],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a la ${NAME.printer}?`,
      0,
      [
        `Porque ${NAME.andres} no tiene {{default-gateway}}.`,
        `El {{ping}} al {{router}} vuelve, pero el de la ${NAME.printer} ni sale de ${NAME.andres}: la ${NAME.printer} está en otra {{lan|red local}} y ${NAME.andres} no sabe por dónde sacarlo.`,
      ],
      [
        [
          'Porque el {{router}} no reenvía los {{ping|pings}} de un piso a otro y los descarta.',
          `El {{ping}} ni siquiera llegó al {{router}}: se detuvo en ${NAME.andres}, antes de salir de su piso. El router contesta en la ${IP.routerSecondFloor}.`,
        ],
        [
          `Porque la ${NAME.printer} del piso 1 está apagada y no contesta los {{ping|pings}}.`,
          `El {{ping}} se detuvo en ${NAME.andres}, antes de llegar a otra {{lan|red local}}: lo que haga la ${NAME.printer} no cambia nada.`,
        ],
      ],
    ),
  }),
  watchCase(4, {
    changes: OPEN_YOUR_OUTBOUND,
    shown: LOOP_PIECES,
    from: ORIGIN.you,
    to: [ADDRESS.server, ADDRESS.otherOffice],
    report: `El {{ping}} a la impresora de otra oficina, la ${IP.otherOfficePrinter}, no vuelve. Pruébalo desde tu laptop.`,
    hints: [`Haz también un {{ping}} a ${NAME.server}. Compara cuál vuelve y cuál no.`, `Mira la caja del {{ping}} a la ${IP.otherOfficePrinter}: dice dónde se detuvo.`],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a la ${IP.otherOfficePrinter}?`,
      2,
      [
        `Porque la ${IP.otherOfficePrinter} es una {{private-ip|IP privada}} y {{internet}} no la entrega.`,
        `${NAME.provider} descartó el {{ping}} sin avisar. Las {{private-ip|IP privadas}} se repiten en muchas redes, y por eso {{internet}} no las entrega.`,
      ],
      [
        [`Porque ${NAME.server} bloquea los {{ping|pings}} que vienen de tu laptop.`, `El {{ping}} a ${NAME.server} vuelve, así que no bloquea tus pings.`],
        [`Porque ${NAME.you} no tiene {{default-gateway}}.`, `El {{ping}} a ${NAME.server} sale por la {{default-gateway}} y vuelve: ${NAME.you} sí la tiene.`],
      ],
    ),
  }),
  watchCase(5, {
    changes: [...OPEN_YOUR_OUTBOUND, ...LOOP],
    shown: LOOP_PIECES,
    from: ORIGIN.you,
    to: [ADDRESS.server],
    message: [MESSAGE.ping, MESSAGE.traceroute, PING_WITH_TTL[1], PING_WITH_TTL[2], PING_WITH_TTL[3]],
    report: `Ningún {{ping}} del piso 1 a ${NAME.server} vuelve.`,
    hints: ['Mira de qué {{router}} viene el aviso de cada {{ping}}. Prueba con {{ttl}} 1, 2 y 3.', `Corre un {{traceroute}} a ${NAME.server} y fíjate si las {{ip-address|IP}} se repiten.`],
    cause: cause(
      `¿Por qué no vuelve ningún {{ping}} a ${NAME.server}?`,
      0,
      [
        'Porque el {{packet|paquete}} da vueltas entre los mismos dos {{router|routers}}.',
        `El {{ttl}} baja en cada {{hop|salto}} hasta llegar a 0. Los avisos de {{time-exceeded}} vienen de dos {{router|routers}} que se alternan, y el {{traceroute}} repite sus {{ip-address|IP}}: la ${IP.router} y la ${IP.provider}. ${LOOP_CAUSE} ${NAME.router} se lo manda otra vez a ${NAME.provider}, y el {{packet|paquete}} no avanza.`,
      ],
      [
        [
          `Porque ${NAME.server} está sobrecargado y no contesta.`,
          'El aviso que vuelve es {{time-exceeded}}, y lo manda un {{router}}, no el servidor: el {{ping}} ni llegó a él.',
        ],
        [
          'Porque la {{ip-address|IP}} del servidor está mal escrita.',
          `La ${IP.server} es la IP que muestra la caja de ${NAME.server}. Lo que falla es el camino: dos {{router|routers}} se pasan el {{packet|paquete}} entre ellos.`,
        ],
      ],
    ),
  }),
  watchCase(6, {
    changes: [...OPEN_YOUR_OUTBOUND, LUCIA_FIREWALL],
    shown: WATCH_FIREWALL_PIECES,
    from: ORIGIN.you,
    to: [ADDRESS.lucia, ADDRESS.printer, ADDRESS.gateway, ADDRESS.server],
    report: `Los {{ping|pings}} a ${NAME.lucia} no vuelven, pero los de la ${NAME.printer} sí.`,
    hints: ['Compara los {{ping|pings}}: ¿cuál no vuelve y dónde está su ✕?', `Mira la caja del {{firewall}} de ${NAME.lucia}.`],
    cause: cause(
      `¿Por qué no vuelve el {{ping}} a ${NAME.lucia}?`,
      1,
      [
        `Porque el {{firewall}} de ${NAME.lucia} no deja entrar los {{ping|pings}}.`,
        `El {{ping}} llegó hasta ${NAME.lucia} y su {{firewall}} lo {{drop|descartó}} sin avisar, porque su {{inbound|entrada}} no tiene ninguna {{rule|regla}} que lo {{allow|permita}}. Por eso solo ves {{timeout}}.`,
      ],
      [
        [
          `Porque el {{router}} descarta los {{ping|pings}} que van a ${NAME.lucia}.`,
          `El {{ping}} a ${NAME.lucia} ni pasa por el {{router}}: está en tu mismo piso. El ✕ está en su {{firewall}}.`,
        ],
        [
          `Porque el {{firewall}} de ${NAME.you} no deja salir los {{ping|pings}} a la red.`,
          `La {{outbound|salida}} de ${NAME.you} deja salir todo, y los {{ping|pings}} a la ${NAME.printer} y al {{router}} vuelven. El ✕ está en el {{firewall}} de ${NAME.lucia}.`,
        ],
      ],
    ),
  }),
  watchCase(7, {
    changes: [CLOSE_YOUR_OUTBOUND],
    shown: WATCH_GATEWAY_PIECES,
    from: ORIGIN.you,
    to: FROM_YOUR_LAPTOP,
    report: 'Desde tu laptop, ningún {{ping}} a otro {{device|dispositivo}} vuelve.',
    hints: ['Mira dónde está el ✕ de los {{ping|pings}} que no vuelven.', `Mira las {{rule|reglas}} de la {{outbound|salida}} del {{firewall}} de ${NAME.you}.`],
    cause: cause(
      `¿Por qué no vuelve ni el {{ping}} al {{router}}, el ${IP.router}?`,
      2,
      [
        `Porque el {{firewall}} de ${NAME.you} no deja salir ningún {{ping}}.`,
        `El ✕ está en ${NAME.you}: su {{firewall}} detuvo cada ping al salir, incluso el del {{router}}, porque su {{outbound|salida}} no tiene ninguna {{rule|regla}} que lo {{allow|permita}}. Los de {{loopback}} y de tu propia IP sí vuelven.`,
      ],
      [
        [
          'Porque el {{router}} está caído y no contesta los {{ping|pings}} de tu laptop.',
          `El {{ping}} ni siquiera salió de ${NAME.you}: el ✕ está en su {{firewall}}. El {{router}} nunca lo recibió.`,
        ],
        [
          `Porque a ${NAME.you} le falta la {{default-gateway}}.`,
          `El {{router}} está en tu misma {{lan|red local}}, así que ese {{ping}} no usa la {{default-gateway}}. Y aun así no vuelve: se detiene en el {{firewall}} de ${NAME.you}.`,
        ],
      ],
    ),
  }),
];
