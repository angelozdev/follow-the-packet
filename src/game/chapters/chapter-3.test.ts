import { describe, expect, it } from 'vitest';
import { SITES_TEXT, TERMS, describeReason, termsIn, toPlainText } from '@/copy';
import { applyAction, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, saysName, unknownTerms } from '@/levels/ladder';
import { worldBeforeChanges } from '@/levels/world';
import { ADDRESS, ADMIN_BODY, ADMIN_URL, APPS_AS_PROCESSES, APP_ANSWERS_HTTP, APP_CHECKS_THE_ID, APP_HAS_USERS, APP_TAKES_ORDERS, BLOGS_NAME, DEVICE, HOSTNAME, IP, LAN_PIECES, LUCIA_RULES, LUCIA_URL, MESSAGE, NAME, OPEN_APP_TO_FLOOR, ORDER_BODY, ORDER_PATH, ORDER_URL, ORIGIN, PAGE_PIECES, PORT, REPORTS_CLOSED, REPORTS_PORT, SERVER, SHOP_SERVER, SITE_BODY, SITE_CHIP, SITE_PIECES, SITES_TABLE, SITE_URL, STATUS_URL, TASK, URLS_BY_PARTS, USER, siteMove } from '@/levels/03-the-web-inside/shared';
import { LADDER_OF_CHAPTER_3, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { failingTaskIds } from '@/game/tasks';
import { toolOutput } from '@/game/view/cards/terminal/output-card';
import { pieceCard } from '@/game/view/cards/piece-card';
import { browserCard, browserView } from '@/game/view/cards/web/browser-card';
import { sitesCard } from '@/game/view/cards/web/sites-card';
import { stripAddress, urlStrip, type UrlPartName } from '@/game/view/cards/web/url-strip';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceViews } from '@/game/view/pieces';

const CHAPTER = 3;
const LAST_INCIDENT_OF_CHAPTER_2 = '02-14';
const INCIDENT_BEFORE_HOW_DID_IT_GO = '03-04';
const INCIDENT_BEFORE_WHO_YOU_ARE = '03-05';

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

/** Returns the sentences of a text that say a 4xx is always the fault of the client: one that says always, and the fault or the error of the client, with no negation. */
function sentencesSayingA4xxIsAlwaysTheFaultOfTheClient(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => /\bsiempre\b/i.test(sentence) && /(culpa|error) del cliente|culpa de quien/i.test(sentence) && !/\bno\b/i.test(sentence));
}
/** Returns the sentences of a text that say a 200 means the business went well: one that names the code or a success and the business or a good result, with no negation. */
function sentencesSayingA200MeansTheBusinessWentWell(text: string): string[] {
  return text.split(/(?<=\.)\s+/).filter((sentence) => /\b200\b|\bOK\b|se cumplió/.test(sentence) && /negocio|salió bien|todo bien|éxito/i.test(sentence) && !/\bno\b/i.test(sentence));
}

/** Returns the texts of the options of the question of an incident that are not the right one. */
const wrongOptionsOf = (incident: Incident): string[] => (isGuided(incident) ? incident.explanation.filter(({ correct }) => !correct).map(({ text }) => text) : []);

/** Returns, in plain words, the texts of an incident the player reads, except its wrong options, and the definitions of the terms it introduces. */
const textsReadApartFromTheWrongOptions = (incident: Incident): string[] => [
  ...incidentTexts(incident).filter((text) => !wrongOptionsOf(incident).includes(text)).map(plain),
  ...incident.introduces.map((term) => TERMS[term].definition),
];

/** Returns the sites of every web service in the world: those of the programs of its devices and of its servers of the internet. */
const sitesOf = (world: Network) => [...world.devices.flatMap((device) => device.host.services), ...world.actors.flatMap((actor) => (actor.kind === 'server' ? actor.services ?? [] : []))].flatMap(({ web }) => web?.sites ?? []);

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

