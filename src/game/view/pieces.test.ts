import { describe, expect, it } from 'vitest';
import { MAP_TEXT, TASK_CARD_TEXT, nameTag, toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { LUCIA_FIREWALL } from '@/levels/01-first-day/shared';
import { DAY_SHIFT_RULE, FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { OFFICE_FLOORS, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { firewallCard } from './cards/firewall-card';
import { PIECE_ID } from './piece-id';
import { drawsRouter, pieceViews } from './pieces';

const first = startSession(INCIDENTS, '04-01');
const office: Session = { ...first, world: withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }) };
const knowingNot = (session: Session, ...terms: TermId[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) });

describe('pieceViews', () => {
  it('shows both instances locked, both Security Groups open to edit, the attacker, the Internet gateway and the internet, each with its variant and its term', () => {
    expect(pieceViews(first).map(({ id, variant, term, label, locked, configurable }) => ({ id, variant, term, label, locked, configurable }))).toEqual([
      { id: PIECE_ID.device(S1.id), variant: 'ec2-instance', term: 'ec2-instance', label: nameTag(S1.id), locked: true, configurable: false },
      { id: PIECE_ID.device(S2.id), variant: 'ec2-instance', term: 'ec2-instance', label: nameTag(S2.id), locked: true, configurable: false },
      { id: PIECE_ID.firewall(SG.servidor1), variant: 'security-group', term: 'security-group', label: '{{security-group}} [[servidor1]]', locked: false, configurable: true },
      { id: PIECE_ID.firewall(SG.servidor2), variant: 'security-group', term: 'security-group', label: '{{security-group}} [[servidor2]]', locked: false, configurable: true },
      { id: PIECE_ID.actor('attacker'), variant: 'attacker', term: null, label: '[[Atacante]]', locked: false, configurable: false },
      { id: PIECE_ID.edge, variant: 'internet-gateway', term: 'internet-gateway', label: MAP_TEXT.edge['internet-gateway'], locked: true, configurable: false },
      { id: PIECE_ID.internet, variant: 'internet', term: 'internet', label: MAP_TEXT.internet, locked: false, configurable: false },
    ]);
  });

  it('draws an office by the kind of each device and firewall, with a router as its edge, each named by its term of chapter 1', () => {
    expect(pieceViews(office).map(({ kind, variant, term, label }) => ({ kind, variant, term, label }))).toEqual([
      { kind: 'device', variant: 'laptop', term: 'device', label: '[[your-laptop]]' },
      { kind: 'device', variant: 'laptop', term: 'device', label: '[[lucia-laptop]]' },
      { kind: 'device', variant: 'printer', term: 'device', label: '[[printer]]' },
      { kind: 'firewall', variant: 'host-firewall', term: 'firewall', label: '{{firewall}} [[lucia-laptop]]' },
      { kind: 'actor', variant: 'attacker', term: null, label: '[[Atacante]]' },
      { kind: 'edge', variant: 'router', term: 'router', label: '{{router}}' },
      { kind: 'internet', variant: 'internet', term: 'internet', label: '{{internet}}' },
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

  it('in a send incident, every origin opens its terminal and has no lock; the other devices stay locked', () => {
    const sending = sendIncident();
    const opening = pieceViews(startSession([sending], sending.id)).map(({ id, locked, configurable }) => ({ id, locked, configurable }));
    expect(opening).toContainEqual({ id: PIECE_ID.device('your-laptop'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.actor('attacker'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.device('printer'), locked: true, configurable: false });
  });

  it('an actor of kind server is not drawn as an actor piece', () => {
    const attacker = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' } as const;
    const world = { ...officeTwoFloorsNet(), actors: [attacker, ...officeTwoFloorsNet().actors] };
    const pieces = pieceViews({ ...office, world });
    expect(world.actors.map((actor) => actor.kind)).toEqual(['attacker', 'server']);
    expect(pieces.filter((piece) => piece.kind === 'actor').map((piece) => piece.id)).toEqual([PIECE_ID.actor('attacker')]);
  });

  it('shows no router and no internet until their terms are known, even with someone outside', () => {
    const early = knowingNot(office, 'router', 'internet');
    expect(early.world.actors).not.toHaveLength(0);
    expect(pieceViews(early).map((piece) => piece.kind)).toEqual(['device', 'device', 'device', 'firewall', 'actor']);
  });

  it('does not draw a firewall piece until its term is known', () => {
    const kinds = (session: Session) => pieceViews(session).map((piece) => piece.kind);
    expect(kinds(office)).toContain('firewall');
    expect(kinds(knowingNot(office, 'firewall'))).not.toContain('firewall');
    expect(kinds(knowingNot(first, 'security-group'))).not.toContain('firewall');
    expect(kinds(first)).toContain('firewall');
  });

  it('draws the router and the internet once their terms are known, with or without an actor', () => {
    const alone: Session = { ...office, world: { ...office.world, actors: [] } };
    for (const session of [office, alone]) {
      const drawn = pieceViews(session);
      expect(drawn.filter((piece) => piece.kind === 'edge' || piece.kind === 'internet').map(({ id, variant }) => ({ id, variant }))).toEqual([
        { id: PIECE_ID.edge, variant: 'router' },
        { id: PIECE_ID.internet, variant: 'internet' },
      ]);
      expect(pieceViews(knowingNot(session, 'router')).map((piece) => piece.kind)).not.toContain('edge');
      expect(pieceViews(knowingNot(session, 'internet')).map((piece) => piece.kind)).not.toContain('internet');
    }
  });

  it('still draws the edge and the internet of chapter 4 in 04-01', () => {
    const drawn = pieceViews(first).filter((piece) => piece.kind === 'edge' || piece.kind === 'internet');
    expect(drawn.map(({ id, variant }) => ({ id, variant }))).toEqual([
      { id: PIECE_ID.edge, variant: 'internet-gateway' },
      { id: PIECE_ID.internet, variant: 'internet' },
    ]);
    expect(pieceViews(startSession(INCIDENTS, '04-02')).map((piece) => piece.kind)).toEqual(expect.arrayContaining(['edge', 'internet']));
  });

  it('always draws the devices and the actors, which are the base of the map', () => {
    const bare = knowingNot(office, 'router', 'internet', 'firewall');
    expect(pieceViews(bare).map((piece) => piece.kind)).toEqual(['device', 'device', 'device', 'actor']);
  });
});

const ATTACKER = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' } as const;
const { officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const floorsWorld = withDevice({ ...officeTwoFloorsNet(), firewalls: officeNet().firewalls, actors: [ATTACKER, ...officeTwoFloorsNet().actors] }, 'lucia-laptop', { firewallIds: ['fw-lucia'] });
const floors = (shown?: string[]): Session => ({ ...office, world: floorsWorld, incident: { ...office.incident, shown } });
const idsOf = (session: Session) => pieceViews(session).map((piece) => piece.id);
const EVERY_ID = [
  ...floorsWorld.devices.map((d) => PIECE_ID.device(d.id)),
  PIECE_ID.firewall('fw-lucia'),
  PIECE_ID.actor('attacker'),
  PIECE_ID.actor(server.id),
  ...[officeRouter, provider, backbone].map((router) => PIECE_ID.router(router.id)),
  PIECE_ID.internet,
];

describe('pieceViews of an incident that lists what it draws', () => {
  const SHOWN = ['your-laptop', 'lucia-laptop', 'andres-laptop', officeRouter.id, server.id];

  it('each incident draws only the pieces it uses', () => {
    expect(idsOf(floors(SHOWN))).toEqual([
      PIECE_ID.device('your-laptop'),
      PIECE_ID.device('lucia-laptop'),
      PIECE_ID.device('andres-laptop'),
      PIECE_ID.firewall('fw-lucia'),
      PIECE_ID.actor(server.id),
      PIECE_ID.router(officeRouter.id),
      PIECE_ID.internet,
    ]);
    expect(idsOf(floors(['your-laptop']))).toEqual([PIECE_ID.device('your-laptop'), PIECE_ID.internet]);
  });

  it('draws a piece of the list only once its term is known', () => {
    expect(idsOf(knowingNot(floors(SHOWN), 'router'))).not.toContain(PIECE_ID.router(officeRouter.id));
    expect(idsOf(knowingNot(floors(SHOWN), 'internet'))).not.toContain(PIECE_ID.internet);
    expect(idsOf(knowingNot(floors(SHOWN), 'router', 'internet', 'firewall'))).toEqual([
      PIECE_ID.device('your-laptop'),
      PIECE_ID.device('lucia-laptop'),
      PIECE_ID.device('andres-laptop'),
      PIECE_ID.actor(server.id),
    ]);
  });

  it('an incident with no list draws every piece of its world, as before', () => {
    expect(idsOf(floors())).toEqual(EVERY_ID);
  });

  it('the firewall of a device that is not drawn is not drawn', () => {
    expect(idsOf(floors(['lucia-laptop']))).toContain(PIECE_ID.firewall('fw-lucia'));
    expect(idsOf(floors(['your-laptop', 'andres-laptop']))).not.toContain(PIECE_ID.firewall('fw-lucia'));
  });

  it('an actor of kind server is drawn as the internet-server variant of the device piece', () => {
    const drawn = pieceViews(floors()).find((piece) => piece.anchorId === server.id);
    expect(drawn).toMatchObject({ kind: 'device', variant: 'internet-server', id: PIECE_ID.actor(server.id), term: 'device', label: nameTag('servidor-internet'), state: 'normal' });
  });

  it('says a router is drawn exactly when its piece is on the map', () => {
    const asked = (session: Session) => [officeRouter, provider, backbone].filter((router) => drawsRouter(session, router.id)).map((router) => PIECE_ID.router(router.id));
    const drawn = (session: Session) => idsOf(session).filter((id) => [officeRouter, provider, backbone].some((router) => id === PIECE_ID.router(router.id)));
    for (const session of [floors(), floors(SHOWN), floors(['your-laptop']), knowingNot(floors(SHOWN), 'router')]) expect(asked(session)).toEqual(drawn(session));
  });

  it('draws every router of a world that has them as a piece of the router variant under its own name, and no lone edge', () => {
    const routers = pieceViews(floors()).filter((piece) => piece.kind === 'edge');
    expect(routers.map(({ id, variant, anchorId, term, label, locked, configurable }) => ({ id, variant, anchorId, term, label, locked, configurable }))).toEqual(
      [officeRouter, provider, backbone].map((router) => ({
        id: PIECE_ID.router(router.id),
        variant: 'router',
        anchorId: router.id,
        term: 'router',
        label: nameTag(router.id),
        locked: true,
        configurable: false,
      })),
    );
    expect(idsOf(floors())).not.toContain(PIECE_ID.edge);
  });
});

describe('firewallCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(firewallCard(second, PIECE_ID.firewall(SG.servidor2))).toEqual({
      firewallId: SG.servidor2,
      title: '{{security-group}} [[servidor2]]',
      rules: [{ id: DAY_SHIFT_RULE.id, what: WHAT.echoReply.label, from: FROM.anywhere.label }],
      empty: TASK_CARD_TEXT.noRules['security-group'],
      slot: TASK_CARD_TEXT.slot['security-group'],
    });
  });

  it('words the card of a Security Group with inbound rules', () => {
    const card = firewallCard(first, PIECE_ID.firewall(SG.servidor2));
    expect(card && toPlainText(card.empty)).toBe('No tiene reglas de entrada: no deja entrar nada.');
    expect(card?.slot).toBe('Regla de entrada nueva');
  });

  it('words the card of a host firewall with rules, never with the later inbound rules', () => {
    const card = firewallCard(startSession(INCIDENTS, '01-04'), PIECE_ID.firewall(LUCIA_FIREWALL.id));
    expect(card).toEqual({
      firewallId: LUCIA_FIREWALL.id,
      title: '{{firewall}} [[laptop-lucia]]',
      rules: [],
      empty: TASK_CARD_TEXT.noRules['host-firewall'],
      slot: TASK_CARD_TEXT.slot['host-firewall'],
    });
    expect(card && toPlainText(card.empty)).toBe('No tiene reglas: no deja entrar nada.');
    expect(card?.slot).toBe('Regla nueva');
  });

  it('is null for anything that is not a Security Group', () => {
    expect(firewallCard(first, PIECE_ID.device(S2.id))).toBeNull();
    expect(firewallCard(first, PIECE_ID.firewall('sg-ghost'))).toBeNull();
  });
});
