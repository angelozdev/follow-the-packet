import { describe, expect, it } from 'vitest';
import { deathPoint, stopStep } from '@/engine/simulation/paths/checkpoints';
import { NAME_SERVER_PIECES, OFFICE, OFFICE_FLOORS, actor, allOut, device, dig, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, officeWithNames, ping, tcp, tcpService, withDevice, withInbound } from '@/testing';
import { simulate } from './simulate';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import { applyAction, type NetworkAction } from '@/engine/network/actions';
import { privateDnsName, publicDnsName } from '@/engine/network/naming/dns';
import type { Firewall, Network, PacketSpec, Route, Rule } from '@/engine/network/types';
import type { Trace } from './trace';

const S1 = { private: '172.31.16.131', public: '54.78.154.66' };
const S2 = { private: '172.31.38.97', public: '34.244.254.100' };
const VPC_NOBODY = '172.31.38.200';
const withEcho = (): Network => withInbound(lab03Net(), 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
const guardedOffice = (): Network => withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
const closedOffice = (): Network => {
  const office = guardedOffice();
  return { ...office, firewalls: office.firewalls.map((f) => ({ ...f, outbound: [] })) };
};
const codes = (trace: Trace): string[] => trace.steps.map((step) => step.reason.code);

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
    const net = withDevice(withEcho(), 'servidor2', { host: { ignoreIcmpEcho: true, services: [tcpService(22)] } });
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
  it('an IP of the office that no device has gives a host-unreachable warning from the sender', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), OFFICE.nobody));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'host-unreachable', fromId: 'your-laptop', fromIp: OFFICE.you });
    expect(trace.steps).toEqual([
      { stage: 'route', at: 'office', verdict: 'pass', reason: { code: 'route-private' } },
      { stage: 'forward', at: 'your-laptop', verdict: 'drop', reason: { code: 'forward-no-owner', deviceId: 'your-laptop', ip: OFFICE.nobody, viaGateway: false } },
    ]);
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

