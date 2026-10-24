import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine/simulation/simulate';
import { extraOpenings, flowKey, probePackets, reachesHost, withProbeActor } from './exposure';
import type { Network, Rule } from '@/engine/network/types';
import { OFFICE, OFFICE_FLOORS, actor, device, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, tcpService, withDevice, withInbound } from '@/testing';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const expected = [
  ping(device('servidor1'), S2.private),
  tcp(actor('you'), '54.78.154.66', 22),
  tcp(actor('you'), S2.public, 22),
];

describe('extraOpenings', () => {
  it('with the exact rule there are no extra openings', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    expect(extraOpenings(net, expected)).toEqual([]);
  });

  it('ICMP of every type from the servidor1 SG opens too much (lets Echo Reply in)', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'all-icmp', what: { kind: 'icmp', icmpType: 'all' }, peer: { kind: 'sg', sgId: 'sg-servidor1' } });
    const extra = extraOpenings(net, expected);
    expect(extra).toContainEqual({ from: device('servidor1'), to: S2.private, protocol: 'icmp', icmpType: 0 });
  });

  it('Echo Request from 0.0.0.0/0 opens to the internet', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'world', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
    const extra = extraOpenings(net, expected);
    expect(extra.some((p) => p.from.kind === 'actor' && p.from.id === 'probe-internet')).toBe(true);
  });

  it('the expected SSH from your Mac does not count as an extra opening', () => {
    expect(extraOpenings(lab03Net(), expected)).toEqual([]);
  });

  it('Echo Reply from 0.0.0.0/0 lets the internet in (the day-shift rule of 04-02)', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', { id: 'reply-world', what: { kind: 'icmp', icmpType: 0 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
    expect(extraOpenings(net, expected)).toContainEqual({ from: actor('probe-internet'), to: S2.public, protocol: 'icmp', icmpType: 0 });
  });
});

describe('flowKey', () => {
  it('names the source, the effective source, the destination, the resolved address and the service', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    expect(flowKey(net, ping(device('servidor1'), S2.private))).toBe('device:servidor1@172.31.16.131>servidor2@172.31.38.97:icmp:8');
  });

  it('a DNS name and the IP it resolves to are the same flow', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const byName = flowKey(net, ping(device('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(byName).toBe(flowKey(net, ping(device('servidor1'), S2.private)));
  });
});

describe('extraOpenings by path', () => {
  it('an allowed private-IP flow does not hide an opening on the public path', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'), {
      id: 'servidor1-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: '54.78.154.66/32' },
    });
    const extra = extraOpenings(net, [ping(device('servidor1'), S2.private)]);
    expect(extra).toContainEqual(ping(device('servidor1'), S2.public));
  });

  it('a flow expected by DNS name is not an opening on its own IP', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const expectedByName = [
      ping(device('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'),
      tcp(actor('you'), '54.78.154.66', 22),
      tcp(actor('you'), S2.public, 22),
    ];
    expect(extraOpenings(net, expectedByName)).toEqual([]);
  });
});

describe('probePackets', () => {
  it('a device is not probed from itself', () => {
    const packets = probePackets(lab03Net());
    expect(packets.some((p) => p.from.kind === 'device' && p.from.id === 'servidor1' && p.to === '172.31.16.131')).toBe(false);
  });
});

