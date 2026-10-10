import { defineIncident } from '@/levels/incident';
import { CONCEPT, DEVICE, FROM, LESSON, LUCIA_FIREWALL, PING_LUCIA, WHAT } from './shared';

export default defineIncident({
  id: '01-04',
  chapter: 1,
  order: 4,
  title: 'El firewall',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['firewall', 'traffic', 'rule'],
  changes: [{ type: 'addFirewall', deviceId: DEVICE.lucia.id, firewall: LUCIA_FIREWALL }],
  report: 'Esta tarde, soporte activó un {{firewall}} en mi laptop. Hazme {{ping}} otra vez: ya no me llega.',
  tasks: [{ id: 'ping-lucia', text: 'Que tu {{ping}} a la laptop de Lucía vuelva con respuesta.', flowIds: [PING_LUCIA.id] }],
  flows: [PING_LUCIA],
  chips: { what: [WHAT.echoRequest, WHAT.echoReply], from: [FROM.you, FROM.printer] },
  hints: [
    'Mira el {{firewall}} de mi laptop: ¿qué {{traffic|tráfico}} deja entrar hoy?',
    'En el {{firewall}} de mi laptop, agrega una {{rule|regla}}: {{icmp}} · {{echo-request}}, desde tu laptop.',
  ],
  question: '¿Qué hizo el {{firewall}} con tu primer {{ping}}?',
  explanation: [
    {
      text: 'Lo dejó pasar, pero mi laptop no contestó.',
      feedback: 'No: el {{ping}} se quedó en el {{firewall}}, antes de llegar a mi laptop.',
      correct: false,
    },
    {
      text: 'Lo bloqueó: ninguna {{rule|regla}} dejaba pasar ese {{traffic|tráfico}}.',
      feedback: 'Eso es. Un {{firewall}} solo deja pasar lo que permite una de sus reglas, y no tenía ninguna.',
      correct: true,
    },
    {
      text: 'Bloqueó solo la respuesta.',
      feedback: 'No: lo que el {{firewall}} frenó fue la ida, el {{echo-request}}. Sin ida, no hay respuesta.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: LUCIA_FIREWALL.id, whatId: WHAT.echoRequest.id, fromId: FROM.you.id }],
  takeaway: 'Un {{firewall}} solo deja entrar el {{traffic|tráfico}} que permite una {{rule|regla}}: qué tráfico (Type) y de qué origen (Source).',
});
