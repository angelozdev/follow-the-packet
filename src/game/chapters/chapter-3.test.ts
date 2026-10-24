import { describe, expect, it } from 'vitest';
import { toPlainText } from '@/copy';
import { applyAction, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, saysName, unknownTerms } from '@/levels/ladder';
import { worldBeforeChanges } from '@/levels/world';
import { ADDRESS, APP_ANSWERS_HTTP, DEVICE, IP, MESSAGE, NAME, ORDER_BODY, ORDER_PATH, ORIGIN, PAGE_PIECES, PORT, TASK, URLS_BY_PARTS } from '@/levels/03-the-web-inside/shared';
import { LADDER_OF_CHAPTER_3, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { failingTaskIds } from '@/game/tasks';
import { toolOutput } from '@/game/view/cards/terminal/output-card';
import { stripAddress, urlStrip, type UrlPartName } from '@/game/view/cards/web/url-strip';
import { inspect } from '@/game/view/inspection';
import { pieceViews } from '@/game/view/pieces';

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

/** Sends the curl of laptop-lucia to this address chip. */
const sending = (session: Session, toId: string, messageId: string = MESSAGE.curl.id): Session => sessionReducer(session, { type: 'sendPacket', fromId: ORIGIN.lucia.id, toId, messageId });

/** Returns the ids of the tasks of a guided incident that do not hold yet. */
const stillOpen = ({ incident, runs, history, answers }: Session): string[] => (isGuided(incident) ? failingTaskIds(incident.tasks, runs, history, answers) : []);

/** Returns the stars of the incident once it is submitted. */
const starsWhenSubmitted = (session: Session) => starsOf(sessionReducer(session, { type: 'submit' }));

/** Returns the box of the last packet sent, by the plain text of each field label, with the plain text of its lines. */
const lastBox = (session: Session): Record<string, string[]> => {
  const fields = inspect(session, session.sent.at(-1)!.pieceId)?.fields ?? [];
  return Object.fromEntries(fields.map(({ label, lines }) => [plain(label), lines.map(plain)]));
};

/** Returns the lines the output card prints for the curl of laptop-lucia to this address. */
const printedFor = (session: Session, toId: string, messageId: string = MESSAGE.curl.id): string[] =>
  (toolOutput(session, { from: ORIGIN.lucia.id, to: toId, message: messageId })?.segments ?? []).flatMap((segment) => (segment.kind === 'line' ? [segment.text] : segment.lines));

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

describe('03-01, an address for everything', () => {
  const ADDRESS_FOR_EVERYTHING = '03-01';
  const start = startSession(INCIDENTS, ADDRESS_FOR_EVERYTHING);
  const { incident } = start;
  const urlOf = (port: number, path: string, query: string) => URLS_BY_PARTS.find((chip) => chip.port === port && chip.path === path && chip.query === query)!.id;
  const PORT_80_ORDER_7 = urlOf(PORT.web, ORDER_PATH, 'id=7');
  const WRONG_PATH_ORDER_7 = urlOf(PORT.app, '/pedido', 'id=7');
  const NOT_FOUND = 'No hay nada en ese camino.';
  const FRAGMENT = /#[^.]*no llega al servidor/;

  it('03-01 starts from the world chapter 2 leaves', () => {
    const luciaWeb = (world: ReturnType<typeof startWorld>) => world.devices.find((device) => device.id === DEVICE.lucia.id)?.host.services.map(({ port, web }) => [port, web !== undefined]);
    const before = worldBeforeChanges(INCIDENTS, ADDRESS_FOR_EVERYTHING);
    expect(before).toEqual(solvedWorld(INCIDENTS, LAST_INCIDENT_OF_CHAPTER_2));
    expect(before).toEqual(solvedWorld(INCIDENTS, '02-13'));
    expect(luciaWeb(before)).toEqual([[PORT.app, false], [PORT.database, false], [PORT.ssh, false]]);
    expect(luciaWeb(startWorld(INCIDENTS, ADDRESS_FOR_EVERYTHING))).toEqual([[PORT.app, true], [PORT.database, false], [PORT.ssh, false]]);
    expect(incident.changes).toEqual([APP_ANSWERS_HTTP]);
  });

  it('03-01: the curl of the order 7 and the one of the order 8 each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.orderSeven, TASK.orderEight]);
    const seven = sending(start, ADDRESS.orderSeven.id);
    expect(stillOpen(seven)).toEqual([TASK.orderEight]);
    const both = sending(seven, ADDRESS.orderEight.id);
    expect(stillOpen(both)).toEqual([]);
    expect(starsWhenSubmitted(both)).toMatchObject({ closed: true, middle: true });
  });

  it('03-01: of the eight urls, the four of the port 3000 are answered and the four of the port 80 are refused', () => {
    const outcomesAt = (port: number) => URLS_BY_PARTS.filter((chip) => chip.port === port).map(({ id }) => sending(start, id).sent.at(-1)!.trace.outcome);
    expect(outcomesAt(PORT.app)).toEqual(['replied', 'replied', 'replied', 'replied']);
    expect(outcomesAt(PORT.web)).toEqual(['refused', 'refused', 'refused', 'refused']);
  });

  it('03-01: port 80 is refused because nobody listens on it', () => {
    const refused = sending(start, PORT_80_ORDER_7);
    const run = refused.sent.at(-1)!;
    const luciaServices = startWorld(INCIDENTS, ADDRESS_FOR_EVERYTHING).devices.find((device) => device.id === DEVICE.lucia.id)?.host.services ?? [];
    expect(luciaServices.map(({ port }) => port)).not.toContain(PORT.web);
    expect(run.trace.outcome).toBe('refused');
    expect(run.by).toEqual([DEVICE.lucia.id]);
    expect(run.trace.steps.map((step) => step.reason.code)).toContain('host-refused');
    expect(lastBox(refused)['Dónde y por qué se detuvo']?.join(' ')).toMatch(new RegExp(`ningún programa escucha en el puerto ${PORT.web}: ${DEVICE.lucia.name} lo rechaza`));
    expect(printedFor(refused, PORT_80_ORDER_7)).toEqual([expect.stringMatching(/^curl: \(7\) Failed to connect to localhost:80 after \d+ ms: Could not connect to server$/)]);
    expect(stillOpen(refused)).toEqual([TASK.orderSeven, TASK.orderEight]);
  });

  it('03-01: a path the app does not serve is answered with its 404 body and completes no task', () => {
    const wrong = sending(start, WRONG_PATH_ORDER_7);
    expect(wrong.sent.at(-1)!.trace.outcome).toBe('replied');
    expect(printedFor(wrong, WRONG_PATH_ORDER_7)).toEqual([NOT_FOUND]);
    expect(stillOpen(wrong)).toEqual([TASK.orderSeven, TASK.orderEight]);
  });

  it('03-01: a plain curl prints only the body', () => {
    const seven = sending(start, ADDRESS.orderSeven.id);
    expect(printedFor(seven, ADDRESS.orderSeven.id)).toEqual([ORDER_BODY.seven]);
    expect(printedFor(sending(start, ADDRESS.orderEight.id), ADDRESS.orderEight.id)).toEqual([ORDER_BODY.eight]);
  });

  it('03-01: the box shows the url in its parts and the body', () => {
    const seven = sending(start, ADDRESS.orderSeven.id);
    const box = lastBox(seven);
    expect(box['URL']).toEqual(['Esquema: http', 'Nombre: localhost', `Puerto: ${PORT.app}`, `Path: ${ORDER_PATH}`, 'Query string: id=7']);
    expect(Object.keys(box).filter((label) => /Petición|Respuesta/.test(label))).toEqual([]);
    expect(printedFor(seven, ADDRESS.orderSeven.id).join('\n')).toBe(ORDER_BODY.seven);
  });

  it('03-01: the report names laptop-lucia and says the program now answers http', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(plain(incident.report)).toMatch(new RegExp(`el programa del puerto ${PORT.app} de ${DEVICE.lucia.name} ahora contesta HTTP`));
    expect(changedNames(worldBeforeChanges(INCIDENTS, ADDRESS_FOR_EVERYTHING), startWorld(INCIDENTS, ADDRESS_FOR_EVERYTHING))).toEqual([DEVICE.lucia.name]);
  });

  it('03-01: draws laptop-lucia and no other piece', () => {
    expect(pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`).sort()).toEqual([`device:${DEVICE.lucia.name}`, `firewall:firewall ${DEVICE.lucia.name}`]);
    expect(incident.shown).toEqual(PAGE_PIECES);
  });

  it('03-01: introduces http, url, path, query string and curl, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['http', 'url', 'url-path', 'query-string', 'curl']));
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, ADDRESS_FOR_EVERYTHING))).toEqual([]);
    expect(laterNameLeaks([incident])).toEqual([]);
  });

  it('03-01: the right option is the second and the question separates the three parts of the url', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(1);
    expect(options.map(({ text }) => plain(text))).toEqual(['El path, /pedidos.', 'La query string, ?id=7.', `El puerto, ${PORT.app}.`]);
  });

  it('03-01: the takeaway says the output is the one of curl 8.21.0 of Amazon Linux 2023 and that a Mac prints errors differently', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('La salida del curl es la de la versión 8.21.0 de Amazon Linux 2023, leída de su código fuente: no se probó en una máquina.');
    expect(takeaway).toContain('Tampoco se verificó si esa imagen trae curl o curl-minimal, ni lo que cambian los parches de Amazon.');
    expect(takeaway).toContain('En un Mac, los errores se ven distintos.');
  });

  it('03-01: the takeaway says the fragment of a url never reaches the server', () => {
    expect(plain(incident.takeaway)).toMatch(FRAGMENT);
  });

  it('03-01: the takeaway says localhost is 127.0.0.1, that the game has no IPv6 and that a real curl may try ::1 first', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain(`localhost es ${IP.loopback}, la propia ${DEVICE.lucia.name}.`);
    expect(takeaway).toContain('El juego no modela IPv6, y un curl real puede probar primero ::1.');
  });

  it('03-01: the takeaway says the http message is no packet but travels in the connection that the greeting opened, and no text calls it a packet', () => {
    expect(plain(incident.takeaway)).toContain('El mensaje HTTP no es un paquete: viaja dentro de la conexión TCP que abrió el saludo de tres pasos.');
    expect(incidentTexts(incident).map(plain).filter((text) => /paquete (de )?HTTP|HTTP (es|son) (un )?paquete/i.test(text))).toEqual([]);
  });
});
