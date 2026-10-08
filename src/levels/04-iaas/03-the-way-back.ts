import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-03',
  chapter: 4,
  order: 3,
  title: 'El camino de vuelta',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'servidor1 debe poder hacerle ping a servidor2, pero servidor2 no debe poder hacerle ping a servidor1. Alguien abrió ICMP en servidor1 "para que vuelva la respuesta".',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      {
        id: 'sg-servidor1',
        name: 'servidor1',
        inbound: [sshFromYou('ssh-1'), { id: 'icmp-back', what: WHAT.allIcmp.what, peer: PEER.sgServidor2.peer }],
        outbound: [allOutbound('out-1')],
      },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOutbound('out-2')] },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'defender',
    mustPass: [ping(inst('servidor1'), S2.private)],
    mustBlock: [ping(inst('servidor2'), S1.private)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    rules: {
      sgIds: ['sg-servidor1', 'sg-servidor2'],
      whatOptions: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp, WHAT.ssh],
      peerOptions: [PEER.sgServidor1, PEER.sgServidor2, PEER.you, PEER.anywhere],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.sgIn('servidor1'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Para que la respuesta vuelva a servidor1, ¿hace falta alguna regla en servidor1?',
    'El SG es stateful: la respuesta de una conversación permitida vuelve sola. La regla de servidor1 sobra y deja que servidor2 inicie pings.',
  ],
  solution: {
    kind: 'defender',
    actions: [
      { type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } },
      { type: 'removeRule', sgId: 'sg-servidor1', ruleId: 'icmp-back' },
    ],
  },
  takeaway:
    'El SG es stateful: la respuesta vuelve sola. Abrir la entrada del origen "para la vuelta" solo sirve para que el otro pueda iniciar conversaciones.',
});
