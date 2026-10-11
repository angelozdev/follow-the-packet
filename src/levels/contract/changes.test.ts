import { describe, expect, it } from 'vitest';
import { nameTag } from '@/copy';
import { ROUTE_DEFAULT, applyAction, type Firewall, type Network, type NetworkAction } from '@/engine';
import { ATTACKER_IP, OFFICE_FLOORS, allOut, officeTwoFloorsNet, tcpService, withDevice } from '@/testing';
import { changedFloors, changedNames, mentions, unnamedChanges } from './changes';

const { floor1, floor2, officeRouter } = OFFICE_FLOORS;
const LUCIA_FIREWALL: Firewall = { id: 'fw-lucia', name: 'laptop-lucia', kind: 'host-firewall', inbound: [], outbound: [allOut('fw-lucia-out')] };
const NAMES = { you: 'tu-laptop', lucia: 'laptop-lucia', printer: 'impresora', visitor: 'laptop-visita' } as const;
const FLOOR_3 = { id: 'floor-3', name: 'Piso 3', cidr: '192.168.3.0/24', latencyMs: 1 };
const FLOOR_1_DEVICES = ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer', 'guest-laptop'];
const FLOOR_1_NAMES = ['tu-laptop', 'laptop-lucia', 'laptop-marta', 'impresora', 'laptop-visita'];

const LUCIA_APP = tcpService(3000);
const world: Network = withDevice({ ...officeTwoFloorsNet(), firewalls: [LUCIA_FIREWALL] }, 'lucia-laptop', { firewallIds: [LUCIA_FIREWALL.id], host: { ignoreIcmpEcho: false, services: [LUCIA_APP] } });
const [anyDevice] = world.devices;
const [anyRouter] = world.routers ?? [];

/** What each kind of action changes in the world above, by the names of the devices and routers whose configuration it changes. An action that changes an existing device, a router or a firewall names it, whatever its kind; one that only adds a piece the map then draws names nothing. The table has a key per kind of action, so a new kind of the engine does not compile until it is classified here. */
const BY_KIND: Record<NetworkAction['type'], { action: NetworkAction; names: string[] }> = {
  addRule: { action: { type: 'addRule', firewallId: LUCIA_FIREWALL.id, rule: allOut('fw-lucia-in') }, names: [NAMES.lucia] },
  removeRule: { action: { type: 'removeRule', firewallId: LUCIA_FIREWALL.id, ruleId: 'fw-lucia-out', direction: 'outbound' }, names: [NAMES.lucia] },
  setAppTarget: { action: { type: 'setAppTarget', deviceId: 'your-laptop', target: floor1.printer }, names: [NAMES.you] },
  setIgnoreIcmpEcho: { action: { type: 'setIgnoreIcmpEcho', deviceId: 'printer', value: true }, names: [NAMES.printer] },
  addFirewall: { action: { type: 'addFirewall', deviceId: 'your-laptop', firewall: { ...LUCIA_FIREWALL, id: 'fw-you', name: NAMES.you } }, names: [NAMES.you] },
  connectDevice: { action: { type: 'connectDevice', deviceId: 'guest-laptop' }, names: [NAMES.visitor] },
  setGateway: { action: { type: 'setGateway', deviceId: 'your-laptop' }, names: [NAMES.you] },
  setServices: { action: { type: 'setServices', ownerId: 'lucia-laptop', services: [] }, names: [NAMES.lucia] },
  setListenAddress: { action: { type: 'setListenAddress', ownerId: 'lucia-laptop', protocol: 'tcp', port: LUCIA_APP.port, listen: 'loopback' }, names: [NAMES.lucia] },
  updateRouter: { action: { type: 'updateRouter', routerId: officeRouter.id, sendsUnreachable: false }, names: [anyRouter.name] },
  addRoute: { action: { type: 'addRoute', routerId: officeRouter.id, route: { to: OFFICE_FLOORS.server.range, next: OFFICE_FLOORS.provider.id } }, names: [anyRouter.name] },
  removeRoute: { action: { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT }, names: [anyRouter.name] },
  setForwards: { action: { type: 'setForwards', routerId: officeRouter.id, forwards: [{ protocol: 'tcp', publicPort: 8080, toDeviceId: 'andres-laptop', toPort: 3000 }] }, names: [anyRouter.name] },
  addActor: { action: { type: 'addActor', actor: { id: 'visitor', name: 'Visita', ip: ATTACKER_IP, kind: 'attacker' } }, names: [] },
  addLan: { action: { type: 'addLan', lan: FLOOR_3 }, names: [] },
  addDevice: { action: { type: 'addDevice', device: { ...anyDevice, id: 'new-laptop', name: 'laptop-nueva', privateIp: floor1.nobody } }, names: [] },
  addRouter: { action: { type: 'addRouter', router: { ...anyRouter, id: 'router-new', name: 'router-nuevo' } }, names: [] },
};

