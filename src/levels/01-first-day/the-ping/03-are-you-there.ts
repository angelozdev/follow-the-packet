import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, MESSAGE, NAME, ORIGIN, TASK, pingTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-03',
  chapter: 1,
  order: 3,
  title: '¿Estás ahí?',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['protocol', 'icmp', 'ping', 'echo-request', 'echo-reply'],
  changes: [],
  report: `Haz un {{ping}} a la ${NAME.printer}: un clic en ${NAME.you} abre su terminal. El {{ping}} manda un mensaje y espera otro de vuelta: el que va es un {{echo-request}} y el que vuelve, un {{echo-reply}}. Son mensajes de {{icmp}}, un {{protocol|protocolo}}. Mira el {{header|encabezado}} de cada uno en la caja.`,
  tasks: [pingTask(TASK.ping, `Que tu {{ping}} a la ${NAME.printer} vuelva con su {{echo-reply}}.`, ADDRESS.printer.id, 'replied', DEVICE.printer.id)],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.lucia], message: [MESSAGE.ping] },
  hints: [
    'Un mensaje pide y el otro contesta. Compara sus {{header|encabezados}} en la caja de inspección: ¿qué {{source-ip|IP de origen}} y qué {{destination-ip|IP de destino}} lleva cada uno?',
    `La {{ip-address|IP}} de la ${NAME.printer} es ${IP.printer}. La ${IP.lucia} es la de ${NAME.lucia}: contesta, pero no es lo que pide la tarea.`,
  ],
  question: `El {{echo-reply}} que volvió a ${NAME.you}, ¿qué {{source-ip|IP de origen}} y qué {{destination-ip|IP de destino}} lleva?`,
  explanation: [
    {
      text: `La {{source-ip|IP de origen}} es la de la ${NAME.printer} y la {{destination-ip|IP de destino}} es la de ${NAME.you}.`,
      feedback: 'El {{echo-reply}} vuelve a quien preguntó, así que lleva invertidos el origen y el destino del {{echo-request}}.',
      correct: true,
    },
    {
      text: `La {{source-ip|IP de origen}} es la de ${NAME.you} y la {{destination-ip|IP de destino}} es la de la ${NAME.printer}, como en la ida.`,
      feedback: `Con esas IP el mensaje saldría otra vez de ${NAME.you} hacia la ${NAME.printer} y no volvería a ti. Compara los dos {{header|encabezados}} en la caja: están invertidos.`,
      correct: false,
    },
    {
      text: 'Solo lleva la {{destination-ip|IP de destino}}, porque la de origen no hace falta en una respuesta.',
      feedback: 'Todo {{header|encabezado}} lleva las dos: la {{source-ip|IP de origen}} y la {{destination-ip|IP de destino}}. El del {{echo-reply}} también; míralo en la caja.',
      correct: false,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id }],
  takeaway: 'Un {{ping}} manda un {{echo-request}} y espera un {{echo-reply}}: dos mensajes de {{icmp}}. La respuesta vuelve a quien preguntó, así que lleva invertidos el origen y el destino de la ida.',
});
