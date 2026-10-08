import type { Actor, Endpoint, Instance, PacketSpec, Rule, RulePeer, RuleWhat, Subnet } from '../../engine/types';
import type { Candidate } from '../schema';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

export const YOU: Actor = { id: 'you', name: 'Tu Mac', ip: '198.51.100.7', kind: 'you' };
export const ATTACKER: Actor = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' };

const SUBNETS: Subnet[] = [
  { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
  { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
];
export const NETWORK_BASE = { region: 'eu-west-1', vpcCidr: '172.31.0.0/16', subnets: SUBNETS };

export const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
export const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

export const inst = (id: string): Endpoint => ({ kind: 'instance', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

export const sshFromYou = (id: string): Rule => ({
  id,
  what: { kind: 'tcp', fromPort: 22, toPort: 22 },
  peer: { kind: 'cidr', cidr: '198.51.100.7/32' },
});
export const allOutbound = (id: string): Rule => ({ id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });

/** Instancia con su SG `sg-<id>`, SSH escuchando y Linux contestando pings. */
export function server(id: string, subnetId: string, privateIp: string, publicIp?: string, extra: Partial<Instance> = {}): Instance {
  return {
    id,
    name: id,
    subnetId,
    privateIp,
    ...(publicIp ? { publicIp } : {}),
    sgIds: [`sg-${id}`],
    linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
    ...extra,
  };
}

export const WHAT = {
  echoRequest: { label: 'ICMP · Echo Request ("Repetir solicitud")', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { label: 'ICMP · Echo Reply ("Repetir respuesta")', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { label: 'ICMP · Todos los tipos', what: { kind: 'icmp', icmpType: 'all' } },
  ssh: { label: 'SSH · TCP 22', what: { kind: 'tcp', fromPort: 22, toPort: 22 } },
  all: { label: 'Todo el tráfico', what: { kind: 'all' } },
} satisfies Record<string, { label: string; what: RuleWhat }>;

export const PEER = {
  you: { label: 'Mi IP · 198.51.100.7/32', peer: { kind: 'cidr', cidr: '198.51.100.7/32' } },
  sgServidor1: { label: 'SG servidor1', peer: { kind: 'sg', sgId: 'sg-servidor1' } },
  sgServidor2: { label: 'SG servidor2', peer: { kind: 'sg', sgId: 'sg-servidor2' } },
  vpc: { label: 'Toda la VPC · 172.31.0.0/16', peer: { kind: 'cidr', cidr: '172.31.0.0/16' } },
  anywhere: { label: 'Cualquiera · 0.0.0.0/0', peer: { kind: 'cidr', cidr: '0.0.0.0/0' } },
} satisfies Record<string, { label: string; peer: RulePeer }>;

export const cand = {
  sgOut: (id: string): Candidate => ({ label: `Al salir de ${id} (su SG de salida)`, checkpoint: { stage: 'sg-out', at: id } }),
  sgIn: (id: string): Candidate => ({ label: `En la barrera de ${id} (su SG de entrada)`, checkpoint: { stage: 'sg-in', at: id } }),
  linux: (id: string): Candidate => ({ label: `Dentro de ${id} (Linux)`, checkpoint: { stage: 'linux', at: id } }),
  igw: { label: 'En el internet gateway', checkpoint: { stage: 'route', at: 'igw' } } satisfies Candidate,
  arrives: (id: string): Candidate => ({ label: `No muere: llega a ${id} y vuelve la respuesta`, checkpoint: { stage: 'reply', at: id } }),
};
