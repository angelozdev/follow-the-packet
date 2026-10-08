import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-02',
  chapter: 4,
  order: 2,
  title: 'Abre lo justo',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Alguien ya agregó una regla ICMP en servidor2 y aun así el ping no responde. Arréglalo dejando solo lo justo.',
  network: {
    ...NETWORK_BASE,
    instances: [server('servidor1', 'subnet-a', S1.private, S1.public), server('servidor2', 'subnet-b', S2.private, S2.public)],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      {
        id: 'sg-servidor2',
        name: 'servidor2',
        inbound: [sshFromYou('ssh-2'), { id: 'echo-reply', what: WHAT.echoReply.what, peer: PEER.sgServidor1.peer }],
        outbound: [allOutbound('out-2')],
      },
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
      whatOptions: [WHAT.echoRequest, WHAT.echoReply, WHAT.allIcmp, WHAT.ssh],
      peerOptions: [PEER.sgServidor1, PEER.vpc, PEER.anywhere, PEER.you],
    },
  },
  tools: ['rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    'Cuando servidor1 hace ping, ¿qué mensaje llega primero a servidor2: la pregunta o la respuesta?',
    'Lo que entra es el Echo Request. La regla Echo Reply no sirve para esto y, además, sobra.',
  ],
  solution: {
    kind: 'defender',
    actions: [
      { type: 'removeRule', sgId: 'sg-servidor2', ruleId: 'echo-reply' },
      { type: 'addRule', sgId: 'sg-servidor2', rule: { id: 'sol-echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer } },
    ],
  },
  takeaway: 'En un ping, lo que entra al destino es la pregunta (Echo Request). Abre solo eso: cada regla de más es una puerta abierta.',
});
