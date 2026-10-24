import { TERMS, termsIn, type TermId, type TermText } from '@/copy';
import type { Direction, FirewallKind } from '@/engine';
import { isGuided, type CaseSpec, type Incident, type TableSpec } from './contract/incident';

export interface ConfigurableParts {
  inboundRules: Record<FirewallKind, boolean>;
  outboundRules: Record<FirewallKind, boolean>;
  hostSettings: boolean;
}

/** The term that opens the rules of each direction of each kind of firewall: the rules of a host firewall open with `rule` (inbound) and `outbound`, and those of a Security Group with `inbound-rule` and `outbound-rule`. */
export const RULES_TERM: Record<Direction, Record<FirewallKind, TermId>> = {
  inbound: { 'host-firewall': 'rule', 'security-group': 'inbound-rule' },
  outbound: { 'host-firewall': 'outbound', 'security-group': 'outbound-rule' },
};

/** Returns every term introduced by the incident and the ones before it; incidents come in course order. */
export function knownTerms(incidents: Incident[], incidentId: string): ReadonlySet<TermId> {
  const index = incidents.findIndex((i) => i.id === incidentId);
  if (index < 0) throw new Error(`unknown incident ${incidentId}`);
  return new Set(incidents.slice(0, index + 1).flatMap((i) => i.introduces));
}

function opened(known: ReadonlySet<TermId>, terms: Record<FirewallKind, TermId>): Record<FirewallKind, boolean> {
  return { 'host-firewall': known.has(terms['host-firewall']), 'security-group': known.has(terms['security-group']) };
}

/** Returns which parts of the map the player may change once these terms are known: the inbound rules of a host firewall with `rule`, and of a Security Group with `inbound-rule`; the outbound rules of a host firewall with `outbound`, and of a Security Group with `outbound-rule`. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return { inboundRules: opened(known, RULES_TERM.inbound), outboundRules: opened(known, RULES_TERM.outbound), hostSettings: known.has('icmp-echo-ignore-all') };
}

/** Returns the labels of the chips the incident writes: Type, Source and, when it offers outbound rules, Destination for a filter, the messages for a send and for every case of a diagnose (an origin is named after the world and an address is only an address), none for an identify (its chips are values, such as an IP, and not terms). */
export function chipLabels(incident: Incident): TermText[] {
  switch (incident.mechanic) {
    case 'filter':
      return [...incident.chips.what, ...incident.chips.from, ...(incident.chips.to ?? [])].map((chip) => chip.label);
    case 'send':
      return incident.send.message.map((chip) => chip.label);
    case 'diagnose':
      return incident.diagnose.cases.flatMap((spec) => spec.send.message.map((chip) => chip.label));
    case 'identify':
      return [];
  }
}

/** Returns the texts the cards of an identify incident show: the question of a card, the label and the feedback of each chip, and the rule of an initial pick; none for any other incident. */
function cardTexts(incident: Incident): TermText[] {
  if (incident.mechanic !== 'identify') return [];
  return incident.identify.cards.flatMap((card) => [
    ...(card.question ? [card.question] : []),
    ...card.trays.flatMap((tray) => [...(tray.initialPickRule ? [tray.initialPickRule] : []), ...tray.chips.flatMap((chip) => [chip.label, ...(chip.feedback ? [chip.feedback] : [])])]),
  ]);
}

/** Returns the texts the cards of settings of a send incident show: the name of each tray and the label of each chip; none for any other incident. */
function settingTexts(incident: Incident): TermText[] {
  if (incident.mechanic !== 'send') return [];
  return (incident.send.settings ?? []).flatMap((setting) => [setting.name, ...setting.chips.map((chip) => chip.label)]);
}

/** Returns the label of every chip of the trays of the tables the player edits. */
function tableTexts(tables: TableSpec[]): TermText[] {
  return tables.flatMap((table) => Object.values<{ label: TermText }[]>(table.trays).flatMap((chips) => chips.map((chip) => chip.label)));
}

/** Returns the texts the tables and the clock of a send incident show: the label of each chip of each table and of each step of the clock; none for any other incident. */
function editorTexts(incident: Incident): TermText[] {
  if (incident.mechanic !== 'send') return [];
  return [...tableTexts(incident.send.tables ?? []), ...(incident.send.clock?.steps ?? []).map((step) => step.label)];
}

function fixTexts({ fix }: CaseSpec): TermText[] {
  return fix ? [...tableTexts(fix.tables), ...fix.tasks.map((task) => task.text)] : [];
}

/** Returns the texts of the cases of a diagnose incident: for each case its report, its hints, its question, the text and the feedback of each cause and, when it has a fix, the chips of its tables and the text of its tasks; none for any other incident. */
function caseTexts(incident: Incident): TermText[] {
  if (incident.mechanic !== 'diagnose') return [];
  return incident.diagnose.cases.flatMap((spec) => [spec.report, ...spec.hints, spec.cause.question, ...spec.cause.options.flatMap((option) => [option.text, option.feedback]), ...fixTexts(spec)]);
}

/** Returns the texts of the follow-up of an incident: the hints, the question and the explanation of one that has tasks, and the texts of the cases of a diagnose. */
function followUpTexts(incident: Incident): TermText[] {
  if (!isGuided(incident)) return caseTexts(incident);
  return [...incident.hints, ...(incident.question ? [incident.question] : []), ...incident.explanation.flatMap((option) => [option.text, option.feedback])];
}

/** Returns every text of the incident the player reads: report, tasks, chips, the texts of the cards of an identify incident and of the settings, tables and clock of a send incident, hints, the question, the explanation and the takeaway; for a diagnose, the texts of each case instead of the tasks, the hints, the question and the explanation. */
export function incidentTexts(incident: Incident): TermText[] {
  return [
    incident.report,
    ...(isGuided(incident) ? incident.tasks.map((task) => task.text) : []),
    ...chipLabels(incident),
    ...cardTexts(incident),
    ...settingTexts(incident),
    ...editorTexts(incident),
    ...followUpTexts(incident),
    incident.takeaway,
  ];
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns true when the text says the name as whole words, ignoring case, alone or in the Spanish plural made with s or es; the rule of `namedTerms`, for a name that may belong to no registered term. */
export function saysName(text: string, name: string): boolean {
  return new RegExp(`(?<![\\p{L}\\p{N}])${escapeForPattern(name)}(?:e?s)?(?![\\p{L}\\p{N}])`, 'iu').test(text);
}

/** Returns the terms whose name the text says as whole words, ignoring case, alone or in the Spanish plural made with s or es: «red» in «una Red» and in «redes», but not in «Redshift». Only the end of the whole name takes the plural: «IP privadas» is caught, «IPs privadas» and «direcciones IP» are not. */
export function namedTerms(text: string, terms: TermId[]): TermId[] {
  return terms.filter((term) => saysName(text, TERMS[term].name));
}

/** Returns, once each, the terms the texts use that are not known yet. */
export function unknownTerms(texts: TermText[], known: ReadonlySet<TermId>): TermId[] {
  return [...new Set(texts.flatMap((text) => termsIn(text)))].filter((term) => !known.has(term));
}