describe('changedNames', () => {
  it.each(Object.entries(BY_KIND))('%s names what it changes and nothing else', (_kind, { action, names }) => {
    expect(changedNames(world, applyAction(world, action))).toEqual(names);
  });

  it('changedNames also lists a server of the internet whose configuration differs', () => {
    const internetServer = world.actors.find((actor) => actor.kind === 'server');
    for (const patch of [{ latencyMs: 50 }, { ip: '198.51.100.51' }]) {
      const moved: Network = { ...world, actors: world.actors.map((actor) => (actor === internetServer ? { ...actor, ...patch } : actor)) };
      expect(changedNames(world, moved), JSON.stringify(patch)).toEqual([internetServer?.name]);
    }
  });

  it('names a server of the internet whose services change', () => {
    const internetServer = world.actors.find((actor) => actor.kind === 'server');
    const served = applyAction(world, { type: 'setServices', ownerId: OFFICE_FLOORS.server.id, services: [tcpService(443)] });
    expect(changedNames(world, served)).toEqual([internetServer?.name]);
    const moved = applyAction(served, { type: 'setListenAddress', ownerId: OFFICE_FLOORS.server.id, protocol: 'tcp', port: 443, listen: 'loopback' });
    expect(changedNames(served, moved)).toEqual([internetServer?.name]);
  });

  it('names nothing when an action changes nothing, because its target is not there or already is as asked', () => {
    const sameGateway: NetworkAction = { type: 'setGateway', deviceId: 'your-laptop', gateway: floor1.gateway };
    const ghost: NetworkAction = { type: 'connectDevice', deviceId: 'ghost' };
    expect(changedNames(world, applyAction(world, sameGateway))).toEqual([]);
    expect(changedNames(world, applyAction(world, ghost))).toEqual([]);
  });

  it('names nothing when a later action undoes an earlier one', () => {
    const added = applyAction(world, { type: 'addRule', firewallId: LUCIA_FIREWALL.id, rule: allOut('fw-lucia-in') });
    expect(changedNames(world, applyAction(added, { type: 'removeRule', firewallId: LUCIA_FIREWALL.id, ruleId: 'fw-lucia-in' }))).toEqual([]);
  });

  it('names each piece once and in alphabetical order, however many actions change it', () => {
    const changes: NetworkAction[] = [
      { type: 'setGateway', deviceId: 'your-laptop', gateway: floor2.gateway },
      { type: 'setAppTarget', deviceId: 'your-laptop', target: floor1.printer },
      { type: 'updateRouter', routerId: anyRouter.id, sendsUnreachable: false },
      { type: 'connectDevice', deviceId: 'guest-laptop' },
    ];
    expect(changedNames(world, changes.reduce(applyAction, world))).toEqual(alphabetical([NAMES.visitor, anyRouter.name, NAMES.you]));
  });
});

