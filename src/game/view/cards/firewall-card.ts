import { INSPECTION_TEXT, MAP_TEXT, TASK_CARD_TEXT, type TermText } from '@/copy';
import type { Firewall, FirewallKind } from '@/engine';
import { chipsOfRule, type Incident } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from '@/game/view/piece-id';

export interface RuleRow {
  id: string;
  what: TermText;
  from: TermText;
}

export interface FirewallCard {
  firewallId: string;
  kind: FirewallKind;
  title: TermText;
  rules: RuleRow[];
  empty: TermText;
  slot: string;
}

/** Names each inbound rule of the firewall with the incident's chips; throws for a rule without chips, which the incident tests rule out. */
export function ruleRows(firewall: Firewall, incident: Incident): RuleRow[] {
  return firewall.inbound.map((rule) => {
    const chips = chipsOfRule(incident, rule);
    if (!chips) throw new Error(`${firewall.id}/${rule.id} has no chips in ${incident.id}`);
    return { id: rule.id, what: chips.what.label, from: chips.from.label };
  });
}

export function rowText(row: RuleRow): TermText {
  return INSPECTION_TEXT.ruleRow(row.what, row.from);
}

/** Returns what the task card of a firewall shows (its kind, its title, its rules named by chips, and, in the words of its kind, what it says without rules and the label of its new-rule slot), or null when the piece is not a firewall on the map. */
export function firewallCard(session: Session, pieceId: string): FirewallCard | null {
  const ref = parsePieceId(pieceId);
  const firewall = ref?.kind === 'firewall' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  if (!firewall) return null;
  return {
    firewallId: firewall.id,
    kind: firewall.kind,
    title: MAP_TEXT.firewall[firewall.kind](firewall.name),
    rules: ruleRows(firewall, session.incident),
    empty: TASK_CARD_TEXT.noRules[firewall.kind],
    slot: TASK_CARD_TEXT.slot[firewall.kind],
  };
}
