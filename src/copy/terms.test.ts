import { describe, expect, it } from 'vitest';
import { ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId, type EntityRef, type Term, type TermId } from './terms';

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
const RETIRED_IDS = ['server', 'rule', 'linux-ignore-ping'];

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

  it('drops the ids named after retired plain words', () => {
    expect(RETIRED_IDS.filter(isTermId)).toEqual([]);
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

describe('entity terms', () => {
  it('names a variant by the term the ladder already has, and leaves the office ones without a term until chapter 1', () => {
    expect(entityTerm({ kind: 'device', variant: 'ec2-instance' })).toBe('ec2-instance');
    expect(entityTerm({ kind: 'firewall', variant: 'security-group' })).toBe('security-group');
    expect(entityTerm({ kind: 'edge', variant: 'internet-gateway' })).toBe('internet-gateway');
    expect(entityTerm({ kind: 'network', variant: 'vpc' })).toBe('vpc');
    expect(entityTerm({ kind: 'device', variant: 'laptop' })).toBeNull();
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBeNull();
    expect(entityTerm({ kind: 'edge', variant: 'router' })).toBeNull();
  });

  it('gives a character no term: an actor is a person, not a piece of the network', () => {
    expect(entityTerm({ kind: 'actor', variant: 'attacker' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'home' })).toBeNull();
  });
});

describe('term icons', () => {
  it('every term that names a variant shows that variant\'s entity as its icon', () => {
    const named = Object.entries(ENTITY_TERMS).flatMap(([kind, variants]) =>
      Object.entries(variants).flatMap(([variant, term]) => (term === null ? [] : [{ term, kind, variant }])),
    );
    for (const { term, kind, variant } of named) expect(TERM_ENTITY[term as TermId], term).toMatchObject({ kind, variant });
  });

  it('every icon belongs to the term that names its entity', () => {
    for (const [term, entity] of Object.entries(TERM_ENTITY)) expect(entityTerm(entity as EntityRef)).toBe(term);
  });

  it('a term with no entity, like least-privilege, has no icon', () => {
    expect(TERM_ENTITY['least-privilege']).toBeUndefined();
  });
});
