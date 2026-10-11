import { describe, expect, it } from 'vitest';
import type { TermText } from '@/copy';
import type { Network } from '@/engine';
import { DEVICE } from './01-first-day/shared';
import { S2 } from './04-iaas/shared';
import { changedNames, unnamedChanges } from './contract/changes';
import { isGuided, type CaseSpec, type Incident } from './contract/incident';
import { INCIDENTS } from './registry';
import { caseWorld, startWorld, worldBeforeChanges } from './world';

type OptionTexts = { correct: boolean; feedback: TermText }[];

interface Change {
  where: string;
  before: Network;
  after: Network;
  texts: TermText[];
}

/**
 * The incidents whose changes to the world the player is not told about yet, as incident (and case) → the devices and routers whose configuration changes and that no text names.
 * The test asserts that this list is exactly what the registry holds, so it can neither hide a new gap nor keep a fixed one; it is empty when every change is explained.
 */
const UNEXPLAINED_CHANGES_PENDING: Record<string, string[]> = {};

function rightFeedback(options: OptionTexts): TermText[] {
  return options.filter((option) => option.correct).map((option) => option.feedback);
}

function caseChange(incident: Incident, start: Network, spec: CaseSpec): Change {
  return { where: `${incident.id}/${spec.id}`, before: start, after: caseWorld(start, spec), texts: [spec.report, ...rightFeedback(spec.cause.options)] };
}

/** Returns each change to the world an incident makes, with the texts that must explain it: its own changes (the report, the feedback of the right explanation and the takeaway) and, in a diagnose, those of each case (its report and the feedback of its right cause). */
function changesOf(incident: Incident): Change[] {
  const start = startWorld(INCIDENTS, incident.id);
  const explanation = isGuided(incident) ? rightFeedback(incident.explanation) : [];
  const own: Change = { where: incident.id, before: worldBeforeChanges(INCIDENTS, incident.id), after: start, texts: [incident.report, ...explanation, incident.takeaway] };
  const cases = incident.mechanic === 'diagnose' ? incident.diagnose.cases.map((spec) => caseChange(incident, start, spec)) : [];
  return [own, ...cases];
}

/** Returns, per incident (and case), the devices and routers whose configuration changes and that none of the texts that must explain it names. */
function unexplainedChanges(): Record<string, string[]> {
  const gaps = INCIDENTS.flatMap(changesOf).map(({ where, before, after, texts }): [string, string[]] => [where, unnamedChanges(before, after, texts)]);
  return Object.fromEntries(gaps.filter(([, names]) => names.length > 0));
}

function changedBy(incidentId: string): string[] {
  const incident = INCIDENTS.find((candidate) => candidate.id === incidentId);
  if (!incident) throw new Error(`missing incident ${incidentId}`);
  return changesOf(incident).flatMap(({ before, after }) => changedNames(before, after));
}

describe('explained changes', () => {
  it('reads the changes of both chapters: 01-02 connects laptop-visita and 04-02 changes the Security Group of servidor2', () => {
    expect(changedBy('01-02')).toEqual([DEVICE.visitor.name]);
    expect(changedBy('04-02')).toEqual([S2.id]);
  });

  it('every change to the world of an incident is explained by naming the device or router it changes', () => {
    expect(unexplainedChanges()).toEqual(UNEXPLAINED_CHANGES_PENDING);
  });
});
