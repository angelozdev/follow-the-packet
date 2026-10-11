import { defineIncident, ruleIdFor } from '@/levels/contract/incident';
import { CONCEPT, DAY_SHIFT_RULE, FLOWS, FROM, LESSON, PING_TASK_FLOWS, SG, WHAT } from './shared';

export default defineIncident({
  id: '04-02',
  chapter: 4,
  order: 2,
  title: 'Abre lo justo',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: [],
  changes: [
    { type: 'removeRule', firewallId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id) },
    { type: 'addRule', firewallId: SG.servidor2, rule: DAY_SHIFT_RULE },
  ],
  report: 'Alguien cambió el {{security-group}} de servidor2: quitó la {{inbound-rule}} que dejaba entrar el {{ping}} y puso otra, porque dice que «abrió la respuesta del {{ping}}». Ahora el {{ping}} de servidor1 vuelve a fallar.',
  tasks: [{ id: 'ping', text: 'Que servidor1 vuelva a hacer {{ping}} a servidor2.', flowIds: PING_TASK_FLOWS }],
  flows: [FLOWS.pingToServer2, FLOWS.attackerPing],
  chips: { what: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp], from: [FROM.sgServidor1, FROM.anywhere] },
  hints: [
    'Un {{ping}} tiene ida ({{echo-request}}) y vuelta ({{echo-reply}}). ¿Cuál de las dos entra a servidor2?',
    'En el {{security-group}} de servidor2: {{icmp}} · {{echo-request}} desde {{security-group|SG}} servidor1. Y quita la {{inbound-rule}} del turno de día.',
  ],
  explanation: [
    {
      text: 'Había que abrir la vuelta, porque es la que llega a servidor2.',
      feedback: 'Lo que llega a servidor2 es la ida, el {{echo-request}}. Por eso la {{inbound-rule}} del turno de día no arreglaba nada.',
      correct: false,
    },
    {
      text: 'Abrir All {{icmp}} desde {{anywhere-ipv4}} es suficiente y no tiene riesgo.',
      feedback: 'Funciona, pero también deja entrar al atacante. Abrir más de lo necesario siempre es un riesgo.',
      correct: false,
    },
    {
      text: 'Un {{ping}} tiene ida ({{echo-request}}) y vuelta ({{echo-reply}}). Para entrar a servidor2 solo hace falta permitir la ida, y solo desde {{security-group|SG}} servidor1.',
      feedback: 'Abrir solo lo que hace falta, y solo para quien lo necesita, se llama {{least-privilege}}.',
      correct: true,
    },
  ],
  solution: [
    { type: 'removeRule', firewallId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id },
    { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id },
  ],
  takeaway: 'Para recibir un {{ping}} basta con dejar entrar la ida ({{echo-request}}), y solo desde quien la necesita: eso es {{least-privilege}}.',
});
