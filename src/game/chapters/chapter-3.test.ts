import { describe, expect, it } from 'vitest';
import { TERMS, termsIn, toPlainText } from '@/copy';
import { applyAction, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, saysName, unknownTerms } from '@/levels/ladder';
import { worldBeforeChanges } from '@/levels/world';
import { ADDRESS, APP_ANSWERS_HTTP, APP_TAKES_ORDERS, DEVICE, IP, MESSAGE, NAME, ORDER_BODY, ORDER_PATH, ORDER_URL, ORIGIN, PAGE_PIECES, PORT, TASK, URLS_BY_PARTS } from '@/levels/03-the-web-inside/shared';
import { LADDER_OF_CHAPTER_3, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { failingTaskIds } from '@/game/tasks';
import { toolOutput } from '@/game/view/cards/terminal/output-card';
import { stripAddress, urlStrip, type UrlPartName } from '@/game/view/cards/web/url-strip';
import { inspect } from '@/game/view/inspection';
import { pieceViews } from '@/game/view/pieces';

const CHAPTER = 3;
const LAST_INCIDENT_OF_CHAPTER_2 = '02-14';

const CALLS_A_MESSAGE_A_PACKET = /paquete (de )?HTTP|HTTP (es|son) (un )?paquete|(petición|respuesta) HTTP (es|son) (un )?paquete/i;
const SAYS_HTTP_PREVENTS_DUPLICATES = /\bHTTP\s+(evita|previene|impide|protege)\b/i;

const sorted = (values: string[]): string[] => [...values].sort();

/** Returns the sentences of a text that say that idempotent means the same answer: one that names the term, a same or equal answer or result, and no negation. */
function sentencesSayingIdempotentIsTheSameAnswer(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => /idempotent/i.test(sentence) && /\b(misma|mismo|igual)\b/i.test(sentence) && /respuesta|resultado/i.test(sentence) && !/\bno\b/i.test(sentence));
}
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

/** Expects the map to draw laptop-lucia with its firewall and no other piece, and the incident to list just that. */
function expectOnlyLuciaDrawn(session: Session): void {
  expect(pieceViews(session).map((piece) => `${piece.kind}:${plain(piece.label)}`).sort()).toEqual([`device:${DEVICE.lucia.name}`, `firewall:firewall ${DEVICE.lucia.name}`]);
  expect(session.incident.shown).toEqual(PAGE_PIECES);
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
    expectOnlyLuciaDrawn(start);
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
    expect(incidentTexts(incident).map(plain).filter((text) => CALLS_A_MESSAGE_A_PACKET.test(text))).toEqual([]);
  });
});

