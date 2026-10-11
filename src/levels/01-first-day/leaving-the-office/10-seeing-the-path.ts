import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, BROKEN_STRETCH, CONCEPT, LESSON, MESSAGE, NAME, ORIGIN, PATH_PIECES, TASK, pingTask, sendMove, sendTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-10',
  chapter: 1,
  order: 10,
  title: 'Ver el camino',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['traceroute'],
  changes: BROKEN_STRETCH,
  shown: PATH_PIECES,
  revealRoutersByTraceroute: true,
  report: 'Se rompió un tramo del camino al servidor. Un {{ping}} al servidor no vuelve, y tampoco aparece ningún aviso. Un {{traceroute}} lista los {{router|routers}} del camino que avisan. Haz un ping al servidor y después un traceroute.',
  tasks: [
    pingTask(TASK.serverSilence, 'Haz un {{ping}} al servidor y comprueba que no vuelve nada.', ADDRESS.server.id, 'timeout'),
    sendTask(TASK.traceroute, 'Corre un {{traceroute}} al servidor.', MESSAGE.traceroute.id, ADDRESS.server.id, 'any'),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.server], message: [MESSAGE.ping, MESSAGE.traceroute] },
  hints: [
    'Cada línea con una {{ip-address|IP}} es un {{router}} que avisó con {{time-exceeded}}.',
    'Un * es un {{hop|salto}} que no contestó a tiempo. Mira cuál fue el último {{router}} que sí contestó.',
  ],
  question: '¿Dónde está el tramo roto?',
  explanation: [
    {
      text: `En ${NAME.you}.`,
      feedback: `No. El primer {{hop|salto}} sí contestó: ${NAME.router} avisó. El {{packet|paquete}} salió de ${NAME.you}.`,
      correct: false,
    },
    {
      text: 'En el servidor.',
      feedback: `No. ${NAME.destination}, el {{router}} que está frente al servidor, no sale en ninguna línea del {{traceroute}}: desde el {{hop|salto}} 3 nadie contesta hasta el máximo de saltos. Lo más probable es que el {{packet|paquete}} ni llegue al servidor.`,
      correct: false,
    },
    {
      text: `En el tramo que sigue a ${NAME.provider}, el último {{router}} que contestó.`,
      feedback: `Eso es. El {{traceroute}} listó ${NAME.router} y ${NAME.provider}. Desde el {{hop|salto}} 3 nadie contesta hasta el máximo de saltos, y el {{ping}} tampoco vuelve. Por eso lo más probable es que el tramo roto esté después de ${NAME.provider}. Aquí fue así: alguien cambió la configuración de ${NAME.provider}, que ya no sabe a dónde mandar lo que va al servidor y tampoco avisa. Un router que no avisa no siempre es el corte: algunos reenvían el {{packet|paquete}} sin avisar.`,
      correct: true,
    },
  ],
  solution: [sendMove(ADDRESS.server.id, MESSAGE.ping.id), sendMove(ADDRESS.server.id, MESSAGE.traceroute.id)],
  takeaway:
    '{{traceroute}} lista los {{router|routers}} del camino que avisaron con {{time-exceeded}}, cada uno con su {{ip-address|IP}}. Si desde un router no contesta nadie hasta el máximo de {{hop|saltos}} y el {{ping}} tampoco vuelve, lo más probable es que el tramo roto esté después de él. Un solo * no lo prueba: algunos routers reenvían el {{packet|paquete}} sin avisar.',
});