describe('outbound rules of a device', () => {
  const SEALED_FIREWALLS = { 'your-laptop': 'fw-you', 'lucia-laptop': 'fw-lucia' } as const;
  const echoRule = (id: string, peerIp: string): Rule => ({ id, what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${peerIp}/32` } });
  const sealedOffice = (): Network => {
    const guarded = Object.entries(SEALED_FIREWALLS).reduce((net, [deviceId, firewallId]) => withDevice(net, deviceId, { firewallIds: [firewallId] }), officeNet());
    const sealed = (id: string): Firewall => ({ id, name: id, kind: 'host-firewall', inbound: [], outbound: [] });
    return { ...guarded, firewalls: Object.values(SEALED_FIREWALLS).map(sealed) };
  };
  const toLucia = (): PacketSpec => ping(device('your-laptop'), OFFICE.lucia);

  it('an outbound rule for the destination lets the ping leave and the reply is not filtered', () => {
    const stopped = simulate(sealedOffice(), toLucia());
    expect(deathPoint(stopped)).toEqual({ stage: 'firewall-out', at: 'your-laptop' });

    const open = [
      { type: 'addRule', firewallId: 'fw-you', rule: echoRule('echo-to-lucia', OFFICE.lucia), direction: 'outbound' },
      { type: 'addRule', firewallId: 'fw-lucia', rule: echoRule('echo-from-you', OFFICE.you) },
    ] satisfies NetworkAction[];
    const trace = simulate(open.reduce(applyAction, sealedOffice()), toLucia());
    expect(trace.outcome).toBe('replied');
    const firewallSteps = trace.steps.filter((step) => step.stage === 'firewall-in' || step.stage === 'firewall-out');
    expect(firewallSteps.map((step) => [step.stage, step.at, step.verdict])).toEqual([
      ['firewall-out', 'your-laptop', 'pass'],
      ['firewall-in', 'lucia-laptop', 'pass'],
    ]);
    expect(firewallSteps[0].checks).toEqual([{ firewallId: 'fw-you', ruleId: 'echo-to-lucia', what: true, from: true }]);
    expect(trace.steps.slice(trace.steps.findIndex((step) => step.stage === 'host')).map((step) => step.stage)).toEqual(['host', 'reply']);
  });

  it('an inbound rule on the sender does not let the packet out', () => {
    const net = applyAction(sealedOffice(), { type: 'addRule', firewallId: 'fw-you', rule: echoRule('echo-to-lucia', OFFICE.lucia) });
    const trace = simulate(net, toLucia());
    expect(trace.outcome).toBe('timeout');
    expect(deathPoint(trace)).toEqual({ stage: 'firewall-out', at: 'your-laptop' });
    expect(stopStep(trace)?.reason).toEqual({ code: 'firewall-out-drop', deviceId: 'your-laptop', firewallKind: 'host-firewall' });
    expect(stopStep(trace)?.checks).toEqual([]);
    expect(trace.steps.some((step) => step.stage === 'forward')).toBe(false);
  });
});

describe('addresses, localhost and loopback', () => {
  it.each(['192.168.1.300', '256.0.0.1', '10.0.0.1000', '1234.1.1.1'])(
    'an address with a number above 255 never leaves the device and is not looked up as a name: %s',
    (address) => {
      const trace = simulate(officeNet(), ping(device('your-laptop'), address));
      expect(trace.outcome).toBe('invalid-address');
      expect(trace.steps).toEqual([{ stage: 'address', at: 'your-laptop', verdict: 'drop', reason: { code: 'address-invalid', address } }]);
      expect(trace.steps.some((step) => step.stage === 'dns')).toBe(false);
      expect(deathPoint(trace)).toEqual({ stage: 'address', at: 'your-laptop' });
      expect([trace.resolvedIp, trace.destinationId, trace.tcpdump]).toEqual([null, null, []]);
    },
  );

  it('an invalid address is invalid in a VPC too, from a device and from the internet', () => {
    expect(simulate(lab03Net(), ping(device('servidor1'), '172.31.38.300')).outcome).toBe('invalid-address');
    expect(simulate(lab03Net(), ping(actor('attacker'), '54.78.154.300')).outcome).toBe('invalid-address');
  });

  it('an address with the wrong number of groups is a name, not an invalid address', () => {
    for (const net of [officeNet(), lab03Net()]) {
      const trace = simulate(net, ping(device(net.devices[0].id), '192.168.1'));
      expect(trace.outcome).toBe('unresolved');
      expect(codes(trace)).toEqual(['dns-unresolved']);
    }
  });

  it('a valid address and a name write no step of the address stage', () => {
    expect(simulate(officeNet(), ping(device('your-laptop'), OFFICE.printer)).steps.some((step) => step.stage === 'address')).toBe(false);
    expect(simulate(lab03Net(), ping(device('servidor1'), 'no-existe.example')).steps.some((step) => step.stage === 'address')).toBe(false);
  });

  it('localhost resolves to loopback without asking the DNS', () => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), 'localhost'));
    expect(trace.outcome).toBe('replied');
    expect(trace.resolvedIp).toBe('127.0.0.1');
    expect(codes(trace).slice(0, 2)).toEqual(['address-localhost', 'route-loopback']);
    expect(trace.steps.some((step) => step.stage === 'dns')).toBe(false);
    expect(simulate(lab03Net(), ping(device('servidor1'), 'localhost')).outcome).toBe('replied');
  });

  it.each(['127.0.0.1', '127.5.5.5', '127.255.255.254'])('127.0.0.1 and any other 127 address answer from the same device: %s', (address) => {
    const trace = simulate(officeNet(), ping(device('your-laptop'), address));
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe('your-laptop');
    expect(trace.steps[0]).toEqual({ stage: 'route', at: 'your-laptop', verdict: 'pass', reason: { code: 'route-loopback', deviceId: 'your-laptop', ip: address } });
    expect(codes(trace)).toEqual(['route-loopback', 'host-replies', 'reply-stateful']);
  });

  it('a loopback ping skips both firewalls of the device', () => {
    const outside = simulate(closedOffice(), ping(device('lucia-laptop'), OFFICE.printer));
    expect(deathPoint(outside)).toEqual({ stage: 'firewall-out', at: 'lucia-laptop' });
    for (const address of ['127.0.0.1', 'localhost']) {
      const trace = simulate(closedOffice(), ping(device('lucia-laptop'), address));
      expect(trace.outcome).toBe('replied');
      expect(trace.steps.filter((step) => step.stage === 'firewall-in' || step.stage === 'firewall-out')).toEqual([]);
    }
  });

  it('the steps of a ping to your own IP stay as they were', () => {
    const trace = simulate(lab03Net(), ping(device('servidor2'), S2.private));
    expect(trace.steps).toEqual([
      { stage: 'route', at: 'servidor2', verdict: 'pass', reason: { code: 'route-self', deviceId: 'servidor2' } },
      { stage: 'host', at: 'servidor2', verdict: 'pass', reason: { code: 'host-replies', deviceId: 'servidor2' } },
      { stage: 'reply', at: 'servidor2', verdict: 'pass', reason: { code: 'reply-stateful', deviceId: 'servidor2' } },
    ]);
    expect([trace.resolvedIp, trace.destinationId, trace.effectiveSource]).toEqual([S2.private, 'servidor2', S2.private]);
  });
});

describe('delivery in the local network and through the default gateway', () => {
  const { floor1, floor2 } = OFFICE_FLOORS;
  const floors = (): Network => officeTwoFloorsNet();
  const withGateway = (deviceId: string, gateway: string | undefined): Network => withDevice(floors(), deviceId, { gateway });
  const routerIds = (net: Network): string[] => (net.routers ?? []).map((router) => router.id);
  const noticeKeys = (trace: Trace): string[] => Object.keys(trace).filter((key) => key === 'notice' || key === 'hops');

  it('a device on the same LAN is reached directly, with no router and no hop', () => {
    for (const net of [floors(), withGateway('your-laptop', undefined)]) {
      const trace = simulate(net, ping(device('your-laptop'), floor1.lucia));
      expect(trace.outcome).toBe('replied');
      expect(trace.destinationId).toBe('lucia-laptop');
      expect(codes(trace)).toEqual(['route-private', 'host-replies', 'reply-stateful']);
      expect(trace.steps.filter((step) => routerIds(net).includes(step.at))).toEqual([]);
      expect(noticeKeys(trace)).toEqual([]);
    }
  });

  it('an IP no device of the LAN has gives a host-unreachable warning from the sender itself', () => {
    const trace = simulate(floors(), ping(device('your-laptop'), floor1.nobody));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'host-unreachable', fromId: 'your-laptop', fromIp: floor1.you });
    expect(codes(trace)).toEqual(['route-private', 'forward-no-owner']);
    expect(stopStep(trace)).toEqual({
      stage: 'forward',
      at: 'your-laptop',
      verdict: 'drop',
      reason: { code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: false },
    });
    expect([trace.destinationId, trace.tcpdump]).toEqual([null, []]);
  });

  it('an IP of another LAN with no gateway set stops at the sender with no-route and no warning', () => {
    const trace = simulate(withGateway('your-laptop', undefined), ping(device('your-laptop'), floor2.andres));
    expect(trace.outcome).toBe('no-route');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'your-laptop', verdict: 'drop', reason: { code: 'route-no-gateway', deviceId: 'your-laptop', ip: floor2.andres } }]);
    expect(deathPoint(trace)).toEqual({ stage: 'route', at: 'your-laptop' });
    expect([trace.destinationId, trace.tcpdump, noticeKeys(trace)]).toEqual([null, [], []]);
  });

  it('a device that is not connected neither sends nor receives', () => {
    const sends = simulate(floors(), ping(device('guest-laptop'), floor1.lucia));
    expect(sends.outcome).toBe('no-route');
    expect(sends.steps).toEqual([{ stage: 'route', at: 'guest-laptop', verdict: 'drop', reason: { code: 'route-not-connected', deviceId: 'guest-laptop' } }]);
    expect(noticeKeys(sends)).toEqual([]);

    const receives = simulate(floors(), ping(device('your-laptop'), floor1.guest));
    expect(receives.outcome).toBe('unreachable');
    expect(receives.notice).toEqual({ kind: 'host-unreachable', fromId: 'your-laptop', fromIp: floor1.you });
    expect(receives.destinationId).toBeNull();
  });

  it('a device that is not connected still answers itself, because that packet never leaves it', () => {
    const trace = simulate(floors(), ping(device('guest-laptop'), floor1.guest));
    expect(trace.outcome).toBe('replied');
    expect(codes(trace)).toEqual(['route-self', 'host-replies', 'reply-stateful']);
  });

  it('a gateway IP that no device has gives a host-unreachable warning from the sender', () => {
    const trace = simulate(withGateway('your-laptop', floor1.nobody), ping(device('your-laptop'), floor2.andres));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'host-unreachable', fromId: 'your-laptop', fromIp: floor1.you });
    expect(stopStep(trace)?.reason).toEqual({ code: 'forward-no-owner', deviceId: 'your-laptop', ip: floor1.nobody, viaGateway: true });
    expect(trace.destinationId).toBeNull();
  });

  it('a gateway that is a printer receives the packet and drops it, so nothing comes back', () => {
    const trace = simulate(withGateway('your-laptop', floor1.printer), ping(device('your-laptop'), floor2.andres));
    expect(trace.outcome).toBe('timeout');
    expect(stopStep(trace)).toEqual({
      stage: 'forward',
      at: 'printer',
      verdict: 'drop',
      reason: { code: 'route-gateway-not-a-router', deviceId: 'printer', ip: floor1.printer },
    });
    expect(deathPoint(trace)).toEqual({ stage: 'forward', at: 'printer' });
    expect([trace.destinationId, trace.tcpdump, noticeKeys(trace)]).toEqual([null, [], []]);
    expect(trace.steps.some((step) => step.stage === 'host' || step.stage === 'reply')).toBe(false);
  });

  it('an outbound firewall silences a packet to an IP nobody has, so the sender never warns', () => {
    const silenced = simulate(closedOffice(), ping(device('lucia-laptop'), OFFICE.nobody));
    expect(silenced.outcome).toBe('timeout');
    expect(deathPoint(silenced)).toEqual({ stage: 'firewall-out', at: 'lucia-laptop' });
    expect(silenced.steps.some((step) => step.stage === 'forward')).toBe(false);
    expect(noticeKeys(silenced)).toEqual([]);

    const open = simulate(guardedOffice(), ping(device('lucia-laptop'), OFFICE.nobody));
    expect(open.outcome).toBe('unreachable');
    expect(open.notice).toEqual({ kind: 'host-unreachable', fromId: 'lucia-laptop', fromIp: OFFICE.lucia });
  });

  it('a packet to a device of another LAN goes through the router of its gateway', () => {
    const trace = simulate(floors(), ping(device('your-laptop'), floor2.andres));
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe('andres-laptop');
    expect(trace.effectiveSource).toBe(floor1.you);
    expect(codes(trace)).toEqual(['route-private', 'forward-hop', 'host-replies', 'reply-stateful']);
    expect(trace.hops).toEqual([{ routerId: OFFICE_FLOORS.officeRouter.id, ip: floor1.gateway, ttlLeft: 63 }]);
    expect(trace).not.toHaveProperty('notice');

    const throughPrinter = simulate(withGateway('your-laptop', floor1.printer), ping(device('your-laptop'), floor2.andres));
    expect(throughPrinter.outcome).not.toBe('replied');

    const net = floors();
    const cut: Network = { ...net, routers: (net.routers ?? []).map((router) => ({ ...router, interfaces: router.interfaces.filter((face) => face.faces !== floor2.id) })) };
    const unrouted = simulate(cut, ping(device('your-laptop'), floor2.andres));
    expect(unrouted.outcome).not.toBe('replied');
    expect(unrouted.destinationId).toBeNull();
  });

  it('a packet from the other floor crosses the same router the other way', () => {
    const trace = simulate(floors(), ping(device('andres-laptop'), floor1.you));
    expect(trace.outcome).toBe('replied');
    expect(trace.destinationId).toBe('your-laptop');
  });

  it('the VPC keeps saying lost for an IP no instance has', () => {
    const trace = simulate(lab03Net(), ping(device('servidor1'), VPC_NOBODY));
    expect(trace.outcome).toBe('lost');
    expect(trace.steps).toEqual([{ stage: 'route', at: 'vpc', verdict: 'drop', reason: { code: 'route-no-device', ip: VPC_NOBODY } }]);
    expect(noticeKeys(trace)).toEqual([]);
  });
});

describe('routers, TTL, warnings and the internet', () => {
  const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
  const floors = (): Network => officeTwoFloorsNet();
  const toServer = (ttl?: number): PacketSpec => ({ ...ping(device('your-laptop'), server.ip), ...(ttl !== undefined && { ttl }) });
  const pingWithTtl = (from: string, to: string, ttl: number): PacketSpec => ({ ...ping(device(from), to), ttl });
  const withRoutes = (net: Network, routerId: string, routes: Route[]): Network => applyAction(net, { type: 'updateRouter', routerId, routes });
  const loopNet = (): Network => withRoutes(floors(), provider.id, [{ to: ROUTE_DEFAULT, next: officeRouter.id }]);
  const silent = (net: Network, routerId: string): Network => applyAction(net, { type: 'updateRouter', routerId, sendsUnreachable: false });
  const echoRule = (id: string): Rule => ({ id, what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: '0.0.0.0/0' } });
  const guarded = (): Network => {
    const net = withDevice(withDevice(floors(), 'your-laptop', { firewallIds: ['fw-source'] }), 'andres-laptop', { firewallIds: ['fw-destination'] });
    return {
      ...net,
      firewalls: [
        { id: 'fw-source', name: 'fw-source', kind: 'host-firewall', inbound: [], outbound: [echoRule('echo-out')] },
        { id: 'fw-destination', name: 'fw-destination', kind: 'host-firewall', inbound: [echoRule('echo-in')], outbound: [] },
      ],
    };
  };

  it('each router the packet crosses takes one from the TTL', () => {
    const trace = simulate(floors(), toServer());
    expect(trace.hops).toEqual([
      { routerId: officeRouter.id, ip: floor1.gateway, ttlLeft: 63 },
      { routerId: provider.id, ip: provider.towardOffice, ttlLeft: 62 },
      { routerId: backbone.id, ip: backbone.towardProvider, ttlLeft: 61 },
    ]);
    const crossed = trace.steps.filter((step) => step.stage === 'forward');
    expect(crossed.map((step) => [step.at, step.verdict, step.reason])).toEqual(
      (trace.hops ?? []).map((hop) => [hop.routerId, 'pass', { code: 'forward-hop', routerId: hop.routerId, ip: hop.ip, ttlLeft: hop.ttlLeft }]),
    );
    expect(simulate(floors(), toServer(10)).hops?.map((hop) => hop.ttlLeft)).toEqual([9, 8, 7]);
    expect(simulate(floors(), ping(device('andres-laptop'), floor1.you)).hops).toEqual([{ routerId: officeRouter.id, ip: floor2.gateway, ttlLeft: 63 }]);
  });

  it('a packet whose TTL reaches zero at a router is discarded and that router warns with Time Exceeded from its interface towards the sender', () => {
    const trace = simulate(floors(), pingWithTtl('your-laptop', server.ip, 1));
    expect(trace.outcome).toBe('ttl-exceeded');
    expect(trace.notice).toEqual({ kind: 'time-exceeded', fromId: officeRouter.id, fromIp: floor1.gateway });
    expect(stopStep(trace)).toEqual({
      stage: 'forward',
      at: officeRouter.id,
      verdict: 'drop',
      reason: { code: 'forward-ttl-exceeded', routerId: officeRouter.id, ip: floor1.gateway },
    });
    expect(deathPoint(trace)).toEqual({ stage: 'forward', at: officeRouter.id });
    expect(trace.hops).toEqual([{ routerId: officeRouter.id, ip: floor1.gateway, ttlLeft: 0 }]);
    expect([trace.destinationId, trace.tcpdump]).toEqual([null, []]);
    expect(trace.steps.some((step) => step.stage === 'host' || step.stage === 'reply')).toBe(false);

    const fromOtherFloor = simulate(floors(), pingWithTtl('andres-laptop', server.ip, 1));
    expect(fromOtherFloor.notice).toEqual({ kind: 'time-exceeded', fromId: officeRouter.id, fromIp: floor2.gateway });

    const second = simulate(floors(), pingWithTtl('your-laptop', server.ip, 2));
    expect(second.notice).toEqual({ kind: 'time-exceeded', fromId: provider.id, fromIp: provider.towardOffice });
  });

  it('with TTL 1 the first router warns; with TTL 2 the second', () => {
    const warner = (ttl: number): string | undefined => simulate(floors(), pingWithTtl('your-laptop', server.ip, ttl)).notice?.fromId;
    expect([1, 2, 3].map(warner)).toEqual([officeRouter.id, provider.id, backbone.id]);
    const reaches = simulate(floors(), pingWithTtl('your-laptop', server.ip, 4));
    expect([reaches.outcome, reaches.destinationId]).toEqual(['replied', server.id]);
    expect(simulate(floors(), pingWithTtl('your-laptop', server.ip, 3)).outcome).toBe('ttl-exceeded');
  });

  it('in a loop between two routers the router that discards alternates with the TTL', () => {
    const loop = loopNet();
    const notices = [1, 2, 3, 4, 5, 6].map((ttl) => simulate(loop, pingWithTtl('your-laptop', server.ip, ttl)).notice);
    expect(notices.map((notice) => notice?.fromId)).toEqual([officeRouter.id, provider.id, officeRouter.id, provider.id, officeRouter.id, provider.id]);
    expect(notices.map((notice) => notice?.fromIp)).toEqual([floor1.gateway, provider.towardOffice, floor1.gateway, provider.towardOffice, floor1.gateway, provider.towardOffice]);

    const long = simulate(loop, toServer());
    expect(long.outcome).toBe('ttl-exceeded');
    expect(long.notice?.fromId).toBe(provider.id);
    expect(long.hops).toHaveLength(64);
    expect(long.hops?.map((hop) => hop.ttlLeft).slice(-2)).toEqual([1, 0]);
    expect(long.destinationId).toBeNull();
  });

  it('a ping to a server of the internet crosses every router and the server answers', () => {
    const trace = simulate(floors(), toServer());
    expect(trace.outcome).toBe('replied');
    expect([trace.resolvedIp, trace.destinationId, trace.effectiveSource]).toEqual([server.ip, server.id, floor1.you]);
    expect(codes(trace)).toEqual(['route-leaves-office', 'forward-hop', 'forward-hop', 'forward-hop', 'host-replies', 'reply-stateful']);
    expect(trace.steps.filter((step) => step.stage === 'host' || step.stage === 'reply').map((step) => step.at)).toEqual([server.id, server.id]);
    expect(trace.tcpdump).toEqual([]);
    expect(trace).not.toHaveProperty('notice');

    const fromOtherFloor = simulate(floors(), ping(device('andres-laptop'), server.ip));
    expect([fromOtherFloor.outcome, fromOtherFloor.destinationId]).toEqual(['replied', server.id]);
    expect(simulate(floors(), { ...toServer(), protocol: 'tcp', port: 80, icmpType: undefined }).outcome).toBe('refused');
  });

  it('a private address is dropped by the first router outside the office, with no warning', () => {
    for (const privateIp of ['10.0.0.10', '172.16.4.4', '192.168.99.5']) {
      const trace = simulate(floors(), ping(device('your-laptop'), privateIp));
      expect(trace.outcome).toBe('timeout');
      expect(stopStep(trace)).toEqual({
        stage: 'forward',
        at: provider.id,
        verdict: 'drop',
        reason: { code: 'forward-private-dropped', routerId: provider.id, ip: privateIp },
      });
      expect(trace).not.toHaveProperty('notice');
      expect(trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);
      expect([trace.destinationId, trace.tcpdump]).toEqual([null, []]);
    }
    const loud = simulate(loopNet(), ping(device('your-laptop'), '10.0.0.10'));
    expect(stopStep(loud)?.reason.code).toBe('forward-private-dropped');
  });

  it('a router with no route stays silent or warns, depending on its setting', () => {
    const warns = simulate(floors(), ping(device('your-laptop'), '8.8.8.8'));
    expect(warns.outcome).toBe('unreachable');
    expect(warns.notice).toEqual({ kind: 'net-unreachable', fromId: provider.id, fromIp: provider.towardOffice });
    expect(stopStep(warns)).toEqual({
      stage: 'forward',
      at: provider.id,
      verdict: 'drop',
      reason: { code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: true },
    });
    expect(warns.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);

    const stays = simulate(silent(floors(), provider.id), ping(device('your-laptop'), '8.8.8.8'));
    expect(stays.outcome).toBe('timeout');
    expect(stays).not.toHaveProperty('notice');
    expect(stopStep(stays)?.reason).toEqual({ code: 'forward-no-route', routerId: provider.id, ip: '8.8.8.8', warns: false });

    const noDefault = withRoutes(floors(), officeRouter.id, []);
    const first = simulate(noDefault, ping(device('your-laptop'), server.ip));
    expect(first.notice).toEqual({ kind: 'net-unreachable', fromId: officeRouter.id, fromIp: floor1.gateway });

    const broken = withRoutes(floors(), provider.id, [{ to: floors().cidr, next: officeRouter.id }]);
    const brokenTrace = simulate(silent(broken, provider.id), toServer());
    expect(brokenTrace.outcome).toBe('timeout');
    expect(simulate(silent(broken, provider.id), pingWithTtl('your-laptop', server.ip, 2)).notice?.fromId).toBe(provider.id);
  });

  it('an IP no server has, behind the last router, gets a host-unreachable warning from that router', () => {
    const nobody = '198.51.100.77';
    const trace = simulate(floors(), ping(device('your-laptop'), nobody));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'host-unreachable', fromId: backbone.id, fromIp: backbone.towardProvider });
    expect(stopStep(trace)).toEqual({
      stage: 'forward',
      at: backbone.id,
      verdict: 'drop',
      reason: { code: 'forward-no-host', routerId: backbone.id, ip: nobody, warns: true },
    });
    expect(trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(trace.destinationId).toBeNull();

    const quiet = simulate(silent(floors(), backbone.id), ping(device('your-laptop'), nobody));
    expect(quiet.outcome).toBe('timeout');
    expect(quiet).not.toHaveProperty('notice');

    const otherFloor = simulate(floors(), ping(device('your-laptop'), '192.168.2.99'));
    expect(otherFloor.notice).toEqual({ kind: 'host-unreachable', fromId: officeRouter.id, fromIp: floor1.gateway });
    expect(stopStep(otherFloor)?.reason).toEqual({ code: 'forward-no-host', routerId: officeRouter.id, ip: '192.168.2.99', warns: true });

    for (const elsewhere of ['8.8.8.8', '10.0.0.10']) {
      expect(simulate(floors(), ping(device('your-laptop'), elsewhere)).notice?.fromId).not.toBe(backbone.id);
    }
  });

  it('the trip out of the office has no step and no reason that names NAT or the public IP', () => {
    const named = /\bnat\b|public/;
    const traces = [toServer(), pingWithTtl('your-laptop', server.ip, 1), pingWithTtl('your-laptop', server.ip, 3), ping(device('your-laptop'), '10.0.0.10'), ping(device('your-laptop'), '8.8.8.8')].map((packet) =>
      simulate(floors(), packet),
    );
    for (const trace of traces) {
      expect(trace.steps.filter((step) => step.stage === 'nat')).toEqual([]);
      expect(JSON.stringify(trace.steps)).not.toMatch(named);
      expect(trace.effectiveSource).toBe(floor1.you);
    }
  });

  it('a router answers the ping sent to one of its own interfaces', () => {
    const gateway = simulate(floors(), ping(device('your-laptop'), floor1.gateway));
    expect(gateway.outcome).toBe('replied');
    expect([gateway.resolvedIp, gateway.destinationId]).toEqual([floor1.gateway, officeRouter.id]);
    expect(codes(gateway)).toEqual(['route-private', 'forward-router-replies', 'reply-stateful']);
    expect(gateway.steps[1]).toEqual({ stage: 'host', at: officeRouter.id, verdict: 'pass', reason: { code: 'forward-router-replies', routerId: officeRouter.id, ip: floor1.gateway } });
    expect(gateway).not.toHaveProperty('hops');
    expect(gateway.tcpdump).toEqual([]);

    expect(simulate(floors(), pingWithTtl('your-laptop', floor1.gateway, 1)).outcome).toBe('replied');
    const otherFace = simulate(floors(), ping(device('your-laptop'), floor2.gateway));
    expect([otherFace.outcome, otherFace.destinationId]).toEqual(['replied', officeRouter.id]);
    expect(otherFace).not.toHaveProperty('hops');

    const uplink = simulate(floors(), ping(device('andres-laptop'), OFFICE_FLOORS.officeRouter.uplink));
    expect([uplink.outcome, uplink.destinationId]).toEqual(['replied', officeRouter.id]);

    for (const [ip, owner, crossed] of [
      [provider.towardOffice, provider.id, [officeRouter.id]],
      [provider.towardInternet, provider.id, [officeRouter.id]],
      [backbone.towardProvider, backbone.id, [officeRouter.id, provider.id]],
      [backbone.towardServer, backbone.id, [officeRouter.id, provider.id]],
    ] as const) {
      const trace = simulate(floors(), ping(device('your-laptop'), ip));
      expect([trace.outcome, trace.destinationId]).toEqual(['replied', owner]);
      expect(trace.hops?.map((hop) => hop.routerId)).toEqual(crossed);
    }
    expect(simulate(floors(), tcp(device('your-laptop'), floor1.gateway, 80)).outcome).toBe('refused');
    expect(simulate(floors(), pingWithTtl('your-laptop', backbone.towardProvider, 2)).outcome).toBe('ttl-exceeded');
  });

  it('the reply of a ping is never stopped by a firewall, outbound or inbound', () => {
    const net = guarded();
    const toAndres = simulate(net, ping(device('your-laptop'), floor2.andres));
    expect(toAndres.outcome).toBe('replied');
    expect(toAndres.steps.map((step) => step.stage)).toEqual(['route', 'firewall-out', 'forward', 'firewall-in', 'host', 'reply']);
    const afterHost = toAndres.steps.slice(toAndres.steps.findIndex((step) => step.stage === 'host'));
    expect(afterHost.map((step) => step.stage)).toEqual(['host', 'reply']);

    const toServerTrace = simulate(net, toServer());
    const toRouter = simulate(net, ping(device('your-laptop'), floor1.gateway));
    expect([toServerTrace.outcome, toRouter.outcome]).toEqual(['replied', 'replied']);
    expect([toServerTrace, toRouter].flatMap((trace) => trace.steps.filter((step) => step.stage === 'firewall-in'))).toEqual([]);

    const closedOut = { ...net, firewalls: net.firewalls.map((f) => (f.id === 'fw-source' ? { ...f, outbound: [] } : f)) };
    expect(simulate(closedOut, ping(device('your-laptop'), floor2.andres)).outcome).toBe('timeout');
  });

  it('a packet from the internet to a private address of the office is still lost in the internet', () => {
    const net: Network = { ...floors(), actors: [...floors().actors, { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' }] };
    for (const from of [actor(server.id), actor('attacker')]) {
      for (const to of [floor1.you, floor2.andres, floor1.gateway]) {
        const trace = simulate(net, ping(from, to));
        expect(trace.outcome).toBe('lost');
        expect(trace.steps).toEqual([{ stage: 'route', at: 'internet', verdict: 'drop', reason: { code: 'route-private-from-outside', ip: to } }]);
        expect(trace).not.toHaveProperty('hops');
      }
    }
  });

  it('a gateway router with no interface on the destination LAN passes the packet on instead of losing it', () => {
    const net = floors();
    const cut: Network = { ...net, routers: (net.routers ?? []).map((router) => ({ ...router, interfaces: router.interfaces.filter((face) => face.faces !== floor2.id) })) };
    const trace = simulate(cut, ping(device('your-laptop'), floor2.andres));
    expect(trace.outcome).toBe('timeout');
    expect(stopStep(trace)?.reason).toEqual({ code: 'forward-private-dropped', routerId: provider.id, ip: floor2.andres });
    expect(codes(trace)).not.toContain('route-no-device');
  });

  it('a VPC trace never carries hops', () => {
    expect(simulate(lab03Net(), ping(device('servidor1'), S2.private))).not.toHaveProperty('hops');
    expect(simulate(withEcho(), ping(device('servidor1'), S2.private))).not.toHaveProperty('hops');
  });
});

describe('the header, the reply and the round trip time', () => {
  const LOOPBACK = '127.0.0.1';
  const OTHER_LOOPBACK = '127.5.5.5';
  const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
  const floors = (): Network => officeTwoFloorsNet();
  const sendFromYou = (to: string, ttl?: number): Trace => simulate(floors(), { ...ping(device('your-laptop'), to), ...(ttl !== undefined && { ttl }) });
  const rttOf = (net: Network, to: string): number | undefined => simulate(net, ping(device('your-laptop'), to)).rttMs;
  const withRouterLatency = (net: Network, routerId: string, latencyMs: number): Network => ({
    ...net,
    routers: (net.routers ?? []).map((router) => (router.id === routerId ? { ...router, latencyMs } : router)),
  });
  const withLanLatency = (net: Network, lanId: string, latencyMs: number): Network => ({
    ...net,
    lans: (net.lans ?? []).map((lan) => (lan.id === lanId ? { ...lan, latencyMs } : lan)),
  });
  const withServerLatency = (net: Network, latencyMs: number): Network => ({
    ...net,
    actors: net.actors.map((entry) => (entry.kind === 'server' ? { ...entry, latencyMs } : entry)),
  });
  const closedOut = (): Network => ({
    ...withDevice(floors(), 'your-laptop', { firewallIds: ['fw-closed'] }),
    firewalls: [{ id: 'fw-closed', name: 'fw-closed', kind: 'host-firewall', inbound: [], outbound: [] }],
  });

  it('the request header carries the IP of the sender, the IP of the destination and the TTL it left with', () => {
    expect(sendFromYou(floor1.printer).header?.request).toEqual({ source: floor1.you, destination: floor1.printer, ttl: 64 });
    expect(sendFromYou(server.ip).header?.request).toEqual({ source: floor1.you, destination: server.ip, ttl: 64 });
    expect(sendFromYou(server.ip, 5).header?.request).toEqual({ source: floor1.you, destination: server.ip, ttl: 5 });
    expect(simulate(officeNet(), ping(device('your-laptop'), OFFICE.lucia)).header?.request).toEqual({ source: OFFICE.you, destination: OFFICE.lucia, ttl: 64 });

    const unanswered = sendFromYou(server.ip, 1);
    expect(unanswered.outcome).toBe('ttl-exceeded');
    expect(unanswered.header?.request.ttl).toBe(1);
  });

  it('a loopback ping leaves with source 127.0.0.1, and a ping to your own IP with your own IP', () => {
    const ttl = 64;
    expect(sendFromYou('127.0.0.1').header).toEqual({ request: { source: LOOPBACK, destination: LOOPBACK, ttl }, reply: { source: LOOPBACK, destination: LOOPBACK } });
    expect(sendFromYou('localhost').header).toEqual({ request: { source: LOOPBACK, destination: LOOPBACK, ttl }, reply: { source: LOOPBACK, destination: LOOPBACK } });
    expect(sendFromYou(OTHER_LOOPBACK).header).toEqual({ request: { source: LOOPBACK, destination: OTHER_LOOPBACK, ttl }, reply: { source: OTHER_LOOPBACK, destination: LOOPBACK } });
    expect(sendFromYou(floor1.you).header).toEqual({ request: { source: floor1.you, destination: floor1.you, ttl }, reply: { source: floor1.you, destination: floor1.you } });
  });

  it('a loopback ping needs no cable, and a packet to an address that is not loopback keeps the private source', () => {
    const noCable = simulate(floors(), ping(device('guest-laptop'), '127.0.0.1'));
    expect(noCable.outcome).toBe('replied');
    expect(noCable.header?.request.source).toBe(LOOPBACK);
    expect(sendFromYou(floor1.printer).header?.request.source).toBe(floor1.you);
  });

  it('the reply header swaps source and destination', () => {
    const toPrinter = sendFromYou(floor1.printer);
    expect(toPrinter.header?.reply).toEqual({ source: floor1.printer, destination: floor1.you });
    expect(toPrinter.header?.reply).toEqual({ source: toPrinter.header?.request.destination, destination: toPrinter.header?.request.source });
    expect(sendFromYou(server.ip).header?.reply).toEqual({ source: server.ip, destination: floor1.you });
    expect(sendFromYou(floor1.gateway).header?.reply).toEqual({ source: floor1.gateway, destination: floor1.you });
    expect(simulate(floors(), ping(device('andres-laptop'), floor1.you)).header?.reply).toEqual({ source: floor1.you, destination: floor2.andres });
  });

  it('only a packet that was answered has a reply header', () => {
    const deaf = withDevice(floors(), 'printer', { host: { ignoreIcmpEcho: true, services: [] } });
    const traces = [simulate(deaf, ping(device('your-laptop'), floor1.printer)), sendFromYou(floor1.nobody), sendFromYou(server.ip, 2), simulate(floors(), tcp(device('your-laptop'), floor1.printer, 80))];
    expect(traces.map((trace) => trace.outcome)).toEqual(['arrived-no-reply', 'unreachable', 'ttl-exceeded', 'refused']);
    for (const trace of traces) {
      expect(trace.header?.request.source).toBe(floor1.you);
      expect(trace.header).not.toHaveProperty('reply');
    }
  });

  it('a packet that never left its sender has no header and no round trip time', () => {
    const unplugged = withDevice(floors(), 'your-laptop', { connected: false });
    const noGateway = withDevice(floors(), 'your-laptop', { gateway: undefined });
    const traces = [simulate(unplugged, ping(device('your-laptop'), floor1.printer)), simulate(noGateway, ping(device('your-laptop'), floor2.andres)), sendFromYou('192.168.1.300')];
    expect(traces.map((trace) => trace.outcome)).toEqual(['no-route', 'no-route', 'invalid-address']);
    for (const trace of traces) {
      expect(trace).not.toHaveProperty('header');
      expect(trace).not.toHaveProperty('rttMs');
    }
  });

  it('the header keeps the private source across the router', () => {
    const crossed = [sendFromYou(server.ip), sendFromYou(server.ip, 2), sendFromYou('8.8.8.8'), simulate(floors(), ping(device('andres-laptop'), server.ip))];
    expect(crossed.map((trace) => trace.hops?.length)).toEqual([3, 2, 2, 3]);
    expect(crossed.map((trace) => trace.header?.request.source)).toEqual([floor1.you, floor1.you, floor1.you, floor2.andres]);
    expect(crossed[0].header?.reply?.destination).toBe(floor1.you);
    expect(crossed[3].header?.reply?.destination).toBe(floor2.andres);
    for (const trace of crossed) {
      expect(JSON.stringify(trace.header)).not.toContain(officeRouter.uplink);
      expect(trace.effectiveSource).toBe(trace.header?.request.source);
    }
  });

  it('the round trip time adds the latency of every leg, there and back', () => {
    expect(rttOf(floors(), floor1.printer)).toBe(2);
    expect(rttOf(floors(), floor2.andres)).toBe(2 * (1 + 1 + 1));
    expect(rttOf(floors(), server.ip)).toBe(2 * (1 + 1 + 8 + 12 + 20));
    expect(rttOf(officeNet(), OFFICE.printer)).toBe(2);

    expect(rttOf(withRouterLatency(floors(), provider.id, 18), server.ip)).toBe(84 + 2 * 10);
    expect(rttOf(withLanLatency(floors(), floor1.id, 4), server.ip)).toBe(84 + 2 * 3);
    expect(rttOf(withServerLatency(floors(), 50), server.ip)).toBe(84 + 2 * 30);
    expect(rttOf(withLanLatency(floors(), floor2.id, 6), floor2.andres)).toBe(2 * (1 + 1 + 6));
  });

  it('a latency off the road of the packet does not change its round trip time', () => {
    const elsewhere = withLanLatency(withRouterLatency(floors(), backbone.id, 99), floor2.id, 40);
    expect(rttOf(elsewhere, floor1.printer)).toBe(2);
    expect(rttOf(elsewhere, floor1.gateway)).toBe(2 * (1 + 1));
    expect(rttOf(withServerLatency(floors(), 90), provider.towardInternet)).toBe(rttOf(floors(), provider.towardInternet));
  });

  it('a router that answers for its own interface adds its latency to the trip as one that warns does', () => {
    const answers = sendFromYou(provider.towardOffice);
    const warns = sendFromYou(server.ip, 2);
    expect([answers.outcome, warns.outcome]).toEqual(['replied', 'ttl-exceeded']);
    expect([answers.rttMs, warns.rttMs]).toEqual([2 * (1 + 1 + 8), 2 * (1 + 1 + 8)]);
  });

  it('a loopback round trip is the smallest of all', () => {
    const loopbacks = [sendFromYou('localhost'), sendFromYou('127.0.0.1'), sendFromYou('127.8.9.10'), sendFromYou(floor1.you)];
    expect(loopbacks.map((trace) => trace.outcome)).toEqual(['replied', 'replied', 'replied', 'replied']);
    const loopback = loopbacks[0].rttMs ?? NaN;
    expect(loopback).toBeGreaterThan(0);
    expect(loopback).toBeLessThan(1);
    expect(loopbacks.map((trace) => trace.rttMs)).toEqual([loopback, loopback, loopback, loopback]);

    const others = [
      sendFromYou(floor1.printer),
      sendFromYou(floor2.andres),
      sendFromYou(floor1.gateway),
      sendFromYou(provider.towardOffice),
      sendFromYou(server.ip),
      sendFromYou(server.ip, 1),
      sendFromYou('8.8.8.8'),
      simulate(floors(), tcp(device('your-laptop'), floor1.printer, 80)),
    ];
    for (const other of others) expect(other.rttMs).toBeGreaterThan(loopback);
    expect(sendFromYou(floor1.nobody)).not.toHaveProperty('rttMs');
  });

  it("a warning's time counts only up to the device that warned", () => {
    const warnings = [1, 2, 3].map((ttl) => sendFromYou(server.ip, ttl));
    expect(warnings.map((trace) => trace.notice?.fromId)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(warnings.map((trace) => trace.rttMs)).toEqual([2 * (1 + 1), 2 * (1 + 1 + 8), 2 * (1 + 1 + 8 + 12)]);

    const noRoute = sendFromYou('8.8.8.8');
    expect([noRoute.notice?.kind, noRoute.notice?.fromId, noRoute.rttMs]).toEqual(['net-unreachable', provider.id, 2 * (1 + 1 + 8)]);
    const noHost = sendFromYou('198.51.100.77');
    expect([noHost.notice?.kind, noHost.notice?.fromId, noHost.rttMs]).toEqual(['host-unreachable', backbone.id, 2 * (1 + 1 + 8 + 12)]);

    const ownLaptop = sendFromYou(floor1.nobody);
    expect(ownLaptop.notice).toEqual({ kind: 'host-unreachable', fromId: 'your-laptop', fromIp: floor1.you });
    expect(ownLaptop).not.toHaveProperty('rttMs');
  });

  it('a trip that brings nothing back has no round trip time', () => {
    const quiet: Network = { ...floors(), routers: (floors().routers ?? []).map((router) => ({ ...router, sendsUnreachable: false })) };
    const deaf = withDevice(floors(), 'printer', { host: { ignoreIcmpEcho: true, services: [] } });
    const traces = [
      simulate(quiet, ping(device('your-laptop'), '8.8.8.8')),
      simulate(quiet, ping(device('your-laptop'), '10.0.0.10')),
      simulate(deaf, ping(device('your-laptop'), floor1.printer)),
      simulate(closedOut(), ping(device('your-laptop'), floor1.printer)),
    ];
    expect(traces.map((trace) => trace.outcome)).toEqual(['timeout', 'timeout', 'arrived-no-reply', 'timeout']);
    for (const trace of traces) expect(trace).not.toHaveProperty('rttMs');
  });

  it('the new trace fields are absent from every trace of a VPC', () => {
    const open = withInbound(withEcho(), 'sg-servidor2', allOut('everything'));
    const packets: [Network, PacketSpec][] = [
      [lab03Net(), ping(device('servidor1'), S2.private)],
      [open, ping(device('servidor1'), S2.private)],
      [open, ping(device('servidor1'), S1.private)],
      [open, ping(device('servidor1'), VPC_NOBODY)],
      [open, ping(device('servidor1'), S2.public)],
      [open, tcp(device('servidor1'), S2.private, 22)],
      [open, tcp(device('servidor1'), S2.private, 80)],
      [open, { ...ping(device('servidor1'), S2.private), ttl: 3 }],
      [open, ping(device('servidor1'), 'unknown-name')],
      [open, ping(actor('you'), S1.public)],
      [open, tcp(actor('you'), S1.public, 22)],
      [open, tcp(actor('attacker'), S1.public, 22)],
      [open, ping(actor('attacker'), S1.private)],
    ];
    const traces = packets.map(([net, packet]) => simulate(net, packet));
    for (const outcome of ['replied', 'timeout', 'refused', 'lost', 'unresolved']) expect(traces.map((trace) => trace.outcome)).toContain(outcome);
    for (const trace of traces) {
      expect(trace).not.toHaveProperty('header');
      expect(trace).not.toHaveProperty('rttMs');
      expect(JSON.stringify(trace)).not.toMatch(/"header"|"rttMs"/);
    }
  });
});

describe('names in a VPC and in an office', () => {
  const REGION = 'eu-west-1';
  const publicName = publicDnsName(S2.public, REGION);
  const privateName = privateDnsName(S2.private, REGION);

  it('the name of an EC2 instance still resolves as in a VPC', () => {
    const inside = simulate(withEcho(), ping(device('servidor1'), publicName));
    expect(inside.outcome).toBe('replied');
    expect(inside.resolvedIp).toBe(S2.private);
    expect(inside.steps[0]).toEqual({ stage: 'dns', at: 'servidor1', verdict: 'info', reason: { code: 'dns-resolved', name: publicName, ip: S2.private, fromInside: true } });
    const outside = simulate(withInbound(withEcho(), 'sg-servidor2', allOut('everything')), ping(actor('you'), publicName));
    expect(outside.resolvedIp).toBe(S2.public);
    expect(outside.steps[0].reason).toEqual({ code: 'dns-resolved', name: publicName, ip: S2.public, fromInside: false });
    const hidden = simulate(withEcho(), ping(actor('you'), privateName));
    expect(hidden.outcome).toBe('unresolved');
    expect(codes(hidden)).toEqual(['dns-unresolved']);
    for (const trace of [inside, outside, hidden]) expect(trace).not.toHaveProperty('dns');
  });

  it('a name in an office with no dns server does not resolve', () => {
    for (const net of [officeNet(), officeTwoFloorsNet()]) {
      const trace = simulate(net, ping(device(net.devices[0].id), `www.${NAME_SERVER_PIECES.zone}`));
      expect(trace.outcome).toBe('unresolved');
      expect(trace.resolvedIp).toBeNull();
      expect(codes(trace)).toEqual(['dns-unresolved']);
      expect(trace.dns).toEqual({ name: `www.${NAME_SERVER_PIECES.zone}`, status: 'NO-RESOLVER', answers: [], fromCache: false, usedHostsFile: false, viaDig: false });
      expect([trace.tcpdump, trace.hops, trace.header]).toEqual([[], undefined, undefined]);
    }
  });

  it('a device of an office with a resolver does not ask it for the name of an EC2 instance', () => {
    const trace = simulate(officeWithNames(), ping(device('your-laptop'), publicName));
    expect(trace.outcome).toBe('unresolved');
    expect(trace.dns?.status).toBe('NXDOMAIN');
  });

  it('a name sent from the internet to an office does not resolve either, and the office has no resolver for it', () => {
    const withHome = applyAction(officeWithNames(), { type: 'addActor', actor: { id: 'home', name: 'casa-lucia', kind: 'home', ip: '192.0.2.77' } });
    const trace = simulate(withHome, ping(actor('home'), `www.${NAME_SERVER_PIECES.zone}`));
    expect(trace.outcome).toBe('unresolved');
    expect(codes(trace)).toEqual(['dns-unresolved']);
    expect(trace).not.toHaveProperty('dns');
  });
});

describe('a dig and a resolver that cannot answer', () => {
  const { zone, downZone, resolver } = NAME_SERVER_PIECES;
  const WWW = `www.${zone}`;
  const you = device('your-laptop');
  const names = officeWithNames();
  const withoutServices = applyAction(names, { type: 'setServices', ownerId: resolver.id, services: [] });
  const toPrinter = applyAction(names, { type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.floor1.printer });

  it('a resolver with no service on port 53 answers Port Unreachable', () => {
    const trace = simulate(withoutServices, dig(you, WWW));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'port-unreachable', fromId: resolver.id, fromIp: resolver.ip });
    expect(trace.steps.at(-1)).toEqual({ stage: 'host', at: resolver.id, verdict: 'reject', reason: { code: 'host-udp-closed', deviceId: resolver.id, port: 53 } });
    expect(trace.dns).toEqual({ name: WWW, status: 'NO-RESOLVER', answers: [], fromCache: false, usedHostsFile: false, viaDig: true });
    expect(trace.exchange).toEqual([{ from: 'client', kind: 'query' }]);
    expect(trace.rttMs).toBeGreaterThan(0);
    const pinged = simulate(withoutServices, ping(you, WWW));
    expect(pinged.outcome).toBe('unresolved');
    expect(pinged.steps).toEqual([{ stage: 'dns', at: 'your-laptop', verdict: 'drop', reason: { code: 'dns-no-resolver', deviceId: 'your-laptop', name: WWW, ip: resolver.ip, hostId: resolver.id } }]);
  });

  it('a dig to a device that is not a resolver ends in a warning from that device', () => {
    const trace = simulate(toPrinter, dig(you, WWW));
    expect(trace.outcome).toBe('unreachable');
    expect(trace.notice).toEqual({ kind: 'port-unreachable', fromId: 'printer', fromIp: OFFICE_FLOORS.floor1.printer });
    expect(trace.destinationId).toBe('printer');
    expect(trace.tcpdump.map((line) => `${line.deviceId} ${line.direction} ${line.summary}`)).toEqual(['printer In UDP 53', 'printer Out ICMP udp port 53 unreachable']);
    expect(trace.dns).toMatchObject({ status: 'NO-RESOLVER', answers: [], viaDig: true });
    expect(trace.steps.at(-1)?.reason).toEqual({ code: 'host-udp-closed', deviceId: 'printer', port: 53 });
  });

  it('a dig is the datagram to the resolver: it goes there, takes the answer from it and writes no step of its own', () => {
    const trace = simulate(names, dig(you, WWW));
    expect(trace.outcome).toBe('replied');
    expect(trace.resolvedIp).toBe(resolver.ip);
    expect(trace.destinationId).toBe(resolver.id);
    expect(trace.header?.request).toEqual({ source: OFFICE.you, destination: resolver.ip, ttl: 64, sourcePort: 51514, destinationPort: 53 });
    expect(trace.header?.reply).toEqual({ source: resolver.ip, destination: OFFICE.you, sourcePort: 53, destinationPort: 51514 });
    expect(trace.exchange).toEqual([{ from: 'client', kind: 'query' }, { from: 'server', kind: 'response' }]);
    expect(trace.hops?.map((hop) => hop.routerId)).toEqual([OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.provider.id, OFFICE_FLOORS.backbone.id]);
    expect(trace.steps.filter((step) => step.stage === 'dns' || step.stage === 'address')).toEqual([]);
    expect(trace.dns).toMatchObject({ name: WWW, status: 'NOERROR', answers: [{ type: 'A', value: NAME_SERVER_PIECES.site, ttl: 300 }], fromCache: false, viaDig: true });
  });

  it('NXDOMAIN and SERVFAIL are answers: the datagram comes back replied and the status is in the answer', () => {
    for (const [name, status] of [[`noexiste.${zone}`, 'NXDOMAIN'], [`www.${downZone}`, 'SERVFAIL']]) {
      const trace = simulate(names, dig(you, name));
      expect(trace.outcome, name).toBe('replied');
      expect(trace.dns?.status, name).toBe(status);
    }
  });

  it('a dig from a device with no resolver sends nothing, one that has no cable never leaves it, and one to an IP has no name to answer', () => {
    const none = simulate(applyAction(names, { type: 'setDnsServer', deviceId: 'your-laptop' }), dig(you, WWW));
    expect(none.outcome).toBe('unresolved');
    expect(codes(none)).toEqual(['dns-unresolved']);
    expect(none.dns).toEqual({ name: WWW, status: 'NO-RESOLVER', answers: [], fromCache: false, usedHostsFile: false, viaDig: true });
    const unplugged = simulate(applyAction(names, { type: 'setDnsServer', deviceId: 'guest-laptop', server: resolver.ip }), dig(device('guest-laptop'), WWW));
    expect(unplugged.outcome).toBe('no-route');
    expect(unplugged.dns?.status).toBe('NO-RESOLVER');
    expect(unplugged).not.toHaveProperty('header');
    const toIp = simulate(names, dig(you, resolver.ip));
    expect(toIp.outcome).toBe('replied');
    expect(toIp).not.toHaveProperty('dns');
  });

  it('a lookup of the system and a dig give the same answer to the same name', () => {
    for (const name of [WWW, `blog.${zone}`, `noexiste.${zone}`, `www.${downZone}`]) {
      const asked = simulate(names, dig(you, name)).dns!;
      const looked = simulate(names, ping(you, name)).dns!;
      expect({ ...asked, viaDig: false }, name).toEqual(looked);
    }
  });
});
