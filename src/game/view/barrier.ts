import { INSPECTION_TEXT, MAP_TEXT, type TermText } from '@/copy';
import type { SecurityGroup } from '@/engine';
import { chipsOfRule, type Incident } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from './piece-id';

export interface RuleRow {
  id: string;
  what: TermText;
  from: TermText;
}

export interface BarrierCard {
  sgId: string;
  title: TermText;
  rules: RuleRow[];
}

/** Names each inbound rule of the Security Group with the incident's chips; throws for a rule without chips, which the incident tests rule out. */
export function ruleRows(group: SecurityGroup, incident: Incident): RuleRow[] {
  return group.inbound.map((rule) => {
    const chips = chipsOfRule(incident, rule);
    if (!chips) throw new Error(`${group.id}/${rule.id} has no chips in ${incident.id}`);
    return { id: rule.id, what: chips.what.label, from: chips.from.label };
  });
}

export function rowText(row: RuleRow): TermText {
  return INSPECTION_TEXT.ruleRow(row.what, row.from);
}

/** Returns what the task card of a Security Group shows, or null when the piece is not a Security Group on the map. */
export function barrierCard(session: Session, pieceId: string): BarrierCard | null {
  const ref = parsePieceId(pieceId);
  const group = ref?.kind === 'barrier' ? session.world.securityGroups.find((g) => g.id === ref.id) : undefined;
  return group ? { sgId: group.id, title: MAP_TEXT.barrier(group.name), rules: ruleRows(group, session.incident) } : null;
}
