import { describe, expect, it } from 'vitest';
import { TASK_CARD_TEXT, termsIn, toPlainText } from '@/copy';
import { INCIDENTS } from '@/levels';
import { DAY_SHIFT_RULE, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { incidentSchema, ruleIdFor } from '@/levels/contract/incident';
import { allOut, hostFirewallIncident, outboundFilterIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';
import { firewallCard, rowText } from './firewall-card';

const first = startSession(INCIDENTS, '04-01');
const HOST = hostFirewallIncident();
const HOST_FIREWALL = PIECE_ID.firewall('fw-lucia');
const host = startSession([HOST], HOST.id);

describe('firewallCard', () => {
  it('names the rules of a Security Group with the chips of the incident', () => {
    const second = startSession(INCIDENTS, '04-02');
    expect(firewallCard(second, PIECE_ID.firewall(SG.servidor2))).toEqual({
      firewallId: SG.servidor2,
      kind: 'security-group',
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
    const card = firewallCard(host, HOST_FIREWALL);
    expect(card).toEqual({
      firewallId: 'fw-lucia',
      kind: 'host-firewall',
      title: '{{firewall}} [[laptop-lucia]]',
      rules: [],
      empty: TASK_CARD_TEXT.noRules['host-firewall'],
      slot: TASK_CARD_TEXT.slot['host-firewall'],
    });
    expect(card && toPlainText(card.empty)).toBe('No tiene reglas: no deja entrar nada.');
    expect(card?.slot).toBe('Regla nueva');
  });

  it('the host firewall incident opens only the inbound rules of a host firewall, blocks the ping and lets it back with its solution', () => {
    expect(host.parts).toEqual({ inboundRules: { 'host-firewall': true, 'security-group': false }, outboundRules: { 'host-firewall': false, 'security-group': false }, hostSettings: false });
    expect(host.runs[0]).toMatchObject({ blocked: true, replied: false });
    expect(incidentSchema.safeParse(HOST).success).toBe(true);
    const [move] = HOST.solution;
    const solved = sessionReducer(host, move);
    expect(solved.runs[0]).toMatchObject({ blocked: false, replied: true });
  });

  it('is null for anything that is not a Security Group', () => {
    expect(firewallCard(first, PIECE_ID.device(S2.id))).toBeNull();
    expect(firewallCard(first, PIECE_ID.firewall('sg-ghost'))).toBeNull();
  });
});

describe('the outbound list of the card of a firewall', () => {
  const OUTBOUND = outboundFilterIncident();
  const FIREWALL = PIECE_ID.firewall('fw-you');
  const [lucia] = OUTBOUND.chips.to ?? [];
  const [echo] = OUTBOUND.chips.what;
  const start = startSession([OUTBOUND], OUTBOUND.id);
  const placed = sessionReducer(start, { type: 'placeRule', firewallId: 'fw-you', whatId: echo.id, toId: lucia.id, direction: 'outbound' });
  const withoutTerm = (session: Session, ...terms: string[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))), parts: { ...session.parts, outboundRules: { 'host-firewall': false, 'security-group': false } } });
  const asSecurityGroup = (session: Session): Session => ({ ...session, world: { ...session.world, firewalls: session.world.firewalls.map((firewall) => ({ ...firewall, kind: 'security-group' })) } });

  it('names the outbound rules with the destination chips', () => {
    const card = firewallCard(placed, FIREWALL);
    expect(card?.outbound?.rules).toEqual([{ id: ruleIdFor(echo.id, lucia.id, 'outbound'), what: echo.label, to: lucia.label }]);
    expect(card?.rules).toEqual([]);
    const [row] = card?.outbound?.rules ?? [];
    expect(toPlainText(rowText(row))).toBe('ICMP · Echo Request → lucia-laptop');
    expect(toPlainText(rowText({ id: 'in', what: echo.label, from: lucia.label }))).toBe('ICMP · Echo Request ← lucia-laptop');
  });

  it('carries the two tabs, each named after the term of its direction, and keeps the inbound list as it was', () => {
    const card = firewallCard(start, FIREWALL);
    expect(card?.outbound?.tabs).toEqual(TASK_CARD_TEXT.tabs['host-firewall']);
    expect(card?.outbound?.tabs && [card.outbound.tabs.inbound, card.outbound.tabs.outbound].map((label) => toPlainText(label))).toEqual(['entrada', 'salida']);
    expect(card).toMatchObject({ firewallId: 'fw-you', kind: 'host-firewall', rules: [], empty: TASK_CARD_TEXT.noRules['host-firewall'], slot: TASK_CARD_TEXT.slot['host-firewall'] });
    expect(card?.outbound?.rules).toEqual([]);
    expect(card?.outbound?.slot).toBe('Regla nueva');
  });

  it('words the empty outbound list of a host firewall', () => {
    const card = firewallCard(start, FIREWALL);
    expect(card?.outbound && toPlainText(card.outbound.empty)).toBe('Este firewall tiene la salida cerrada: alguien lo configuró así.');
    expect(card?.outbound && termsIn(card.outbound.empty)).toEqual(['firewall', 'outbound']);
  });

  it('words the card of a Security Group with the official names of its tabs and of its outbound rules', () => {
    const card = firewallCard(asSecurityGroup(start), FIREWALL);
    expect(card?.outbound?.tabs && [card.outbound.tabs.inbound, card.outbound.tabs.outbound].map((label) => toPlainText(label))).toEqual(['regla de entrada', 'regla de salida']);
    expect(card?.outbound?.slot).toBe('Regla de salida nueva');
    expect(card?.slot).toBe('Regla de entrada nueva');
    expect(card?.outbound && toPlainText(card.outbound.empty)).toBe('Este Security Group no tiene reglas de salida: su salida está cerrada.');
  });

  it('the empty outbound list of a host firewall never says that a closed outbound side is the default of a firewall', () => {
    const FORBIDDEN = /por defecto|de f[aá]brica|normalmente|normal\b|habitual|predeterminad|siempre/i;
    for (const session of [start, asSecurityGroup(start)]) {
      const card = firewallCard(session, FIREWALL);
      expect(card?.outbound).toBeDefined();
      expect(toPlainText(card?.outbound?.empty ?? '')).not.toMatch(FORBIDDEN);
    }
    expect(toPlainText(TASK_CARD_TEXT.noOutboundRules['host-firewall'])).toMatch(/alguien lo configuró así/);
  });

  it('writes from the rule itself an outbound rule that no destination chip names, such as the one that lets everything out', () => {
    const { base } = OUTBOUND;
    if (!base) throw new Error('the incident has a base world');
    const open = { ...OUTBOUND, base: { ...base, firewalls: base.firewalls.map((firewall) => ({ ...firewall, outbound: [allOut('open-out')] })) } };
    const card = firewallCard(startSession([open], open.id), FIREWALL);
    expect(card?.outbound?.rules).toEqual([{ id: 'open-out', text: 'deja salir todo el {{traffic|tráfico}}' }]);
    expect(card?.outbound?.rules.map((row) => toPlainText(rowText(row)))).toEqual(['deja salir todo el tráfico']);
  });

  it('has no outbound key while the ladder keeps the outbound rules of its kind closed', () => {
    const closed = firewallCard(withoutTerm(start, 'outbound'), FIREWALL);
    expect(closed).not.toBeNull();
    expect(closed).not.toHaveProperty('outbound');
    expect(Object.keys(closed ?? {}).sort()).toEqual(['empty', 'firewallId', 'kind', 'rules', 'slot', 'title']);
  });

  it('has no outbound key when the incident offers no destination chips, so the rules of the old worlds that no chip names are never asked for', () => {
    const noDestinations = { ...OUTBOUND, chips: { ...OUTBOUND.chips, to: undefined } };
    const session = startSession([noDestinations], noDestinations.id);
    expect(session.parts.outboundRules['host-firewall']).toBe(true);
    expect(firewallCard(session, FIREWALL)).not.toHaveProperty('outbound');
    expect(firewallCard(host, HOST_FIREWALL)).not.toHaveProperty('outbound');
  });
});
