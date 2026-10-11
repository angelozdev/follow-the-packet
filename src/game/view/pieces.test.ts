import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { FROM, S1, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { OFFICE_FLOORS, diagnoseIncident, gatewayIncident, identifyIncident, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { settingsCard } from './cards/settings-card';
import { terminalCard } from './cards/terminal-card';
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

  it('in a diagnose incident, the origin of the case opens its terminal, and each case brings its own origin', () => {
    const diagnosing = diagnoseIncident();
    const { cases } = diagnosing.diagnose;
    const opening = (session: Session) => pieceViews(session).filter((piece) => piece.configurable).map((piece) => piece.id);
    const closeCase = (index: number): SessionAction[] => [{ type: 'nameCause', index: cases[index].cause.options.findIndex((option) => option.correct) }, { type: 'nextCase' }];
    const atFirst = startSession([diagnosing], diagnosing.id);
    const atThird = [...closeCase(0), ...closeCase(1)].reduce(sessionReducer, atFirst);
    expect(opening(atFirst)).toEqual([PIECE_ID.device('your-laptop')]);
    expect(opening(atThird)).toEqual([PIECE_ID.device('andres-laptop')]);
    expect(terminalCard(atThird, PIECE_ID.device('andres-laptop'))?.fromId).toBe('origin');
    expect(terminalCard(atThird, PIECE_ID.device('your-laptop'))).toBeNull();
  });

  it('in an identify incident the devices with a card open it and have no lock', () => {
    const identifying = identifyIncident();
    const pieces = pieceViews(startSession([identifying], identifying.id));
    const opening = pieces.filter((piece) => piece.kind === 'device').map(({ id, locked, configurable }) => ({ id, locked, configurable }));
    expect(opening).toContainEqual({ id: PIECE_ID.device('printer'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.device('guest-laptop'), locked: false, configurable: true });
    expect(opening).toContainEqual({ id: PIECE_ID.device('your-laptop'), locked: true, configurable: false });
    expect(opening).toContainEqual({ id: PIECE_ID.device('marta-laptop'), locked: true, configurable: false });
  });

  it('a laptop that sends and has settings opens its terminal and its settings card, each from its own entry', () => {
    const gateway = gatewayIncident();
    const session = startSession([gateway], gateway.id);
    const pieces = pieceViews(session);
    const laptop = pieces.find((piece) => piece.id === PIECE_ID.device('your-laptop'));
    const entry = laptop?.settings;
    expect(laptop).toMatchObject({ locked: false, configurable: true });
    expect(entry).toEqual({ id: PIECE_ID.settings('your-laptop'), label: 'Ajustes de red de [[tu-laptop]]' });
    if (!laptop || !entry) throw new Error('missing the laptop or its settings entry');
    expect(terminalCard(session, laptop.id)).not.toBeNull();
    expect(settingsCard(session, laptop.id)).toBeNull();
    expect(settingsCard(session, entry.id)).not.toBeNull();
    expect(terminalCard(session, entry.id)).toBeNull();
    expect(pieces.filter((piece) => piece.settings).map((piece) => piece.id)).toEqual([laptop.id]);
    expect(pieces.map((piece) => piece.id)).not.toContain(entry.id);
  });

  it('a send incident with no settings gives no piece a settings entry', () => {
    const sending = sendIncident();
    expect(pieceViews(startSession([sending], sending.id)).filter((piece) => piece.settings)).toEqual([]);
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
    expect(idsOf(floors(['your-laptop']))).toEqual([PIECE_ID.device('your-laptop')]);
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

  it('with a list of shown pieces, the internet is drawn only when a listed piece is outside the office', () => {
    const drawsInternet = (...shown: string[]) => idsOf(floors(shown)).includes(PIECE_ID.internet);
    expect(drawsInternet('your-laptop', 'lucia-laptop', 'andres-laptop', officeRouter.id)).toBe(false);
    expect(drawsInternet('your-laptop', server.id)).toBe(true);
    expect(drawsInternet('your-laptop', 'attacker')).toBe(true);
    expect(drawsInternet('your-laptop', officeRouter.id, provider.id)).toBe(true);
    expect(drawsInternet('your-laptop', provider.id)).toBe(true);
    expect(idsOf(floors())).toContain(PIECE_ID.internet);
  });

  it('with a list of shown pieces, the lone edge is drawn only when a listed piece is outside the office', () => {
    const [outsider] = office.world.actors;
    const lone = (...shown: string[]): Session => ({ ...office, incident: { ...office.incident, shown } });
    const edgeAndInternet = (session: Session) => pieceViews(session).filter((piece) => piece.kind === 'edge' || piece.kind === 'internet').map((piece) => piece.id);
    expect(office.world.routers).toBeUndefined();
    expect(edgeAndInternet(lone('your-laptop', 'lucia-laptop'))).toEqual([]);
    expect(edgeAndInternet(lone('your-laptop', outsider.id))).toEqual([PIECE_ID.edge, PIECE_ID.internet]);
    expect(edgeAndInternet(office)).toEqual([PIECE_ID.edge, PIECE_ID.internet]);
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
