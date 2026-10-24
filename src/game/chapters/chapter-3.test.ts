import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { applyAction, networkSchema, type Network } from '@/engine';
import { INCIDENTS, solvedWorld, type Incident } from '@/levels';
import { incidentTexts, saysName } from '@/levels/ladder';
import { worldBeforeChanges } from '@/levels/world';
import { APP_ANSWERS_HTTP, DEVICE, ORDER_PATH, PAGE_PIECES, PORT, URLS_BY_PARTS } from '@/levels/03-the-web-inside/shared';
import { LADDER_OF_CHAPTER_3, sendIncident } from '@/testing';
import { stripAddress, urlStrip, type UrlPartName } from '@/game/view/cards/web/url-strip';

const CHAPTER = 3;
const LAST_INCIDENT_OF_CHAPTER_2 = '02-14';

const sorted = (values: string[]): string[] => [...values].sort();
const plain = toPlainText;
const builtOfChapter3 = (): Incident[] => INCIDENTS.filter((incident) => incident.chapter === CHAPTER);

/** Returns the ids of the terms that the ladder of the approved design introduces in this subchapter. */
const termsOfSubchapter = (subchapter: number): string[] => LADDER_OF_CHAPTER_3.filter(([, , own]) => own === subchapter).map(([id]) => id);

/** Returns, as "incident: id", every name of the ladder that a later subchapter introduces and that a text of the incident says, tagged or in plain words: also the terms of incidents not built yet. */
function laterNameLeaks(incidents: Incident[]): string[] {
  return incidents.flatMap((incident) => {
    const later = LADDER_OF_CHAPTER_3.filter(([, , subchapter]) => subchapter > incident.order);
    return incidentTexts(incident).flatMap((text) => later.filter(([, name]) => saysName(plain(text), name)).map(([id]) => `${incident.id}: ${id}`));
  });
}

/** Returns an incident of chapter 3 at this order whose report is the given text and that introduces nothing. */
function incidentSaying(order: number, report: string): Incident {
  return { ...sendIncident(), id: `03-${String(order).padStart(2, '0')}`, chapter: CHAPTER, order, introduces: [], report };
}

describe('the incidents of chapter 3', () => {
  it('are registered in order, from 03-01 with no gap', () => {
    const chapter = builtOfChapter3();
    expect(chapter.map(({ id }) => id)).toEqual(chapter.map((_, index) => `03-${String(index + 1).padStart(2, '0')}`));
  });

  it('each incident of chapter 3 starts from the solved world of the one before it', () => {
    const chapter = builtOfChapter3();
    for (const [index, incident] of chapter.entries()) {
      const before = index === 0 ? LAST_INCIDENT_OF_CHAPTER_2 : chapter[index - 1].id;
      expect(worldBeforeChanges(INCIDENTS, incident.id), incident.id).toEqual(solvedWorld(INCIDENTS, before));
    }
  });
});

describe('the term ladder of chapter 3 in its incidents', () => {
  it('introduces, incident by incident, the terms of the approved design', () => {
    for (const incident of builtOfChapter3()) expect(sorted(incident.introduces), incident.id).toEqual(sorted(termsOfSubchapter(incident.order)));
  });

  it('a text of an incident names no term that a later incident of chapter 3 introduces, nor any later name of the ladder data', () => {
    expect(laterNameLeaks(builtOfChapter3())).toEqual([]);
  });

  it('catches a text that says a name of a later subchapter, tagged or in plain words, and lets the own and the earlier ones pass', () => {
    expect(laterNameLeaks([incidentSaying(1, 'Mira la {{http-request}}.')])).toEqual(['03-01: http-request']);
    expect(laterNameLeaks([incidentSaying(1, 'Mira la petición HTTP.')])).toEqual(['03-01: http-request']);
    expect(laterNameLeaks([incidentSaying(1, 'Guarda la cookie y el JSON.')]).sort()).toEqual(['03-01: cookie', '03-01: json']);
    expect(laterNameLeaks([incidentSaying(2, 'La petición HTTP lleva un método HTTP.')])).toEqual([]);
    expect(laterNameLeaks([incidentSaying(2, 'El servidor web contesta.')])).toEqual(['03-02: web-server']);
  });
});

describe('the world of chapter 3 at its first block', () => {
  const start = solvedWorld(INCIDENTS, LAST_INCIDENT_OF_CHAPTER_2);
  const luciaIn = (world: Network) => world.devices.find((device) => device.id === DEVICE.lucia.id);

  it('the app of laptop-lucia answers HTTP after APP_ANSWERS_HTTP, and nothing else of the office changes', () => {
    const world = applyAction(start, APP_ANSWERS_HTTP);
    const before = luciaIn(start)?.host.services ?? [];
    const after = luciaIn(world)?.host.services ?? [];
    expect(before.map((service) => service.web)).toEqual(before.map(() => undefined));
    expect(after.map(({ port }) => port)).toEqual(before.map(({ port }) => port));
    expect(after.filter(({ web }) => web !== undefined).map(({ port }) => port)).toEqual([PORT.app]);
    expect(after.filter(({ port }) => port !== PORT.app)).toEqual(before.filter(({ port }) => port !== PORT.app));
    expect({ ...world, devices: start.devices }).toEqual(start);
    expect(networkSchema.safeParse(world).error).toBeUndefined();
  });

  it('PAGE_PIECES lists only pieces the world 02-14 leaves has', () => {
    const ids = [...start.devices.map(({ id }) => id), ...(start.routers ?? []).map(({ id }) => id), ...start.actors.map(({ id }) => id)];
    expect(PAGE_PIECES.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('URLS_BY_PARTS gives every combination of the port, the path and the query string once, so the strip can write each url', () => {
    const strip = urlStrip(URLS_BY_PARTS);
    expect(strip?.addresses).toHaveLength(8);
    expect(strip?.parts.map(({ name, chips }) => [name, chips.length])).toEqual([['scheme', 1], ['host', 1], ['port', 2], ['path', 2], ['query', 2]]);
    const values = (name: UrlPartName) => strip?.parts.find((part) => part.name === name)?.chips.map(({ id }) => id) ?? [];
    const combinations = values('port').flatMap((port) => values('path').flatMap((path) => values('query').map((query) => ({ scheme: 'http', host: 'localhost', port, path, query }))));
    expect(combinations).toHaveLength(8);
    expect(strip && combinations.map((picks) => stripAddress(strip, picks))).not.toContain(undefined);
    expect(new Set(URLS_BY_PARTS.map(({ id }) => id)).size).toBe(URLS_BY_PARTS.length);
    expect(values('path')).toContain(ORDER_PATH);
  });
});
