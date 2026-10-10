import { describe, expect, it } from 'vitest';
import { TASK_CARD_TEXT, TERMS, parseTermText, termsIn, toPlainText, unofficialNames, type TermId } from '@/copy';
import { diagnoseIncident, filterIncident, gatewayIncident } from '@/testing';
import { FROM } from './04-iaas/shared';
import type { Incident, SendIncident } from './contract/incident';
import { RULES_TERM, chipLabels, configurableParts, incidentTexts, knownTerms, namedTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const CLOSED = { 'host-firewall': false, 'security-group': false };
const NOTHING = { inboundRules: CLOSED, outboundRules: CLOSED, hostSettings: false };
const HOST_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': false } };
const INBOUND_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': true } };
const DECLARED_LEAKS = ['icmp → internet'];
const ALL_TERMS = Object.keys(TERMS) as TermId[];
const BY_INCIDENT = INCIDENTS.map((i): [string, Incident] => [i.id, i]);

describe('term ladder', () => {
  it('a term is introduced by one incident at most', () => {
    const introduced = INCIDENTS.flatMap((i) => i.introduces);
    expect(introduced.filter((term, index) => introduced.indexOf(term) !== index)).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s only uses terms introduced in it or before', (id, incident) => {
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, id))).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s defines its new terms without naming a term the player does not know yet', (id, incident) => {
    const known = knownTerms(INCIDENTS, id);
    const unknown = ALL_TERMS.filter((term) => !known.has(term));
    const leaks = incident.introduces.flatMap((term) => namedTerms(TERMS[term].definition, unknown).map((other) => `${term} → ${other}`));
    expect(leaks.filter((leak) => !DECLARED_LEAKS.includes(leak))).toEqual([]);
  });

  it('the official name of ICMP says Internet before the term internet arrives: the one declared leak', () => {
    expect(namedTerms(TERMS.icmp.definition, ['internet'])).toEqual(['internet']);
    expect(INCIDENTS.findIndex((incident) => incident.introduces.includes('icmp'))).toBeLessThan(INCIDENTS.findIndex((incident) => incident.introduces.includes('internet')));
  });

  it('finds a term in a definition by whole words, ignoring case', () => {
    expect(namedTerms('Amazon Redshift guarda datos.', ['network'])).toEqual([]);
    expect(namedTerms('Una Red de la oficina.', ['network'])).toEqual(['network']);
    expect(namedTerms('Las IPs privadas de la VPC.', ['private-ip', 'vpc'])).toEqual(['vpc']);
  });

  it('also finds the Spanish plural of a term, made with s or es', () => {
    expect(namedTerms('Amazon Redshift guarda datos en sus redes.', ['network'])).toEqual(['network']);
    expect(namedTerms('Los paquetes llegan a los dispositivos.', ['packet', 'device'])).toEqual(['packet', 'device']);
    expect(namedTerms('Dos solicitudes y cinco respuestas.', ['request', 'response'])).toEqual(['request', 'response']);
    expect(namedTerms('Tres Redshifts y un redshift.', ['network'])).toEqual([]);
  });

  it('chapter 1 brings the basic terms, so 04-01 no longer introduces ping, ICMP or Echo Request, nor 04-02 Echo Reply', () => {
    const introduced = (id: string) => INCIDENTS.find((incident) => incident.id === id)?.introduces;
    expect(introduced('04-01')).not.toContain('ping');
    expect(introduced('04-01')).not.toContain('icmp');
    expect(introduced('04-01')).not.toContain('echo-request');
    expect(introduced('04-02')).not.toContain('echo-reply');
  });

  it.each(BY_INCIDENT)('%s names each chip after a term, by its official name', (_id, incident) => {
    const labels = chipLabels(incident);
    expect(labels.filter((label) => termsIn(label).length === 0)).toEqual([]);
    expect(unofficialNames(labels)).toEqual([]);
  });

  it('marks the resource name in the Security Group chip, apart from its term', () => {
    expect(FROM.sgServidor1.label).toBe('{{security-group|SG}} [[servidor1]]');
  });

  it('catches a text that uses a later term', () => {
    const early = { ...filterIncident('04-01'), report: 'El {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
  });

  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, INCIDENTS[0].id)]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, INCIDENTS[1].id)]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('the rules of a host firewall open with the term rule (01-04), and those of a Security Group with inbound rule (chapter 4)', () => {
    const parts = Object.fromEntries(INCIDENTS.map((incident) => [incident.id, configurableParts(knownTerms(INCIDENTS, incident.id))]));
    expect(parts).toEqual({ '01-01': NOTHING, '01-02': NOTHING, '01-03': NOTHING, '01-04': HOST_RULES, '04-01': INBOUND_RULES, '04-02': INBOUND_RULES });
  });

  it('outbound rules and the host setting open with their own terms', () => {
    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: { 'host-firewall': false, 'security-group': true }, outboundRules: { 'host-firewall': false, 'security-group': true }, hostSettings: true });
  });

  it('outbound rules open with the term outbound for a host firewall and with outbound-rule for a Security Group', () => {
    expect(RULES_TERM.outbound).toEqual({ 'host-firewall': 'outbound', 'security-group': 'outbound-rule' });
    expect(configurableParts(new Set<TermId>(['outbound'])).outboundRules).toEqual({ 'host-firewall': true, 'security-group': false });
    expect(configurableParts(new Set<TermId>(['outbound-rule'])).outboundRules).toEqual({ 'host-firewall': false, 'security-group': true });
    expect(configurableParts(new Set<TermId>(['outbound', 'outbound-rule'])).outboundRules).toEqual({ 'host-firewall': true, 'security-group': true });
    expect(configurableParts(new Set<TermId>(['rule', 'inbound-rule'])).outboundRules).toEqual(CLOSED);
  });

  it('a tab is named after a term by its official name: entrada and salida for a host firewall, regla de entrada and regla de salida for a Security Group', () => {
    const names = { 'host-firewall': { inbound: 'entrada', outbound: 'salida' }, 'security-group': { inbound: 'regla de entrada', outbound: 'regla de salida' } };
    const terms = { 'host-firewall': { inbound: 'inbound', outbound: 'outbound' }, 'security-group': { inbound: 'inbound-rule', outbound: 'outbound-rule' } } as const;
    for (const kind of ['host-firewall', 'security-group'] as const) {
      for (const direction of ['inbound', 'outbound'] as const) {
        const label = TASK_CARD_TEXT.tabs[kind][direction];
        expect(termsIn(label), `${kind}/${direction}`).toEqual([terms[kind][direction]]);
        expect(unofficialNames([label]), `${kind}/${direction}`).toEqual([]);
        expect(toPlainText(label), `${kind}/${direction}`).toBe(names[kind][direction]);
        expect(TERMS[terms[kind][direction]].name).toBe(names[kind][direction]);
      }
      expect(termsIn(TASK_CARD_TEXT.tabs[kind].outbound)).toEqual([RULES_TERM.outbound[kind]]);
    }
  });
});

