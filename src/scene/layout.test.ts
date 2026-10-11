import { OrthographicCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { OFFICE, OFFICE_FLOORS, actor, device, echoFrom, lab03Net, officeNet, officeTwoFloorsNet, ping, withDevice, withInbound } from '@/testing';
import type { Firewall } from '@/engine';
import type { MapPieceKind } from './overlay/piece-label';
import { simulate } from '@/engine/simulation/simulate';
import {
  CAMERA_ZOOM,
  CARD_WIDTH,
  LABEL_REACH,
  cameraPosition,
  cardAnchorPosition,
  cardPlacement,
  cardSpan,
  computeLayout,
  cumulativeLengths,
  dockOffset,
  dockRoom,
  labelPosition,
  layoutCenter,
  pathFor,
  pathLength,
  pointAt,
  roundTrip,
  sideForNdc,
  spreadStamps,
  startsOnMap,
  terminalSide,
  type CardPosition,
  type Layout,
  type LayoutPiece,
  type Vec2,
  type Vec3,
} from './layout';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net(), true);

  it('puts one column per subnet and each instance inside its own', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.devices.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.devices.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the firewall and the road sit in front of the device (greater z, toward the camera)', () => {
    const spot = layout.devices.servidor2;
    expect(spot.firewall[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.firewall[1]);
  });

  it('the edge, then the internet, then the actors sit on the left of the sheet, and the road starts at the edge', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
    expect(layout.roadFromX).toBe(layout.edge[0]);
  });
});

describe('computeLayout for an office', () => {
  const layout = computeLayout(officeNet(), true);
  const spots = ['your-laptop', 'lucia-laptop', 'printer'].map((id) => layout.devices[id]);

  it('puts every device in one row on the sheet, with no subnet', () => {
    expect(layout.subnets).toEqual({});
    expect(spots.map((spot) => spot.z)).toEqual([spots[0].z, spots[0].z, spots[0].z]);
    expect(spots[0].x).toBeLessThan(spots[1].x);
    expect(spots[1].x).toBeLessThan(spots[2].x);
    for (const spot of spots) expect(Math.abs(spot.x)).toBeLessThan(layout.sheet.width / 2);
  });

  it('puts the router, the internet and the actor on the left, like a VPC', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
  });

  it('without the outside, the road stays on the sheet and the camera looks at the sheet only', () => {
    const inside = computeLayout(officeNet(), false);
    expect(inside.roadFromX).toBeGreaterThan(-inside.sheet.width / 2);
    expect(layoutCenter(inside)).toEqual([0, 0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net, true);

  it('step 3: ends at the firewall of servidor2', () => {
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.firewall);
  });

  it('step 5: reaches the door of servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.door);
  });

  it('a ping from the internet to a public IP crosses the internet and the edge before the firewall', () => {
    const packet = ping(actor('attacker'), S2.public);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet, layout.edge, layout.devices.servidor2.road, layout.devices.servidor2.firewall]);
  });

  it('a private IP from the internet is lost in the internet, before the edge', () => {
    const packet = ping(actor('attacker'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet]);
  });
});

