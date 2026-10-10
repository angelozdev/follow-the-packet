import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, HOME, LESSON, MESSAGE, ORIGIN, PING_TO_LUCIA } from './shared';

export default defineIncident({
  id: '01-03',
  chapter: 1,
  order: 3,
  title: 'Desde afuera',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['internet', 'router', 'private-ip'],
  changes: [{ type: 'addActor', actor: HOME }],
  report: 'Esta tarde trabajo desde casa. Mi casa está afuera, en {{internet}}, y la oficina sale a internet por su {{router}}. ¿Podré hacerle {{ping}} a tu laptop?',
  tasks: [
    {
      id: 'from-home',
      text: 'Experimento: desde la casa de Lucía, haz {{ping}} a tu laptop.',
      expect: { fromId: ORIGIN.home.id, toId: ADDRESS.you.id, messageId: MESSAGE.echoRequest.id, outcome: 'any' },
    },
    {
      id: 'to-lucia',
      text: 'Contraste: desde tu laptop, haz {{ping}} a la laptop de Lucía.',
      expect: PING_TO_LUCIA.expect,
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you, ORIGIN.home], to: [ADDRESS.you, ADDRESS.lucia, ADDRESS.printer], message: [MESSAGE.echoRequest, MESSAGE.echoReply] },
  hints: [
    'En la terminal de tu laptop, elige mi casa como origen: la terminal pasa a mi casa. ¿Hasta dónde llega el {{ping}}?',
    'Pasa el mouse sobre el sello del {{ping}} que salió de mi casa: dice dónde se perdió y por qué.',
  ],
  question: '¿Por qué no llegó el {{ping}} desde mi casa?',
  explanation: [
    {
      text: 'El {{router}} de la oficina lo bloqueó.',
      feedback: 'No: el {{ping}} se perdió en {{internet}}, antes de llegar al router.',
      correct: false,
    },
    {
      text: '192.168.1.10 es una {{private-ip}}: fuera de la oficina no significa nada, e {{internet}} no la entrega.',
      feedback: 'Eso es. Muchas redes usan las mismas IP privadas, así que internet no sabría a cuál de ellas llevarlo.',
      correct: true,
    },
    {
      text: 'Mi laptop no sabe hacer {{ping}} desde casa.',
      feedback: 'No: el {{ping}} salió de mi casa y se perdió en {{internet}}. Lo que falla es el destino: internet no entrega paquetes a una {{private-ip}}.',
      correct: false,
    },
  ],
  solution: [
    { type: 'sendPacket', fromId: ORIGIN.home.id, toId: ADDRESS.you.id, messageId: MESSAGE.echoRequest.id },
    PING_TO_LUCIA.send,
  ],
  takeaway: 'Una {{private-ip}} solo sirve dentro de su {{network|red}}: {{internet}} no entrega paquetes a una IP privada.',
});
