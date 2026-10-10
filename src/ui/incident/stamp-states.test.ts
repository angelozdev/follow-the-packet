import { describe, expect, it } from 'vitest';
import { stampLabel, toPlainText } from '@/copy';
import { sessionReducer, startSession, type Session } from '@/game';
import { INCIDENTS } from '@/levels';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { flowLook } from '@/scene/traffic/flow-look';
import { officeNet, sendIncident, withDevice } from '@/testing';

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

const officeSession = (base = officeNet()) => {
  const incident = { ...sendIncident(), base };
  return startSession([incident], incident.id);
};

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
    const run = sendFrom(officeSession(withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] })), 'lucia');
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
