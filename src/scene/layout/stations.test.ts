import { describe, expect, it } from 'vitest';
import { NAME_SERVER_PIECES, OFFICE, OFFICE_FLOORS, actor, device, dig, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, officeWithNames, ping, tcpService, withDevice, withInbound } from '@/testing';
import { applyAction, simulate, type Firewall, type Network } from '@/engine';
import { INCIDENTS, solvedWorld } from '@/levels';
import { startsOnMap, stationsFor, type Drawn } from './stations';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

const NOTHING: Drawn = { devices: {}, clients: [], servers: [], routers: [], gateways: [], edge: false, internet: false };
const drawn = (parts: Partial<Drawn>): Drawn => ({ ...NOTHING, ...parts });
const hangingFrom = (bus: string, ...ids: string[]) => Object.fromEntries(ids.map((id) => [id, bus]));

const VPC = drawn({ devices: { servidor1: 'subnet-a', servidor2: 'subnet-b' }, clients: ['you', 'attacker'], edge: true, internet: true });
const OFFICE_BUS = 'office';
const OFFICE_WITH_EDGE = drawn({ devices: hangingFrom(OFFICE_BUS, 'your-laptop', 'lucia-laptop', 'printer'), clients: ['attacker'], edge: true, internet: true });

const FLOORS = officeTwoFloorsNet();
const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const FLOOR_1_DEVICES = ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer'];
const DEVICES_ON_FLOORS = { ...hangingFrom(floor1.id, ...FLOOR_1_DEVICES), ...hangingFrom(floor2.id, 'andres-laptop') };
const ON_FLOOR_1 = hangingFrom(floor1.id, ...FLOOR_1_DEVICES);
const WHOLE_ROAD = drawn({ devices: DEVICES_ON_FLOORS, routers: [officeRouter.id, provider.id, backbone.id], internet: true, servers: [server.id] });
const YOU_TO_ROAD = ['door:your-laptop', 'firewall:your-laptop', 'road:your-laptop'];
const AT_YOUR_DOORSTEP = ['door:your-laptop', 'doorstep:your-laptop'];
const CASA_LUCIA = { id: 'casa-lucia', name: 'casa-lucia', ip: '192.0.2.77', kind: 'home' } as const;

const sendOnFloors = (from: string, to: string, ttl?: number) => {
  const echo = ping(device(from), to);
  const packet = ttl === undefined ? echo : { ...echo, ttl };
  return { packet, trace: simulate(FLOORS, packet) };
};
const stationsOf = (sent: ReturnType<typeof sendOnFloors>, map: Drawn = WHOLE_ROAD, hiddenStop = false) => stationsFor(sent.trace, sent.packet, map, { hiddenStop });

describe('pathFor', () => {
  const net = lab03Net();

  it('step 3: ends at the firewall of servidor2', () => {
    const packet = ping(device('servidor1'), S2.private);
    expect(stationsFor(simulate(net, packet), packet, VPC)).toEqual(['door:servidor1', 'firewall:servidor1', 'road:servidor1', 'road:servidor2', 'firewall:servidor2']);
  });

  it('step 5: reaches the door of servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(device('servidor1'), S2.private);
    expect(stationsFor(simulate(solved, packet), packet, VPC)).toEqual(['door:servidor1', 'firewall:servidor1', 'road:servidor1', 'road:servidor2', 'firewall:servidor2', 'door:servidor2']);
  });

  it('a ping from the internet to a public IP crosses the internet and the edge before the firewall', () => {
    const packet = ping(actor('attacker'), S2.public);
    expect(stationsFor(simulate(net, packet), packet, VPC)).toEqual(['door:attacker', 'internet', 'edge', 'road:servidor2', 'firewall:servidor2']);
  });

  it('a private IP from the internet is lost in the internet, before the edge', () => {
    const packet = ping(actor('attacker'), S2.private);
    expect(stationsFor(simulate(net, packet), packet, VPC)).toEqual(['door:attacker', 'internet']);
  });
});

