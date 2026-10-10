import { TERMS, termsIn, type TermId, type TermText } from '@/copy';
import type { FirewallKind } from '@/engine';
import type { Incident } from './contract/incident';

export interface ConfigurableParts {
  inboundRules: Record<FirewallKind, boolean>;
  outboundRules: boolean;
  hostSettings: boolean;
}

/** Returns every term introduced by the incident and the ones before it; incidents come in course order. */
export function knownTerms(incidents: Incident[], incidentId: string): ReadonlySet<TermId> {
  const index = incidents.findIndex((i) => i.id === incidentId);
  if (index < 0) throw new Error(`unknown incident ${incidentId}`);
  return new Set(incidents.slice(0, index + 1).flatMap((i) => i.introduces));
}

/** Returns which parts of the map the player may change once these terms are known: the inbound rules of a host firewall with `rule`, and of a Security Group with `inbound-rule`. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return {
    inboundRules: { 'host-firewall': known.has('rule'), 'security-group': known.has('inbound-rule') },
    outboundRules: known.has('outbound-rule'),
    hostSettings: known.has('icmp-echo-ignore-all'),
  };
}

/** Returns the labels of the chips the incident writes: Type and Source for a filter, the messages for a send (an origin is named after the world and an address is only an address). */
export function chipLabels(incident: Incident): TermText[] {
  const chips = incident.mechanic === 'filter' ? [...incident.chips.what, ...incident.chips.from] : incident.send.message;
  return chips.map((chip) => chip.label);
}

/** Returns every text of the incident the player reads: report, tasks, chips, hints, the question, the explanation and the takeaway. */
export function incidentTexts(incident: Incident): TermText[] {
  return [
    incident.report,
    ...incident.tasks.map((task) => task.text),
    ...chipLabels(incident),
    ...incident.hints,
    ...(incident.question ? [incident.question] : []),
    ...incident.explanation.flatMap((option) => [option.text, option.feedback]),
    incident.takeaway,
  ];
}

function escapeForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns the terms whose name the text says as whole words, ignoring case, alone or in the Spanish plural made with s or es: «red» in «una Red» and in «redes», but not in «Redshift». Only the end of the whole name takes the plural: «IP privadas» is caught, «IPs privadas» and «direcciones IP» are not. */
export function namedTerms(text: string, terms: TermId[]): TermId[] {
  return terms.filter((term) => new RegExp(`(?<![\\p{L}\\p{N}])${escapeForPattern(TERMS[term].name)}(?:e?s)?(?![\\p{L}\\p{N}])`, 'iu').test(text));
}

/** Returns, once each, the terms the texts use that are not known yet. */
export function unknownTerms(texts: TermText[], known: ReadonlySet<TermId>): TermId[] {
  return [...new Set(texts.flatMap((text) => termsIn(text)))].filter((term) => !known.has(term));
}
