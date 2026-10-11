import { describe, expect, it } from 'vitest';
import type { Network } from '@/engine';
import { INCIDENTS, applyMove, isGuided, startWorld, type FilterIncident, type GuidedIncident } from '@/levels';
import { FIREWALL, FROM as OFFICE_FROM, TO as OFFICE_TO, WHAT as OFFICE_WHAT } from '@/levels/01-first-day/shared';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { EVERY_TERM, filterIncident } from '@/testing';
import { runFlows } from './flow-runs';
import { sessionReducer, startSession, starsOf } from './session';
import { isTight } from './stars';
import { taskHolds } from './tasks';

function holdsAll(of: FilterIncident, world: Network): boolean {
  const runs = runFlows(world, of.flows, EVERY_TERM);
  return of.tasks.every((task) => taskHolds(task, runs, []));
}

describe.each(INCIDENTS.filter(isGuided).map((i): [string, GuidedIncident] => [i.id, i]))('incident %s', (id, of) => {
  const start = startSession(INCIDENTS, id);

  it('starts with a task to fix', () => {
    expect(of.tasks.some((task) => !taskHolds(task, start.runs, start.sent, start.answers))).toBe(true);
  });

  it('its reference solution fixes every task and earns every star but the explanation', () => {
    const solved = [...of.solution, { type: 'submit' } as const].reduce(sessionReducer, start);
    expect(solved.phase).toBe('explaining');
    expect(starsOf(solved)).toMatchObject({ closed: true, middle: true });
  });
});

describe('04-01, the first ping', () => {
  const first = filterIncident('04-01');
  const start = startWorld(INCIDENTS, first.id);

  it('a rule on the Security Group of servidor1 does not help: the destination decides', () => {
    const world = applyMove(start, first, { type: 'placeRule', firewallId: SG.servidor1, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id });
    expect(holdsAll(first, world)).toBe(false);
  });

  it('ping from all of internet lets the attacker reach servidor2', () => {
    const world = applyMove(start, first, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(runFlows(world, first.flows, EVERY_TERM).find((run) => run.kind === 'forbidden')?.reached).toBe(true);
    expect(holdsAll(first, world)).toBe(false);
  });
});

describe('04-02, only what is needed', () => {
  const second = filterIncident('04-02');
  const start = startWorld(INCIDENTS, second.id);
  const fromServer1 = (whatId: string) => applyMove(start, second, { type: 'placeRule', firewallId: SG.servidor2, whatId, fromId: FROM.sgServidor1.id });
  const withoutDayShift = (world: Network) => applyMove(world, second, { type: 'removeRule', firewallId: SG.servidor2, ruleId: DAY_SHIFT_RULE.id });

  it('the way back (Echo Reply) does not let the ping in', () => {
    expect(holdsAll(second, fromServer1(WHAT.echoReply.id))).toBe(false);
  });

  it('keeping the day-shift Echo Reply fixes the task but opens too much', () => {
    const world = fromServer1(WHAT.echoRequest.id);
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });

  it('the full ping from servidor1 opens too much', () => {
    const world = withoutDayShift(fromServer1(WHAT.allIcmp.id));
    expect(holdsAll(second, world)).toBe(true);
    expect(isTight(world, second.flows)).toBe(false);
  });
});

describe('01-12, your first rule', () => {
  const rule = filterIncident('01-12');
  const start = startWorld(INCIDENTS, rule.id);
  const from = (fromId: string) => applyMove(start, rule, { type: 'placeRule', firewallId: FIREWALL.marta, whatId: OFFICE_WHAT.echoRequest.id, fromId });

  it('the Echo Request from laptop-lucia fixes the pings and opens only what is needed', () => {
    const world = from(OFFICE_FROM.lucia.id);
    expect(holdsAll(rule, world)).toBe(true);
    expect(isTight(world, rule.flows)).toBe(true);
  });

  it('the Echo Request from any source lets the visitor in, so the task fails and the battery finds the opening', () => {
    const world = from(OFFICE_FROM.anyone.id);
    expect(runFlows(world, rule.flows, EVERY_TERM).find((run) => run.kind === 'forbidden')?.reached).toBe(true);
    expect(holdsAll(rule, world)).toBe(false);
    expect(isTight(world, rule.flows)).toBe(false);
  });

  it('a rule for the printer, which the incident does not offer, changes nothing', () => {
    expect(applyMove(start, rule, { type: 'placeRule', firewallId: FIREWALL.marta, whatId: OFFICE_WHAT.echoRequest.id, fromId: OFFICE_FROM.printer.id })).toBe(start);
  });
});

describe('01-13, in and out', () => {
  const outbound = filterIncident('01-13');
  const start = startWorld(INCIDENTS, outbound.id);
  const outTo = (toId: string) => applyMove(start, outbound, { type: 'placeRule', firewallId: FIREWALL.you, whatId: OFFICE_WHAT.echoRequest.id, toId, direction: 'outbound' });

  it('an inbound rule on your laptop does not fix the ping, and an outbound rule for another destination does not either', () => {
    const inbound = applyMove(start, outbound, { type: 'placeRule', firewallId: FIREWALL.you, whatId: OFFICE_WHAT.echoRequest.id, fromId: OFFICE_FROM.lucia.id });
    expect(holdsAll(outbound, inbound)).toBe(false);
    expect(holdsAll(outbound, outTo(OFFICE_TO.printer.id))).toBe(false);
  });

  it('an outbound rule for laptop-lucia fixes the ping and opens only what is needed, with the rule of 01-12 left as it was', () => {
    const world = outTo(OFFICE_TO.lucia.id);
    expect(holdsAll(outbound, world)).toBe(true);
    expect(isTight(world, outbound.flows)).toBe(true);
    expect(world.firewalls.find((firewall) => firewall.id === FIREWALL.marta)?.inbound).toHaveLength(1);
  });
});
