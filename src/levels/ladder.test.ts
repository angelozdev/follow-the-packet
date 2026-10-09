import { describe, expect, it } from 'vitest';
import { TERMS, type TermId } from '@/copy';
import type { Incident } from './incident';
import { configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const ONLY_INBOUND = { inboundRules: true, outboundRules: false, linuxSettings: false };
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
    const leaks = incident.introduces.flatMap((term) =>
      unknown.filter((other) => TERMS[term].definition.includes(TERMS[other].name)).map((other) => `${term} → ${other}`),
    );
    expect(leaks).toEqual([]);
  });

  it('catches a text that uses a later term', () => {
    const early = { ...INCIDENTS[0], report: 'El {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
  });

  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, '04-01')]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, '04-02')]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('the prototype opens only inbound rules, so its solutions touch only those', () => {
    for (const incident of INCIDENTS) expect(configurableParts(knownTerms(INCIDENTS, incident.id))).toEqual(ONLY_INBOUND);
  });

  it('outbound rules and the Linux setting open with their own terms', () => {
    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: true, outboundRules: true, linuxSettings: true });
  });
});
