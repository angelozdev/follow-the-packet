import { INSPECTION_TEXT, MAP_TEXT, type TermText } from '@/copy';
import type { Firewall } from '@/engine';
import { chipsOfRule, type Incident } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from './piece-id';

export interface RuleRow {
  id: string;
  what: TermText;
  from: TermText;
}

export interface BarrierCard {
  firewallId: string;
  title: TermText;
  rules: RuleRow[];
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

/** Returns what the task card of a firewall shows, or null when the piece is not a firewall on the map. */
export function barrierCard(session: Session, pieceId: string): BarrierCard | null {
  const ref = parsePieceId(pieceId);
  const firewall = ref?.kind === 'barrier' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  return firewall ? { firewallId: firewall.id, title: MAP_TEXT.barrier(firewall.name), rules: ruleRows(firewall, session.incident) } : null;
}
