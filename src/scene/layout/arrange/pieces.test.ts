import { describe, expect, it } from 'vitest';
import { nameTag } from '@/copy';
import { INCIDENTS, startWorld } from '@/levels';
import { OFFICE_FLOORS, lab03Net, officeNet, officeTwoFloorsNet } from '@/testing';
import type { PieceKind, RowPiece } from './geometry';
import { busOf, classify, drawnOf, labelOf } from './pieces';

const piece = (kind: PieceKind, anchorId: string, extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal', ...extras });
const ids = (list: readonly { id: string }[]) => list.map(({ id }) => id);

const FLOORS = officeTwoFloorsNet();
const { floor1, floor2, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const FLOOR_1_DEVICES = ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer'].map((id) => piece('device', id));
const ROUTERS = [officeRouter, provider, backbone].map((router) => piece('edge', router.id, { inOffice: router.id === officeRouter.id }));
const GLOBE = piece('internet', 'internet');
const WHOLE_ROAD = [...FLOOR_1_DEVICES, piece('device', 'andres-laptop'), ...ROUTERS, GLOBE, piece('device', server.id)];

describe('busOf', () => {
  it('names the bus of a device by its subnet, by its floor, or by the kind of the world', () => {
    const vpc = lab03Net();
    expect(vpc.devices.map((device) => busOf(vpc, device))).toEqual(['subnet-a', 'subnet-b']);
    expect(FLOORS.devices.map((device) => busOf(FLOORS, device))).toEqual([floor1.id, floor1.id, floor1.id, floor1.id, floor1.id, floor2.id]);
    expect(officeNet().devices.map((device) => busOf(officeNet(), device))).toEqual(['office', 'office', 'office']);
  });

  it('a world with one floor puts every device on it, and a device of an unknown floor or subnet hangs from no bus', () => {
    const oneFloor = { ...FLOORS, lans: (FLOORS.lans ?? []).slice(0, 1), devices: FLOORS.devices.map((device) => ({ ...device, lanId: undefined })) };
    expect(oneFloor.devices.map((device) => busOf(oneFloor, device))).toEqual(oneFloor.devices.map(() => floor1.id));
    const lost = { ...FLOORS.devices[0], lanId: 'floor-9' };
    expect(busOf(FLOORS, lost)).toBeUndefined();
    expect(busOf(lab03Net(), { ...lab03Net().devices[0], subnetId: 'subnet-z' })).toBeUndefined();
  });
});

describe('classify', () => {
  it('keeps only the devices, servers, clients and routers its pieces draw, in the order of the world', () => {
    const attacker = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' } as const;
    const world = { ...FLOORS, actors: [attacker, ...FLOORS.actors] };
    const found = classify(world, [piece('device', 'printer'), piece('device', 'your-laptop'), piece('device', server.id), piece('actor', attacker.id), piece('edge', officeRouter.id), GLOBE]);
    expect(ids(found.devices)).toEqual(['your-laptop', 'printer']);
    expect(ids(found.servers)).toEqual([server.id]);
    expect(ids(found.clients)).toEqual([attacker.id]);
    expect(ids(found.routers)).toEqual([officeRouter.id]);
    expect(found.internet).toBe(true);
    expect(found.edge).toBe(false);
    expect(classify(world, [piece('device', 'your-laptop')])).toMatchObject({ servers: [], clients: [], routers: [], gateways: [], internet: false });
  });

  it('lists the routers from the one the pieces say is in the office outward, whatever order the world lists them', () => {
    const listedBackwards = { ...FLOORS, routers: [...(FLOORS.routers ?? [])].reverse() };
    expect(ids(classify(listedBackwards, WHOLE_ROAD).routers)).toEqual([officeRouter.id, provider.id, backbone.id]);
  });

  it('a router that nothing reaches from the office comes last, in the order of the world', () => {
    const stray = { ...(FLOORS.routers ?? [])[2], id: 'stray', interfaces: [] };
    const world = { ...FLOORS, routers: [stray, ...(FLOORS.routers ?? [])] };
    expect(ids(classify(world, [...WHOLE_ROAD, piece('edge', stray.id)]).routers)).toEqual([officeRouter.id, provider.id, backbone.id, stray.id]);
  });

  it('a lone edge is an edge piece anchored to no router of the world', () => {
    expect(classify(officeNet(), [piece('edge', 'edge')])).toMatchObject({ edge: true, routers: [] });
    expect(classify(FLOORS, [piece('edge', officeRouter.id)]).edge).toBe(false);
  });

  it('a device whose floor is not in the world is not drawn', () => {
    const lost = { ...FLOORS, devices: [...FLOORS.devices, { ...FLOORS.devices[0], id: 'lost', lanId: 'floor-9' }] };
    expect(ids(classify(lost, [piece('device', 'your-laptop'), piece('device', 'lost')]).devices)).toEqual(['your-laptop']);
  });

  describe('with the other office of 02-07', () => {
    const world = startWorld(INCIDENTS, '02-07');
    const [office, provider02, branch] = ['office-router', 'provider-router', 'branch-router'];
    const devices = ['your-laptop', 'branch-printer', 'branch-laptop'].map((id) => piece('device', id));
    const routers = [piece('edge', office, { inOffice: true }), piece('edge', branch, { inOffice: true }), piece('edge', provider02)];

    it('a router after the first that faces a floor with a drawn device is a gateway, off the main line', () => {
      const found = classify(world, [...devices, ...routers, GLOBE, piece('device', 'internet-server')]);
      expect(ids(found.routers)).toEqual([office, provider02]);
      expect(ids(found.gateways)).toEqual([branch]);
    });

    it('the first router stays on the line even when it faces a drawn floor, and a router that faces no drawn floor stays on it too', () => {
      const alone = classify(world, [...devices, piece('edge', branch, { inOffice: true }), GLOBE]);
      expect(ids(alone.routers)).toEqual([branch]);
      expect(alone.gateways).toEqual([]);
      const noFloor = classify(world, [piece('device', 'your-laptop'), ...routers, GLOBE]);
      expect(ids(noFloor.routers)).toEqual([office, branch, provider02]);
      expect(noFloor.gateways).toEqual([]);
    });
  });
});

describe('drawnOf', () => {
  it('gives each drawn device the id of its bus and lists the rest of what the map draws by id', () => {
    const drawn = drawnOf(FLOORS, classify(FLOORS, WHOLE_ROAD));
    expect(drawn).toEqual({
      devices: { 'your-laptop': floor1.id, 'lucia-laptop': floor1.id, 'marta-laptop': floor1.id, printer: floor1.id, 'andres-laptop': floor2.id },
      clients: [],
      servers: [server.id],
      routers: [officeRouter.id, provider.id, backbone.id],
      gateways: [],
      edge: false,
      internet: true,
    });
  });

  it('an office with neither floors nor subnets names its bus after the kind of the world, and a device with no cable keeps the bus it would plug in', () => {
    expect(drawnOf(officeNet(), classify(officeNet(), [piece('device', 'printer')])).devices).toEqual({ printer: 'office' });
    const unplugged = drawnOf(FLOORS, classify(FLOORS, [piece('device', 'guest-laptop')]));
    expect(unplugged.devices).toEqual({ 'guest-laptop': floor1.id });
  });
});

describe('labelOf', () => {
  it('splits a label of two lines, puts the alert on the first and the lock on the last, and is as wide as the widest line with what it wears', () => {
    const group = '{{security-group}} [[servidor2]]';
    const plain = labelOf({ label: group, locked: false, state: 'normal' });
    expect(plain.lines).toEqual(['Security Group', 'servidor2']);
    expect(plain).toMatchObject({ width: 115, height: 36 });
    expect(labelOf({ label: group, locked: false, state: 'intruded' }).width).toBe(115 + 23);
    expect(labelOf({ label: group, locked: true, state: 'normal' }).width).toBe(115);
    const host = '{{firewall}} [[laptop-marta]]';
    expect(labelOf({ label: host, locked: false, state: 'normal' }).width).toBe(101);
    expect(labelOf({ label: host, locked: true, state: 'normal' }).width).toBe(101 + 22);
    expect(labelOf({ label: host, locked: false, state: 'intruded' }).width).toBe(101);
  });

  it('a label of one line wears the lock and the alert together, and is 20 px tall', () => {
    const name = nameTag('laptop-lucia');
    expect(labelOf({ label: name, locked: false, state: 'normal' })).toMatchObject({ lines: ['laptop-lucia'], width: 101, height: 20 });
    expect(labelOf({ label: name, locked: true, state: 'intruded' }).width).toBe(101 + 22 + 23);
  });
});
