import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, LESSON, LOOP, LOOP_CAUSE, LOOP_PIECES, NAME, ORIGIN, PING_WITH_TTL, ROUTER, TASK, sendMove, sendTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-09',
  chapter: 1,
  order: 9,
  title: 'Contar saltos',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['hop', 'ttl', 'time-exceeded'],
  changes: LOOP,
  shown: LOOP_PIECES,
  report: `${LOOP_CAUSE} Los {{ping|pings}} al servidor ya no llegan. Todo {{packet|paquete}} lleva en su {{header|encabezado}} un número, el {{ttl}}. Cada {{router}} le resta 1. Si llega a 0, el router descarta el paquete y avisa a quien lo envió con {{time-exceeded}}. Cada router que cruza el paquete es un {{hop|salto}}. Envía {{ping|pings}} al servidor con distinto {{ttl}} y mira qué router avisa.`,
  tasks: [
    sendTask(TASK.ttl3, `Que un {{ping}} con {{ttl}} 3 al servidor reciba {{time-exceeded}} de ${NAME.router}.`, PING_WITH_TTL[3].id, ADDRESS.server.id, 'ttl-exceeded', ROUTER.office.id),
    sendTask(TASK.ttl64, 'Que un {{ping}} con {{ttl}} 64 al servidor también reciba {{time-exceeded}}.', PING_WITH_TTL[64].id, ADDRESS.server.id, 'ttl-exceeded'),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.server], message: Object.values(PING_WITH_TTL) },
  hints: [
    'Aquí cada {{router}} le resta 1 al {{ttl}}, y el router que lo deja en 0 es el que avisa.',
    'Envía un {{ping}} con {{ttl}} 1 y otro con {{ttl}} 2, y mira en la caja de cada uno qué router avisó.',
  ],
  question: '¿Por qué el {{ping}} con {{ttl}} 64 no llegó al servidor?',
  explanation: [
    {
      text: 'Porque el {{packet|paquete}} daba vueltas entre los mismos dos {{router|routers}}: el {{ttl}} bajaba en cada {{hop|salto}} hasta llegar a 0.',
      feedback: `Eso es. ${NAME.router} le pasa el {{packet|paquete}} a ${NAME.provider}, porque por ahí se sale de la oficina. ${NAME.provider} sigue su configuración nueva y se lo devuelve. Ningún {{router}} falla: lo que está mal es esa configuración. Cada {{router}} decide solo mirando la {{destination-ip|IP de destino}} y no recuerda si el {{packet|paquete}} ya pasó por él. Por eso el {{packet|paquete}} va y viene hasta que el {{ttl}} llega a 0: entonces un {{router}} lo descarta y avisa con {{time-exceeded}}. Con {{ttl}} 3 avisó ${NAME.router}, el primer {{router}} del camino: el {{packet|paquete}} había vuelto a pasar por él.`,
      correct: true,
    },
    {
      text: 'Porque el servidor lo descartó.',
      feedback: 'No. El {{packet|paquete}} no llegó al servidor: un {{router}} lo descartó antes y avisó con {{time-exceeded}}. El aviso viene de un router, no del servidor.',
      correct: false,
    },
    {
      text: 'Porque 64 es un {{ttl}} demasiado alto para {{internet}}.',
      feedback: 'No. 64 alcanza para cruzar muchísimos {{router|routers}}, y aquí el camino tiene muy pocos. El {{ttl}} se gastó porque el {{packet|paquete}} daba vueltas.',
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.server.id, PING_WITH_TTL[3].id), sendMove(ADDRESS.server.id, PING_WITH_TTL[64].id)],
  takeaway:
    'El {{ttl}} baja en cada {{hop|salto}}. Cuando llega a 0, el {{router}} descarta el {{packet|paquete}} y avisa con {{time-exceeded}}: así un paquete que da vueltas no viaja para siempre. Da vueltas cuando dos {{router|routers}} quedan configurados de modo que cada uno se lo manda al otro.',
});
