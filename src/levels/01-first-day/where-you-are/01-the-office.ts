import { nameTag } from '@/copy';
import { defineIncident } from '@/levels/contract/incident';
import { BASE_WORLD, CARD, CONCEPT, DEVICE, IP, LESSON, TASK } from '@/levels/01-first-day/shared';

const IN_NETWORK = '¿Está en la red?';
const ANSWER_YES = 'Sí';
const ANSWER_NO = 'No';
const NAME = { visitor: nameTag(DEVICE.visitor.name), lucia: nameTag(DEVICE.lucia.name), marta: nameTag(DEVICE.marta.name), printer: nameTag(DEVICE.printer.name) };

function networkCard(deviceId: string, feedback: { yes?: string; no?: string }) {
  return {
    deviceId,
    trays: [
      {
        id: CARD.network.tray,
        name: IN_NETWORK,
        segmented: true,
        chips: [
          { id: CARD.network.yes, label: ANSWER_YES, feedback: feedback.yes },
          { id: CARD.network.no, label: ANSWER_NO, feedback: feedback.no },
        ],
      },
    ],
  };
}

export default defineIncident({
  id: '01-01',
  chapter: 1,
  order: 1,
  title: 'La oficina',
  role: 'defender',
  mechanic: 'identify',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['network', 'device', 'ip-address', 'ipv4'],
  base: BASE_WORLD,
  report: `Te doy la bienvenida a tu primer día. Esta oficina es una {{network|red}}: un conjunto de {{device|dispositivos}} conectados entre sí. Anoté la {{ip-address|dirección IP}} de la ${NAME.printer} en una nota: ${IP.note}. Revisa dos cosas: qué laptop no está conectada y si mi nota está bien. Un clic en ${NAME.visitor} o en la ${NAME.printer} abre su tarjeta.`,
  tasks: [
    {
      id: TASK.visitor,
      text: `Que ${NAME.visitor} quede marcada como fuera de la {{network|red}}.`,
      expect: { deviceId: DEVICE.visitor.id, trayId: CARD.network.tray, chipId: CARD.network.no },
    },
    {
      id: TASK.printer,
      text: `Que la ${NAME.printer} tenga elegida su {{ip-address|dirección IP}} verdadera.`,
      expect: { deviceId: DEVICE.printer.id, trayId: CARD.ip.tray, chipId: CARD.ip.right },
    },
  ],
  flows: [],
  identify: {
    cards: [
      networkCard(DEVICE.lucia.id, { no: `Sí está en la {{network|red}}: ${NAME.lucia} está conectada. Su caja de inspección lo dice.` }),
      networkCard(DEVICE.visitor.id, { yes: `No. ${NAME.visitor} no está conectada, así que no forma parte de la {{network|red}}. Su caja de inspección lo dice.` }),
      {
        deviceId: DEVICE.printer.id,
        question: '¿Cuál es su {{ip-address|dirección IP}}?',
        trays: [
          {
            id: CARD.ip.tray,
            name: 'Dirección IP',
            initialPick: CARD.ip.note,
            initialPickRule: `La nota de Lucía estaba mal: ${IP.note} no es {{ipv4}}, porque cada uno de los cuatro números va de 0 a 255.`,
            chips: [
              { id: CARD.ip.right, label: IP.printer, feedback: 'Correcto.' },
              { id: CARD.ip.note, label: IP.note, feedback: 'No es {{ipv4}}: cada uno de los cuatro números va de 0 a 255.' },
              { id: CARD.ip.marta, label: IP.marta, feedback: `Esa {{ip-address|IP}} es de ${NAME.marta}: se ve en su caja. La ${NAME.printer} tiene otra.` },
            ],
          },
        ],
      },
    ],
  },
  hints: [
    'Pasa el mouse por cada {{device|dispositivo}} y mira su caja de inspección: dice si está conectado a la {{network|red}} y cuál es su {{ip-address|IP}}.',
    `Un número de una {{ipv4}} no pasa de 255. Compara la IP de la nota con la de la ${NAME.printer}.`,
  ],
  question: `¿Por qué ${IP.note} no puede ser la {{ip-address|dirección IP}} de la ${NAME.printer}?`,
  explanation: [
    {
      text: 'Porque ya la usa otro {{device|dispositivo}}.',
      feedback: 'No. Ningún dispositivo la usa. El problema es el número: 300 pasa de 255.',
      correct: false,
    },
    {
      text: 'Porque en {{ipv4}} cada uno de los cuatro números va de 0 a 255.',
      feedback: `Eso es. El último número de ${IP.note} es 300, y pasa de 255: no es una dirección {{ipv4}}.`,
      correct: true,
    },
    {
      text: 'Porque es una {{ip-address|IP}} de otra {{network|red}}.',
      feedback: 'No. No es de otra {{network|red}}: no es de ninguna. El 300 pasa de 255.',
      correct: false,
    },
  ],
  solution: [
    { type: 'answerCard', deviceId: DEVICE.visitor.id, picks: { [CARD.network.tray]: CARD.network.no } },
    { type: 'answerCard', deviceId: DEVICE.printer.id, picks: { [CARD.ip.tray]: CARD.ip.right } },
  ],
  takeaway: 'Una {{network|red}} es un conjunto de {{device|dispositivos}} conectados entre sí. Cada dispositivo de la red tiene su {{ip-address|dirección IP}}. En {{ipv4}} son cuatro números y cada uno va de 0 a 255.',
});
