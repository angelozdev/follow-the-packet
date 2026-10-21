import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, MESSAGE, NAME, ORIGIN, PORT, QUOTED_TITLE, SERVICES_PIECES, TASK, sendMove, sendTask } from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-02',
  chapter: 2,
  order: 2,
  title: QUOTED_TITLE.openingAConnection,
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port'],
  changes: [],
  shown: SERVICES_PIECES,
  report: `{{nc}} no manda un solo {{packet|paquete}}: abre una {{connection|conexión}} {{tcp|TCP}} con el {{service|servicio}}. Quien la inicia es el {{client-server|cliente}}: aquí, ${NAME.you}. Quien espera y responde es el {{client-server|servidor}}: aquí, ${NAME.lucia}. Son roles de esta {{connection|conexión}}, no tipos de equipo. La {{connection|conexión}} empieza con un {{handshake|saludo de tres pasos}}. Cada {{packet|paquete}} que manda ${NAME.you} sale de un {{source-port|puerto de origen}}. Para cada {{connection|conexión}} nueva, ${NAME.you} elige uno: es un {{ephemeral-port|puerto efímero}}. Abre una {{connection|conexión}} al ${PORT.app} y otra al ${PORT.database}. Compara sus {{header|encabezados}}.`,
  tasks: [
    sendTask(TASK.openApp, `Abre una {{connection|conexión}} {{tcp|TCP}} con la app de ${NAME.lucia}, en {{ip-port|${IP.lucia}:${PORT.app}}}.`, MESSAGE.ncApp.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
    sendTask(TASK.openDatabase, `Abre otra {{connection|conexión}} con su base de datos, en {{ip-port|${IP.lucia}:${PORT.database}}}.`, MESSAGE.ncDatabase.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.lucia], message: [MESSAGE.ncApp, MESSAGE.ncDatabase] },
  hints: [
    `Compara el {{header|encabezado}} de ida con el de vuelta: mira qué pasa con los {{port|puertos}}.`,
    `Compara el {{source-port|puerto de origen}} de los dos {{nc}}: no es el mismo.`,
  ],
  question: `¿A qué {{port|puerto}} vuelve la respuesta de ${NAME.lucia}?`,
  explanation: [
    {
      text: `Al {{source-port|puerto de origen}} que eligió ${NAME.you} al abrir la {{connection|conexión}}, el {{ephemeral-port|puerto efímero}}.`,
      feedback: `En el {{header|encabezado}} de vuelta el origen y el destino cambian de lugar, también los {{port|puertos}}. La respuesta sale del {{port|puerto}} del {{service|servicio}} y llega al {{source-port|puerto de origen}} de ${NAME.you}.`,
      correct: true,
    },
    {
      text: `Al {{destination-port|puerto de destino}} de la ida, el ${PORT.app} donde {{listen|escucha}} la app de ${NAME.lucia}.`,
      feedback: `El ${PORT.app} es el {{destination-port|puerto de destino}} de la ida. La respuesta sale de ese {{port|puerto}} y llega al {{source-port|puerto de origen}} de ${NAME.you}.`,
      correct: false,
    },
    {
      text: `A un {{ephemeral-port|puerto efímero}} que ${NAME.lucia} elige al contestar, distinto del de ${NAME.you}.`,
      feedback: `${NAME.lucia} no elige a dónde contesta. El {{ephemeral-port|puerto efímero}} lo elige el {{client-server|cliente}}, aquí ${NAME.you}, y la respuesta va al {{source-port|puerto de origen}} que puso en el {{packet|paquete}}.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.lucia.id, MESSAGE.ncApp.id), sendMove(ADDRESS.lucia.id, MESSAGE.ncDatabase.id)],
  takeaway:
    'Una {{connection|conexión}} {{tcp|TCP}} empieza con un {{handshake|saludo de tres pasos}}. El {{client-server|cliente}} sale de un {{ephemeral-port|puerto efímero}} y la respuesta vuelve a ese {{source-port|puerto de origen}}. Los {{source-port|puertos de origen}} que viste son números del juego: cada sistema elige los suyos.',
});
