import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, BASE_WORLD, CONCEPT, LESSON, MESSAGE, ORIGIN } from './shared';

export default defineIncident({
  id: '01-01',
  chapter: 1,
  order: 1,
  title: 'La dirección',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['device', 'network', 'ip-address', 'ipv4', 'packet', 'ping'],
  base: BASE_WORLD,
  report: 'Te doy la bienvenida. Primera tarea: haz {{ping}} a la impresora desde tu laptop. Un clic en tu laptop abre su terminal.',
  tasks: [
    {
      id: 'ping-printer',
      text: 'Que tu {{ping}} a la impresora vuelva con respuesta.',
      expect: { fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id, outcome: 'replied' },
    },
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.printer, ADDRESS.lucia, ADDRESS.nobody], message: [MESSAGE.ping] },
  hints: [
    'Tu laptop necesita la {{ip-address}} de la impresora. Pasa el mouse sobre la impresora para verla.',
    'La impresora tiene la {{ip-address|IP}} 192.168.1.20. Elígela en la terminal de tu laptop y pulsa «Enviar».',
  ],
  question: '¿Cómo supo la {{network|red}} a quién entregar tu {{packet|paquete}}?',
  explanation: [
    {
      text: 'Por la {{ip-address}} de destino que lleva el paquete.',
      feedback: 'Eso es. Cada {{packet|paquete}} lleva la IP de destino, y la red se lo entrega al {{device|dispositivo}} que tiene esa IP.',
      correct: true,
    },
    {
      text: 'Por el nombre del dispositivo.',
      feedback: 'No: el {{packet|paquete}} no lleva nombres. Lleva la {{ip-address}} de destino, y por ella lo encuentra la red.',
      correct: false,
    },
    {
      text: 'Lo mandó a todos y contestó el que quiso.',
      feedback: 'No: el {{packet|paquete}} llega solo al {{device|dispositivo}} que tiene la IP de destino. Por eso un {{ping}} a 192.168.1.30 no vuelve: nadie tiene esa IP.',
      correct: false,
    },
  ],
  solution: [{ type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.printer.id, messageId: MESSAGE.ping.id }],
  takeaway: 'Cada {{device|dispositivo}} de una {{network|red}} tiene su {{ip-address}}: en {{ipv4}}, cuatro números como 192.168.1.20. Un {{packet|paquete}} llega al que tiene la IP de destino.',
});
