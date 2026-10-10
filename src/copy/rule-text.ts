import type { Direction, Network, Rule, RulePeer, RuleWhat } from '@/engine';
import { word } from './reasons';
import { INSPECTION_TEXT } from './screens/incident-ui';
import { nameTag, type TermText } from './term-text';
import { TERMS, type TermId } from './terms';

const ANYWHERE = '0.0.0.0/0';
const SINGLE_ADDRESS = '/32';
const LETS: Record<Direction, TermText> = { inbound: 'deja entrar', outbound: 'deja salir' };

function icmpType(known: ReadonlySet<TermId>, message: 'echo-request' | 'echo-reply'): TermText {
  return `${word(known, 'icmp', TERMS.icmp.name)} · ${word(known, message, TERMS[message].name)}`;
}

function describeWhat(what: RuleWhat, known: ReadonlySet<TermId>): TermText {
  switch (what.kind) {
    case 'all':
      return known.has('traffic') ? `todo el ${word(known, 'traffic', TERMS.traffic.name)}` : 'todo';
    case 'icmp':
      if (what.icmpType === 'all') return `All ${word(known, 'icmp', TERMS.icmp.name)} - IPv4`;
      return icmpType(known, what.icmpType === 8 ? 'echo-request' : 'echo-reply');
    case 'tcp':
    case 'udp':
      return `${what.kind.toUpperCase()} ${what.fromPort === what.toPort ? what.fromPort : `${what.fromPort}-${what.toPort}`}`;
  }
}

function describePeer(peer: RulePeer, net: Network, known: ReadonlySet<TermId>): TermText {
  if (peer.kind === 'sg') {
    const group = net.firewalls.find((firewall) => firewall.id === peer.sgId);
    return known.has('security-group') ? `{{security-group|SG}} ${nameTag(group?.name ?? peer.sgId)}` : nameTag(group?.name ?? peer.sgId);
  }
  if (peer.cidr === ANYWHERE) return known.has('anywhere-ipv4') ? `${word(known, 'anywhere-ipv4', TERMS['anywhere-ipv4'].name)} (${ANYWHERE})` : ANYWHERE;
  const owner = peer.cidr.endsWith(SINGLE_ADDRESS) ? net.devices.find((device) => device.privateIp === peer.cidr.slice(0, -SINGLE_ADDRESS.length)) : undefined;
  return owner ? nameTag(owner.name) : peer.cidr;
}

/** Writes a rule from the rule itself, for a rule that no chip of the incident names, using only the terms the player knows: a rule that allows everything to or from anywhere is a sentence (`deja salir todo el tráfico`), and any other reads as its Type and its peer (`ICMP · Echo Request → lucia-laptop`), where the peer is a device when it is the only address of one. */
export function describeRule(rule: Rule, direction: Direction, net: Network, known: ReadonlySet<TermId>): TermText {
  const what = describeWhat(rule.what, known);
  if (rule.what.kind === 'all' && rule.peer.kind === 'cidr' && rule.peer.cidr === ANYWHERE) return `${LETS[direction]} ${what}`;
  const peer = describePeer(rule.peer, net, known);
  return direction === 'outbound' ? INSPECTION_TEXT.outboundRuleRow(what, peer) : INSPECTION_TEXT.ruleRow(what, peer);
}
