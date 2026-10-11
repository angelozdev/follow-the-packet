import { describe, expect, it } from 'vitest';
import type { TermText } from '@/copy';
import { applyAction, networkSchema, type Network, type NetworkAction, type Route, type RouterInterface } from '@/engine';
import { OFFICE_FLOORS, officeTwoFloorsNet } from '@/testing';
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
 * The incidents whose changes to the world the player is not told about yet, as incident (and case) → the devices, routers and servers of the internet whose configuration changes and that no text names.
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

describe('explained changes beyond the devices and routers of an incident', () => {
  const { backbone, officeRouter, server } = OFFICE_FLOORS;
  const before = officeTwoFloorsNet();
  const [internetServer] = before.actors;
  const BACKBONE = before.routers?.find(({ id }) => id === backbone.id);
  const KEPT: RouterInterface[] = BACKBONE?.interfaces ?? [];
  const NEW_SERVER = { id: 'name-server', name: 'servidor-de-nombres', ip: '198.51.100.60', kind: 'server', latencyMs: 20 } as const;
  const addServer: NetworkAction = { type: 'addActor', actor: NEW_SERVER };
  const wireBackbone = (kept: RouterInterface[] = KEPT, routes?: Route[]): NetworkAction => ({
    type: 'updateRouter',
    routerId: backbone.id,
    interfaces: [...kept, { ip: '198.51.100.2', faces: NEW_SERVER.id }],
    routes,
  });
  const after = (...actions: NetworkAction[]): Network => actions.reduce(applyAction, before);

  it('every change to a server of the internet is explained by naming it', () => {
    const slower: Network = { ...before, actors: before.actors.map((actor) => (actor.kind === 'server' ? { ...actor, latencyMs: 90 } : actor)) };
    expect(unnamedChanges(before, slower, [])).toEqual([internetServer.name]);
    expect(unnamedChanges(before, slower, [`Ahora ${internetServer.name} tarda más en contestar.`])).toEqual([]);
    expect(unnamedChanges(before, slower, [`Ahora ${internetServer.name}-2 tarda más en contestar.`])).toEqual([internetServer.name]);
  });

  it('a router interface that faces a piece added by the same action is not a configuration change', () => {
    const wired = after(addServer, wireBackbone());
    expect(networkSchema.safeParse(wired).success).toBe(true);
    expect(wired.routers?.find(({ id }) => id === backbone.id)?.interfaces).toHaveLength(KEPT.length + 1);
    expect(changedNames(before, wired)).toEqual([]);
    expect(unnamedChanges(before, wired, [])).toEqual([]);
  });

  it('a router whose routes differ is listed even when an interface is added at the same time', () => {
    const routes = [{ to: server.range, next: officeRouter.id }];
    expect(changedNames(before, after(addServer, wireBackbone(KEPT, routes)))).toEqual([BACKBONE?.name]);
  });

  it('a router is listed when an interface it already had goes away or changes, or when its new interface faces a piece that already existed', () => {
    const [toProvider, toServer] = KEPT;
    const faceOffice: RouterInterface = { ip: '203.0.113.9', faces: officeRouter.id };
    expect(changedNames(before, after(addServer, wireBackbone([toProvider])))).toEqual([BACKBONE?.name]);
    expect(changedNames(before, after(addServer, wireBackbone([{ ...toProvider, ip: faceOffice.ip }, toServer])))).toEqual([BACKBONE?.name]);
    expect(changedNames(before, after({ type: 'updateRouter', routerId: backbone.id, interfaces: [...KEPT, faceOffice] }))).toEqual([BACKBONE?.name]);
  });

  it('a device whose hosts file or dns server differs is listed', () => {
    const hostsFile = { hosts: [{ name: 'sitio.test', ip: server.ip }] };
    const dnsServer = { dnsServer: '198.51.100.2' };
    const configured = (extra: object): Network => ({ ...before, devices: before.devices.map((device) => (device.id === DEVICE.you.id ? { ...device, ...extra } : device)) });
    expect(unnamedChanges(before, configured(hostsFile), [])).toEqual([DEVICE.you.name]);
    expect(unnamedChanges(before, configured(dnsServer), [])).toEqual([DEVICE.you.name]);
    expect(unnamedChanges(before, configured(hostsFile), [`${DEVICE.you.name} ahora tiene un archivo hosts.`])).toEqual([]);
  });
});
