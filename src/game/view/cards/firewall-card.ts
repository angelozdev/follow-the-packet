import { INSPECTION_TEXT, MAP_TEXT, TASK_CARD_TEXT, describeRule, type TermText } from '@/copy';
import type { Direction, Firewall, FirewallKind } from '@/engine';
import { chipsOfRule } from '@/levels';
import type { Session } from '@/game/session';
import { parsePieceId } from '@/game/view/piece-id';

export interface RuleRow {
  id: string;
  what: TermText;
  from: TermText;
}

export interface OutboundRow {
  id: string;
  what: TermText;
  to: TermText;
}

export interface DescribedRow {
  id: string;
  text: TermText;
}

export interface OutboundList {
  tabs: Record<Direction, TermText>;
  rules: (OutboundRow | DescribedRow)[];
  empty: TermText;
  slot: string;
}

export interface FirewallCard {
  firewallId: string;
  kind: FirewallKind;
  title: TermText;
  rules: (RuleRow | DescribedRow)[];
  empty: TermText;
  slot: string;
  outbound?: OutboundList;
}

function namedRows<Row>(session: Session, firewall: Firewall, direction: Direction, named: (id: string, what: TermText, peer: TermText) => Row): (Row | DescribedRow)[] {
  return firewall[direction].map((rule) => {
    const chips = chipsOfRule(session.incident, rule, direction);
    return chips ? named(rule.id, chips.what.label, chips.peer.label) : { id: rule.id, text: describeRule(rule, direction, session.world, session.known) };
  });
}

/** Names each inbound rule of the firewall with the incident's chips (Type and Source); a rule that no chip names is written from the rule itself, with the terms the player knows (`describeRule`), and never from a chip the incident does not offer. */
export function ruleRows(session: Session, firewall: Firewall): (RuleRow | DescribedRow)[] {
  return namedRows(session, firewall, 'inbound', (id, what, from) => ({ id, what, from }));
}

/** Names each outbound rule of the firewall with the incident's chips (Type and Destination), and writes from the rule itself, as `ruleRows` does, one that no chip names, such as the rule that lets everything out. */
export function outboundRows(session: Session, firewall: Firewall): (OutboundRow | DescribedRow)[] {
  return namedRows(session, firewall, 'outbound', (id, what, to) => ({ id, what, to }));
}

export function rowText(row: RuleRow | OutboundRow | DescribedRow): TermText {
  if ('text' in row) return row.text;
  return 'to' in row ? INSPECTION_TEXT.outboundRuleRow(row.what, row.to) : INSPECTION_TEXT.ruleRow(row.what, row.from);
}

/** True when the player can set the outbound rules of this firewall: the ladder has opened them for its kind and the incident offers Destination chips to write them with. */
function hasOutboundList(session: Session, firewall: Firewall): boolean {
  const { incident } = session;
  return session.parts.outboundRules[firewall.kind] && incident.mechanic === 'filter' && incident.chips.to !== undefined;
}

function outboundList(session: Session, firewall: Firewall): OutboundList {
  return {
    tabs: TASK_CARD_TEXT.tabs[firewall.kind],
    rules: outboundRows(session, firewall),
    empty: TASK_CARD_TEXT.noOutboundRules[firewall.kind],
    slot: TASK_CARD_TEXT.outboundSlot[firewall.kind],
  };
}

/** Returns what the task card of a firewall shows (its kind, its title, its inbound rules named by chips, and, in the words of its kind, what it says without rules and the label of its new-rule slot), or null when the piece is not a firewall on the map. While the ladder has opened its outbound rules and the incident offers Destination chips, it also carries an `outbound` list (the labels of the two tabs, the outbound rules named by chips, what it says without them and the label of its slot); otherwise it has no such key. */
export function firewallCard(session: Session, pieceId: string): FirewallCard | null {
  const ref = parsePieceId(pieceId);
  const firewall = ref?.kind === 'firewall' ? session.world.firewalls.find((f) => f.id === ref.id) : undefined;
  if (!firewall) return null;
  return {
    firewallId: firewall.id,
    kind: firewall.kind,
    title: MAP_TEXT.firewall[firewall.kind](firewall.name),
    rules: ruleRows(session, firewall),
    empty: TASK_CARD_TEXT.noRules[firewall.kind],
    slot: TASK_CARD_TEXT.slot[firewall.kind],
    ...(hasOutboundList(session, firewall) ? { outbound: outboundList(session, firewall) } : {}),
  };
}
