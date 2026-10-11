import { defineIncident } from '@/levels/contract/incident';
import { CONCEPT, FIREWALL, FLOW, FROM, GUARD_PIECES, LESSON, NAME, TASK, TO, WHAT, YOUR_FIREWALL } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-13',
  chapter: 1,
  order: 13,
  title: 'Entrar y salir',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['inbound', 'outbound'],
  changes: [YOUR_FIREWALL],
  shown: GUARD_PIECES,
  report: `Tu {{ping}} a ${NAME.lucia} no vuelve. Un {{firewall}} tiene {{rule|reglas}} para la {{inbound|entrada}} (el {{traffic|tráfico}} que llega al {{device|dispositivo}}) y para la {{outbound|salida}} (el que sale de él). Alguien configuró el {{firewall}} de ${NAME.you} con la {{outbound|salida}} cerrada. Abre ese {{firewall}} y haz que el {{ping}} vuelva.`,
  tasks: [{ id: TASK.leave, text: `Que tu {{ping}} a ${NAME.lucia} vuelva.`, flowIds: [FLOW.leave.id] }],
  flows: [FLOW.leave, FLOW.background],
  chips: { what: [WHAT.echoRequest], from: [FROM.lucia, FROM.printer], to: [TO.lucia, TO.printer] },
  hints: ['Mira dónde está el ✕ del {{ping}}.', `En el {{firewall}} de ${NAME.you}, agrega la {{rule|regla}} en la pestaña «salida».`],
  question: 'Si pones una {{rule|regla}} en la {{inbound|entrada}}, ¿por qué el {{ping}} sigue sin salir?',
  explanation: [
    {
      text: `Porque ${NAME.you} no tiene {{firewall}} y el {{ping}} se pierde en la {{network|red}}.`,
      feedback: `El ✕ está en ${NAME.you}: su {{firewall}} detuvo el {{ping}} al salir.`,
      correct: false,
    },
    {
      text: `Porque el {{ping}} llegó a ${NAME.lucia} y allí se bloqueó, por eso no volvió.`,
      feedback: `El {{ping}} nunca salió de ${NAME.you}: el ✕ no está en ${NAME.lucia}.`,
      correct: false,
    },
    {
      text: 'Porque las {{rule|reglas}} de la {{inbound|entrada}} controlan lo que llega, y las de la {{outbound|salida}}, lo que sale.',
      feedback: `El {{ping}} sale por la {{outbound|salida}} de ${NAME.you}, y allí ninguna {{rule|regla}} lo {{allow|permitía}}. Una regla en la {{inbound|entrada}} no cambia lo que sale.`,
      correct: true,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: FIREWALL.you, whatId: WHAT.echoRequest.id, toId: TO.lucia.id, direction: 'outbound' }],
  takeaway:
    'Un {{firewall}} tiene {{rule|reglas}} para dos sentidos: la {{inbound|entrada}}, lo que llega al {{device|dispositivo}}, y la {{outbound|salida}}, lo que sale de él. Una regla de un sentido no cambia el otro.',
});
