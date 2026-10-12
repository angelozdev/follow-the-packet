import { defineIncident } from '@/levels/contract/incident';
import { CONCEPT, FIREWALL, LESSON, NAME, PORT, SSH_AND_FIREWALL, SSH_FLOW, SSH_FROM, SSH_PIECES, SSH_WHAT, TASK } from '@/levels/02-ports-and-names/shared';

export default defineIncident({
  id: '02-05',
  chapter: 2,
  order: 5,
  title: 'La regla completa',
  role: 'defender',
  mechanic: 'filter',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['port-range', 'ssh', 'default-port', 'well-known-ports'],
  changes: SSH_AND_FIREWALL,
  shown: SSH_PIECES,
  report: `Lucía activó {{ssh|SSH}} en ${NAME.lucia} y puso un {{firewall}} que no deja entrar nada. El {{default-port|puerto por defecto}} de {{ssh|SSH}} es el ${PORT.ssh}. Tú debes entrar por {{ssh|SSH}} desde ${NAME.you}. La visita, en ${NAME.visitor}, no. Una {{rule|regla}} dice tres cosas: el {{protocol|protocolo}}, el {{port-range|rango de puertos}} y de quién viene el {{packet|paquete}}. Las dos primeras van en Type y la tercera en Source. También ves a ${NAME.marta} en el mapa. Su {{rule|regla}} deja entrar el {{ping}} de ${NAME.lucia}, y esa {{rule|regla}} no cambia. Abre el {{firewall}} de ${NAME.lucia} y escribe una {{rule|regla}} que deje entrar a ${NAME.you} y a nadie más.`,
  tasks: [
    {
      id: TASK.sshOnlyYou,
      text: `Que ${NAME.you} entre por {{ssh|SSH}} al {{port|puerto}} ${PORT.ssh} de ${NAME.lucia}, y que ${NAME.visitor} no entre.`,
      flowIds: [SSH_FLOW.you.id, SSH_FLOW.visitor.id],
    },
  ],
  flows: [SSH_FLOW.you, SSH_FLOW.visitor, SSH_FLOW.background],
  chips: { what: [SSH_WHAT.ssh, SSH_WHAT.web, SSH_WHAT.wellKnown, SSH_WHAT.everything, SSH_WHAT.echoRequest], from: [SSH_FROM.you, SSH_FROM.anyone, SSH_FROM.floor, SSH_FROM.lucia] },
  hints: [
    'Una {{rule|regla}} es {{protocol|protocolo}}, {{port-range|rango de puertos}} y {{source-ip|IP de origen}}. Mira cuál de las tres deja entrar a la visita.',
    `Abre solo lo que hace falta: elige ${SSH_WHAT.ssh.label} en Type y ${NAME.you} en Source. Un rango como 1-1023 abre el ${PORT.ssh}, pero también el ${PORT.web} y el ${PORT.secureWeb}: cae dentro de los {{well-known-ports|puertos conocidos}}.`,
  ],
  question: `Si pones la {{rule|regla}} ${SSH_WHAT.ssh.label} desde ${SSH_FROM.anyone.label}, ¿por qué entra la visita?`,
  explanation: [
    {
      text: `Porque ${SSH_FROM.anyone.peer.cidr} quiere decir cualquier origen, y la visita es uno de ellos.`,
      feedback: `Una {{rule|regla}} dice de quién acepta el {{packet|paquete}}. En notación {{cidr|CIDR}}, ${SSH_FROM.anyone.peer.cidr} son todas las direcciones {{ipv4|IPv4}}, también la {{ip-address|IP}} de ${NAME.visitor}.`,
      correct: true,
    },
    {
      text: `Porque el ${PORT.ssh} es un {{well-known-ports|puerto conocido}} y cualquiera puede usarlo, también la visita.`,
      feedback: `Que el ${PORT.ssh} sea un {{well-known-ports|puerto conocido}} no deja entrar a nadie. Lo que deja entrar es la {{rule|regla}}, y esta acepta cualquier origen.`,
      correct: false,
    },
    {
      text: `Porque una {{rule|regla}} {{tcp}} solo mira el {{port-range|rango de puertos}}, no de quién viene el {{packet|paquete}}.`,
      feedback: 'Sí mira el origen: cada {{rule|regla}} tiene su Source. Esta dice cualquier origen, y por eso la visita entra.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: FIREWALL.lucia, whatId: SSH_WHAT.ssh.id, fromId: SSH_FROM.you.id }],
  takeaway: `Una {{rule|regla}} dice {{protocol|protocolo}}, {{port-range|rango de puertos}} y origen. Que el ${PORT.ssh} sea el {{default-port|puerto por defecto}} de {{ssh|SSH}} es una costumbre: no abre nada. Lo abre la {{rule|regla}}. Un rango como 1-1023 cae dentro de los {{well-known-ports|puertos conocidos}} y abre más que el ${PORT.ssh}. Abrir solo lo necesario, y solo para quien lo necesita, es el {{least-privilege}}.`,
});
