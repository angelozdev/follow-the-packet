import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { officeNet, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { firewallCard } from './firewall-card';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');
const office: Session = { ...first, world: withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }) };

describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker, the Internet gateway and the internet, each with its variant and its term', () => {
    expect(pieceViews(first).map(({ id, variant, term, label, locked, configurable }) => ({ id, variant, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.device(S1.id), variant: 'ec2-instance', term: 'ec2-instance', label: nameTag(S1.id), locked: true, configurable: false },
      { id: PIECE_ID.device(S2.id), variant: 'ec2-instance', term: 'ec2-instance', label: nameTag(S2.id), locked: true, configurable: false },
      { id: PIECE_ID.firewall(SG.servidor1), variant: 'security-group', term: 'security-group', label: MAP_TEXT.firewall['security-group'](S1.id), locked: false, configurable: true },
      { id: PIECE_ID.firewall(SG.servidor2), variant: 'security-group', term: 'security-group', label: MAP_TEXT.firewall['security-group'](S2.id), locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), variant: 'attacker', term: null, label: '[[Atacante]]', locked: false, configurable: false },
      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
      { id: PIECE_ID.internet, variant: 'internet', term: null, label: MAP_TEXT.internet, locked: false, configurable: false },
    ]);
  });

  it('draws an office by the kind of each device and firewall, with a router as its edge, and no term for them before chapter 1', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
      { kind: 'device', variant: 'laptop', term: null, label: '[[your-laptop]]' },
      { kind: 'device', variant: 'laptop', term: null, label: '[[lucia-laptop]]' },
      { kind: 'device', variant: 'printer', term: null, label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: null, label: 'firewall [[lucia-laptop]]' },
      { kind: 'actor', variant: 'attacker', term: null, label: '[[Atacante]]' },
      { kind: 'edge', variant: 'router', term: null, label: 'router' },
      { kind: 'internet', variant: 'internet', term: null, label: 'internet' },
    ]);
  });

  it('marks the Security Group that stops a packet as blocking, and the instance a forbidden flow reaches as intruded', () => {
    const states = (session: Session) => pieceViews(session).map(({ id, state }) => [id, state]);
    expect(states(first)).toContainEqual([PIECE_ID.firewall(SG.servidor2), 'blocking']);
    expect(states(first)).toContainEqual([PIECE_ID.firewall(SG.servidor1), 'normal']);
    expect(states(first)).toContainEqual([PIECE_ID.device(S2.id), 'normal']);
    const wide = sessionReducer(first, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });
    expect(states(wide)).toContainEqual([PIECE_ID.device(S2.id), 'intruded']);
    expect(states(wide)).toContainEqual([PIECE_ID.firewall(SG.servidor2), 'normal']);
  });

  it('shows no router and no internet while nobody is outside the office', () => {
    const alone: Session = { ...office, world: { ...office.world, actors: [] } };
    expect(pieceViews(alone).map((piece) => piece.kind)).toEqual(['device', 'device', 'device', 'firewall']);
  });
});

describe('firewallCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(firewallCard(second, PIECE_ID.firewall(SG.servidor2))).toEqual({
      firewallId: SG.servidor2,
      title: MAP_TEXT.firewall['security-group'](S2.id),
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
    });
  });

  it('is null for anything that is not a Security Group', () => {
    expect(firewallCard(first, PIECE_ID.device(S2.id))).toBeNull();
    expect(firewallCard(first, PIECE_ID.firewall('sg-ghost'))).toBeNull();
  });
});
