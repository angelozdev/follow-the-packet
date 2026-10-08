import { defineLevel } from '../schema';
import { ATTACKER, CONCEPT, LESSON, NETWORK_BASE, YOU, allOutbound, cand, inst, server, sshFromYou, tcp } from './shared';

const DB = '172.31.40.10';

export default defineLevel({
  id: '04-07',
  chapter: 4,
  order: 7,
  title: 'El club default',
  role: 'attacker',
  lesson: LESSON,
  concept: CONCEPT,
  brief: 'Eres el atacante y controlas dos servidores: web y batch. Tu objetivo: conectarte a db por el puerto 5432.',
  network: {
    ...NETWORK_BASE,
    instances: [
      server('web', 'subnet-a', '172.31.16.20', '54.78.154.66', { linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22, 80] } }),
      server('batch', 'subnet-a', '172.31.16.30', undefined, { sgIds: ['sg-default'] }),
      server('db', 'subnet-b', DB, undefined, { sgIds: ['sg-db', 'sg-default'], linux: { ignoreIcmpEcho: false, listeningTcpPorts: [5432] } }),
    ],
    securityGroups: [
      {
        id: 'sg-web',
        name: 'web',
        inbound: [{ id: 'http', what: { kind: 'tcp', fromPort: 80, toPort: 80 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } }, sshFromYou('ssh-web')],
        outbound: [allOutbound('out-web')],
      },
      { id: 'sg-api', name: 'api', inbound: [], outbound: [allOutbound('out-api')] },
      {
        id: 'sg-db',
        name: 'db',
        inbound: [{ id: 'pg-api', what: { kind: 'tcp', fromPort: 5432, toPort: 5432 }, peer: { kind: 'sg', sgId: 'sg-api' } }],
        outbound: [allOutbound('out-db')],
      },
      {
        id: 'sg-default',
        name: 'default',
        inbound: [{ id: 'default-self', what: { kind: 'all' }, peer: { kind: 'sg', sgId: 'sg-default' } }],
        outbound: [allOutbound('out-default')],
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
        { label: 'Desde web', endpoint: inst('web') },
        { label: 'Desde batch', endpoint: inst('batch') },
      ],
      targets: [{ label: `db por su IP privada · ${DB}`, to: DB }],
      services: [
        { label: 'PostgreSQL · TCP 5432', protocol: 'tcp', port: 5432 },
        { label: 'SSH · TCP 22', protocol: 'tcp', port: 22 },
      ],
    },
  },
  editable: {},
  tools: ['rules'],
  prediction: {
    packet: tcp(inst('web'), DB, 5432),
    candidates: [cand.sgOut('web'), cand.sgIn('db'), cand.linux('db'), cand.arrives('db')],
    answer: { stage: 'sg-in', at: 'db' },
  },
  hints: [
    'Mira qué SGs tiene db. ¿Alguno deja entrar a "sus propios miembros"?',
    'La regla del SG default permite todo desde el SG default. ¿Cuál de tus servidores está en ese club?',
  ],
  solution: { kind: 'attacker', packet: tcp(inst('batch'), DB, 5432) },
  takeaway:
    'El SG default deja entrar todo lo que también lleva el SG default. Si metes ahí tus recursos, cualquiera del club, incluso uno hackeado, llega a todos los demás.',
});