const alphabetical = (names: string[]): string[] => [...names].sort((a, b) => a.localeCompare(b));
const withoutGateway = (...deviceIds: string[]): NetworkAction[] => deviceIds.map((deviceId) => ({ type: 'setGateway', deviceId }));
const afterChanges = (changes: NetworkAction[]): Network => changes.reduce(applyAction, world);

describe('changedFloors', () => {
  it('lists the floor on which every device changed, with the names of its devices', () => {
    expect(changedFloors(world, afterChanges(withoutGateway(...FLOOR_1_DEVICES)))).toEqual([{ name: floor1.name, devices: FLOOR_1_NAMES }]);
  });

  it('lists no floor on which a device stays as it was', () => {
    expect(changedFloors(world, afterChanges(withoutGateway(...FLOOR_1_DEVICES.slice(1))))).toEqual([]);
  });

  it('lists no floor with a single device, which its own name tells apart', () => {
    expect(world.devices.filter((device) => device.lanId === floor2.id)).toHaveLength(1);
    expect(changedFloors(world, afterChanges(withoutGateway('andres-laptop')))).toEqual([]);
  });

  it('lists nothing when the world did not change or a router changed', () => {
    expect(changedFloors(world, world)).toEqual([]);
    expect(changedFloors(world, applyAction(world, BY_KIND.updateRouter.action))).toEqual([]);
  });
});

describe('mentions', () => {
  it('finds a name whether the text tags it or writes it plain', () => {
    expect(mentions(`El firewall de ${nameTag(NAMES.lucia)} descartó el {{ping}}.`, NAMES.lucia)).toBe(true);
    expect(mentions(`El Security Group de ${NAMES.lucia} descartó el {{ping}}.`, NAMES.lucia)).toBe(true);
  });

  it('does not find a name inside a longer name, nor words that only look like it', () => {
    expect(mentions(`Pasó por ${nameTag(`${NAMES.lucia}-2`)}.`, NAMES.lucia)).toBe(false);
    expect(mentions('Pasó por la laptop de Lucía.', NAMES.lucia)).toBe(false);
  });
});

describe('unnamedChanges', () => {
  const changes: NetworkAction[] = [BY_KIND.setGateway.action, BY_KIND.connectDevice.action, BY_KIND.updateRouter.action];
  const after = changes.reduce(applyAction, world);

  it('lists the changed pieces that no text names', () => {
    expect(unnamedChanges(world, after, [])).toEqual(changedNames(world, after));
  });

  it('counts a piece as named when any one of the texts names it', () => {
    const texts = [`${nameTag(NAMES.visitor)} ya está conectada.`, `Cambió ${anyRouter.name}.`];
    expect(unnamedChanges(world, after, texts)).toEqual([NAMES.you]);
    expect(unnamedChanges(world, after, [...texts, `Y ${NAMES.you}.`])).toEqual([]);
  });

  it('asks for nothing when the world did not change', () => {
    expect(unnamedChanges(world, world, [])).toEqual([]);
  });

  it('counts every device of a floor as named when a text names the floor on which all of them changed', () => {
    const everyDevice = afterChanges(withoutGateway(...FLOOR_1_DEVICES));
    expect(unnamedChanges(world, everyDevice, [])).toEqual(alphabetical(FLOOR_1_NAMES));
    expect(unnamedChanges(world, everyDevice, [`Cada dispositivo del ${floor1.name} cambió.`])).toEqual([]);
    expect(unnamedChanges(world, everyDevice, [`Cada dispositivo del ${floor2.name} cambió.`])).toEqual(alphabetical(FLOOR_1_NAMES));
  });

  it('does not count a device as named by a floor on which not every device changed', () => {
    const someDevices = afterChanges(withoutGateway(...FLOOR_1_DEVICES.slice(1)));
    expect(unnamedChanges(world, someDevices, [`Cada dispositivo del ${floor1.name} cambió.`])).toEqual(alphabetical(FLOOR_1_NAMES.slice(1)));
  });
});
