import { describe, expect, it } from 'vitest';
import { TERMS, isTermId, type Term, type TermId } from './terms';

const MAX_DEFINITION_LENGTH = 120;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OFFICIAL_NAMES: [TermId, string][] = [
  ['ec2-instance', 'instancia EC2'],
  ['vpc', 'VPC'],
  ['security-group', 'Security Group'],
  ['inbound-rule', 'regla de entrada'],
  ['icmp', 'ICMP'],
  ['echo-request', 'Echo Request'],
  ['echo-reply', 'Echo Reply'],
  ['anywhere-ipv4', 'Anywhere-IPv4'],
  ['internet-gateway', 'Internet gateway'],
  ['icmp-echo-ignore-all', 'icmp_echo_ignore_all'],
];
const PLAN_2_IDS = ['server', 'rule', 'linux-ignore-ping'];

describe('term registry', () => {
  it.each(Object.entries(TERMS))('%s has a name and a short definition', (_id, term) => {
    expect(term.name.trim()).not.toBe('');
    expect(term.definition.trim()).not.toBe('');
    expect(term.definition.length).toBeLessThanOrEqual(MAX_DEFINITION_LENGTH);
  });

  it('ids are English kebab-case', () => {
    for (const id of Object.keys(TERMS)) expect(id).toMatch(KEBAB_CASE);
  });

  it('recognizes registered ids only', () => {
    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('firewall')).toBe(false);
    expect(isTermId('toString')).toBe(false);
  });

  it.each(OFFICIAL_NAMES)('%s is called «%s», its official name', (id, name) => {
    expect(TERMS[id].name).toBe(name);
  });

  it('drops the ids named after the plain words of plan 2', () => {
    expect(PLAN_2_IDS.filter(isTermId)).toEqual([]);
  });

  it('a Security Group is the virtual firewall of an instance, shortened SG', () => {
    const securityGroup: Term = TERMS['security-group'];
    expect(securityGroup.definition).toMatch(/^Un firewall virtual de una instancia EC2/);
    expect(securityGroup.short).toBe('SG');
  });

  it('only the Security Group has a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['security-group']);
  });
});