describe('the options of the questions of chapter 3', () => {
  const MAX_LENGTH_RATIO = 1.4;
  const questions = builtOfChapter3().filter(isGuided).map((incident) => {
    const lengths = incident.explanation.map(({ text }) => plain(text).length);
    return { id: incident.id, lengths, right: lengths[incident.explanation.findIndex(({ correct }) => correct)] };
  });

  it('are close in length and the right one is never the longest, so its length gives nothing away', () => {
    expect(questions.length).toBeGreaterThan(0);
    for (const { id, lengths, right } of questions) {
      expect(Math.max(...lengths) / Math.min(...lengths), id).toBeLessThanOrEqual(MAX_LENGTH_RATIO);
      expect(right, id).toBeLessThan(Math.max(...lengths));
    }
  });

  it('the right one is the shortest in at most a third of the questions', () => {
    const shortest = questions.filter(({ lengths, right }) => right === Math.min(...lengths));
    expect(shortest.length * 3).toBeLessThanOrEqual(questions.length);
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
  const NOT_FOUND = 'No hay nada en esa URL.';
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

  it('03-01: the report sends the player to the box for the parts of the url and to the output of curl for what the app answered', () => {
    expect(plain(incident.report)).toContain('En la caja lee qué dice cada parte de la URL, y en la salida de curl, qué contestó la app.');
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
    expect(options.map(({ text }) => plain(text))).toEqual(['El path, que es /pedidos, en la URL.', 'La query string, que es ?id=7.', `El puerto, que es el ${PORT.app}, en la URL.`]);
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
    expect(takeaway).toContain('El juego no modela IPv6, la versión 6 de las direcciones IP: un curl real puede probar primero ::1, que es el loopback de IPv6.');
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

  it('03-02: the task of the posts counts orders and not their numbers, and no text of the incident names the order 9 or the order 10', () => {
    const task = (isGuided(incident) ? incident.tasks : []).find(({ id }) => id === TASK.posts)!;
    expect(plain(task.text)).toBe('Que dos POST iguales a la URL sin ?id creen dos pedidos nuevos.');
    expect(everythingRead(start).filter((text) => /pedido (9|10)\b/.test(text))).toEqual([]);
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
    expect(plain(incident.report)).toContain('Lee el pedido 8. Después manda dos POST iguales a la lista de pedidos y dos PUT iguales al pedido 7.');
  });

  it('03-02: the three tasks hold in each of the 30 orders in which the get of the order 8, the two posts and the two puts of the order 7 can be sent, and reading the order 7 afterwards undoes none', () => {
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

  it('03-02: the report says that the app of laptop-lucia reads the query string as data and not as part of the path, so a post to ?id=7 creates an order', () => {
    expect(plain(incident.report)).toContain(`La app de ${DEVICE.lucia.name} lee la query string como un dato, no como parte del path: un POST a la URL con ?id=7 llega al mismo path, /pedidos, y crea un pedido nuevo.`);
    expect(bodyOfLast(sending(start, ORDER_URL.seven.id, MESSAGE.curlPost.id))).toBe(ORDER_BODY.nine);
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
    expect(wrongOptionTexts.map(plain).filter((text) => SAYS_HTTP_PREVENTS_DUPLICATES.test(text))).toEqual(['Sí, porque HTTP evita los duplicados al repetir una petición.']);
  });

  it('03-02: the question separates the effect of repeating from the answer', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(2);
    expect(plain(options[0].feedback)).toContain('Idempotente habla del efecto en el servidor, no de la respuesta.');
    expect(plain(options[1].feedback)).toContain('HTTP no evita nada');
    expect(plain(options[2].text)).toBe('No: un POST no es idempotente y repetirlo puede crear otro pedido.');
    expect(plain(options[2].feedback)).toContain('el segundo POST creó otro pedido. El segundo PUT, en cambio, dejó el pedido 7 como lo dejó el primero.');
  });

  it('03-02: the takeaway says that idempotent speaks of the effect and not of the answer, that it is not the same as safe and that a client does not repeat a post by itself', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('GET, PUT y DELETE son idempotentes: repetirlos deja el mismo efecto que hacerlos una vez. POST no lo es:');
    expect(takeaway).toContain('Idempotente habla del efecto, no de la respuesta: un segundo DELETE puede contestar que el pedido ya no existe y dejar el servidor como lo dejó el primero.');
    expect(takeaway).toContain('Tampoco quiere decir que no cambie nada: un PUT cambia el pedido y es idempotente.');
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
    expect(services).toEqual(['TCP 3000 · escucha en todas las IPs · proceso app-pedidos', 'TCP 5432 · escucha en todas las IPs', 'TCP 22 · escucha en todas las IPs', 'TCP 3001 · proceso app-reportes · terminó']);
  });

  it('03-03: the report names laptop-lucia and says who stopped the process', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(plain(incident.report)).toContain('Lucía cerró la terminal donde corría su app de reportes, así que ese proceso terminó.');
    expect(changedNames(worldBeforeChanges(INCIDENTS, WHO_ANSWERS), startWorld(INCIDENTS, WHO_ANSWERS))).toEqual([DEVICE.lucia.name]);
  });

  it('03-03: the report says what --connect-timeout 3 does and why the curl to the reports app leaves from laptop-lucia', () => {
    const report = plain(incident.report);
    expect(report).toContain('Con --connect-timeout 3, curl se rinde si en 3 segundos no logra conectar.');
    expect(report).toContain(`Desde ${DEVICE.lucia.name}, pídele con curl a la app de reportes: como el paquete va a su propia IP, no cruza su firewall.`);
  });

  it('03-03: no text of the incident speaks of a código, which curl printed as (7) and (28) and an http response never had', () => {
    const feedbacks = isGuided(incident) ? incident.explanation.map(({ feedback }) => plain(feedback)) : [];
    expect([...incidentTexts(incident).map(plain), ...feedbacks].filter((text) => /código/i.test(text))).toEqual([]);
    expect(plain((isGuided(incident) && incident.question) || '')).toBe('Con la app de reportes cerrada, ¿por qué curl no recibió ninguna respuesta HTTP?');
  });

  it('03-03: the takeaway keeps the refusal of laptop-lucia apart from the silence the sender got when the firewall dropped the request', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain(`Un rechazo: ${DEVICE.lucia.name} contestó con un RST a quien pedía la app de reportes, antes de que hubiera HTTP.`);
    expect(takeaway).toContain(`Un silencio: el firewall de ${DEVICE.lucia.name} descartó la petición de ${DEVICE.you.name} y ${DEVICE.you.name} no recibió nada, hasta que agregaste la regla.`);
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
    expect(plain(options[1].text)).toBe(`Porque el firewall de ${DEVICE.lucia.name} descartó el paquete, y curl se quedó esperando una respuesta que nunca llegó.`);
    expect(plain(options[2].text)).toBe('Porque el servidor web de la app de reportes devolvió un error HTTP, y curl lo mostró en la terminal.');
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

  it('03-04: the card of the sites says in words what each site serves, the shop at the start and the blog once it is added', () => {
    const rowsOf = (session: Session) => sitesCard(session, PIECE_ID.actor(SERVER.fresh.id))?.rows.map(({ cells }) => cells.map(({ text }) => plain(text)));
    const shopRow = [SITES_TEXT.byDefault(HOSTNAME.www), SITE_BODY.shop];
    expect(rowsOf(start)).toEqual([shopRow]);
    expect(rowsOf(withBlog)).toEqual([shopRow, [HOSTNAME.blog, SITE_BODY.blog]]);
  });

  it('03-04: a site with the wrong name does not give blog its page', () => {
    const wrongName = sessionReducer(start, siteMove(SITE_CHIP.name.blogs, SITE_CHIP.serves.blog));
    expect(sitesOfServer(wrongName)).toEqual([[HOSTNAME.www], [BLOGS_NAME]]);
    expect(bodyOfLast(asking(wrongName, SITE_URL.blog.id))).toBe(SITE_BODY.shop);
    expect(stillOpen(asking(wrongName, SITE_URL.blog.id))).toContain(TASK.blogByName);
  });

  it('03-04: no chip the card offers can make the task of blog unreachable', () => {
    const { trays } = SITES_TABLE;
    const rightSite = siteMove(SITE_CHIP.name.blog, SITE_CHIP.serves.blog);
    const placements = 'serves' in trays ? trays.name.flatMap((nameChip) => trays.serves.map((servesChip) => siteMove(nameChip.id, servesChip.id))) : [];
    expect(placements.length).toBeGreaterThan(1);
    for (const placement of placements) {
      const fixed = sessionReducer(sessionReducer(start, placement), rightSite);
      expect(bodyOfLast(asking(fixed, SITE_URL.blog.id)), JSON.stringify(placement)).toBe(SITE_BODY.blog);
      expect(stillOpen(asking(asking(asking(fixed, SITE_URL.www.id), SITE_URL.blog.id), SITE_URL.ip.id)), JSON.stringify(placement)).toEqual([]);
    }
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
    expect(wrongOptionTexts.map(plain).filter((text) => sentencesSayingTheSiteComesFromTheIpOrTheCname(`El sitio sale ${text}`).length > 0)).toEqual(['Por la IP, que es distinta para cada nombre y para cada sitio.', 'Por el registro CNAME, que el servidor web lee del DNS.']);
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
    expect(options.map(({ text }) => plain(text))).toEqual(['Por la IP, que es distinta para cada nombre y para cada sitio.', 'Por la cabecera Host, que lleva el nombre escrito en la URL.', 'Por el registro CNAME, que el servidor web lee del DNS.']);
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

  it('03-04: the report says what curl -i shows before it asks for it', () => {
    const report = plain(incident.report);
    expect(report).toContain('Con -i, curl muestra la respuesta entera, no solo su cuerpo. Pide con curl -i y con el navegador');
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

describe('the apps of chapter 3 and their 404', () => {
  it('the body of a 404 says there is nothing at that URL', () => {
    const sites = builtOfChapter3().flatMap(({ id }) => sitesOf(startWorld(INCIDENTS, id)));
    expect(sites.length).toBeGreaterThan(0);
    expect(new Set(sites.map(({ notFoundBody }) => notFoundBody))).toEqual(new Set(['No hay nada en esa URL.']));
  });
});

describe('03-05, how did it go', () => {
  const HOW_DID_IT_GO = '03-05';
  const NOT_A_NUMBER = 'El id no es un número.';
  const start = startSession(INCIDENTS, HOW_DID_IT_GO);
  const { incident } = start;
  const asking = (session: Session, urlId: string) => sending(session, urlId, MESSAGE.curlInclude.id, ORIGIN.you.id);
  const codeOfLast = (session: Session) => runOf(session).trace.app?.response?.statusCode;
  const bodyOfLast = (session: Session) => runOf(session).trace.app?.response?.body;
  const before = startSession(INCIDENTS.map((own) => (own.id === HOW_DID_IT_GO ? { ...own, changes: [] } : own)), HOW_DID_IT_GO);
  const answeredBy = (session: Session) => runOf(session).trace.steps.filter(({ stage }) => stage === 'app').map(({ reason }) => plain(describeReason(reason, session.world, session.known)));
  const wrongOptionTexts = wrongOptionsOf(incident);
  const everythingRead = textsReadApartFromTheWrongOptions(incident);

  it('03-05: 200, 404 and 400 each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.orderSevenIs200, TASK.wrongPathIs404, TASK.misspelledIdIs400]);
    const served = asking(start, STATUS_URL.served.id);
    expect(codeOfLast(served)).toBe(200);
    expect(stillOpen(served)).toEqual([TASK.wrongPathIs404, TASK.misspelledIdIs400]);
    const wrongPath = asking(served, STATUS_URL.wrongPath.id);
    expect(codeOfLast(wrongPath)).toBe(404);
    expect(stillOpen(wrongPath)).toEqual([TASK.misspelledIdIs400]);
    const done = asking(wrongPath, STATUS_URL.misspelledId.id);
    expect(codeOfLast(done)).toBe(400);
    expect(stillOpen(done)).toEqual([]);
    expect(starsWhenSubmitted(done)).toMatchObject({ closed: true, middle: true });
    expect(stillOpen(asking(start, STATUS_URL.missingOrder.id))).toEqual(stillOpen(start));
  });

  it('03-05 starts from the world 03-04 leaves, and before the check the misspelled id gets the 404 that 03-04 gave', () => {
    expect(worldBeforeChanges(INCIDENTS, HOW_DID_IT_GO)).toEqual(solvedWorld(INCIDENTS, INCIDENT_BEFORE_HOW_DID_IT_GO));
    expect(incident.changes).toEqual([APP_CHECKS_THE_ID]);
    expect(networkSchema.safeParse(startWorld(INCIDENTS, HOW_DID_IT_GO)).error).toBeUndefined();
    const unchecked = asking(before, STATUS_URL.misspelledId.id);
    expect(codeOfLast(unchecked)).toBe(404);
    expect(bodyOfLast(unchecked)).toBe('No hay nada en esa URL.');
    expect(codeOfLast(asking(before, STATUS_URL.served.id))).toBe(200);
    expect(stillOpen(asking(before, STATUS_URL.misspelledId.id))).toContain(TASK.misspelledIdIs400);
    expect(codeOfLast(asking(start, STATUS_URL.misspelledId.id))).toBe(400);
  });

  it('03-05: the box says the app generated each code', () => {
    const expected: [string, string, string][] = [
      [STATUS_URL.served.id, '200 OK', 'Clase 2xx: la petición se cumplió.'],
      [STATUS_URL.wrongPath.id, '404 Not Found', 'Clase 4xx: la petición, tal como llegó, no se puede cumplir.'],
      [STATUS_URL.misspelledId.id, '400 Bad Request', 'Clase 4xx: la petición, tal como llegó, no se puede cumplir.'],
    ];
    for (const [urlId, code, classLine] of expected) {
      const box = lastBox(asking(start, urlId));
      expect(box['Código de estado'], urlId).toEqual([code, classLine]);
      expect(box['Quién lo generó'], urlId).toEqual([`La app de ${DEVICE.lucia.name}`]);
      const labels = Object.keys(box);
      expect(labels.indexOf('Respuesta HTTP'), urlId).toBeLessThan(labels.indexOf('Código de estado'));
    }
    expect(answeredBy(asking(start, STATUS_URL.wrongPath.id)).at(-1)).toBe(`${DEVICE.lucia.name} contesta con una respuesta con el código de estado 404 Not Found.`);
  });

  it('03-05: the box of 03-04 says nothing of the code or of who generated it, because status-code arrives here', () => {
    const shop = sending(startSession(INCIDENTS, INCIDENT_BEFORE_HOW_DID_IT_GO), SITE_URL.www.id, MESSAGE.curlInclude.id, ORIGIN.you.id);
    expect(Object.keys(lastBox(shop))).toEqual(expect.arrayContaining(['Respuesta HTTP']));
    expect(Object.keys(lastBox(shop)).filter((label) => /Código|Quién/.test(label))).toEqual([]);
    expect(knownTerms(INCIDENTS, INCIDENT_BEFORE_HOW_DID_IT_GO).has('status-code')).toBe(false);
    expect(answeredBy(shop).at(-1)).toBe(`${SERVER.fresh.name} contesta con una respuesta de código 200.`);
  });

  it('03-05: an id that names no order gets the 404 and the one that is not a number gets the 400', () => {
    const missing = asking(start, STATUS_URL.missingOrder.id);
    expect([codeOfLast(missing), bodyOfLast(missing)]).toEqual([404, 'No hay nada en esa URL.']);
    const misspelled = asking(start, STATUS_URL.misspelledId.id);
    expect([codeOfLast(misspelled), bodyOfLast(misspelled)]).toEqual([400, NOT_A_NUMBER]);
    expect(printedFor(misspelled, STATUS_URL.misspelledId.id, MESSAGE.curlInclude.id, ORIGIN.you.id)).toEqual([
      'HTTP/1.1 400 Bad Request',
      'Content-Type: text/plain; charset=utf-8',
      `Content-Length: ${new TextEncoder().encode(NOT_A_NUMBER).length}`,
      '',
      NOT_A_NUMBER,
    ]);
    expect(codeOfLast(asking(start, STATUS_URL.wrongPath.id))).toBe(404);
  });

  it('03-05: no text says a 4xx is always the fault of the client', () => {
    expect(everythingRead.flatMap(sentencesSayingA4xxIsAlwaysTheFaultOfTheClient)).toEqual([]);
    expect(['Un 4xx es siempre culpa del cliente.', 'Siempre es un error del cliente.'].filter((text) => sentencesSayingA4xxIsAlwaysTheFaultOfTheClient(text).length === 0)).toEqual([]);
    expect(['Parece un error del cliente, pero no siempre lo es.', 'No siempre es culpa del cliente.']).toSatisfy((texts: string[]) => texts.every((text) => sentencesSayingA4xxIsAlwaysTheFaultOfTheClient(text).length === 0));
    expect(wrongOptionTexts.map(plain).filter((text) => sentencesSayingA4xxIsAlwaysTheFaultOfTheClient(text).length > 0)).toEqual(['Que siempre es culpa del cliente que hizo la petición.']);
  });

  it('03-05: no text says a 200 means the business went well', () => {
    expect(everythingRead.flatMap(sentencesSayingA200MeansTheBusinessWentWell)).toEqual([]);
    expect(['Un 200 quiere decir que el negocio salió bien.', 'El código 200 es un éxito para el negocio.'].filter((text) => sentencesSayingA200MeansTheBusinessWentWell(text).length === 0)).toEqual([]);
    expect(['200 OK: el servidor dice que la petición se cumplió; no dice que al negocio le salió bien.']).toSatisfy((texts: string[]) => texts.every((text) => sentencesSayingA200MeansTheBusinessWentWell(text).length === 0));
    expect(plain(incident.takeaway)).toContain('no dice que al negocio le salió bien');
  });

  it('03-05: the report names laptop-lucia and the takeaway says why the misspelled id gives 400 and not 404', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(plain(incident.report)).toContain(`Lucía cambió la app de ${DEVICE.lucia.name}: ahora comprueba el id del pedido antes de buscarlo, y si el id no es un número, contesta con un error.`);
    expect(changedNames(worldBeforeChanges(INCIDENTS, HOW_DID_IT_GO), startWorld(INCIDENTS, HOW_DID_IT_GO))).toEqual([DEVICE.lucia.name]);
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain(`Lucía cambió la app de ${DEVICE.lucia.name} para que compruebe el id.`);
    expect(takeaway).toContain('Sin esa comprobación, la app habría buscado un pedido «siete» y habría contestado 404.');
  });

  it('03-05: draws tu-laptop and laptop-lucia', () => {
    const drawn = pieceViews(start);
    expect(drawn.filter(({ kind }) => kind === 'device').map(({ label }) => plain(label)).sort()).toEqual([DEVICE.lucia.name, DEVICE.you.name].sort());
    expect(drawn.filter(({ kind }) => kind === 'firewall')).toHaveLength(2);
    expect(drawn).toHaveLength(4);
    expect(incident.shown).toEqual(LAN_PIECES);
  });

  it('03-05: the right option is the third and the question separates the class from who is at fault', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(2);
    expect(plain((isGuided(incident) && incident.question) || '')).toBe('¿Qué dice la primera cifra de un 404?');
    expect(options.map(({ text }) => plain(text))).toEqual(['Que el servidor falló mientras intentaba cumplir la petición.', 'Que siempre es culpa del cliente que hizo la petición.', 'La clase: la petición, tal como llegó, no se puede cumplir.']);
    expect(plain(options[1].feedback)).toContain('parece un error del cliente, pero no siempre lo es');
    expect(plain(options[1].feedback)).toContain('no dice de quién es la culpa');
    expect(plain(options[2].feedback)).toContain('el 2 dice que la petición se cumplió y el 4, que la petición, tal como llegó, no se puede cumplir');
  });

  it('03-05: the feedback of the option that says the server failed gives the cause of the 404, not the one of the 400, and says the other class comes later in the game', () => {
    const feedback = plain((isGuided(incident) ? incident.explanation : [])[0].feedback);
    expect(feedback).toContain('no encontró nada en esa URL');
    expect(feedback).not.toContain('comprobó el id');
    expect(feedback).toContain('que verás más adelante');
  });

  it('03-05: introduces status code, 200 OK, 4xx error, 404 Not Found and 400 Bad Request, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['status-code', 'status-200', 'client-error', 'status-404', 'status-400']));
    expectOnlyTermsItKnows(incident);
    expect(incidentTexts(incident).map(plain).filter((text) => /\b5\d\d\b|5xx/.test(text))).toEqual([]);
  });
});

describe('03-06, who you are and what you can', () => {
  const WHO_YOU_ARE = '03-06';
  const start = startSession(INCIDENTS, WHO_YOU_ARE);
  const { incident } = start;
  const before = startSession(INCIDENTS.map((own) => (own.id === WHO_YOU_ARE ? { ...own, changes: [] } : own)), WHO_YOU_ARE);
  const asking = (session: Session, messageId: string) => sending(session, ADMIN_URL.id, messageId, ORIGIN.you.id);
  const lastSend = (session: Session) => session.history.at(-1)!;
  const codeOfLast = (session: Session) => lastSend(session).trace.app?.response?.statusCode;
  const responseOfLast = (session: Session) => lastSend(session).trace.app?.response;
  const requestOfLast = (session: Session) => lastSend(session).trace.app?.request;
  const appSteps = (session: Session) => runOf(session).trace.steps.filter(({ stage }) => stage === 'app').map(({ reason }) => plain(describeReason(reason, session.world, session.known)));
  const withoutCredential = MESSAGE.curlInclude.id;
  const asMarta = MESSAGE.curlMarta.id;
  const asLucia = MESSAGE.curlLucia.id;
  const wrongOptionTexts = wrongOptionsOf(incident);
  const everythingRead = textsReadApartFromTheWrongOptions(incident);
  const basicOf = (user: { name: string; password: string }) => `Basic ${Buffer.from(`${user.name}:${user.password}`).toString('base64')}`;

  it('03-06: 401 without a credential, 403 with the one of Marta and 200 with the one of Lucía each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.adminWithoutCredentialIs401, TASK.adminAsMartaIs403, TASK.adminAsLuciaIs200, TASK.browserEntersAdmin]);
    const unauthorized = asking(start, withoutCredential);
    expect(codeOfLast(unauthorized)).toBe(401);
    expect(stillOpen(unauthorized)).toEqual([TASK.adminAsMartaIs403, TASK.adminAsLuciaIs200, TASK.browserEntersAdmin]);
    const forbidden = asking(unauthorized, asMarta);
    expect(codeOfLast(forbidden)).toBe(403);
    expect(stillOpen(forbidden)).toEqual([TASK.adminAsLuciaIs200, TASK.browserEntersAdmin]);
    const done = asking(forbidden, asLucia);
    expect(codeOfLast(done)).toBe(200);
    expect(responseOfLast(done)?.body).toBe(ADMIN_BODY);
    expect(stillOpen(done)).toEqual([TASK.browserEntersAdmin]);
    const finished = asking(asking(done, MESSAGE.browserLucia.id), MESSAGE.browser.id);
    expect(stillOpen(finished)).toEqual([]);
    expect(starsWhenSubmitted(finished)).toMatchObject({ closed: true, middle: true });
    expect(stillOpen(asking(start, asLucia))).toEqual([TASK.adminWithoutCredentialIs401, TASK.adminAsMartaIs403, TASK.browserEntersAdmin]);
  });

  it('03-06: the 401 carries WWW-Authenticate, the request carries Authorization and the box says the app generated each code', () => {
    const unauthorized = asking(start, withoutCredential);
    expect(responseOfLast(unauthorized)?.headers['WWW-Authenticate']).toBe('Basic realm="admin"');
    expect(Object.keys(requestOfLast(unauthorized)!.headers)).not.toContain('Authorization');
    expect(printedFor(unauthorized, ADMIN_URL.id, withoutCredential, ORIGIN.you.id)).toEqual([
      'HTTP/1.1 401 Unauthorized',
      'Content-Type: text/plain; charset=utf-8',
      `Content-Length: ${new TextEncoder().encode(responseOfLast(unauthorized)!.body).length}`,
      'WWW-Authenticate: Basic realm="admin"',
      '',
      responseOfLast(unauthorized)!.body,
    ]);
    const forbidden = asking(start, asMarta);
    expect(requestOfLast(forbidden)?.headers.Authorization).toBe(basicOf(USER.marta));
    expect(Object.keys(requestOfLast(forbidden)!.headers)).toEqual(['Host', 'Authorization', 'User-Agent', 'Accept']);
    expect(responseOfLast(forbidden)?.headers).not.toHaveProperty('WWW-Authenticate');
    expect(requestOfLast(asking(start, asLucia))?.headers.Authorization).toBe(basicOf(USER.lucia));
    for (const [session, code] of [[unauthorized, '401 Unauthorized'], [forbidden, '403 Forbidden'], [asking(start, asLucia), '200 OK']] as const) {
      const box = lastBox(session);
      expect(box['Código de estado']?.[0]).toBe(code);
      expect(box['Quién lo generó']).toEqual([`La app de ${DEVICE.lucia.name}`]);
    }
  });

  it('03-06: each reason says why: the 401 who asks and the 403 what is allowed', () => {
    expect(appSteps(asking(start, withoutCredential))).toEqual([
      `La cabecera Host de la petición indica ${IP.lucia}. ${DEVICE.lucia.name} no tiene un sitio con ese nombre y contesta con su sitio por defecto.`,
      `${DEVICE.lucia.name} no sabe quién pide /admin: la petición no trae una credencial válida, y sin ella no puede hacer la autenticación.`,
      `${DEVICE.lucia.name} contesta con una respuesta con el código de estado 401 Unauthorized.`,
    ]);
    expect(appSteps(asking(start, asMarta))[1]).toBe(`${DEVICE.lucia.name} sabe quién pide /admin: es marta. Pero la autorización decide que marta no tiene permiso para entrar a /admin.`);
    expect(appSteps(asking(start, asLucia))).toHaveLength(2);
  });

  it('03-06: repeating the request of Marta gives the same 403', () => {
    const first = asking(start, asMarta);
    const second = asking(first, asMarta);
    expect(codeOfLast(second)).toBe(403);
    expect(responseOfLast(second)).toEqual(responseOfLast(first));
    expect(requestOfLast(second)).toEqual(requestOfLast(first));
    expect(stillOpen(asking(second, asMarta))).toEqual(stillOpen(first));
    expect(codeOfLast(asking(second, asLucia))).toBe(200);
  });

  const signingInAs = (session: Session, signIn: { id: string }) => asking(session, signIn.id);
  const opening = (session: Session) => asking(session, MESSAGE.browser.id);

  it('03-06: the browser enters /admin with the cookie after signing in as Lucía', () => {
    expect(codeOfLast(opening(start))).toBe(401);
    expect(stillOpen(opening(start))).toContain(TASK.browserEntersAdmin);
    const signedIn = signingInAs(start, MESSAGE.browserLucia);
    expect(requestOfLast(signedIn)).toMatchObject({ startLine: 'POST /login HTTP/1.1', body: 'usuario=lucia&clave=clave-lucia' });
    expect(codeOfLast(signedIn)).toBe(200);
    expect(responseOfLast(signedIn)?.headers['Set-Cookie']).toBe('sesion=s1');
    expect(stillOpen(signedIn)).toContain(TASK.browserEntersAdmin);
    const entered = opening(signedIn);
    expect(requestOfLast(entered)?.headers.Cookie).toBe('sesion=s1');
    expect(codeOfLast(entered)).toBe(200);
    expect(responseOfLast(entered)?.body).toBe(ADMIN_BODY);
    expect(stillOpen(entered)).not.toContain(TASK.browserEntersAdmin);
    expect(browserView(entered, { from: ORIGIN.you.id, to: ADMIN_URL.id, message: MESSAGE.browser.id })?.shows).toEqual({ kind: 'page', lines: [ADMIN_BODY] });
    const solved = (isGuided(incident) ? incident.solution : []).reduce(sessionReducer, start);
    expect(stillOpen(solved)).toEqual([]);
    expect(starsWhenSubmitted(solved)).toMatchObject({ closed: true, middle: true });
  });

  it('03-06: signing in as Marta and opening /admin gets the 403 and not the page of the admin', () => {
    const asMartaInTheBrowser = opening(signingInAs(start, MESSAGE.browserMarta));
    expect(requestOfLast(asMartaInTheBrowser)?.headers.Cookie).toBe('sesion=s1');
    expect(codeOfLast(asMartaInTheBrowser)).toBe(403);
    expect(responseOfLast(asMartaInTheBrowser)?.body).not.toBe(ADMIN_BODY);
    expect(stillOpen(asMartaInTheBrowser)).toContain(TASK.browserEntersAdmin);
    const thenLucia = opening(signingInAs(asMartaInTheBrowser, MESSAGE.browserLucia));
    expect(requestOfLast(thenLucia)?.headers.Cookie).toBe('sesion=s2');
    expect(codeOfLast(thenLucia)).toBe(200);
    expect(stillOpen(thenLucia)).not.toContain(TASK.browserEntersAdmin);
  });

  it('03-06: curl keeps no cookie unless it is given -b', () => {
    const signedIn = signingInAs(start, MESSAGE.browserLucia);
    const plainCurl = asking(signedIn, withoutCredential);
    expect(requestOfLast(plainCurl)?.headers).not.toHaveProperty('Cookie');
    expect(codeOfLast(plainCurl)).toBe(401);
    const withCookie = asking(signedIn, MESSAGE.curlCookie.id);
    expect(Object.keys(requestOfLast(withCookie)!.headers)).toEqual(['Host', 'User-Agent', 'Accept', 'Cookie']);
    expect(requestOfLast(withCookie)?.headers.Cookie).toBe('sesion=s1');
    expect(codeOfLast(withCookie)).toBe(200);
    expect(codeOfLast(asking(signingInAs(start, MESSAGE.browserMarta), MESSAGE.curlCookie.id)), 'sesion=s1 is the first session: Marta').toBe(403);
    expect(codeOfLast(asking(start, MESSAGE.curlCookie.id)), 'nobody signed in').toBe(401);
    expect(browserCard(signedIn, PIECE_ID.device(DEVICE.you.id))?.remembered).toEqual([{ id: `${IP.lucia}|sesion`, site: IP.lucia, name: 'sesion', value: 's1' }]);
    expect(pieceCard(signedIn, PIECE_ID.device(DEVICE.you.id))?.tabs.map(({ id }) => id)).toContain('browser');
  });

  it('03-06: the box shows the Cookie of the request and the Set-Cookie of the response', () => {
    const signedIn = signingInAs(start, MESSAGE.browserLucia);
    expect(lastBox(signedIn)['Respuesta HTTP']).toContain('Set-Cookie: sesion=s1');
    expect(lastBox(opening(signedIn))['Petición HTTP']).toContain('Cookie: sesion=s1');
    expect(lastBox(asking(signedIn, MESSAGE.curlCookie.id))['Petición HTTP']).toContain('Cookie: sesion=s1');
    expect(lastBox(asking(signedIn, MESSAGE.curlInclude.id))['Petición HTTP']).not.toContain('Cookie: sesion=s1');
  });

  it('03-06: the report and the takeaway say the cookie, why the app has a /login and that curl keeps nothing, and no text promises a 200 for -b', () => {
    const [report, takeaway] = [plain(incident.report), plain(incident.takeaway)];
    expect(report).toContain('/login');
    expect(report).toMatch(/\bcookie\b/);
    expect(takeaway).toContain('lo que une varias es la cookie');
    expect(takeaway).toMatch(/curl no guarda nada/);
    expect(takeaway).toContain('-b sesion=s1');
    const promisesA200 = (text: string) => text.split(/(?<=\.)\s+/).filter((sentence) => /-b|sesion=s1/.test(sentence) && /\b200\b/.test(sentence) && !/\bsi\b/i.test(sentence));
    expect(incidentTexts(incident).map(plain).flatMap(promisesA200)).toEqual([]);
    expect(['Con -b sesion=s1 el curl recibe 200.', 'El curl con -b da 200.'].filter((text) => promisesA200(text).length === 0)).toEqual([]);
    expect(['Con -b sesion=s1 da 200 si Lucía inició sesión primero.']).toSatisfy((texts: string[]) => texts.every((text) => promisesA200(text).length === 0));
  });

  it('03-06: the report says what a credential is, what -u does and why the cookie is named sesion=s1', () => {
    const report = plain(incident.report);
    expect(report).toContain('sin credencial (el usuario y la contraseña) y con -u, que la manda');
    expect(report).toContain('la app anota quién entró en una sesión y contesta con una cookie que la nombra (la primera es sesion=s1)');
  });

  it('03-06: no text registers or uses the word stateless', () => {
    const saysIt = (text: string) => /stateless|sin estado/i.test(text);
    expect(Object.values(TERMS).flatMap(({ name, definition }) => [name, definition]).filter(saysIt)).toEqual([]);
    expect(incidentTexts(incident).map(plain).filter(saysIt)).toEqual([]);
    expect(Object.values(lastBox(opening(signingInAs(start, MESSAGE.browserLucia)))).flat().filter(saysIt)).toEqual([]);
  });

  it('03-06 starts from the world 03-05 leaves, and before the users /admin gets the 404', () => {
    expect(worldBeforeChanges(INCIDENTS, WHO_YOU_ARE)).toEqual(solvedWorld(INCIDENTS, INCIDENT_BEFORE_WHO_YOU_ARE));
    expect(incident.changes).toEqual([APP_HAS_USERS]);
    expect(networkSchema.safeParse(startWorld(INCIDENTS, WHO_YOU_ARE)).error).toBeUndefined();
    const unchecked = asking(before, withoutCredential);
    expect(codeOfLast(unchecked)).toBe(404);
    expect(responseOfLast(unchecked)?.body).toBe('No hay nada en esa URL.');
    expect(codeOfLast(asking(before, asLucia))).toBe(404);
    expect(stillOpen(before)).toEqual(stillOpen(start));
    expect(codeOfLast(asking(start, withoutCredential))).toBe(401);
    expect(sitesOf(startWorld(INCIDENTS, WHO_YOU_ARE)).flatMap(({ accounts }) => accounts?.users.map(({ name }) => name) ?? [])).toEqual([USER.lucia.name, USER.marta.name]);
  });

  it('03-06: the takeaway says that in AWS the number alone is not enough and names no service', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('En AWS el número solo no basta');
    expect(takeaway).toContain('hay que ver quién lo generó');
    expect(takeaway.match(/\b(API Gateway|ALB|Application Load Balancer|Elastic Load Balancing|CloudFront|Lambda|S3|EC2|Cognito|IAM|Route 53|WAF|NLB|ELB)\b/g)).toBeNull();
  });

  it('03-06: the takeaway says a credential over http can be read by anyone who sees the path', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('cualquiera que vea el camino puede volver a leer el usuario y la contraseña');
    expect(takeaway).not.toMatch(/cifrad|TLS|HTTPS|base64/i);
  });

  it('03-06: the takeaway says why the same request gives other codes: the app of laptop-lucia has users and permissions now', () => {
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain(`Lucía agregó /admin a la app de ${DEVICE.lucia.name}`);
    expect(takeaway).toContain('Un 404 puede esconder un 403');
    expect(takeaway).toContain('pese al nombre, esa cabecera sirve para autenticar, no para autorizar');
  });

  it('03-06: no text says that a 403 is temporary or that it means the password is wrong', () => {
    const saysTemporary = (text: string) => text.split(/(?<=\.)\s+/).filter((sentence) => /\b403\b|Forbidden/i.test(sentence) && /temporal|pasa solo|se quita/i.test(sentence) && !/\bno\b/i.test(sentence));
    const saysWrongPassword = (text: string) => text.split(/(?<=\.)\s+/).filter((sentence) => /\b403\b|Forbidden/i.test(sentence) && /contraseña|clave/i.test(sentence) && /\bmal\b|incorrecta|equivocada/i.test(sentence) && !/\bno\b|\b401\b/i.test(sentence));
    expect(everythingRead.flatMap(saysTemporary)).toEqual([]);
    expect(everythingRead.flatMap(saysWrongPassword)).toEqual([]);
    expect(['Un 403 es temporal y pasa solo.', 'El 403 se quita al repetir.'].filter((text) => saysTemporary(text).length === 0)).toEqual([]);
    expect(['Un 403 dice que la contraseña está mal.'].filter((text) => saysWrongPassword(text).length === 0)).toEqual([]);
    expect(['El 403 no es temporal.', 'Una contraseña mal escrita da 401, no 403.']).toSatisfy((texts: string[]) => texts.every((text) => saysTemporary(text).length + saysWrongPassword(text).length === 0));
    expect(wrongOptionTexts.map(plain).filter((text) => saysTemporary(text).length + saysWrongPassword(text).length > 0)).toHaveLength(2);
  });

  it('03-06: the report names laptop-lucia', () => {
    expect(incident.report).toContain(NAME.lucia);
    expect(changedNames(worldBeforeChanges(INCIDENTS, WHO_YOU_ARE), startWorld(INCIDENTS, WHO_YOU_ARE))).toEqual([DEVICE.lucia.name]);
    expect(plain(incident.report)).toContain(`Lucía agregó /admin a la app de ${DEVICE.lucia.name}`);
  });

  it('03-06: draws tu-laptop and laptop-lucia', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    expect(drawn.sort()).toEqual([`device:${DEVICE.lucia.name}`, `device:${DEVICE.you.name}`, `firewall:firewall ${DEVICE.lucia.name}`, `firewall:firewall ${DEVICE.you.name}`]);
    expect(incident.shown).toEqual(LAN_PIECES);
  });

  it('03-06: the right option is the first and the question separates the 403 from the 401 and from a temporary error', () => {
    const options = isGuided(incident) ? incident.explanation : [];
    expect(options.findIndex(({ correct }) => correct)).toBe(0);
    expect(plain((isGuided(incident) && incident.question) || '')).toBe('Marta recibió un 403. ¿Le sirve repetir la petición con la misma credencial?');
    expect(options.map(({ text }) => plain(text))).toEqual([
      'No: la app ya sabe quién es Marta y no le da permiso.',
      'Sí: un 403 es temporal y se quita al repetir la petición.',
      'Sí: un 403 dice que la contraseña de Marta está mal.',
    ]);
    expect(plain(options[0].feedback)).toContain('repetir la misma petición con la misma credencial da el mismo 403');
    expect(plain(options[1].feedback)).toContain('no avisa que sea temporal');
    expect(plain(options[2].feedback)).toContain('Una contraseña mal escrita da 401, no 403');
  });

  it('03-06: introduces authentication, authorization, Authorization header, 401, 403 and cookie, and uses no later term', () => {
    expect(sorted(incident.introduces)).toEqual(sorted(['authentication', 'authorization', 'authorization-header', 'status-401', 'status-403', 'cookie']));
    expectOnlyTermsItKnows(incident);
    expect(incidentTexts(incident).map(plain).filter((text) => /\b5\d\d\b|5xx|\b429\b/.test(text))).toEqual([]);
  });
});
