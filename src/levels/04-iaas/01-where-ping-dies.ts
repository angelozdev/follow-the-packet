import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-01',
  chapter: 4,
  order: 1,
  title: '¿Dónde muere el ping?',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'servidor1 quiere hacerle ping a servidor2, pero no responde. Haz que responda sin abrirle la puerta a nadie más.',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOutbound('out-2')] },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor2'],
      whatOptions: [WHAT.ssh, WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp],
      peerOptions: [PEER.you, PEER.sgServidor1, PEER.anywhere],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Mira la lista del guardia de servidor2: ¿alguna regla habla de ICMP?',
    'Una regla necesita dos cosas: qué (el mensaje que entra primero) y desde dónde (quién lo manda).',
  ],
  solution: {
    kind: 'defender',
    actions: [{ type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } }],
  },
  takeaway: 'Un Security Group solo deja pasar lo que una regla permite, y la regla tiene que coincidir en el qué y en el desde dónde a la vez.',
});
