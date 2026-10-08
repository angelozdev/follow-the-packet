import type { Endpoint, Instance, Network, PacketSpec, Rule } from './types';

export const YOU_IP = '198.51.100.7';
export const ATTACKER_IP = '203.0.113.66';

export const sshFromYou = (id: string): Rule => ({
  id,
  what: { kind: 'tcp', fromPort: 22, toPort: 22 },
  peer: { kind: 'cidr', cidr: `${YOU_IP}/32` },
});
export const allOut = (id: string): Rule => ({ id, what: { kind: 'all' }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
export const echoFrom = (id: string, sgId: string, icmpType: 0 | 8 = 8): Rule => ({
  id,
  what: { kind: 'icmp', icmpType },
  peer: { kind: 'sg', sgId },
});

export const inst = (id: string): Endpoint => ({ kind: 'instance', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

/** La red del lab 03: dos servidores en AZs distintas, solo SSH desde tu Mac. */
export function lab03Net(): Network {
  return {
    region: 'eu-west-1',
    vpcCidr: '172.31.0.0/16',
    subnets: [
      { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
      { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
    ],
    instances: [
      {
        id: 'servidor1',
        name: 'servidor1',
        subnetId: 'subnet-a',
        privateIp: '172.31.16.131',
        publicIp: '54.78.154.66',
        sgIds: ['sg-servidor1'],
        linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
      {
        id: 'servidor2',
        name: 'servidor2',
        subnetId: 'subnet-b',
        privateIp: '172.31.38.97',
        publicIp: '34.244.254.100',
        sgIds: ['sg-servidor2'],
        linux: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
    ],
    securityGroups: [
      { id: 'sg-servidor1', name: 'servidor1', inbound: [sshFromYou('ssh-1')], outbound: [allOut('out-1')] },
      { id: 'sg-servidor2', name: 'servidor2', inbound: [sshFromYou('ssh-2')], outbound: [allOut('out-2')] },
      {
        id: 'sg-default',
        name: 'default',
        inbound: [{ id: 'default-self', what: { kind: 'all' }, peer: { kind: 'sg', sgId: 'sg-default' } }],
        outbound: [allOut('out-default')],
      },
    ],
    actors: [
      { id: 'you', name: 'Tu Mac', ip: YOU_IP, kind: 'you' },
      { id: 'attacker', name: 'Atacante', ip: ATTACKER_IP, kind: 'attacker' },
    ],
  };
}

export function withInbound(net: Network, sgId: string, ...rules: Rule[]): Network {
  return {
    ...net,
    securityGroups: net.securityGroups.map((g) => (g.id === sgId ? { ...g, inbound: [...g.inbound, ...rules] } : g)),
  };
}

export function withInstance(net: Network, id: string, patch: Partial<Instance>): Network {
  return { ...net, instances: net.instances.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}
