import { describe, expect, it } from 'vitest';
import { TERMS, termsIn, unofficialNames, type TermId } from '@/copy';
import { filterIncident } from '@/testing';
import { FROM } from './04-iaas/shared';
import type { Incident } from './incident';
import { chipLabels, configurableParts, incidentTexts, knownTerms, namedTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const NOTHING = { inboundRules: { 'host-firewall': false, 'security-group': false }, outboundRules: false, hostSettings: false };
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
    expect(configurableParts(later)).toEqual({ inboundRules: { 'host-firewall': false, 'security-group': true }, outboundRules: true, hostSettings: true });
  });
});
