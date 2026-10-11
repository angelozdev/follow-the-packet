import { describe, expect, it } from 'vitest';
import { nameTag } from '@/copy';
import { applyAction, type Firewall, type Network, type NetworkAction } from '@/engine';
import { ATTACKER_IP, OFFICE_FLOORS, allOut, officeTwoFloorsNet, withDevice } from '@/testing';
import { changedNames, mentions, unnamedChanges } from './changes';

const { floor1, floor2, officeRouter } = OFFICE_FLOORS;
const LUCIA_FIREWALL: Firewall = { id: 'fw-lucia', name: 'laptop-lucia', kind: 'host-firewall', inbound: [], outbound: [allOut('fw-lucia-out')] };
const NAMES = { you: 'tu-laptop', lucia: 'laptop-lucia', printer: 'impresora', visitor: 'laptop-visita' } as const;
const FLOOR_3 = { id: 'floor-3', name: 'Piso 3', cidr: '192.168.3.0/24', latencyMs: 1 };

const world: Network = withDevice({ ...officeTwoFloorsNet(), firewalls: [LUCIA_FIREWALL] }, 'lucia-laptop', { firewallIds: [LUCIA_FIREWALL.id] });
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
  updateRouter: { action: { type: 'updateRouter', routerId: officeRouter.id, sendsUnreachable: false }, names: [anyRouter.name] },
  addActor: { action: { type: 'addActor', actor: { id: 'visitor', name: 'Visita', ip: ATTACKER_IP, kind: 'attacker' } }, names: [] },
  addLan: { action: { type: 'addLan', lan: FLOOR_3 }, names: [] },
  addDevice: { action: { type: 'addDevice', device: { ...anyDevice, id: 'new-laptop', name: 'laptop-nueva', privateIp: floor1.nobody } }, names: [] },
  addRouter: { action: { type: 'addRouter', router: { ...anyRouter, id: 'router-new', name: 'router-nuevo' } }, names: [] },
};

describe('changedNames', () => {
  it.each(Object.entries(BY_KIND))('%s names what it changes and nothing else', (_kind, { action, names }) => {
    expect(changedNames(world, applyAction(world, action))).toEqual(names);
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
    expect(changedNames(world, changes.reduce(applyAction, world))).toEqual([NAMES.visitor, anyRouter.name, NAMES.you].sort((a, b) => a.localeCompare(b)));
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
});
