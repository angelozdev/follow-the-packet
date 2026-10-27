import { defineIncident } from '@/levels/contract/incident';
import { HOSTNAME, IP, MESSAGE, NAME, ORDER_PATH, ORIGIN, PORT, PROXY_PIECES, PROXY_URL, SERVER_IN_FRONT, TASK, sendMoveFrom, statusTask } from '@/levels/03-the-web-inside/shared';

const STATUS_200 = 200;

export default defineIncident({
  id: '03-07',
  chapter: 3,
  order: 7,
  title: 'Un servidor delante',
  role: 'defender',
  mechanic: 'send',
  introduces: ['reverse-proxy', 'origin-server', 'x-forwarded-for', 'status-429'],
  changes: SERVER_IN_FRONT,
  shown: PROXY_PIECES,
  report: `Lucía subió su app a ${NAME.app}, la dejó de correr en ${NAME.lucia} y puso ${NAME.freshServer} delante, como {{reverse-proxy|proxy inverso}}: recibe las peticiones y las reenvía a otro servidor por una segunda conexión. El servidor que genera la respuesta, aquí ${NAME.app}, es el {{origin-server|servidor de origen}}. ${NAME.freshServer} sigue dando la tienda en /, pero reenvía a ${NAME.app}, al puerto ${PORT.app}, los {{url-path|paths}} de la app, como ${ORDER_PATH} y /admin. ${NAME.app} cuenta las peticiones de cada {{ip-address|IP}}: acepta 10 por segundo y contesta {{status-429|429}} a la siguiente. Con {{curl}} -i, manda desde ${NAME.home} una ráfaga de 20 peticiones a ${PROXY_URL.url} y después una desde ${NAME.you}. En la caja, lee quién generó cada código. En la tarjeta de ${NAME.app}, cambia de dónde lee la app la IP del cliente: de la conexión o de la cabecera {{x-forwarded-for}}.`,
  tasks: [statusTask(TASK.ordersThroughTheProxyIs200, `Con {{curl}} -i, que ${ORDER_PATH}?id=7 de ${HOSTNAME.www} reciba el código {{status-200}}.`, PROXY_URL.id, STATUS_200)],
  flows: [],
  send: { from: [ORIGIN.you], to: [PROXY_URL], message: [MESSAGE.curlInclude] },
  hints: [`Fíjate de quién cree ${NAME.app} que viene cada petición.`, 'La cabecera {{x-forwarded-for}} trae la {{ip-address|IP}} del cliente.'],
  question: `Antes del cambio, ¿por qué ${NAME.you} recibía {{status-429|429}} si mandó una sola petición?`,
  explanation: [
    {
      text: `Porque ${NAME.freshServer}, el {{reverse-proxy|proxy inverso}}, limita las peticiones que reenvía a ${NAME.app}.`,
      feedback: `El {{status-429|429}} lo generó ${NAME.app}, no ${NAME.freshServer}. Aquí ${NAME.freshServer} no cuenta nada: reenvía la petición y pasa la respuesta tal cual. Quien cuenta las peticiones de cada {{ip-address|IP}} y pone el límite es ${NAME.app}, el {{origin-server|servidor de origen}}.`,
      correct: false,
    },
    {
      text: `Porque ${NAME.app} contaba juntas las peticiones, todas con la {{ip-address|IP}} de ${NAME.freshServer}.`,
      feedback: `${NAME.app} solo ve la {{ip-address|IP}} de la conexión, y esa conexión es la de ${NAME.freshServer}: todas las peticiones llegaban con la misma IP y se contaban juntas. La ráfaga de ${NAME.home} llenó el límite y la petición de ${NAME.you} recibió {{status-429|429}} con ella. Con la IP del cliente en {{x-forwarded-for}}, la cabecera que ${NAME.freshServer} agrega, ${NAME.app} cuenta cada IP aparte.`,
      correct: true,
    },
    {
      text: `Porque ${NAME.you} mandó más peticiones de las que ${NAME.app} acepta en un mismo segundo.`,
      feedback: `${NAME.you} mandó una sola petición. Las que llenaron el límite fueron las 20 de ${NAME.home}, y la de ${NAME.you} se contó con ellas porque ${NAME.app} las veía todas con la {{ip-address|IP}} de ${NAME.freshServer}.`,
      correct: false,
    },
  ],
  solution: [sendMoveFrom(ORIGIN.you, PROXY_URL.id, MESSAGE.curlInclude.id)],
  takeaway: `Un {{reverse-proxy|proxy inverso}} recibe la petición del cliente y la reenvía a otro servidor por una segunda conexión; el cliente solo ve al proxy. El servidor que genera la respuesta es el {{origin-server|servidor de origen}}. Aquí ${NAME.you} habla con ${NAME.freshServer}, y ${NAME.freshServer} habla con ${NAME.app}: es ${NAME.app} quien genera el código, y la caja lo dice en «Quién lo generó». Lucía subió su app a ${NAME.app}, la dejó de correr en ${NAME.lucia} y puso ${NAME.freshServer} delante; por eso ${NAME.freshServer} ya no contesta ${ORDER_PATH} ni /admin: los reenvía. En la práctica, muchas apps nuevas empiezan con la app en ${IP.loopback}:${PORT.app}, detrás del {{web-server|servidor web}}, en el mismo equipo; aquí está en su propio equipo para que se vean las dos conexiones. La conexión que llega a ${NAME.app} es la de ${NAME.freshServer}, así que ${NAME.app} veía todas las peticiones con la {{ip-address|IP}} de ${NAME.freshServer} y las contaba juntas: tras la ráfaga de ${NAME.home}, hasta la petición de ${NAME.you} recibió {{status-429|429}}. El 429 lo generó ${NAME.app} y ${NAME.freshServer} lo pasó tal cual: aquí ${NAME.freshServer} no limita, reenvía. {{x-forwarded-for}} es la cabecera con la IP del cliente que agrega el proxy: si ${NAME.app} la lee, cuenta cada IP aparte, ${NAME.home} sigue con 429 y ${NAME.you} recibe {{status-200}}. El cliente puede escribir su propia {{x-forwarded-for}}; por eso, en el juego, ${NAME.app} toma la última entrada, la que agregó su proxy, y un programa real puede leerla de otra manera. Un límite por IP también junta a quienes comparten una: todos los equipos de la oficina salen con ${IP.officeUplink}. El mapa no dibuja la pregunta de ${NAME.home} al {{dns|DNS}}: usa el mismo {{a-record|registro A}} que ${NAME.you}, y un cliente real pregunta al DNS de su proveedor.`,
});
