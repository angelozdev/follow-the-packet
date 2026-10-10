import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT, syllabusLessons } from '@/testing';
import { CHAPTERS } from './chapters';
import { officeLeaks } from './chips';
import { incidentSchema, type Incident } from './incident';
import { INCIDENTS } from './registry';
import { startWorld } from './world';

const PROTOTYPE_IDS = ['01-01', '01-02', '01-03', '01-04', '04-01', '04-02'];
const HINT_COUNT = 2;
const lessons = syllabusLessons();

it('registers the prototype incidents in course order', () => {
  expect(INCIDENTS.map((i) => i.id)).toEqual(PROTOTYPE_IDS);
});

describe.each(INCIDENTS.map((i): [string, Incident] => [i.id, i]))('incident %s', (_id, incident) => {
  it('passes the contract', () => {
    expect(incidentSchema.safeParse(incident).success).toBe(true);
  });

  it('belongs to a chapter of the syllabus', () => {
    expect(CHAPTERS.map((c) => c.number)).toContain(incident.chapter);
  });

  it('cites a lesson of syllabus.md and a concept note that exists', () => {
    expect(lessons.has(incident.lesson)).toBe(true);
    expect(existsSync(resolve(REPO_ROOT, incident.concept))).toBe(true);
  });

  it('has two hints and exactly one correct explanation', () => {
    expect(incident.hints).toHaveLength(HINT_COUNT);
    expect(incident.explanation.filter((option) => option.correct)).toHaveLength(1);
  });

  it('sends nothing from the office to the outside, neither in a flow nor with its chips', () => {
    expect(officeLeaks(incident, startWorld(INCIDENTS, incident.id))).toEqual([]);
  });

  it('brings the base world only when it opens its chapter', () => {
    const opensChapter = INCIDENTS.find((i) => i.chapter === incident.chapter) === incident;
    expect(incident.base !== undefined).toBe(opensChapter);
  });
});
