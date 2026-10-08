import compare from 'just-compare';
import type { Rule } from '@/engine';
import { ruleIdFor, type FromChip, type Incident, type WhatChip } from './incident';

type RuleShape = Pick<Rule, 'what' | 'peer'>;

/** True when two rules allow the same thing from the same place, whatever their ids. */
export function sameRule(a: RuleShape, b: RuleShape): boolean {
  return compare(a.what, b.what) && compare(a.peer, b.peer);
}

/** Builds the rule a pair of the incident's chips stands for, or null when the incident does not offer one of them. */
export function ruleFromChips(incident: Incident, whatId: string, fromId: string): Rule | null {
  const what = incident.chips.what.find((chip) => chip.id === whatId);
  const from = incident.chips.from.find((chip) => chip.id === fromId);
  return what && from ? { id: ruleIdFor(whatId, fromId), what: what.what, peer: from.peer } : null;
}

/** Returns the chips that name a rule, or null when the incident offers no chip for its what or its from. */
export function chipsOfRule(incident: Incident, rule: RuleShape): { what: WhatChip; from: FromChip } | null {
  const what = incident.chips.what.find((chip) => compare(chip.what, rule.what));
  const from = incident.chips.from.find((chip) => compare(chip.peer, rule.peer));
  return what && from ? { what, from } : null;
}
