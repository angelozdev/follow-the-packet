import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, MESSAGE, NAME, ORIGIN, PORT, SERVICES_PIECES, TASK, sendMove, sendTask } from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-02',
  chapter: 2,
  order: 2,
  title: 'Abrir una conexión',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port'],
  changes: [],
  shown: SERVICES_PIECES,
  report: `{{nc}} no manda un solo {{packet|paquete}}: abre una {{connection|conexión}} {{tcp|TCP}} con el {{service|servicio}}. Quien la inicia es el {{client-server|cliente}}: aquí, ${NAME.you}. Quien espera y responde es el {{client-server|servidor}}: aquí, ${NAME.lucia}. Son roles de esta {{connection|conexión}}, no tipos de equipo. La {{connection|conexión}} empieza con un {{handshake|saludo de tres pasos}}. El {{packet|paquete}} sale de un {{source-port|puerto de origen}}. ${NAME.you} lo elige para cada {{connection|conexión}} nueva: es un {{ephemeral-port|puerto efímero}}. Abre una {{connection|conexión}} al ${PORT.app} y otra al ${PORT.database}. Compara sus {{header|encabezados}}.`,
  tasks: [
    sendTask(TASK.openApp, `Abre una {{connection|conexión}} {{tcp|TCP}} con la app de ${NAME.lucia}, en {{ip-port|${IP.lucia}:${PORT.app}}}.`, MESSAGE.ncApp.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
    sendTask(TASK.openDatabase, `Abre otra {{connection|conexión}} con su base de datos, en {{ip-port|${IP.lucia}:${PORT.database}}}.`, MESSAGE.ncDatabase.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.lucia], message: [MESSAGE.ncApp, MESSAGE.ncDatabase] },
  hints: [
    `Compara el {{header|encabezado}} de ida con el de vuelta: mira qué pasa con los {{port|puertos}}.`,
    `Mira el {{source-port|puerto de origen}} del segundo {{nc}}: cambió.`,
  ],
  question: `¿A qué {{port|puerto}} vuelve la respuesta de ${NAME.lucia}?`,
  explanation: [
    {
      text: `Al {{source-port|puerto de origen}} que eligió ${NAME.you}, el {{ephemeral-port|puerto efímero}}.`,
      feedback: `En el {{header|encabezado}} de vuelta el origen y el destino cambian de lugar, también los {{port|puertos}}. La respuesta sale del {{port|puerto}} del {{service|servicio}} y llega al {{source-port|puerto de origen}} de ${NAME.you}.`,
      correct: true,
    },
    {
      text: `Al ${PORT.app}, el {{destination-port|puerto de destino}} del {{service|servicio}} de ${NAME.lucia}.`,
      feedback: `El ${PORT.app} es el {{destination-port|puerto de destino}} de la ida. La respuesta sale de ese {{port|puerto}} y llega al {{source-port|puerto de origen}} de ${NAME.you}.`,
      correct: false,
    },
    {
      text: `A un {{port|puerto}} nuevo que ${NAME.lucia} elige al contestar, distinto del de ${NAME.you}.`,
      feedback: `${NAME.lucia} no elige a dónde contesta. Responde al {{source-port|puerto de origen}} que ${NAME.you} puso en el {{packet|paquete}}.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.lucia.id, MESSAGE.ncApp.id), sendMove(ADDRESS.lucia.id, MESSAGE.ncDatabase.id)],
  takeaway:
    'Una {{connection|conexión}} {{tcp|TCP}} empieza con un {{handshake|saludo de tres pasos}}. El {{client-server|cliente}} sale de un {{ephemeral-port|puerto efímero}} y la respuesta vuelve a ese {{source-port|puerto de origen}}. Los números de aquí son del juego: cada sistema elige los suyos.',
});
