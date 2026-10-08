import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, YOU, actor, allOutbound, cand, inst, server, sshFromYou, tcp } from './shared';

const DB = '172.31.40.10';
const WEB_PUBLIC = '54.78.154.66';

export default defineLevel({
  id: '04-04',
  chapter: 4,
  order: 4,
  title: 'El rango demasiado ancho',
  role: 'attacker',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Eres el atacante. Ya controlas web, el servidor público. Tu objetivo: conectarte a la base de datos (db) por el puerto 5432.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('web', 'subnet-a', '172.31.16.20', WEB_PUBLIC, { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22, 80] } }),
      server('db', 'subnet-b', DB, undefined, { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [5432] } }),
    ],
    securityGroups: [
      {
        id: 'sg-web',
        name: 'web',
        inbound: [{ id: 'http', what: { kind: 'tcp', fromPort: 80, toPort: 80 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }, sshFromYou('ssh-web')],
        outbound: [allOutbound('out-web')],
      },
      {
        id: 'sg-db',
        name: 'db',
        inbound: [{ id: 'pg-vpc', what: { kind: 'tcp', fromPort: 5432, toPort: 5432 }, peer: { kind: 'cidr', cidr: '172.31.0.0/16' } }],
        outbound: [allOutbound('out-db')],
      },
    ],
    actors: [YOU, ATTACKER],
  },
  objective: {
    kind: 'attacker',
    target: { instanceId: 'db', protocol: 'tcp', port: 5432 },
    maxAttempts: 2,
    attack: {
      origins: [
        { label: 'Desde internet (tu máquina)', endpoint: actor('attacker') },
        { label: 'Desde web (el servidor que controlas)', endpoint: inst('web') },
      ],
      targets: [
        { label: `db por su IP privada · ${DB}`, to: DB },
        { label: `web por su IP pública · ${WEB_PUBLIC}`, to: WEB_PUBLIC },
      ],
      services: [
        { label: 'PostgreSQL · TCP 5432', protocol: 'tcp', port: 5432 },
        { label: 'SSH · TCP 22', protocol: 'tcp', port: 22 },
      ],
    },
  },
  editable: {},
  tools: ['rules'],
  prediction: {
    packet: tcp(actor('attacker'), DB, 5432),
    candidates: [cand.igw, cand.sgIn('db'), cand.linux('db'), cand.arrives('db')],
    answer: { stage: 'route', at: 'igw' },
  },
  hints: [
    'Desde internet, ¿existe un camino hacia una IP privada?',
    'Mira desde dónde permite la regla de db: 172.31.0.0/16 es toda la VPC. ¿Cuál de tus servidores está dentro?',
  ],
  solution: { kind: 'attacker', packet: tcp(inst('web'), DB, 5432) },
  takeaway:
    'Una regla con un rango como "toda la VPC" deja entrar a cualquier servidor de dentro, también a uno hackeado. Por eso el origen debería ser el SG de quien de verdad lo necesita.',
});
