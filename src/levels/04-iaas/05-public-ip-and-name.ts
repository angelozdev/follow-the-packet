import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, PEER, S1, S2, WHAT, YOU, actor, allOutbound, cand, inst, ping, server, sshFromYou, tcp } from './shared';

const S2_PUBLIC_NAME = 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com';

export default defineLevel({
  id: '04-05',
  chapter: 4,
  order: 5,
  title: 'La IP pública y el nombre',
  role: 'defender',
  lesson: LESSON,
  concept: CONCEPT,
  brief:
    'servidor1 tiene un monitor que le hace ping a servidor2 y siempre falla. La regla de servidor2 está bien. Arregla el monitor sin tocar el Security Group.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('servidor1', 'subnet-a', S1.private, S1.public, { appTarget: S2.public }),
      server('servidor2', 'subnet-b', S2.private, S2.public),
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
    mustPass: [{ from: inst('servidor1'), to: '@appTarget', protocol: 'icmp', icmpType: 8 }],
    mustBlock: [ping(actor('attacker'), S2.public)],
    allowed: [tcp(actor('you'), S1.public, 22), tcp(actor('you'), S2.public, 22)],
  },
  editable: {
    appTarget: {
      instanceId: 'servidor1',
      options: [
        { label: `IP pública · ${S2.public}`, target: S2.public },
        { label: `IP privada · ${S2.private}`, target: S2.private },
        { label: `Nombre público · ${S2_PUBLIC_NAME}`, target: S2_PUBLIC_NAME },
      ],
    },
  },
  tools: ['getent', 'rules'],
  prediction: {
    packet: ping(inst('servidor1'), S2.public),
    candidates: [cand.igw, cand.sgIn('servidor2'), cand.linux('servidor2'), cand.arrives('servidor2')],
    answer: { stage: 'sg-in', at: 'servidor2' },
  },
  hints: [
    '¿Por dónde viaja un paquete que va a una IP pública? ¿Con qué IP de origen llega?',
    'Por la IP pública el origen pasa a ser 54.78.154.66 y la regla con el SG de servidor1 ya no coincide. Apunta por dentro de la VPC.',
  ],
  solution: { kind: 'defender', actions: [{ type: 'setAppTarget', instanceId: 'servidor1', target: S2_PUBLIC_NAME }] },
  takeaway:
    'Entre servidores de la misma VPC, usa la IP privada o el nombre DNS: desde dentro, hasta el nombre público resuelve a la IP privada.',
});