describe('pathFor in an office', () => {
  const net = officeNet();
  const layout = computeLayout(net, true);
  const you = layout.devices['your-laptop'];

  it('a ping to its own IP stays at its own doorstep: it never reaches its firewall or the road', () => {
    const packet = ping(device('your-laptop'), OFFICE.you);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([you.door, you.doorstep]);
    expect(you.doorstep[1]).toBeLessThan(you.firewall[1]);
  });

  it('a ping to an IP that no device has stays at its own doorstep: its own device warns, so nothing goes out', () => {
    const packet = ping(device('your-laptop'), OFFICE.nobody);
    const trace = simulate(net, packet);
    expect(trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: 'your-laptop' });
    expect(pathFor(trace, packet, layout)).toEqual([you.door, you.doorstep]);
  });

  it('a ping to an IP that no instance of a VPC has runs to the far end of the road and stops there', () => {
    const vpc = lab03Net();
    const inside = computeLayout(vpc, true);
    const packet = ping(device('servidor1'), '172.31.99.99');
    const trace = simulate(vpc, packet);
    expect(trace.steps.map((step) => step.reason.code)).toContain('route-no-device');
    const path = pathFor(trace, packet, inside);
    expect(path.at(-1)).toEqual([inside.roadToX, inside.roadZ]);
    expect(path).toContainEqual(inside.devices.servidor1.firewall);
  });

  it('a ping between two laptops runs along the road from one door to the other', () => {
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const lucia = layout.devices['lucia-laptop'];
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('a ping from the internet to a private IP of the office is lost in the internet, before the router', () => {
    const packet = ping(actor('attacker'), OFFICE.you);
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([layout.actors.attacker, layout.internet]);
  });

  it('while the map does not show the outside, a packet never travels to the edge it does not draw', () => {
    const alone = { ...net, actors: [] };
    const inside = computeLayout(alone, false);
    const packet = ping(device('your-laptop'), '8.8.8.8');
    const path = pathFor(simulate(alone, packet), packet, inside);
    expect(path).not.toContainEqual(inside.edge);
    expect(path.at(-1)).toEqual(inside.devices['your-laptop'].road);
  });
});

describe('pathFor when a firewall the player does not know stops the packet', () => {
  const base = officeNet();
  const layout = computeLayout(base, true);
  const you = layout.devices['your-laptop'];
  const lucia = layout.devices['lucia-laptop'];
  const outbound: Firewall = { id: 'fw-you', name: 'your-laptop', kind: 'host-firewall', inbound: [], outbound: [] };

  it('ends at the door of the device that guards the way in, where a delivered packet ends, and not in front of the firewall', () => {
    const guarded = withDevice(base, 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const trace = simulate(guarded, packet);
    expect(pathFor(trace, packet, layout).at(-1)).toEqual(lucia.firewall);
    expect(pathFor(trace, packet, layout, true)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('stays at the doorstep of the device that guards the way out, as a packet to its own IP does', () => {
    const guarded = withDevice({ ...base, firewalls: [outbound] }, 'your-laptop', { firewallIds: ['fw-you'] });
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const trace = simulate(guarded, packet);
    expect(pathFor(trace, packet, layout)).toEqual([you.door, you.firewall]);
    expect(pathFor(trace, packet, layout, true)).toEqual([you.door, you.doorstep]);
  });

  it('changes nothing for a packet that no firewall stopped', () => {
    const packet = ping(device('your-laptop'), OFFICE.nobody);
    const trace = simulate(base, packet);
    expect(pathFor(trace, packet, layout, true)).toEqual(pathFor(trace, packet, layout));
  });
});

const FLOORS = officeTwoFloorsNet();
const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const placedDevice = (anchorId: string): LayoutPiece => ({ kind: 'device', anchorId });
const placedRouter = (anchorId: string): LayoutPiece => ({ kind: 'edge', anchorId });
const GLOBE: LayoutPiece = { kind: 'internet', anchorId: 'internet' };
const FLOOR_1_DEVICES = ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer'].map(placedDevice);
const ALL_ROUTERS = [officeRouter, provider, backbone].map((router) => placedRouter(router.id));
const SERVER_PIECE = placedDevice(server.id);
const OFFICE_AND_ROAD = [...FLOOR_1_DEVICES, placedDevice('andres-laptop'), ...ALL_ROUTERS, GLOBE, SERVER_PIECE];
const layoutOf = (...pieces: LayoutPiece[]) => computeLayout(FLOORS, pieces);
const xs = (spots: Record<string, Vec2>) => Object.values(spots).map(([x]) => x);

describe('computeLayout of an office with floors', () => {
  it('lays out one column per LAN that has a drawn piece', () => {
    const both = layoutOf(...OFFICE_AND_ROAD);
    expect(Object.keys(both.floors)).toEqual([floor1.id, floor2.id]);
    expect(both.floors[floor1.id].x).toBeLessThan(both.floors[floor2.id].x);
    for (const id of ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer']) expect(Math.abs(both.devices[id].x - both.floors[floor1.id].x)).toBeLessThan(both.floors[floor1.id].width / 2);
    expect(Math.abs(both.devices['andres-laptop'].x - both.floors[floor2.id].x)).toBeLessThan(both.floors[floor2.id].width / 2);
    const second = layoutOf(placedDevice('andres-laptop'));
    expect(Object.keys(second.floors)).toEqual([floor2.id]);
    expect(Object.keys(layoutOf(placedDevice('your-laptop')).floors)).toEqual([floor1.id]);
  });

  it('puts a slab under each floor, with a gap between slabs, and the sheet spans them', () => {
    const { floors, sheet } = layoutOf(...OFFICE_AND_ROAD);
    const [first, second] = [floors[floor1.id], floors[floor2.id]];
    expect(first.x + first.width / 2).toBeLessThan(second.x - second.width / 2);
    expect(sheet.width).toBeCloseTo(second.x + second.width / 2 - (first.x - first.width / 2));
    expect(first.x - first.width / 2).toBeCloseTo(-sheet.width / 2);
    expect(first.depth).toBe(sheet.depth);
  });

  it('lays out the drawn routers along the road between the office and the internet, in order', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    const [office, inProvider, inBackbone] = [officeRouter, provider, backbone].map((router) => layout.routers[router.id]);
    expect(office[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(inProvider[0]).toBeLessThan(office[0]);
    expect(inBackbone[0]).toBeLessThan(inProvider[0]);
    expect(layout.internet[0]).toBeLessThan(inBackbone[0]);
    expect([office[1], inProvider[1], inBackbone[1], layout.internet[1]]).toEqual([layout.roadZ, layout.roadZ, layout.roadZ, layout.roadZ]);
    const skipping = layoutOf(...FLOOR_1_DEVICES, placedRouter(officeRouter.id), placedRouter(backbone.id), GLOBE);
    expect(skipping.routers[officeRouter.id]).toEqual(skipping.edge);
    expect(skipping.edge[0] - skipping.routers[backbone.id][0]).toBeCloseTo(office[0] - inProvider[0]);
    expect(Object.keys(skipping.routers)).toEqual([officeRouter.id, backbone.id]);
  });

  it('a server of the internet stands past the last drawn router', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    expect(layout.servers[server.id][0]).toBeLessThan(Math.min(...xs(layout.routers)));
    expect(layout.servers[server.id][1]).toBe(layout.roadZ);
    const fewer = layoutOf(...FLOOR_1_DEVICES, placedRouter(officeRouter.id), SERVER_PIECE);
    expect(fewer.servers[server.id][0]).toBeLessThan(fewer.routers[officeRouter.id][0]);
    expect(Object.keys(fewer.devices)).not.toContain(server.id);
  });

  it('a device that is not connected stands outside the slab', () => {
    const layout = layoutOf(...FLOOR_1_DEVICES, placedDevice('guest-laptop'), placedDevice('andres-laptop'));
    const guest = layout.devices['guest-laptop'];
    expect(guest.plugged).toBe(false);
    expect(layout.devices['your-laptop'].plugged).toBe(true);
    for (const floor of Object.values(layout.floors)) expect(guest.x).toBeGreaterThan(floor.x + floor.width / 2);
    expect(guest.x).toBeGreaterThan(layout.sheet.width / 2);
    expect(layoutCenter(layout)[0]).toBeGreaterThan(0);
    expect(layout.roadToX).toBeLessThan(guest.x);
  });

  it('gives a spot only to the pieces it is given', () => {
    const layout = layoutOf(placedDevice('your-laptop'), placedRouter(officeRouter.id), placedDevice(server.id));
    expect(Object.keys(layout.devices)).toEqual(['your-laptop']);
    expect(Object.keys(layout.routers)).toEqual([officeRouter.id]);
    expect(Object.keys(layout.servers)).toEqual([server.id]);
    expect(layout.actors).toEqual({});
    const attacker = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' } as const;
    const visited = computeLayout({ ...FLOORS, actors: [attacker, ...FLOORS.actors] }, [placedDevice('your-laptop'), { kind: 'actor', anchorId: attacker.id }]);
    expect(Object.keys(visited.actors)).toEqual([attacker.id]);
    expect(Object.keys(visited.servers)).toEqual([]);
  });

  it('a floor with no drawn piece has no slab and no label', () => {
    const layout = layoutOf(placedDevice('andres-laptop'), placedRouter(officeRouter.id));
    expect(layout.floors[floor1.id]).toBeUndefined();
    expect(Object.keys(layout.floors)).toEqual([floor2.id]);
    expect(layout.floors[floor2.id].label).toHaveLength(3);
    expect(Object.keys(layoutOf(placedRouter(officeRouter.id)).floors)).toEqual([]);
  });

  it('the labels of two floors do not overlap', () => {
    const roomy = [...FLOOR_1_DEVICES, placedDevice('andres-laptop')];
    const tight = [placedDevice('your-laptop'), placedDevice('andres-laptop')];
    for (const pieces of [roomy, tight]) {
      const layout = layoutOf(...pieces);
      const { pixel } = projection(layout, MAPS[0]);
      const [one, two] = [floor1.id, floor2.id].map((id) => boxAround(id, pixel(layout.floors[id].label), LABEL_REACH, LABEL_HALF_HEIGHT));
      expect(hits(one, two)).toBe(false);
    }
  });

  it('the name of a floor floats clear of the label of the firewall of the only device on that floor', () => {
    const layout = layoutOf(placedDevice('your-laptop'));
    const { pixel } = projection(layout, MAPS[0]);
    const name = boxAround('floor name', pixel(layout.floors[floor1.id].label), FLOOR_NAME_HALF_WIDTH, FLOOR_NAME_HALF_HEIGHT);
    const firewall = boxAround('firewall label', pixel(labelPosition({ kind: 'firewall', anchorId: 'your-laptop' }, layout)), FIREWALL_LABEL_HALF_WIDTH, LABEL_HALF_HEIGHT);
    expect(hits(name, firewall)).toBe(false);
  });

  it('the office keeps full size in every incident, whichever pieces it draws', () => {
    const whole = layoutOf(...OFFICE_AND_ROAD);
    const pair = layoutOf(placedDevice('your-laptop'), placedDevice('lucia-laptop'));
    const single = layoutOf(placedDevice('your-laptop'));
    const pixelsBetween = (layout: Layout, a: Vec3, b: Vec3) => {
      const { pixel } = projection(layout, MAPS[0]);
      return Math.hypot(pixel(b)[0] - pixel(a)[0], pixel(b)[1] - pixel(a)[1]);
    };
    const unit = (layout: Layout) => {
      const { x, z } = layout.devices['your-laptop'];
      return pixelsBetween(layout, [x, 0, z], [x + 1, 0, z]);
    };
    const pitch = (layout: Layout) => {
      const [you, lucia] = ['your-laptop', 'lucia-laptop'].map((id) => layout.devices[id]);
      return pixelsBetween(layout, [you.x, 0, you.z], [lucia.x, 0, lucia.z]);
    };
    const lookFrom = (layout: Layout) => {
      const [cx, cz] = layoutCenter(layout);
      return cameraPosition(layout).map((value, index) => value - [cx, 0, cz][index]);
    };
    expect(CAMERA_ZOOM).toBe(38);
    expect(unit(single)).toBeCloseTo(unit(whole));
    expect(pitch(pair)).toBeCloseTo(pitch(whole));
    expect(lookFrom(single)).toEqual(lookFrom(whole));
  });

  it('the place of the office depends only on the pieces its incident draws', () => {
    const pieces = [...FLOOR_1_DEVICES, placedRouter(officeRouter.id), GLOBE];
    const grown: typeof FLOORS = { ...FLOORS, devices: [...FLOORS.devices, { ...FLOORS.devices[0], id: 'extra', name: 'extra', privateIp: '192.168.1.200' }] };
    expect(computeLayout(grown, pieces)).toEqual(layoutOf(...pieces));
    expect(layoutCenter(layoutOf(...FLOOR_1_DEVICES))).toEqual([0, 0]);
    expect(layoutCenter(layoutOf(...pieces))[0]).toBeLessThan(0);
    expect(layoutCenter(layoutOf(...pieces, ...ALL_ROUTERS, SERVER_PIECE))[0]).toBeLessThan(layoutCenter(layoutOf(...pieces))[0]);
  });

  it('when only the sender of the office is drawn, no other device of the office gets a spot and the office router keeps its own, as in 10', () => {
    const tracing = layoutOf(placedDevice('your-laptop'), ...ALL_ROUTERS, GLOBE, SERVER_PIECE);
    expect(Object.keys(tracing.devices)).toEqual(['your-laptop']);
    expect(Object.keys(tracing.routers)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(tracing.routers[officeRouter.id]).toEqual(tracing.edge);
    expect(Object.keys(tracing.floors)).toEqual([floor1.id]);
    expect(tracing.stops).toHaveLength(5);
  });

  it('the label of a server of the internet floats above the stamp of a ping that reaches the server', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    const { pixel } = projection(layout, MAPS[0]);
    const [x, z] = layout.servers[server.id];
    const label = boxAround('label', pixel(labelPosition(SERVER_PIECE, layout)), SERVER_LABEL_HALF_WIDTH, LABEL_HALF_HEIGHT);
    const stamp = boxAround('stamp', pixel([x, STAMP_HEIGHT, z]), STAMP_RADIUS, STAMP_RADIUS);
    expect(hits(label, stamp)).toBe(false);
  });

  it('the camera keeps the whole label of the server of the internet inside the map of the narrowest window', () => {
    const office = ['your-laptop', 'lucia-laptop', 'printer', 'andres-laptop'].map(placedDevice);
    const layout = layoutOf(...office, placedRouter(officeRouter.id), GLOBE, SERVER_PIECE);
    const [map] = MAPS;
    const [x] = projection(layout, map).pixel(labelPosition(SERVER_PIECE, layout));
    expect(x - SERVER_LABEL_HALF_WIDTH).toBeGreaterThanOrEqual(0);
    expect(x + SERVER_LABEL_HALF_WIDTH).toBeLessThanOrEqual(map.width);
  });

  it('a lone edge, the internet and a client actor still lay out as in a network with no routers', () => {
    const home = { id: 'home', name: 'Casa', ip: '203.0.113.7', kind: 'home' } as const;
    const layout = computeLayout({ ...officeNet(), actors: [home] }, true);
    expect(layout.outside).toBe(true);
    expect(layout.actors.home[0]).toBeLessThan(layout.internet[0]);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.routers).toEqual({});
    expect(layout.floors).toEqual({});
  });

  it('draws the outside as soon as any piece of it is drawn, with or without the edge', () => {
    expect(layoutOf(...FLOOR_1_DEVICES, GLOBE).outside).toBe(true);
    expect(layoutOf(...FLOOR_1_DEVICES, SERVER_PIECE).outside).toBe(true);
    expect(layoutOf(...FLOOR_1_DEVICES).outside).toBe(false);
  });
});

describe('pathFor in an office with routers', () => {
  const layout = layoutOf(...OFFICE_AND_ROAD);
  const you = layout.devices['your-laptop'];
  const andres = layout.devices['andres-laptop'];
  const at = (id: string) => layout.routers[id];
  const trace = (from: string, to: string, ttl?: number) => {
    const packet = { ...ping(device(from), to), ...(ttl && { ttl }) };
    return { packet, trace: simulate(FLOORS, packet) };
  };

  it('the path of a packet goes through the drawn routers it crossed, in order', () => {
    const toServer = trace('your-laptop', server.ip);
    expect(toServer.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id, backbone.id]);
    expect(pathFor(toServer.trace, toServer.packet, layout)).toEqual([you.door, you.firewall, you.road, at(officeRouter.id), at(provider.id), at(backbone.id), layout.servers[server.id]]);
    const toAndres = trace('your-laptop', OFFICE_FLOORS.floor2.andres);
    expect(pathFor(toAndres.trace, toAndres.packet, layout)).toEqual([you.door, you.firewall, you.road, at(officeRouter.id), andres.road, andres.firewall, andres.door]);
  });

  it('skips the routers that are not drawn and goes through the ones that are', () => {
    const fewer = layoutOf(...FLOOR_1_DEVICES, placedRouter(officeRouter.id), placedRouter(backbone.id), GLOBE, SERVER_PIECE);
    const toServer = trace('your-laptop', server.ip);
    const path = pathFor(toServer.trace, toServer.packet, fewer);
    expect(path.slice(3)).toEqual([fewer.routers[officeRouter.id], fewer.routers[backbone.id], fewer.servers[server.id]]);
  });

  it('a packet to the same floor stays on the road and crosses no router', () => {
    const toLucia = trace('your-laptop', OFFICE_FLOORS.floor1.lucia);
    const lucia = layout.devices['lucia-laptop'];
    expect(pathFor(toLucia.trace, toLucia.packet, layout)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('a packet to the interface of a router ends at that router', () => {
    const toGateway = trace('your-laptop', floor1.gateway);
    expect(pathFor(toGateway.trace, toGateway.packet, layout).at(-1)).toEqual(at(officeRouter.id));
  });

  it('a packet that dies at a drawn router ends at that router', () => {
    const expiring = trace('your-laptop', server.ip, 2);
    expect(expiring.trace.outcome).toBe('ttl-exceeded');
    expect(pathFor(expiring.trace, expiring.packet, layout)).toEqual([you.door, you.firewall, you.road, at(officeRouter.id), at(provider.id)]);
    const first = trace('your-laptop', server.ip, 1);
    expect(pathFor(first.trace, first.packet, layout).at(-1)).toEqual(at(officeRouter.id));
  });

  it('a warning that the sender itself generates never leaves the device: it appears at its own doorstep', () => {
    const toNobody = trace('your-laptop', floor1.nobody);
    expect(toNobody.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: 'your-laptop' });
    expect(pathFor(toNobody.trace, toNobody.packet, layout)).toEqual([you.door, you.doorstep]);
    const toGuest = trace('your-laptop', floor1.guest);
    expect(pathFor(toGuest.trace, toGuest.packet, layout)).toEqual([you.door, you.doorstep]);
  });

  it('a warning from a router is generated where the packet dies, so the path it comes back along ends at that router', () => {
    const noHost = trace('your-laptop', '198.51.100.77');
    expect(noHost.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: backbone.id });
    expect(pathFor(noHost.trace, noHost.packet, layout).at(-1)).toEqual(at(backbone.id));
    const expiring = trace('your-laptop', server.ip, 2);
    expect(expiring.trace.notice).toMatchObject({ kind: 'time-exceeded', fromId: provider.id });
    expect(pathFor(expiring.trace, expiring.packet, layout).at(-1)).toEqual(at(provider.id));
  });

  it('a packet that dies at a router that is not drawn ends between the last drawn piece it crossed and the next one', () => {
    const outside = layoutOf(...FLOOR_1_DEVICES, placedRouter(officeRouter.id), GLOBE, SERVER_PIECE);
    const lost = trace('your-laptop', '10.0.0.10');
    expect(lost.trace.outcome).toBe('timeout');
    expect(lost.trace.hops?.map((hop) => hop.routerId)).toEqual([officeRouter.id, provider.id]);
    const path = pathFor(lost.trace, lost.packet, outside);
    const [x, z] = path[path.length - 1];
    expect(x).toBeLessThan(outside.routers[officeRouter.id][0]);
    expect(x).toBeGreaterThan(outside.internet[0]);
    expect(z).toBe(outside.roadZ);
    expect(path.slice(0, -1).at(-1)).toEqual(outside.routers[officeRouter.id]);
  });

  it('a packet that dies at a router that is not drawn before any drawn router ends between the sender and the next piece', () => {
    const beyond = layoutOf(...FLOOR_1_DEVICES, GLOBE, SERVER_PIECE);
    const lost = trace('your-laptop', '10.0.0.10');
    const [x] = pathFor(lost.trace, lost.packet, beyond).at(-1) ?? [Number.NaN];
    expect(x).toBeLessThan(beyond.devices['your-laptop'].x);
    expect(x).toBeGreaterThan(beyond.internet[0]);
  });

  it('a loopback ping and an invalid address never draw a path out of the device', () => {
    for (const to of ['127.0.0.1', '127.8.8.8', 'localhost', '256.1.1.1']) {
      const sent = trace('your-laptop', to);
      expect(pathFor(sent.trace, sent.packet, layout), to).toEqual([you.door, you.doorstep]);
    }
    const loopback = trace('your-laptop', '127.0.0.1');
    expect(loopback.trace.steps.map((step) => step.reason.code)).toContain('route-loopback');
  });

  it('a packet whose sender is not drawn starts nowhere on the map', () => {
    const lone = layoutOf(placedDevice('lucia-laptop'), ...ALL_ROUTERS);
    const sent = trace('your-laptop', OFFICE_FLOORS.floor1.lucia);
    expect(startsOnMap(sent.packet, lone)).toBe(false);
    expect(startsOnMap(trace('lucia-laptop', server.ip).packet, lone)).toBe(true);
    expect(pathFor(sent.trace, sent.packet, lone).length).toBeGreaterThan(0);
  });
});

describe('path interpolation', () => {
  it('pointAt walks the segments in order', () => {
    const path: [number, number][] = [[0, 0], [2, 0], [2, 2]];
    const lengths = cumulativeLengths(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(pointAt(path, lengths, 1)).toEqual([1, 0]);
    expect(pointAt(path, lengths, 3)).toEqual([2, 1]);
    expect(pointAt(path, lengths, 99)).toEqual([2, 2]);
  });
});

describe('anchors', () => {
  const layout = computeLayout(lab03Net(), true);

  it('the camera looks at the middle of everything drawn, actors included', () => {
    const [x] = layoutCenter(layout);
    const left = Math.min(...Object.values(layout.actors).map(([actorX]) => actorX));
    expect(x - left).toBeCloseTo(layout.sheet.width / 2 - x);
  });

  it('a Security Group label sits in front of its firewall, and a device label above it', () => {
    const spot = layout.devices.servidor2;
    expect(labelPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.firewall[1]);
    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[0]).toBe(spot.firewall[0]);
  });

  it('a card can open beside a device or an actor too', () => {
    const [x, , z] = cardAnchorPosition({ kind: 'actor', anchorId: 'attacker' }, layout);
    expect([x, z]).toEqual(layout.actors.attacker);
    expect(cardAnchorPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[0]).toBe(layout.devices.servidor2.x);
  });

  it('the internet label floats above the internet', () => {
    const [x, y, z] = labelPosition({ kind: 'internet', anchorId: 'internet' }, layout);
    expect([x, z]).toEqual(layout.internet);
    expect(y).toBeGreaterThan(1);
  });

  it('a card opens on the side of the screen with more room', () => {
    expect(sideForNdc(0.4)).toBe('left');
    expect(sideForNdc(-0.4)).toBe('right');
  });
});

interface MapSize {
  window: string;
  width: number;
  height: number;
}

interface Hazard {
  name: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

type Piece = { kind: MapPieceKind; anchorId: string };

const STAMP_RADIUS = 16;
const STAMP_HEIGHT = 0.9;
const LABEL_HALF_HEIGHT = 11;
const SERVER_LABEL_HALF_WIDTH = 78;
const FIREWALL_LABEL_HALF_WIDTH = 73;
const FLOOR_NAME_HALF_WIDTH = 24;
const FLOOR_NAME_HALF_HEIGHT = 14;
const MAPS: MapSize[] = [
  { window: '1280×800', width: 900, height: 800 },
  { window: '1440×900', width: 1060, height: 900 },
];
const YOUR_LAPTOP: Piece = { kind: 'device', anchorId: 'your-laptop' };
const HOME: Piece = { kind: 'actor', anchorId: 'attacker' };
const TERMINAL_HEIGHT = { office: 321, yours: 468, home: 495 };

function boxAround(name: string, [x, y]: Vec2, halfWidth: number, halfHeight: number): Hazard {
  return { name, x0: x - halfWidth, x1: x + halfWidth, y0: y - halfHeight, y1: y + halfHeight };
}

function hits(a: Hazard, b: Hazard): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

function projection(layout: Layout, map: MapSize) {
  const camera = new OrthographicCamera(-map.width / 2, map.width / 2, map.height / 2, -map.height / 2, 0.1, 500);
  const [cx, cz] = layoutCenter(layout);
  camera.zoom = CAMERA_ZOOM;
  camera.position.set(...cameraPosition(layout));
  camera.lookAt(cx, 0, cz);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const pixel = (point: Vec3): Vec2 => {
    const { x, y } = new Vector3(...point).project(camera);
    return [((x + 1) / 2) * map.width, ((1 - y) / 2) * map.height];
  };
  return { pixel };
}

function terminalOnMap(net: ReturnType<typeof officeNet>, outside: boolean, map: MapSize, origin: Piece) {
  const layout: Layout = computeLayout(net, outside);
  const { pixel } = projection(layout, map);
  const pieces: Piece[] = [
    ...net.devices.map((other) => ({ kind: 'device' as const, anchorId: other.id })),
    ...(outside ? [{ kind: 'edge' as const, anchorId: 'edge' }, { kind: 'internet' as const, anchorId: 'internet' }, ...net.actors.map((other) => ({ kind: 'actor' as const, anchorId: other.id }))] : []),
  ];
  const others = pieces.filter((piece) => piece.anchorId !== origin.anchorId);
  const placement = cardPlacement(origin, others, layout);
  const anchor = pixel(placement.position);
  const labels = [...others, origin].map((other) => boxAround(`${other.anchorId} label`, pixel(labelPosition(other, layout)), LABEL_REACH, LABEL_HALF_HEIGHT));
  const senders = [device('your-laptop'), ...(outside ? [actor('attacker')] : [])];
  const ends = senders.flatMap((from) =>
    [OFFICE.printer, OFFICE.lucia, OFFICE.nobody, OFFICE.you].map((address) => {
      const packet = ping(from, address);
      const path = pathFor(simulate(net, packet), packet, layout);
      return path[path.length - 1];
    }),
  );
  const stamps = spreadStamps(ends).map(([x, z], index) => boxAround(`stamp ${index + 1}`, pixel([x, STAMP_HEIGHT, z]), STAMP_RADIUS, STAMP_RADIUS));
  const side = terminalSide(anchor[0], (placement.avoid ?? []).map((point) => pixel(point)[0]), map.width, placement.gap);
  const cardAt = (position: CardPosition, height: number): Hazard => {
    if (position === 'dock') {
      const [dx, dy] = dockOffset(anchor, map);
      return { name: 'card', x0: anchor[0] + dx, x1: anchor[0] + dx + CARD_WIDTH, y0: anchor[1] + dy - height, y1: anchor[1] + dy };
    }
    const [near, far] = cardSpan(position, anchor[0], placement.gap);
    return { name: 'card', x0: near, x1: far, y0: anchor[1] - height / 2, y1: anchor[1] + height / 2 };
  };
  const covered = (position: CardPosition, height: number) => [...labels, ...stamps].filter((hazard) => hits(cardAt(position, height), hazard)).map(({ name }) => name);
  const clearOf = (position: CardPosition, height: number) => {
    const card = cardAt(position, height);
    return card.x0 >= 0 && card.x1 <= map.width && card.y0 >= 0 && card.y1 <= map.height && covered(position, height).length === 0;
  };
  return { side, anchor, placement, cardAt, covered, clearOf };
}

describe('the terminal card in the office with no outside drawn', () => {
  const office = { ...officeNet(), actors: [] };
  const { office: height } = TERMINAL_HEIGHT;

  it.each(MAPS)('at $window it opens to the left of tu-laptop: inside the map, clear of every label and every possible stamp', (map) => {
    const { side, anchor, placement, cardAt, covered } = terminalOnMap(office, false, map, YOUR_LAPTOP);
    const card = cardAt(side, height);
    expect(side).toBe('left');
    expect(Math.min(card.x0, card.y0)).toBeGreaterThanOrEqual(0);
    expect(card.x1).toBeLessThanOrEqual(map.width);
    expect(card.y1).toBeLessThanOrEqual(map.height);
    expect(card.x1).toBeLessThan(anchor[0] - LABEL_REACH);
    expect(covered(side, height)).toEqual([]);
    expect(placement.gap).toBeLessThan(CARD_WIDTH);
  });

  it.each(MAPS)('at $window the right side, where a card opens today, would cover the laptop-lucia and the impresora', (map) => {
    const { covered } = terminalOnMap(office, false, map, YOUR_LAPTOP);
    expect(covered('right', height)).toEqual(expect.arrayContaining(['lucia-laptop label', 'printer label']));
  });
});

describe('the terminal card in the office with the outside drawn', () => {
  const origins = [
    { name: 'tu-laptop', origin: YOUR_LAPTOP, height: TERMINAL_HEIGHT.yours },
    { name: 'Casa de Lucía', origin: HOME, height: TERMINAL_HEIGHT.home },
  ];
  const cases = MAPS.flatMap((map) => origins.map((origin) => ({ map, ...origin })));

  it.each(cases)('at $map.window, for $name, no side is clear, so the terminal docks in the bottom left corner of the map', ({ map, origin, height }) => {
    const { side, cardAt, clearOf } = terminalOnMap(officeNet(), true, map, origin);
    const card = cardAt(side, height);
    expect((['left', 'right'] as const).filter((position) => clearOf(position, height))).toEqual([]);
    expect(side).toBe('dock');
    expect([card.x0, card.x1]).toEqual([6, 6 + CARD_WIDTH]);
    expect(card.y1).toBe(map.height - 6);
    expect(card.y0).toBeGreaterThan(0);
  });

  it.each(cases.filter(({ map, name }) => map.width > 900 || name === 'tu-laptop'))('at $map.window, for $name, the docked terminal covers no label and no possible stamp', ({ map, origin, height }) => {
    const { side, covered } = terminalOnMap(officeNet(), true, map, origin);
    expect(covered(side, height)).toEqual([]);
  });

  it('at 1280×800 the terminal of Casa de Lucía, 495 px tall because its title takes two lines, is 6 px too tall for the free strip: it covers the bottom of the lost stamps and no label', () => {
    const [map] = MAPS;
    const { side, covered } = terminalOnMap(officeNet(), true, map, HOME);
    const names = covered(side, TERMINAL_HEIGHT.home);
    expect(names.filter((name) => name.endsWith('label'))).toEqual([]);
    expect(names.filter((name) => name.startsWith('stamp'))).not.toEqual([]);
  });

  it('at 1920×1080 the terminal of Casa de Lucía does not open to its left, where it would cover the label of the house: it docks', () => {
    const { side, covered } = terminalOnMap(officeNet(), true, { window: '1920×1080', width: 1540, height: 1080 }, HOME);
    expect(covered('left', TERMINAL_HEIGHT.home)).toContain('attacker label');
    expect(side).toBe('dock');
    expect(covered(side, TERMINAL_HEIGHT.home)).toEqual([]);
  });

  it('a map too narrow to hold the card keeps the side with more room', () => {
    expect(terminalSide(100, [], CARD_WIDTH + 10, 68)).toBe('right');
  });
});

describe('the room of a card docked in the corner', () => {
  const FEET = 16;

  it('is the height from the corner up to the feet of the lowest piece that the card spans', () => {
    expect(dockRoom([{ x: 100, bottom: 300 }, { x: 220, bottom: 380 }], { height: 800 })).toBe(800 - 6 - (380 + FEET));
  });

  it('ignores a piece that stands beside the card, out of its span', () => {
    expect(dockRoom([{ x: 100, bottom: 300 }, { x: 600, bottom: 700 }], { height: 800 })).toBe(800 - 6 - (300 + FEET));
    expect(dockRoom([{ x: 600, bottom: 700 }], { height: 800 })).toBeNull();
  });

  it('never leaves less than a card that can be used, whatever the window', () => {
    expect(dockRoom([{ x: 100, bottom: 700 }], { height: 800 })).toBe(200);
  });

  it.each(MAPS)('at $window a terminal docked in the map where 01-10 draws the road takes a height that covers no label', (map) => {
    const road = [...ALL_ROUTERS, GLOBE, SERVER_PIECE];
    const layout = layoutOf(placedDevice('your-laptop'), ...road);
    const { pixel } = projection(layout, map);
    const origin = placedDevice('your-laptop');
    const placement = cardPlacement(origin, road, layout);
    const avoid = placement.avoid ?? [];
    const room = dockRoom(avoid.map((label, index) => ({ x: pixel(label)[0], bottom: pixel(placement.rooted[index])[1] })), map);
    const side = terminalSide(pixel(placement.position)[0], avoid.map((point) => pixel(point)[0]), map.width, placement.gap);
    expect(side).toBe('dock');
    expect(room).not.toBeNull();
    const card: Hazard = { name: 'card', x0: 6, x1: 6 + CARD_WIDTH, y0: map.height - 6 - (room ?? 0), y1: map.height - 6 };
    const labels = [origin, ...road].map((piece) => boxAround(piece.anchorId, pixel(labelPosition(piece, layout)), LABEL_REACH, LABEL_HALF_HEIGHT));
    expect(labels.filter((label) => hits(card, label)).map(({ name }) => name)).toEqual([]);
  });
});

describe('where a card opens', () => {
  const GAP = 68;

  it.each([
    { name: 'the side with more room when both are clear', anchorX: 600, avoidXs: [], room: 900, expected: 'left' },
    { name: 'the other side when the one with more room covers a label', anchorX: 450, avoidXs: [700], room: 900, expected: 'left' },
    { name: 'the dock when both sides cover a label', anchorX: 450, avoidXs: [300, 700], room: 900, expected: 'dock' },
    { name: 'the dock when the side with more room covers a label and the other leaves the map', anchorX: 200, avoidXs: [350], room: 900, expected: 'dock' },
    { name: 'the dock when neither side stays inside the map', anchorX: 300, avoidXs: [], room: 600, expected: 'dock' },
  ] satisfies { name: string; anchorX: number; avoidXs: number[]; room: number; expected: CardPosition }[])('a terminal takes $name', ({ anchorX, avoidXs, room, expected }) => {
    expect(terminalSide(anchorX, avoidXs, room, GAP)).toBe(expected);
  });

  it('a docked card hangs its bottom left corner from the bottom left corner of the map, whatever the height of the card', () => {
    expect(dockOffset([400, 250], { width: 900, height: 800 })).toEqual([-394, 544]);
  });

  it('the card of a firewall keeps its wide gap and its width, and only the screen decides its side', () => {
    const placement = cardPlacement({ kind: 'firewall', anchorId: 'servidor2' }, [{ kind: 'device', anchorId: 'servidor1' }], computeLayout(lab03Net(), true));
    expect(placement).toMatchObject({ gap: 110, avoid: null });
    expect(CARD_WIDTH).toBe(300);
  });
});

describe('paths and stamps', () => {
  it('a round trip goes and comes back along the same points', () => {
    expect(roundTrip([[0, 0], [2, 0], [2, 2]])).toEqual([[0, 0], [2, 0], [2, 2], [2, 0], [0, 0]]);
    expect(pathLength([[0, 0], [3, 0], [3, 4]])).toBe(7);
  });

  it('stamps on the same point spread apart along the screen, the rest stay', () => {
    const [a, b, c] = spreadStamps([[1, 1], [1, 1], [5, 5]]);
    expect(a[0] + b[0]).toBeCloseTo(2);
    expect(a[0]).toBeLessThan(b[0]);
    expect(a[0] - 1).toBeCloseTo(-(a[1] - 1));
    expect(c).toEqual([5, 5]);
  });

  const minimumGap = 0.8;
  const gaps = (stamps: Vec2[]) => stamps.flatMap((stamp, index) => stamps.slice(index + 1).map((other) => Math.hypot(stamp[0] - other[0], stamp[1] - other[1])));

  it('chains close points into one group: A near B and B near C spread together, although A is far from C', () => {
    const points: Vec2[] = [[0, 0], [0.9, 0], [1.8, 0]];
    for (const gap of gaps(spreadStamps(points))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('a spread group that comes close to another stamp takes it in, so no two stamps end up closer than the minimum', () => {
    for (const gap of gaps(spreadStamps([[0, 0], [0, 0], [1, 0]]))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device', () => {
    const { door, doorstep, firewall } = computeLayout(officeNet(), false).devices['your-laptop'];
    const stamps = spreadStamps([door, doorstep, firewall]);
    stamps.forEach((stamp, index) => {
      for (const other of stamps.slice(index + 1)) expect(Math.hypot(stamp[0] - other[0], stamp[1] - other[1])).toBeGreaterThanOrEqual(minimumGap);
    });
  });

  it('moves apart stamps that are farther than the minimum on the ground and still overlap on the screen, such as the two tests that stay at the doorstep and the one that ends on the road in front of it', () => {
    const layout = layoutOf(placedDevice('your-laptop'));
    const { doorstep, road } = layout.devices['your-laptop'];
    const { pixel } = projection(layout, MAPS[0]);
    const boxes = spreadStamps([doorstep, doorstep, road]).map(([x, z], index) => boxAround(`stamp ${index + 1}`, pixel([x, STAMP_HEIGHT, z]), STAMP_RADIUS, STAMP_RADIUS));
    expect(Math.hypot(doorstep[0] - road[0], doorstep[1] - road[1])).toBeGreaterThan(1);
    boxes.forEach((box, index) => {
      for (const other of boxes.slice(index + 1)) expect(hits(box, other), `${box.name} / ${other.name}`).toBe(false);
    });
  });

  it('keeps each spread stamp on its own side of the screen, whatever the order of the points', () => {
    const { door, firewall } = computeLayout(lab03Net(), true).devices.servidor2;
    const screenX = (point: Vec2) => point[0] - point[1];
    const [doorStamp, firewallStamp] = spreadStamps([door, firewall]);
    expect(screenX(firewall)).toBeLessThan(screenX(door));
    expect(screenX(firewallStamp)).toBeLessThan(screenX(doorStamp));
    expect(Math.hypot(doorStamp[0] - door[0], doorStamp[1] - door[1])).toBeLessThan(0.45);
    expect(Math.hypot(firewallStamp[0] - firewall[0], firewallStamp[1] - firewall[1])).toBeLessThan(0.45);
  });
});