describe('the settings of a send incident', () => {
  const NO_VALUE = 'Ninguna';
  const GATEWAY = gatewayIncident();
  const WITH_SETTINGS = [GATEWAY, ...INCIDENTS].filter((incident): incident is SendIncident => incident.mechanic === 'send' && incident.send.settings !== undefined);
  const settings = WITH_SETTINGS.flatMap((incident) => incident.send.settings ?? []);

  it('a setting chip names its value, and its tray names a term', () => {
    expect(settings.length).toBeGreaterThan(0);
    for (const setting of settings) {
      expect(parseTermText(setting.name).map((segment) => segment.kind)).toEqual(['term']);
      expect(unofficialNames([setting.name])).toEqual([]);
      for (const chip of setting.chips) expect(chip.label).toBe(chip.value ?? NO_VALUE);
    }
  });

  it('the gateway tray is called by the official name of the default gateway', () => {
    const [gateway] = GATEWAY.send.settings ?? [];
    expect(termsIn(gateway.name)).toEqual(['default-gateway']);
    expect(gateway.name).toBe(`{{default-gateway|${TERMS['default-gateway'].name}}}`);
  });

  it('the texts of the settings are texts the player reads, so the ladder catches them before their term is known', () => {
    const [gateway] = GATEWAY.send.settings ?? [];
    expect(incidentTexts(GATEWAY)).toEqual(expect.arrayContaining([gateway.name, ...gateway.chips.map((chip) => chip.label)]));
    expect(unknownTerms(incidentTexts(GATEWAY), new Set())).toContain('default-gateway');
    expect(unknownTerms(incidentTexts(GATEWAY), knownTerms([GATEWAY], GATEWAY.id))).toEqual([]);
  });
});

describe('the cases of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const { cases } = DIAGNOSE.diagnose;

  it('the texts of every case are texts the player reads, so the ladder catches them', () => {
    const texts = incidentTexts(DIAGNOSE);
    for (const spec of cases) expect(texts).toEqual(expect.arrayContaining([spec.report, ...spec.hints, spec.cause.question, ...spec.cause.options.flatMap((option) => [option.text, option.feedback])]));
    expect(texts).toEqual(expect.arrayContaining([DIAGNOSE.report, DIAGNOSE.takeaway]));
  });

  it('the message chips of every case are chips the ladder checks', () => {
    expect(chipLabels(DIAGNOSE)).toEqual(cases.flatMap((spec) => spec.send.message.map((chip) => chip.label)));
  });

  it('a term used in a case is unknown until an incident introduces it', () => {
    const early = { ...DIAGNOSE, introduces: [] };
    expect(unknownTerms(incidentTexts(early), knownTerms([early], early.id))).toContain('ping');
    expect(unknownTerms(incidentTexts(DIAGNOSE), knownTerms([DIAGNOSE], DIAGNOSE.id))).toEqual([]);
  });
});