describe('pathFor in an office', () => {
  const net = officeNet();
  const stationsToIn = (world: Network, to: string, map: Drawn = OFFICE_WITH_EDGE) => {
    const packet = ping(device('your-laptop'), to);
    return stationsFor(simulate(world, packet), packet, map);
  };

  it('a ping to its own IP stays at its own doorstep: it never reaches its firewall or the road', () => {
    expect(stationsToIn(net, OFFICE.you)).toEqual(AT_YOUR_DOORSTEP);
  });

  it('a ping to an IP that no device has stays at its own doorstep: its own device warns, so nothing goes out', () => {
    expect(simulate(net, ping(device('your-laptop'), OFFICE.nobody)).notice).toMatchObject({ kind: 'host-unreachable', fromId: 'your-laptop' });
    expect(stationsToIn(net, OFFICE.nobody)).toEqual(AT_YOUR_DOORSTEP);
  });

  it('a ping to an IP that no instance of a VPC has runs to the far end of the road and stops there', () => {
    const packet = ping(device('servidor1'), '172.31.99.99');
    const trace = simulate(lab03Net(), packet);
    expect(trace.steps.map((step) => step.reason.code)).toContain('route-no-device');
    expect(stationsFor(trace, packet, VPC)).toEqual(['door:servidor1', 'firewall:servidor1', 'road:servidor1', 'bus-end:subnet-a']);
  });

  it('a ping between two laptops runs along the road from one door to the other', () => {
    expect(stationsToIn(net, OFFICE.lucia)).toEqual([...YOU_TO_ROAD, 'road:lucia-laptop', 'firewall:lucia-laptop', 'door:lucia-laptop']);
  });

  it('a ping from the internet to a private IP of the office is lost in the internet, before the router', () => {
    const packet = ping(actor('attacker'), OFFICE.you);
    expect(stationsFor(simulate(net, packet), packet, OFFICE_WITH_EDGE)).toEqual(['door:attacker', 'internet']);
  });

  it('while the map does not show the outside, a packet never travels to the edge it does not draw', () => {
    const withoutOutside = withDevice({ ...net, actors: [] }, 'your-laptop', { gateway: '192.168.1.1' });
    const stations = stationsToIn(withoutOutside, '8.8.8.8', drawn({ devices: hangingFrom(OFFICE_BUS, 'your-laptop') }));
    expect(stations).not.toContain('edge');
    expect(stations).toEqual(YOU_TO_ROAD);
  });
});

