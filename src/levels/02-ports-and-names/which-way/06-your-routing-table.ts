import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, FLOORS_PIECES, IP, LESSON, MESSAGE, NAME, ORIGIN, TASK, pingTask, sendMove } from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-06',
  chapter: 2,
  order: 6,
  title: 'Tu tabla de rutas',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['route', 'routing-table', 'connected-route', 'default-route'],
  changes: [],
  shown: FLOORS_PIECES,
  report: `Un {{device|dispositivo}} decide por dónde sale un {{packet|paquete}} con su {{routing-table|tabla de rutas}}. Es una lista de {{route|rutas}}. Cada {{route|ruta}} dice a dónde mandar los {{packet|paquetes}} para un bloque de {{ip-address|IPs}}. Esas {{ip-address|IPs}} son las que la {{route|ruta}} cubre. Abre ${NAME.you} y su pestaña «{{routing-table|Tabla de rutas}}». Tiene dos filas. Una es la {{connected-route|ruta de red conectada}}: entrega directo las {{ip-address|IPs}} de tu {{lan|red local}}. La otra es la {{default-route|ruta por defecto}}. Su destino es 0.0.0.0/0, que en una {{route|ruta}} quiere decir lo que ninguna otra {{route|ruta}} cubre. Haz un {{ping}} a la ${NAME.printer} y otro a ${NAME.andres}. La tabla marca «en uso» la fila del último {{ping}}, y la caja del {{packet|paquete}} dice la «{{route|Ruta que usó}}».`,
  tasks: [
    pingTask(TASK.printerPing, `Que vuelva tu {{ping}} a la ${NAME.printer}.`, ADDRESS.printer.id, 'replied', DEVICE.printer.id),
    pingTask(TASK.andresPing, `Que vuelva tu {{ping}} a ${NAME.andres}.`, ADDRESS.andres.id, 'replied', DEVICE.andres.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.andres], message: [MESSAGE.ping] },
  hints: [
    'Mira qué fila de la {{routing-table|tabla de rutas}} cubre cada {{ip-address|IP}}.',
    `La fila 192.168.1.0/24 es el bloque de tu {{lan|red local}}. ${NAME.andres} está fuera de ese bloque.`,
  ],
  question: `¿Por qué el {{ping}} a ${NAME.andres} usó la {{default-route|ruta por defecto}}?`,
  explanation: [
    {
      text: `Porque ${NAME.andres} está más lejos que la ${NAME.printer}, y una {{route|ruta}} se elige según qué tan lejos queda el destino.`,
      feedback: `La distancia no elige la {{route|ruta}}. La {{routing-table|tabla de rutas}} compara la {{ip-address|IP}} de destino con el bloque de cada {{route|ruta}}.`,
      correct: false,
    },
    {
      text: 'Porque la {{default-route|ruta por defecto}} se mira primero, antes que las demás filas de la {{routing-table|tabla de rutas}}.',
      feedback: `El orden de las filas no elige la {{route|ruta}}. La {{default-route|ruta por defecto}} recibe solo lo que ninguna otra fila cubre.`,
      correct: false,
    },
    {
      text: `Porque ninguna otra fila cubre ${IP.andres}: la {{default-route|ruta por defecto}} recibe lo que nada más cubre.`,
      feedback: `La fila 192.168.1.0/24 solo cubre las {{ip-address|IPs}} de tu {{lan|red local}}, y ${IP.andres} es de otra. Por eso el {{ping}} salió por la {{default-route|ruta por defecto}}, hacia la {{default-gateway|puerta de enlace predeterminada}}: ${NAME.router}.`,
      correct: true,
    },
  ],
  solution: [sendMove(ADDRESS.printer.id, MESSAGE.ping.id), sendMove(ADDRESS.andres.id, MESSAGE.ping.id)],
  takeaway: `Un {{device|dispositivo}} decide con su {{routing-table|tabla de rutas}}. La {{connected-route|ruta de red conectada}} entrega directo las {{ip-address|IPs}} de tu {{lan|red local}}. La {{default-route|ruta por defecto}} de ${NAME.you} recibe lo que ninguna otra {{route|ruta}} cubre y lo manda a su {{default-gateway|puerta de enlace predeterminada}}. ${NAME.router} también tiene su {{routing-table|tabla de rutas}}: para ${NAME.andres} usó la {{connected-route|ruta de red conectada}} del piso 2. En una {{route|ruta}}, 0.0.0.0/0 quiere decir lo que ninguna otra {{route|ruta}} cubre. En una {{rule|regla}} de {{firewall}}, 0.0.0.0/0 quiere decir cualquier origen.`,
});
