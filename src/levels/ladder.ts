import { termsIn, type TermId, type TermText } from '@/copy';
import type { Incident } from './incident';

export interface ConfigurableParts {
  inboundRules: boolean;
  outboundRules: boolean;
  linuxSettings: boolean;
}

/** Returns every term introduced by the incident and the ones before it; incidents come in course order. */
export function knownTerms(incidents: Incident[], incidentId: string): ReadonlySet<TermId> {
  const index = incidents.findIndex((i) => i.id === incidentId);
  if (index < 0) throw new Error(`unknown incident ${incidentId}`);
  return new Set(incidents.slice(0, index + 1).flatMap((i) => i.introduces));
}

/** Returns which parts of the map the player may change once these terms are known. */
export function configurableParts(known: ReadonlySet<TermId>): ConfigurableParts {
  return {
    inboundRules: known.has('inbound-rule'),
    outboundRules: known.has('outbound-rule'),
    linuxSettings: known.has('icmp-echo-ignore-all'),
  };
}

/** Returns every text of the incident the player reads: report, tasks, chips, hints, explanation and takeaway. */
export function incidentTexts(incident: Incident): TermText[] {
  return [
    incident.report,
    ...incident.tasks.map((task) => task.text),
    ...incident.chips.what.map((chip) => chip.label),
    ...incident.chips.from.map((chip) => chip.label),
    ...incident.hints,
    ...incident.explanation.flatMap((option) => [option.text, option.feedback]),
    incident.takeaway,
  ];
}

/** Returns, once each, the terms the texts use that are not known yet. */
export function unknownTerms(texts: TermText[], known: ReadonlySet<TermId>): TermId[] {
  return [...new Set(texts.flatMap((text) => termsIn(text)))].filter((term) => !known.has(term));
}
