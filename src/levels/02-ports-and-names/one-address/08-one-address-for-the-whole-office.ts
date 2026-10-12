import { defineIncident } from '@/levels/contract/incident';
import {
  ADDRESS,
  CONCEPT,
  IP,
  LESSON,
  MESSAGE,
  NAME,
  ORIGIN,
  PORT,
  SERVER,
  TASK,
  TRANSLATION_PIECES,
  WEB_PORTS,
  sendMove,
  sendMoveFrom,
  sendTask,
  sendTaskFrom,
} from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-08',
  chapter: 2,
  order: 8,
  title: 'Una IP para toda la oficina',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['nat', 'napt', 'translation-table'],
  changes: [WEB_PORTS],
  shown: TRANSLATION_PIECES,
  report: `Ahora ${NAME.server} tiene dos {{service|servicios}} que {{listen|escuchan}}: uno en el {{port|puerto}} ${PORT.web} y otro en el ${PORT.secureWeb}. Haz un {{nc}} al {{port|puerto}} ${PORT.web} del servidor desde ${NAME.you} y otro desde ${NAME.lucia}. Los dos salen del mismo {{source-port|puerto de origen}}. {{internet}} no ve ninguna {{private-ip|IP privada}}. ${NAME.router} cambia la {{ip-address|IP}} de origen de todo lo que sale de la oficina hacia {{internet}}, y pone su {{public-ip|IP pública}}: ${IP.officeUplink}. Eso es {{nat}}. Lo hace desde que la oficina salió a {{internet}}: no es un cambio nuevo, solo que el mapa no lo mostraba. También cambia el {{source-port|puerto de origen}}: eso es {{napt|traducción de puertos}}. Cada traducción queda como una fila en su {{translation-table|tabla de traducciones}}. Para ver la tabla, abre ${NAME.router} y su pestaña «{{translation-table|Tabla de traducciones}}».`,
  tasks: [
    sendTask(TASK.webFromYou, `Que vuelva tu {{nc}} al {{port|puerto}} ${PORT.web} de ${NAME.server}.`, MESSAGE.ncWeb.id, ADDRESS.server.id, 'replied', SERVER.internet.id),
    sendTaskFrom(ORIGIN.lucia, TASK.webFromLucia, `Que vuelva el {{nc}} de ${NAME.lucia} al {{port|puerto}} ${PORT.web} de ${NAME.server}.`, MESSAGE.ncWeb.id, ADDRESS.server.id, 'replied', SERVER.internet.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you, ORIGIN.lucia], to: [ADDRESS.server], message: [MESSAGE.ping, MESSAGE.ncWeb] },
  hints: [
    'Compara los puertos públicos de las dos filas de la {{translation-table|tabla de traducciones}}.',
    'La respuesta llega al puerto público de su fila.',
  ],
  question: `Las dos laptops salieron con la misma {{public-ip|IP pública}}. ¿Cómo sabe ${NAME.router} a cuál devolver cada respuesta?`,
  explanation: [
    {
      text: 'Por el {{port|puerto}}: cada {{connection|conexión}} tiene su fila con su puerto público.',
      feedback: `Las dos salieron con la misma {{public-ip|IP pública}}, pero con {{port|puertos}} públicos distintos: 40001 y 40002. Cada respuesta llega a uno de esos {{port|puertos}}, y la fila de ese {{port|puerto}} dice a qué laptop va.`,
      correct: true,
    },
    {
      text: 'Por la {{ip-address|IP}} del servidor, que es distinta para cada laptop.',
      feedback: `Las dos laptops hablaron con el mismo servidor, ${IP.server}. Esa {{ip-address|IP}} es igual para las dos. Lo que las separa es el {{port|puerto}} público de cada fila.`,
      correct: false,
    },
    {
      text: 'Contesta a las dos laptops a la vez, y cada una se queda con la respuesta que le toca.',
      feedback: `${NAME.router} no copia la respuesta. Cada respuesta tiene un solo destino: la fila de su {{port|puerto}} público dice cuál.`,
      correct: false,
    },
  ],
  solution: [
    sendMove(ADDRESS.server.id, MESSAGE.ncWeb.id),
    sendMoveFrom(ORIGIN.lucia, ADDRESS.server.id, MESSAGE.ncWeb.id),
  ],
  takeaway: `Muchas {{private-ip|IPs privadas}} comparten una sola {{public-ip|IP pública}}: la de ${NAME.router}. {{nat}} cambia la {{ip-address|IP}} de origen de lo que sale de la oficina hacia {{internet}}, y la {{napt|traducción de puertos}} cambia también el {{source-port|puerto de origen}}. Cada traducción queda en una fila de la {{translation-table|tabla de traducciones}}, y por esa fila vuelve la respuesta. Las dos laptops salieron del mismo {{port|puerto}} y quedaron con dos {{port|puertos}} públicos distintos. Los números 40001 y 40002 son de este juego: otros {{nat}} eligen otros. En un {{nat}} real, las filas caducan; aquí no. Una {{public-ip|IP pública}} tiene un número limitado de {{port|puertos}}, y este juego no llega a ese límite. Un {{ping}} también sale con la {{ip-address|IP}} cambiada. {{icmp}} no usa {{port|puertos}}, así que en esta tabla no deja fila. Un {{nat}} real traduce además el identificador del {{echo-request}}, un número del mensaje, y el juego no lo muestra. El {{ping}} a ${NAME.server} de antes también salía traducido.`,
});
