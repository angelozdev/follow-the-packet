import { describe, expect, it } from 'vitest';
import { deathPoint, stopStep } from './checkpoints';
import { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, tcp, withDevice, withInbound } from '@/testing';
import { simulate } from './simulate';
import type { Network } from '@/engine/network/types';

const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
const guardedOffice = (): Network => withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });

describe('lab 03 in the engine', () => {
  it('step 3: without an ICMP rule the ping dies at the entrance of servidor2 and tcpdump sees nothing', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-in', at: 'servidor2' });
    expect(trace.tcpdump).toEqual([]);
  });

  it('step 5: with Echo Request from the servidor1 SG it answers, and tcpdump sees In and Out', () => {
    const trace = simulate(withEcho(), ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.tcpdump.map((l) => `${l.deviceId} ${l.direction}`)).toEqual(['servidor2 In', 'servidor2 Out']);
  });

  it('V1: stateful; the reply returns without a rule on servidor1, but the reverse does not pass', () => {
    expect(simulate(withEcho(), ping(device('servidor1'), S2.private)).outcome).toBe('replied');
    const back = simulate(withEcho(), ping(device('servidor2'), S1.private));
    expect(back.outcome).toBe('timeout');
    expect(deathPoint(back)).toEqual({ stage: 'firewall-in', at: 'servidor1' });
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
    const firewallIn = trace.steps.find((s) => s.stage === 'firewall-in');
    expect(firewallIn?.checks?.find((c) => c.ruleId === 'echo')).toMatchObject({ what: true, from: false });
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
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-in', at: 'servidor2' });
  });

  it('V6: Linux ignores the ping; it arrives (tcpdump In) but nobody answers', () => {
    const net = withDevice(withEcho(), 'servidor2', { host: { ignoreIcmpEcho: true, listeningTcpPorts: [22] } });
    const trace = simulate(net, ping(device('servidor1'), S2.private));
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(deathPoint(trace)).toEqual({ stage: 'host', at: 'servidor2' });
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

  it('a private IP from the internet is lost in the internet, before the Internet gateway', () => {
    const trace = simulate(lab03Net(), ping(actor('attacker'), S2.private));
    expect(trace.outcome).toBe('lost');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet' });
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
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet-gateway' });
  });

  it('the outbound of the source also counts', () => {
    const net: Network = {
      ...withEcho(),
      firewalls: withEcho().firewalls.map((f) => (f.id === 'sg-servidor1' ? { ...f, outbound: [] } : f)),
    };
    const trace = simulate(net, ping(device('servidor1'), S2.private));
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-out', at: 'servidor1' });
  });

  it('an unknown name does not resolve', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), 'no-existe.example'));
    expect(trace.outcome).toBe('unresolved');
    expect(deathPoint(trace)).toEqual({ stage: 'dns', at: 'servidor1' });
  });
});

describe('lost packets and a device that pings itself', () => {
  it('an IP of the office that no device has: the packet is lost in the network', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), OFFICE.nobody));
    expect(trace.outcome).toBe('lost');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'office', verdict: 'drop', reason: { code: 'route-no-device', ip: OFFICE.nobody } }]);
  });

  it('a private IP from the internet: the packet is lost in the internet, before the router', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), OFFICE.you));
    expect(trace.outcome).toBe('lost');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'internet', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: OFFICE.you } }]);
  });

  it('a public IP that no device has stops at the edge of the network: the router of an office', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), '34.244.254.100'));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'router' });
  });

  it('a private IP outside the network range is lost in the internet too', () => {
    const trace = simulate(officeNet(), ping(actor('attacker'), '10.0.0.5'));
    expect(trace.outcome).toBe('lost');
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'internet' });
  });

  it('a device that pings its own IP answers itself without the packet going out to the network', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), OFFICE.you));
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe('your-laptop');
    expect(trace.steps.map((step) => [step.stage, step.reason.code])).toEqual([
      ['route', 'route-self'],
      ['host', 'host-replies'],
      ['reply', 'reply-stateful'],
    ]);
  });

  it('an EC2 instance that pings its own private IP answers even with no inbound rule', () => {
    const trace = simulate(lab03Net(), ping(device('servidor2'), S2.private));
    expect(trace.outcome).toBe('replied');
    expect(trace.steps.filter((step) => step.stage === 'firewall-in' || step.stage === 'firewall-out')).toEqual([]);
  });
});

describe('devices and their firewalls', () => {
  it('a device without a firewall receives everything: an Echo Reply arrives and nobody answers it', () => {
    const trace = simulate(officeNet(), { from: device('your-laptop'), to: OFFICE.lucia, protocol: 'icmp', icmpType: 0 });
    expect(trace.outcome).toBe('arrived-no-reply');
    expect(trace.steps.map((step) => step.stage)).toEqual(['route', 'host']);
    expect(stopStep(trace)?.reason).toEqual({ code: 'host-unsolicited-icmp', deviceId: 'lucia-laptop', icmpType: 0 });
  });

  it('a host firewall without inbound rules blocks the ping, and its step names its kind', () => {
    const trace = simulate(guardedOffice(), ping(device('your-laptop'), OFFICE.lucia));
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-in', at: 'lucia-laptop' });
    expect(stopStep(trace)?.reason).toEqual({ code: 'firewall-in-drop', deviceId: 'lucia-laptop', firewallKind: 'host-firewall' });
  });

  it('a host firewall rule for Echo Request from your laptop lets the ping in, and the reply comes back', () => {
    const fromYou = { id: 'echo-you', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE.you}/32` } } as const;
    expect(simulate(withInbound(guardedOffice(), 'fw-lucia', fromYou), ping(device('your-laptop'), OFFICE.lucia)).outcome).toBe('replied');
  });

  it('a Security Group step names its kind too', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), S2.private));
    expect(stopStep(trace)?.reason).toEqual({ code: 'firewall-in-drop', deviceId: 'servidor2', firewallKind: 'security-group' });
  });
});
