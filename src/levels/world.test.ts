import { describe, expect, it } from 'vitest';
import { applyAction, networkSchema, type Network } from '@/engine';
import { gatewayIncident } from '@/testing';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from './04-iaas/shared';
import { chipsOfRule } from './contract/chips';
import { ruleIdFor, type Incident, type PlayerMove, type SettingMove } from './contract/incident';
import { INCIDENTS } from './registry';
import { applyMove, solvedWorld, startWorld } from './world';

function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function inbound(world: Network, firewallId: string) {
  return world.firewalls.find((f) => f.id === firewallId)?.inbound ?? [];
}

const IDS = INCIDENTS.map((i) => [i.id]);

describe('the world that grows', () => {
  it('04-01 starts from the base world: Security Groups with no inbound rules', () => {
    const start = startWorld(INCIDENTS, '04-01');
    expect(inbound(start, SG.servidor1)).toEqual([]);
    expect(inbound(start, SG.servidor2)).toEqual([]);
  });

  it('04-02 starts from the solution of 04-01 plus its own changes', () => {
    const start = startWorld(INCIDENTS, '04-02');
    expect(start).toEqual((incident('04-02').changes ?? []).reduce(applyAction, solvedWorld(INCIDENTS, '04-01')));
    expect(inbound(start, SG.servidor2)).toEqual([DAY_SHIFT_RULE]);
  });

  it.each(IDS)('%s starts and ends with a valid network', (id) => {
    expect(networkSchema.safeParse(startWorld(INCIDENTS, id)).success).toBe(true);
    expect(networkSchema.safeParse(solvedWorld(INCIDENTS, id)).success).toBe(true);
  });

  it.each(IDS)('%s can name every rule of its Security Groups with its chips', (id) => {
    for (const world of [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)]) {
      for (const firewall of world.firewalls) {
        for (const rule of firewall.inbound) expect(chipsOfRule(incident(id), rule), `${firewall.id}/${rule.id}`).not.toBeNull();
      }
    }
  });
});

describe('applyMove', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);
  const place: PlayerMove = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };

  it('builds the rule from the chips', () => {
    expect(inbound(applyMove(start, first, place), SG.servidor2)).toEqual([
      { id: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id), what: WHAT.echoRequest.what, peer: FROM.sgServidor1.peer },
    ]);
  });

  it('placing the same rule twice changes nothing', () => {
    const once = applyMove(start, first, place);
    expect(applyMove(once, first, place)).toBe(once);
  });

  it('placing chips that equal a rule already on the Security Group, with another id, changes nothing', () => {
    const second = incident('04-02');
    const dayShift = startWorld(INCIDENTS, second.id);
    const sameAsDayShift: PlayerMove = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoReply.id, fromId: FROM.anywhere.id };
    expect(ruleIdFor(WHAT.echoReply.id, FROM.anywhere.id)).not.toBe(DAY_SHIFT_RULE.id);
    expect(applyMove(dayShift, second, sameAsDayShift)).toBe(dayShift);
  });

  it('a chip the incident does not offer, or an unknown Security Group, changes nothing', () => {
    expect(applyMove(start, first, { ...place, whatId: WHAT.echoReply.id })).toBe(start);
    expect(applyMove(start, first, { ...place, firewallId: 'sg-ghost' })).toBe(start);
  });

  it('removes a rule by its id, and an unknown id changes nothing', () => {
    const once = applyMove(start, first, place);
    const removed = applyMove(once, first, { type: 'removeRule', firewallId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id) });
    expect(inbound(removed, SG.servidor2)).toEqual([]);
    expect(applyMove(once, first, { type: 'removeRule', firewallId: SG.servidor2, ruleId: 'ghost' })).toBe(once);
  });
});

describe('applyMove of a setting', () => {
  const GATEWAY = gatewayIncident();
  const start = startWorld([GATEWAY], GATEWAY.id);
  const set = (chipId: string, patch: Partial<SettingMove> = {}): PlayerMove => ({ type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId, ...patch });
  const gatewayOf = (world: Network, deviceId = 'your-laptop') => world.devices.find((device) => device.id === deviceId)?.gateway;
  const withoutLaptop = (world: Network) => ({ ...world, devices: world.devices.filter((device) => device.id !== 'your-laptop') });

  it('a setting move sets the gateway of the device and nothing else', () => {
    expect(gatewayOf(start)).toBeUndefined();
    const after = applyMove(start, GATEWAY, set('router'));
    expect(gatewayOf(after)).toBe('192.168.1.1');
    expect(after).toEqual(applyAction(start, { type: 'setGateway', deviceId: 'your-laptop', gateway: '192.168.1.1' }));
    expect(withoutLaptop(after)).toEqual(withoutLaptop(start));
    expect(after.devices.find((device) => device.id === 'your-laptop')).toEqual({ ...start.devices.find((device) => device.id === 'your-laptop'), gateway: '192.168.1.1' });
  });

  it('a chip with no value takes the gateway away', () => {
    const set192 = applyMove(start, GATEWAY, set('router'));
    const cleared = applyMove(set192, GATEWAY, set('none'));
    expect(cleared).toEqual(start);
    expect(cleared.devices.find((device) => device.id === 'your-laptop')).not.toHaveProperty('gateway');
  });

  it('a chip that is already in effect, an unknown chip, setting or device change nothing', () => {
    expect(applyMove(start, GATEWAY, set('none'))).toBe(start);
    const router = applyMove(start, GATEWAY, set('router'));
    expect(applyMove(router, GATEWAY, set('router'))).toBe(router);
    for (const patch of [{ chipId: 'ghost' }, { settingId: 'ghost' }, { deviceId: 'ghost' }]) expect(applyMove(start, GATEWAY, set('router', patch))).toBe(start);
  });

  it('only a send incident has settings', () => {
    const first = incident('04-01');
    const world = startWorld(INCIDENTS, first.id);
    expect(applyMove(world, first, set('router'))).toBe(world);
  });

  it('the reference solution sets the gateway the incident asks for', () => {
    expect(gatewayOf(solvedWorld([GATEWAY], GATEWAY.id))).toBe('192.168.1.1');
  });
});
