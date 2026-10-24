import { describe, expect, it } from 'vitest';
import { TERMS, describeReason, termsIn, toPlainText } from '@/copy';
import { applyAction, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, saysName, unknownTerms } from '@/levels/ladder';
import { worldBeforeChanges } from '@/levels/world';
import { ADDRESS, APPS_AS_PROCESSES, APP_ANSWERS_HTTP, APP_TAKES_ORDERS, BLOGS_NAME, DEVICE, HOSTNAME, IP, LAN_PIECES, LUCIA_RULES, LUCIA_URL, MESSAGE, NAME, OPEN_APP_TO_FLOOR, ORDER_BODY, ORDER_PATH, ORDER_URL, ORIGIN, PAGE_PIECES, PORT, REPORTS_CLOSED, REPORTS_PORT, SERVER, SHOP_SERVER, SITE_BODY, SITE_CHIP, SITE_PIECES, SITE_URL, TASK, URLS_BY_PARTS, siteMove } from '@/levels/03-the-web-inside/shared';
import { LADDER_OF_CHAPTER_3, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { failingTaskIds } from '@/game/tasks';
import { toolOutput } from '@/game/view/cards/terminal/output-card';
import { pieceCard } from '@/game/view/cards/piece-card';
import { browserView } from '@/game/view/cards/web/browser-card';
import { stripAddress, urlStrip, type UrlPartName } from '@/game/view/cards/web/url-strip';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';
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
/** Returns the sentences of a text that say that a stopped app and a firewall are the same thing: one that names a firewall and a stopped program or a refusal, says they are the same, and has no negation. */
function sentencesSayingAStoppedAppIsAFirewall(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => /firewall/i.test(sentence) && /proceso|app|rechaz|puerto cerrado/i.test(sentence) && /\b(lo mismo|es igual|son iguales|igual que|equivale)\b/i.test(sentence) && !/\bno\b/i.test(sentence));
}
/** Returns the sentences of a text that say that a server knows which site to give by the IP or by the CNAME: one that names a site and the IP or the CNAME as the way to choose it, with no negation. */
function sentencesSayingTheSiteComesFromTheIpOrTheCname(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => /sitio/i.test(sentence) && /\bpor (la )?IP\b|\bpor el (registro )?CNAME\b|\bpor el alias\b|\bla IP (de cada|decide|elige)\b/i.test(sentence) && !/\bno\b/i.test(sentence));
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

/** Sends a message to an address chip: the curl from the terminal of laptop-lucia unless it says another message or another origin. */
const sending = (session: Session, toId: string, messageId: string = MESSAGE.curl.id, fromId: string = ORIGIN.lucia.id): Session => sessionReducer(session, { type: 'sendPacket', fromId, toId, messageId });

const runOf = (session: Session) => session.sent.at(-1)!;
const outcomeOf = (session: Session) => runOf(session).trace.outcome;
const stepCodes = (session: Session) => runOf(session).trace.steps.map((step) => step.reason.code);

/** Returns the ids of the tasks of a guided incident that do not hold yet. */
const stillOpen = ({ incident, runs, history, answers }: Session): string[] => (isGuided(incident) ? failingTaskIds(incident.tasks, runs, history, answers) : []);

/** Returns the stars of the incident once it is submitted. */
const starsWhenSubmitted = (session: Session) => starsOf(sessionReducer(session, { type: 'submit' }));

/** Returns the box of the last packet sent, by the plain text of each field label, with the plain text of its lines. */
const lastBox = (session: Session): Record<string, string[]> => {
  const fields = inspect(session, session.sent.at(-1)!.pieceId)?.fields ?? [];
  return Object.fromEntries(fields.map(({ label, lines }) => [plain(label), lines.map(plain)]));
};

/** Returns the lines the output card prints for the curl of laptop-lucia (or of another origin) to this address. */
const printedFor = (session: Session, toId: string, messageId: string = MESSAGE.curl.id, fromId: string = ORIGIN.lucia.id): string[] =>
  (toolOutput(session, { from: fromId, to: toId, message: messageId })?.segments ?? []).flatMap((segment) => (segment.kind === 'line' ? [segment.text] : segment.lines));

