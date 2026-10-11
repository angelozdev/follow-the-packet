import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, MESSAGE, NAME, ORIGIN, TASK, pingTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-04',
  chapter: 1,
  order: 4,
  title: 'Ping a ti mismo',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['loopback', 'localhost', 'rtt'],
  changes: [],
  report: `Haz un ping a la {{ip-address|IP}} de {{loopback}} ${IP.loopback}, otro a {{localhost}} y otro a la ${NAME.printer}. En la caja, «Tiempo de ida y vuelta» dice cuánto tarda (cifra de ejemplo): es el {{rtt}}.`,
  tasks: [
    pingTask(TASK.loopback, `Que tu {{ping}} a ${IP.loopback} vuelva.`, ADDRESS.loopback.id, 'replied', DEVICE.you.id),
    pingTask(TASK.ping, `Que tu {{ping}} a la ${NAME.printer} vuelva.`, ADDRESS.printer.id, 'replied', DEVICE.printer.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.localhost, ADDRESS.loopback, ADDRESS.printer], message: [MESSAGE.ping] },
  hints: [
    `Manda un {{ping}} a ${IP.loopback} y otro a la ${NAME.printer}, y compara el {{rtt}} de los dos en su caja de inspección.`,
    `${IP.loopback} siempre es tu propio {{device|dispositivo}}: es una {{ip-address|IP}} de {{loopback}}, y {{localhost}} es su nombre.`,
  ],
  question: `¿Por qué el {{ping}} a ${IP.loopback} tarda casi nada?`,
  explanation: [
    {
      text: `Porque ${IP.loopback} es la {{ip-address|IP}} más rápida de toda la {{network|red}} de la oficina.`,
      feedback: `Ningún número de IP da velocidad. Tarda casi nada porque el {{packet|paquete}} no sale de ${NAME.you}, no por su número.`,
      correct: false,
    },
    {
      text: 'Porque con una IP de {{loopback}} no hace falta que vuelva un {{echo-reply}}.',
      feedback: `Sí vuelve: ${NAME.you} recibe el {{echo-request}} y contesta con un {{echo-reply}}, como viste en la caja. Lo que cambia es el recorrido, que es el más corto.`,
      correct: false,
    },
    {
      text: `Porque el {{packet|paquete}} no sale de ${NAME.you}: ${IP.loopback} siempre es tu propio {{device|dispositivo}}.`,
      feedback: `El paquete va y vuelve dentro de ${NAME.you}, sin salir a la {{network|red}}. Por eso su {{rtt}} es el más bajo.`,
      correct: true,
    },
  ],
  solution: [
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.loopback.id, messageId: MESSAGE.ping.id },
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id },
  ],
  takeaway: `Una {{ip-address|IP}} de {{loopback}}, como ${IP.loopback}, y el nombre {{localhost}} son siempre tu propio {{device|dispositivo}}: el {{packet|paquete}} no sale de él y su {{rtt}} es casi nada.`,
});
