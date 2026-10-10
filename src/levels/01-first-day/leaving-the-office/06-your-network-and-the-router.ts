import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, LESSON, MESSAGE, NAME, OFFICE_PIECES, ORIGIN, TWO_FLOORS, TASK, pingTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-06',
  chapter: 1,
  order: 6,
  title: 'Tu red y el router',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['lan', 'router'],
  changes: TWO_FLOORS,
  shown: OFFICE_PIECES,
  report: `La oficina ahora tiene dos pisos, y cada piso es una {{lan|red local}}. Aquí la red es 192.168.1.x: son las {{ip-address|IP}} que empiezan con 192.168.1. En el otro piso es 192.168.2.x. Un {{router}}, ${NAME.router}, conecta las dos redes. Haz un {{ping}} a la ${NAME.printer} y otro a ${NAME.andres}, y mira por dónde pasó cada uno.`,
  tasks: [
    pingTask(TASK.ping, `Que vuelva tu {{ping}} a la ${NAME.printer}.`, ADDRESS.printer.id, 'replied', DEVICE.printer.id),
    pingTask(TASK.andres, `Que vuelva tu {{ping}} a ${NAME.andres}.`, ADDRESS.andres.id, 'replied', DEVICE.andres.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.andres, ADDRESS.lucia], message: [MESSAGE.ping] },
  hints: [
    'Mira qué {{ip-address|IP}} empiezan con 192.168.1, como la tuya: son de tu {{lan|red local}}. La que empieza con 192.168.2 es de otra.',
    'Lo que va a otra {{lan|red local}} pasa por el {{router}}. Abre la caja de cada {{ping}} y mira si dice por dónde pasó.',
  ],
  question: `¿Por qué el {{ping}} a ${NAME.andres} pasó por el {{router}} y el de la ${NAME.printer} no?`,
  explanation: [
    {
      text: 'Porque el {{router}} es más rápido que el cable.',
      feedback: `No. Un router no sirve para ir más rápido: sirve para conectar redes. ${NAME.andres} está en otra {{lan|red local}}, y a otra red local solo se llega por el router.`,
      correct: false,
    },
    {
      text: 'Porque todo {{packet|paquete}} pasa por el {{router}}, también los que van dentro del piso.',
      feedback: `No. El {{ping}} a la ${NAME.printer} no pasó por el router: se entregó directo, dentro de tu {{lan|red local}}, y por eso su caja no dice por dónde pasó.`,
      correct: false,
    },
    {
      text: `Porque ${NAME.andres} está en otra {{lan|red local}}, y lo que sale de tu red local pasa por el {{router}}.`,
      feedback: `Eso es. La ${NAME.printer} está en tu red local y el {{packet|paquete}} le llega directo. ${NAME.andres} está en otra, así que el paquete pasa por el router, que lo lleva a esa red.`,
      correct: true,
    },
  ],
  solution: [
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id },
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.andres.id, messageId: MESSAGE.ping.id },
  ],
  takeaway: 'Un {{router}} conecta {{lan|redes locales}}. Lo que va a un {{device|dispositivo}} de tu misma red local se entrega directo; lo que va a otra red local pasa por el router.',
});