describe('03-02, ask and answer', () => {
  const ASK_AND_ANSWER = '03-02';
  const start = startSession(INCIDENTS, ASK_AND_ANSWER);
  const { incident } = start;
  const posting = (session: Session) => sending(session, ORDER_URL.all.id, MESSAGE.curlPost.id);
  const putting = (session: Session) => sending(session, ORDER_URL.seven.id, MESSAGE.curlPut.id);
  const reading = (session: Session) => sending(session, ORDER_URL.seven.id);
  const bodyOfLast = (session: Session) => session.sent.at(-1)!.trace.app?.response?.body;
  const wrongOptionTexts = isGuided(incident) ? incident.explanation.filter(({ correct }) => !correct).map(({ text }) => text) : [];
  const everythingRead = (session: Session): string[] => [
    ...incidentTexts(session.incident).filter((text) => !wrongOptionTexts.includes(text)).map(plain),
    ...session.incident.introduces.map((term) => TERMS[term].definition),
  ];

  it('03-02: the get, the two posts and the two puts each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.getSeven, TASK.posts, TASK.puts]);
    const read = reading(start);
    expect(stillOpen(read)).toEqual([TASK.posts, TASK.puts]);
    const posted = posting(posting(read));
    expect(stillOpen(posted)).toEqual([TASK.puts]);
    const done = putting(putting(posted));
    expect(stillOpen(done)).toEqual([]);
    expect(starsWhenSubmitted(done)).toMatchObject({ closed: true, middle: true });
  });

  it('03-02: the task of the posts holds only after the second post', () => {
    const once = posting(start);
    expect(stillOpen(once)).toContain(TASK.posts);
    const twice = posting(once);
    expect(stillOpen(twice)).not.toContain(TASK.posts);
    expect(stillOpen(posting(twice))).not.toContain(TASK.posts);
    expect(stillOpen(putting(putting(start)))).toContain(TASK.posts);
  });

  it('03-02: the second post creates another order and the second put leaves the same', () => {
    const first = posting(start);
    expect(bodyOfLast(first)).toBe(ORDER_BODY.nine);
    const second = posting(first);
    expect(bodyOfLast(second)).toBe(ORDER_BODY.ten);
    expect(bodyOfLast(sending(second, ORDER_URL.nine.id))).toBe(ORDER_BODY.nine);
    const firstPut = putting(second);
    const secondPut = putting(firstPut);
    expect(bodyOfLast(firstPut)).toBe(ORDER_BODY.replaced);
    expect(bodyOfLast(secondPut)).toBe(bodyOfLast(firstPut));
    expect(bodyOfLast(reading(secondPut))).toBe(ORDER_BODY.replaced);
    expect(bodyOfLast(sending(secondPut, ORDER_URL.nine.id))).toBe(ORDER_BODY.nine);
  });

  it('03-02: the order 7 is the one a put replaces, so the report asks to read it first', () => {
    expect(bodyOfLast(reading(putting(start)))).toBe(ORDER_BODY.replaced);
    expect(plain(incident.report)).toContain('Primero lee el pedido 7. Después manda dos POST iguales y dos PUT iguales.');
  });

  it('03-02: each curl asks with the method its options say', () => {
    const startLine = (session: Session) => lastBox(session)['Petición HTTP'][0];
    expect(startLine(reading(start))).toBe('GET /pedidos?id=7 HTTP/1.1');
    expect(startLine(posting(start))).toBe('POST /pedidos HTTP/1.1');
    expect(startLine(putting(start))).toBe('PUT /pedidos?id=7 HTTP/1.1');
  });

  it('03-02: the box shows the request and the response behind their terms and names no status code', () => {
    const sentAll = putting(posting(reading(start)));
    const fields = inspect(sentAll, sentAll.sent.at(-1)!.pieceId)?.fields ?? [];
    const labelsWith = (term: string) => fields.filter(({ label }) => termsIn(label).includes(term as never)).map(({ label }) => plain(label));
    expect(labelsWith('http-request')).toEqual(['Petición HTTP']);
    expect(labelsWith('http-response')).toEqual(['Respuesta HTTP']);
    const read = fields.flatMap(({ label, lines, notes = [] }) => [label, ...lines, ...notes]);
    expect(unknownTerms(read, knownTerms(INCIDENTS, ASK_AND_ANSWER))).toEqual([]);
    expect(read.map(plain).filter((text) => /código de estado|status code|status-code/i.test(text))).toEqual([]);
  });

  it('03-02: the report names laptop-lucia', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(plain(incident.report)).toContain(`el programa del puerto ${PORT.app} de ${DEVICE.lucia.name} también crea pedidos y los cambia`);
    expect(changedNames(worldBeforeChanges(INCIDENTS, ASK_AND_ANSWER), startWorld(INCIDENTS, ASK_AND_ANSWER))).toEqual([DEVICE.lucia.name]);
    expect(incident.changes).toEqual([APP_TAKES_ORDERS]);
  });

  it('03-02: draws laptop-lucia and no other piece', () => {
    expectOnlyLuciaDrawn(start);
  });

  it('03-02: introduces http request, http response, http method and idempotent, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['http-request', 'http-response', 'http-method', 'idempotent']));
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, ASK_AND_ANSWER))).toEqual([]);
    expect(laterNameLeaks([incident])).toEqual([]);
    expect(incidentTexts(incident).map(plain).filter((text) => CALLS_A_MESSAGE_A_PACKET.test(text))).toEqual([]);
  });

  it('03-02: no text says idempotent means the same answer', () => {
    expect(everythingRead(start).flatMap(sentencesSayingIdempotentIsTheSameAnswer)).toEqual([]);
    expect(['Idempotente significa que la respuesta es la misma.', 'Una operación idempotente da el mismo resultado.', 'Idempotente: la respuesta es igual cada vez.'].filter((text) => sentencesSayingIdempotentIsTheSameAnswer(text).length === 0)).toEqual([]);
    expect(['Idempotente habla del efecto, no de la respuesta.', 'Sí, la respuesta será la misma.']).toSatisfy((texts: string[]) => texts.every((text) => sentencesSayingIdempotentIsTheSameAnswer(text).length === 0));
  });

  it('03-02: no text says http prevents duplicates', () => {
    expect(everythingRead(start).filter((text) => SAYS_HTTP_PREVENTS_DUPLICATES.test(text))).toEqual([]);
    expect(['HTTP evita los duplicados.', 'El HTTP previene repetidos.'].filter((text) => !SAYS_HTTP_PREVENTS_DUPLICATES.test(text))).toEqual([]);
    expect(SAYS_HTTP_PREVENTS_DUPLICATES.test('HTTP no evita nada.')).toBe(false);
    expect(wrongOptionTexts.map(plain).filter((text) => SAYS_HTTP_PREVENTS_DUPLICATES.test(text))).toEqual(['Sí, HTTP evita los duplicados.']);
  });

  it('03-02: the question separates the effect of repeating from the answer', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(2);
    expect(plain(options[0].feedback)).toContain('Idempotente habla del efecto en el servidor, no de la respuesta.');
    expect(plain(options[1].feedback)).toContain('HTTP no evita nada');
    expect(plain(options[2].text)).toBe('No: un POST no es idempotente y repetirlo puede crear otro pedido.');
    expect(plain(options[2].feedback)).toContain('el segundo POST creó el pedido 10. El segundo PUT, en cambio, dejó el pedido 7 igual.');
  });

  it('03-02: the takeaway says that idempotent speaks of the effect and not of the answer, that it is not the same as safe and that a client does not repeat a post by itself', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('GET, PUT y DELETE son idempotentes: repetirlos deja el mismo efecto que hacerlos una vez. POST no lo es:');
    expect(takeaway).toContain('Idempotente habla del efecto, no de la respuesta: un segundo DELETE puede contestar 404 y dejar el servidor como lo dejó el primero.');
    expect(takeaway).toContain('Tampoco quiere decir seguro: un PUT cambia el pedido y es idempotente.');
    expect(takeaway).toContain('un cliente no debe repetir solo una petición que no es idempotente, como un POST.');
  });
});
