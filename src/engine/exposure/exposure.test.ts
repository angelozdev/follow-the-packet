import { describe, expect, it } from 'vitest';
import { extraOpenings, flowKey, probePackets } from './exposure';
import { actor, echoFrom, inst, lab03Net, ping, tcp, withInbound } from '@/testing';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const expected = [
  ping(inst('servidor1'), S2.private),
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
    expect(extra).toContainEqual({ from: inst('servidor1'), to: S2.private, protocol: 'icmp', icmpType: 0 });
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
    expect(flowKey(net, ping(inst('servidor1'), S2.private))).toBe('instance:servidor1@172.31.16.131>servidor2@172.31.38.97:icmp:8');
  });

  it('a DNS name and the IP it resolves to are the same flow', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const byName = flowKey(net, ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(byName).toBe(flowKey(net, ping(inst('servidor1'), S2.private)));
  });
});

describe('extraOpenings by path', () => {
  it('an allowed private-IP flow does not hide an opening on the public path', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'), {
      id: 'servidor1-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: '54.78.154.66/32' },
    });
    const extra = extraOpenings(net, [ping(inst('servidor1'), S2.private)]);
    expect(extra).toContainEqual(ping(inst('servidor1'), S2.public));
  });

  it('a flow expected by DNS name is not an opening on its own IP', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const expectedByName = [
      ping(inst('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'),
      tcp(actor('you'), '54.78.154.66', 22),
      tcp(actor('you'), S2.public, 22),
    ];
    expect(extraOpenings(net, expectedByName)).toEqual([]);
  });
});

describe('probePackets', () => {
  it('an instance is not probed from itself', () => {
    const packets = probePackets(lab03Net());
    expect(packets.some((p) => p.from.kind === 'instance' && p.from.id === 'servidor1' && p.to === '172.31.16.131')).toBe(false);
  });
});
