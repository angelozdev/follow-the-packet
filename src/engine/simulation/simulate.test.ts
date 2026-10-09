import { describe, expect, it } from 'vitest';
import { deathPoint } from './checkpoints';
import { actor, device, echoFrom, lab03Net, ping, tcp, withDevice, withInbound } from '@/testing';
import { simulate } from './simulate';
import type { Network } from '@/engine/network/types';

const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));

describe('lab 03 in the engine', () => {
  it('step 3: without an ICMP rule the ping dies at the entrance of servidor2 and tcpdump sees nothing', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
    expect(trace.tcpdump).toEqual([]);
  });

  it('step 5: with Echo Request from the servidor1 SG it answers, and tcpdump sees In and Out', () => {
    const trace = simulate(withEcho(), ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.tcpdump.map((l) => `${l.instanceId} ${l.direction}`)).toEqual(['servidor2 In', 'servidor2 Out']);
  });

  it('V1: stateful; the reply returns without a rule on servidor1, but the reverse does not pass', () => {
    expect(simulate(withEcho(), ping(device('servidor1'), S2.private)).outcome).toBe('replied');
    const back = simulate(withEcho(), ping(device('servidor2'), S1.private));
    expect(back.outcome).toBe('timeout');
    expect(deathPoint(back)).toEqual({ stage: 'sg-in', at: 'servidor1' });
  });

  it('V5: an Echo Reply rule does not let a ping in', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', echoFrom('reply', 'sg-servidor1', 0));
    expect(simulate(net, ping(device('servidor1'), S2.private)).outcome).toBe('timeout');
  });

  it('V2: over the public IP the source changes (NAT) and the rule with a security group as source does not match', () => {
    const trace = simulate(withEcho(), ping(device('servidor1'), S2.public));
    expect(trace.steps.some((s) => s.stage === 'nat')).toBe(true);
    expect(trace.effectiveSource).toBe(S1.public);
    expect(trace.outcome).toBe('timeout');
    const sgIn = trace.steps.find((s) => s.stage === 'sg-in');
    expect(sgIn?.checks?.find((c) => c.ruleId === 'echo')).toMatchObject({ what: true, from: false });
  });

  it('V2: with the public IP of servidor1 as /32 source, it does pass over the public path', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'echo-public',
      what: { kind: 'icmp', icmpType: 8 },
      peer: { kind: 'cidr', cidr: `${S1.public}/32` },
    });
    expect(simulate(net, ping(device('servidor1'), S2.public)).outcome).toBe('replied');
  });

  it('V3: the public name from inside resolves to the private IP and answers', () => {
    const trace = simulate(withEcho(), ping(device('servidor1'), 'ec2-34-244-254-100.eu-west-1.compute.amazonaws.com'));
    expect(trace.resolvedIp).toBe(S2.private);
    expect(trace.outcome).toBe('replied');
  });

  it('V4: the ping from your Mac to the public IP is dropped even though your IP has SSH', () => {
    const trace = simulate(withEcho(), ping(actor('you'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'sg-in', at: 'servidor2' });
  });

  it('V6: Linux ignores the ping; it arrives (tcpdump In) but nobody answers', () => {
    const net = withDevice(withEcho(), 'servidor2', { host: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } });
    const trace = simulate(net, ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(deathPoint(trace)).toEqual({ stage: 'linux', at: 'servidor2' });
    expect(trace.tcpdump.map((l) => l.direction)).toEqual(['In']);
  });

  it('TCP to a port with no program listening: connection refused', () => {
    const net = withInbound(lab03Net(), 'sg-servidor2', {
      id: 'web',
      what: { kind: 'tcp', fromPort: 80, toPort: 80 },
      peer: { kind: 'sg', sgId: 'sg-servidor1' },
    });
    const trace = simulate(net, tcp(device('servidor1'), S2.private, 80));
    expect(trace.outcome).toBe('refused');
    expect(trace.tcpdump.map((l) => l.summary)).toEqual(['TCP 80', 'TCP 80 RST']);
  });

  it('a private IP from the internet has no path: timeout at the internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('V8: the default security group only lets its members in', () => {
    const onlyServer2 = withDevice(lab03Net(), 'servidor2', { firewallIds: ['sg-servidor2', 'sg-default'] });
    expect(simulate(onlyServer2, ping(device('servidor1'), S2.private)).outcome).toBe('timeout');
    const both = withDevice(onlyServer2, 'servidor1', { firewallIds: ['sg-servidor1', 'sg-default'] });
    expect(simulate(both, ping(device('servidor1'), S2.private)).outcome).toBe('replied');
  });

  it('without a public IP there is no way out to the internet', () => {
    const net = withDevice(withEcho(), 'servidor1', { publicIp: undefined });
    const trace = simulate(net, ping(device('servidor1'), S2.public));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'igw' });
  });

  it('the outbound of the source also counts', () => {
    const net: Network = {
      ...withEcho(),
      firewalls: withEcho().firewalls.map((f) => (f.id === 'sg-servidor1' ? { ...f, outbound: [] } : f)),
    };
    const trace = simulate(net, ping(device('servidor1'), S2.private));
    expect(deathPoint(trace)).toEqual({ stage: 'sg-out', at: 'servidor1' });
  });

  it('an unknown name does not resolve', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), 'no-existe.example'));
    expect(trace.outcome).toBe('unresolved');
    expect(deathPoint(trace)).toEqual({ stage: 'dns', at: 'servidor1' });
  });
});
