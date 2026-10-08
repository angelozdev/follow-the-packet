import type { Endpoint, Instance, Network, PacketSpec, Rule } from '@/engine';
import type { Flow, FromChip, WhatChip } from '@/levels/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

const REGION = 'eu-west-1';
const VPC_CIDR = '172.31.0.0/16';
const ANYWHERE = '0.0.0.0/0';
const SSH_PORT = 22;
const ATTACKER = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66' } as const;

export const S1 = { id: 'servidor1', private: '172.31.16.131', public: '54.78.154.66' } as const;
export const S2 = { id: 'servidor2', private: '172.31.38.97', public: '34.244.254.100' } as const;
export const SG = { servidor1: 'sg-servidor1', servidor2: 'sg-servidor2' } as const;

function server(ips: { id: string; private: string; public: string }, subnetId: string, sgId: string): Instance {
  return {
    id: ips.id,
    name: ips.id,
    subnetId,
    privateIp: ips.private,
    publicIp: ips.public,
    sgIds: [sgId],
    linux: { ignoreIcmpEcho: false, listeningTcpPorts: [SSH_PORT] },
  };
}

function allOutbound(id: string): Rule {
  return { id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANYWHERE } };
}

export const BASE_WORLD: Network = {
  region: REGION,
  vpcCidr: VPC_CIDR,
  subnets: [
    { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
    { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
  ],
  instances: [server(S1, 'subnet-a', SG.servidor1), server(S2, 'subnet-b', SG.servidor2)],
  securityGroups: [
    { id: SG.servidor1, name: S1.id, inbound: [], outbound: [allOutbound('all-out-servidor1')] },
    { id: SG.servidor2, name: S2.id, inbound: [], outbound: [allOutbound('all-out-servidor2')] },
  ],
  actors: [{ ...ATTACKER, kind: 'attacker' }],
};

function ping(from: Endpoint, to: string): PacketSpec {
  return { from, to, protocol: 'icmp', icmpType: 8 };
}

export const FLOWS = {
  pingToServer2: { id: 'ping-servidor1-servidor2', kind: 'required', packet: ping({ kind: 'instance', id: S1.id }, S2.private) },
  attackerPing: { id: 'ping-attacker-servidor2', kind: 'forbidden', packet: ping({ kind: 'actor', id: ATTACKER.id }, S2.public) },
} satisfies Record<string, Flow>;

export const PING_TASK_FLOWS = [FLOWS.pingToServer2.id, FLOWS.attackerPing.id];

export const WHAT = {
  ping: { id: 'ping', label: '{{ping|Ping}}', what: { kind: 'icmp', icmpType: 8 } },
  echoRequest: { id: 'echo-request', label: '{{echo-request}} (ida)', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: '{{echo-reply}} (vuelta)', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { id: 'all-icmp', label: '{{ping|Ping}} completo (todo {{icmp}})', what: { kind: 'icmp', icmpType: 'all' } },
} satisfies Record<string, WhatChip>;

export const FROM = {
  servidor1: { id: 'servidor1', label: 'servidor1', peer: { kind: 'sg', sgId: SG.servidor1 } },
  internet: { id: 'internet', label: 'Todo internet', peer: { kind: 'cidr', cidr: ANYWHERE } },
} satisfies Record<string, FromChip>;

export const DAY_SHIFT_RULE: Rule = { id: 'day-shift-echo-reply', what: WHAT.echoReply.what, peer: FROM.internet.peer };
