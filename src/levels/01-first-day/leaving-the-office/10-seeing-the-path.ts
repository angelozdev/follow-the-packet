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
  report: 'Se rompió un tramo del camino al servidor. Un {{ping}} al servidor no vuelve, y tampoco aparece ningún aviso. Un {{traceroute}} te muestra por qué {{router|routers}} pasa el camino. Haz un ping al servidor y después un traceroute.',
  tasks: [
    pingTask(TASK.serverSilence, 'Haz un {{ping}} al servidor y comprueba que no vuelve nada.', ADDRESS.server.id, 'timeout'),
    sendTask(TASK.traceroute, 'Corre un {{traceroute}} al servidor.', MESSAGE.traceroute.id, ADDRESS.server.id, 'any'),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.server], message: [MESSAGE.ping, MESSAGE.traceroute] },
  hints: [
    'Cada línea del {{traceroute}} es un {{router}} que avisó con {{time-exceeded}}, con su {{ip-address|IP}}.',
    'Un * es un {{hop|salto}} que no contestó a tiempo. Fíjate en cuál es el primero.',
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
      feedback: 'No. El {{hop|salto}} 3 ya callaba y el servidor está más allá: el corte empieza antes de llegar a él.',
      correct: false,
    },
    {
      text: `En ${NAME.provider}, el último {{router}} que contestó, o justo después.`,
      feedback: `Eso es. El {{traceroute}} listó ${NAME.router} y ${NAME.provider}, y desde el {{hop|salto}} 3 solo hay *. El corte está en el último router que contestó o justo después.`,
      correct: true,
    },
  ],
  solution: [sendMove(ADDRESS.server.id, MESSAGE.ping.id), sendMove(ADDRESS.server.id, MESSAGE.traceroute.id)],
  takeaway:
    '{{traceroute}} lista los {{router|routers}} del camino: cada línea es la {{ip-address|IP}} de uno que avisó con {{time-exceeded}}. Si de pronto salen *, el corte está en el último router que contestó o justo después.',
});