describe('pathFor when a firewall the player does not know stops the packet', () => {
  const base = officeNet();
  const outbound: Firewall = { id: 'fw-you', name: 'your-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
  const toLucia = ping(device('your-laptop'), OFFICE.lucia);
  const stationsIn = (world: Network, hiddenStop = false) => stationsFor(simulate(world, toLucia), toLucia, OFFICE_WITH_EDGE, { hiddenStop });

  it('ends at the door of the device that guards the way in, where a delivered packet ends, and not in front of the firewall', () => {
    const guarded = withDevice(base, 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    expect(stationsIn(guarded).at(-1)).toBe('firewall:lucia-laptop');
    expect(stationsIn(guarded, true)).toEqual([...YOU_TO_ROAD, 'road:lucia-laptop', 'firewall:lucia-laptop', 'door:lucia-laptop']);
  });

  it('stays at the doorstep of the device that guards the way out, as a packet to its own IP does', () => {
    const guarded = withDevice({ ...base, firewalls: [outbound] }, 'your-laptop', { firewallIds: ['fw-you'] });
    expect(stationsIn(guarded)).toEqual(['door:your-laptop', 'firewall:your-laptop']);
    expect(stationsIn(guarded, true)).toEqual(AT_YOUR_DOORSTEP);
  });

  it('changes nothing for a packet that no firewall stopped', () => {
    const toNoOne = ping(device('your-laptop'), OFFICE.nobody);
    const trace = simulate(base, toNoOne);
    expect(stationsFor(trace, toNoOne, OFFICE_WITH_EDGE, { hiddenStop: true })).toEqual(stationsFor(trace, toNoOne, OFFICE_WITH_EDGE));
  });
});

describe('pathFor in an office with routers', () => {
  it('the path of a packet goes through the drawn routers it crossed, in order', () => {
    const sent = sendOnFloors('your-laptop', server.ip);
    expect(sent.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(stationsOf(sent)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'router:router-provider', 'router:router-backbone', 'door:internet-server']);
    expect(stationsOf(sendOnFloors('your-laptop', floor2.andres))).toEqual([...YOU_TO_ROAD, 'router:router-office', 'road:andres-laptop', 'firewall:andres-laptop', 'door:andres-laptop']);
  });

  it('skips the routers that are not drawn and goes through the ones that are', () => {
    const fewer = drawn({ ...WHOLE_ROAD, routers: [officeRouter.id, backbone.id] });
    expect(stationsOf(sendOnFloors('your-laptop', server.ip), fewer).slice(3)).toEqual(['router:router-office', 'router:router-backbone', 'door:internet-server']);
  });

  it('a packet to the same floor stays on the road and crosses no router', () => {
    expect(stationsOf(sendOnFloors('your-laptop', floor1.lucia))).toEqual([...YOU_TO_ROAD, 'road:lucia-laptop', 'firewall:lucia-laptop', 'door:lucia-laptop']);
  });

  it('a packet to the interface of a router ends at that router', () => {
    expect(stationsOf(sendOnFloors('your-laptop', floor1.gateway)).at(-1)).toBe('router:router-office');
  });

  it('a packet that dies at a drawn router ends at that router', () => {
    const twoHops = sendOnFloors('your-laptop', server.ip, 2);
    expect(twoHops.trace.outcome).toBe('ttl-exceeded');
    expect(stationsOf(twoHops)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'router:router-provider']);
    expect(stationsOf(sendOnFloors('your-laptop', server.ip, 1)).at(-1)).toBe('router:router-office');
  });

  it('a warning that the sender itself generates never leaves the device: it appears at its own doorstep', () => {
    const nobodyHome = sendOnFloors('your-laptop', floor1.nobody);
    expect(nobodyHome.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: 'your-laptop' });
    expect(stationsOf(nobodyHome)).toEqual(AT_YOUR_DOORSTEP);
    expect(stationsOf(sendOnFloors('your-laptop', floor1.guest))).toEqual(AT_YOUR_DOORSTEP);
  });

  it('a warning from a router is generated where the packet dies, so the path it comes back along ends at that router', () => {
    const nobodyBehind = sendOnFloors('your-laptop', '198.51.100.77');
    expect(nobodyBehind.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: backbone.id });
    expect(stationsOf(nobodyBehind).at(-1)).toBe('router:router-backbone');
    const timeRanOut = sendOnFloors('your-laptop', server.ip, 2);
    expect(timeRanOut.trace.notice).toMatchObject({ kind: 'time-exceeded', fromId: provider.id });
    expect(stationsOf(timeRanOut).at(-1)).toBe('router:router-provider');
  });

  it('a packet that dies at a router that is not drawn ends between the last drawn piece it crossed and the next one', () => {
    const vanished = sendOnFloors('your-laptop', '10.0.0.10');
    expect(vanished.trace.outcome).toBe('timeout');
    expect(vanished.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);
    const onlyTheOfficeRouter = drawn({ ...WHOLE_ROAD, devices: ON_FLOOR_1, routers: [officeRouter.id] });
    expect(stationsOf(vanished, onlyTheOfficeRouter)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'mid:router:router-office-internet']);
  });

  it('a packet that a router dropped without a warning, with its stop hidden, stays at the doorstep of its sender and never goes along the routers', () => {
    const quietly = sendOnFloors('your-laptop', '10.0.0.10');
    expect(quietly.trace.notice).toBeUndefined();
    expect(stationsOf(quietly, WHOLE_ROAD, true)).toEqual(AT_YOUR_DOORSTEP);
    expect(stationsOf(quietly)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'router:router-provider']);
    const arrived = sendOnFloors('your-laptop', server.ip);
    expect(stationsOf(arrived, WHOLE_ROAD, true)).toEqual(stationsOf(arrived));
  });

  it('a packet that dies at a router that is not drawn before any drawn router ends between the sender and the next piece', () => {
    const noRouters = drawn({ ...WHOLE_ROAD, devices: ON_FLOOR_1, routers: [] });
    expect(stationsOf(sendOnFloors('your-laptop', '10.0.0.10'), noRouters)).toEqual([...YOU_TO_ROAD, 'mid:bus:floor-1-internet']);
  });

  it('a loopback ping and an invalid address never draw a path out of the device', () => {
    for (const address of ['127.0.0.1', '127.8.8.8', 'localhost', '256.1.1.1']) {
      expect(stationsOf(sendOnFloors('your-laptop', address)), address).toEqual(AT_YOUR_DOORSTEP);
    }
    const toLoopback = sendOnFloors('your-laptop', '127.0.0.1');
    expect(toLoopback.trace.steps.map((step) => step.reason.code)).toContain('route-loopback');
  });

  it('a ping with no gateway or not connected never draws a path out of the device', () => {
    const farAway = ping(device('your-laptop'), floor2.andres);
    const withoutGateway = simulate(withDevice(FLOORS, 'your-laptop', { gateway: undefined }), farAway);
    expect(withoutGateway.steps.map((step) => step.reason.code)).toContain('route-no-gateway');
    expect(stationsFor(withoutGateway, farAway, WHOLE_ROAD)).toEqual(AT_YOUR_DOORSTEP);
    const nextDoor = ping(device('your-laptop'), floor1.lucia);
    const noCable = simulate(withDevice(FLOORS, 'your-laptop', { connected: false }), nextDoor);
    expect(noCable.steps.map((step) => step.reason.code)).toContain('route-not-connected');
    expect(stationsFor(noCable, nextDoor, WHOLE_ROAD)).toEqual(AT_YOUR_DOORSTEP);
  });

  it("a packet handed to a gateway that is not a router ends at that device's door", () => {
    const farAway = ping(device('your-laptop'), floor2.andres);
    const handedToPrinter = simulate(withDevice(FLOORS, 'your-laptop', { gateway: floor1.printer }), farAway);
    expect(handedToPrinter.destinationId).toBeNull();
    expect(handedToPrinter.steps.at(-1)?.reason.code).toBe('route-gateway-not-a-router');
    expect(stationsFor(handedToPrinter, farAway, WHOLE_ROAD)).toEqual([...YOU_TO_ROAD, 'road:printer', 'firewall:printer', 'door:printer']);
  });

  it('a packet whose sender is not drawn starts nowhere on the map', () => {
    const luciaOnly = drawn({ devices: hangingFrom(floor1.id, 'lucia-laptop'), routers: WHOLE_ROAD.routers });
    const fromYou = sendOnFloors('your-laptop', floor1.lucia);
    expect(startsOnMap(fromYou.packet, luciaOnly)).toBe(false);
    expect(startsOnMap(sendOnFloors('lucia-laptop', server.ip).packet, luciaOnly)).toBe(true);
    expect(stationsOf(fromYou, luciaOnly)).toEqual([]);
  });
});

