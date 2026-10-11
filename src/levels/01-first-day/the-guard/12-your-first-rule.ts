import { defineIncident } from '@/levels/contract/incident';
import { CONCEPT, FIREWALL, FLOW, FROM, LESSON, NAME, RULE_PIECES, TASK, WHAT } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-12',
  chapter: 1,
  order: 12,
  title: 'Tu primera regla',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['rule', 'allow', 'deny', 'default-deny', 'least-privilege'],
  changes: [],
  shown: RULE_PIECES,
  report: `Soporte necesita hacer {{ping}} a ${NAME.marta} desde ${NAME.lucia}, pero el {{firewall}} de ${NAME.marta} todavía no tiene ninguna {{rule|regla}}. La visita, en ${NAME.visitor}, no debe poder hacerlo. Abre el {{firewall}} y escribe una {{rule|regla}} que {{allow|permita}} el {{ping}} de soporte.`,
  tasks: [
    {
      id: TASK.rule,
      text: `Que el {{ping}} de ${NAME.lucia} a ${NAME.marta} vuelva y que el de ${NAME.visitor} no entre.`,
      flowIds: [FLOW.support.id, FLOW.visitor.id],
    },
  ],
  flows: [FLOW.support, FLOW.visitor],
  chips: { what: [WHAT.echoRequest], from: [FROM.anyone, FROM.lucia] },
  hints: [
    'Este {{firewall}} solo deja pasar lo que una {{rule|regla}} {{allow|permite}}. Ábrelo y escribe una.',
    `Elige {{echo-request}} en Type y ${NAME.lucia} en Source. Dar solo lo que hace falta es el {{least-privilege}}.`,
  ],
  question: `¿Por qué el {{ping}} de ${NAME.visitor} sigue bloqueado si no escribiste ninguna {{rule|regla}} contra esa laptop?`,
  explanation: [
    {
      text: 'Porque lo que ninguna {{rule|regla}} {{allow|permite}} queda {{deny|denegado}}.',
      feedback: 'Se llama {{default-deny}}: el {{firewall}} {{deny|deniega}} todo lo que ninguna {{rule|regla}} permite. No hace falta una {{rule|regla}} contra la visita.',
      correct: true,
    },
    {
      text: 'Porque el {{firewall}} reconoce a las visitas y las deja afuera.',
      feedback: `El {{firewall}} no sabe quién es una visita: compara la {{source-ip}} de cada {{packet|paquete}} con sus {{rule|reglas}}, y la de ${NAME.visitor} no coincide con ninguna.`,
      correct: false,
    },
    {
      text: `Porque la {{rule|regla}} de ${NAME.lucia} también prohíbe a la visita.`,
      feedback: 'En este {{firewall}}, una {{rule|regla}} solo {{allow|permite}}: no prohíbe a nadie. Lo que ninguna regla permite ya queda {{deny|denegado}}.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: FIREWALL.marta, whatId: WHAT.echoRequest.id, fromId: FROM.lucia.id }],
  takeaway:
    'Una {{rule|regla}} {{allow|permite}} un tipo de {{traffic|tráfico}} desde una {{source-ip|IP de origen}}. En este {{firewall}}, lo que ninguna regla permite queda {{deny|denegado}}: es la {{default-deny}}. Abrir solo lo necesario es el {{least-privilege}}.',
});
