import { describe, expect, it } from 'vitest';
import { stampLabel, toPlainText, type TermId } from '@/copy';
import { sessionReducer, startSession, type Session } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { computeLayout, pathFor } from '@/scene/layout';
import { flowLook } from '@/scene/traffic/flow-look';
import { officeNet, sendIncident, withDevice } from '@/testing';
import type { Firewall } from '@/engine';

type Run = Session['runs'][number] | Session['sent'][number];

const drawn = (run: Run) => {
  const look = flowLook(run);
  return { look, name: stampLabel(toPlainText(run.label), look.stamp) };
};

const sendFrom = (session: Session, toId: string) => {
  const sent = sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId: 'ping' }).sent;
  expect(sent).toHaveLength(1);
  return sent[0];
};

const officeSession = (base = officeNet(), ...introduced: TermId[]) => {
  const incident = { ...sendIncident(), base, introduces: [...sendIncident().introduces, ...introduced] };
  return startSession([incident], incident.id);
};

const FIREWALL_OF_YOU: Firewall = { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
const guardedLucia = () => withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
const guardedYou = () => withDevice({ ...officeNet(), firewalls: [FIREWALL_OF_YOU] }, 'your-laptop', { firewallIds: [FIREWALL_OF_YOU.id] });

describe('the stamp of a packet the game computed', () => {
  const attacker = (session: Session) => {
    const run = session.runs.find((other) => other.kind === 'forbidden');
    if (!run) throw new Error('04-01 has no forbidden flow');
    return run;
  };
  const opened = sessionReducer(startSession(INCIDENTS, '04-01'), { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });

  it('the attacker of 04-01 is an intruder that the Security Group blocks, and it leaves ✕', () => {
    const run = attacker(startSession(INCIDENTS, '04-01'));
    expect(run).toMatchObject({ intruder: true, blocked: true, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ intruder: true, end: 'blocked', stamp: 'blocked' });
    expect(name).toMatch(/Bloqueado\.$/);
  });

  it('the attacker of 04-01 leaves the stamp of an intruder once a rule lets it in', () => {
    const run = attacker(opened);
    expect(run).toMatchObject({ intruder: true, blocked: false, reached: true });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(name).toMatch(/Entró sin permiso\.$/);
  });

  it('a ping to an address no device has is lost, not blocked, and its stamp says so', () => {
    const run = sendFrom(officeSession(), 'nobody');
    expect(run).toMatchObject({ intruder: false, blocked: false, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(name).toMatch(/Perdido\.$/);
  });

  it('a ping to a laptop whose firewall has no rules is blocked by that firewall, and its stamp says so', () => {
    const run = sendFrom(officeSession(guardedLucia(), 'firewall'), 'lucia');
    expect(run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop', at: 'lucia-laptop' }));
    expect(run).toMatchObject({ intruder: false, blocked: true, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ end: 'blocked', stamp: 'blocked' });
    expect(name).toMatch(/Bloqueado\.$/);
  });

  it('the same ping to that laptop with no firewall on it arrives, so the block comes from the firewall', () => {
    const run = sendFrom(officeSession(), 'lucia');
    expect(run).toMatchObject({ blocked: false, reached: true });
    expect(drawn(run).look).toMatchObject({ stamp: 'arrived' });
  });
});

describe('a packet that a firewall the player does not know yet stops', () => {
  const lostAt = (session: Session, toId: string) => {
    const run = sendFrom(session, toId);
    const layout = computeLayout(session.world, true);
    return { run, layout, path: pathFor(run.trace, run.packet, layout, run.hiddenStop), ...drawn(run) };
  };

  it('a packet dropped by a firewall the player does not know yet leaves a lost stamp, not a blocked one', () => {
    const { run, look, name } = lostAt(officeSession(guardedLucia()), 'lucia');
    expect(run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop', at: 'lucia-laptop' }));
    expect(run).toMatchObject({ blocked: false, reached: false });
    expect(look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(name).toMatch(/Perdido\.$/);
    expect(name).not.toMatch(/firewall|Bloqueado/i);
  });

  it('a packet stopped by a firewall the player does not know yet ends at the door of its device, with the lost stamp', () => {
    const coming = lostAt(officeSession(guardedLucia()), 'lucia');
    expect(coming.path.at(-1)).toEqual(coming.layout.devices['lucia-laptop'].door);
    expect(coming.look.stamp).toBe('lost');
    const going = lostAt(officeSession(guardedYou()), 'lucia');
    const you = going.layout.devices['your-laptop'];
    expect(going.run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-out', verdict: 'drop', at: 'your-laptop' }));
    expect(going.path).toEqual([you.door, you.doorstep]);
    expect(going.look.stamp).toBe('lost');
  });

  it('is drawn in front of the firewall, with the blocked stamp, once the firewall is a known term', () => {
    const known = lostAt(officeSession(guardedLucia(), 'firewall'), 'lucia');
    expect(known.path.at(-1)).toEqual(known.layout.devices['lucia-laptop'].firewall);
    expect(known.look).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });
});

