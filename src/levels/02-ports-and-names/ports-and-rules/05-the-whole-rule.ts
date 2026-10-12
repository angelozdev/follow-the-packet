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
  report: `Lucía activó {{ssh|SSH}} en ${NAME.lucia} y puso un {{firewall}} que no deja entrar nada. El {{default-port|puerto por defecto}} de {{ssh|SSH}} es el ${PORT.ssh}. Tú tienes que entrar por {{ssh|SSH}} desde ${NAME.you}. ${NAME.visitor}, la laptop de la visita, no. Una {{rule|regla}} dice tres cosas: el {{protocol|protocolo}}, el {{port-range|rango de puertos}} y de quién viene el {{packet|paquete}}. La {{rule|regla}} de ${NAME.marta} para el {{ping}} de ${NAME.lucia} sigue en su sitio. Abre el {{firewall}} de ${NAME.lucia} y escribe una {{rule|regla}} que deje entrar a ${NAME.you} y a nadie más.`,
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
    `Elige ${SSH_WHAT.ssh.label} en Type y ${NAME.you} en Source. Un rango como 1-1023 cae dentro de los {{well-known-ports|puertos conocidos}} y abre el ${PORT.ssh}, pero también el ${PORT.web} y el ${PORT.secureWeb}.`,
  ],
  question: `¿Por qué la {{rule|regla}} ${SSH_WHAT.ssh.label} desde ${SSH_FROM.anyone.label} deja entrar a la visita?`,
  explanation: [
    {
      text: `Porque ${SSH_FROM.anyone.peer.cidr} quiere decir cualquier origen, y la visita es uno de ellos.`,
      feedback: `Una {{rule|regla}} dice de quién acepta el {{packet|paquete}}. {{cidr}} ${SSH_FROM.anyone.peer.cidr} son todas las IPv4: la {{ip-address|IP}} de ${NAME.visitor} también.`,
      correct: true,
    },
    {
      text: `Porque el ${PORT.ssh} es un {{well-known-ports|puerto conocido}} y cualquiera puede usarlo, también la visita.`,
      feedback: `Que el ${PORT.ssh} sea un {{well-known-ports|puerto conocido}} no deja entrar a nadie. Lo que deja entrar es la {{rule|regla}}, y esta acepta cualquier origen.`,
      correct: false,
    },
    {
      text: `Porque las reglas {{tcp}} no miran de quién viene el {{packet|paquete}}, solo el {{port|puerto}} de destino.`,
      feedback: 'Sí lo miran: cada {{rule|regla}} tiene su origen. Esta dice cualquier origen, y por eso la visita entra.',
      correct: false,
    },
  ],
  solution: [{ type: 'placeRule', firewallId: FIREWALL.lucia, whatId: SSH_WHAT.ssh.id, fromId: SSH_FROM.you.id }],
  takeaway: `Una {{rule|regla}} dice {{protocol|protocolo}}, {{port-range|rango de puertos}} y origen. El {{default-port|puerto por defecto}} de {{ssh|SSH}} es el ${PORT.ssh}, pero eso es una costumbre y no abre nada: lo abre la {{rule|regla}}. Un rango como 1-1023 cae dentro de los {{well-known-ports|puertos conocidos}} y abre más que el ${PORT.ssh}. Abre solo el rango que hace falta, y solo para quien lo necesita.`,
});