describe('devices without a firewall', () => {
  it('a packet gets to them, but they open nothing', () => {
    const net = officeNet();
    expect(reachesHost(simulate(net, ping(device('your-laptop'), OFFICE.printer)))).toBe(true);
    expect(extraOpenings(net, [])).toEqual([]);
  });

  it('a udp probe to a host with no service now ends in a warning and still counts as reaching the host', () => {
    const net = officeNet();
    const probe = probePackets(net).find((packet) => packet.protocol === 'udp' && packet.from.kind === 'device' && packet.from.id === 'your-laptop' && packet.to === OFFICE.lucia);
    expect(probe).toBeDefined();
    const trace = simulate(net, probe!);
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice?.kind).toBe('port-unreachable');
    expect(reachesHost(trace)).toBe(true);
    expect(extraOpenings(net, [])).toEqual([]);
  });

  it('a host firewall that lets in more than the expected ping is an opening', () => {
    const guarded = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    const fromPrinter = { id: 'echo-printer', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE.printer}/32` } } as const;
    expect(extraOpenings(withInbound(guarded, 'fw-lucia', fromPrinter), [ping(device('your-laptop'), OFFICE.lucia)])).toEqual([ping(device('printer'), OFFICE.lucia)]);
  });
});

describe('a stopped process', () => {
  const sshFromAnyone: Rule = { id: 'ssh-all', what: { kind: 'tcp', fromPort: 22, toPort: 22 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } };
  const guardedWith = (host: Pick<Network['devices'][number], 'host'>['host']): Network => withInbound(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'], host }), 'fw-lucia', sshFromAnyone);

  it('the probe battery treats a stopped process as a closed port', () => {
    const stopped = guardedWith({ ignoreIcmpEcho: false, services: [{ ...tcpService(22), processId: 'ssh' }], processes: [{ id: 'ssh', name: 'sshd', running: false }] });
    const closed = guardedWith({ ignoreIcmpEcho: false, services: [] });
    expect(probePackets(stopped)).toEqual(probePackets(closed));
    for (const packet of probePackets(closed)) {
      const [withStopped, withClosed] = [stopped, closed].map((net) => simulate(withProbeActor(net), packet));
      expect(withStopped.outcome, JSON.stringify(packet)).toBe(withClosed.outcome);
      expect(reachesHost(withStopped), JSON.stringify(packet)).toBe(reachesHost(withClosed));
    }
    expect(extraOpenings(stopped, [])).toEqual(extraOpenings(closed, []));
    expect(extraOpenings(closed, [])).toContainEqual(tcp(device('your-laptop'), OFFICE.lucia, 22));
  });
});

describe('an office with two LANs, routers and a server of the internet', () => {
  const { floor2, server } = OFFICE_FLOORS;
  const guarded = () => withDevice(officeTwoFloorsNet(), 'andres-laptop', { firewallIds: ['fw-andres'] });
  const withFirewall = (rules: Parameters<typeof withInbound>[2][]) => ({
    ...guarded(),
    firewalls: [{ id: 'fw-andres', name: 'laptop-andres', kind: 'host-firewall' as const, inbound: rules, outbound: [] }],
  });
  const openToAll = { id: 'echo-all', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } } as const;
  const fromYou = { id: 'echo-you', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE_FLOORS.floor1.you}/32` } } as const;
  const expected = [ping(device('your-laptop'), floor2.andres)];

  it('the probe battery still finds the extra opening of an open rule in an office with two LANs', () => {
    const open = extraOpenings(withFirewall([openToAll]), expected);
    expect(open).toContainEqual(ping(device('marta-laptop'), floor2.andres));
    expect(open).toContainEqual(ping(device('lucia-laptop'), floor2.andres));
    expect(open).not.toContainEqual(expected[0]);
    expect(open.every((probe) => probe.to === floor2.andres)).toBe(true);
    expect(extraOpenings(withFirewall([fromYou]), expected)).toEqual([]);
  });

  it('a server of the internet only answers, so the battery never probes from it', () => {
    const packets = probePackets(officeTwoFloorsNet());
    expect(packets.some((probe) => probe.from.kind === 'actor' && probe.from.id === server.id)).toBe(false);
    expect(packets.some((probe) => probe.to === server.ip)).toBe(false);
  });
});

describe('a tcp rule in an office', () => {
  const SSH = 22;
  const tcpFromYou = (id: string, fromPort: number, toPort = fromPort): Rule => ({ id, what: { kind: 'tcp', fromPort, toPort }, peer: { kind: 'cidr', cidr: `${OFFICE.you}/32` } });
  const guarded = (...rules: Rule[]) =>
    withInbound(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'], host: { ignoreIcmpEcho: false, services: [tcpService(SSH)] } }), 'fw-lucia', ...rules);
  const expected = [tcp(device('your-laptop'), OFFICE.lucia, SSH)];

  it('the probe battery still finds the extra opening of a tcp rule in an office', () => {
    expect(extraOpenings(guarded(tcpFromYou('ssh', SSH)), expected)).toEqual([]);
    const extra = extraOpenings(guarded(tcpFromYou('ssh', SSH), tcpFromYou('database', 5432)), expected);
    expect(extra).toEqual([tcp(device('your-laptop'), OFFICE.lucia, 5432)]);
  });

  it('a port range of 1-1023 is caught by the probe battery through the ports 80 and 443', () => {
    const extra = extraOpenings(guarded(tcpFromYou('well-known', 1, 1023)), expected);
    expect(extra).toEqual([tcp(device('your-laptop'), OFFICE.lucia, 80), tcp(device('your-laptop'), OFFICE.lucia, 443)]);
    expect(extra.map((probe) => probe.port)).not.toContain(3306);
    expect(extra.map((probe) => probe.port)).not.toContain(5432);
  });

  it('a range that holds none of the ports the battery probes besides 22 looks exact to it', () => {
    expect(extraOpenings(guarded(tcpFromYou('around-ssh', 20, 25)), expected)).toEqual([]);
  });
});