describe('a packet that dies at the NAT of the office', () => {
  const natWorld = applyAction(applyAction(FLOORS, { type: 'addActor', actor: CASA_LUCIA }), { type: 'setServices', ownerId: 'andres-laptop', services: [tcpService(3000)] });
  const toTheRouter = { from: actor(CASA_LUCIA.id), to: officeRouter.uplink, protocol: 'tcp', port: 40009 } as const;

  it('with no row to deliver it, ends at the router of the office, where the NAT dropped it', () => {
    const trace = simulate(natWorld, toTheRouter);
    expect(trace.steps.at(-1)?.reason.code).toBe('nat-no-translation');
    expect(stationsFor(trace, toTheRouter, drawn({ ...WHOLE_ROAD, clients: [CASA_LUCIA.id] })).at(-1)).toBe('router:router-office');
  });

  it('with no row to deliver it and its router out of sight, ends past the last drawn piece it crossed, as any router that drops a packet does', () => {
    const routerOutOfSight = drawn({ devices: ON_FLOOR_1, routers: [provider.id], internet: true, clients: [CASA_LUCIA.id] });
    const stations = stationsFor(simulate(natWorld, toTheRouter), toTheRouter, routerOutOfSight);
    expect(stations).toEqual(['door:casa-lucia', 'internet', 'mid:internet-line-end']);
    expect(stations).not.toContain('router:router-office');
  });
});

