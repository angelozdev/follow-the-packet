import { defineIncident } from '@/levels/contract/incident';
import { APPS_AS_PROCESSES, DEVICE, LAN_PIECES, LUCIA_RULES, LUCIA_URL, MESSAGE, NAME, OPEN_APP_TO_FLOOR, ORDER_BODY, ORIGIN, PORT, REPORTS_CLOSED, REPORTS_PORT, TASK, bodyTask, sendMoveFrom, sendTaskFrom } from '@/levels/03-the-web-inside/shared';

export default defineIncident({
  id: '03-03',
  chapter: 3,
  order: 3,
  title: 'Quién contesta',
  role: 'defender',
  mechanic: 'send',
  introduces: ['process', 'web-server', 'browser'],
  changes: [APPS_AS_PROCESSES, REPORTS_CLOSED],
  shown: LAN_PIECES,
  report: `${NAME.lucia} corre ahora dos programas, dos {{process|procesos}}: su app de pedidos en el {{port|puerto}} ${PORT.app} y su app de reportes en el ${REPORTS_PORT}. Lucía cerró la terminal donde corría su app de reportes, así que ese {{process|proceso}} terminó. Desde ${NAME.you}, pide la página de pedidos con el {{browser|navegador}} y con {{curl}}. Con --connect-timeout 3, {{curl}} se rinde si en 3 segundos no logra conectar. Desde ${NAME.lucia}, pídele con {{curl}} a la app de reportes: como el {{packet|paquete}} va a su propia {{ip-address|IP}}, no cruza su {{firewall}}. En el {{firewall}} de ${NAME.lucia} puedes agregar una {{rule|regla}}. En la caja lee quién contestó, quién rechazó y quién no dijo nada.`,
  tasks: [
    bodyTask(TASK.page, 'Que el {{browser|navegador}} reciba la página de la app de pedidos.', LUCIA_URL.orders.id, ORDER_BODY.seven, { origin: ORIGIN.you, messageId: MESSAGE.browser.id }),
    sendTaskFrom(ORIGIN.lucia, TASK.reportsRefused, `Que el {{curl}} a la app de reportes lo rechace ${NAME.lucia}.`, MESSAGE.curl.id, LUCIA_URL.reports.id, 'refused', DEVICE.lucia.id),
  ],
  flows: [],
  send: {
    from: [ORIGIN.you, ORIGIN.lucia],
    to: [LUCIA_URL.orders, LUCIA_URL.reports],
    message: [MESSAGE.browser, MESSAGE.curlTimeout, MESSAGE.curl],
    rules: LUCIA_RULES,
  },
  hints: ['Un rechazo lo manda el {{device|dispositivo}}; el silencio es que nadie contesta.', 'Una {{http-response|respuesta HTTP}} la manda un {{web-server|servidor web}}, y aquí no había ninguno.'],
  question: 'Con la app de reportes cerrada, ¿por qué {{curl}} no recibió ninguna {{http-response|respuesta HTTP}}?',
  explanation: [
    {
      text: `No había ningún {{process|proceso}} escuchando en el {{port|puerto}} ${REPORTS_PORT}, y {{tcp|TCP}} rechazó la {{connection|conexión}} antes de que hubiera {{http|HTTP}}.`,
      feedback: `${NAME.lucia} cerró la app de reportes: el {{process|proceso}} terminó y su {{service|servicio}} dejó de {{listen|escuchar}}. Cuando llegó el intento de conexión al puerto ${REPORTS_PORT}, ${NAME.lucia} contestó con un {{rst|RST}}, y {{curl}} lo mostró como un rechazo. Una {{http-response|respuesta HTTP}} nunca existió: no llegó a haber conexión.`,
      correct: true,
    },
    {
      text: `Porque el {{firewall}} de ${NAME.lucia} descartó el {{packet|paquete}}, y {{curl}} se quedó esperando una respuesta que nunca llegó.`,
      feedback: 'Un {{firewall}} que descarta no contesta nada: quien envía solo espera. Aquí alguien sí contestó, y {{curl}} mostró un rechazo, que no es lo mismo que el silencio.',
      correct: false,
    },
    {
      text: 'Porque el {{web-server|servidor web}} de la app de reportes devolvió un error {{http|HTTP}}, y {{curl}} lo mostró en la terminal.',
      feedback: `En el puerto ${REPORTS_PORT} ningún {{web-server|servidor web}} contestaba: el {{process|proceso}} de la app de reportes había terminado. Sin servidor web no hay {{http-response|respuesta HTTP}} de ningún tipo.`,
      correct: false,
    },
  ],
  solution: [OPEN_APP_TO_FLOOR, sendMoveFrom(ORIGIN.you, LUCIA_URL.orders.id, MESSAGE.browser.id), sendMoveFrom(ORIGIN.lucia, LUCIA_URL.reports.id, MESSAGE.curl.id)],
  takeaway: `Un {{process|proceso}} es un programa mientras corre. Un {{service|servicio}} escucha desde su proceso: si el proceso termina, deja de {{listen|escuchar}}, y el {{port|puerto}} queda como un {{closed-port|puerto cerrado}}. Un proceso no es un puerto: uno puede escuchar en varios. Un {{web-server|servidor web}} es el servicio que contesta las peticiones {{http|HTTP}}, y el {{browser|navegador}} es el programa que las hace por una persona y muestra lo que contesta; el navegador del juego dice con palabras llanas lo que vio. Pasaron tres cosas distintas. Una respuesta: la página que dio la app de pedidos de ${NAME.lucia}. Un rechazo: ${NAME.lucia} contestó con un {{rst|RST}} a quien pedía la app de reportes, antes de que hubiera {{http|HTTP}}. Un silencio: el {{firewall}} de ${NAME.lucia} descartó la petición de ${NAME.you} y ${NAME.you} no recibió nada, hasta que agregaste la regla. Una {{rule|regla}} del firewall nombra {{tcp|TCP}} y un puerto, no «HTTP»: el puerto no decide el protocolo.`,
});
