import { maskOf } from '@/engine';
import { defineIncident } from '@/levels/contract/incident';
import { BLOCK, BLOCK_CARD, CONCEPT, DEVICE, FLOORS_PIECES, IP, LESSON, NAME, TASK } from '@/levels/02-ports-and-names/shared';

const NETWORK_ADDRESS = BLOCK.cidr.split('/')[0];
const SMALL_PREFIX = 28;
const WIDE_PREFIX = 16;
const SINGLE_PREFIX = 32;
const LAST_OF_SMALL = '192.168.1.15';
const SMALLER_IP = '192.168.0.15';
const FIXED_NUMBERS = 3;

/** Returns the numbers of an IP that a /24 fixes, the first three, as the card writes them under each item. */
function fixedNumbers(ip: string): string {
  return ip.split('.').slice(0, FIXED_NUMBERS).join('.');
}

export default defineIncident({
  id: '02-04',
  chapter: 2,
  order: 4,
  title: '¿Está en mi bloque?',
  role: 'defender',
  mechanic: 'identify',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['bit', 'prefix', 'cidr', 'subnet-mask'],
  changes: [],
  shown: FLOORS_PIECES,
  report: `Las {{ip-address|IPs}} de una red local forman un bloque. En {{ipv4}}, una {{ip-address|IP}} tiene 32 {{bit|bits}}, escritos como cuatro números de 8 {{bit|bits}} cada uno. Los primeros {{bit|bits}}, iguales para todo el bloque, son el {{prefix|prefijo}}. Abre la tarjeta de ${NAME.you}. En «Clasificar» ves su bloque en notación {{cidr|CIDR}}, su {{subnet-mask|máscara de subred}} y los {{bit|bits}} de su {{ip-address|IP}}. En «Preguntas» eliges el bloque y la máscara. Después clasifica la ${NAME.printer} y a ${NAME.andres}: dentro del bloque o fuera.`,
  tasks: [
    {
      id: TASK.block,
      text: `Que el bloque de ${NAME.you} quede elegido en notación {{cidr|CIDR}}.`,
      expect: { deviceId: DEVICE.you.id, trayId: BLOCK_CARD.block.tray, chipId: BLOCK_CARD.block.right },
    },
    {
      id: TASK.mask,
      text: `Que su {{subnet-mask|máscara de subred}} quede elegida.`,
      expect: { deviceId: DEVICE.you.id, trayId: BLOCK_CARD.mask.tray, chipId: BLOCK_CARD.mask.right },
    },
    {
      id: TASK.printerInside,
      text: `Que la ${NAME.printer} quede dentro del bloque.`,
      expect: { deviceId: DEVICE.printer.id, trayId: BLOCK_CARD.bin.tray, chipId: BLOCK_CARD.bin.inside },
    },
    {
      id: TASK.andresOutside,
      text: `Que ${NAME.andres} quede fuera del bloque.`,
      expect: { deviceId: DEVICE.andres.id, trayId: BLOCK_CARD.bin.tray, chipId: BLOCK_CARD.bin.outside },
    },
  ],
  flows: [],
  identify: {
    cards: [
      {
        deviceId: DEVICE.you.id,
        question: '¿Cuál es el bloque de tu red local? ¿Y su {{subnet-mask|máscara de subred}}?',
        trays: [
          {
            id: BLOCK_CARD.block.tray,
            name: 'Bloque de tu red local',
            chips: [
              {
                id: BLOCK_CARD.block.right,
                label: BLOCK.cidr,
                feedback: 'Los 24 primeros {{bit|bits}} de tu {{ip-address|IP}}, los tres primeros números, son el {{prefix|prefijo}} del bloque.',
              },
              {
                id: BLOCK_CARD.block.small,
                label: `${NETWORK_ADDRESS}/${SMALL_PREFIX}`,
                feedback: `Un /${SMALL_PREFIX} fija ${SMALL_PREFIX} {{bit|bits}} y el bloque llega solo hasta ${LAST_OF_SMALL}. La ${NAME.printer}, ${IP.printer}, está en tu red local y no cabe.`,
              },
              {
                id: BLOCK_CARD.block.single,
                label: `${NETWORK_ADDRESS}/${SINGLE_PREFIX}`,
                feedback: `Un /${SINGLE_PREFIX} es una sola {{ip-address|IP}}: aquí, solo la ${NETWORK_ADDRESS}. No cabe ni ${NAME.you}.`,
              },
            ],
          },
          {
            id: BLOCK_CARD.mask.tray,
            name: 'Máscara de subred',
            chips: [
              {
                id: BLOCK_CARD.mask.right,
                label: BLOCK.mask,
                feedback: 'Es el /24 escrito como una {{ip-address|IP}}: 24 {{bit|bits}} en 1 y 8 en 0. Los {{bit|bits}} en 1 son la parte fija.',
              },
              {
                id: BLOCK_CARD.mask.wide,
                label: maskOf(WIDE_PREFIX),
                feedback: `Eso es un /${WIDE_PREFIX}: solo los dos primeros números son fijos, y el bloque es mucho más grande.`,
              },
              {
                id: BLOCK_CARD.mask.single,
                label: maskOf(SINGLE_PREFIX),
                feedback: `Eso es un /${SINGLE_PREFIX}: los ${SINGLE_PREFIX} {{bit|bits}} son fijos y el bloque es una sola {{ip-address|IP}}.`,
              },
            ],
          },
        ],
      },
    ],
    classify: {
      deviceId: DEVICE.you.id,
      cidr: BLOCK.cidr,
      trayId: BLOCK_CARD.bin.tray,
      bins: [
        { id: BLOCK_CARD.bin.inside, name: `Dentro de ${BLOCK.cidr}` },
        { id: BLOCK_CARD.bin.outside, name: 'Fuera' },
      ],
      items: [DEVICE.printer.id, DEVICE.andres.id],
    },
  },
  hints: [
    'Un {{prefix|prefijo}} /24 quiere decir que los 24 primeros {{bit|bits}}, los tres primeros números, son fijos.',
    'Compara los tres primeros números de la {{ip-address|IP}} de cada {{device|dispositivo}} con los de tu bloque.',
  ],
  question: `¿Por qué ${IP.andres} no cabe en el bloque ${BLOCK.cidr}?`,
  explanation: [
    {
      text: 'Porque un {{prefix|prefijo}} /24 deja solo 24 {{ip-address|IPs}}, y el bloque ya está lleno.',
      feedback: 'Un /24 no cuenta {{ip-address|IPs}}: dice que 24 {{bit|bits}} son fijos. Los otros 8 {{bit|bits}} dan 256 direcciones.',
      correct: false,
    },
    {
      text: 'Porque los 24 primeros {{bit|bits}} de esa {{ip-address|IP}} no son los del bloque.',
      feedback: `Los 24 primeros {{bit|bits}} son los tres primeros números. Todo el bloque empieza por ${fixedNumbers(BLOCK.cidr)}, y la {{ip-address|IP}} de ${NAME.andres} empieza por ${fixedNumbers(IP.andres)}: no cabe.`,
      correct: true,
    },
    {
      text: 'Porque el 2 de esa {{ip-address|IP}} es mayor que el 1 del bloque, y debe ser menor.',
      feedback: `No importa si el número es mayor o menor: importa que sea el mismo. Con ${SMALLER_IP} tampoco cabría.`,
      correct: false,
    },
  ],
  solution: [
    { type: 'answerCard', deviceId: DEVICE.you.id, picks: { [BLOCK_CARD.block.tray]: BLOCK_CARD.block.right, [BLOCK_CARD.mask.tray]: BLOCK_CARD.mask.right } },
    { type: 'answerCard', deviceId: DEVICE.printer.id, picks: { [BLOCK_CARD.bin.tray]: BLOCK_CARD.bin.inside } },
    { type: 'answerCard', deviceId: DEVICE.andres.id, picks: { [BLOCK_CARD.bin.tray]: BLOCK_CARD.bin.outside } },
  ],
  takeaway: `En {{ipv4}}, una {{ip-address|IP}} tiene 32 {{bit|bits}}. El {{prefix|prefijo}} dice cuántos de los primeros {{bit|bits}} son iguales para todo el bloque. En notación {{cidr|CIDR}}, el bloque de la red local de ${NAME.you} es ${BLOCK.cidr}: 256 direcciones. Su {{subnet-mask|máscara de subred}} es ${BLOCK.mask}, el {{prefix|prefijo}} /24 escrito como una {{ip-address|IP}}. Una {{ip-address|IP}} cabe en el bloque si sus primeros 24 {{bit|bits}} son los del bloque.`,
});