/** Expects the map to draw laptop-lucia with its firewall and no other piece, and the incident to list just that. */
function expectOnlyLuciaDrawn(session: Session): void {
  expect(pieceViews(session).map((piece) => `${piece.kind}:${plain(piece.label)}`).sort()).toEqual([`device:${DEVICE.lucia.name}`, `firewall:firewall ${DEVICE.lucia.name}`]);
  expect(session.incident.shown).toEqual(PAGE_PIECES);
}

/** Expects every text of an incident to use only terms known at it, no name of a later subchapter and no call of an HTTP message a packet. */
function expectOnlyTermsItKnows(incident: Incident): void {
  expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, incident.id))).toEqual([]);
  expect(laterNameLeaks([incident])).toEqual([]);
  expect(incidentTexts(incident).map(plain).filter((text) => CALLS_A_MESSAGE_A_PACKET.test(text))).toEqual([]);
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
  const readingEight = (session: Session) => sending(session, ORDER_URL.eight.id);
  const bodyOfLast = (session: Session) => session.sent.at(-1)!.trace.app?.response?.body;
  const wrongOptionTexts = isGuided(incident) ? incident.explanation.filter(({ correct }) => !correct).map(({ text }) => text) : [];
  const everythingRead = (session: Session): string[] => [
    ...incidentTexts(session.incident).filter((text) => !wrongOptionTexts.includes(text)).map(plain),
    ...session.incident.introduces.map((term) => TERMS[term].definition),
  ];

  it('03-02: the get, the two posts and the two puts each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.getEight, TASK.posts, TASK.puts]);
    const read = readingEight(start);
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

  it('03-02: a get of the order 7 after a put reads the replaced order, and no task depends on it', () => {
    expect(bodyOfLast(reading(putting(start)))).toBe(ORDER_BODY.replaced);
    expect(bodyOfLast(readingEight(putting(start)))).toBe(ORDER_BODY.eight);
    expect(plain(incident.report)).toContain('Lee el pedido 8. Después manda dos POST iguales y dos PUT iguales al pedido 7.');
  });

  it('03-02: the three tasks hold in whatever order the get, the two posts and the two puts are sent, and reading the order 7 afterwards undoes none', () => {
    const sends: Record<string, (session: Session) => Session> = { get: readingEight, post: posting, put: putting };
    const permutations = (items: string[]): string[][] => (items.length <= 1 ? [items] : items.flatMap((item, place) => permutations([...items.slice(0, place), ...items.slice(place + 1)]).map((rest) => [item, ...rest])));
    const orders = [...new Set(permutations(['get', 'post', 'post', 'put', 'put']).map((order) => order.join(' ')))];
    expect(orders).toHaveLength(30);
    for (const order of orders) {
      const played = order.split(' ').reduce((session, kind) => sends[kind](session), start);
      expect(stillOpen(played), order).toEqual([]);
      expect(stillOpen(reading(played)), order).toEqual([]);
    }
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
    expectOnlyTermsItKnows(incident);
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

describe('03-03, who answers', () => {
  const WHO_ANSWERS = '03-03';
  const start = startSession(INCIDENTS, WHO_ANSWERS);
  const { incident } = start;
  const BROWSER_AT_ORDERS = { from: ORIGIN.you.id, to: LUCIA_URL.orders.id, message: MESSAGE.browser.id };
  const browsing = (session: Session) => sending(session, LUCIA_URL.orders.id, MESSAGE.browser.id, ORIGIN.you.id);
  const waiting = (session: Session) => sending(session, LUCIA_URL.orders.id, MESSAGE.curlTimeout.id, ORIGIN.you.id);
  const askingReports = (session: Session, fromId: string = ORIGIN.lucia.id) => sending(session, LUCIA_URL.reports.id, MESSAGE.curl.id, fromId);
  const opened = sessionReducer(start, OPEN_APP_TO_FLOOR);
  const luciaOf = (world: Network) => world.devices.find((device) => device.id === DEVICE.lucia.id)!;
  const inboundWhats = (session: Session) => session.world.firewalls.find((firewall) => firewall.id === LUCIA_RULES.firewallId)?.inbound.map(({ what }) => what);
  const everythingRead = [...incidentTexts(incident).map(plain), ...(isGuided(incident) ? incident.explanation.map(({ feedback }) => plain(feedback)) : []), ...incident.introduces.map((term) => TERMS[term].definition)];

  it('03-03 starts from the world 03-02 leaves: laptop-lucia keeps its database, its SSH and its orders pages, and gains the processes of her two apps', () => {
    const before = luciaOf(worldBeforeChanges(INCIDENTS, WHO_ANSWERS)).host;
    const after = luciaOf(startWorld(INCIDENTS, WHO_ANSWERS)).host;
    expect(before.processes).toBeUndefined();
    expect(after.processes).toEqual([{ id: 'orders-app', name: 'app-pedidos', running: true }, { id: 'reports-app', name: 'app-reportes', running: false }]);
    expect(after.services.map(({ port, processId }) => [port, processId])).toEqual([[PORT.app, 'orders-app'], [PORT.database, undefined], [PORT.ssh, undefined], [REPORTS_PORT, 'reports-app']]);
    expect(after.services.slice(0, 3).map((service) => ({ ...service, processId: undefined }))).toEqual(before.services.map((service) => ({ ...service, processId: undefined })));
    expect(after.services.map(({ web }) => web !== undefined)).toEqual([true, false, false, true]);
    expect(incident.changes).toEqual([APPS_AS_PROCESSES, REPORTS_CLOSED]);
    expect(networkSchema.safeParse(startWorld(INCIDENTS, WHO_ANSWERS)).error).toBeUndefined();
  });

  it('03-03: the browser reaches the page once the rule opens the port 3000 to the office', () => {
    expect(stillOpen(start)).toEqual([TASK.page, TASK.reportsRefused]);
    const page = browsing(opened);
    expect(outcomeOf(page)).toBe('replied');
    expect(browserView(page, BROWSER_AT_ORDERS)).toEqual({ address: LUCIA_URL.orders.url, shows: { kind: 'page', lines: [ORDER_BODY.seven] } });
    expect(stillOpen(page)).toEqual([TASK.reportsRefused]);
    expect(stepCodes(page)).toContain('host-accepts');
    expect(stillOpen(askingReports(page))).toEqual([]);
    expect(starsWhenSubmitted(askingReports(page))).toMatchObject({ closed: true, middle: true });
  });

  it('03-03: without the rule the request dies in the firewall, the browser gets nothing and curl times out', () => {
    const silent = browsing(start);
    expect(outcomeOf(silent)).toBe('timeout');
    expect(runOf(silent).by).toEqual([LUCIA_RULES.firewallId]);
    expect(stepCodes(silent)).toContain('firewall-in-drop');
    expect(browserView(silent, BROWSER_AT_ORDERS)?.shows).toEqual({ kind: 'error', text: 'No se pudo conectar' });
    expect(lastBox(silent)['Dónde y por qué se detuvo']?.join(' ')).toContain(`Se queda en el firewall de ${DEVICE.lucia.name}`);
    const curl = waiting(start);
    expect(outcomeOf(curl)).toBe('timeout');
    expect(printedFor(curl, LUCIA_URL.orders.id, MESSAGE.curlTimeout.id)).toEqual([]);
    expect(lastBox(curl)['curl']).toEqual(['curl esperó 3 segundos y se rindió (código 28).']);
    expect(stillOpen(silent)).toEqual([TASK.page, TASK.reportsRefused]);
  });

  it('03-03: the curl to the stopped app is refused by laptop-lucia and prints no status code', () => {
    const refused = askingReports(start);
    expect(outcomeOf(refused)).toBe('refused');
    expect(runOf(refused).by).toEqual([DEVICE.lucia.id]);
    expect(stepCodes(refused)).toContain('process-stopped');
    expect(runOf(refused).trace.app?.response).toBeUndefined();
    expect(printedFor(refused, LUCIA_URL.reports.id)).toEqual([`curl: (7) Failed to connect to ${IP.lucia}:${REPORTS_PORT} after 0 ms: Could not connect to server`]);
    expect(Object.keys(lastBox(refused)).filter((label) => /Petición|Respuesta/.test(label))).toEqual([]);
    expect(lastBox(refused)['Dónde y por qué se detuvo']?.join(' ')).toBe(`Llega, pero el proceso que escuchaba en el puerto ${REPORTS_PORT} terminó: ${DEVICE.lucia.name} lo rechaza.`);
    expect(stillOpen(refused)).toEqual([TASK.page]);
  });

  it('03-03: a refusal, a silence and a page end in three different results', () => {
    const results = [askingReports(start), browsing(start), browsing(opened)].map((session) => ({ outcome: outcomeOf(session), by: runOf(session).by, result: lastBox(session)['Resultado'] }));
    expect(results.map(({ outcome }) => outcome)).toEqual(['refused', 'timeout', 'replied']);
    expect(new Set(results.map(({ result }) => result?.join(' '))).size).toBe(3);
    expect(results.map(({ by }) => by)).toEqual([[DEVICE.lucia.id], [LUCIA_RULES.firewallId], [DEVICE.lucia.id]]);
    expect([printedFor(askingReports(start), LUCIA_URL.reports.id).length, printedFor(waiting(start), LUCIA_URL.orders.id, MESSAGE.curlTimeout.id).length, printedFor(sending(opened, LUCIA_URL.orders.id, MESSAGE.curl.id, ORIGIN.you.id), LUCIA_URL.orders.id, MESSAGE.curl.id, ORIGIN.you.id).length]).toEqual([1, 0, 1]);
  });

  it('03-03: a request from tu-laptop to the stopped app dies in the firewall: the refusal is only seen from laptop-lucia, where the firewall is not crossed', () => {
    expect(outcomeOf(askingReports(start, ORIGIN.you.id))).toBe('timeout');
    expect(outcomeOf(askingReports(opened, ORIGIN.you.id))).toBe('timeout');
    expect(outcomeOf(askingReports(opened))).toBe('refused');
  });

  it('03-03: the rule opens the port 3000 and no other', () => {
    expect(inboundWhats(opened)).toEqual([{ kind: 'tcp', fromPort: 22, toPort: 22 }, { kind: 'tcp', fromPort: PORT.app, toPort: PORT.app }]);
    const wrongTypes = LUCIA_RULES.what.filter(({ what }) => !(what.kind === 'tcp' && what.fromPort === PORT.app && what.toPort === PORT.app));
    expect(wrongTypes.map(({ id }) => id)).toEqual(['tcp-3001', 'tcp-1-1023']);
    for (const { id } of wrongTypes) {
      const placed = sessionReducer(start, { ...OPEN_APP_TO_FLOOR, whatId: id });
      expect(inboundWhats(placed)).toHaveLength(2);
      expect(outcomeOf(browsing(placed)), id).toBe('timeout');
    }
    expect(outcomeOf(askingReports(opened, ORIGIN.you.id))).toBe('timeout');
    expect(outcomeOf(sending(opened, LUCIA_URL.orders.id, MESSAGE.curl.id, ORIGIN.you.id))).toBe('replied');
  });

  it('03-03: the box of laptop-lucia lists each app with the process it listens from and says the reports one stopped', () => {
    const services = inspect(start, PIECE_ID.device(DEVICE.lucia.id))?.fields.find(({ label }) => plain(label) === 'Servicios')?.lines.map(plain);
    expect(services).toEqual(['TCP 3000 · escucha en todas las IPs · proceso app-pedidos', 'TCP 5432 · escucha en todas las IPs', 'TCP 22 · escucha en todas las IPs', 'TCP 3001 · proceso app-reportes · detenido']);
  });

  it('03-03: the report names laptop-lucia and says who stopped the process', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(plain(incident.report)).toContain('Lucía cerró la terminal donde corría su app de reportes, así que ese proceso terminó.');
    expect(changedNames(worldBeforeChanges(INCIDENTS, WHO_ANSWERS), startWorld(INCIDENTS, WHO_ANSWERS))).toEqual([DEVICE.lucia.name]);
  });

  it('03-03: no text says that a stopped app and a firewall are the same', () => {
    expect(everythingRead.flatMap(sentencesSayingAStoppedAppIsAFirewall)).toEqual([]);
    expect(['Una app cerrada y un firewall son lo mismo.', 'El firewall rechaza igual que un proceso que terminó.', 'Un rechazo es igual que el firewall.'].filter((text) => sentencesSayingAStoppedAppIsAFirewall(text).length === 0)).toEqual([]);
    expect(['Un rechazo no es lo mismo que el silencio de un firewall.', 'El firewall descarta y el proceso rechaza.']).toSatisfy((texts: string[]) => texts.every((text) => sentencesSayingAStoppedAppIsAFirewall(text).length === 0));
  });

  it('03-03: the takeaway says that a rule names tcp and a port, not http, and that a process is not a port', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('Una regla del firewall nombra TCP y un puerto, no «HTTP»: el puerto no decide el protocolo.');
    expect(takeaway).toContain('Un proceso no es un puerto: uno puede escuchar en varios.');
    expect(LUCIA_RULES.what.map(({ label }) => plain(label))).toEqual(['TCP · 3000', 'TCP · 3001', 'TCP · 1-1023']);
  });

  it('03-03: the right option is the first and the question separates a refusal from a silence and from an error of a web server', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(0);
    expect(plain(options[0].text)).toBe(`No había ningún proceso escuchando en el puerto ${REPORTS_PORT}, y TCP rechazó la conexión antes de que hubiera HTTP.`);
    expect(plain(options[1].text)).toBe('Porque el firewall descartó el paquete.');
    expect(plain(options[2].text)).toBe('Porque el servidor web devolvió un error.');
    expect(plain(options[1].feedback)).toContain('que no es lo mismo que el silencio');
  });

  it('03-03: draws tu-laptop and laptop-lucia', () => {
    expect(pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`).sort()).toEqual([`device:${DEVICE.you.name}`, `device:${DEVICE.lucia.name}`, `firewall:firewall ${DEVICE.you.name}`, `firewall:firewall ${DEVICE.lucia.name}`].sort());
    expect(incident.shown).toEqual(LAN_PIECES);
  });

  it('03-03: tu-laptop and laptop-lucia both open a Terminal and a Navegador tab', () => {
    for (const id of [DEVICE.you.id, DEVICE.lucia.id]) expect(pieceCard(start, PIECE_ID.device(id))?.tabs.map((tab) => tab.id).slice(0, 2), id).toEqual(['terminal', 'browser']);
    expect(pieceCard(start, PIECE_ID.device(DEVICE.lucia.id))?.tabs.map((tab) => tab.id)).toEqual(['terminal', 'browser', 'routes']);
  });

  it('03-03: introduces process, web server and browser, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['process', 'web-server', 'browser']));
    expectOnlyTermsItKnows(incident);
  });
});

describe('03-04, one server and many sites', () => {
  const MANY_SITES = '03-04';
  const start = startSession(INCIDENTS, MANY_SITES);
  const { incident } = start;
  const asking = (session: Session, urlId: string) => sending(session, urlId, MESSAGE.curlInclude.id, ORIGIN.you.id);
  const withBlog = sessionReducer(start, siteMove(SITE_CHIP.name.blog, SITE_CHIP.serves.blog));
  const bodyOfLast = (session: Session) => runOf(session).trace.app?.response?.body;
  const appSentences = (session: Session) => runOf(session).trace.steps.filter(({ stage }) => stage === 'app').map(({ reason }) => plain(describeReason(reason, session.world, session.known)));
  const sitesOfServer = (session: Session) => session.world.actors.flatMap((actor) => (actor.kind === 'server' && actor.id === SERVER.fresh.id ? actor.services ?? [] : [])).find(({ port }) => port === PORT.web)?.web?.sites.map(({ names }) => names);
  const wrongOptionTexts = isGuided(incident) ? incident.explanation.filter(({ correct }) => !correct).map(({ text }) => text) : [];
  const everythingRead = [
    ...incidentTexts(incident).filter((text) => !wrongOptionTexts.includes(text)).map(plain),
    ...incident.introduces.map((term) => TERMS[term].definition),
  ];

  it('03-04 starts from the world 03-03 leaves: servidor-nuevo gets a web server on port 80 with the shop as its only and default site, and keeps its port 443', () => {
    const servicesOf = (world: Network) => world.actors.flatMap((actor) => (actor.kind === 'server' && actor.id === SERVER.fresh.id ? actor.services ?? [] : []));
    const before = servicesOf(worldBeforeChanges(INCIDENTS, MANY_SITES));
    const after = servicesOf(startWorld(INCIDENTS, MANY_SITES));
    expect(before.map((service) => service.web)).toEqual([undefined, undefined]);
    expect(after.map(({ port, web }) => [port, web?.sites.map(({ names }) => names)])).toEqual([[PORT.web, [[HOSTNAME.www]]], [PORT.secureWeb, undefined]]);
    expect(after[0].web?.defaultSiteId).toBe(after[0].web?.sites[0].id);
    expect(incident.changes).toEqual([SHOP_SERVER]);
    expect(networkSchema.safeParse(startWorld(INCIDENTS, MANY_SITES)).error).toBeUndefined();
  });

  it('03-04: adding blog gives blog its own site and www keeps the shop', () => {
    expect(stillOpen(start)).toEqual([TASK.shopByName, TASK.blogByName, TASK.shopByIp]);
    expect(bodyOfLast(asking(start, SITE_URL.blog.id))).toBe(SITE_BODY.shop);
    expect(sitesOfServer(start)).toEqual([[HOSTNAME.www]]);
    expect(sitesOfServer(withBlog)).toEqual([[HOSTNAME.www], [HOSTNAME.blog]]);
    expect(bodyOfLast(asking(withBlog, SITE_URL.blog.id))).toBe(SITE_BODY.blog);
    expect(bodyOfLast(asking(withBlog, SITE_URL.www.id))).toBe(SITE_BODY.shop);
    const done = asking(asking(asking(withBlog, SITE_URL.www.id), SITE_URL.blog.id), SITE_URL.ip.id);
    expect(stillOpen(done)).toEqual([]);
    expect(starsWhenSubmitted(done)).toMatchObject({ closed: true, middle: true });
    expect(stillOpen(asking(asking(asking(start, SITE_URL.www.id), SITE_URL.blog.id), SITE_URL.ip.id))).toEqual([TASK.blogByName]);
  });

  it('03-04: a site with the wrong name, or one that serves the shop, does not give blog its page', () => {
    const wrongName = sessionReducer(start, siteMove(SITE_CHIP.name.blogs, SITE_CHIP.serves.blog));
    expect(sitesOfServer(wrongName)).toEqual([[HOSTNAME.www], [BLOGS_NAME]]);
    expect(bodyOfLast(asking(wrongName, SITE_URL.blog.id))).toBe(SITE_BODY.shop);
    const servingTheShop = sessionReducer(start, siteMove(SITE_CHIP.name.blog, SITE_CHIP.serves.shop));
    expect(bodyOfLast(asking(servingTheShop, SITE_URL.blog.id))).toBe(SITE_BODY.shop);
    expect(stillOpen(asking(servingTheShop, SITE_URL.blog.id))).toContain(TASK.blogByName);
  });

  it('03-04: the ip alone gets the default site', () => {
    for (const session of [start, withBlog]) {
      const byIp = asking(session, SITE_URL.ip.id);
      expect(bodyOfLast(byIp)).toBe(SITE_BODY.shop);
      expect(stepCodes(byIp)).toContain('web-default-site');
      expect(lastBox(byIp)['Petición HTTP']).toContain(`Host: ${IP.freshServer}`);
    }
  });

  it('03-04: before the site exists blog gets the shop because its host has no site', () => {
    const before = asking(start, SITE_URL.blog.id);
    expect(bodyOfLast(before)).toBe(SITE_BODY.shop);
    expect(stepCodes(before)).toContain('web-default-site');
    expect(stepCodes(before)).not.toContain('web-site-chosen');
    expect(appSentences(before)[0]).toBe(`La cabecera Host de la petición indica ${HOSTNAME.blog}. ${SERVER.fresh.name} no tiene un sitio con ese nombre y contesta con su sitio por defecto.`);
    const after = asking(withBlog, SITE_URL.blog.id);
    expect(stepCodes(after)).toContain('web-site-chosen');
    expect(appSentences(after)[0]).toBe(`La cabecera Host de la petición indica ${HOSTNAME.blog}. ${SERVER.fresh.name} tiene un sitio con ese nombre y contesta con él.`);
  });

  it('03-04: the box shows the Host header of each request', () => {
    for (const [chip, host] of [[SITE_URL.www, HOSTNAME.www], [SITE_URL.blog, HOSTNAME.blog], [SITE_URL.ip, IP.freshServer]] as const) {
      expect(lastBox(asking(start, chip.id))['Petición HTTP'], chip.id).toEqual(['GET / HTTP/1.1', `Host: ${host}`, 'User-Agent: curl/8.21.0', 'Accept: */*']);
    }
  });

  it('03-04: a url without a port goes to 80', () => {
    const box = lastBox(asking(start, SITE_URL.www.id));
    expect(box['URL']).toContain('Puerto: 80 · la URL no lo escribe: http usa su puerto por defecto, el 80');
    expect(box['Encabezado de ida (en internet)'].join(' ')).toContain(`${IP.freshServer}:${PORT.web}`);
  });

  it('03-04: curl -i prints the status line, the headers as the server sent them, a blank line and the body', () => {
    const printed = printedFor(asking(start, SITE_URL.www.id), SITE_URL.www.id, MESSAGE.curlInclude.id, ORIGIN.you.id);
    expect(printed).toEqual(['HTTP/1.1 200 OK', 'Content-Type: text/plain; charset=utf-8', `Content-Length: ${new TextEncoder().encode(SITE_BODY.shop).length}`, '', SITE_BODY.shop]);
  });

  it('03-04: the browser shows the same page as the curl for each url', () => {
    const opening = (session: Session, urlId: string) => browserView(sending(session, urlId, MESSAGE.browser.id, ORIGIN.you.id), { from: ORIGIN.you.id, to: urlId, message: MESSAGE.browser.id })?.shows;
    expect(opening(start, SITE_URL.blog.id)).toEqual({ kind: 'page', lines: [SITE_BODY.shop] });
    expect(opening(withBlog, SITE_URL.blog.id)).toEqual({ kind: 'page', lines: [SITE_BODY.blog] });
  });

  it('03-04: no text says the server knows the site by the ip or by the cname', () => {
    expect(everythingRead.flatMap(sentencesSayingTheSiteComesFromTheIpOrTheCname)).toEqual([]);
    expect(['El servidor elige el sitio por la IP.', 'El servidor sabe el sitio por el registro CNAME.', 'Cada sitio se reconoce por el alias.'].filter((text) => sentencesSayingTheSiteComesFromTheIpOrTheCname(text).length === 0)).toEqual([]);
    expect(['El servidor no elige el sitio por la IP.', 'El sitio sale de la cabecera Host.']).toSatisfy((texts: string[]) => texts.every((text) => sentencesSayingTheSiteComesFromTheIpOrTheCname(text).length === 0));
    expect(wrongOptionTexts.map(plain).filter((text) => sentencesSayingTheSiteComesFromTheIpOrTheCname(`El sitio sale ${text}`).length > 0)).toEqual(['Por la IP, que es distinta para cada sitio.', 'Por el registro CNAME.']);
  });

  it('03-04: the report names servidor-nuevo', () => {
    expect(incident.report).toContain(NAME.freshServer);
    expect(plain(incident.report)).toContain(`Lucía instaló un servidor web en ${SERVER.fresh.name} con un solo sitio: la tienda.`);
    expect(changedNames(worldBeforeChanges(INCIDENTS, MANY_SITES), startWorld(INCIDENTS, MANY_SITES))).toEqual([SERVER.fresh.name]);
  });

  it('03-04: the right option is the second and the question separates the Host header from the IP and from the CNAME', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(1);
    expect(plain((isGuided(incident) && incident.question) || '')).toBe(`${HOSTNAME.blog} es un alias de ${HOSTNAME.www}. ¿Cómo sabe ${SERVER.fresh.name} qué sitio dar?`);
    expect(options.map(({ text }) => plain(text))).toEqual(['Por la IP, que es distinta para cada sitio.', 'Por la cabecera Host, que lleva el nombre escrito en la URL.', 'Por el registro CNAME.']);
    expect(plain(options[0].feedback)).toContain(`La IP es la misma para los dos nombres: ${IP.freshServer}.`);
    expect(plain(options[2].feedback)).toContain('El servidor web de servidor-nuevo no ve el DNS');
  });

  it('03-04: the takeaway says that Host carries the name of the url as written, that a server with many sites picks one by it and that a name with no site gets the default site', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('La cabecera Host de la petición lleva el nombre de la URL tal como se escribió');
    expect(takeaway).toContain('Un servidor web con varios sitios usa esa cabecera para elegir uno');
    expect(takeaway).toContain(`${SERVER.fresh.name} da su sitio por defecto, la tienda.`);
    expect(takeaway).toContain('En HTTP/1.1 la cabecera Host es obligatoria.');
  });

  it('03-04: draws tu-laptop, servidor-dns, router-oficina and servidor-nuevo', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    expect(drawn.filter((piece) => piece.startsWith('device:'))).toEqual([DEVICE.you.name, 'servidor-dns', SERVER.fresh.name].map((name) => `device:${name}`));
    expect(drawn).toContain('edge:router-oficina');
    expect(incident.shown).toEqual(SITE_PIECES);
  });

  it('03-04: introduces http header, Host header and virtual host, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['http-header', 'host-header', 'virtual-host']));
    expectOnlyTermsItKnows(incident);
  });
});