describe('pathFor of a datagram that gets a Port Unreachable', () => {
  const printerAsResolver = withDevice(officeWithNames(), 'andres-laptop', { dnsServer: floor1.printer });
  const lookup = dig(device('andres-laptop'), `www.${NAME_SERVER_PIECES.zone}`);
  const answered = simulate(printerAsResolver, lookup);

  it('runs to the door of the equipment that returns the warning, since the datagram does arrive there', () => {
    expect(answered.notice).toMatchObject({ kind: 'port-unreachable', fromId: 'printer' });
    const map = drawn({ devices: DEVICES_ON_FLOORS, routers: [officeRouter.id], internet: true });
    expect(stationsFor(answered, lookup, map)).toEqual(['door:andres-laptop', 'firewall:andres-laptop', 'road:andres-laptop', 'router:router-office', 'road:printer', 'firewall:printer', 'door:printer']);
  });
});

describe('stationsFor', () => {
  it('a packet to an IP that no device has runs to the end of the bus of its network', () => {
    for (const [from, bus] of [['servidor1', 'subnet-a'], ['servidor2', 'subnet-b']]) {
      const packet = ping(device(from), '172.31.99.99');
      const lost = simulate(lab03Net(), packet);
      expect(lost.steps.map((step) => step.reason.code)).toContain('route-no-device');
      expect(stationsFor(lost, packet, VPC).at(-1)).toBe(`bus-end:${bus}`);
    }
  });

  it('a packet that a router the map does not draw dropped ends half way between the two stops around it', () => {
    const expired = sendOnFloors('your-laptop', server.ip, 2);
    expect(expired.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);
    const aroundTheProvider = drawn({ ...WHOLE_ROAD, routers: [officeRouter.id, backbone.id] });
    expect(stationsOf(expired, aroundTheProvider).slice(-2)).toEqual(['router:router-office', 'mid:router:router-office-router:router-backbone']);
  });

  it('a packet that dies at a router with no stop drawn beyond ends past the last stop it crossed, at the end of the line', () => {
    const vanished = sendOnFloors('your-laptop', '10.0.0.10');
    expect(stationsOf(vanished, drawn({ devices: ON_FLOOR_1, routers: [officeRouter.id] })).slice(-2)).toEqual(['router:router-office', 'mid:router:router-office-line-end']);
    expect(stationsOf(vanished, drawn({ devices: ON_FLOOR_1 }))).toEqual([...YOU_TO_ROAD, 'mid:bus:floor-1-line-end']);
  });

  it('a packet from the internet to a public IP that no router owns is lost in the internet', () => {
    const withTheClient = applyAction(FLOORS, { type: 'addActor', actor: CASA_LUCIA });
    const toNoRouter = ping(actor(CASA_LUCIA.id), '203.0.113.200');
    const lost = simulate(withTheClient, toNoRouter);
    expect(lost.steps.map((step) => step.reason.code)).toContain('route-no-device');
    expect(stationsFor(lost, toNoRouter, drawn({ ...WHOLE_ROAD, clients: [CASA_LUCIA.id] }))).toEqual(['door:casa-lucia', 'internet']);
  });

  it('a station the map does not draw is left out of the way', () => {
    const toS2 = ping(actor('attacker'), S2.public);
    const crossing = simulate(lab03Net(), toS2);
    expect(stationsFor(crossing, toS2, drawn({ ...VPC, edge: false }))).toEqual(['door:attacker', 'internet', 'road:servidor2', 'firewall:servidor2']);
    expect(stationsFor(crossing, toS2, drawn({ ...VPC, internet: false }))).toEqual(['door:attacker', 'edge', 'road:servidor2', 'firewall:servidor2']);
  });

  it('a station that two points of the way share is named once', () => {
    const toPrivate = ping(actor('attacker'), S2.private);
    const lost = simulate(lab03Net(), toPrivate);
    expect(stationsFor(lost, toPrivate, drawn({ ...VPC, clients: [] }))).toEqual(['internet']);
  });

  it('a packet through the gateway of another office crosses it like any drawn router', () => {
    const toTheBranch = ping(device('your-laptop'), '10.0.0.10');
    const trace = simulate(solvedWorld(INCIDENTS, '02-07'), toTheBranch);
    expect(trace.hops?.map(({ routerId }) => routerId)).toEqual(['office-router', 'branch-router']);
    const withBranch = drawn({
      devices: { 'your-laptop': 'floor-1', 'branch-printer': 'branch-lan', 'branch-laptop': 'branch-lan' },
      routers: ['office-router', 'provider-router'],
      gateways: ['branch-router'],
      internet: true,
      servers: ['internet-server'],
    });
    expect(stationsFor(trace, toTheBranch, withBranch)).toEqual([...YOU_TO_ROAD, 'router:office-router', 'router:branch-router', 'road:branch-printer', 'firewall:branch-printer', 'door:branch-printer']);
  });

  it('a packet starts on the map when its sender is a drawn device, client or server', () => {
    const map = drawn({ ...WHOLE_ROAD, clients: ['attacker'] });
    expect(startsOnMap(ping(device('your-laptop'), floor1.lucia), map)).toBe(true);
    expect(startsOnMap(ping(device('andres-laptop'), floor1.lucia), drawn({ ...WHOLE_ROAD, devices: ON_FLOOR_1 }))).toBe(false);
    expect(startsOnMap(ping(actor('attacker'), floor1.lucia), map)).toBe(true);
    expect(startsOnMap(ping(actor(server.id), floor1.lucia), map)).toBe(true);
    expect(startsOnMap(ping(actor(CASA_LUCIA.id), floor1.lucia), map)).toBe(false);
  });
});

