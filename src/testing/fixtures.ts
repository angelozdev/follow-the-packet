import type { Device, Endpoint, Network, PacketSpec, Rule } from '@/engine';

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

export const device = (id: string): Endpoint => ({ kind: 'device', id });
export const actor = (id: string): Endpoint => ({ kind: 'actor', id });
export const ping = (from: Endpoint, to: string): PacketSpec => ({ from, to, protocol: 'icmp', icmpType: 8 });
export const tcp = (from: Endpoint, to: string, port: number): PacketSpec => ({ from, to, protocol: 'tcp', port });

/** Returns the lab 03 network: two EC2 instances in different availability zones, SSH only from your Mac. */
export function lab03Net(): Network {
  return {
    region: 'eu-west-1',
    cidr: '172.31.0.0/16',
    subnets: [
      { id: 'subnet-a', az: 'eu-west-1a', cidr: '172.31.16.0/20' },
      { id: 'subnet-b', az: 'eu-west-1b', cidr: '172.31.32.0/20' },
    ],
    devices: [
      {
        id: 'servidor1',
        name: 'servidor1',
        subnetId: 'subnet-a',
        privateIp: '172.31.16.131',
        publicIp: '54.78.154.66',
        firewallIds: ['sg-servidor1'],
        host: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
      {
        id: 'servidor2',
        name: 'servidor2',
        subnetId: 'subnet-b',
        privateIp: '172.31.38.97',
        publicIp: '34.244.254.100',
        firewallIds: ['sg-servidor2'],
        host: { ignoreIcmpEcho: false, listeningTcpPorts: [22] },
      },
    ],
    firewalls: [
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

export function withInbound(net: Network, firewallId: string, ...rules: Rule[]): Network {
  return {
    ...net,
    firewalls: net.firewalls.map((f) => (f.id === firewallId ? { ...f, inbound: [...f.inbound, ...rules] } : f)),
  };
}

export function withDevice(net: Network, id: string, patch: Partial<Device>): Network {
  return { ...net, devices: net.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) };
}
