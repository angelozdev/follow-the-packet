import { describe, expect, it } from 'vitest';
import type { TermId } from '@/copy';
import type { Incident } from './incident';
import { configurableParts, incidentTexts, knownTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';

const ONLY_INBOUND = { inboundRules: true, outboundRules: false, linuxSettings: false };

describe('term ladder', () => {
  it('a term is introduced by one incident at most', () => {
    const introduced = INCIDENTS.flatMap((i) => i.introduces);
    expect(introduced.filter((term, index) => introduced.indexOf(term) !== index)).toEqual([]);
  });

  it.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('%s only uses terms introduced in it or before', (id, incident) => {
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, id))).toEqual([]);
  });

  it('catches a text that uses a later term', () => {
    const early = { ...INCIDENTS[0], report: 'La {{security-group}} es {{stateful}}.' };
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
    const later = new Set<TermId>(['rule', 'outbound-rule', 'linux-ignore-ping']);
    expect(configurableParts(later)).toEqual({ inboundRules: true, outboundRules: true, linuxSettings: true });
  });
});