describe('pathFor of a send by name', () => {
  const { zone, downZone, resolver } = NAME_SERVER_PIECES;
  const WWW = `www.${zone}`;
  const names = officeWithNames();
  const NAMES_ROAD = drawn({ devices: DEVICES_ON_FLOORS, routers: [officeRouter.id, provider.id, backbone.id], internet: true, servers: [server.id, resolver.id] });
  const toName = (world: Network, name: string) => {
    const packet = ping(device('your-laptop'), name);
    return { packet, trace: simulate(world, packet) };
  };
  const stationsOfName = (world: Network, name: string, hiddenStop = false) => {
    const sent = toName(world, name);
    return stationsFor(sent.trace, sent.packet, NAMES_ROAD, { hiddenStop });
  };
  const withResolver = (server: string | undefined) => applyAction(names, { type: 'setDnsServer', deviceId: 'your-laptop', ...(server !== undefined && { server }) });
  const LOOKUPS_THAT_FAILED: [string, Network, string][] = [
    ['dns-nxdomain', names, `noexiste.${zone}`],
    ['dns-servfail', names, `www.${downZone}`],
    ['dns-no-address', names, zone],
    ['dns-no-resolver', withResolver(floor1.printer), WWW],
    ['dns-resolver-silent', withResolver(server.nobody), WWW],
  ];

  it('a packet that stopped at its lookup stays at the doorstep of its sender, as a packet that never left', () => {
    for (const [code, world, name] of LOOKUPS_THAT_FAILED) {
      const { trace } = toName(world, name);
      expect(trace.outcome, code).toBe('unresolved');
      expect(trace.steps.map((step) => step.reason.code), code).toEqual([code]);
      expect(stationsOfName(world, name), code).toEqual(AT_YOUR_DOORSTEP);
      expect(stationsOfName(world, name, true), code).toEqual(AT_YOUR_DOORSTEP);
    }
    expect(stationsOfName(names, WWW)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'router:router-provider', 'router:router-backbone', 'door:internet-server']);
  });

  it('a packet of an office with no resolver keeps the path it had in chapter 1', () => {
    for (const world of [withResolver(undefined), officeNet()]) {
      const { trace } = toName(world, WWW);
      expect(trace.steps.map((step) => step.reason.code)).toEqual(['dns-unresolved']);
      expect(stationsOfName(world, WWW)).toEqual(YOU_TO_ROAD);
    }
  });

  it('the path of a question runs to the resolver and back', () => {
    const { question } = toName(names, WWW).trace;
    expect(question?.trace.outcome).toBe('replied');
    expect(question?.trace.header?.reply).toMatchObject({ source: resolver.ip, destination: floor1.you });
    expect(stationsFor(question!.trace, question!.packet, NAMES_ROAD)).toEqual([...YOU_TO_ROAD, 'router:router-office', 'router:router-provider', 'router:router-backbone', `door:${resolver.id}`]);
    const closed = applyAction(withResolver(resolver.ip), { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } });
    const silenced = toName(closed, WWW).trace.question;
    expect(silenced?.trace.outcome).toBe('timeout');
    expect(stationsFor(silenced!.trace, silenced!.packet, NAMES_ROAD)).toEqual(['door:your-laptop', 'firewall:your-laptop']);
  });
});
