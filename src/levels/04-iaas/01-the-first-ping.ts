import { defineIncident } from '@/levels/incident';
import { BASE_WORLD, CONCEPT, FLOWS, FROM, LESSON, PING_TASK_FLOWS, SG, WHAT } from './shared';

export default defineIncident({
  id: '04-01',
  chapter: 4,
  order: 1,
  title: 'El primer ping',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['ec2-instance', 'vpc', 'private-ip', 'ping', 'security-group', 'inbound-rule', 'icmp', 'echo-request', 'anywhere-ipv4'],
  base: BASE_WORLD,
  report: 'servidor1 no logra hacer {{ping}} a servidor2. ¿Lo revisas?',
  tasks: [{ id: 'ping', text: 'Que servidor1 pueda hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.ping], from: [FROM.servidor1, FROM.internet] },
  hints: [
    'Mira el {{security-group}} de servidor2: ¿qué deja pasar hoy?',
    'En el {{security-group}} de servidor2, agrega una {{inbound-rule}}: {{icmp}} · {{echo-request}}, desde {{security-group|SG}} servidor1.',
  ],
  explanation: [
    {
      text: 'servidor2 estaba apagado.',
      feedback: 'No: servidor2 estaba encendido. El {{ping}} se quedaba en su {{security-group}}, antes de llegar.',
      correct: false,
    },
    {
      text: 'El {{security-group}} de servidor2 solo deja pasar lo que una {{inbound-rule}} permite, y no había ninguna para el {{ping}} de servidor1.',
      feedback: 'Eso es. Sin una {{inbound-rule}} que lo permita, el {{security-group}} no deja pasar nada.',
      correct: true,
    },
    {
      text: 'Faltaba una {{inbound-rule|regla}} que prohibiera al atacante.',
      feedback: 'Un {{security-group}} no tiene reglas para prohibir: lo que ninguna {{inbound-rule}} permite ya queda fuera.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.ping.id, fromId: FROM.servidor1.id }],
  takeaway: 'El {{security-group}} de una {{ec2-instance}} solo deja pasar lo que una {{inbound-rule}} permite: Type + Source.',
});
