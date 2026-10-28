import { nameTag } from '@/copy';
import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, MESSAGE, ORIGIN, TASK } from '@/levels/01-first-day/shared';

const NAME = { you: nameTag(DEVICE.you.name), marta: nameTag(DEVICE.marta.name), printer: nameTag(DEVICE.printer.name), visitor: nameTag(DEVICE.visitor.name) };

export default defineIncident({
  id: '01-02',
  chapter: 1,
  order: 2,
  title: 'El sobre',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['packet', 'header', 'source-ip', 'destination-ip'],
  changes: [{ type: 'connectDevice', deviceId: DEVICE.visitor.id }],
  report: `${NAME.visitor} ya está conectada. Ahora envía un {{packet|paquete}} desde ${NAME.you} a la ${NAME.printer}: elige ${NAME.you} y abre su pestaña «Terminal». Después pasa el mouse por el {{packet|paquete}} y mira su {{header|encabezado}}: lleva la {{source-ip|IP de origen}} y la {{destination-ip|IP de destino}}.`,
  tasks: [
    {
      id: TASK.packet,
      text: `Que tu {{packet|paquete}} llegue a la ${NAME.printer}.`,
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.packet.id, outcome: 'reached', by: DEVICE.printer.id },
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.marta], message: [MESSAGE.packet] },
  hints: [
    'Envía tu {{packet|paquete}} y pasa el mouse por él: su {{header|encabezado}} dice cuál es la {{destination-ip|IP de destino}}.',
    `La {{ip-address|IP}} de la ${NAME.printer} es ${IP.printer}. Elígela como destino en la terminal de ${NAME.you}.`,
  ],
  question: `¿Por qué un {{packet|paquete}} enviado a la ${IP.marta} llega a ${NAME.marta} y no a la ${NAME.printer}?`,
  explanation: [
    {
      text: 'Porque la red lo adivinó por el nombre del {{device|dispositivo}}.',
      feedback: 'El {{header|encabezado}} no lleva nombres, lleva IP. La red entrega el {{packet|paquete}} al dispositivo que tiene la {{destination-ip|IP de destino}}.',
      correct: false,
    },
    {
      text: `Porque su {{source-ip|IP de origen}} era la de ${NAME.marta}.`,
      feedback: `La IP de origen dice quién envía el paquete, y era la de ${NAME.you}. A quién se entrega lo dice la {{destination-ip|IP de destino}}.`,
      correct: false,
    },
    {
      text: `Porque su {{destination-ip|IP de destino}} era la de ${NAME.marta}.`,
      feedback: 'La red entrega el {{packet|paquete}} al {{device|dispositivo}} que tiene la IP de destino del {{header|encabezado}}, sea o no el que querías.',
      correct: true,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.packet.id }],
  takeaway: 'Un {{packet|paquete}} lleva un {{header|encabezado}} con la {{source-ip|IP de origen}} (quién lo envía) y la {{destination-ip|IP de destino}} (a quién va). La red lo entrega al {{device|dispositivo}} que tiene esa IP de destino.',
});
