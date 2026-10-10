import { defineIncident } from '@/levels/incident';
import { ADDRESS, CONCEPT, LESSON, MESSAGE, ORIGIN } from './shared';

export default defineIncident({
  id: '01-02',
  chapter: 1,
  order: 2,
  title: 'Ida y vuelta',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['protocol', 'request', 'response', 'icmp', 'echo-request', 'echo-reply'],
  changes: [],
  report: 'Ahora haz que mi laptop te conteste. Esta vez también eliges el mensaje: el {{ping}} usa dos mensajes de {{icmp}}.',
  tasks: [
    {
      id: 'echo-lucia',
      text: 'Que la laptop de Lucía conteste tu {{echo-request}}.',
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id, outcome: 'replied' },
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.lucia, ADDRESS.printer], message: [MESSAGE.echoRequest, MESSAGE.echoReply] },
  hints: [
    'En el {{ping}}, un mensaje es la {{request|solicitud}} y el otro, la {{response|respuesta}}. ¿Cuál de los dos pide que te contesten?',
    'Envía un {{echo-request}} a 192.168.1.11, la {{ip-address|IP}} de mi laptop.',
  ],
  question: 'Si me envías un {{echo-reply}}, ¿por qué no vuelve nada?',
  explanation: [
    {
      text: 'Mi laptop estaba apagada.',
      feedback: 'No: el sello ✓ muestra que tu {{echo-reply}} llegó a mi laptop. Llegó, y nadie lo contesta.',
      correct: false,
    },
    {
      text: '{{icmp}} solo funciona con impresoras.',
      feedback: 'No: {{icmp}} es un {{protocol|protocolo}} de todos los dispositivos de la red, también de mi laptop.',
      correct: false,
    },
    {
      text: 'Solo un {{echo-request}} pide respuesta: un {{echo-reply}} ya es la {{response|respuesta}}.',
      feedback: 'Eso es. En {{icmp}}, el {{echo-request}} es la {{request|solicitud}} y el {{echo-reply}}, la respuesta. Nadie contesta una respuesta.',
      correct: true,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId: MESSAGE.echoRequest.id }],
  takeaway: 'Un {{protocol|protocolo}} dice qué mensajes existen. En {{icmp}}, el {{echo-request}} pide una {{response|respuesta}} y el {{echo-reply}} es esa respuesta: el {{ping}} usa los dos.',
});
