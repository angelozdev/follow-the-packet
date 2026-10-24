import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { OFFICE_FLOORS, REPO_ROOT, device, diagnoseIncident, identifyIncident, officeNet, officeTwoFloorsNet, routedSendIncident, sendIncident, syllabusLessons, withDevice } from '@/testing';
import type { Network } from '@/engine';
import { CHAPTERS } from './chapters';
import { missingShownIds, officeLeaks, routersCrossedByTraceroutes, shownOf, unknownCardDeviceIds, unknownClassifiedDeviceIds, unknownExpectedIds, unknownSettingDeviceIds, unknownShownIds, unknownTableOwnerIds, type SendOwner } from './contract/chips';
import { incidentSchema, isGuided, type CaseSpec, type Incident } from './contract/incident';
import { INCIDENTS } from './registry';
import { caseWorld, solvedWorld, startWorld } from './world';

const PROTOTYPE_IDS = ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06', '01-07', '01-08', '01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '02-01', '02-02', '02-03', '02-04', '02-05', '02-06', '02-07', '02-08', '02-09', '02-10', '02-11', '02-12', '02-13', '02-14', '04-01', '04-02'];
const HINT_COUNT = 2;
const WORDS_THE_CARD_WRITES = /^(No[.:]|No es eso\.|Eso es\b|Correcto\.)/;
const lessons = syllabusLessons();

interface Scene {
  owner: SendOwner;
  world: Network;
  shown?: string[];
}

interface CaseScene {
  spec: CaseSpec;
  world: Network;
}

/** Returns each case of a diagnose incident with the world it plays in: the one the incident starts from plus its own changes. None for any other incident. */
function caseScenesOf(incident: Incident): CaseScene[] {
  return incident.mechanic === 'diagnose' ? incident.diagnose.cases.map((spec) => ({ spec, world: caseWorld(startWorld(INCIDENTS, incident.id), spec) })) : [];
}

/** Returns what an incident sends and the worlds it sends in: a send incident in the world it starts from and the one its solution leaves, and each case of a diagnose incident in its own world. */
function scenesOf(incident: Incident): Scene[] {
  switch (incident.mechanic) {
    case 'send':
      return [startWorld(INCIDENTS, incident.id), solvedWorld(INCIDENTS, incident.id)].map((world) => ({ owner: incident, world }));
    case 'diagnose':
      return caseScenesOf(incident).map(({ spec, world }) => ({ owner: spec, world, shown: spec.shown }));
    default:
      return [];
  }
}

/** Returns the routers the traceroutes of an incident cross that the list of its shown pieces lacks, scene by scene: the list of a case when it has its own, the incident's otherwise; none for a scene with no list, which draws the whole world. */
function undrawnTracerouteRouters(incident: Incident, scenes: Scene[]): string[] {
  const lacking = scenes.flatMap(({ owner, world, shown = incident.shown }) => (shown ? routersCrossedByTraceroutes(owner, world).filter((id) => !shown.includes(id)) : []));
  return lacking.filter((id, index) => lacking.indexOf(id) === index);
}

/** Returns the citations (the lesson and the concept note) an incident lacks although its chapter names course modules; none for a chapter that names none. */
function missingCitations(incident: Incident): ('lesson' | 'concept')[] {
  const namesModules = (CHAPTERS.find((chapter) => chapter.number === incident.chapter)?.modules.length ?? 0) > 0;
  return namesModules ? (['lesson', 'concept'] as const).filter((citation) => incident[citation] === undefined) : [];
}

