import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

export default defineLevel({
  id: '04-06',
  chapter: 4,
  order: 6,
  title: '¿Portero o dueño?',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'Te escriben: "servidor2 está caído, no responde el ping". La regla ICMP de servidor2 está puesta. Descubre dónde se pierde el ping y arréglalo.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('servidor1', 'subnet-a', S1.private, S1.public),
      server('servidor2', 'subnet-b', S2.private, S2.public, { linux: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } }),
    ],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOutbound('out-1')] },
      {
        id: 'sg-servidor2',
        name: 'servidor2',
        inbound: [sshFromYou('ssh-2'), { id: 'echo', what: WHAT.echoRequest.what, peer: PEER.sgServidor1.peer }],
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
      whatOptions: [WHAT.echoRequest, WHAT.allIcmp, WHAT.all],
      peerOptions: [PEER.sgServidor1, PEER.vpc, PEER.anywhere],
    },
    linuxFlags: { instanceIds: ['servidor2'] },
  },
  tools: ['tcpdump', 'rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.private),
    candidates: [cand.sgOut('servidor1'), cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'linux', at: 'servidor2' },
  },
  hints: [
    'Envía el ping tal cual y mira tcpdump en servidor2: ¿llega la pregunta?',
    'Si tcpdump ve llegar la pregunta y no sale respuesta, el portero ya la dejó pasar: el que no abre es Linux. Y no está caído: está encendido, solo calla.',
  ],
  solution: { kind: 'defender', actions: [{ type: 'setIgnoreIcmpEcho', instanceId: 'servidor2', value: false }] },
  takeaway: 'Un ping sin respuesta no significa "caído". Si tcpdump ve llegar la pregunta, el SG ya la dejó pasar y el problema está dentro de la máquina.',
});
