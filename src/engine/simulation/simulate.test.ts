import { describe, expect, it } from 'vitest';
import { deathPoint, stopStep } from './checkpoints';
import { OFFICE, OFFICE_FLOORS, actor, device, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, ping, tcp, withDevice, withInbound } from '@/testing';
import { simulate } from './simulate';
import { ROUTE_DEFAULT } from '@/engine/network/schema';
import { applyAction } from '@/engine/network/actions';
import type { Network, PacketSpec, Route, Rule } from '@/engine/network/types';
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
