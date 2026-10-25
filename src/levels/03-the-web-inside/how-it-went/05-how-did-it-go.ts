import { defineIncident } from '@/levels/contract/incident';
import { APP_CHECKS_THE_ID, LAN_PIECES, MESSAGE, NAME, ORIGIN, STATUS_URL, TASK, sendMoveFrom, statusTask } from '@/levels/03-the-web-inside/shared';

const STATUS_200 = 200;
const STATUS_404 = 404;
const STATUS_400 = 400;

export default defineIncident({
  id: '03-05',
  chapter: 3,
  order: 5,
  title: '¿Cómo salió?',
  role: 'defender',
  mechanic: 'send',
  introduces: ['status-code', 'status-200', 'client-error', 'status-404', 'status-400'],
  changes: [APP_CHECKS_THE_ID],
  shown: LAN_PIECES,
  report: `Lucía cambió la app de ${NAME.lucia}: ahora comprueba el id del pedido antes de buscarlo, y si el id no es un número, contesta con un error. Cada {{http-response|respuesta}} trae un {{status-code|código de estado}}, que dice cómo salió la petición. Con {{curl}} -i, pide desde ${NAME.you} el pedido 7, un path que no existe, un id mal escrito y un pedido que no existe, y lee en la caja el código de cada respuesta y quién lo generó.`,
  tasks: [
    statusTask(TASK.orderSevenIs200, 'Con {{curl}} -i, que el pedido 7 llegue con el código {{status-200}}.', STATUS_URL.served.id, STATUS_200),
    statusTask(TASK.wrongPathIs404, 'Con {{curl}} -i, que un path que no existe reciba el código {{status-404}}.', STATUS_URL.wrongPath.id, STATUS_404),
    statusTask(TASK.misspelledIdIs400, 'Con {{curl}} -i, que un id mal escrito reciba el código {{status-400}}.', STATUS_URL.misspelledId.id, STATUS_400),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [STATUS_URL.served, STATUS_URL.wrongPath, STATUS_URL.misspelledId, STATUS_URL.missingOrder], message: [MESSAGE.curlInclude] },
  hints: ['La primera cifra de un {{status-code|código de estado}} da la clase.', 'Un 2 de primera cifra: la petición se cumplió. Un 4: la petición, tal como llegó, no se puede cumplir.'],
  question: '¿Qué dice la primera cifra de un {{status-404|404}}?',
  explanation: [
    {
      text: 'Que el servidor falló mientras intentaba cumplir la petición.',
      feedback: `El 4 no dice que el servidor falló. ${NAME.lucia} no falló: recibió la petición, no encontró nada en esa URL y contestó que no podía cumplirla tal como llegó. Que el servidor falló lo dice otra clase de códigos, que verás más adelante.`,
      correct: false,
    },
    {
      text: 'Que siempre es culpa del cliente que hizo la petición.',
      feedback:
        'Un {{client-error|error 4xx}} parece un error del cliente, pero no siempre lo es. La primera cifra dice que la petición, tal como llegó, no se puede cumplir; no dice de quién es la culpa. El {{status-404}} de esta app dice que no hay nada en esa URL: puede que la URL esté mal escrita, o que lo que había ya no esté.',
      correct: false,
    },
    {
      text: 'La clase: la petición, tal como llegó, no se puede cumplir.',
      feedback:
        'La primera cifra da la clase: el 2 dice que la petición se cumplió y el 4, que la petición, tal como llegó, no se puede cumplir. El pedido 7 llegó con {{status-200}}. El path que no existe, con {{status-404}}, y el id mal escrito, con {{status-400}}: los dos son {{client-error|errores 4xx}}, y cada uno tiene su causa.',
      correct: true,
    },
  ],
  solution: [
    sendMoveFrom(ORIGIN.you, STATUS_URL.served.id, MESSAGE.curlInclude.id),
    sendMoveFrom(ORIGIN.you, STATUS_URL.wrongPath.id, MESSAGE.curlInclude.id),
    sendMoveFrom(ORIGIN.you, STATUS_URL.misspelledId.id, MESSAGE.curlInclude.id),
  ],
  takeaway: `Cada {{http-response|respuesta}} trae un {{status-code|código de estado}}: tres cifras que dicen cómo salió la petición, y la primera da la clase. Con {{curl}} -i, el código se lee en la primera línea de la salida. {{status-200}}: el servidor dice que la petición se cumplió; no dice que al negocio le salió bien. Un {{client-error|error 4xx}}: la petición, tal como llegó, no se puede cumplir. Parece un error del cliente, pero no siempre lo es. {{status-404}}: no hay un recurso en esa URL, y por eso el path que no existe y el pedido 99 dieron 404. {{status-400}}: el servidor rechaza la petición porque trae datos que no acepta, y por eso el id «siete» dio 400 y no 404. Esa diferencia tiene una causa: Lucía cambió la app de ${NAME.lucia} para que compruebe el id. Sin esa comprobación, la app habría buscado un pedido «siete» y habría contestado 404. En la caja, «Quién lo generó» dice qué app generó cada código: aquí, la de ${NAME.lucia}.`,
});
