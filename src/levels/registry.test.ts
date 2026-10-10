import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, REPO_ROOT, device, identifyIncident, officeNet, officeTwoFloorsNet, sendIncident, syllabusLessons, withDevice } from '@/testing';
import { CHAPTERS } from './chapters';
import { missingShownIds, officeLeaks, unknownCardDeviceIds, unknownExpectedIds, unknownShownIds } from './contract/chips';
import { incidentSchema, isGuided, type Incident } from './contract/incident';
import { INCIDENTS } from './registry';
import { startWorld } from './world';

const PROTOTYPE_IDS = ['01-01', '01-02', '04-01', '04-02'];
const HINT_COUNT = 2;
const lessons = syllabusLessons();

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
    expect(lessons.has(incident.lesson)).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, incident.concept))).toBe(true);
  });

  it('has two hints and exactly one correct explanation, in every case of a diagnose', () => {
    const questions = isGuided(incident) ? [{ hints: incident.hints, options: incident.explanation }] : incident.diagnose.cases.map((spec) => ({ hints: spec.hints, options: spec.cause.options }));
    for (const { hints, options } of questions) {
      expect(hints).toHaveLength(HINT_COUNT);
      expect(options.filter((option) => option.correct)).toHaveLength(1);
    }
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

  it('every id in the list of shown pieces of an incident names something in its world', () => {
    expect(unknownShownIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('the list of shown pieces of an incident holds its sender, every destination that has an owner and every expected id', () => {
    expect(missingShownIds(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('brings the base world only when it opens its chapter', () => {
    const opensChapter = INCIDENTS.find((i) => i.chapter === incident.chapter) === incident;
    expect(incident.base !== undefined).toBe(opensChapter);
  });
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

  it('asks for the device of every card of an identify incident', () => {
    const identifying = identifyIncident();
    expect(missingShownIds({ ...identifying, shown: ['printer'] }, officeTwoFloorsNet())).toEqual(['guest-laptop']);
    expect(missingShownIds({ ...identifying, shown: ['printer', 'guest-laptop'] }, officeTwoFloorsNet())).toEqual([]);
  });
});
