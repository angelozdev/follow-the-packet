import { defineIncident } from '@/levels/contract/incident';
import { APP_TAKES_ORDERS, MESSAGE, NAME, ORDER_BODY, ORDER_URL, ORIGIN, PAGE_PIECES, PORT, TASK, bodyTask, sendMoveFrom } from '@/levels/03-the-web-inside/shared';

export default defineIncident({
  id: '03-02',
  chapter: 3,
  order: 2,
  title: 'Pedir y contestar',
  role: 'defender',
  mechanic: 'send',
  introduces: ['http-request', 'http-response', 'http-method', 'idempotent'],
  changes: [APP_TAKES_ORDERS],
  shown: PAGE_PIECES,
  report: `Lucía siguió con su app de pedidos: ahora el programa del {{port|puerto}} ${PORT.app} de ${NAME.lucia} también crea pedidos y los cambia. Cada vez que usas {{curl}} haces una {{http-request|petición HTTP}}, y la app contesta con una {{http-response|respuesta HTTP}}. La petición trae un {{http-method|método HTTP}} que dice qué quiere hacer. Sin opciones, {{curl}} pide un GET: lee un pedido. Con -d pide un POST: crea uno. Con -X PUT -d pide un PUT: cambia uno. Lee el pedido 8. Después manda dos POST iguales y dos PUT iguales al pedido 7. En la caja lee cada petición y cada respuesta.`,
  tasks: [
    bodyTask(TASK.getEight, 'Que el GET devuelva el pedido 8.', ORDER_URL.eight.id, ORDER_BODY.eight),
    bodyTask(TASK.posts, 'Que dos POST iguales dejen el pedido 9 y el 10.', ORDER_URL.all.id, ORDER_BODY.ten, { messageId: MESSAGE.curlPost.id, nth: 2 }),
    bodyTask(TASK.puts, 'Que el segundo PUT deje el pedido 7 como lo dejó el primero.', ORDER_URL.seven.id, ORDER_BODY.replaced, { messageId: MESSAGE.curlPut.id, nth: 2 }),
  ],
  flows: [],
  send: { from: [ORIGIN.lucia], to: [ORDER_URL.seven, ORDER_URL.eight, ORDER_URL.all, ORDER_URL.nine], message: [MESSAGE.curl, MESSAGE.curlPost, MESSAGE.curlPut] },
  hints: ['Compara lo que dejó el segundo POST con lo que dejó el segundo PUT.', 'Una operación es {{idempotent|idempotente}} si repetirla deja el mismo efecto que hacerla una vez.'],
  question: 'Se cortó la red al mandar un POST. ¿Es seguro repetirlo?',
  explanation: [
    {
      text: 'Sí, porque la respuesta del servidor será la misma que la primera vez.',
      feedback: '{{idempotent|Idempotente}} habla del efecto en el servidor, no de la respuesta. Un segundo POST crea otro pedido, así que el efecto no es el mismo.',
      correct: false,
    },
    {
      text: 'Sí, porque {{http|HTTP}} evita los duplicados al repetir una petición.',
      feedback: `{{http|HTTP}} no evita nada: lleva lo que se le pide. Si repites el POST, la app de ${NAME.lucia} lo recibe otra vez y crea otro pedido.`,
      correct: false,
    },
    {
      text: 'No: un POST no es {{idempotent|idempotente}} y repetirlo puede crear otro pedido.',
      feedback: 'Un POST puede dejar un efecto nuevo cada vez que se manda: lo viste, el segundo POST creó el pedido 10. El segundo PUT, en cambio, dejó el pedido 7 como lo dejó el primero.',
      correct: true,
    },
  ],
  solution: [
    sendMoveFrom(ORIGIN.lucia, ORDER_URL.eight.id, MESSAGE.curl.id),
    sendMoveFrom(ORIGIN.lucia, ORDER_URL.all.id, MESSAGE.curlPost.id),
    sendMoveFrom(ORIGIN.lucia, ORDER_URL.all.id, MESSAGE.curlPost.id),
    sendMoveFrom(ORIGIN.lucia, ORDER_URL.seven.id, MESSAGE.curlPut.id),
    sendMoveFrom(ORIGIN.lucia, ORDER_URL.seven.id, MESSAGE.curlPut.id),
  ],
  takeaway:
    'Una {{http-request|petición HTTP}} lleva un {{http-method|método HTTP}} y la {{http-response|respuesta HTTP}} contesta. GET, PUT y DELETE son {{idempotent|idempotentes}}: repetirlos deja el mismo efecto que hacerlos una vez. POST no lo es: el segundo POST creó otro pedido y el segundo PUT dejó el pedido 7 como lo dejó el primero. {{idempotent|Idempotente}} habla del efecto, no de la respuesta: un segundo DELETE puede contestar que el pedido ya no existe y dejar el servidor como lo dejó el primero. Tampoco quiere decir que no cambie nada: un PUT cambia el pedido y es idempotente. Por eso un {{client-server|cliente}} no debe repetir solo una petición que no es idempotente, como un POST.',
});
