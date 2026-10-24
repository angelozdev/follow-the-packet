import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, APP_ANSWERS_HTTP, IP, MESSAGE, NAME, ORIGIN, PAGE_PIECES, PORT, TASK, URLS_BY_PARTS, ORDER_BODY, bodyTask, sendMoveFrom } from '@/levels/03-the-web-inside/shared';

export default defineIncident({
  id: '03-01',
  chapter: 3,
  order: 1,
  title: 'Una dirección para cada cosa',
  role: 'defender',
  mechanic: 'send',
  introduces: ['http', 'url', 'url-path', 'query-string', 'curl'],
  changes: [APP_ANSWERS_HTTP],
  shown: PAGE_PIECES,
  report: `Lucía terminó su app de pedidos: el programa del {{port|puerto}} ${PORT.app} de ${NAME.lucia} ahora contesta {{http|HTTP}}. Desde ${NAME.lucia}, usa {{curl}} para pedirle el pedido 7 y el pedido 8. Armas la {{url|URL}} por partes. En la caja lee qué dice cada parte y qué contestó la app.`,
  tasks: [
    bodyTask(TASK.orderSeven, 'Que el {{curl}} muestre el pedido 7.', ADDRESS.orderSeven.id, ORDER_BODY.seven),
    bodyTask(TASK.orderEight, 'Que el {{curl}} muestre el pedido 8.', ADDRESS.orderEight.id, ORDER_BODY.eight),
  ],
  flows: [],
  send: { from: [ORIGIN.lucia], to: URLS_BY_PARTS, message: [MESSAGE.curl] },
  hints: ['Una {{url|URL}} tiene partes: el esquema, el nombre, el {{port|puerto}}, el {{url-path|path}} y la {{query-string|query string}}.', 'Lo que va después del ? precisa lo que se pide.'],
  question: '¿Qué parte de la {{url|URL}} eligió el pedido 7?',
  explanation: [
    {
      text: 'El {{url-path|path}}, /pedidos.',
      feedback: 'El {{url-path|path}} dice qué recurso del servidor se pide: aquí, los pedidos. Es el mismo en los dos {{curl}}. Lo que cambia entre el pedido 7 y el 8 es otra parte de la {{url|URL}}.',
      correct: false,
    },
    {
      text: 'La {{query-string|query string}}, ?id=7.',
      feedback: 'La {{query-string|query string}} precisa lo que se pide dentro del recurso: id=7 es el pedido 7 e id=8 es el pedido 8. Es lo único que cambia entre los dos {{curl}}.',
      correct: true,
    },
    {
      text: `El {{port|puerto}}, ${PORT.app}.`,
      feedback: `El {{port|puerto}} elige qué {{service|servicio}} de ${NAME.lucia} contesta. En los dos {{curl}} es el ${PORT.app}: la app de pedidos.`,
      correct: false,
    },
  ],
  solution: [sendMoveFrom(ORIGIN.lucia, ADDRESS.orderSeven.id, MESSAGE.curl.id), sendMoveFrom(ORIGIN.lucia, ADDRESS.orderEight.id, MESSAGE.curl.id)],
  takeaway: `Una {{url|URL}} tiene partes: el esquema, el nombre, el {{port|puerto}}, el {{url-path|path}} y la {{query-string|query string}}. El puerto elige el {{service|servicio}}, el path elige el recurso y la query string precisa cuál. Si cambias el puerto al ${PORT.web}, nadie {{listen|escucha}} y la conexión se rechaza. Si cambias el path, la app contesta, pero no encuentra nada. Lo que va después de # en una URL no llega al servidor. El mensaje {{http|HTTP}} no es un {{packet|paquete}}: viaja dentro de la {{connection|conexión}} {{tcp|TCP}} que abrió el {{handshake|saludo de tres pasos}}. {{localhost}} es ${IP.loopback}, la propia ${NAME.lucia}. El juego no modela IPv6, y un {{curl}} real puede probar primero ::1. La salida del {{curl}} es la de la versión 8.21.0 de Amazon Linux 2023, leída de su código fuente: no se probó en una máquina. Tampoco se verificó si esa imagen trae curl o curl-minimal, ni lo que cambian los parches de Amazon. En un Mac, los errores se ven distintos.`,
});
