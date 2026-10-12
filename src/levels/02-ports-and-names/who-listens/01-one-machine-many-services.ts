import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, IP, LESSON, LUCIA_SERVICES, MESSAGE, NAME, ORIGIN, PORT, SERVICES_PIECES, TASK, pingTask, sendMove, sendTask } from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-01',
  chapter: 2,
  order: 1,
  title: 'Un equipo, muchos servicios',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['service', 'port', 'listen', 'ip-port', 'destination-port', 'nc'],
  changes: [LUCIA_SERVICES],
  shown: SERVICES_PIECES,
  report: `Lucía puso a funcionar dos programas en ${NAME.lucia}: su app y una base de datos de pruebas. Cada uno es un {{service|servicio}}. Un {{service|servicio}} {{listen|escucha}} en un {{port|puerto}}: ahí espera los {{packet|paquetes}} de otros {{device|dispositivos}}. Un {{port|puerto}} es un número que, junto con la {{ip-address|IP}}, dice a cuál {{service|servicio}} va un {{packet|paquete}}. Haz un {{ping}} a ${NAME.lucia}. Después usa {{nc}} para probar cada {{port|puerto}}: la app usa el ${PORT.app} y la base de datos, el ${PORT.database}.`,
  tasks: [
    pingTask(TASK.ping, `Que vuelva tu {{ping}} a ${NAME.lucia}.`, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
    sendTask(TASK.app, `Que vuelva un {{nc}} a {{ip-port|${IP.lucia}:${PORT.app}}}: la app de ${NAME.lucia}.`, MESSAGE.ncApp.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
    sendTask(TASK.database, `Que vuelva un {{nc}} a {{ip-port|${IP.lucia}:${PORT.database}}}: su base de datos.`, MESSAGE.ncDatabase.id, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.lucia], message: [MESSAGE.ping, MESSAGE.ncApp, MESSAGE.ncDatabase] },
  hints: [
    `${NAME.lucia} tiene una sola {{ip-address|IP}}, pero puede tener varios {{service|servicios}}.`,
    `La {{ip-address|IP}} dice a cuál {{device|dispositivo}} llega el {{packet|paquete}}; el {{destination-port|puerto de destino}}, a cuál {{service|servicio}}. Prueba un {{nc}} al ${PORT.app}.`,
  ],
  question: `El {{ping}} a ${NAME.lucia} volvió. ¿Por qué eso no prueba que su app funciona?`,
  explanation: [
    {
      text: `Porque cada {{service|servicio}} tiene su propia {{ip-address|IP}}, y el {{ping}} solo prueba la de ${NAME.lucia}.`,
      feedback: `Aquí la app y la base de datos de ${NAME.lucia} comparten la misma {{ip-address|IP}}, ${IP.lucia}. Lo que las distingue es el {{port|puerto}}.`,
      correct: false,
    },
    {
      text: `Porque el {{ping}} llega al {{device|dispositivo}}, no al {{service|servicio}}: la app {{listen|escucha}} en un {{port|puerto}}.`,
      feedback: `El {{ping}} no usa {{port|puertos}} y solo muestra que ${NAME.lucia} contesta. La app y la base de datos son dos {{service|servicios}}, cada uno en su {{port|puerto}} (${PORT.app} y ${PORT.database}): para probar uno hay que probar su {{port|puerto}}.`,
      correct: true,
    },
    {
      text: `Porque el {{ping}} no llegó a ${NAME.lucia}, así que no se pudo probar el {{service|servicio}}.`,
      feedback: `Sí llegó: el {{ping}} volvió. Que el {{device|dispositivo}} conteste no dice si uno de sus {{service|servicios}} funciona.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.lucia.id, MESSAGE.ping.id), sendMove(ADDRESS.lucia.id, MESSAGE.ncApp.id), sendMove(ADDRESS.lucia.id, MESSAGE.ncDatabase.id)],
  takeaway:
    'Un {{ping}} prueba el {{device|dispositivo}}, no sus {{service|servicios}}: para probar uno, prueba su {{port|puerto}} con {{nc}}. En Amazon Linux 2023, {{nc}} se instala con sudo dnf install nmap-ncat. En macOS, {{nc}} es otro programa y su salida se ve distinta.',
});
