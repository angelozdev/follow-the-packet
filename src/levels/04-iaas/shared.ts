import { nameTag, type TermId } from '@/copy';
import type { Device, Endpoint, Network, PacketSpec, Rule } from '@/engine';
import type { Flow, FromChip, WhatChip } from '@/levels/contract/incident';

export const LESSON = 'Lab: Comprobación de Conectividad entre Instancias EC2 usando PING';
export const CONCEPT = 'concepts/security-groups.md';

/** The terms of chapter 1 that no incident of chapter 1 introduces yet. 04-01 introduces them for now, so chapter 4 keeps its ladder while the fourteen incidents of chapter 1 are built: each block takes out of this list the terms it presents, and the last one leaves it empty. */
export const CHAPTER_1_BRIDGE: TermId[] = ['rule'];

const REGION = 'eu-west-1';
const VPC_CIDR = '172.31.0.0/16';
const ANYWHERE_IPV4 = '0.0.0.0/0';
const SSH_PORT = 22;
const ATTACKER = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66' } as const;

export const S1 = { id: 'servidor1', private: '172.31.16.131', public: '54.78.154.66' } as const;
export const S2 = { id: 'servidor2', private: '172.31.38.97', public: '34.244.254.100' } as const;
export const SG = { servidor1: 'sg-servidor1', servidor2: 'sg-servidor2' } as const;

function server(ips: { id: string; private: string; public: string }, subnetId: string, sgId: string): Device {
  return {
    id: ips.id,
    name: ips.id,
    kind: 'ec2-instance',
    subnetId,
    privateIp: ips.private,
    publicIp: ips.public,
    firewallIds: [sgId],
    host: { ignoreIcmpEcho: false, listeningTcpPorts: [SSH_PORT] },
  };
}

function allOutbound(id: string): Rule {
  return { id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: ANYWHERE_IPV4 } };
}

export const BASE_WORLD: Network = {
  kind: 'vpc',
  region: REGION,
  cidr: VPC_CIDR,
  subnets: [
    { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
    { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
  ],
  devices: [server(S1, 'subnet-a', SG.servidor1), server(S2, 'subnet-b', SG.servidor2)],
  firewalls: [
    { id: SG.servidor1, name: S1.id, kind: 'security-group', inbound: [], outbound: [allOutbound('all-out-servidor1')] },
    { id: SG.servidor2, name: S2.id, kind: 'security-group', inbound: [], outbound: [allOutbound('all-out-servidor2')] },
  ],
  edge: 'internet-gateway',
  actors: [{ ...ATTACKER, kind: 'attacker' }],
};

function ping(from: Endpoint, to: string): PacketSpec {
  return { from, to, protocol: 'icmp', icmpType: 8 };
}

export const FLOWS = {
  pingToServer2: { id: 'ping-servidor1-servidor2', kind: 'required', packet: ping({ kind: 'device', id: S1.id }, S2.private) },
  attackerPing: { id: 'ping-attacker-servidor2', kind: 'forbidden', packet: ping({ kind: 'actor', id: ATTACKER.id }, S2.public) },
} satisfies Record<string, Flow>;

export const PING_TASK_FLOWS = [FLOWS.pingToServer2.id, FLOWS.attackerPing.id];

export const WHAT = {
  echoRequest: { id: 'echo-request', label: '{{icmp}} · {{echo-request}}', what: { kind: 'icmp', icmpType: 8 } },
  echoReply: { id: 'echo-reply', label: '{{icmp}} · {{echo-reply}}', what: { kind: 'icmp', icmpType: 0 } },
  allIcmp: { id: 'all-icmp', label: 'All {{icmp}} - IPv4', what: { kind: 'icmp', icmpType: 'all' } },
} satisfies Record<string, WhatChip>;

export const FROM = {
  sgServidor1: { id: 'sg-servidor1', label: `{{security-group|SG}} ${nameTag(S1.id)}`, peer: { kind: 'sg', sgId: SG.servidor1 } },
  anywhere: { id: 'anywhere-ipv4', label: `{{anywhere-ipv4}} (${ANYWHERE_IPV4})`, peer: { kind: 'cidr', cidr: ANYWHERE_IPV4 } },
} satisfies Record<string, FromChip>;

export const DAY_SHIFT_RULE: Rule = { id: 'day-shift-echo-reply', what: WHAT.echoReply.what, peer: FROM.anywhere.peer };
