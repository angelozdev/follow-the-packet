import { describe, expect, it } from 'vitest';
import { applyAction, networkSchema, type Network } from '@/engine';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from './04-iaas/shared';
import { chipsOfRule } from './chips';
import { ruleIdFor, type Incident, type PlayerMove } from './incident';
import { INCIDENTS } from './registry';
import { applyMove, solvedWorld, startWorld } from './world';

function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function inbound(world: Network, sgId: string) {
  return world.securityGroups.find((g) => g.id === sgId)?.inbound ?? [];
}

const IDS = INCIDENTS.map((i) => [i.id]);

describe('the world that grows', () => {
  it('04-01 starts from the base world: doors with no inbound rules', () => {
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

  it.each(IDS)('%s can name every rule of its doors with its chips', (id) => {
    for (const world of [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)]) {
      for (const group of world.securityGroups) {
        for (const rule of group.inbound) expect(chipsOfRule(incident(id), rule), `${group.id}/${rule.id}`).not.toBeNull();
      }
    }
  });
});

describe('applyMove', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);
  const place: PlayerMove = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };

  it('builds the rule from the chips', () => {
    expect(inbound(applyMove(start, first, place), SG.servidor2)).toEqual([
      { id: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id), what: WHAT.echoRequest.what, peer: FROM.sgServidor1.peer },
    ]);
  });

  it('placing the same rule twice changes nothing', () => {
    const once = applyMove(start, first, place);
    expect(applyMove(once, first, place)).toBe(once);
  });

  it('placing chips that equal a rule already on the door, with another id, changes nothing', () => {
    const second = incident('04-02');
    const dayShift = startWorld(INCIDENTS, second.id);
    const sameAsDayShift: PlayerMove = { type: 'placeRule', sgId: SG.servidor2, whatId: WHAT.echoReply.id, fromId: FROM.anywhere.id };
    expect(ruleIdFor(WHAT.echoReply.id, FROM.anywhere.id)).not.toBe(DAY_SHIFT_RULE.id);
    expect(applyMove(dayShift, second, sameAsDayShift)).toBe(dayShift);
  });

  it('a chip the incident does not offer, or an unknown door, changes nothing', () => {
    expect(applyMove(start, first, { ...place, whatId: WHAT.echoReply.id })).toBe(start);
    expect(applyMove(start, first, { ...place, sgId: 'sg-ghost' })).toBe(start);
  });

  it('removes a rule by its id, and an unknown id changes nothing', () => {
    const once = applyMove(start, first, place);
    const removed = applyMove(once, first, { type: 'removeRule', sgId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id) });
    expect(inbound(removed, SG.servidor2)).toEqual([]);
    expect(applyMove(once, first, { type: 'removeRule', sgId: SG.servidor2, ruleId: 'ghost' })).toBe(once);
  });
});