it('registers the prototype incidents in game order', () => {
  expect(INCIDENTS.map((i) => i.id)).toEqual(PROTOTYPE_IDS);
});

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (_id, incident) => {
  it('passes the contract', () => {
    expect(incidentSchema.safeParse(incident).success).toBe(true);
  });

  it('belongs to a game chapter', () => {
    expect(CHAPTERS.map((c) => c.number)).toContain(incident.chapter);
  });

  it('cites a lesson of syllabus.md and a concept note that exists', () => {
    expect(missingCitations(incident)).toEqual([]);
    if (incident.lesson !== undefined) expect(lessons.has(incident.lesson)).toBe(true);
    if (incident.concept !== undefined) expect(existsSync(resolve(REPO_ROOT, incident.concept))).toBe(true);
  });

  it('has two hints and exactly one correct explanation, in every case of a diagnose', () => {
    const questions = isGuided(incident) ? [{ hints: incident.hints, options: incident.explanation }] : incident.diagnose.cases.map((spec) => ({ hints: spec.hints, options: spec.cause.options }));
    for (const { hints, options } of questions) {
      expect(hints).toHaveLength(HINT_COUNT);
      expect(options.filter((option) => option.correct)).toHaveLength(1);
    }
  });

  it('writes no feedback that starts with the words the card already writes before it, Correcto. or No es eso.', () => {
    const options = isGuided(incident) ? incident.explanation : incident.diagnose.cases.flatMap((spec) => spec.cause.options);
    expect(options.map((option) => toPlainText(option.feedback)).filter((feedback) => WORDS_THE_CARD_WRITES.test(feedback))).toEqual([]);
  });

  it('sends nothing from the office to the outside, neither in a flow nor with its chips', () => {
    expect(officeLeaks(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('every expected id names something in the start world of its incident', () => {
    expect(unknownExpectedIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('every card of an incident names a device in its start world', () => {
    expect(unknownCardDeviceIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('every table owner and every setting device names something in the start world of its incident', () => {
    const world = startWorld(INCIDENTS, incident.id);
    expect(unknownTableOwnerIds(incident, world)).toEqual([]);
    expect(unknownSettingDeviceIds(incident, world)).toEqual([]);
    expect(caseScenesOf(incident).flatMap(({ spec, world: inCase }) => unknownTableOwnerIds(incident, inCase, spec))).toEqual([]);
  });

  it('every device a classify card sorts exists in the start world of its incident', () => {
    expect(unknownClassifiedDeviceIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('every id in the list of shown pieces of an incident names something in its world, and in a diagnose, in the world of each case', () => {
    expect(unknownShownIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
    expect(caseScenesOf(incident).flatMap(({ spec, world }) => unknownShownIds(incident, world, spec))).toEqual([]);
  });

  it('the list of shown pieces of an incident holds its sender, every destination that has an owner and every expected id, and in a diagnose, those of each case in its own list', () => {
    expect(missingShownIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
    expect(caseScenesOf(incident).flatMap(({ spec, world }) => missingShownIds(incident, world, spec))).toEqual([]);
  });

  it('an incident that offers traceroute draws every router its traceroutes cross', () => {
    expect(undrawnTracerouteRouters(incident, scenesOf(incident))).toEqual([]);
  });

  it('brings the base world only when it opens its chapter', () => {
    const opensChapter = INCIDENTS.find((i) => i.chapter === incident.chapter) === incident;
    const continuesTheGame = opensChapter && incident.base === undefined && (incident.changes ?? []).length > 0 && INCIDENTS.some((i) => i.chapter < incident.chapter);
    expect(incident.base !== undefined || continuesTheGame).toBe(opensChapter);
  });
});

it('an incident of a chapter that names no modules may leave out its lesson and its concept note', () => {
  const bare = { ...sendIncident(), lesson: undefined, concept: undefined };
  expect(CHAPTERS.find((chapter) => chapter.number === 3)?.modules).toEqual([]);
  expect(incidentSchema.safeParse({ ...bare, id: '03-01', chapter: 3, order: 1 }).success).toBe(true);
  expect(missingCitations({ ...bare, chapter: 3 })).toEqual([]);
  expect(missingCitations({ ...bare, chapter: 1 })).toEqual(['lesson', 'concept']);
});

describe('expected ids', () => {
  const world = { ...officeTwoFloorsNet(), firewalls: officeNet().firewalls };
  const [task] = sendIncident().tasks;
  const expectingBy = (...ids: (string | undefined)[]) => ({
    ...sendIncident(),
    tasks: ids.map((by, index) => ({ ...task, id: `task-${index}`, expect: { ...task.expect, by } })),
  });

  it('accepts a device, a router, an actor, a firewall, or no id at all', () => {
    const incident = expectingBy('your-laptop', OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.server.id, 'fw-lucia', undefined);
    expect(unknownExpectedIds(incident, world)).toEqual([]);
  });

  it('lists an id that names nothing in the world', () => {
    expect(unknownExpectedIds(expectingBy('your-laptop', 'ghost', 'fw-ghost'), world)).toEqual(['ghost', 'fw-ghost']);
  });

  it('lists an id that exists in another world but not in this one', () => {
    expect(unknownExpectedIds(expectingBy(OFFICE_FLOORS.officeRouter.id), officeNet())).toEqual([OFFICE_FLOORS.officeRouter.id]);
  });
});

describe('shown ids', () => {
  const { officeRouter, provider, server, floor1 } = OFFICE_FLOORS;
  const world = withDevice({ ...officeTwoFloorsNet(), firewalls: officeNet().firewalls }, 'lucia-laptop', { firewallIds: ['fw-lucia'] });
  const base = sendIncident();
  const NOBODY = '10.0.0.10';
  const EVERYTHING = ['your-laptop', officeRouter.id, provider.id, server.id];
  const ADDRESSES = [{ id: 'server', address: server.ip }, { id: 'nobody', address: NOBODY }];
  const showing = ({ shown, to = ADDRESSES, by = provider.id }: { shown?: string[]; to?: { id: string; address: string }[]; by?: string } = {}): Incident => ({
    ...base,
    shown,
    send: { ...base.send, from: [{ id: 'you', endpoint: device('your-laptop') }], to },
    tasks: [{ ...base.tasks[0], expect: { ...base.tasks[0].expect, fromId: 'you', toId: to[0].id, by } }],
  });

  it('finds nothing wrong in a list that holds the sender, the owner of every address and the expected id', () => {
    expect(unknownShownIds(showing({ shown: EVERYTHING }), world)).toEqual([]);
    expect(missingShownIds(showing({ shown: EVERYTHING }), world)).toEqual([]);
  });

  it('asks for nothing from an incident with no list, which draws the whole world', () => {
    expect(unknownShownIds(showing(), world)).toEqual([]);
    expect(missingShownIds(showing(), world)).toEqual([]);
  });

  it('lists an id that names nothing in the world, and a firewall, which is drawn with its device and not by itself', () => {
    expect(unknownShownIds(showing({ shown: ['your-laptop', 'ghost', 'fw-lucia'] }), world)).toEqual(['ghost', 'fw-lucia']);
  });

  it('lists what the incident uses and its list lacks, in the order sender, destinations, expected ids', () => {
    expect(missingShownIds(showing({ shown: [officeRouter.id] }), world)).toEqual(['your-laptop', server.id, provider.id]);
  });

  it('asks for no owner of an address that nobody has, such as a private IP of another office', () => {
    expect(world.devices.some((d) => d.privateIp === NOBODY)).toBe(false);
    expect(missingShownIds(showing({ shown: EVERYTHING.filter((id) => id !== server.id) }), world)).toEqual([server.id]);
  });

  it('asks for the device of a firewall that a task expects', () => {
    expect(missingShownIds(showing({ shown: ['your-laptop', server.id], by: 'fw-lucia' }), world)).toEqual(['lucia-laptop']);
  });

  it('asks for the router that owns the interface a destination address names', () => {
    const toGateway = showing({ shown: ['your-laptop'], to: [{ id: 'gateway', address: floor1.gateway }], by: 'your-laptop' });
    expect(missingShownIds(toGateway, world)).toEqual([officeRouter.id]);
  });

  it('takes the list of a case of a diagnose when it has its own, and the list of the incident when it has none', () => {
    const diagnosing = diagnoseIncident();
    const [first, second] = diagnosing.diagnose.cases;
    expect(shownOf(diagnosing, first)).toBeUndefined();
    expect(shownOf({ ...diagnosing, shown: ['your-laptop'] }, first)).toEqual(['your-laptop']);
    expect(shownOf({ ...diagnosing, shown: ['your-laptop'] }, { ...second, shown: ['printer'] })).toEqual(['printer']);
  });

  it('checks a case against its own list and its own world, and asks of it only what that case sends', () => {
    const diagnosing = diagnoseIncident();
    const [first, second] = diagnosing.diagnose.cases;
    const lists = [['your-laptop', officeRouter.id, server.id], ['your-laptop', 'ghost']];
    const incident: Incident = { ...diagnosing, diagnose: { cases: [{ ...first, shown: lists[0] }, { ...second, shown: lists[1] }] } };
    const [listed, other] = incident.diagnose.cases;
    expect(missingShownIds(incident, world, listed)).toEqual([]);
    expect(unknownShownIds(incident, world, listed)).toEqual([]);
    expect(missingShownIds(incident, world, other)).toEqual(['printer']);
    expect(unknownShownIds(incident, world, other)).toEqual(['ghost']);
  });

  it('asks for the device of every card of an identify incident', () => {
    const identifying = identifyIncident();
    expect(missingShownIds({ ...identifying, shown: ['printer'] }, officeTwoFloorsNet())).toEqual(['guest-laptop']);
    expect(missingShownIds({ ...identifying, shown: ['printer', 'guest-laptop'] }, officeTwoFloorsNet())).toEqual([]);
  });
});

describe('the routers a traceroute crosses', () => {
  const { officeRouter, provider, backbone } = OFFICE_FLOORS;
  const world = officeTwoFloorsNet();
  const routed = routedSendIncident();
  const scenes = (incident: Incident): Scene[] => [{ owner: incident as SendOwner, world }];

  it('lists the routers of every probe, in the order they are crossed and once each', () => {
    expect(routersCrossedByTraceroutes(routed, world)).toEqual([officeRouter.id, provider.id, backbone.id]);
  });

  it('lists none for a chip that is a ping, a TTL ping or a packet, and none for a traceroute that never leaves the sender', () => {
    const pings = { ...routed, send: { ...routed.send, message: routed.send.message.filter((chip) => chip.command !== 'traceroute') } };
    expect(routersCrossedByTraceroutes(pings, world)).toEqual([]);
    const toLoopback = { ...routed, send: { ...routed.send, to: routed.send.to.filter((chip) => chip.id === 'loopback') } };
    expect(routersCrossedByTraceroutes(toLoopback, world)).toEqual([]);
  });

  it('finds the router a traceroute crosses and the list of shown pieces lacks', () => {
    const everything = [...(world.devices.map((d) => d.id)), officeRouter.id, provider.id, backbone.id, ...world.actors.map((a) => a.id)];
    expect(undrawnTracerouteRouters({ ...routed, shown: everything }, scenes(routed))).toEqual([]);
    expect(undrawnTracerouteRouters({ ...routed, shown: everything.filter((id) => id !== provider.id) }, scenes(routed))).toEqual([provider.id]);
    expect(undrawnTracerouteRouters({ ...routed, shown: ['your-laptop'] }, scenes(routed))).toEqual([officeRouter.id, provider.id, backbone.id]);
  });

  it('asks for nothing of an incident with no list, which draws the whole world', () => {
    expect(undrawnTracerouteRouters({ ...routed, shown: undefined }, scenes(routed))).toEqual([]);
  });

  it('reads the list of each case of a diagnose, and the incident list only for a case with none', () => {
    const everything = [...world.devices.map((d) => d.id), officeRouter.id, provider.id, backbone.id, ...world.actors.map((a) => a.id)];
    const sceneOf = (shown?: string[]): Scene[] => [{ owner: routed, world, shown }];
    expect(undrawnTracerouteRouters({ ...routed, shown: ['your-laptop'] }, sceneOf(everything))).toEqual([]);
    expect(undrawnTracerouteRouters({ ...routed, shown: everything }, sceneOf(['your-laptop', officeRouter.id]))).toEqual([provider.id, backbone.id]);
    expect(undrawnTracerouteRouters({ ...routed, shown: everything.filter((id) => id !== backbone.id) }, sceneOf())).toEqual([backbone.id]);
  });
});
