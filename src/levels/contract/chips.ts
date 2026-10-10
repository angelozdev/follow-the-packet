import compare from 'just-compare';
import { ipInCidr, isIpv4, type Network, type PacketSpec, type Rule } from '@/engine';
import { ruleIdFor, type FromChip, type Incident, type SendIncident, type SendMove, type WhatChip } from './incident';

type RuleShape = Pick<Rule, 'what' | 'peer'>;
type Combination = Omit<SendMove, 'type'>;

/** True when two rules allow the same thing from the same place, whatever their ids. */
export function sameRule(a: RuleShape, b: RuleShape): boolean {
  return compare(a.what, b.what) && compare(a.peer, b.peer);
}

/** Builds the rule a pair of the incident's chips stands for, or null when the incident offers no rule chips or not these two. */
export function ruleFromChips(incident: Incident, whatId: string, fromId: string): Rule | null {
  if (incident.mechanic !== 'filter') return null;
  const what = incident.chips.what.find((chip) => chip.id === whatId);
  const from = incident.chips.from.find((chip) => chip.id === fromId);
  return what && from ? { id: ruleIdFor(whatId, fromId), what: what.what, peer: from.peer } : null;
}

/** Returns the chips that name a rule, or null when the incident offers no rule chips or none for its what or its from. */
export function chipsOfRule(incident: Incident, rule: RuleShape): { what: WhatChip; from: FromChip } | null {
  if (incident.mechanic !== 'filter') return null;
  const what = incident.chips.what.find((chip) => compare(chip.what, rule.what));
  const from = incident.chips.from.find((chip) => compare(chip.peer, rule.peer));
  return what && from ? { what, from } : null;
}

/** Builds the packet three send chips stand for: an ICMP message from the origin to the address; null when the incident does not offer one of them. */
export function packetFromChips(incident: SendIncident, { fromId, toId, messageId }: Combination): PacketSpec | null {
  const from = incident.send.from.find((chip) => chip.id === fromId);
  const to = incident.send.to.find((chip) => chip.id === toId);
  const message = incident.send.message.find((chip) => chip.id === messageId);
  return from && to && message ? { from: from.endpoint, to: to.address, protocol: 'icmp', icmpType: message.icmpType } : null;
}

/** Returns every combination of the incident's send chips, one origin, one address and one message each. */
export function sendCombinations(incident: SendIncident): Combination[] {
  return incident.send.from.flatMap((from) =>
    incident.send.to.flatMap((to) => incident.send.message.map((message) => ({ fromId: from.id, toId: to.id, messageId: message.id }))),
  );
}

function packetsOf(incident: Incident): PacketSpec[] {
  const flows = incident.flows.map((flow) => flow.packet);
  if (incident.mechanic !== 'send') return flows;
  return [...flows, ...sendCombinations(incident).flatMap((combination) => packetFromChips(incident, combination) ?? [])];
}

/** Returns, as "device → address", every flow and every combination of send chips that sends a packet from a device of an office to an address outside it: the game does not model the office's NAT. */
export function officeLeaks(incident: Incident, world: Network): string[] {
  if (world.kind !== 'office') return [];
  return packetsOf(incident)
    .filter((packet) => packet.from.kind === 'device' && isIpv4(packet.to) && !ipInCidr(packet.to, world.cidr))
    .map((packet) => `${packet.from.id} → ${packet.to}`);
}
