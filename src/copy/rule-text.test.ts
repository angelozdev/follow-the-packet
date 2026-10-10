import { describe, expect, it } from 'vitest';
import type { Rule } from '@/engine';
import { OFFICE, ATTACKER_IP, allOut, lab03Net, officeNet } from '@/testing';
import { describeRule } from './rule-text';
import { toPlainText } from './term-text';
import type { TermId } from './terms';

const ANYWHERE = '0.0.0.0/0';
const NET = officeNet();
const KNOWN = new Set<TermId>(['firewall', 'traffic', 'outbound', 'icmp', 'echo-request', 'echo-reply']);
const NOTHING_KNOWN = new Set<TermId>();
const rule = (what: Rule['what'], peer: Rule['peer']): Rule => ({ id: 'rule', what, peer });
const cidr = (range: string): Rule['peer'] => ({ kind: 'cidr', cidr: range });

describe('describeRule', () => {
  it('writes the rule that lets everything out as a sentence, with the term traffic only once it is known', () => {
    expect(describeRule(allOut('open'), 'outbound', NET, KNOWN)).toBe('deja salir todo el {{traffic|tráfico}}');
    expect(describeRule(allOut('open'), 'outbound', NET, NOTHING_KNOWN)).toBe('deja salir todo');
    expect(toPlainText(describeRule(allOut('open'), 'outbound', NET, KNOWN))).toBe('deja salir todo el tráfico');
  });

  it('writes the rule that lets everything in as the same sentence the other way', () => {
    expect(toPlainText(describeRule(allOut('open'), 'inbound', NET, KNOWN))).toBe('deja entrar todo el tráfico');
  });

  it('writes any other rule as its Type and its peer, the peer being a device when the rule names its only address', () => {
    const echo = { kind: 'icmp', icmpType: 8 } as const;
    expect(toPlainText(describeRule(rule(echo, cidr(`${OFFICE.lucia}/32`)), 'outbound', NET, KNOWN))).toBe('ICMP · Echo Request → lucia-laptop');
    expect(toPlainText(describeRule(rule(echo, cidr(`${OFFICE.lucia}/32`)), 'inbound', NET, KNOWN))).toBe('ICMP · Echo Request ← lucia-laptop');
    expect(toPlainText(describeRule(rule({ kind: 'icmp', icmpType: 0 }, cidr(`${ATTACKER_IP}/32`)), 'inbound', NET, KNOWN))).toBe(`ICMP · Echo Reply ← ${ATTACKER_IP}/32`);
    expect(toPlainText(describeRule(rule({ kind: 'icmp', icmpType: 'all' }, cidr('192.168.1.0/24')), 'inbound', NET, KNOWN))).toBe('All ICMP - IPv4 ← 192.168.1.0/24');
    expect(toPlainText(describeRule(rule({ kind: 'tcp', fromPort: 22, toPort: 22 }, cidr(ANYWHERE)), 'inbound', NET, NOTHING_KNOWN))).toBe('TCP 22 ← 0.0.0.0/0');
    expect(toPlainText(describeRule(rule({ kind: 'udp', fromPort: 20, toPort: 30 }, cidr(ANYWHERE)), 'outbound', NET, KNOWN))).toBe('UDP 20-30 → 0.0.0.0/0');
    expect(toPlainText(describeRule(rule({ kind: 'all' }, cidr(`${OFFICE.printer}/32`)), 'outbound', NET, KNOWN))).toBe('todo el tráfico → printer');
  });

  it('tags only the terms the player knows', () => {
    const echo = rule({ kind: 'icmp', icmpType: 8 }, cidr(`${OFFICE.lucia}/32`));
    expect(describeRule(echo, 'outbound', NET, KNOWN)).toBe('{{icmp|ICMP}} · {{echo-request|Echo Request}} → [[lucia-laptop]]');
    expect(describeRule(echo, 'outbound', NET, NOTHING_KNOWN)).toBe('ICMP · Echo Request → [[lucia-laptop]]');
    expect(describeRule(rule({ kind: 'all' }, cidr(ANYWHERE)), 'inbound', NET, NOTHING_KNOWN)).not.toMatch(/\{\{/);
    expect(describeRule(rule({ kind: 'tcp', fromPort: 22, toPort: 22 }, cidr(ANYWHERE)), 'inbound', NET, new Set<TermId>(['anywhere-ipv4']))).toBe('TCP 22 ← {{anywhere-ipv4|Anywhere-IPv4}} (0.0.0.0/0)');
  });

  it('names the Security Group of a peer by its name, and by its id when the network does not have it', () => {
    const vpc = lab03Net();
    const echo = { kind: 'icmp', icmpType: 8 } as const;
    expect(describeRule(rule(echo, { kind: 'sg', sgId: 'sg-servidor1' }), 'inbound', vpc, new Set<TermId>(['security-group']))).toBe('ICMP · Echo Request ← {{security-group|SG}} [[servidor1]]');
    expect(describeRule(rule(echo, { kind: 'sg', sgId: 'sg-servidor1' }), 'inbound', vpc, NOTHING_KNOWN)).toBe('ICMP · Echo Request ← [[servidor1]]');
    expect(toPlainText(describeRule(rule(echo, { kind: 'sg', sgId: 'sg-ghost' }), 'inbound', vpc, NOTHING_KNOWN))).toBe('ICMP · Echo Request ← sg-ghost');
  });
});
