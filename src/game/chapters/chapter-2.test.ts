import { describe, expect, it } from 'vitest';
import { TABLE_TEXT, TERMS, toPlainText, type TermId } from '@/copy';
import { RECORD_TTL, applyAction, extraOpenings, ipInCidr, isLoopbackIpv4, maskOf, networkSchema, stopStep, type Network } from '@/engine';
import { INCIDENTS, caseWorld, isGuided, sendCombinations, solvedWorld, startWorld, type CaseSpec, type Incident } from '@/levels';
import { SERVER_RANGE } from '@/levels/01-first-day/shared';
import { changedNames, unnamedChanges } from '@/levels/contract/changes';
import { routersCrossedByTraceroutes } from '@/levels/contract/chips';
import { incidentTexts, knownTerms, namedTerms, unknownTerms } from '@/levels/ladder';
import {
  ADDRESS,
  APP_LISTEN,
  APP_ON_LOOPBACK,
  BLOCK,
  BLOCK_CARD,
  BRANCH_LAN,
  CACHE_PIECES,
  CLIENT,
  DEFAULT_ROUTE_LOST,
  DEVICE,
  DNS_STATUS,
  DOMAIN,
  FAILURES_PIECES,
  FIREWALL,
  FLOORS_PIECES,
  HOSTNAME,
  IP,
  LOOP,
  LOOP_FIX,
  LUCIA_SERVICES,
  MESSAGE,
  NAMES_PIECES,
  NAME_SERVERS,
  OFFICE_ROUTES,
  OLD_ANSWER_SECONDS,
  ORIGIN,
  OTHER_OFFICE,
  OUTSIDE_PIECES,
  PING_WITH_TTL,
  PORT,
  PROVIDER_ROUTES_FIX,
  RECORDS_PIECES,
  RECORD_TYPE,
  REFUSAL_PIECES,
  ROUTER,
  ROUTES_LOST,
  ROUTES_PIECES,
  SERVER,
  SERVICES_PIECES,
  SITE_ON_LOOPBACK,
  SITE_RECORDS,
  SITE_RECORDS_TABLE,
  SSH_AND_FIREWALL,
  SSH_FLOW,
  SSH_FROM,
  SSH_PIECES,
  SSH_WHAT,
  STALE_SHOP,
  TASK,
  TRANSLATION_PIECES,
  WAIT,
  recordMove,
  recordRemoval,
  routeMove,
  waitMove,
} from '@/levels/02-ports-and-names/shared';
import { CHAPTER_1_TERMS, sendIncident } from '@/testing';
import { drawnSends } from '@/game/flow-runs';
import { caseClosed, clockSteps, currentCase, isIntruding, sessionReducer, startSession, starsOf, type Session } from '@/game/session';
import { taskHolds } from '@/game/tasks';
import { caseCard, caseSummary } from '@/game/view/cards/case-card';
import { terminalLine } from '@/game/view/cards/terminal/terminal-card';
import { identifyCard } from '@/game/view/cards/identify-card';
import { classifiedBlock, classifyCard } from '@/game/view/cards/identify/classify-card';
import { pieceCard } from '@/game/view/cards/piece-card';
import { servicesCard, settingsCard } from '@/game/view/cards/settings-card';
import type { TableCard } from '@/game/view/cards/table-card';
import { toolOutput } from '@/game/view/cards/terminal/output-card';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';
import { pieceViews } from '@/game/view/pieces';

const CHAPTER = 2;
const LAST_INCIDENT = '02-14';
const TERMS_OF_THE_APPROVED_DESIGN: Record<string, TermId[]> = {
  '02-01': ['service', 'port', 'destination-port', 'ip-port', 'listen', 'nc'],
  '02-02': ['client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port'],
  '02-03': ['closed-port', 'rst', 'connection-refused', 'filtered-port', 'listen-address'],
  '02-04': ['bit', 'prefix', 'cidr', 'subnet-mask'],
  '02-05': ['port-range', 'ssh', 'default-port', 'well-known-ports'],
  '02-06': ['route', 'routing-table', 'connected-route', 'default-route'],
  '02-07': ['next-hop', 'net-unreachable', 'most-specific-route'],
  '02-08': ['nat', 'napt', 'translation-table'],
  '02-09': ['port-forwarding'],
  '02-10': ['domain-name', 'dns', 'dns-query', 'resolver', 'udp', 'dig', 'dhcp'],
  '02-11': ['authoritative-server', 'dns-record', 'a-record', 'cname-record'],
  '02-12': ['dns-cache', 'dns-ttl'],
  '02-13': ['nxdomain', 'servfail', 'port-unreachable', 'hosts-file'],
  [LAST_INCIDENT]: [],
};
const APPROVED_TERMS = Object.values(TERMS_OF_THE_APPROVED_DESIGN).flat();
const APPROVED_TERM_COUNT = 53;
const APPROVED_INCIDENT_COUNT = 14;

interface ExcusedUse {
  term: TermId;
  reason: string;
  use: RegExp;
}

const EXCUSED_USES: ExcusedUse[] = [
  {
    term: 'resolver',
    reason: 'resolver is also the infinitive of the verb to solve, as in «hay que resolver el problema»; the noun, after an article or a contraction («el resolver», «un resolver», «al resolver», «del resolver»), is never excused',
    use: /(?<![\p{L}\p{N}])(?:para|sin|de|a|que|puede|pueden|poder|va a|vas a)\s+resolver(?![\p{L}\p{N}])/giu,
  },
];

const DOCUMENTATION_BLOCKS = ['192.0.2.0/24', '198.51.100.0/24', '203.0.113.0/24'];
const PRIVATE_BLOCKS = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
const DOCUMENTATION_TLD = '.example';
const CHAPTER_OF_THE_VPC = 4;
const LATER_TOPICS = /\b(HTTPS?|TLS|certificados?|URLs?|stateful|stateless|NACLs?|subnets?|Route 53|Alias|IPv6|ARP|MAC|VPN)\b/;

const sorted = <Value extends string>(values: Value[]): Value[] => [...values].sort();
const orderOf = (id: string): number => Number(id.slice(id.indexOf('-') + 1));
const builtOfChapter2 = (): Incident[] => INCIDENTS.filter((incident) => incident.chapter === CHAPTER);

/** Returns the terms that the incidents after this order introduce, by the table of the approved design: also those of incidents not built yet. */
function termsAfter(order: number): TermId[] {
  return Object.entries(TERMS_OF_THE_APPROVED_DESIGN).flatMap(([id, terms]) => (orderOf(id) > order ? terms : []));
}

/** Returns the text without the uses of a term that an exception excuses. */
function withoutExcusedUses(text: string, term: TermId): string {
  return EXCUSED_USES.filter((excused) => excused.term === term).reduce((rest, { use }) => rest.replace(use, ' '), text);
}

/** Returns, once each, the terms of `later` that the text names in plain words or tagged, once the uses an exception excuses are left out. */
function laterTermsNamed(text: string, later: TermId[]): TermId[] {
  const plain = toPlainText(text);
  return later.filter((term) => namedTerms(withoutExcusedUses(plain, term), [term]).length > 0);
}

/** Returns, as "incident: term", every term that a later incident of the approved design introduces and that a text of the incident names. */
function laterTermLeaks(incidents: Incident[]): string[] {
  return incidents.flatMap((incident) => {
    const later = termsAfter(incident.order);
    return incidentTexts(incident).flatMap((text) => laterTermsNamed(text, later).map((term) => `${incident.id}: ${term}`));
  });
}

/** Returns an incident of chapter 2 at this order whose report is the given text and that introduces nothing. */
function incidentSaying(order: number, report: string): Incident {
  return { ...sendIncident(), id: `02-${String(order).padStart(2, '0')}`, chapter: CHAPTER, order, introduces: [], report };
}

/** Returns the addresses that are neither private nor loopback nor inside a block RFC 5737 reserves for documentation. */
function publicOutsideDocumentation(addresses: string[]): string[] {
  const inAny = (ip: string, blocks: string[]) => blocks.some((block) => ipInCidr(ip, block));
  return addresses.filter((ip) => !isLoopbackIpv4(ip) && !inAny(ip, PRIVATE_BLOCKS) && !inAny(ip, DOCUMENTATION_BLOCKS));
}

function outsideDocumentationTld(names: string[]): string[] {
  return names.filter((name) => !name.endsWith(DOCUMENTATION_TLD));
}

/** Sends this message from this terminal to this address. */
const sendingFrom = (session: Session, fromId: string, toId: string, messageId: string): Session => sessionReducer(session, { type: 'sendPacket', fromId, toId, messageId });

/** Sends this message from your laptop to laptop-lucia. */
const sending = (session: Session, messageId: string): Session => sendingFrom(session, ORIGIN.you.id, ADDRESS.lucia.id, messageId);

/** Returns the ids of the tasks of a guided incident that do not hold yet. */
const stillOpen = ({ incident, runs, sent, answers }: Session): string[] => (isGuided(incident) ? incident.tasks.filter((task) => !taskHolds(task, runs, sent, answers)).map(({ id }) => id) : []);

/** Returns the box of the last packet sent, by the plain text of each field label, with the plain text of its lines. */
const lastBox = (session: Session): Record<string, string[]> => {
  const box = inspect(session, session.sent.at(-1)!.pieceId);
  return Object.fromEntries((box?.fields ?? []).map(({ label, lines }) => [toPlainText(label), lines.map((line) => toPlainText(line))]));
};

/** Returns the lines the output card prints for the message sent from this terminal to this address. */
const printedFrom = (session: Session, fromId: string, toId: string, messageId: string): string[] =>
  (toolOutput(session, { from: fromId, to: toId, message: messageId })?.segments ?? []).flatMap((segment) => (segment.kind === 'line' ? [segment.text] : segment.lines));

/** Returns the lines the output card prints for the message sent from your laptop to laptop-lucia. */
const printedBy = (session: Session, messageId: string): string[] => printedFrom(session, ORIGIN.you.id, ADDRESS.lucia.id, messageId);

const plain = (text: string): string => toPlainText(text);

/** Returns the plain text of every field of the box of each packet sent: its labels, lines and notes. */
const boxTexts = (session: Session): string[] =>
  session.sent.flatMap((run) => inspect(session, run.pieceId)?.fields ?? []).flatMap((field) => [field.label, ...field.lines, ...(field.notes ?? [])]).map(plain);

/** Returns every text the player reads in an incident once the packets are sent: the texts of the incident, the boxes, what the tool prints and the definitions of the terms it introduces. */
const everythingRead = (session: Session): string[] => [
  ...incidentTexts(session.incident).map(plain),
  ...boxTexts(session),
  ...session.sent.flatMap((run) => printedFrom(session, run.fromId, run.toId, run.messageId)),
  ...session.incident.introduces.map((term) => TERMS[term].definition),
];

/** Expects every task of the incident to hold and the incident to close with its middle star. */
function expectClosed(session: Session): void {
  expect(stillOpen(session)).toEqual([]);
  expect(starsOf(sessionReducer(session, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
}

/** Returns the options of the question of an incident that has one: its three explanations. */
const optionsOf = (incident: Incident): { text: string; feedback: string; correct: boolean }[] => (isGuided(incident) ? incident.explanation : []);

/** Returns the place, counted from 0, of the right option among the options of an incident. */
const rightOptionPlace = (incident: Incident): number => optionsOf(incident).findIndex(({ correct }) => correct);

/** True when the right option is longer than each of the others, by the plain text: the length would give it away. */
function rightOptionIsTheLongest(incident: Incident): boolean {
  const lengths = optionsOf(incident).map(({ text }) => plain(text).length);
  const right = lengths[rightOptionPlace(incident)];
  return lengths.every((length, index) => index === rightOptionPlace(incident) || length < right);
}

/** Expects an incident to have three options, the right one at this place (counted from 0) and not the longest, so its length gives nothing away. */
function expectRightOptionAt(incident: Incident, place: number): void {
  expect(optionsOf(incident)).toHaveLength(3);
  expect(rightOptionPlace(incident)).toBe(place);
  expect(rightOptionIsTheLongest(incident)).toBe(false);
}

/** Returns, sorted, the kind and the plain label of every piece the map draws, such as `device:tu-laptop`. */
const drawnLabels = (session: Session): string[] => pieceViews(session).map((piece) => `${piece.kind}:${plain(piece.label)}`).sort();

describe('the term ladder of chapter 2 in its incidents', () => {
  it('the table of the approved design holds the 53 terms in 14 incidents, each term once, all registered and none of chapter 1', () => {
    expect(Object.keys(TERMS_OF_THE_APPROVED_DESIGN)).toHaveLength(APPROVED_INCIDENT_COUNT);
    expect(APPROVED_TERMS).toHaveLength(APPROVED_TERM_COUNT);
    expect(new Set(APPROVED_TERMS).size).toBe(APPROVED_TERMS.length);
    expect(APPROVED_TERMS.filter((term) => !(term in TERMS))).toEqual([]);
    expect(APPROVED_TERMS.filter((term) => CHAPTER_1_TERMS.has(term))).toEqual([]);
  });

  it('introduces, incident by incident, the terms of the approved design', () => {
    for (const incident of builtOfChapter2()) expect(sorted(incident.introduces), incident.id).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[incident.id] ?? []));
  });

  it('introduces exactly the 53 terms of the approved design, each in its incident', () => {
    const chapter = builtOfChapter2();
    expect(chapter.map(({ id }) => id)).toEqual(Object.keys(TERMS_OF_THE_APPROVED_DESIGN));
    const introduced = chapter.flatMap((incident) => incident.introduces);
    expect(introduced).toHaveLength(APPROVED_TERM_COUNT);
    expect(new Set(introduced).size).toBe(APPROVED_TERM_COUNT);
    expect(sorted(introduced)).toEqual(sorted(APPROVED_TERMS));
    for (const incident of chapter) expect(sorted(incident.introduces), incident.id).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[incident.id]));
    expect(INCIDENTS.filter((incident) => incident.chapter !== CHAPTER).flatMap((incident) => incident.introduces).filter((term) => APPROVED_TERMS.includes(term))).toEqual([]);
  });

  it('cidr, dns and nat are introduced by chapter 2 and by no incident of chapter 4', () => {
    const introducing = (term: TermId) => INCIDENTS.filter((incident) => incident.introduces.includes(term)).map(({ id }) => id);
    expect([introducing('cidr'), introducing('dns'), introducing('nat')]).toEqual([['02-04'], ['02-10'], ['02-08']]);
    expect(INCIDENTS.filter((incident) => incident.chapter === CHAPTER_OF_THE_VPC).flatMap((incident) => incident.introduces).filter((term) => ['cidr', 'dns', 'nat'].includes(term))).toEqual([]);
  });

  it('names no topic of the chapters that come later, in any text of chapter 2', () => {
    const chapter = builtOfChapter2();
    const definitions = chapter.flatMap((incident) => incident.introduces.map((term) => TERMS[term].definition));
    const texts = [...chapter.flatMap(incidentTexts).map(plain), ...definitions.map(plain)];
    expect(texts.filter((text) => LATER_TOPICS.test(text))).toEqual([]);
    expect(['Entra por HTTPS.', 'Usa un certificado TLS.', 'Es una URL.', 'Un NACL.', 'Una subnet.', 'En Route 53.', 'Con IPv6.', 'Por ARP.', 'Con una MAC.', 'Por una VPN.', 'El firewall es stateful.'].filter((text) => !LATER_TOPICS.test(text))).toEqual([]);
  });

  it('no term of the approved design is missing: the ids of the table of the spec equal the ids that 02-01 to 02-14 introduce', () => {
    const built = builtOfChapter2();
    const complete = built.some((incident) => incident.id === LAST_INCIDENT);
    const expectedIds = complete ? Object.keys(TERMS_OF_THE_APPROVED_DESIGN) : built.map(({ id }) => id);
    const expectedTerms = complete ? APPROVED_TERMS : built.flatMap(({ id }) => TERMS_OF_THE_APPROVED_DESIGN[id] ?? []);
    expect(built.map(({ id }) => id)).toEqual(expectedIds);
    expect(sorted(built.flatMap((incident) => incident.introduces))).toEqual(sorted(expectedTerms));
  });

  it('a text of an incident names no term that a later incident of chapter 2 introduces', () => {
    expect(laterTermLeaks(builtOfChapter2())).toEqual([]);
  });

  it('catches a text that names a term a later incident introduces, tagged or in plain words', () => {
    expect(laterTermLeaks([incidentSaying(3, 'Esa {{route|ruta}} nunca cambia.')])).toEqual(['02-03: route']);
    expect(laterTermLeaks([incidentSaying(3, 'Mira la tabla de rutas.')])).toEqual(['02-03: route', '02-03: routing-table']);
    expect(laterTermLeaks([incidentSaying(10, 'Mira la tabla de rutas.')])).toEqual([]);
  });

  it('lets resolver pass as a verb and catches it as the noun', () => {
    expect(laterTermLeaks([incidentSaying(3, 'Hay que resolver el problema de Lucía.')])).toEqual([]);
    expect(laterTermLeaks([incidentSaying(3, 'Lucía lo hizo para resolver su duda.')])).toEqual([]);
    expect(laterTermLeaks([incidentSaying(3, 'El resolver contesta.')])).toEqual(['02-03: resolver']);
    expect(laterTermLeaks([incidentSaying(3, 'Pregunta al resolver.')])).toEqual(['02-03: resolver']);
    expect(laterTermLeaks([incidentSaying(3, 'Es la IP del resolver.')])).toEqual(['02-03: resolver']);
  });
});

describe('the registry of the world of chapter 2', () => {
  it('every device, router, server and client has its own id and its own name', () => {
    const entries = [...Object.values(DEVICE), ...Object.values(ROUTER), ...Object.values(SERVER), ...Object.values(CLIENT)];
    expect(new Set(entries.map(({ id }) => id)).size).toBe(entries.length);
    expect(new Set(entries.map(({ name }) => name)).size).toBe(entries.length);
  });

  it('no address repeats, and no port is out of the range of 1 to 65535', () => {
    const addresses = Object.values(IP);
    expect(new Set(addresses).size).toBe(addresses.length);
    expect(Object.values(PORT).filter((port) => port < 1 || port > 65535)).toEqual([]);
  });

  it('every public address of chapter 2 is in 192.0.2.0/24, 198.51.100.0/24 or 203.0.113.0/24, and every name is under .example', () => {
    expect(publicOutsideDocumentation(Object.values(IP))).toEqual([]);
    expect(outsideDocumentationTld([...Object.values(DOMAIN), ...Object.values(HOSTNAME)])).toEqual([]);
  });

  it('catches a public address outside the documentation blocks and a name outside .example', () => {
    expect(publicOutsideDocumentation(['93.184.216.34', IP.server, IP.officeLink, IP.loopback])).toEqual(['93.184.216.34']);
    expect(outsideDocumentationTld(['www.example.com', HOSTNAME.www])).toEqual(['www.example.com']);
  });
});

describe('the world of chapter 2 at its first block', () => {
  const start = solvedWorld(INCIDENTS, '01-14');
  const luciaIn = (world: Network) => world.devices.find((device) => device.id === DEVICE.lucia.id);
  const accepted = (world: Network) => expect(networkSchema.safeParse(world).error).toBeUndefined();
  const withServices = applyAction(start, LUCIA_SERVICES);

  it('02-01 puts the app and the database of laptop-lucia to work on every IP, and changes nothing else', () => {
    expect(luciaIn(start)?.host.services).toEqual([]);
    expect(luciaIn(withServices)?.host.services).toEqual([
      { protocol: 'tcp', port: PORT.app, listen: 'all' },
      { protocol: 'tcp', port: PORT.database, listen: 'all' },
    ]);
    expect({ ...withServices, devices: start.devices }).toEqual(start);
    accepted(withServices);
  });

  it('02-03 makes the app listen only on 127.0.0.1 and keeps the database on every IP', () => {
    const world = applyAction(withServices, APP_ON_LOOPBACK);
    expect(luciaIn(world)?.host.services).toEqual([
      { protocol: 'tcp', port: PORT.app, listen: 'loopback' },
      { protocol: 'tcp', port: PORT.database, listen: 'all' },
    ]);
    accepted(world);
  });

  it('02-05 adds SSH beside the app and the database, and a firewall that lets nothing in and everything out', () => {
    const world = SSH_AND_FIREWALL.reduce(applyAction, withServices);
    const lucia = luciaIn(world);
    const firewall = world.firewalls.find(({ id }) => lucia?.firewallIds.includes(id));
    expect(lucia?.host.services.map(({ port }) => port)).toEqual([PORT.app, PORT.database, PORT.ssh]);
    expect(firewall?.inbound).toEqual([]);
    expect(firewall?.outbound).toHaveLength(1);
    accepted(world);
  });

  it.each([
    ['SERVICES_PIECES', SERVICES_PIECES],
    ['REFUSAL_PIECES', REFUSAL_PIECES],
    ['FLOORS_PIECES', FLOORS_PIECES],
    ['SSH_PIECES', SSH_PIECES],
  ])('%s lists only pieces the world 01-14 leaves has', (_name, pieces) => {
    const ids = [...start.devices.map(({ id }) => id), ...(start.routers ?? []).map(({ id }) => id), ...start.actors.map(({ id }) => id)];
    expect(pieces.filter((id) => !ids.includes(id))).toEqual([]);
  });
});

describe('02-01, one machine and many services', () => {
  const ONE_MACHINE = '02-01';
  const NCAT_BANNER = 'Ncat: Version 7.93 ( https://nmap.org/ncat )';
  const NCAT_BYTES = /^Ncat: 0 bytes sent, 0 bytes received in \d+\.\d{2} seconds\.$/;
  const A_PROTOCOL_NAME = /\btcp\b/i;
  const INSTALL_NC = 'sudo dnf install nmap-ncat';
  const OUT_HEADER = 'Encabezado de ida';
  const start = startSession(INCIDENTS, ONE_MACHINE);

  it('02-01: the ping, the nc to port 3000 and the nc to port 5432 each complete their task', () => {
    expect(stillOpen(start)).toEqual([TASK.ping, TASK.app, TASK.database]);
    const pinged = sending(start, MESSAGE.ping.id);
    expect(stillOpen(pinged)).toEqual([TASK.app, TASK.database]);
    const reachedTheApp = sending(pinged, MESSAGE.ncApp.id);
    expect(stillOpen(reachedTheApp)).toEqual([TASK.database]);
    const done = sending(reachedTheApp, MESSAGE.ncDatabase.id);
    expect(stillOpen(done)).toEqual([]);
    expect(starsOf(sessionReducer(done, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });

  it('02-01: the box of the nc shows 192.168.1.11:3000 as the destination', () => {
    const toTheApp = lastBox(sending(start, MESSAGE.ncApp.id));
    expect(toTheApp[OUT_HEADER]).toEqual([`${IP.you} → ${IP.lucia}:${PORT.app}`, 'TTL al salir: 64']);
    expect(lastBox(sending(start, MESSAGE.ncDatabase.id))[OUT_HEADER]).toContain(`${IP.you} → ${IP.lucia}:${PORT.database}`);
    expect([...Object.keys(toTheApp), ...Object.values(toTheApp).flat()].join(' ')).not.toMatch(/Puerto de origen|Saludo/);
  });

  it('02-01: the report names laptop-lucia and says what changed', () => {
    const { report } = start.incident;
    expect(plain(report)).toMatch(new RegExp(`^Lucía puso a funcionar dos programas en ${DEVICE.lucia.name}: su app y una base de datos de pruebas\\.`));
    expect(report).toContain(`[[${DEVICE.lucia.name}]]`);
    expect(changedNames(solvedWorld(INCIDENTS, '01-14'), startWorld(INCIDENTS, ONE_MACHINE))).toEqual([DEVICE.lucia.name]);
  });

  it('02-01: draws tu-laptop and laptop-lucia and no other piece', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    expect(drawn.sort()).toEqual([`device:${DEVICE.lucia.name}`, `device:${DEVICE.you.name}`, `firewall:firewall ${DEVICE.you.name}`]);
    expect(start.incident.shown).toEqual(SERVICES_PIECES);
  });

  it('02-01: introduces service, port, destination port, IP:puerto, escuchar and nc, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[ONE_MACHINE]));
    expect(sorted(introduces)).toEqual(sorted(['service', 'port', 'destination-port', 'ip-port', 'listen', 'nc']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, ONE_MACHINE))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
    expect(incidentTexts(start.incident).map(plain).filter((text) => A_PROTOCOL_NAME.test(text))).toEqual([]);
  });

  it('02-01: the takeaway says how to install nc on Amazon Linux 2023 and that macOS prints it differently', () => {
    const takeaway = plain(start.incident.takeaway);
    expect(takeaway).toContain(`En Amazon Linux 2023, nc se instala con ${INSTALL_NC}.`);
    expect(takeaway).toMatch(/En macOS, nc es otro programa y su salida se ve distinta\./);
    expect(takeaway.split(/(?<=\.)\s+/)).toHaveLength(3);
  });

  it('02-01: the output of nc is the one of ncat 7.93, with the Version, Connected and bytes lines and no tcp', () => {
    const [banner, connected, bytes, ...rest] = printedBy(sending(start, MESSAGE.ncApp.id), MESSAGE.ncApp.id);
    expect(banner).toBe(NCAT_BANNER);
    expect(connected).toBe(`Ncat: Connected to ${IP.lucia}:${PORT.app}.`);
    expect(bytes).toMatch(NCAT_BYTES);
    expect(rest).toEqual([]);
    expect([banner, connected, bytes].filter((line) => A_PROTOCOL_NAME.test(line) || line.includes('[tcp/'))).toEqual([]);
    expect(printedBy(sending(start, MESSAGE.ncDatabase.id), MESSAGE.ncDatabase.id)[1]).toBe(`Ncat: Connected to ${IP.lucia}:${PORT.database}.`);
    expect(terminalLine(start, { to: ADDRESS.lucia.id, message: MESSAGE.ncApp.id })).toBe(`nc -vz -w 3 ${IP.lucia} ${PORT.app}`);
  });

  it('02-01: no wrong option of the question says the ping did not arrive, which the question itself says it did', () => {
    const wrong = optionsOf(start.incident).filter(({ correct }) => !correct);
    expect(wrong).toHaveLength(2);
    expect(wrong.flatMap(({ text }) => (/no llegó|no volvió|no contestó/i.test(plain(text)) ? [plain(text)] : []))).toEqual([]);
  });

  it('02-01: the right option is the second and is not the longest of the three', () => {
    expect(rightOptionPlace(start.incident)).toBe(1);
    expect(rightOptionIsTheLongest(start.incident)).toBe(false);
  });

  it('02-01: the ping to laptop-lucia comes back and does not complete the nc tasks', () => {
    const pinged = sending(start, MESSAGE.ping.id);
    expect(pinged.sent[0].replied).toBe(true);
    expect(stillOpen(pinged)).toEqual([TASK.app, TASK.database]);
    expect(printedBy(pinged, MESSAGE.ping.id)).toEqual([]);
    const box = lastBox(pinged);
    expect([...Object.keys(box), ...Object.values(box).flat()].join(' ')).not.toMatch(/puerto/i);
  });
});

describe('02-02, opening a connection', () => {
  const OPENING = '02-02';
  const OUT_HEADER = 'Encabezado de ida';
  const BACK_HEADER = 'Encabezado de vuelta';
  const GREETING = 'Saludo de tres pasos';
  const FIRST_PORT = 51514;
  const SECOND_PORT = 51515;
  const MENTIONS_A_REASON = /stateful|stateless|recuerda|conversación|mismo camino|porque|ya que|por eso|permit|deja(?:n)? (?:pasar|entrar)|autoriz|revel|esconde|oculta/i;
  const RANGES_OF_PORTS = [/\d{4,5}\s*(?:-|–|—|a|al|hasta)\s*\d{4,5}/i, /entre\s+(?:el\s+)?\d{4,5}\s+y\s+(?:el\s+)?\d{4,5}/i, /\b(?:32768|49152|60999|61000|65535)\b/];
  const start = startSession(INCIDENTS, OPENING);
  const app = sending(start, MESSAGE.ncApp.id);
  const both = sending(app, MESSAGE.ncDatabase.id);
  const givesARange = (text: string): boolean => RANGES_OF_PORTS.some((range) => range.test(text));

  it('02-02: the header of the nc shows the source port 51514 and the destination port 3000', () => {
    expect(app.sent[0].trace.header?.request).toMatchObject({ sourcePort: FIRST_PORT, destinationPort: PORT.app });
    expect(lastBox(app)[OUT_HEADER]).toEqual([`${IP.you}:${FIRST_PORT} → ${IP.lucia}:${PORT.app}`, 'TTL al salir: 64']);
    expect(Object.keys(lastBox(app))).not.toContain('Puerto de origen');
  });

  it('02-02: the second nc leaves from 51515', () => {
    expect(both.sent.map(({ trace }) => trace.header?.request.sourcePort)).toEqual([FIRST_PORT, SECOND_PORT]);
    expect(lastBox(both)[OUT_HEADER]).toEqual([`${IP.you}:${SECOND_PORT} → ${IP.lucia}:${PORT.database}`, 'TTL al salir: 64']);
  });

  it('02-02: the reply header swaps the ports', () => {
    expect(app.sent[0].trace.header?.reply).toMatchObject({ sourcePort: PORT.app, destinationPort: FIRST_PORT });
    expect(lastBox(app)[BACK_HEADER]).toEqual([`${IP.lucia}:${PORT.app} → ${IP.you}:${FIRST_PORT}`]);
    expect(lastBox(both)[BACK_HEADER]).toEqual([`${IP.lucia}:${PORT.database} → ${IP.you}:${SECOND_PORT}`]);
  });

  it('02-02: the box lists the greeting in three steps', () => {
    const [you, lucia] = [DEVICE.you.name, DEVICE.lucia.name];
    expect(lastBox(app)[GREETING]).toEqual([`1. SYN, de ${you} a ${lucia}`, `2. SYN-ACK, de ${lucia} a ${you}`, `3. ACK, de ${you} a ${lucia}`]);
    expect(lastBox(both)[GREETING]).toHaveLength(3);
  });

  it('02-02: both connections must open to close the incident', () => {
    expect(stillOpen(start)).toEqual([TASK.openApp, TASK.openDatabase]);
    expect(stillOpen(app)).toEqual([TASK.openDatabase]);
    expect(stillOpen(sending(app, MESSAGE.ncApp.id))).toEqual([TASK.openDatabase]);
    expect(stillOpen(sending(start, MESSAGE.ncDatabase.id))).toEqual([TASK.openApp]);
    expect(stillOpen(both)).toEqual([]);
    expect(starsOf(sessionReducer(both, { type: 'submit' }))).toMatchObject({ closed: true, middle: true });
  });

  it('02-02: no text gives a range of ephemeral ports as a number', () => {
    expect(['de 49152 a 65535', 'entre 32768 y 60999', '32768-60999', 'del 49152 al 65535', 'hasta el 65535'].filter((text) => !givesARange(text))).toEqual([]);
    expect(['TCP 51514 → 3000', `${IP.you}:${FIRST_PORT} → ${IP.lucia}:${PORT.app}`, 'el 3000 y el 5432', 'el 51514 y el 51515'].filter(givesARange)).toEqual([]);
    expect(everythingRead(both).filter(givesARange)).toEqual([]);
    expect(everythingRead(both).filter((text) => /rango|intervalo/i.test(text) && /\d{4,5}/.test(text))).toEqual([]);
  });

  it('02-02: no text says why the reply is let through', () => {
    expect(['La respuesta vuelve porque el firewall recuerda la conversación.', 'Es stateful.', 'Vuelve por el mismo camino.'].filter((text) => !MENTIONS_A_REASON.test(text))).toEqual([]);
    expect(everythingRead(both).filter((text) => MENTIONS_A_REASON.test(text))).toEqual([]);
    expect(everythingRead(both).filter((text) => /firewall/i.test(text))).toEqual([]);
  });

  it('02-02: introduces client and server, tcp, connection, greeting, source port and ephemeral port, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[OPENING]));
    expect(sorted(introduces)).toEqual(sorted(['client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, OPENING))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });

  it('02-02: the header of the answer shows the port of the service at 02-01 and waits for source-port to show the one of the client', () => {
    const before = sending(startSession(INCIDENTS, '02-01'), MESSAGE.ncApp.id);
    expect(before.known.has('source-port')).toBe(false);
    expect(lastBox(before)[BACK_HEADER]).toEqual([`${IP.lucia}:${PORT.app} → ${IP.you}`]);
    expect(lastBox(before)['Encabezado de ida']).toEqual([`${IP.you} → ${IP.lucia}:${PORT.app}`, 'TTL al salir: 64']);
    expect(lastBox(app)[BACK_HEADER]).toEqual([`${IP.lucia}:${PORT.app} → ${IP.you}:${FIRST_PORT}`]);
  });
});

describe('02-03, refused or silent', () => {
  const REFUSED_OR_SILENT = '02-03';
  const NCAT_REFUSED = 'Ncat: Connection refused.';
  const NCAT_TIMEOUT = 'Ncat: TIMEOUT.';
  const GREETING = 'Saludo de tres pasos';
  const WHERE_IT_STOPPED = 'Dónde y por qué se detuvo';
  const SENTENCES = /(?<=[.!?])\s+/;
  const ANOTHER_ADDRESS = /127\.0\.0\.1|dirección de escucha|otra IP|otra dirección/i;
  const CONTRASTS = /\bpero\b|en cambio|\bno es\b|\bno era\b|\bsí\b/i;
  const MENTIONS_A_REPLY_REASON = /stateful|stateless|recuerda|conversación|mismo camino|deja(?:n)? (?:pasar|volver|entrar la respuesta)/i;
  const start = startSession(INCIDENTS, REFUSED_OR_SILENT);
  const fromYou = (session: Session, toId: string, messageId: string): Session => sendingFrom(session, ORIGIN.you.id, toId, messageId);
  const fromLucia = (session: Session, toId: string, messageId: string): Session => sendingFrom(session, ORIGIN.lucia.id, toId, messageId);
  const closedPort = fromYou(start, ADDRESS.lucia.id, MESSAGE.ncMysql.id);
  const filteredPort = fromYou(start, ADDRESS.marta.id, MESSAGE.ncApp.id);
  const wrongAddress = fromYou(start, ADDRESS.lucia.id, MESSAGE.ncApp.id);
  const ownMachine = fromLucia(start, ADDRESS.loopback.id, MESSAGE.ncApp.id);
  const listensOnEveryIp = (session: Session): Session => sessionReducer(session, { type: 'setSetting', deviceId: DEVICE.lucia.id, settingId: APP_LISTEN.setting, chipId: APP_LISTEN.all });
  const lastRun = (session: Session) => session.sent.at(-1)!;
  const stopOf = (session: Session) => lastRun(session).trace.steps.at(-1)?.reason;
  const equatesClosedPortAndAnotherAddress = (text: string): boolean => text.split(SENTENCES).some((sentence) => /cerrado/i.test(sentence) && ANOTHER_ADDRESS.test(sentence) && !CONTRASTS.test(sentence));
  const everySend = [closedPort, filteredPort, wrongAddress, ownMachine].reduce((all, session) => ({ ...all, sent: [...all.sent, ...session.sent] }), start);

  it('02-03: nc to a port nobody listens on is refused by laptop-lucia', () => {
    const run = lastRun(closedPort);
    expect(run.trace.outcome).toBe('refused');
    expect(run.by).toEqual([DEVICE.lucia.id]);
    expect(stopOf(closedPort)).toMatchObject({ code: 'host-refused', deviceId: DEVICE.lucia.id, port: PORT.mysql });
    expect(stillOpen(closedPort)).toEqual([TASK.filteredPort, TASK.ownMachine, TASK.fromTheNetwork]);
    expect(printedFrom(closedPort, ORIGIN.you.id, ADDRESS.lucia.id, MESSAGE.ncMysql.id)).toEqual(['Ncat: Version 7.93 ( https://nmap.org/ncat )', NCAT_REFUSED]);
  });

  it('02-03: the nc to laptop-marta is silent and its firewall is named as the one that dropped it', () => {
    const run = lastRun(filteredPort);
    expect(run.trace.outcome).toBe('timeout');
    expect(run.by).toEqual([FIREWALL.marta]);
    expect(stopOf(filteredPort)).toMatchObject({ code: 'firewall-in-drop', deviceId: DEVICE.marta.id });
    expect(lastBox(filteredPort)[WHERE_IT_STOPPED]).toEqual([`Se queda en el firewall de ${DEVICE.marta.name}: ninguna regla lo deja entrar.`]);
    expect(stillOpen(filteredPort)).toEqual([TASK.closedPort, TASK.ownMachine, TASK.fromTheNetwork]);
    expect(printedFrom(filteredPort, ORIGIN.you.id, ADDRESS.marta.id, MESSAGE.ncApp.id)).toEqual(['Ncat: Version 7.93 ( https://nmap.org/ncat )', NCAT_TIMEOUT]);
  });

  it('02-03: the nc from laptop-lucia to 127.0.0.1 comes back', () => {
    const run = lastRun(ownMachine);
    expect(run.trace.outcome).toBe('replied');
    expect(run.by).toEqual([DEVICE.lucia.id]);
    expect(stillOpen(ownMachine)).toEqual([TASK.closedPort, TASK.filteredPort, TASK.fromTheNetwork]);
    expect(printedFrom(ownMachine, ORIGIN.lucia.id, ADDRESS.loopback.id, MESSAGE.ncApp.id)[1]).toBe(`Ncat: Connected to ${IP.loopback}:${PORT.app}.`);
  });

  it('02-03: the nc from tu-laptop to port 3000 is refused while the app listens only on 127.0.0.1', () => {
    expect(lastRun(wrongAddress).trace.outcome).toBe('refused');
    expect(stopOf(wrongAddress)).toMatchObject({ code: 'host-wrong-address', deviceId: DEVICE.lucia.id, port: PORT.app, ip: IP.lucia });
    expect(stillOpen(wrongAddress)).toContain(TASK.fromTheNetwork);
    expect(lastBox(wrongAddress)[WHERE_IT_STOPPED]).toEqual([
      `Llega, pero ${DEVICE.lucia.name} lo rechaza. El servicio del puerto ${PORT.app} tiene como dirección de escucha ${IP.loopback}, y el paquete va a ${IP.lucia}.`,
    ]);
    expect(printedFrom(wrongAddress, ORIGIN.you.id, ADDRESS.lucia.id, MESSAGE.ncApp.id)[1]).toBe(NCAT_REFUSED);
  });

  it('02-03: choosing Todas las IPs in the services card of laptop-lucia makes the nc come back', () => {
    const services = (session: Session) => servicesCard(session, PIECE_ID.device(DEVICE.lucia.id));
    expect(services(start)?.services.map(({ picked }) => picked)).toEqual([APP_LISTEN.loopback]);
    const fixed = listensOnEveryIp(wrongAddress);
    expect(services(fixed)?.services.map(({ picked }) => picked)).toEqual([APP_LISTEN.all]);
    expect(fixed.world.devices.find((device) => device.id === DEVICE.lucia.id)?.host.services).toEqual([
      { protocol: 'tcp', port: PORT.app, listen: 'all' },
      { protocol: 'tcp', port: PORT.database, listen: 'all' },
    ]);
    expect(fixed.sent).toEqual([]);
    const comes = fromYou(fixed, ADDRESS.lucia.id, MESSAGE.ncApp.id);
    expect(lastRun(comes).trace.outcome).toBe('replied');
    expect(stillOpen(comes)).toEqual([TASK.closedPort, TASK.filteredPort, TASK.ownMachine]);
    expect(lastRun(fromYou(fixed, ADDRESS.lucia.id, MESSAGE.ncMysql.id)).trace.outcome).toBe('refused');
  });

  it('02-03: a pick of the listen address clears the stamps of before, so the four sends are made after it', () => {
    const before = fromLucia(fromYou(fromYou(closedPort, ADDRESS.marta.id, MESSAGE.ncApp.id), ADDRESS.lucia.id, MESSAGE.ncApp.id), ADDRESS.loopback.id, MESSAGE.ncApp.id);
    expect(stillOpen(before)).toEqual([TASK.fromTheNetwork]);
    expect(stillOpen(listensOnEveryIp(before))).toEqual([TASK.closedPort, TASK.filteredPort, TASK.ownMachine, TASK.fromTheNetwork]);
    const done = fromYou(fromLucia(fromYou(fromYou(listensOnEveryIp(start), ADDRESS.lucia.id, MESSAGE.ncMysql.id), ADDRESS.marta.id, MESSAGE.ncApp.id), ADDRESS.loopback.id, MESSAGE.ncApp.id), ADDRESS.lucia.id, MESSAGE.ncApp.id);
    expectClosed(done);
  });

  it('02-03: the report names laptop-lucia', () => {
    const { report } = start.incident;
    expect(report).toContain(`[[${DEVICE.lucia.name}]]`);
    expect(plain(report)).toMatch(new RegExp(`^Lucía reinició su app en ${DEVICE.lucia.name}\\. Ahora la app solo escucha en ${IP.loopback}`));
    expect(changedNames(solvedWorld(INCIDENTS, '02-02'), startWorld(INCIDENTS, REFUSED_OR_SILENT))).toEqual([DEVICE.lucia.name]);
  });

  it('02-03: a refusal and a silence leave different stamps', () => {
    const [refused, silent] = [lastRun(closedPort), lastRun(filteredPort)];
    expect([refused.reached, refused.blocked, refused.warning]).toEqual([true, false, null]);
    expect([silent.reached, silent.blocked, silent.warning]).toEqual([false, true, null]);
    expect(lastBox(closedPort)[GREETING]).toEqual([`1. SYN, de ${DEVICE.you.name} a ${DEVICE.lucia.name}`, `2. RST, de ${DEVICE.lucia.name} a ${DEVICE.you.name}`]);
    expect(lastBox(wrongAddress)[GREETING]).toEqual([`1. SYN, de ${DEVICE.you.name} a ${DEVICE.lucia.name}`, `2. RST, de ${DEVICE.lucia.name} a ${DEVICE.you.name}`]);
    expect(lastBox(filteredPort)[GREETING]).toEqual([`1. SYN, de ${DEVICE.you.name} a ${DEVICE.marta.name}`]);
  });

  it('02-03: no text says that a closed port and a service on another address are the same', () => {
    expect(['Es un puerto cerrado porque la app solo escucha en 127.0.0.1.', 'Un puerto cerrado y una dirección de escucha distinta son lo mismo.'].filter((text) => !equatesClosedPortAndAnotherAddress(text))).toEqual([]);
    expect(['El 3306 es un puerto cerrado. La app escucha en 127.0.0.1.', 'Aquí no es un puerto cerrado: la app escucha en 127.0.0.1.', 'Un puerto cerrado no tiene servicio, pero esta app sí escucha en 127.0.0.1.'].filter(equatesClosedPortAndAnotherAddress)).toEqual([]);
    expect(everythingRead(everySend).filter(equatesClosedPortAndAnotherAddress)).toEqual([]);
  });

  it('02-03: no text says why a reply comes back', () => {
    expect(['El firewall deja pasar la respuesta.', 'Es stateful.', 'Vuelve por el mismo camino.', 'Recuerda la conversación.'].filter((text) => !MENTIONS_A_REPLY_REASON.test(text))).toEqual([]);
    expect(everythingRead(everySend).filter((text) => MENTIONS_A_REPLY_REASON.test(text))).toEqual([]);
  });

  it('02-03: the services card opens from the label of laptop-lucia', () => {
    const lucia = pieceCard(start, PIECE_ID.device(DEVICE.lucia.id));
    expect(lucia).toMatchObject({ tabbed: true, first: 'terminal' });
    expect(lucia?.tabs.map(({ id }) => id)).toEqual(['terminal', 'services']);
    const services = lucia?.tabs.find(({ id }) => id === 'services');
    expect(services?.card).toMatchObject({ deviceId: DEVICE.lucia.id, pieceId: PIECE_ID.device(DEVICE.lucia.id) });
    expect(plain((services?.card as { title: string }).title)).toBe(`Servicios de ${DEVICE.lucia.name}`);
    expect(pieceViews(start).filter((piece) => piece.kind === 'device' && plain(piece.label) === DEVICE.lucia.name)).toHaveLength(1);
    expect(pieceCard(start, PIECE_ID.device(DEVICE.you.id))).toMatchObject({ tabbed: false });
    expect(pieceCard(start, PIECE_ID.device(DEVICE.marta.id))).toBeNull();
  });

  it('02-03: draws tu-laptop, laptop-lucia and laptop-marta and the firewalls that two of them have', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    expect(drawn.sort()).toEqual([`device:${DEVICE.lucia.name}`, `device:${DEVICE.marta.name}`, `device:${DEVICE.you.name}`, `firewall:firewall ${DEVICE.marta.name}`, `firewall:firewall ${DEVICE.you.name}`]);
    expect(start.incident.shown).toEqual(REFUSAL_PIECES);
  });

  it('02-03: the right option is the third and is not the longest of the three', () => {
    expect(optionsOf(start.incident)).toHaveLength(3);
    expect(rightOptionPlace(start.incident)).toBe(2);
    expect(rightOptionIsTheLongest(start.incident)).toBe(false);
  });

  it('02-03: introduces closed port, RST, Connection refused, filtered port and listen address, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[REFUSED_OR_SILENT]));
    expect(sorted(introduces)).toEqual(sorted(['closed-port', 'rst', 'connection-refused', 'filtered-port', 'listen-address']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, REFUSED_OR_SILENT))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-04, is it in my block', () => {
  const IN_MY_BLOCK = '02-04';
  const SMALL_BLOCK = '192.168.1.0/28';
  const SINGLE_IP_BLOCK = '192.168.1.0/32';
  const YOUR_IP_BITS = [192, 168, 1, 10];
  const start = startSession(INCIDENTS, IN_MY_BLOCK);
  const answering = (session: Session, deviceId: string, picks: Record<string, string>): Session => sessionReducer(session, { type: 'answerCard', deviceId, picks });
  const youAnswer = (session: Session, block: string, mask: string): Session => answering(session, DEVICE.you.id, { [BLOCK_CARD.block.tray]: block, [BLOCK_CARD.mask.tray]: mask });
  const placing = (session: Session, deviceId: string, bin: string): Session => answering(session, deviceId, { [BLOCK_CARD.bin.tray]: bin });
  const youRight = youAnswer(start, BLOCK_CARD.block.right, BLOCK_CARD.mask.right);
  const printerInside = placing(youRight, DEVICE.printer.id, BLOCK_CARD.bin.inside);
  const solved = placing(printerInside, DEVICE.andres.id, BLOCK_CARD.bin.outside);
  const classify = (session: Session) => classifyCard(session, PIECE_ID.device(DEVICE.you.id));
  const insideBlock = (session: Session): string[] => pieceViews(session).filter((piece) => piece.insideBlock).map((piece) => piece.id);
  const linesOfChip = (trayId: string, chipId: string): string[] =>
    (identifyCard(start, PIECE_ID.device(DEVICE.you.id))?.trays.find((tray) => tray.id === trayId)?.chips.find((chip) => chip.id === chipId)?.lines ?? []).map(plain);
  const itemLine = (session: Session, deviceId: string) => {
    const card = classify(session);
    return [...(card?.bins ?? []).flatMap((bin) => bin.items), ...(card?.waiting ?? [])].find((item) => item.deviceId === deviceId)?.line ?? null;
  };

  it('02-04: the four answers close the incident', () => {
    expect(stillOpen(start)).toEqual([TASK.block, TASK.mask, TASK.printerInside, TASK.andresOutside]);
    expect(stillOpen(youAnswer(start, BLOCK_CARD.block.small, BLOCK_CARD.mask.wide))).toEqual([TASK.block, TASK.mask, TASK.printerInside, TASK.andresOutside]);
    expect(stillOpen(youRight)).toEqual([TASK.printerInside, TASK.andresOutside]);
    expect(stillOpen(printerInside)).toEqual([TASK.andresOutside]);
    expect(stillOpen(placing(youRight, DEVICE.andres.id, BLOCK_CARD.bin.outside))).toEqual([TASK.printerInside]);
    expectClosed(solved);
  });

  it('02-04: 192.168.1.0/28 says the printer does not fit and 192.168.1.0/32 says it is one IP', () => {
    const [small, single] = [BLOCK_CARD.block.small, BLOCK_CARD.block.single].map((chip) => linesOfChip(BLOCK_CARD.block.tray, chip).join(' '));
    expect(small).toContain(`hasta ${SMALL_BLOCK.replace('0/28', '15')}`);
    expect(small).toContain(`${DEVICE.printer.name}, ${IP.printer}`);
    expect(small).toMatch(/no cabe/);
    expect(single).toMatch(/una sola IP/);
    expect(single).toContain(SINGLE_IP_BLOCK.slice(0, -3));
    expect(linesOfChip(BLOCK_CARD.mask.tray, BLOCK_CARD.mask.wide).join(' ')).toContain('/16');
    expect(linesOfChip(BLOCK_CARD.mask.tray, BLOCK_CARD.mask.single).join(' ')).toContain('/32');
    const trays = identifyCard(start, PIECE_ID.device(DEVICE.you.id))?.trays ?? [];
    expect(trays.find((tray) => tray.id === BLOCK_CARD.block.tray)?.chips.map((chip) => plain(chip.label))).toEqual([BLOCK.cidr, SMALL_BLOCK, SINGLE_IP_BLOCK]);
    expect(trays.find((tray) => tray.id === BLOCK_CARD.mask.tray)?.chips.map((chip) => plain(chip.label))).toEqual([BLOCK.mask, '255.255.0.0', '255.255.255.255']);
  });

  it('02-04: nothing travels and the incident has no flows', () => {
    expect(start.incident.mechanic).toBe('identify');
    expect(start.incident.flows).toEqual([]);
    expect([start.runs, start.sent, solved.runs, solved.sent]).toEqual([[], [], [], []]);
    expect(pieceCard(start, PIECE_ID.device(DEVICE.you.id))?.tabs.map(({ id }) => id)).toEqual(['identify', 'classify']);
    expect(startWorld(INCIDENTS, IN_MY_BLOCK)).toEqual(solvedWorld(INCIDENTS, '02-03'));
  });

  it('02-04: the card of tu-laptop shows its IP in 32 bits with the first 24 marked as the block', () => {
    const card = classify(start);
    expect([card?.block, card?.mask, card?.prefix, card?.ownerIp]).toEqual([BLOCK.cidr, BLOCK.mask, 24, IP.you]);
    expect(card?.mask).toBe(maskOf(24));
    expect(card?.numbers.map(({ decimal }) => decimal)).toEqual(YOUR_IP_BITS);
    expect(card?.numbers.flatMap(({ bits }) => bits)).toHaveLength(32);
    expect(card?.numbers.flatMap(({ bits }) => bits).map(({ fixed }) => fixed)).toEqual([...Array(24).fill(true), ...Array(8).fill(false)]);
    expect(card?.waiting.map((item) => [item.name, item.ip, item.split])).toEqual([
      [`[[${DEVICE.printer.name}]]`, IP.printer, { block: '192.168.1.', device: '21' }],
      [`[[${DEVICE.andres.name}]]`, IP.andres, { block: '192.168.2.', device: '15' }],
    ]);
    expect(card?.bins.map((bin) => [bin.name, bin.items])).toEqual([[`Dentro de ${BLOCK.cidr}`, []], ['Fuera', []]]);
    expect(pieceCard(start, PIECE_ID.device(DEVICE.printer.id))).toBeNull();
    expect(pieceCard(start, PIECE_ID.device(DEVICE.andres.id))).toBeNull();
  });

  it('02-04: the printer placed inside and laptop-andres placed outside close the incident, and placed the other way each line says why', () => {
    expect([itemLine(printerInside, DEVICE.printer.id)?.fits, itemLine(printerInside, DEVICE.printer.id)?.right]).toEqual([true, true]);
    expect(plain(itemLine(printerInside, DEVICE.printer.id)?.text ?? '')).toBe('Sus tres primeros números, 192.168.1, son los del bloque: cabe.');
    expect([itemLine(solved, DEVICE.andres.id)?.fits, itemLine(solved, DEVICE.andres.id)?.right]).toEqual([false, true]);
    expect(plain(itemLine(solved, DEVICE.andres.id)?.text ?? '')).toBe('Sus tres primeros números, 192.168.2, no son 192.168.1: no cabe.');
    const wrong = placing(placing(youRight, DEVICE.printer.id, BLOCK_CARD.bin.outside), DEVICE.andres.id, BLOCK_CARD.bin.inside);
    expect([itemLine(wrong, DEVICE.printer.id)?.fits, itemLine(wrong, DEVICE.printer.id)?.right]).toEqual([true, false]);
    expect(plain(itemLine(wrong, DEVICE.printer.id)?.text ?? '')).toContain('cabe');
    expect([itemLine(wrong, DEVICE.andres.id)?.fits, itemLine(wrong, DEVICE.andres.id)?.right]).toEqual([false, false]);
    expect(stillOpen(wrong)).toEqual([TASK.printerInside, TASK.andresOutside]);
    expect(placing(solved, DEVICE.printer.id, BLOCK_CARD.bin.outside).answers[DEVICE.printer.id]).toEqual({ [BLOCK_CARD.bin.tray]: BLOCK_CARD.bin.outside });
  });

  it('02-04: the outline of the block surrounds tu-laptop at the start and the printer once it is placed inside', () => {
    expect(insideBlock(start)).toEqual([PIECE_ID.device(DEVICE.you.id)]);
    expect(insideBlock(printerInside)).toEqual([PIECE_ID.device(DEVICE.you.id), PIECE_ID.device(DEVICE.printer.id)]);
    expect(insideBlock(solved)).toEqual(insideBlock(printerInside));
    expect(insideBlock(placing(solved, DEVICE.printer.id, BLOCK_CARD.bin.outside))).toEqual([PIECE_ID.device(DEVICE.you.id)]);
    expect(insideBlock(placing(youRight, DEVICE.andres.id, BLOCK_CARD.bin.inside))).toEqual([PIECE_ID.device(DEVICE.you.id), PIECE_ID.device(DEVICE.andres.id)]);
  });

  it('02-04: the map writes the block beside the outline, and only an incident with a card that classifies has one', () => {
    expect(classifiedBlock(start)).toBe(BLOCK.cidr);
    expect(classifiedBlock(solved)).toBe(BLOCK.cidr);
    expect(classifiedBlock(startSession(INCIDENTS, '02-03'))).toBeNull();
    expect(classifiedBlock(startSession(INCIDENTS, '02-05'))).toBeNull();
  });

  it('02-04: draws tu-laptop, the printer, laptop-andres and router-oficina', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    expect(drawn.sort()).toEqual([`device:${DEVICE.printer.name}`, `device:${DEVICE.andres.name}`, `device:${DEVICE.you.name}`, `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`].sort());
    expect(start.incident.shown).toEqual(FLOORS_PIECES);
  });

  it('02-04: the right option is the second and is not the longest of the three', () => {
    expect(optionsOf(start.incident)).toHaveLength(3);
    expect(rightOptionPlace(start.incident)).toBe(1);
    expect(rightOptionIsTheLongest(start.incident)).toBe(false);
  });

  it('02-04: introduces bit, prefix, CIDR and subnet mask, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[IN_MY_BLOCK]));
    expect(sorted(introduces)).toEqual(sorted(['bit', 'prefix', 'cidr', 'subnet-mask']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, IN_MY_BLOCK))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-05, the whole rule', () => {
  const WHOLE_RULE = '02-05';
  const WELL_KNOWN_RANGE = '1-1023';
  const BATTERY_PORTS = [PORT.ssh, PORT.web, PORT.secureWeb, PORT.mysql, PORT.database];
  const ABOUT_PORT_ZERO = /puerto 0\b|\bcero\b|\b0-1023\b|\b0 al 1023\b|del 0\b|reservado/i;
  const A_WELL_KNOWN_PORT = /conocid/i;
  const start = startSession(INCIDENTS, WHOLE_RULE);
  const filterChips = (): { what: { id: string; what: { kind: string; fromPort?: number; toPort?: number }; label: string }[] } => {
    const { incident } = start;
    if (incident.mechanic !== 'filter') throw new Error('02-05 is a filter incident');
    return { what: incident.chips.what };
  };
  const placing = (session: Session, whatId: string, fromId: string): Session => sessionReducer(session, { type: 'placeRule', firewallId: FIREWALL.lucia, whatId, fromId });
  const expectedFlows = [SSH_FLOW.you.packet, SSH_FLOW.background.packet];
  const prose = (incident: Incident): string[] => [
    incident.report,
    ...(isGuided(incident) ? [...incident.tasks.map(({ text }) => text), ...incident.hints, ...(incident.question ? [incident.question] : []), ...incident.explanation.flatMap(({ text, feedback }) => [text, feedback])] : []),
    incident.takeaway,
  ].map(plain);
  const callsItWellKnown = (text: string): boolean => text.split(/(?<=[.!?])\s+/).some((sentence) => /\b(?:3306|5432)\b/.test(sentence) && A_WELL_KNOWN_PORT.test(sentence));
  const onlyYouOnSsh = placing(start, SSH_WHAT.ssh.id, SSH_FROM.you.id);

  it('02-05: TCP 22 from tu-laptop closes the incident and earns the middle star', () => {
    expect(stillOpen(start)).toEqual([TASK.sshOnlyYou]);
    expect(isIntruding(start)).toBe(false);
    expectClosed(onlyYouOnSsh);
    expect(isIntruding(onlyYouOnSsh)).toBe(false);
    expect(onlyYouOnSsh.world.firewalls.find(({ id }) => id === FIREWALL.lucia)?.inbound).toHaveLength(1);
  });

  it('02-05: Cualquier IP de origen lets the visit in and raises the intruder alert', () => {
    for (const from of [SSH_FROM.anyone, SSH_FROM.floor]) {
      const letsItIn = placing(start, SSH_WHAT.ssh.id, from.id);
      expect(isIntruding(letsItIn), plain(from.label)).toBe(true);
      expect(stillOpen(letsItIn), plain(from.label)).toEqual([TASK.sshOnlyYou]);
      expect(sessionReducer(letsItIn, { type: 'submit' }).rejection).toMatchObject({ failingTaskIds: [TASK.sshOnlyYou], intruding: true });
      expect(pieceViews(letsItIn).filter((piece) => piece.state === 'intruded').map((piece) => plain(piece.label))).toEqual([DEVICE.lucia.name]);
    }
  });

  it('02-05: every port range chip that opens more than 22 is caught by the probe battery', () => {
    const ranges = filterChips().what.filter((chip) => chip.what.kind === 'tcp');
    expect(ranges.map((chip) => plain(chip.label))).toEqual(['TCP · 22', 'TCP · 80', 'TCP · 1-1023', 'TCP · 0-65535']);
    for (const chip of ranges) {
      const { fromPort = 0, toPort = 0 } = chip.what;
      expect(BATTERY_PORTS.filter((port) => port >= fromPort && port <= toPort).length, plain(chip.label)).toBeGreaterThan(0);
      const opened = extraOpenings(placing(start, chip.id, SSH_FROM.you.id).world, expectedFlows);
      const exact = chip.id === SSH_WHAT.ssh.id;
      expect(opened.length === 0, plain(chip.label)).toBe(exact);
      if (!exact) expect(starsOf(sessionReducer(placing(start, chip.id, SSH_FROM.you.id), { type: 'submit' })).middle, plain(chip.label)).toBe(false);
    }
    expect(extraOpenings(placing(start, SSH_WHAT.wellKnown.id, SSH_FROM.you.id).world, expectedFlows).map((probe) => probe.port)).toEqual([PORT.web, PORT.secureWeb]);
  });

  it('02-05: the chips offer no udp and no port 53', () => {
    const { what } = filterChips();
    expect(what.map((chip) => chip.what.kind).filter((kind) => kind === 'udp')).toEqual([]);
    expect(what.filter((chip) => chip.what.fromPort === PORT.dns && chip.what.toPort === PORT.dns)).toEqual([]);
    expect(what.map((chip) => plain(chip.label)).filter((label) => /udp|\b53\b/i.test(label))).toEqual([]);
    expect(prose(start.incident).filter((text) => /udp|\b53\b|dns/i.test(text))).toEqual([]);
  });

  it('02-05: the text that names the range 1-1023 calls it the well-known ports and says nothing about port 0', () => {
    const naming = prose(start.incident).filter((text) => text.includes(WELL_KNOWN_RANGE));
    expect(naming.length).toBeGreaterThan(0);
    expect(naming.filter((text) => !/puertos conocidos/i.test(text))).toEqual([]);
    expect(prose(start.incident).filter((text) => ABOUT_PORT_ZERO.test(text))).toEqual([]);
    expect(['El rango 1-1023 son los puertos conocidos.', 'El rango 1-1023 es amplio.'].filter((text) => text.includes(WELL_KNOWN_RANGE) && !/puertos conocidos/i.test(text))).toEqual(['El rango 1-1023 es amplio.']);
    expect(['Los puertos conocidos van del 0 al 1023.', 'El puerto 0 está reservado.'].filter((text) => ABOUT_PORT_ZERO.test(text))).toHaveLength(2);
  });

  it('02-05: no text calls the port 3306 or the port 5432 a well-known port', () => {
    expect(['El 3306 es un puerto conocido.', 'El 22, el 80 y el 5432 son puertos conocidos.'].filter(callsItWellKnown)).toHaveLength(2);
    expect(['El 3306 y el 5432 son puertos por defecto.', 'El 22 es un puerto conocido.'].filter(callsItWellKnown)).toEqual([]);
    expect(everythingRead(onlyYouOnSsh).filter(callsItWellKnown)).toEqual([]);
    expect(prose(start.incident).filter(callsItWellKnown)).toEqual([]);
  });

  it('02-05: the report names laptop-lucia', () => {
    const { report } = start.incident;
    expect(report).toContain(`[[${DEVICE.lucia.name}]]`);
    expect(plain(report)).toMatch(new RegExp(`^Lucía activó SSH en ${DEVICE.lucia.name} y puso un firewall que no deja entrar nada\\.`));
    expect(changedNames(solvedWorld(INCIDENTS, '02-04'), startWorld(INCIDENTS, WHOLE_RULE))).toEqual([DEVICE.lucia.name]);
  });

  it('02-05: draws tu-laptop, laptop-lucia, laptop-marta and laptop-visita, with the firewalls of the three that have one', () => {
    const drawn = pieceViews(start).map((piece) => `${piece.kind}:${plain(piece.label)}`);
    const names = [DEVICE.you.name, DEVICE.lucia.name, DEVICE.marta.name, DEVICE.visitor.name];
    expect(drawn.sort()).toEqual([...names.map((name) => `device:${name}`), ...names.slice(0, 3).map((name) => `firewall:firewall ${name}`)].sort());
    expect(start.incident.shown).toEqual(SSH_PIECES);
  });

  it('02-05: the flows are the SSH of your laptop, which is required, the SSH of the visitor, which is forbidden, and the ping of the rule of 01-12, which goes on in the background', () => {
    expect(start.incident.flows.map((flow) => [flow.kind, flow.packet.protocol, flow.packet.port])).toEqual([['required', 'tcp', PORT.ssh], ['forbidden', 'tcp', PORT.ssh], ['ambient', 'icmp', undefined]]);
    expect(start.incident.flows[2].packet).toMatchObject({ from: { id: DEVICE.lucia.id }, to: IP.marta });
    expect(isGuided(start.incident) && start.incident.tasks.flatMap((task) => ('flowIds' in task ? task.flowIds : []))).toEqual([SSH_FLOW.you.id, SSH_FLOW.visitor.id]);
    expect(pieceViews(start).filter((piece) => piece.state === 'intruded')).toEqual([]);
  });

  it('02-05: the right option is the first and is not the longest of the three', () => {
    expect(optionsOf(start.incident)).toHaveLength(3);
    expect(rightOptionPlace(start.incident)).toBe(0);
    expect(rightOptionIsTheLongest(start.incident)).toBe(false);
  });

  it('02-05: introduces port range, SSH, default port and well-known ports, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[WHOLE_RULE]));
    expect(sorted(introduces)).toEqual(sorted(['port-range', 'ssh', 'default-port', 'well-known-ports']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, WHOLE_RULE))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-06, your routing table', () => {
  const YOUR_ROUTES = '02-06';
  const ROUTE_USED = 'Ruta que usó';
  const ANYWHERE = '0.0.0.0/0';
  const SENTENCES = /(?<=[.!?])\s+/;
  const start = startSession(INCIDENTS, YOUR_ROUTES);
  const pinging = (session: Session, toId: string): Session => sendingFrom(session, ORIGIN.you.id, toId, MESSAGE.ping.id);
  const toPrinter = pinging(start, ADDRESS.printer.id);
  const toAndres = pinging(start, ADDRESS.andres.id);
  const both = pinging(toPrinter, ADDRESS.andres.id);
  const routesOf = (session: Session, pieceId: string): TableCard | undefined => pieceCard(session, pieceId)?.tabs.find((tab) => tab.id === 'routes')?.card as TableCard | undefined;
  const yourRoutes = (session: Session) => routesOf(session, PIECE_ID.device(DEVICE.you.id));
  const rowsOf = (card: TableCard | undefined) => (card?.rows ?? []).map((row) => ({ destination: plain(row.cells[0].text), outlet: plain(row.cells[1].text), inUse: row.inUse }));
  it('02-06: a ping to the printer uses the connected route and a ping to laptop-andres uses the default route', () => {
    expect(toPrinter.sent[0].trace.routes?.[0]).toMatchObject({ holderId: DEVICE.you.id, kind: 'connected', route: { to: BLOCK.cidr } });
    expect(toAndres.sent[0].trace.routes?.[0]).toMatchObject({ holderId: DEVICE.you.id, kind: 'default', route: { to: 'default', via: IP.router } });
    expect(toAndres.sent[0].trace.routes?.[1]).toMatchObject({ holderId: ROUTER.office.id, kind: 'connected' });
    expect(rowsOf(yourRoutes(start))).toEqual([
      { destination: BLOCK.cidr, outlet: 'directo', inUse: false },
      { destination: ANYWHERE, outlet: `${IP.router} ${ROUTER.office.name}`, inUse: false },
    ]);
    expect(rowsOf(yourRoutes(toPrinter)).map(({ inUse }) => inUse)).toEqual([true, false]);
    expect(rowsOf(yourRoutes(toAndres)).map(({ inUse }) => inUse)).toEqual([false, true]);
    expect(stillOpen(start)).toEqual([TASK.printerPing, TASK.andresPing]);
    expect(stillOpen(toPrinter)).toEqual([TASK.andresPing]);
    expect(stillOpen(toAndres)).toEqual([TASK.printerPing]);
    expectClosed(both);
  });

  it('02-06: the box says which route the ping used', () => {
    expect(lastBox(toPrinter)[ROUTE_USED]).toEqual([`${DEVICE.you.name}: ${BLOCK.cidr} · ruta de red conectada · directo`]);
    expect(lastBox(toAndres)[ROUTE_USED]).toEqual([
      `${DEVICE.you.name}: ${ANYWHERE} · ruta por defecto · sale por ${IP.router}`,
      `${ROUTER.office.name}: ${IP.andres.replace(/\d+$/, '0')}/24 · ruta de red conectada · directo`,
    ]);
    expect(Object.values(lastBox(toAndres)).flat().filter((line) => /siguiente salto|más específica/i.test(line))).toEqual([]);
  });

  it('02-06: the routes card of tu-laptop is read only', () => {
    const yours = pieceCard(start, PIECE_ID.device(DEVICE.you.id));
    expect(yours).toMatchObject({ tabbed: true, first: 'terminal' });
    expect(yours?.tabs.map(({ id }) => id)).toEqual(['terminal', 'routes']);
    for (const session of [start, toAndres]) {
      const card = yourRoutes(session);
      expect(plain(card?.title ?? '')).toBe(`Tabla de rutas de ${DEVICE.you.name}`);
      expect(card).toMatchObject({ kind: 'routes', tableId: null, trays: null, add: null, problem: null });
      expect(card?.rows.map(({ entryId }) => entryId)).toEqual([null, null]);
    }
    const router = routesOf(start, PIECE_ID.router(ROUTER.office.id));
    expect([router?.tableId, router?.trays, router?.add]).toEqual([null, null, null]);
    const refused = sessionReducer(start, routeMove(OFFICE_ROUTES.to.anywhere, OFFICE_ROUTES.via.provider));
    expect(refused.world).toEqual(start.world);
  });

  it('02-06: the text of 0.0.0.0/0 in a route says it is what no other route covers', () => {
    const sentences = incidentTexts(start.incident).map(plain).flatMap((text) => text.split(SENTENCES)).filter((sentence) => sentence.includes(ANYWHERE));
    expect(sentences.length).toBeGreaterThan(1);
    const inARoute = sentences.filter((sentence) => !/regla|firewall/i.test(sentence));
    expect(inARoute.length).toBeGreaterThan(0);
    expect(inARoute.filter((sentence) => !/ninguna otra ruta cubre/i.test(sentence))).toEqual([]);
    expect(sentences.filter((sentence) => /regla|firewall/i.test(sentence)).filter((sentence) => !/cualquier origen/i.test(sentence))).toEqual([]);
    expect(incidentTexts(start.incident).map(plain).filter((text) => /cualquier origen/i.test(text) && !/regla|firewall/i.test(text))).toEqual([]);
  });

  it('02-06: the world does not change and the incident draws tu-laptop, the printer, laptop-andres and router-oficina', () => {
    expect(startWorld(INCIDENTS, YOUR_ROUTES)).toEqual(solvedWorld(INCIDENTS, '02-05'));
    expect(drawnLabels(start)).toEqual([`device:${DEVICE.printer.name}`, `device:${DEVICE.andres.name}`, `device:${DEVICE.you.name}`, `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`]);
    expect(start.incident.shown).toEqual(FLOORS_PIECES);
  });

  it('02-06: the right option is the third and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 2);
  });

  it('02-06: introduces route, routing table, connected route and default route, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[YOUR_ROUTES]));
    expect(sorted(introduces)).toEqual(sorted(['route', 'routing-table', 'connected-route', 'default-route']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, YOUR_ROUTES))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-07, a way to the other office', () => {
  const WAY = '02-07';
  const WHERE_IT_STOPPED = 'Dónde y por qué se detuvo';
  const ROUTE_USED = 'Ruta que usó';
  const ANYWHERE_ROW = '0.0.0.0/0';
  const start = startSession(INCIDENTS, WAY);
  const pinging = (session: Session, address: { id: string }): Session => sendingFrom(session, ORIGIN.you.id, address.id, MESSAGE.ping.id);
  const onlyDefault = sessionReducer(start, routeMove(OFFICE_ROUTES.to.anywhere, OFFICE_ROUTES.via.provider));
  const wayToTheOffice = sessionReducer(onlyDefault, routeMove(OFFICE_ROUTES.to.otherOffice, OFFICE_ROUTES.via.branch));
  const everyAddress = [ADDRESS.server, ADDRESS.otherOffice, ADDRESS.otherLaptop];
  const solved = everyAddress.reduce(pinging, wayToTheOffice);
  const lastRun = (session: Session) => session.sent.at(-1)!;
  const stopOf = (session: Session) => lastRun(session).trace.steps.find((step) => step.verdict === 'drop')?.reason;
  const tableOf = (session: Session): TableCard | undefined => pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'routes')?.card as TableCard | undefined;
  const ownRows = (session: Session) => (tableOf(session)?.rows ?? []).filter((row) => row.entryId !== null).map((row) => `${plain(row.cells[0].text)} → ${plain(row.cells[1].text)}`);
  const outcomes = (session: Session) => session.sent.map((run) => [run.trace.outcome, run.warning?.term ?? null, run.by]);

  it('02-07: with no routes router-oficina warns Destination Net Unreachable', () => {
    for (const address of everyAddress) {
      const run = lastRun(pinging(start, address));
      expect(run.trace.outcome, address.id).toBe('unreachable');
      expect(run.trace.notice, address.id).toMatchObject({ kind: 'net-unreachable', fromId: ROUTER.office.id, fromIp: IP.router });
      expect(run.warning, address.id).toEqual({ term: 'net-unreachable', by: 'router' });
      expect(run.by, address.id).toEqual([ROUTER.office.id]);
    }
    expect(lastBox(pinging(start, ADDRESS.server))[WHERE_IT_STOPPED]).toEqual([`${ROUTER.office.name} no sabe a qué router mandar un paquete para ${IP.server}: lo descarta y avisa a quien lo envió que no pudo entregarlo.`]);
    expect(stillOpen(everyAddress.reduce(pinging, start))).toEqual([TASK.serverPing, TASK.branchPrinterPing, TASK.branchLaptopPing]);
    expect(ownRows(start)).toEqual([]);
  });

  it('02-07: with only the default route the ping to 10.0.0.10 dies in silence at router-proveedor, as in 01-08', () => {
    const toTheOffice = pinging(onlyDefault, ADDRESS.otherOffice);
    const run = lastRun(toTheOffice);
    expect([run.trace.outcome, run.trace.notice, run.warning, run.reached]).toEqual(['timeout', undefined, null, false]);
    expect(stopOf(toTheOffice)).toMatchObject({ code: 'forward-private-dropped', routerId: ROUTER.provider.id, ip: IP.otherOfficePrinter });
    expect(lastBox(toTheOffice)[WHERE_IT_STOPPED]).toEqual([`${IP.otherOfficePrinter} es una IP privada: se repite en muchas redes y internet no la entrega. ${ROUTER.provider.name}, ya fuera de la oficina, descartó el paquete y no avisó.`]);
    expect(stopOf(pinging(onlyDefault, ADDRESS.otherLaptop))).toMatchObject({ code: 'forward-private-dropped', routerId: ROUTER.provider.id });
    expect(lastRun(pinging(onlyDefault, ADDRESS.server)).trace.outcome).toBe('replied');
    expect(ownRows(onlyDefault)).toEqual([`${ANYWHERE_ROW} → ${IP.provider} ${ROUTER.provider.name}`]);
  });

  it('02-07: 10.0.0.0/16 to router-sucursal and 0.0.0.0/0 to router-proveedor close the incident', () => {
    expect(ownRows(wayToTheOffice)).toEqual([`${ANYWHERE_ROW} → ${IP.provider} ${ROUTER.provider.name}`, `${BRANCH_LAN.cidr} → ${IP.branchLink} ${ROUTER.branch.name}`]);
    expect(outcomes(solved)).toEqual([['replied', null, [SERVER.internet.id]], ['replied', null, [DEVICE.branchPrinter.id]], ['replied', null, [DEVICE.branchLaptop.id]]]);
    expectClosed(solved);
    expect(lastBox(pinging(wayToTheOffice, ADDRESS.otherOffice))[ROUTE_USED]).toEqual([
      `${DEVICE.you.name}: ${ANYWHERE_ROW} · ruta por defecto · siguiente salto ${IP.router}`,
      `${ROUTER.office.name}: ${BRANCH_LAN.cidr} · ruta · siguiente salto ${IP.branchLink} · es la más específica: también cubría ${ANYWHERE_ROW}`,
      `${ROUTER.branch.name}: ${BRANCH_LAN.cidr} · ruta de red conectada · directo`,
    ]);
    expect(pinging(wayToTheOffice, ADDRESS.otherOffice).sent[0].trace.routes?.[1]).toMatchObject({ holderId: ROUTER.office.id, route: { to: BRANCH_LAN.cidr }, kind: 'static', alsoCovered: [{ to: 'default', kind: 'default' }] });
  });

  it('02-07: 10.0.0.10/32 leaves 10.0.0.20 without a way and 0.0.0.0/0 to router-sucursal leaves the server without a way', () => {
    const justThePrinter = sessionReducer(onlyDefault, routeMove(OFFICE_ROUTES.to.printer, OFFICE_ROUTES.via.branch));
    const [toPrinter, toLaptop] = [ADDRESS.otherOffice, ADDRESS.otherLaptop].map((address) => pinging(justThePrinter, address));
    expect(lastRun(toPrinter).trace.outcome).toBe('replied');
    expect([lastRun(toLaptop).trace.outcome, lastRun(toLaptop).warning, stopOf(toLaptop)?.code]).toEqual(['timeout', null, 'forward-private-dropped']);
    expect(stillOpen(everyAddress.reduce(pinging, justThePrinter))).toEqual([TASK.branchLaptopPing]);
    const everythingToTheBranch = sessionReducer(start, routeMove(OFFICE_ROUTES.to.anywhere, OFFICE_ROUTES.via.branch));
    const toTheServer = pinging(everythingToTheBranch, ADDRESS.server);
    expect(lastRun(toTheServer).trace.notice).toMatchObject({ kind: 'net-unreachable', fromId: ROUTER.branch.id });
    expect(lastRun(toTheServer).warning).toEqual({ term: 'net-unreachable', by: 'router' });
    expect(stillOpen(everyAddress.reduce(pinging, everythingToTheBranch))).toEqual([TASK.serverPing]);
    expect(lastRun(pinging(everythingToTheBranch, ADDRESS.otherOffice)).trace.outcome).toBe('replied');
  });

  it('02-07: the report names router-oficina and no router of the provider that the map does not draw', () => {
    const { report } = start.incident;
    expect(report).toContain(`[[${ROUTER.office.name}]]`);
    expect(plain(report)).toMatch(new RegExp(`^Alguien reinició ${ROUTER.office.name} y perdió sus rutas`));
    expect(changedNames(solvedWorld(INCIDENTS, '02-06'), startWorld(INCIDENTS, WAY))).toEqual([ROUTER.office.name]);
    const undrawn = Object.values(ROUTER).filter(({ id }) => !ROUTES_PIECES.includes(id));
    expect(undrawn.map(({ name }) => name)).toEqual([ROUTER.destination.name]);
    expect(everythingRead(solved).filter((text) => undrawn.some(({ name }) => text.includes(name)))).toEqual([]);
    expect(everythingRead(pinging(onlyDefault, ADDRESS.server)).filter((text) => text.includes(ROUTER.destination.name))).toEqual([]);
  });

  it('02-07: no router that stayed silent in 01-08 warns now', () => {
    const wasSilentInChapter1 = startSession(INCIDENTS, '01-08');
    for (const address of [ADDRESS.server, ADDRESS.otherOffice]) {
      const before = lastRun(sendingFrom(wasSilentInChapter1, ORIGIN.you.id, address.id, MESSAGE.ping.id));
      const now = lastRun(pinging(onlyDefault, address));
      expect([now.trace.outcome, now.warning, now.by, now.trace.notice]).toEqual([before.trace.outcome, before.warning, before.by, before.trace.notice]);
      expect(now.trace.steps.find((step) => step.verdict === 'drop')?.reason.code).toBe(before.trace.steps.find((step) => step.verdict === 'drop')?.reason.code);
    }
    const everyRun = [...solved.sent, ...everyAddress.map((address) => lastRun(pinging(onlyDefault, address)))];
    expect(everyRun.filter((run) => run.warning !== null)).toEqual([]);
    expect(startWorld(INCIDENTS, WAY).routers?.find((router) => router.id === ROUTER.provider.id)).toEqual(startWorld(INCIDENTS, '01-14').routers?.find((router) => router.id === ROUTER.provider.id));
  });

  it('02-07: the table of router-oficina accepts one route per destination', () => {
    const again = sessionReducer(onlyDefault, routeMove(OFFICE_ROUTES.to.anywhere, OFFICE_ROUTES.via.branch));
    expect(again.world).toEqual(onlyDefault.world);
    expect(again.entryProblem).toMatchObject({ tableId: OFFICE_ROUTES.table, code: 'destination-has-route' });
    expect(plain(tableOf(again)?.problem ?? '')).toContain('una sola ruta por destino');
    expect(ownRows(again)).toEqual(ownRows(onlyDefault));
    const card = tableOf(start);
    expect(card).toMatchObject({ tableId: OFFICE_ROUTES.table });
    expect(card?.trays?.map(({ name }) => name)).toEqual(['destination', 'nextHop']);
    expect(card?.columns.map(({ label }) => plain(label))).toEqual(['Destino', 'Siguiente salto']);
    expect(pieceCard(start, PIECE_ID.router(ROUTER.office.id))).toMatchObject({ tabbed: false, first: 'routes' });
    expect(pieceCard(start, PIECE_ID.device(DEVICE.you.id))?.tabs.map(({ id }) => id)).toEqual(['terminal', 'routes']);
  });

  it('02-07: the other office, its router and the lost routes make a valid world and nothing else changes', () => {
    const before = solvedWorld(INCIDENTS, '02-06');
    const after = startWorld(INCIDENTS, WAY);
    expect(networkSchema.safeParse(after).error).toBeUndefined();
    expect(OTHER_OFFICE.map(({ type }) => type)).toEqual(['addLan', 'addDevice', 'addDevice', 'addRouter']);
    expect(ROUTES_LOST).toMatchObject({ type: 'updateRouter', routerId: ROUTER.office.id, routes: [] });
    const router = (id: string) => after.routers?.find((candidate) => candidate.id === id);
    expect(router(ROUTER.office.id)?.routes).toEqual([]);
    expect(router(ROUTER.office.id)?.interfaces.map(({ ip, faces }) => `${ip}>${faces}`)).toEqual([`${IP.router}>floor-1`, `${IP.routerSecondFloor}>floor-2`, `${IP.officeUplink}>${ROUTER.provider.id}`, `${IP.officeLink}>${ROUTER.branch.id}`]);
    expect(router(ROUTER.branch.id)?.interfaces.map(({ ip, faces }) => `${ip}>${faces}`)).toEqual([`${IP.branchRouter}>${BRANCH_LAN.id}`, `${IP.branchLink}>${ROUTER.office.id}`]);
    expect(router(ROUTER.branch.id)?.routes).toEqual([{ to: '192.168.0.0/16', next: ROUTER.office.id }]);
    expect(after.devices.filter((device) => device.lanId === BRANCH_LAN.id).map(({ name, privateIp, gateway }) => [name, privateIp, gateway])).toEqual([
      [DEVICE.branchPrinter.name, IP.otherOfficePrinter, IP.branchRouter],
      [DEVICE.branchLaptop.name, IP.otherOfficeLaptop, IP.branchRouter],
    ]);
    expect({ ...after, devices: before.devices, lans: before.lans, routers: before.routers }).toEqual(before);
    expect(router(ROUTER.provider.id)).toEqual(before.routers?.find((candidate) => candidate.id === ROUTER.provider.id));
  });

  it('02-07: draws the eight pieces of the way and no other', () => {
    const names = [DEVICE.you.name, DEVICE.branchPrinter.name, DEVICE.branchLaptop.name, SERVER.internet.name];
    const routers = [ROUTER.office.name, ROUTER.provider.name, ROUTER.branch.name];
    expect(drawnLabels(start)).toEqual([...names.map((name) => `device:${name}`), ...routers.map((name) => `edge:${name}`), `firewall:firewall ${DEVICE.you.name}`, 'internet:internet'].sort());
    expect(start.incident.shown).toEqual(ROUTES_PIECES);
    const ids = [...startWorld(INCIDENTS, WAY).devices.map(({ id }) => id), ...(startWorld(INCIDENTS, WAY).routers ?? []).map(({ id }) => id), ...startWorld(INCIDENTS, WAY).actors.map(({ id }) => id)];
    expect(ROUTES_PIECES.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('02-07: the right option is the second and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 1);
  });

  it('02-07: introduces next hop, Destination Net Unreachable and most specific route, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[WAY]));
    expect(sorted(introduces)).toEqual(sorted(['next-hop', 'net-unreachable', 'most-specific-route']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, WAY))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-08, one address for the whole office', () => {
  const ONE_ADDRESS = '02-08';
  const LOCAL_HEADER = 'Encabezado de ida (en tu red local)';
  const INTERNET_HEADER = 'Encabezado de ida (en internet)';
  const INTERNET_BACK_HEADER = 'Encabezado de vuelta (en internet)';
  const TRANSLATION = 'Traducción';
  const HEADER_CHANGES_NOTE = /el encabezado cambia/i;
  const FIRST_PORT = 51514;
  const FIRST_PUBLIC_PORT = 40001;
  const SECOND_PUBLIC_PORT = 40002;
  const A_REASON_FOR_THE_REPLY = /stateful|stateless|recuerda|conversación|mismo camino|deja(?:n)? (?:pasar|volver|entrar la respuesta)|porque la respuesta|por eso vuelve|por eso[^.]*\bvolv/i;
  const start = startSession(INCIDENTS, ONE_ADDRESS);
  const webFrom = (session: Session, origin: { id: string }): Session => sendingFrom(session, origin.id, ADDRESS.server.id, MESSAGE.ncWeb.id);
  const pinging = (session: Session): Session => sendingFrom(session, ORIGIN.you.id, ADDRESS.server.id, MESSAGE.ping.id);
  const fromYou = webFrom(start, ORIGIN.you);
  const both = webFrom(fromYou, ORIGIN.lucia);
  const translationsOf = (session: Session): TableCard | undefined => pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'translations')?.card as TableCard | undefined;
  const rowsOf = (session: Session) => (translationsOf(session)?.rows ?? []).map((row) => row.cells.map((cell) => plain(cell.text)));
  const routerOf = (world: Network) => world.routers?.find((router) => router.id === ROUTER.office.id);

  it('02-08: two laptops with the same source port get two public ports and the table lists both rows', () => {
    expect(both.sent.map(({ trace }) => trace.header?.request.sourcePort)).toEqual([FIRST_PORT, FIRST_PORT]);
    expect(both.sent.map(({ trace }) => [trace.translation?.outside.ip, trace.translation?.outside.port])).toEqual([[IP.officeUplink, FIRST_PUBLIC_PORT], [IP.officeUplink, SECOND_PUBLIC_PORT]]);
    expect(both.sent.map(({ trace }) => trace.translation?.isNew)).toEqual([true, true]);
    expect(rowsOf(both)).toEqual([
      ['TCP', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`],
      ['TCP', `${IP.lucia}:${FIRST_PORT}`, `${IP.officeUplink}:${SECOND_PUBLIC_PORT}`],
    ]);
    expect(translationsOf(both)?.columns.map(({ label }) => plain(label))).toEqual(['Protocolo', 'IP:puerto privado', 'IP:puerto público']);
    expect(translationsOf(both)).toMatchObject({ kind: 'translations', tableId: null, trays: null, add: null });
    expect(translationsOf(both)?.rows.map(({ inUse }) => inUse)).toEqual([false, true]);
    expect(rowsOf(start)).toEqual([]);
    expect(stillOpen(start)).toEqual([TASK.webFromYou, TASK.webFromLucia]);
    expect(stillOpen(fromYou)).toEqual([TASK.webFromLucia]);
    expect(stillOpen(webFrom(start, ORIGIN.lucia))).toEqual([TASK.webFromYou]);
    expectClosed(both);
  });

  it('02-08: the box shows the header in the local network and the header in the internet', () => {
    const yours = lastBox(fromYou);
    expect(yours[LOCAL_HEADER]).toEqual([`${IP.you}:${FIRST_PORT} → ${IP.server}:${PORT.web}`, 'TTL al salir: 64']);
    expect(yours[INTERNET_HEADER]).toEqual([`${IP.officeUplink}:${FIRST_PUBLIC_PORT} → ${IP.server}:${PORT.web}`]);
    expect(yours[INTERNET_BACK_HEADER]).toEqual([`${IP.server}:${PORT.web} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT}`]);
    expect(yours[TRANSLATION]).toEqual([
      `${IP.you}:${FIRST_PORT} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT}`,
      'Cambió la IP y el puerto de origen (traducción de puertos).',
      'Es una fila nueva de la tabla de traducciones.',
    ]);
    const hers = lastBox(both);
    expect(hers[LOCAL_HEADER]).toEqual([`${IP.lucia}:${FIRST_PORT} → ${IP.server}:${PORT.web}`, 'TTL al salir: 64']);
    expect(hers[INTERNET_HEADER]).toEqual([`${IP.officeUplink}:${SECOND_PUBLIC_PORT} → ${IP.server}:${PORT.web}`]);
    expect(hers[INTERNET_BACK_HEADER]).toEqual([`${IP.server}:${PORT.web} → ${IP.officeUplink}:${SECOND_PUBLIC_PORT}`]);
    expect(hers[TRANSLATION][0]).toBe(`${IP.lucia}:${FIRST_PORT} → ${IP.officeUplink}:${SECOND_PUBLIC_PORT}`);
  });

  it('02-08: the note that the header changes outside the office is gone', () => {
    const before = startSession(INCIDENTS, '02-07');
    const withWays = [routeMove(OFFICE_ROUTES.to.anywhere, OFFICE_ROUTES.via.provider)].reduce(sessionReducer, before);
    const oldNote = boxTexts(sendingFrom(withWays, ORIGIN.you.id, ADDRESS.server.id, MESSAGE.ping.id));
    expect(oldNote.filter((text) => HEADER_CHANGES_NOTE.test(text))).toHaveLength(1);
    expect(boxTexts(both).filter((text) => HEADER_CHANGES_NOTE.test(text))).toEqual([]);
    expect(boxTexts(pinging(both)).filter((text) => HEADER_CHANGES_NOTE.test(text))).toEqual([]);
    expect(everythingRead(both).filter((text) => HEADER_CHANGES_NOTE.test(text))).toEqual([]);
  });

  it('02-08: the report says router-oficina did this since the office reached the internet and changes nothing in the world', () => {
    const { report } = start.incident;
    const before = solvedWorld(INCIDENTS, '02-07');
    const after = startWorld(INCIDENTS, ONE_ADDRESS);
    expect(report).toContain(`[[${ROUTER.office.name}]]`);
    expect(plain(report)).toMatch(/desde que la oficina salió a internet/);
    expect(plain(report)).toMatch(/no es un cambio nuevo, solo que el mapa no lo mostraba/);
    expect(routerOf(after)).toEqual(routerOf(before));
    expect(after.routers).toEqual(before.routers);
    expect({ ...after, actors: before.actors }).toEqual(before);
    expect(after.actors.filter((actor, index) => actor !== before.actors[index]).map(({ id }) => id)).toEqual([SERVER.internet.id]);
    expect(report).toContain(`[[${SERVER.internet.name}]]`);
    expect(changedNames(before, after)).toEqual([SERVER.internet.name]);
    expect(networkSchema.safeParse(after).error).toBeUndefined();
  });

  it('01-08 still says the header changes outside the office and does not name NAT', () => {
    const chapterOne = startSession(INCIDENTS, '01-08');
    const toTheServer = sendingFrom(chapterOne, ORIGIN.you.id, ADDRESS.server.id, MESSAGE.ping.id);
    expect(['nat', 'napt', 'translation-table'].filter((term) => chapterOne.known.has(term as TermId))).toEqual([]);
    expect(boxTexts(toTheServer).filter((text) => HEADER_CHANGES_NOTE.test(text))).toHaveLength(1);
    expect(boxTexts(toTheServer).filter((text) => /\bNAT\b|pública/.test(text))).toEqual([]);
    expect(Object.keys(lastBox(toTheServer)).filter((label) => /\(en internet\)|Traducción/.test(label))).toEqual([]);
    expect(incidentTexts(chapterOne.incident).map(plain).filter((text) => /\bNAT\b|traducción/i.test(text))).toEqual([]);
    expect(INCIDENTS.map(({ id }) => id)).toContain(ONE_ADDRESS);
  });

  it('02-08: a ping from tu-laptop to the server still comes back and leaves no row', () => {
    const pinged = pinging(start);
    expect(pinged.sent[0].replied).toBe(true);
    expect(pinged.sent[0].trace.translation).toMatchObject({ protocol: 'icmp', outside: { ip: IP.officeUplink }, isNew: false });
    expect(pinged.sent[0].trace.translation?.outside.port).toBeUndefined();
    expect(rowsOf(pinged)).toEqual([]);
    expect(lastBox(pinged)[TRANSLATION]).toEqual([`${IP.you} → ${IP.officeUplink}`, 'ICMP no usa puertos: en el juego solo cambia la IP de origen.']);
    expect(stillOpen(pinged)).toEqual([TASK.webFromYou, TASK.webFromLucia]);
    expect(rowsOf(pinging(both))).toEqual(rowsOf(both));
    expect(rowsOf(webFrom(pinged, ORIGIN.you))[0]).toEqual(['TCP', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`]);
  });

  it('02-08: a second nc of the same laptop leaves from the next source port and makes a row of its own, and the public ports follow the order of the sends', () => {
    const again = webFrom(fromYou, ORIGIN.you);
    expect(again.history.map(({ trace }) => trace.header?.request.sourcePort)).toEqual([FIRST_PORT, FIRST_PORT + 1]);
    expect(rowsOf(again)).toEqual([
      ['TCP', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`],
      ['TCP', `${IP.you}:${FIRST_PORT + 1}`, `${IP.officeUplink}:${SECOND_PUBLIC_PORT}`],
    ]);
    const luciaFirst = webFrom(webFrom(start, ORIGIN.lucia), ORIGIN.you);
    expect(rowsOf(luciaFirst)).toEqual([
      ['TCP', `${IP.lucia}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`],
      ['TCP', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${SECOND_PUBLIC_PORT}`],
    ]);
  });

  it('02-08: no text gives a reason for the reply to come back beyond its row, and the numbers are said to be the game\'s', () => {
    expect(['La respuesta vuelve porque el router recuerda la conversación.', 'Es stateful.', 'Por eso el ping a servidor-internet de antes volvía: ya salía traducido.'].filter((text) => !A_REASON_FOR_THE_REPLY.test(text))).toEqual([]);
    expect(everythingRead(both).filter((text) => A_REASON_FOR_THE_REPLY.test(text))).toEqual([]);
    const takeaway = plain(start.incident.takeaway);
    expect(takeaway).toMatch(/Los números 40001 y 40002 son de este juego: otros NAT eligen otros\./);
    expect(takeaway).toMatch(/En un NAT real, las filas caducan; aquí no\./);
    expect(takeaway).toMatch(/ICMP no usa puertos, así que en esta tabla no deja fila\./);
    expect(takeaway).toMatch(/Un NAT real traduce además el identificador del Echo Request, un número del mensaje, y el juego no lo muestra\./);
    expect(takeaway).toMatch(/El ping a servidor-internet de antes también salía traducido\./);
    expect(takeaway).not.toMatch(/por eso/i);
  });

  it('02-08: the takeaway says a public IP has a limited number of ports and that the game does not reach the limit, with no figure', () => {
    const takeaway = plain(start.incident.takeaway);
    expect(takeaway).toContain('En un NAT real, las filas caducan; aquí no. Una IP pública tiene un número limitado de puertos, y este juego no llega a ese límite. Un ping también sale con la IP cambiada.');
    const sentence = takeaway.split(/(?<=[.!?])\s+/).find((candidate) => /número limitado de puertos/.test(candidate));
    expect(sentence).toBeDefined();
    expect(sentence).not.toMatch(/\d/);
    expect(['public-ip', 'port'].filter((term) => !knownTerms(INCIDENTS, ONE_ADDRESS).has(term as TermId))).toEqual([]);
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, ONE_ADDRESS))).toEqual([]);
  });

  it('02-08: names no router the map does not draw, in any text, box or table', () => {
    const undrawn = Object.values(ROUTER).filter(({ id }) => !TRANSLATION_PIECES.includes(id));
    expect(undrawn.map(({ name }) => name)).toEqual([ROUTER.provider.name, ROUTER.destination.name, ROUTER.branch.name]);
    const cards = [translationsOf(both), pieceCard(both, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'routes')?.card as TableCard | undefined];
    const tables = cards.flatMap((card) => (card?.rows ?? []).flatMap((row) => row.cells.map((cell) => plain(cell.text))));
    expect(tables.length).toBeGreaterThan(0);
    expect([...everythingRead(pinging(both)), ...tables].filter((text) => undrawn.some(({ name }) => text.includes(name)))).toEqual([]);
  });

  it('02-08: draws tu-laptop, laptop-lucia, router-oficina, the globe and servidor-internet', () => {
    const names = [DEVICE.you.name, DEVICE.lucia.name, SERVER.internet.name];
    expect(drawnLabels(start)).toEqual([...names.map((name) => `device:${name}`), `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`, `firewall:firewall ${DEVICE.lucia.name}`, 'internet:internet'].sort());
    expect(start.incident.shown).toEqual(TRANSLATION_PIECES);
    const world = startWorld(INCIDENTS, ONE_ADDRESS);
    const ids = [...world.devices.map(({ id }) => id), ...(world.routers ?? []).map(({ id }) => id), ...world.actors.map(({ id }) => id)];
    expect(TRANSLATION_PIECES.filter((id) => !ids.includes(id))).toEqual([]);
  });

  it('02-08: the card of router-oficina has its routes tab first and the translations tab, and its report says which one to open', () => {
    const card = pieceCard(start, PIECE_ID.router(ROUTER.office.id));
    expect(card).toMatchObject({ tabbed: true, first: 'routes' });
    expect(card?.tabs.map(({ id }) => id)).toEqual(['routes', 'translations']);
    expect(plain(translationsOf(start)?.title ?? '')).toBe(`Tabla de traducciones de ${ROUTER.office.name}`);
    expect(plain(start.incident.report)).toContain('abre router-oficina y su pestaña «Tabla de traducciones»');
  });

  it('02-08: the right option is the first and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 0);
  });

  it('02-08: introduces NAT, port translation and translation table, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[ONE_ADDRESS]));
    expect(sorted(introduces)).toEqual(sorted(['nat', 'napt', 'translation-table']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, ONE_ADDRESS))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-09, from outside', () => {
  const FROM_OUTSIDE = '02-09';
  const WHERE_IT_STOPPED = 'Dónde y por qué se detuvo';
  const TRANSLATION = 'Traducción';
  const NCAT_BANNER = 'Ncat: Version 7.93 ( https://nmap.org/ncat )';
  const NAT_ACTS = /\bNAT\b(?:(?!\bno\b)[^.])*?\b(?:bloquea\w*|filtra\w*|protege\w*|es un firewall)/i;
  const SENTENCES = /(?<=[.!?])\s+/;
  const start = startSession(INCIDENTS, FROM_OUTSIDE);
  const fromHome = (session: Session, messageId: string): Session => sendingFrom(session, ORIGIN.home.id, ADDRESS.officePublic.id, messageId);
  const unmapped = fromHome(start, MESSAGE.ncUnmapped.id);
  const forwarded = fromHome(start, MESSAGE.ncApp.id);
  const both = fromHome(unmapped, MESSAGE.ncApp.id);
  const lastRun = (session: Session) => session.sent.at(-1)!;
  const translationsOf = (session: Session): TableCard | undefined => pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'translations')?.card as TableCard | undefined;
  const FIXED_ROW = ['TCP · fija', `${IP.andres}:${PORT.app}`, `${IP.officeUplink}:${PORT.app}`];
  const tableOf = (session: Session) => (translationsOf(session)?.rows ?? []).map((row) => row.cells.map((cell) => plain(cell.text)));
  const rowsInUse = (session: Session) => (translationsOf(session)?.rows ?? []).map(({ inUse }) => inUse);
  const prose = (incident: Incident): string[] => incidentTexts(incident).map(plain);
  const declaredWrong = (incident: Incident): string[] => optionsOf(incident).filter(({ correct }) => !correct).map(({ text }) => plain(text));
  const sayingNatActs = (texts: string[]): string[] => texts.flatMap((text) => text.split(SENTENCES)).filter((sentence) => NAT_ACTS.test(sentence));

  it('02-09: a packet to the public IP on a port with no row is not delivered to any device', () => {
    const run = lastRun(unmapped);
    expect(run.trace.outcome).toBe('timeout');
    expect([run.trace.destinationId, run.reached, run.replied, run.warning, run.trace.notice]).toEqual([null, false, false, null, undefined]);
    expect(run.by).toEqual([ROUTER.office.id]);
    expect(run.trace.steps.at(-1)?.reason).toMatchObject({ code: 'nat-no-translation', routerId: ROUTER.office.id, port: PORT.unmapped, ip: IP.officeUplink });
    expect(run.trace.translation).toBeUndefined();
    expect(lastBox(unmapped)[WHERE_IT_STOPPED]).toEqual([`${ROUTER.office.name} no tiene ninguna fila en su tabla de traducciones para el puerto ${PORT.unmapped} de ${IP.officeUplink} (TCP). No sabe a qué dispositivo entregar el paquete: no lo entrega a nadie.`]);
    expect(printedFrom(unmapped, ORIGIN.home.id, ADDRESS.officePublic.id, MESSAGE.ncUnmapped.id)).toEqual([NCAT_BANNER, 'Ncat: TIMEOUT.']);
    expect(stillOpen(start)).toEqual([TASK.unsolicited, TASK.forwarded]);
    expect(stillOpen(unmapped)).toEqual([TASK.forwarded]);
    expect(tableOf(unmapped)).toEqual([FIXED_ROW]);
    expect(rowsInUse(unmapped)).toEqual([false]);
  });

  it('02-09: the forward delivers to laptop-andres and nothing stops it', () => {
    const run = lastRun(forwarded);
    expect(run.trace.outcome).toBe('replied');
    expect([run.trace.destinationId, run.by, run.replied]).toEqual([DEVICE.andres.id, [DEVICE.andres.id], true]);
    expect(run.trace.translation).toMatchObject({ protocol: 'tcp', fixed: true, isNew: false, inside: { ip: IP.andres, port: PORT.app }, outside: { ip: IP.officeUplink, port: PORT.app } });
    expect(run.trace.steps.map(({ reason }) => reason.code)).toEqual(['nat-forwarded', 'forward-hop', 'host-accepts', 'reply-stateful']);
    expect(run.trace.steps.filter((step) => step.verdict === 'drop')).toEqual([]);
    expect(startWorld(INCIDENTS, FROM_OUTSIDE).devices.find((device) => device.id === DEVICE.andres.id)?.firewallIds).toEqual([]);
    expect(lastBox(forwarded)[TRANSLATION]).toEqual([`${IP.officeUplink}:${PORT.app} → ${IP.andres}:${PORT.app}`, 'Un reenvío de puertos lo entregó a ese dispositivo.']);
    expect(tableOf(forwarded)).toEqual([FIXED_ROW]);
    expect(rowsInUse(forwarded)).toEqual([true]);
    expect(stillOpen(forwarded)).toEqual([TASK.unsolicited]);
    expect(printedFrom(forwarded, ORIGIN.home.id, ADDRESS.officePublic.id, MESSAGE.ncApp.id)[1]).toBe(`Ncat: Connected to ${IP.officeUplink}:${PORT.app}.`);
    expectClosed(both);
  });

  it('02-09: no text says NAT blocks or filters', () => {
    const wrong = declaredWrong(start.incident);
    expect(sayingNatActs(['NAT bloquea todo lo que viene de afuera.', 'NAT es un firewall.', 'El NAT filtra los paquetes.', 'NAT no filtra.'])).toEqual([
      'NAT bloquea todo lo que viene de afuera.',
      'NAT es un firewall.',
      'El NAT filtra los paquetes.',
    ]);
    expect(wrong.filter((text) => sayingNatActs([text]).length > 0)).toHaveLength(1);
    const everyOther = [...prose(start.incident).filter((text) => !wrong.includes(text)), ...everythingRead(both).filter((text) => !wrong.includes(text))];
    expect(sayingNatActs(everyOther)).toEqual([]);
    expect(plain(start.incident.takeaway)).toMatch(/NAT traduce, no filtra: no da seguridad por sí solo\. Lo que decide qué entra es un firewall\./);
    expect(everythingRead(both).filter((text) => /\blo bloquea\b/i.test(text))).toEqual([]);
    expect(boxTexts(unmapped).filter((text) => /no lo entrega a nadie/.test(text))).toHaveLength(1);
    expect(plain(start.incident.takeaway)).toContain('no lo entrega a nadie');
  });

  it('02-09: the explanation of the right option says a real NAT may answer with a notice, but not before 6 seconds, and that nc gives up at 3', () => {
    const right = optionsOf(start.incident)[rightOptionPlace(start.incident)];
    expect(plain(right.feedback)).toContain('No lo entrega a nadie.');
    expect(plain(right.feedback)).toContain('Un NAT real puede contestar con un aviso, pero no antes de 6 segundos, y nc se rinde a los 3.');
    expect(terminalLine(start, { from: ORIGIN.home.id, to: ADDRESS.officePublic.id, message: MESSAGE.ncUnmapped.id })).toContain('-w 3');
    expect(prose(start.incident).filter((text) => /Port Unreachable|ICMP|\bsilencio\b|\bcalla\b/i.test(text))).toEqual([]);
  });

  it('02-09: the report names router-oficina and laptop-andres', () => {
    const { report } = start.incident;
    expect(report).toContain(`[[${ROUTER.office.name}]]`);
    expect(report).toContain(`[[${DEVICE.andres.name}]]`);
    expect(changedNames(solvedWorld(INCIDENTS, '02-08'), startWorld(INCIDENTS, FROM_OUTSIDE))).toEqual([DEVICE.andres.name, ROUTER.office.name]);
    expect(plain(report)).toMatch(/^casa-lucia es un cliente de internet: está fuera de la oficina, en 192\.0\.2\.77\./);
    expect(plain(report)).toContain('Eso es un reenvío de puertos.');
    expect(networkSchema.safeParse(startWorld(INCIDENTS, FROM_OUTSIDE)).error).toBeUndefined();
  });

  it('02-09: casa-lucia sends from its own piece, with a terminal and no other card', () => {
    const home = pieceCard(start, PIECE_ID.actor(CLIENT.home.id));
    expect(home).toMatchObject({ tabbed: false, first: 'terminal' });
    expect(home?.tabs.map(({ id }) => id)).toEqual(['terminal']);
    expect(terminalLine(start, { from: ORIGIN.home.id, to: ADDRESS.officePublic.id, message: MESSAGE.ncUnmapped.id })).toBe(`nc -vz -w 3 ${IP.officeUplink} ${PORT.unmapped}`);
    expect(pieceCard(start, PIECE_ID.device(DEVICE.andres.id))).toBeNull();
  });

  it('02-09: the forward is one fixed row on TCP 3000 of router-oficina and nothing else of the world changes', () => {
    const before = solvedWorld(INCIDENTS, '02-08');
    const after = startWorld(INCIDENTS, FROM_OUTSIDE);
    const router = after.routers?.find((candidate) => candidate.id === ROUTER.office.id);
    expect(router?.forwards).toEqual([{ protocol: 'tcp', publicPort: PORT.app, toDeviceId: DEVICE.andres.id, toPort: PORT.app }]);
    expect({ ...router, forwards: undefined }).toEqual({ ...before.routers?.find((candidate) => candidate.id === ROUTER.office.id), forwards: undefined });
    expect(after.devices.find((device) => device.id === DEVICE.andres.id)?.host.services).toEqual([{ protocol: 'tcp', port: PORT.app, listen: 'all' }]);
    expect(after.actors.map(({ id }) => id)).toEqual([...before.actors.map(({ id }) => id), CLIENT.home.id]);
    expect(after.actors.at(-1)).toMatchObject({ kind: 'home', ip: IP.home });
  });

  it('02-09: draws casa-lucia, router-oficina, laptop-andres and the globe', () => {
    expect(drawnLabels(start)).toEqual([`actor:${CLIENT.home.name}`, `device:${DEVICE.andres.name}`, `edge:${ROUTER.office.name}`, 'internet:internet'].sort());
    expect(start.incident.shown).toEqual(OUTSIDE_PIECES);
  });

  it('02-09: the right option is the third and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 2);
  });

  it('02-09: introduces port forwarding and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[FROM_OUTSIDE]));
    expect(sorted(introduces)).toEqual(['port-forwarding']);
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, FROM_OUTSIDE))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
  });
});

describe('02-10, asking for a name', () => {
  const ASKING = '02-10';
  const FIRST_PORT = 51514;
  const SECOND_PORT = 51515;
  const FIRST_PUBLIC_PORT = 40001;
  const SECOND_PUBLIC_PORT = 40002;
  const NETWORK_SETTINGS = 'Ajustes de red';
  const GREETING = 'Saludo de tres pasos';
  const DNS_FIELD = 'DNS';
  const EXCHANGE = 'Consulta y respuesta';
  const LOCAL_HEADER = 'Encabezado de ida (en tu red local)';
  const LOCAL_BACK_HEADER = 'Encabezado de vuelta (en tu red local)';
  const TRANSLATION = 'Traducción';
  const ICMP_HAS_NO_PORTS = 'ICMP no usa puertos: en el juego solo cambia la IP de origen.';
  const DNS_QUESTION_ROW = 'UDP · consulta DNS';
  const FIXED_ROW = ['TCP · fija', `${IP.andres}:${PORT.app}`, `${IP.officeUplink}:${PORT.app}`];
  const questionRow = (sourcePort: number, publicPort: number) => [DNS_QUESTION_ROW, `${IP.you}:${sourcePort}`, `${IP.officeUplink}:${publicPort}`];
  const FIRST_ROW = questionRow(FIRST_PORT, FIRST_PUBLIC_PORT);
  const SECOND_ROW = questionRow(SECOND_PORT, SECOND_PUBLIC_PORT);
  const ASKS_ONLY_ONCE = /una sola vez|solo una vez|una única vez|la única (?:consulta|pregunta)|una sola (?:consulta|pregunta)|solo una (?:consulta|pregunta)|pregunta (?:solo )?una vez/i;
  const start = startSession(INCIDENTS, ASKING);
  const askWith = (session: Session, messageId: string): Session => sendingFrom(session, ORIGIN.you.id, ADDRESS.www.id, messageId);
  const digged = askWith(start, MESSAGE.dig.id);
  const pinged = askWith(start, MESSAGE.ping.id);
  const digThenPing = askWith(digged, MESSAGE.ping.id);
  const pingThenDig = askWith(pinged, MESSAGE.dig.id);
  const lastRun = (session: Session) => session.sent.at(-1)!;
  const translationsOf = (session: Session): TableCard | undefined => pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'translations')?.card as TableCard | undefined;
  const tableOf = (session: Session) => (translationsOf(session)?.rows ?? []).map((row) => row.cells.map((cell) => plain(cell.text)));
  const portsOf = (session: Session) => drawnSends(session.sent).map(({ trace }) => trace.header?.request.sourcePort);
  const wholeWorld = (world: Network) => [...world.devices.map(({ id }) => id), ...(world.routers ?? []).map(({ id }) => id), ...world.actors.map(({ id }) => id)];

  it('02-10: dig sends one query by udp to port 53 of the resolver and gets one answer', () => {
    const run = lastRun(digged);
    expect(run.trace.outcome).toBe('replied');
    expect(run.trace.destinationId).toBe(SERVER.resolver.id);
    expect(run.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.resolver, sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(run.trace.header?.reply).toMatchObject({ source: IP.resolver, destination: IP.you, sourcePort: PORT.dns, destinationPort: FIRST_PORT });
    expect(run.packet).toMatchObject({ protocol: 'udp', port: PORT.dns });
    expect(run.trace.translation?.protocol).toBe('udp');
    expect(run.trace.exchange).toEqual([
      { from: 'client', kind: 'query' },
      { from: 'server', kind: 'response' },
    ]);
    expect(run.trace.dns).toMatchObject({ name: HOSTNAME.www, status: 'NOERROR', viaDig: true, usedHostsFile: false });
    expect(run.trace.question).toBeUndefined();
    expect(run.by).toEqual([SERVER.resolver.id]);
    expect(stillOpen(digged)).toEqual([TASK.pingWww]);
  });

  it('02-10: the box of the dig has no greeting', () => {
    const box = lastBox(digged);
    const [you, resolver] = [DEVICE.you.name, SERVER.resolver.name];
    expect(Object.keys(box)).not.toContain(GREETING);
    expect(box[EXCHANGE]).toEqual([`1. consulta, de ${you} a ${resolver}`, `2. respuesta, de ${resolver} a ${you}`]);
    expect(box[DNS_FIELD]).toEqual([`Contestó ${resolver}.`, `${HOSTNAME.www} A ${IP.server}`]);
    expect(box[LOCAL_HEADER]).toEqual([`${IP.you}:${FIRST_PORT} → ${IP.resolver}:${PORT.dns}`, 'TTL al salir: 64']);
    expect(box[LOCAL_BACK_HEADER]).toEqual([`${IP.resolver}:${PORT.dns} → ${IP.you}:${FIRST_PORT}`]);
    expect(boxTexts(digged).filter((text) => /SYN|saludo/i.test(text))).toEqual([]);
    expect(lastRun(digged).trace.exchange).toHaveLength(2);
  });

  it('02-10: dig and ping both resolve www.lucia.example to 198.51.100.50', () => {
    const [dig, ping] = digThenPing.sent;
    expect(dig.trace.dns?.answers.map(({ value }) => value)).toEqual([IP.server]);
    expect(ping.trace.dns?.answers.map(({ value }) => value)).toEqual([IP.server]);
    expect([dig.trace.dns?.name, ping.trace.dns?.name]).toEqual([HOSTNAME.www, HOSTNAME.www]);
    expect([dig.trace.destinationId, ping.trace.destinationId]).toEqual([SERVER.resolver.id, SERVER.internet.id]);
    expect([ping.trace.resolvedIp, ping.question?.trace.dns?.answers.map(({ value }) => value)]).toEqual([IP.server, [IP.server]]);
    expect([dig.trace.outcome, ping.trace.outcome]).toEqual(['replied', 'replied']);
    expect(stillOpen(start)).toEqual([TASK.digWww, TASK.pingWww]);
    expect(stillOpen(digged)).toEqual([TASK.pingWww]);
    expect(stillOpen(pinged)).toEqual([TASK.digWww]);
    expectClosed(digThenPing);
    expectClosed(pingThenDig);
  });

  it('02-10: the settings card of tu-laptop shows the dns server and says DHCP gave it', () => {
    const settings = settingsCard(start, PIECE_ID.device(DEVICE.you.id));
    expect(settings?.title && plain(settings.title)).toBe(`${NETWORK_SETTINGS} de ${DEVICE.you.name}`);
    expect(settings?.settings).toEqual([]);
    expect(settings?.dns && { label: plain(settings.dns.label), value: plain(settings.dns.value), note: plain(settings.dns.note) }).toEqual({ label: 'Servidor DNS', value: `${IP.resolver} ${SERVER.resolver.name}`, note: 'Lo prestó DHCP.' });
    const card = pieceCard(start, PIECE_ID.device(DEVICE.you.id));
    expect(card).toMatchObject({ tabbed: true, first: 'terminal' });
    expect(card?.tabs.map(({ id }) => id)).toEqual(['terminal', 'settings', 'routes']);
    expect(plain(start.incident.report)).toContain(`abre ${DEVICE.you.name} y su pestaña «${NETWORK_SETTINGS}»`);
    const withoutTheTerm = { ...start, known: new Set([...start.known].filter((term) => term !== 'dhcp')) };
    expect(settingsCard(withoutTheTerm, PIECE_ID.device(DEVICE.you.id))).toBeNull();
  });

  it('02-10: the report names tu-laptop', () => {
    const { report } = start.incident;
    const [before, after] = [solvedWorld(INCIDENTS, '02-09'), startWorld(INCIDENTS, ASKING)];
    expect(report).toContain(`[[${DEVICE.you.name}]]`);
    expect(plain(report)).toMatch(new RegExp(`^Ahora ${DEVICE.you.name} puede usar un nombre de dominio, como ${HOSTNAME.www}, en vez de una IP\\.`));
    expect(plain(report)).toContain(`Apareció en «${NETWORK_SETTINGS}» de ${DEVICE.you.name} porque se lo prestó DHCP.`);
    expect(plain(report)).toContain(`Ese servidor es su resolver. Es ${SERVER.resolver.name}, en ${IP.resolver}.`);
    expect(changedNames(before, after)).toEqual([DEVICE.you.name]);
    expect(after.devices.find((device) => device.id === DEVICE.you.id)?.dnsServer).toBe(IP.resolver);
    expect(before.devices.find((device) => device.id === DEVICE.you.id)?.dnsServer).toBeUndefined();
    expect(networkSchema.safeParse(after).error).toBeUndefined();
  });

  it('02-10: the resolver and the authoritative server are servers of the internet that listen on UDP and TCP 53, and the zone holds www', () => {
    const [before, after] = [solvedWorld(INCIDENTS, '02-09'), startWorld(INCIDENTS, ASKING)];
    expect(after.actors.map(({ id }) => id)).toEqual([...before.actors.map(({ id }) => id), SERVER.resolver.id, SERVER.authoritative.id]);
    const [authoritative, resolver] = [SERVER.authoritative.id, SERVER.resolver.id].map((id) => after.actors.find((actor) => actor.id === id));
    const listening = [{ protocol: 'udp', port: PORT.dns, listen: 'all' }, { protocol: 'tcp', port: PORT.dns, listen: 'all' }];
    expect(authoritative).toMatchObject({ kind: 'server', ip: IP.authoritative, services: listening, dns: { role: 'authoritative' } });
    expect(resolver).toMatchObject({ kind: 'server', ip: IP.resolver, services: listening, dns: { role: 'resolver', upstreams: [{ zone: DOMAIN.site, serverId: SERVER.authoritative.id }] } });
    const records = authoritative && 'dns' in authoritative ? authoritative.dns?.zones?.flatMap((zone) => zone.records.filter((record) => record.type === 'A')) : [];
    expect(records).toEqual([{ name: HOSTNAME.www, type: 'A', value: IP.server, ttl: 300 }]);
    const destination = after.routers?.find((router) => router.id === ROUTER.destination.id);
    expect(destination?.interfaces).toEqual([
      ...(before.routers?.find((router) => router.id === ROUTER.destination.id)?.interfaces ?? []),
      { ip: IP.destinationResolver, faces: SERVER.resolver.id },
      { ip: IP.destinationAuthoritative, faces: SERVER.authoritative.id },
    ]);
    expect(NAME_SERVERS.map(({ type }) => type)).toEqual(['addActor', 'addActor', 'updateRouter', 'setDnsServer']);
    const [dig, ping] = digThenPing.sent;
    expect([dig, ping].map(({ trace }) => trace.steps.some((step) => step.at === ROUTER.destination.id))).toEqual([true, true]);
    expect(wholeWorld(after)).toEqual(expect.arrayContaining([SERVER.resolver.id, SERVER.authoritative.id]));
  });

  it('02-10: draws the resolver and not the authoritative server', () => {
    expect(drawnLabels(start)).toEqual([`device:${DEVICE.you.name}`, `device:${SERVER.resolver.name}`, `device:${SERVER.internet.name}`, `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`, 'internet:internet'].sort());
    expect(start.incident.shown).not.toContain(SERVER.authoritative.id);
    expect(wholeWorld(startWorld(INCIDENTS, ASKING))).toContain(SERVER.authoritative.id);
    expect(NAMES_PIECES.filter((id) => !wholeWorld(startWorld(INCIDENTS, ASKING)).includes(id))).toEqual([]);
    expect(everythingRead(digThenPing).filter((text) => text.includes(SERVER.authoritative.name))).toEqual([]);
  });

  it('02-10: every address of the chapter is in a documentation block and every name is under .example', () => {
    const world = startWorld(INCIDENTS, ASKING);
    const zones = world.actors.flatMap((actor) => (actor.kind === 'server' ? (actor.dns?.zones ?? []) : []));
    const records = zones.flatMap((zone) => zone.records);
    const chipAddresses = start.incident.mechanic === 'send' ? start.incident.send.to.map(({ address }) => address) : [];
    const addresses = [
      ...world.actors.map(({ ip }) => ip),
      ...(world.routers ?? []).flatMap((router) => router.interfaces.map(({ ip }) => ip)),
      ...world.devices.flatMap((device) => [device.privateIp, device.dnsServer ?? device.privateIp]),
      ...records.flatMap((record) => (record.type === 'A' ? [record.value] : [])),
      ...chipAddresses.filter((address) => /^[\d.]+$/.test(address)),
    ];
    expect(addresses).toContain(IP.resolver);
    expect(publicOutsideDocumentation(addresses)).toEqual([]);
    const names = [...zones.map(({ name }) => name), ...records.map(({ name }) => name), ...chipAddresses.filter((address) => /[a-z]/i.test(address))];
    expect(names).toContain(HOSTNAME.www);
    expect(outsideDocumentationTld(names)).toEqual([]);
    expect(plain(start.incident.takeaway)).toContain(`Los nombres de este juego, como ${HOSTNAME.www}, son ficticios: ninguno existe en el DNS real.`);
  });

  it('02-10: introduces domain name, DNS, DNS query, resolver, UDP, dig and DHCP, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[ASKING]));
    expect(sorted(introduces)).toEqual(sorted(['domain-name', 'dns', 'dns-query', 'resolver', 'udp', 'dig', 'dhcp']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, ASKING))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
    expect(laterTermLeaks(builtOfChapter2().filter((incident) => orderOf(incident.id) < orderOf(ASKING)))).toEqual([]);
    const chapterOneAndTwoBefore = INCIDENTS.filter((incident) => incident.id < ASKING).flatMap(incidentTexts).map(plain);
    expect(chapterOneAndTwoBefore.filter((text) => /\b(?:UDP|DNS|dig)\b/.test(text))).toEqual([]);
  });

  it('02-10: ping by name draws the question to the resolver first, with its own source port, and the ping after it', () => {
    const [question, ping] = drawnSends(pinged.sent);
    expect(ping.id).toBe(lastRun(pinged).id);
    expect(question.id).toBe(`${ping.id}-question`);
    expect(ping.after).toBe(question.id);
    expect(question.after).toBeUndefined();
    expect(question.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.resolver, sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(question.trace.translation?.outside).toMatchObject({ ip: IP.officeUplink, port: FIRST_PUBLIC_PORT });
    expect([question.replied, question.by, question.trace.dns?.viaDig]).toEqual([true, [SERVER.resolver.id], true]);
    expect(ping.trace.header?.request.sourcePort).toBeUndefined();
    expect(ping.trace.question?.packet).toMatchObject({ protocol: 'udp', port: PORT.dns, sourcePort: FIRST_PORT });
    expect(question.trace.question).toBeUndefined();
    expect([ping.send, question.send]).toEqual([1, 1]);
    expect(portsOf(digThenPing)).toEqual([FIRST_PORT, SECOND_PORT, undefined]);
    expect(portsOf(pingThenDig)).toEqual([FIRST_PORT, undefined, SECOND_PORT]);
    expect(drawnSends(digThenPing.sent).map(({ trace }) => trace.translation?.outside.port)).toEqual([FIRST_PUBLIC_PORT, SECOND_PUBLIC_PORT, undefined]);
    expect(drawnSends(pingThenDig.sent).map(({ trace }) => trace.translation?.outside.port)).toEqual([FIRST_PUBLIC_PORT, undefined, SECOND_PUBLIC_PORT]);
  });

  it('02-10: the question of a ping leaves a row in the translation table and the ping leaves none', () => {
    expect(tableOf(start)).toEqual([FIXED_ROW]);
    expect(tableOf(pinged)).toEqual([FIXED_ROW, FIRST_ROW]);
    expect(lastRun(pinged).trace.translation).toMatchObject({ protocol: 'icmp', isNew: false });
    expect(tableOf(askWith(pinged, MESSAGE.ping.id))).toEqual([FIXED_ROW, FIRST_ROW, SECOND_ROW]);
    expect(tableOf(digged)).toEqual([FIXED_ROW, FIRST_ROW]);
    expect(tableOf(pingThenDig)).toEqual([FIXED_ROW, FIRST_ROW, SECOND_ROW]);
    expect(lastBox(pinged)[TRANSLATION]).toEqual([`${IP.you} → ${IP.officeUplink}`, ICMP_HAS_NO_PORTS]);
  });

  it('02-10: the takeaway says that each question takes a new source port and leaves a row, and that the ping leaves none', () => {
    const takeaway = plain(start.incident.takeaway);
    expect(takeaway).toContain('Un ping a un nombre manda primero su consulta DNS y, cuando la respuesta vuelve, sale el ping.');
    expect(takeaway).toContain('En este juego, cada consulta, la de un ping y la de un dig, sale de un puerto de origen nuevo: por eso la segunda no repite el de la primera.');
    expect(takeaway).toContain(`Como el resolver está fuera de la oficina, ${ROUTER.office.name} la traduce y deja una fila en la tabla de traducciones.`);
    expect(takeaway).toContain('El ping en sí no deja fila: ICMP no usa puertos, y en esta tabla cada fila lleva uno.');
    expect(portsOf(pingThenDig).filter((port) => port !== undefined)).toEqual([FIRST_PORT, SECOND_PORT]);
  });

  it('02-10: the ping after a dig gets its answer from the cache of the resolver and still sends its question', () => {
    const [dig, ping] = digThenPing.sent;
    expect(dig.trace.dns?.fromCache).toBe(false);
    expect(ping.question?.trace.dns).toMatchObject({ fromCache: true, status: 'NOERROR', viaDig: true });
    expect(ping.question?.trace.header?.request).toMatchObject({ sourcePort: SECOND_PORT, destinationPort: PORT.dns });
    expect(ping.question?.trace.translation?.outside).toMatchObject({ port: SECOND_PUBLIC_PORT });
    expect(ping.trace.outcome).toBe('replied');
    expect(pinged.sent[0].question?.trace.dns?.fromCache).toBe(false);
    expect(everythingRead(digThenPing).filter((text) => /caché|cache/i.test(text))).toEqual([]);
  });

  it('02-10: the incident draws the resolver, so the question has somewhere to go', () => {
    const world = startWorld(INCIDENTS, ASKING);
    const resolver = world.actors.find((actor) => actor.ip === world.devices.find((device) => device.id === DEVICE.you.id)?.dnsServer);
    expect(resolver?.id).toBe(SERVER.resolver.id);
    expect(start.incident.shown).toContain(resolver?.id);
    expect(drawnLabels(pingThenDig)).toContain(`device:${SERVER.resolver.name}`);
    for (const session of [digged, pinged, digThenPing, pingThenDig]) {
      for (const sent of drawnSends(session.sent)) expect(sent.by.every((id) => start.incident.shown?.includes(id))).toBe(true);
    }
    expect(drawnSends(pinged.sent)[0].trace.destinationId).toBe(SERVER.resolver.id);
  });

  it('02-10: no text says the computer asks only once', () => {
    expect(['La computadora pregunta una sola vez.', 'Solo una consulta sale de tu laptop.', 'Pregunta solo una vez al resolver.', 'Es la única pregunta.'].filter((text) => !ASKS_ONLY_ONCE.test(text))).toEqual([]);
    for (const session of [start, digged, pinged, digThenPing, pingThenDig]) expect(everythingRead(session).filter((text) => ASKS_ONLY_ONCE.test(text))).toEqual([]);
    expect(incidentTexts(start.incident).map(plain).filter((text) => ASKS_ONLY_ONCE.test(text))).toEqual([]);
  });

  it('02-10: the right option is the second and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 1);
  });
});

describe('02-11, the records', () => {
  const RECORDS = '02-11';
  const FIRST_PORT = 51514;
  const SECOND_PORT = 51515;
  const FIRST_PUBLIC_PORT = 40001;
  const SECOND_PUBLIC_PORT = 40002;
  const REFUSED = 'No se pudo agregar. ';
  const WHERE_IT_STOPPED = 'Dónde y por qué se detuvo';
  const DNS_FIELD = 'DNS';
  const NXDOMAIN = 'NXDOMAIN';
  const SERVFAIL = 'SERVFAIL';
  const NAMES_A_NEW_TERM = /autoritativ|registro|CNAME/i;
  const MAX_REPORT_SENTENCES = 12;
  const NEVER_TAUGHT_HERE = /[Cc]aché|\b[Cc]ache\b|NXDOMAIN|SERVFAIL|\b[Aa]pex\b|Route 53|\bAlias\b|AAAA|IPv6/;
  const NS_RECORD = 'NS';
  const SOA_RECORD = 'SOA';
  const RECORDS_TAB = 'records';
  const PREVIOUS_INCIDENT = '02-10';
  const UNREACHABLE = 'unreachable';
  const REPLIED = 'replied';
  const HOST_UNREACHABLE = 'host-unreachable';
  const ALIAS_PROBLEM = 'cname-with-other-records';
  const APEX_PROBLEM = 'cname-at-apex';
  const NAME_TRAY = 'name';
  const TYPE_TRAY = 'type';
  const VALUE_TRAY = 'value';
  const authoritativePiece = PIECE_ID.actor(SERVER.authoritative.id);
  const start = startSession(INCIDENTS, RECORDS);
  const sentTo = (session: Session, address: { id: string }, message: { id: string }): Session => sendingFrom(session, ORIGIN.you.id, address.id, message.id);
  const ncWww = (session: Session): Session => sentTo(session, ADDRESS.www, MESSAGE.ncWeb);
  const ncBlog = (session: Session): Session => sentTo(session, ADDRESS.blog, MESSAGE.ncWeb);
  const digWww = (session: Session): Session => sentTo(session, ADDRESS.www, MESSAGE.dig);
  const digBlog = (session: Session): Session => sentTo(session, ADDRESS.blog, MESSAGE.dig);
  const placing = (session: Session, nameId: string, typeId: string, valueId: string): Session => sessionReducer(session, recordMove(nameId, typeId, valueId));
  const withoutTheWrongA = (session: Session, name: string): Session => sessionReducer(session, recordRemoval(name, RECORD_TYPE.a, IP.nobodyOutside));
  const aimedAtTheSite = (session: Session): Session => placing(withoutTheWrongA(session, HOSTNAME.www), SITE_RECORDS.name.www, SITE_RECORDS.type.a, SITE_RECORDS.value.server);
  const asAnAlias = (session: Session): Session => placing(withoutTheWrongA(session, HOSTNAME.blog), SITE_RECORDS.name.blog, SITE_RECORDS.type.cname, SITE_RECORDS.value.www);
  const repaired = asAnAlias(aimedAtTheSite(start));
  const closed = digBlog(ncWww(repaired));
  const recordsOf = (session: Session): TableCard | undefined => pieceCard(session, authoritativePiece)?.tabs.find((tab) => tab.id === RECORDS_TAB)?.card as TableCard | undefined;
  const rowsOf = (session: Session) => (recordsOf(session)?.rows ?? []).map((row) => row.cells.map((cell) => plain(cell.text)));
  const translationsOf = (session: Session) => (pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'translations')?.card as TableCard | undefined)?.rows.map((row) => row.cells.map((cell) => plain(cell.text)));
  const problemOf = (session: Session): string => plain(recordsOf(session)?.problem ?? '');
  const boxOf = (session: Session, index: number): Record<string, string[]> =>
    Object.fromEntries((inspect(session, session.sent[index].pieceId)?.fields ?? []).map(({ label, lines }) => [plain(label), lines.map((line) => plain(line))]));
  const everyState = [start, ncWww(start), digBlog(start), digBlog(ncWww(start)), repaired, closed, aimedAtTheSite(start), asAnAlias(start), digWww(ncBlog(aimedAtTheSite(start)))];
  const refusedAlias = placing(digBlog(ncWww(start)), SITE_RECORDS.name.blog, SITE_RECORDS.type.cname, SITE_RECORDS.value.www);
  const refusedAtTheZone = placing(digBlog(ncWww(start)), SITE_RECORDS.name.zone, SITE_RECORDS.type.cname, SITE_RECORDS.value.www);

  it('02-11: fixing the a record of www makes the nc by name come back', () => {
    const [broken] = ncWww(start).sent;
    expect([broken.trace.outcome, broken.trace.resolvedIp, broken.by]).toEqual([UNREACHABLE, IP.nobodyOutside, [ROUTER.destination.id]]);
    expect(stillOpen(ncWww(start))).toEqual([TASK.webWww, TASK.digBlog]);
    const justAdded = placing(start, SITE_RECORDS.name.www, SITE_RECORDS.type.a, SITE_RECORDS.value.server);
    expect(rowsOf(justAdded)).toContainEqual([HOSTNAME.www, RECORD_TYPE.a, IP.server]);
    expect(ncWww(justAdded).sent[0].trace.outcome, 'the wrong record still comes first').toBe(UNREACHABLE);
    expect(boxOf(ncWww(justAdded), 0)[DNS_FIELD][1], 'the nc uses the first answer').toContain(`la respuesta es ${IP.nobodyOutside}.`);
    expect(printedFrom(digWww(justAdded), ORIGIN.you.id, ADDRESS.www.id, MESSAGE.dig.id).filter((line) => /\tA\t/.test(line)), 'the dig lists both, the wrong one first').toEqual([`${HOSTNAME.www}.\t300\tIN\tA\t${IP.nobodyOutside}`, `${HOSTNAME.www}.\t300\tIN\tA\t${IP.server}`]);
    expect(plain(start.incident.report)).toContain('En este juego, si un nombre tiene dos registros A, el nc usa el primero de la respuesta.');
    expect(plain(start.incident.report).indexOf('mira en la caja del paquete qué contestó tu resolver.')).toBeLessThan(plain(start.incident.report).indexOf('En este juego, si un nombre tiene dos registros A'));
    expect(plain(start.incident.takeaway)).toContain('Con dos registros A para un mismo nombre, en este juego el nc usa el primero de la respuesta: por eso había que quitar el registro equivocado y no solo agregar el correcto.');
    const [fixed] = ncWww(aimedAtTheSite(start)).sent;
    expect([fixed.trace.outcome, fixed.trace.resolvedIp, fixed.by]).toEqual([REPLIED, IP.server, [SERVER.internet.id]]);
    expect(rowsOf(aimedAtTheSite(start))).toEqual([[HOSTNAME.blog, RECORD_TYPE.a, IP.nobodyOutside], [HOSTNAME.www, RECORD_TYPE.a, IP.server]]);
    expect(stillOpen(ncWww(aimedAtTheSite(start)))).toEqual([TASK.digBlog]);
  });

  it('02-11: a cname for blog is refused while blog has an a record and the card says why', () => {
    expect(refusedAlias.entryProblem).toEqual({ tableId: SITE_RECORDS.table, code: ALIAS_PROBLEM });
    expect(problemOf(refusedAlias)).toBe(`${REFUSED}${plain(TABLE_TEXT.problems[ALIAS_PROBLEM])}`);
    expect(problemOf(refusedAlias)).toContain('un nombre con un registro CNAME no puede tener otros: o es un alias, o tiene datos propios.');
    expect(refusedAlias.world).toBe(start.world);
    expect(rowsOf(refusedAlias)).toEqual(rowsOf(start));
    expect(refusedAlias.sent, 'a refused record changes nothing, so the sends stay').toHaveLength(2);
    expect(stillOpen(refusedAlias)).toEqual([TASK.webWww, TASK.digBlog]);
    expect(problemOf(start)).toBe('');
    expect(problemOf(asAnAlias(refusedAlias))).toBe('');
  });

  it('02-11: a cname at lucia.example is refused and the card says the zone has its own records', () => {
    expect(refusedAtTheZone.entryProblem).toEqual({ tableId: SITE_RECORDS.table, code: APEX_PROBLEM });
    expect(problemOf(refusedAtTheZone)).toBe(`${REFUSED}${plain(TABLE_TEXT.problems[APEX_PROBLEM])}`);
    expect(problemOf(refusedAtTheZone)).toContain('La zona ya tiene sus propios registros en ese nombre');
    expect(refusedAtTheZone.world).toBe(start.world);
    expect(rowsOf(refusedAtTheZone)).toEqual(rowsOf(start));
    expect(problemOf(refusedAtTheZone)).not.toMatch(NEVER_TAUGHT_HERE);
    expect(plain(recordsOf(refusedAtTheZone)?.note ?? '')).toBe(plain(TABLE_TEXT.records.own));
  });

  it('02-11: removing the a record and creating the cname closes the incident with the answer through an alias', () => {
    const aliasOnly = digBlog(asAnAlias(start));
    const [alias] = aliasOnly.sent;
    expect(alias.trace.dns?.answers.map(({ type, value }) => [type, value])).toEqual([[RECORD_TYPE.cname, HOSTNAME.www], [RECORD_TYPE.a, IP.nobodyOutside]]);
    expect(stillOpen(aliasOnly), 'the alias leads to the wrong address until the record of www is fixed').toEqual([TASK.webWww, TASK.digBlog]);
    expect(stillOpen(ncWww(aliasOnly)), 'and the answer holds the wrong address').toEqual([TASK.webWww, TASK.digBlog]);
    const withItsOwnAddress = placing(withoutTheWrongA(aimedAtTheSite(start), HOSTNAME.blog), SITE_RECORDS.name.blog, SITE_RECORDS.type.a, SITE_RECORDS.value.server);
    const [direct] = digBlog(withItsOwnAddress).sent;
    expect(direct.trace.dns?.answers.map(({ type, value }) => [type, value])).toEqual([[RECORD_TYPE.a, IP.server]]);
    expect(stillOpen(digBlog(ncWww(withItsOwnAddress))), 'the right address is not enough: the answer has to come through an alias').toEqual([TASK.digBlog]);
    const [dig] = closed.sent.slice(-1);
    expect(dig.trace.dns?.answers.map(({ type, name, value }) => [type, name, value])).toEqual([[RECORD_TYPE.cname, HOSTNAME.blog, HOSTNAME.www], [RECORD_TYPE.a, HOSTNAME.www, IP.server]]);
    expect(printedFrom(closed, ORIGIN.you.id, ADDRESS.blog.id, MESSAGE.dig.id).filter((line) => /CNAME|\tA\t/.test(line))).toEqual([`${HOSTNAME.blog}.\t300\tIN\tCNAME\t${HOSTNAME.www}.`, `${HOSTNAME.www}.\t300\tIN\tA\t${IP.server}`]);
    expect(rowsOf(repaired)).toEqual([[HOSTNAME.www, RECORD_TYPE.a, IP.server], [HOSTNAME.blog, RECORD_TYPE.cname, HOSTNAME.www]]);
    expectClosed(closed);
    expectClosed(ncWww(digBlog(asAnAlias(aimedAtTheSite(start)))));
  });

  it('02-11: the report names servidor-autoritativo', () => {
    const { report } = start.incident;
    const [before, after] = [solvedWorld(INCIDENTS, PREVIOUS_INCIDENT), startWorld(INCIDENTS, RECORDS)];
    const zone = after.actors.flatMap((actor) => (actor.kind === 'server' && actor.id === SERVER.authoritative.id ? (actor.dns?.zones ?? []) : [])).flatMap(({ records }) => records);
    expect(report).toContain(`[[${SERVER.authoritative.name}]]`);
    expect(plain(report)).toContain(`Alguien cambió registros de ${SERVER.authoritative.name}, y ${HOSTNAME.www} dejó de responder.`);
    expect(plain(report)).toContain(`Después abre ${SERVER.authoritative.name} y corrige sus registros: ${HOSTNAME.blog} debe ser otro nombre de ${HOSTNAME.www}.`);
    expect(changedNames(before, after)).toEqual([SERVER.authoritative.name]);
    expect(zone.filter(({ type }) => type === RECORD_TYPE.a).map(({ name, value }) => [name, value])).toEqual([[HOSTNAME.www, IP.nobodyOutside], [HOSTNAME.blog, IP.nobodyOutside]]);
    expect(zone.map(({ type }) => type).sort()).toEqual([RECORD_TYPE.a, RECORD_TYPE.a, NS_RECORD, SOA_RECORD]);
    expect(networkSchema.safeParse(after).error).toBeUndefined();
    expect(before.actors.map(({ id }) => id)).toContain(SERVER.authoritative.id);
  });

  it('02-11: draws the authoritative server only now', () => {
    expect(drawnLabels(start)).toEqual(
      [`device:${DEVICE.you.name}`, `device:${SERVER.resolver.name}`, `device:${SERVER.authoritative.name}`, `device:${SERVER.internet.name}`, `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`, 'internet:internet'].sort(),
    );
    expect(start.incident.shown).toEqual(RECORDS_PIECES);
    expect(drawnLabels(startSession(INCIDENTS, PREVIOUS_INCIDENT))).not.toContain(`device:${SERVER.authoritative.name}`);
    const piece = pieceViews(start).find(({ id }) => id === authoritativePiece);
    expect(piece).toMatchObject({ locked: false, configurable: true });
    expect(pieceCard(start, authoritativePiece)).toMatchObject({ tabbed: false, first: RECORDS_TAB });
    expect(pieceCard(start, authoritativePiece)?.tabs.map(({ id }) => id)).toEqual([RECORDS_TAB]);
    expect(everythingRead(startSession(INCIDENTS, PREVIOUS_INCIDENT)).filter((text) => text.includes(SERVER.authoritative.name))).toEqual([]);
  });

  it('02-11: the records of the zone itself are hidden under one line', () => {
    const world = startWorld(INCIDENTS, RECORDS);
    const server = world.actors.find((actor) => actor.id === SERVER.authoritative.id);
    const held = server && 'dns' in server ? (server.dns?.zones ?? []).flatMap(({ records }) => records.map(({ type }) => type)) : [];
    expect(held).toContain(NS_RECORD);
    expect(held).toContain(SOA_RECORD);
    for (const session of [start, repaired, closed]) {
      const card = recordsOf(session);
      expect(card?.rows.flatMap((row) => row.cells.map((cell) => plain(cell.text)))).not.toContain(NS_RECORD);
      expect(card?.rows.flatMap((row) => row.cells.map((cell) => plain(cell.text)))).not.toContain(SOA_RECORD);
      expect(plain(card?.note ?? '')).toBe(plain(TABLE_TEXT.records.own));
      expect(card?.title && plain(card.title)).toBe(`Registros de ${DOMAIN.site}`);
      expect(card?.columns.map(({ id }) => id), 'the time to live waits for its term').toEqual([NAME_TRAY, TYPE_TRAY, VALUE_TRAY]);
    }
    expect(recordsOf(start)?.trays?.map(({ name, chips }) => [name, chips.map((chip) => plain(chip.label))])).toEqual([
      [NAME_TRAY, [HOSTNAME.www, HOSTNAME.blog, DOMAIN.site]],
      [TYPE_TRAY, [RECORD_TYPE.a, RECORD_TYPE.cname]],
      [VALUE_TRAY, [IP.server, IP.nobodyOutside, HOSTNAME.www]],
    ]);
  });

  it('02-11: introduces authoritative server, DNS record, A record and CNAME record, and uses no later term', () => {
    const { introduces, report } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[RECORDS]));
    expect(sorted(introduces)).toEqual(sorted(['authoritative-server', 'dns-record', 'a-record', 'cname-record']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, RECORDS))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
    expect(laterTermLeaks(builtOfChapter2().filter((incident) => orderOf(incident.id) <= orderOf(RECORDS)))).toEqual([]);
    const earlier = INCIDENTS.filter((incident) => incident.id < RECORDS).flatMap(incidentTexts).map(plain);
    expect(earlier.filter((text) => NAMES_A_NEW_TERM.test(text))).toEqual([]);
    expect(['Un servidor autoritativo.', 'Un registro.', 'Un CNAME.'].filter((text) => !NAMES_A_NEW_TERM.test(text))).toEqual([]);
    const definesBeforeNaming = (plainWords: string, tagged: string) => report.indexOf(plainWords) >= 0 && report.indexOf(plainWords) < report.indexOf(tagged);
    expect(definesBeforeNaming('el que guarda los datos de ese dominio y da la respuesta definitiva', '{{authoritative-server|')).toBe(true);
    expect(definesBeforeNaming('Cada dato que guarda es un', '{{dns-record|')).toBe(true);
    expect(definesBeforeNaming('Un alias es otro nombre para lo mismo.', '{{cname-record|registro CNAME}} dice que un nombre es un alias')).toBe(true);
    expect(plain(report).split(/(?<=[.!?])\s+/).length).toBeLessThanOrEqual(MAX_REPORT_SENTENCES);
    expect(everyState.flatMap(everythingRead).filter((text) => NEVER_TAUGHT_HERE.test(text))).toEqual([]);
    expect(['El caché guarda la respuesta.', 'El apex de la zona.', 'Un Alias de Route 53.', 'Dio NXDOMAIN.', 'Dio SERVFAIL.'].filter((text) => !NEVER_TAUGHT_HERE.test(text))).toEqual([]);
  });

  it('02-11: the nc by name draws its question first and leaves from the next port', () => {
    const asked = ncWww(start);
    const [question, nc] = drawnSends(asked.sent);
    expect(question.id).toBe(`${nc.id}-question`);
    expect([question.after, nc.after]).toEqual([undefined, question.id]);
    expect(question.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.resolver, sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(nc.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.nobodyOutside, sourcePort: SECOND_PORT, destinationPort: PORT.web });
    expect([question.trace.translation?.outside.port, nc.trace.translation?.outside.port]).toEqual([FIRST_PUBLIC_PORT, SECOND_PUBLIC_PORT]);
    expect(translationsOf(asked)?.slice(1)).toEqual([
      ['UDP · consulta DNS', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`],
      ['TCP', `${IP.you}:${SECOND_PORT}`, `${IP.officeUplink}:${SECOND_PUBLIC_PORT}`],
    ]);
    expect(boxOf(asked, 0)[DNS_FIELD]).toEqual([
      `Antes de mandar el paquete, ${DEVICE.you.name} averigua la IP de ${HOSTNAME.www}.`,
      `${DEVICE.you.name} hizo una consulta DNS por ${HOSTNAME.www} a ${SERVER.resolver.name}, su resolver: la respuesta es ${IP.nobodyOutside}.`,
      `La consulta salió del puerto ${FIRST_PORT} y se ve en el mapa, antes de este paquete.`,
      `Este paquete salió del puerto ${SECOND_PORT}. En este juego cada intercambio nuevo sale de un puerto nuevo, y la consulta salió antes.`,
    ]);
    expect(plain(start.incident.takeaway)).toContain('Un nc a un nombre pregunta primero, como el ping de «Preguntar por un nombre»: su consulta sale de un puerto de origen y el nc, de otro, porque en este juego cada intercambio nuevo sale de un puerto nuevo.');
    expect(drawnSends(digBlog(start).sent), 'a dig is the question itself, so it draws no other').toHaveLength(1);
  });

  it('02-11: after a record is placed the numbers start again at the first port and the first public port', () => {
    const portsOf = (session: Session) => drawnSends(session.sent).map(({ trace }) => [trace.header?.request.sourcePort, trace.translation?.outside.port]);
    const asked = ncWww(start);
    const fresh = [[FIRST_PORT, FIRST_PUBLIC_PORT], [SECOND_PORT, SECOND_PUBLIC_PORT]];
    expect(portsOf(asked)).toEqual(fresh);
    const placed = placing(asked, SITE_RECORDS.name.www, SITE_RECORDS.type.a, SITE_RECORDS.value.server);
    expect([placed.sent, placed.history]).toEqual([[], []]);
    expect(translationsOf(placed)).toEqual(translationsOf(start));
    expect(portsOf(ncWww(placed))).toEqual(fresh);
    const removed = withoutTheWrongA(asked, HOSTNAME.blog);
    expect([removed.sent, removed.history]).toEqual([[], []]);
    expect(portsOf(ncWww(removed))).toEqual(fresh);
    expect(translationsOf(ncWww(removed))?.slice(1)).toHaveLength(2);
    expect(plain(start.incident.report)).toContain('Cuando cambias un registro, los envíos anteriores se borran, porque ya no muestran lo que contesta el servidor: los números de puertos vuelven a empezar.');
  });

  it('02-11: the question comes back with the wrong address before the nc is warned by a router', () => {
    const asked = ncWww(start);
    const [question, nc] = drawnSends(asked.sent);
    expect([question.replied, question.by, question.trace.outcome]).toEqual([true, [SERVER.resolver.id], REPLIED]);
    expect(question.trace.dns).toMatchObject({ status: 'NOERROR', viaDig: true });
    expect(question.trace.dns?.answers.map(({ value }) => value)).toEqual([IP.nobodyOutside]);
    expect([nc.after, nc.replied, nc.by]).toEqual([question.id, false, [ROUTER.destination.id]]);
    expect(nc.trace.notice).toMatchObject({ kind: HOST_UNREACHABLE, fromId: ROUTER.destination.id });
    expect(asked.sent[0].warning).toEqual({ term: HOST_UNREACHABLE, by: 'router' });
    expect(boxOf(asked, 0)[WHERE_IT_STOPPED]).toEqual([`Un router de afuera de la oficina tiene conectada la red de ${IP.nobodyOutside}, pero ningún dispositivo tiene esa IP: descarta el paquete y avisa a quien lo envió que no pudo entregarlo.`]);
    expect(boxOf(asked, 0)[DNS_FIELD][1]).toContain(`la respuesta es ${IP.nobodyOutside}.`);
    expect(plain(start.incident.takeaway)).toContain(`Esa IP, ${IP.nobodyOutside}, no la tenía ningún dispositivo. Por eso un router de afuera de la oficina, el que tiene conectada la red de esa IP, avisó con un Destination Host Unreachable.`);
    expect(drawnLabels(asked)).not.toContain(`edge:${ROUTER.destination.name}`);
    expect(everyState.flatMap(everythingRead).filter((text) => text.includes(ROUTER.destination.name))).toEqual([]);
  });

  it('02-11: a dig of a name whose record the player took away prints the status of the tool and every text of the game says it in plain words', () => {
    const withoutBlog = digBlog(withoutTheWrongA(start, HOSTNAME.blog));
    const selfAlias = digWww(placing(withoutTheWrongA(start, HOSTNAME.www), SITE_RECORDS.name.www, SITE_RECORDS.type.cname, SITE_RECORDS.value.www));
    const printed = (session: Session, address: { id: string }) => printedFrom(session, ORIGIN.you.id, address.id, MESSAGE.dig.id).join('\n');
    expect(withoutBlog.sent[0].trace.dns?.status).toBe(NXDOMAIN);
    expect(selfAlias.sent[0].trace.dns?.status).toBe(SERVFAIL);
    expect(printed(withoutBlog, ADDRESS.blog)).toContain(`status: ${NXDOMAIN}`);
    expect(printed(selfAlias, ADDRESS.www)).toContain(`status: ${SERVFAIL}`);
    for (const session of [withoutBlog, selfAlias]) {
      expect([...boxTexts(session), ...incidentTexts(session.incident).map(plain)].filter((text) => /NXDOMAIN|SERVFAIL/.test(text))).toEqual([]);
    }
    expect(boxOf(withoutBlog, 0)[DNS_FIELD]).toEqual([`Contestó ${SERVER.resolver.name}.`, `${HOSTNAME.blog} no se convirtió en una IP.`]);
    expect(boxOf(ncBlog(withoutTheWrongA(start, HOSTNAME.blog)), 0)[WHERE_IT_STOPPED]).toEqual([`${HOSTNAME.blog} no se convirtió en una IP.`]);
  });

  it('02-11: the right option is the first and is not the longest of the three', () => {
    expectRightOptionAt(start.incident, 0);
    const [right, ...wrong] = optionsOf(start.incident).map(({ text }) => plain(text).length);
    expect(wrong.every((length) => length !== right)).toBe(true);
    expect(Math.min(...wrong)).toBeLessThan(right);
    expect(Math.max(...wrong)).toBeGreaterThan(right);
  });
});

describe('02-12, still the old ip', () => {
  const STILL = '02-12';
  const FIRST_PORT = 51514;
  const SECOND_PORT = 51515;
  const FIRST_PUBLIC_PORT = 40001;
  const SECOND_PUBLIC_PORT = 40002;
  const CACHE_TAB = 'cache';
  const DNS_FIELD = 'DNS';
  const LOCAL_HEADER = 'Encabezado de ida (en tu red local)';
  const NEVER_TAUGHT_HERE = /NXDOMAIN|SERVFAIL|Port Unreachable|archivo hosts|\bhosts\b|AAAA|IPv6/;
  const NAMES_A_NEW_TERM = /caché|\bcache\b|TTL de DNS/i;
  const SECONDS_IN_A_MINUTE = 60;
  const SECOND_BEFORE_IT_RUNS_OUT = OLD_ANSWER_SECONDS - 1;
  const PREVIOUS_INCIDENT = '02-11';
  const NOT_A_STEP = 90;
  const start = startSession(INCIDENTS, STILL);
  const dig = (session: Session): Session => sendingFrom(session, ORIGIN.you.id, ADDRESS.www.id, MESSAGE.dig.id);
  const waiting = (session: Session, seconds: number): Session => sessionReducer(session, waitMove(seconds));
  const afterOneMinute = waiting(start, WAIT.oneMinute.seconds);
  const afterFiveMinutes = waiting(start, WAIT.fiveMinutes.seconds);
  const digged = dig(start);
  const diggedAfterOneMinute = dig(waiting(digged, WAIT.oneMinute.seconds));
  const diggedAfterFiveMinutes = dig(waiting(digged, WAIT.fiveMinutes.seconds));
  const everyState = [start, digged, waiting(digged, WAIT.oneMinute.seconds), diggedAfterOneMinute, waiting(digged, WAIT.fiveMinutes.seconds), diggedAfterFiveMinutes];
  const cacheOf = (session: Session): TableCard | undefined => pieceCard(session, PIECE_ID.actor(SERVER.resolver.id))?.tabs.find((tab) => tab.id === CACHE_TAB)?.card as TableCard | undefined;
  const cacheRows = (session: Session) => (cacheOf(session)?.rows ?? []).map((row) => row.cells.map((cell) => plain(cell.text)));
  const boxOf = (session: Session): Record<string, string[]> =>
    Object.fromEntries((inspect(session, session.sent[0].pieceId)?.fields ?? []).map(({ label, lines }) => [plain(label), lines.map((line) => plain(line))]));
  const oldRow = (secondsLeft: number) => [HOSTNAME.www, RECORD_TYPE.a, IP.server, `${secondsLeft} s`];
  const newRow = [HOSTNAME.www, RECORD_TYPE.a, IP.freshServer, `${RECORD_TTL} s`];
  const answersOf = (session: Session) => session.sent[0].trace.dns?.answers.map(({ type, value }) => [type, value]);
  const sendIncidentOf = (session: Session) => session.incident as Extract<Incident, { mechanic: 'send' }>;
  const playedThrough = (session: Session): Session => sendIncidentOf(session).solution.reduce((state, move) => sessionReducer(state, move), session);

  it('02-12: dig answers the old ip from the cache with the seconds left', () => {
    const [run] = digged.sent;
    expect(run.trace.outcome).toBe('replied');
    expect(run.trace.dns).toMatchObject({ status: 'NOERROR', viaDig: true, fromCache: true, ttlLeft: OLD_ANSWER_SECONDS });
    expect(answersOf(digged)).toEqual([[RECORD_TYPE.a, IP.server]]);
    expect(boxOf(digged)[DNS_FIELD]).toEqual([`Contestó ${SERVER.resolver.name}.`, `${HOSTNAME.www} ${RECORD_TYPE.a} ${IP.server}`, `La respuesta salió de la caché de ${SERVER.resolver.name}.`, `TTL: quedan ${OLD_ANSWER_SECONDS} s.`]);
    expect(printedFrom(digged, ORIGIN.you.id, ADDRESS.www.id, MESSAGE.dig.id).filter((line) => /\tA\t/.test(line))).toEqual([`${HOSTNAME.www}.\t${OLD_ANSWER_SECONDS}\tIN\tA\t${IP.server}`]);
    expect(stillOpen(digged), 'the old address is not the one the task asks for').toEqual([TASK.digNewIp]);
    expect(cacheRows(start)).toEqual([oldRow(OLD_ANSWER_SECONDS)]);
    expect(cacheRows(digged), 'a dig answered from the cache does not renew it').toEqual([oldRow(OLD_ANSWER_SECONDS)]);
    expect(cacheRows(afterOneMinute)).toEqual([oldRow(OLD_ANSWER_SECONDS - SECONDS_IN_A_MINUTE)]);
    expect(boxOf(diggedAfterOneMinute)[DNS_FIELD].at(-1), 'the seconds left go down with the clock, and asking again does not reset them').toBe(`TTL: quedan ${OLD_ANSWER_SECONDS - SECONDS_IN_A_MINUTE} s.`);
    expect(answersOf(diggedAfterOneMinute)).toEqual([[RECORD_TYPE.a, IP.server]]);
    expect(stillOpen(diggedAfterOneMinute)).toEqual([TASK.digNewIp]);
  });

  it('02-12: waiting five minutes makes the cache run out and dig gives the new ip', () => {
    expect(cacheRows(afterFiveMinutes), 'the cache has nothing left after the wait').toEqual([]);
    expect(plain(cacheOf(afterFiveMinutes)?.empty ?? '')).toBe(plain(TABLE_TEXT.cache.empty));
    expect(waiting(digged, WAIT.fiveMinutes.seconds).sent, 'waiting erases no stamp').toEqual(digged.sent);
    expect(stillOpen(waiting(digged, WAIT.fiveMinutes.seconds)), 'and the old answer does not count for the task').toEqual([TASK.digNewIp]);
    expect(diggedAfterFiveMinutes.sent[0].trace.dns).toMatchObject({ status: 'NOERROR', viaDig: true, fromCache: false });
    expect(answersOf(diggedAfterFiveMinutes)).toEqual([[RECORD_TYPE.a, IP.freshServer]]);
    expect(boxOf(diggedAfterFiveMinutes)[DNS_FIELD]).toEqual([`Contestó ${SERVER.resolver.name}.`, `${HOSTNAME.www} ${RECORD_TYPE.a} ${IP.freshServer}`, `${SERVER.resolver.name} no la tenía en su caché y la buscó.`, `TTL: ${RECORD_TTL} s.`]);
    expect(cacheRows(diggedAfterFiveMinutes), 'the new answer is kept with its own time to live').toEqual([newRow]);
    expectClosed(diggedAfterFiveMinutes);
    const asksOnTheNextDig = `siguiente dig ya no encontró la respuesta vieja en la caché: ${SERVER.resolver.name} preguntó a ${SERVER.authoritative.name} y recibió ${IP.freshServer}`;
    expect(plain(start.incident.takeaway), 'the resolver asks on the next dig, with the whole time to live of the new answer').toContain(`${asksOnTheNextDig}, con su TTL entero, ${RECORD_TTL} s.`);
    expect(plain(optionsOf(start.incident)[2].feedback)).toContain(`${asksOnTheNextDig}.`);
    expect([start.incident.takeaway, optionsOf(start.incident)[2].feedback].map(plain).filter((text) => text.includes('preguntó de nuevo')), 'nothing says the resolver asked again by itself when the time ran out').toEqual([]);
    const fourMinutes = [0, 1, 2, 3].reduce((session) => waiting(session, WAIT.oneMinute.seconds), start);
    expect(fourMinutes.clock).toBe(OLD_ANSWER_SECONDS);
    expect(cacheRows([0, 1, 2].reduce((session) => waiting(session, WAIT.oneMinute.seconds), start)), 'at second 180 the answer is alive').toEqual([oldRow(SECONDS_IN_A_MINUTE)]);
    expect(cacheRows(fourMinutes), 'it is gone at the very second its time runs out').toEqual([]);
    expect(answersOf(dig(fourMinutes))).toEqual([[RECORD_TYPE.a, IP.freshServer]]);
    expect(SECOND_BEFORE_IT_RUNS_OUT).toBeLessThan(WAIT.fiveMinutes.seconds);
    expectClosed(playedThrough(start));
    expect(waiting(start, NOT_A_STEP), 'a time that is no step of the clock changes nothing').toBe(start);
  });

  it('02-12: a move that changes the world clears the sends and not the clock', () => {
    const withRecords = INCIDENTS.map((incident) => (incident.id === STILL && incident.mechanic === 'send' ? { ...incident, send: { ...incident.send, tables: [SITE_RECORDS_TABLE] } } : incident));
    const editable = startSession(withRecords, STILL);
    const addedRecord = recordMove(SITE_RECORDS.name.www, SITE_RECORDS.type.a, SITE_RECORDS.value.nobody);
    expect(sessionReducer(start, addedRecord), 'the incident itself offers no move that changes the world, so the test gives it a table').toBe(start);
    const waited = waiting(dig(waiting(dig(editable), WAIT.oneMinute.seconds)), WAIT.oneMinute.seconds);
    expect([waited.sent.length, waited.history.length, waited.clock, waited.sends]).toEqual([1, 2, 2 * SECONDS_IN_A_MINUTE, 2]);
    expect(waiting(waited, WAIT.oneMinute.seconds).world, 'waiting changes no world').toBe(waited.world);
    const changed = sessionReducer(waited, addedRecord);
    expect(changed.world).not.toBe(waited.world);
    expect([changed.sent, changed.history]).toEqual([[], []]);
    expect([changed.clock, changed.sends, changed.phase]).toEqual([2 * SECONDS_IN_A_MINUTE, 2, 'playing']);
    expect(cacheRows(changed), 'the cache of the world is measured against the clock that stayed').toEqual([oldRow(OLD_ANSWER_SECONDS - 2 * SECONDS_IN_A_MINUTE)]);
    const again = dig(changed);
    expect(boxOf(again)[DNS_FIELD].at(-1)).toBe(`TTL: quedan ${OLD_ANSWER_SECONDS - 2 * SECONDS_IN_A_MINUTE} s.`);
    expect(drawnSends(again.sent).map(({ trace }) => [trace.header?.request.sourcePort, trace.translation?.outside.port])).toEqual([[FIRST_PORT, FIRST_PUBLIC_PORT]]);
    expect(again.sends).toBe(3);
  });

  it('02-12: the text separates the ttl of dns, in seconds, from the ttl of ip, which counts hops', () => {
    const [aboutTheServer, aboutTheIpTtl, aboutTheCache] = optionsOf(start.incident);
    expect(plain(aboutTheIpTtl.feedback)).toContain('El TTL de IP va en el encabezado de un paquete y cada router le resta al menos 1: cuenta saltos. El TTL de DNS viene en la respuesta y cuenta segundos. La caja decía «quedan N s»: eran segundos, no saltos.');
    expect(plain(aboutTheCache.feedback)).toContain('los segundos que una respuesta puede quedar guardada');
    expect(plain(start.incident.takeaway)).toContain('El TTL de DNS se cuenta en segundos y el TTL de IP cuenta saltos: no son lo mismo.');
    expect(plain(TERMS['dns-ttl'].definition)).toContain('No es el TTL de IP, que cuenta saltos.');
    expect(plain(aboutTheServer.feedback)).not.toMatch(/TTL/);
    const box = inspect(digged, digged.sent[0].pieceId);
    const lineOf = (label: string) => box?.fields.find((field) => plain(field.label) === label)?.lines.map(plain) ?? [];
    expect(lineOf(DNS_FIELD).at(-1), 'the TTL of DNS in the box is a count of seconds').toBe(`TTL: quedan ${OLD_ANSWER_SECONDS} s.`);
    expect(lineOf(LOCAL_HEADER), 'and the TTL of IP of the same packet is another number in another field').toContain('TTL al salir: 64');
    const sentences = everyState.flatMap(everythingRead).flatMap((text) => text.split(/(?<=[.!?])\s+/));
    expect(sentences.filter((sentence) => /TTL de DNS/.test(sentence) && /salto/.test(sentence) && !/TTL de IP/.test(sentence))).toEqual([]);
    expect(sentences.filter((sentence) => /TTL de IP/.test(sentence) && /segundo/.test(sentence) && !/DNS/.test(sentence))).toEqual([]);
  });

  it('02-12: the report names servidor-autoritativo and servidor-dns', () => {
    const { report } = start.incident;
    const [before, after] = [solvedWorld(INCIDENTS, PREVIOUS_INCIDENT), startWorld(INCIDENTS, STILL)];
    const serverOf = (id: string) => after.actors.find((actor) => actor.id === id && actor.kind === 'server');
    const zone = after.actors.flatMap((actor) => (actor.kind === 'server' && actor.id === SERVER.authoritative.id ? (actor.dns?.zones ?? []) : [])).flatMap(({ records }) => records);
    expect(report).toContain(`[[${SERVER.authoritative.name}]]`);
    expect(report).toContain(`[[${SERVER.resolver.name}]]`);
    expect(plain(report)).toContain(`Después cambió el registro de ${HOSTNAME.www} en ${SERVER.authoritative.name}: ahora apunta a esa IP.`);
    expect(plain(report)).toContain(`Antes de la mudanza, ${SERVER.resolver.name}, tu resolver, ya había contestado una pregunta por ${HOSTNAME.www}.`);
    expect(plain(report)).toContain('El tiempo del juego solo pasa cuando tú esperas, con las fichas de «Reloj del juego».');
    expect(plain(report), 'the report leaves the cause for the question').not.toMatch(NAMES_A_NEW_TERM);
    expect(changedNames(before, after), 'router-destino only gains the wiring of the new server').toEqual([SERVER.authoritative.name, SERVER.resolver.name]);
    expect(zone.filter(({ type }) => type !== 'NS' && type !== 'SOA').map(({ name, type, value }) => [name, type, value])).toEqual([[HOSTNAME.www, RECORD_TYPE.a, IP.freshServer], [HOSTNAME.blog, RECORD_TYPE.cname, HOSTNAME.www]]);
    const resolver = serverOf(SERVER.resolver.id);
    expect(resolver?.kind === 'server' ? resolver.dns : undefined).toMatchObject({ role: 'resolver', upstreams: [{ zone: DOMAIN.site, serverId: SERVER.authoritative.id }], cache: [{ name: HOSTNAME.www, type: RECORD_TYPE.a, value: IP.server, expiresAt: OLD_ANSWER_SECONDS }] });
    const fresh = serverOf(SERVER.fresh.id);
    expect(fresh).toMatchObject({ ip: IP.freshServer, services: [{ protocol: 'tcp', port: PORT.web }, { protocol: 'tcp', port: PORT.secureWeb }] });
    expect((after.routers ?? []).find(({ id }) => id === ROUTER.destination.id)?.interfaces).toContainEqual({ ip: IP.destinationFreshServer, faces: SERVER.fresh.id });
    expect(networkSchema.safeParse(after).error).toBeUndefined();
    expect(before.actors.map(({ id }) => id)).not.toContain(SERVER.fresh.id);
    expect(everythingRead(startSession(INCIDENTS, PREVIOUS_INCIDENT)).filter((text) => text.includes(SERVER.fresh.name))).toEqual([]);
  });

  it('02-12: draws the moved site and the pieces the question and the answer cross', () => {
    expect(drawnLabels(start)).toEqual(
      [
        `device:${DEVICE.you.name}`,
        `device:${SERVER.resolver.name}`,
        `device:${SERVER.authoritative.name}`,
        `device:${SERVER.internet.name}`,
        `device:${SERVER.fresh.name}`,
        `edge:${ROUTER.office.name}`,
        `firewall:firewall ${DEVICE.you.name}`,
        'internet:internet',
      ].sort(),
    );
    expect(start.incident.shown).toEqual(CACHE_PIECES);
    expect(drawnLabels(startSession(INCIDENTS, PREVIOUS_INCIDENT))).not.toContain(`device:${SERVER.fresh.name}`);
    expect(pieceViews(start).find(({ id }) => id === PIECE_ID.actor(SERVER.fresh.id))).toMatchObject({ locked: true, configurable: false });
    expect(pieceViews(start).find(({ id }) => id === PIECE_ID.actor(SERVER.resolver.id))).toMatchObject({ locked: false, configurable: true });
    expect(pieceCard(start, PIECE_ID.actor(SERVER.resolver.id))).toMatchObject({ tabbed: false, first: CACHE_TAB });
    expect(pieceCard(start, PIECE_ID.actor(SERVER.resolver.id))?.tabs.map(({ id }) => id)).toEqual([CACHE_TAB]);
    expect(plain(cacheOf(start)?.title ?? '')).toBe(`Caché de ${SERVER.resolver.name}`);
    expect(cacheOf(start)?.columns.map(({ id }) => id)).toEqual(['name', 'type', 'value', 'left']);
    expect(cacheOf(start)?.trays, 'the cache is read only').toBeNull();
    expect(cacheOf(startSession(INCIDENTS, PREVIOUS_INCIDENT)), 'and waits for its term').toBeUndefined();
    expect(clockSteps(start).map(({ label, seconds }) => [label, seconds])).toEqual([['Esperar 1 min', SECONDS_IN_A_MINUTE], ['Esperar 5 min', WAIT.fiveMinutes.seconds]]);
    expect(clockSteps(startSession(INCIDENTS, PREVIOUS_INCIDENT)), 'only an incident with a clock has one').toEqual([]);
  });

  it('02-12: introduces DNS cache and DNS TTL, and uses no later term', () => {
    const { introduces } = start.incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[STILL]));
    expect(sorted(introduces)).toEqual(sorted(['dns-cache', 'dns-ttl']));
    expect(unknownTerms(incidentTexts(start.incident), knownTerms(INCIDENTS, STILL))).toEqual([]);
    expect(laterTermLeaks([start.incident])).toEqual([]);
    expect(laterTermLeaks(builtOfChapter2().filter((incident) => orderOf(incident.id) <= orderOf(STILL)))).toEqual([]);
    const earlier = INCIDENTS.filter((incident) => incident.id < STILL).flatMap(incidentTexts).map(plain);
    expect(earlier.filter((text) => NAMES_A_NEW_TERM.test(text))).toEqual([]);
    expect(['El caché guarda la respuesta.', 'La cache del resolver.', 'El TTL de DNS baja.'].filter((text) => !NAMES_A_NEW_TERM.test(text))).toEqual([]);
    expect(everyState.flatMap(everythingRead).filter((text) => NEVER_TAUGHT_HERE.test(text))).toEqual([]);
    expect(['Dio NXDOMAIN.', 'Dio SERVFAIL.', 'Un Port Unreachable.', 'El archivo hosts.', 'Una consulta AAAA.', 'Con IPv6.'].filter((text) => !NEVER_TAUGHT_HERE.test(text))).toEqual([]);
  });

  it('02-12: offers only dig, so no send of the incident asks a question', () => {
    const { send } = sendIncidentOf(start);
    expect(send.message).toEqual([MESSAGE.dig]);
    expect([send.from, send.to]).toEqual([[ORIGIN.you], [ADDRESS.www]]);
    for (const session of everyState) {
      for (const sent of drawnSends(session.sent)) expect(sent.id.endsWith('-question') || sent.after !== undefined, 'a dig is the question itself, so it draws none before it').toBe(false);
      for (const run of session.sent) expect(run.question).toBeUndefined();
    }
    expect(drawnSends(diggedAfterFiveMinutes.sent)).toHaveLength(1);
    expect(sessionReducer(start, { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.www.id, messageId: MESSAGE.ping.id }).sent, 'a ping is not offered, so the session sends none').toEqual([]);
  });

  it('02-12: the numbers go on with each dig and the right option is the third and is not the longest of the three', () => {
    expect(drawnSends(diggedAfterOneMinute.sent).map(({ trace }) => [trace.header?.request.sourcePort, trace.translation?.outside.port])).toEqual([[SECOND_PORT, SECOND_PUBLIC_PORT]]);
    expectRightOptionAt(start.incident, 2);
    const [wrongOne, wrongTwo, right] = optionsOf(start.incident).map(({ text }) => plain(text).length);
    expect([wrongOne, wrongTwo, right].filter((length) => length === right)).toHaveLength(1);
    expect(Math.min(wrongOne, wrongTwo)).toBeLessThan(right);
    expect(Math.max(wrongOne, wrongTwo)).toBeGreaterThan(right);
  });
});

describe('02-13, it does not resolve', () => {
  const FAILURES = '02-13';
  const PREVIOUS_INCIDENT = '02-12';
  const FIRST_PORT = 51514;
  const FIRST_PUBLIC_PORT = 40001;
  const DNS_FIELD = 'DNS';
  const WHERE_IT_STOPPED = 'Dónde y por qué se detuvo';
  const NOERROR = 'NOERROR';
  const REPLIED = 'replied';
  const UNREACHABLE = 'unreachable';
  const PORT_UNREACHABLE = 'port-unreachable';
  const SENTENCES = /(?<=[.!?])\s+/;
  const SAYS_IT_DOES_NOT_EXIST = /\bno exist(?:e|a|ía)\b/i;
  const NEVER_TAUGHT_HERE = /AAAA|IPv6|Route 53|\bAlias\b|\bapex\b/;
  const NAMES_A_TERM_OF_THE_BLOCK = /NXDOMAIN|SERVFAIL|Port Unreachable|archivo hosts|\bhosts\b/;
  const MAX_REPORT_SENTENCES = 12;
  const CONNECTION_REFUSED = `;; communications error to ${IP.printer}#${PORT.dns}: connection refused`;
  const start = startSession(INCIDENTS, FAILURES);
  const incident = start.incident as Extract<Incident, { mechanic: 'send' }>;
  const world = startWorld(INCIDENTS, FAILURES);
  const youSend = (session: Session, address: { id: string }, message: { id: string }): Session => sendingFrom(session, ORIGIN.you.id, address.id, message.id);
  const andresSend = (session: Session, address: { id: string }, message: { id: string }): Session => sendingFrom(session, ORIGIN.andres.id, address.id, message.id);
  const digMissing = youSend(start, ADDRESS.missing, MESSAGE.dig);
  const digNews = youSend(start, ADDRESS.news, MESSAGE.dig);
  const digShop = youSend(start, ADDRESS.shop, MESSAGE.dig);
  const pingShop = youSend(start, ADDRESS.shop, MESSAGE.ping);
  const digFromAndres = andresSend(start, ADDRESS.www, MESSAGE.dig);
  const closed = andresSend(youSend(youSend(youSend(youSend(start, ADDRESS.missing, MESSAGE.dig), ADDRESS.news, MESSAGE.dig), ADDRESS.shop, MESSAGE.dig), ADDRESS.shop, MESSAGE.ping), ADDRESS.www, MESSAGE.dig);
  const everySend = incident.send.from.flatMap((from) => incident.send.to.flatMap((to) => incident.send.message.map((message) => sendingFrom(start, from.id, to.id, message.id))));
  const everyState = [start, digMissing, digNews, digShop, pingShop, digFromAndres, youSend(digShop, ADDRESS.shop, MESSAGE.ping), ...everySend];
  const boxOf = (session: Session): Record<string, string[]> => lastBox(session);
  const runOf = (session: Session) => session.sent[0];
  const printed = (session: Session, from: { id: string }, address: { id: string }): string[] => printedFrom(session, from.id, address.id, MESSAGE.dig.id);
  const sentencesOf = (texts: string[]): string[] => texts.flatMap((text) => text.split(SENTENCES));
  const claimsTheShopDoesNotExist = (sentence: string): boolean => sentence.includes(HOSTNAME.shop) && SAYS_IT_DOES_NOT_EXIST.test(sentence);
  const dnsOwnLine = `${DNS_STATUS.nonexistent}: ${HOSTNAME.shop} no existe.`;
  const translationRows = (session: Session) => (pieceCard(session, PIECE_ID.router(ROUTER.office.id))?.tabs.find((tab) => tab.id === 'translations')?.card as TableCard | undefined)?.rows.map((row) => row.cells.map((cell) => plain(cell.text))) ?? [];
  const serverOf = (id: string) => world.actors.find((actor) => actor.id === id && actor.kind === 'server');
  const dnsOf = (id: string) => {
    const server = serverOf(id);
    return server?.kind === 'server' ? server.dns : undefined;
  };
  const resolverIdOf = (originId: string): string | undefined => {
    const dnsServer = world.devices.find((device) => device.id === originId)?.dnsServer;
    return [...world.devices.map(({ id, privateIp }) => ({ id, ip: privateIp })), ...world.actors.map(({ id, ip }) => ({ id, ip }))].find(({ ip }) => ip === dnsServer)?.id;
  };

  it('02-13: dig of a name that does not exist ends in NXDOMAIN', () => {
    const run = runOf(digMissing);
    expect(run.trace.outcome).toBe(REPLIED);
    expect(run.trace.dns).toMatchObject({ name: HOSTNAME.missing, status: DNS_STATUS.nonexistent, answers: [], viaDig: true, fromCache: false });
    expect(run.trace.dns?.soa?.name, 'an authoritative NXDOMAIN carries the SOA of the zone').toBe(DOMAIN.site);
    expect(run.by).toEqual([SERVER.resolver.id]);
    expect(run.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.resolver, sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(boxOf(digMissing)[DNS_FIELD]).toEqual([`Contestó ${SERVER.resolver.name}.`, `${DNS_STATUS.nonexistent}: ${HOSTNAME.missing} no existe.`]);
    expect(printed(digMissing, ORIGIN.you, ADDRESS.missing).join('\n')).toContain(`status: ${DNS_STATUS.nonexistent}`);
    expect(stillOpen(digMissing)).toEqual([TASK.digNews, TASK.digShop, TASK.pingShop, TASK.digFromAndres]);
    expect(stillOpen(youSend(start, ADDRESS.missing, MESSAGE.ping)), 'a ping to the same name does not close the dig task').toEqual(stillOpen(start));
  });

  it('02-13: dig of a name in the zone whose server fails ends in SERVFAIL', () => {
    const run = runOf(digNews);
    expect(run.trace.outcome).toBe(REPLIED);
    expect(run.trace.dns).toMatchObject({ name: HOSTNAME.newsWww, status: DNS_STATUS.failed, answers: [], viaDig: true });
    expect(run.trace.dns?.soa, 'a server that failed says nothing about the zone').toBeUndefined();
    expect(run.by).toEqual([SERVER.resolver.id]);
    expect(boxOf(digNews)[DNS_FIELD]).toEqual([`Contestó ${SERVER.resolver.name}.`, `${DNS_STATUS.failed}: no se pudo averiguar ${HOSTNAME.newsWww}. No dice si el nombre existe.`]);
    expect(printed(digNews, ORIGIN.you, ADDRESS.news).join('\n')).toContain(`status: ${DNS_STATUS.failed}`);
    expect(stillOpen(digNews)).toEqual([TASK.digMissing, TASK.digShop, TASK.pingShop, TASK.digFromAndres]);
    expect(dnsOf(SERVER.news.id)).toMatchObject({ role: 'authoritative', failing: true });
    expect(dnsOf(SERVER.news.id)?.zones?.map(({ name }) => name)).toEqual([DOMAIN.news]);
    expect(dnsOf(SERVER.resolver.id)?.upstreams).toEqual([{ zone: DOMAIN.site, serverId: SERVER.authoritative.id }, { zone: DOMAIN.news, serverId: SERVER.news.id }]);
    const healthy = youSend(start, ADDRESS.www, MESSAGE.dig);
    expect(runOf(healthy).trace.dns, 'the resolver is fine: only the zone whose server failed ends in SERVFAIL, and the old answer of 02-12 is gone').toMatchObject({ status: NOERROR, fromCache: false });
    expect(runOf(healthy).trace.dns?.answers.map(({ type, value }) => [type, value])).toEqual([[RECORD_TYPE.a, IP.freshServer]]);
    expect(dnsOf(SERVER.resolver.id)?.cache, 'the cache of 02-12 does not carry into 02-13').toBeUndefined();
  });

  it('02-13: dig of tienda.lucia.example ends in NXDOMAIN while ping of the same name comes back', () => {
    const [dig, ping] = youSend(digShop, ADDRESS.shop, MESSAGE.ping).sent;
    expect([dig.trace.outcome, dig.trace.dns?.status, dig.trace.dns?.usedHostsFile, dig.trace.destinationId]).toEqual([REPLIED, DNS_STATUS.nonexistent, false, SERVER.resolver.id]);
    expect([ping.trace.outcome, ping.by, ping.trace.destinationId, ping.trace.resolvedIp]).toEqual([REPLIED, [SERVER.internet.id], SERVER.internet.id, IP.server]);
    expect(ping.trace.dns).toMatchObject({ name: HOSTNAME.shop, usedHostsFile: true, viaDig: false });
    expect(world.devices.find((device) => device.id === DEVICE.you.id)?.hosts).toEqual([{ name: HOSTNAME.shop, ip: IP.server }]);
    expect(dnsOf(SERVER.authoritative.id)?.zones?.flatMap((zone) => zone.records.map(({ name }) => name))).not.toContain(HOSTNAME.shop);
    expect(boxOf(pingShop)[DNS_FIELD]).toEqual([`Antes de mandar el paquete, ${DEVICE.you.name} averigua la IP de ${HOSTNAME.shop}.`, `${DEVICE.you.name} encontró ${HOSTNAME.shop} en su archivo hosts: es ${IP.server}. No preguntó a nadie.`]);
    expect(stillOpen(digShop)).toEqual([TASK.digMissing, TASK.digNews, TASK.pingShop, TASK.digFromAndres]);
    expect(stillOpen(pingShop)).toEqual([TASK.digMissing, TASK.digNews, TASK.digShop, TASK.digFromAndres]);
    expectClosed(closed);
  });

  it('02-13: the dig from laptop-andres ends in Port Unreachable from the printer', () => {
    const run = runOf(digFromAndres);
    expect([run.trace.outcome, run.by, run.trace.destinationId]).toEqual([UNREACHABLE, [DEVICE.printer.id], DEVICE.printer.id]);
    expect(run.trace.notice).toMatchObject({ kind: PORT_UNREACHABLE, fromId: DEVICE.printer.id, fromIp: IP.printer });
    expect(run.warning).toEqual({ term: PORT_UNREACHABLE, by: 'host' });
    expect(run.trace.header?.request).toMatchObject({ source: IP.andres, destination: IP.printer, destinationPort: PORT.dns });
    expect(world.devices.find((device) => device.id === DEVICE.andres.id)?.dnsServer).toBe(IP.printer);
    expect(world.devices.find((device) => device.id === DEVICE.printer.id)?.host.services.some(({ protocol, port }) => protocol === 'udp' && port === PORT.dns), 'nothing listens on UDP 53 in the printer').toBe(false);
    expect(printed(digFromAndres, ORIGIN.andres, ADDRESS.www)).toEqual([CONNECTION_REFUSED, CONNECTION_REFUSED, CONNECTION_REFUSED, '', `; <<>> DiG 9.18.50 <<>> ${HOSTNAME.www}`, ';; global options: +cmd', ';; no servers could be reached']);
    expect(boxOf(digFromAndres)[WHERE_IT_STOPPED]).toEqual([`Llega por UDP al puerto ${PORT.dns}, pero ningún programa escucha ahí: ${DEVICE.printer.name} avisa con Port Unreachable.`]);
    expect(stillOpen(digFromAndres)).toEqual([TASK.digMissing, TASK.digNews, TASK.digShop, TASK.pingShop]);
    expect(plain(incident.takeaway)).toContain('En este juego, el dig lo muestra como «connection refused».');
  });

  it('02-13: no text reads a failed dig as proof that the name does not exist when the hosts file is the cause', () => {
    const faulty = [`El dig dio NXDOMAIN: ${HOSTNAME.shop} no existe.`, `${HOSTNAME.shop} no existe, por eso el dig falló.`, `Como el dig no encontró ${HOSTNAME.shop}, ese nombre no existía.`];
    expect(faulty.filter(claimsTheShopDoesNotExist), 'the check catches a sentence that reads the failed dig as proof').toHaveLength(faulty.length);
    expect(claimsTheShopDoesNotExist(`${HOSTNAME.shop} llegó por el archivo hosts, aunque el DNS no lo tiene.`)).toBe(false);
    expect(sentencesOf(incidentTexts(incident).map(plain)).filter(claimsTheShopDoesNotExist), 'nothing the incident writes says it').toEqual([]);
    const claims = sentencesOf(everyState.flatMap(everythingRead)).filter(claimsTheShopDoesNotExist);
    expect([...new Set(claims)], 'the only sentence is the DNS’s own line in the box of the dig').toEqual([dnsOwnLine]);
    expect(boxOf(digShop)[DNS_FIELD]).toContain(dnsOwnLine);
    expect(boxTexts(pingShop).filter(claimsTheShopDoesNotExist)).toEqual([]);
    const takeaway = plain(incident.takeaway);
    expect(takeaway).toContain('Por eso un dig que falla no prueba que el nombre no exista para el dispositivo: el archivo hosts puede tener una respuesta que el DNS no tiene.');
    expect(takeaway).toContain(`${DEVICE.you.name} tiene una línea para ${HOSTNAME.shop} en su archivo hosts.`);
    const right = optionsOf(incident)[1];
    expect(plain(right.feedback)).toContain(`En ${DEVICE.you.name}, alguien puso en ese archivo una línea: ${HOSTNAME.shop} es ${IP.server}.`);
    expect(plain(right.feedback)).toContain('el DNS no tiene ese nombre');
  });

  it('02-13: the report names tu-laptop, laptop-andres, servidor-dns and servidor-autoritativo-noticias', () => {
    const { report } = incident;
    const [before, after] = [solvedWorld(INCIDENTS, PREVIOUS_INCIDENT), world];
    for (const name of [DEVICE.you.name, DEVICE.andres.name, SERVER.resolver.name, SERVER.news.name]) expect(report).toContain(`[[${name}]]`);
    expect(plain(report)).toContain(`Alguien cambió la configuración de ${SERVER.resolver.name}, tu resolver: ahora, para los nombres de ${DOMAIN.news}, le pregunta a ${SERVER.news.name}.`);
    expect(plain(report)).toContain(`Ese servidor autoritativo guarda los datos de ${DOMAIN.news}, pero falló y no contesta.`);
    expect(plain(report)).toContain(`Alguien cambió la configuración de ${DEVICE.you.name}.`);
    expect(plain(report)).toContain(`Y ahora el servidor DNS de ${DEVICE.andres.name} es la impresora, ${IP.printer}.`);
    expect(plain(report), 'the hosts file is the cause the question asks for, and the report leaves it there').not.toMatch(/hosts/);
    expect(plain(report), 'the report states only the fact about laptop-andres and adds no cause').not.toMatch(/DHCP|prestó/);
    expect(plain(report).split(SENTENCES).length).toBeLessThanOrEqual(MAX_REPORT_SENTENCES);
    expect(changedNames(before, after), 'servidor-autoritativo-noticias is a piece the action only adds, and router-destino only gains its wiring').toEqual([DEVICE.andres.name, SERVER.resolver.name, DEVICE.you.name]);
    expect(after.actors.map(({ id }) => id)).toEqual([...before.actors.map(({ id }) => id), SERVER.news.id]);
    expect(serverOf(SERVER.news.id)).toMatchObject({ ip: IP.newsAuthoritative, kind: 'server' });
    expect((after.routers ?? []).find(({ id }) => id === ROUTER.destination.id)?.interfaces).toContainEqual({ ip: IP.destinationNewsAuthoritative, faces: SERVER.news.id });
    expect(before.devices.find((device) => device.id === DEVICE.you.id)?.hosts).toBeUndefined();
    expect(networkSchema.safeParse(after).error).toBeUndefined();
    const settings = settingsCard(start, PIECE_ID.device(DEVICE.andres.id));
    expect(settings?.dns && { label: plain(settings.dns.label), value: plain(settings.dns.value), note: plain(settings.dns.note) }).toEqual({ label: 'Servidor DNS', value: `${IP.printer} ${DEVICE.printer.name}`, note: 'Lo prestó DHCP.' });
  });

  it('02-13: the NXDOMAIN demo uses a subdomain that does not exist and not a name under .invalid', () => {
    const names = [HOSTNAME.missing, ...incident.send.to.map(({ address }) => address)];
    expect(HOSTNAME.missing.endsWith(`.${DOMAIN.site}`)).toBe(true);
    expect(HOSTNAME.missing.slice(0, -DOMAIN.site.length - 1)).toMatch(/^[a-z]+$/);
    expect(names.filter((name) => /(?:^|\.)invalid$/.test(name))).toEqual([]);
    expect(everyState.flatMap(everythingRead).filter((text) => /\.invalid\b/.test(text))).toEqual([]);
    expect(incident.send.to.map(({ address }) => address)).toContain(HOSTNAME.missing);
    expect(dnsOf(SERVER.authoritative.id)?.zones?.flatMap((zone) => zone.records.map(({ name }) => name))).not.toContain(HOSTNAME.missing);
    expect(runOf(digMissing).trace.dns?.soa?.name, 'the resolver asked the authoritative server of the zone and it answered, not a rule for .invalid').toBe(DOMAIN.site);
    expect(printed(digMissing, ORIGIN.you, ADDRESS.missing).join('\n')).toContain(`${DOMAIN.site}.`);
    expect(outsideDocumentationTld(names)).toEqual([]);
    expect(publicOutsideDocumentation([...world.actors.map(({ ip }) => ip), IP.destinationNewsAuthoritative])).toEqual([]);
  });

  it('02-13: introduces NXDOMAIN, SERVFAIL, Port Unreachable and hosts file, and uses no later term', () => {
    const { introduces } = incident;
    expect(sorted(introduces)).toEqual(sorted(TERMS_OF_THE_APPROVED_DESIGN[FAILURES]));
    expect(sorted(introduces)).toEqual(sorted(['nxdomain', 'servfail', 'port-unreachable', 'hosts-file']));
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, FAILURES))).toEqual([]);
    expect(laterTermLeaks([incident])).toEqual([]);
    expect(laterTermLeaks(builtOfChapter2().filter((built) => orderOf(built.id) <= orderOf(FAILURES)))).toEqual([]);
    const earlier = INCIDENTS.filter((built) => built.id < FAILURES).flatMap(incidentTexts).map(plain);
    expect(earlier.filter((text) => NAMES_A_TERM_OF_THE_BLOCK.test(text)), 'no earlier incident names a term of this one').toEqual([]);
    expect(['Dio NXDOMAIN.', 'Dio SERVFAIL.', 'Un Port Unreachable.', 'El archivo hosts.', 'Las líneas del hosts.'].filter((text) => !NAMES_A_TERM_OF_THE_BLOCK.test(text))).toEqual([]);
    expect(everyState.flatMap(everythingRead).filter((text) => NEVER_TAUGHT_HERE.test(text))).toEqual([]);
    expect(['Con IPv6.', 'Una consulta AAAA.', 'El apex de la zona.', 'Un Alias de Route 53.'].filter((text) => !NEVER_TAUGHT_HERE.test(text))).toEqual([]);
    for (const term of introduces) expect(plain(TERMS[term].definition)).not.toMatch(/IPv6|AAAA/);
  });

  it('02-13: dig of tienda.lucia.example draws a question to the resolver and ping of the same name draws none', () => {
    const [dig] = drawnSends(digShop.sent);
    const [ping] = drawnSends(pingShop.sent);
    expect([drawnSends(digShop.sent), drawnSends(pingShop.sent)].map((sends) => sends.length), 'a dig is the question itself and a ping that the hosts file answers asks none').toEqual([1, 1]);
    expect([dig.after, dig.id.endsWith('-question'), dig.trace.destinationId, dig.by]).toEqual([undefined, false, SERVER.resolver.id, [SERVER.resolver.id]]);
    expect(dig.trace.header?.request).toMatchObject({ source: IP.you, destination: IP.resolver, sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(digShop.sent[0].packet).toMatchObject({ protocol: 'udp', port: PORT.dns });
    expect([ping.after, ping.id.endsWith('-question'), ping.trace.question, ping.trace.destinationId]).toEqual([undefined, false, undefined, SERVER.internet.id]);
    expect(pingShop.sent[0].question).toBeUndefined();
    expect(ping.trace.header?.request.sourcePort, 'the ping uses no port and so draws no datagram').toBeUndefined();
    expect(drawnSends(youSend(digShop, ADDRESS.shop, MESSAGE.ping).sent).map(({ trace }) => trace.destinationId)).toEqual([SERVER.resolver.id, SERVER.internet.id]);
    expect(translationRows(digShop).slice(1), 'the dig leaves a row in the table of translations').toEqual([['UDP · consulta DNS', `${IP.you}:${FIRST_PORT}`, `${IP.officeUplink}:${FIRST_PUBLIC_PORT}`]]);
    expect(translationRows(pingShop).slice(1), 'and the ping leaves none').toEqual([]);
    expect(boxOf(pingShop)[DNS_FIELD].join(' ')).not.toContain('La consulta salió del puerto');
    expect(drawnSends(youSend(start, ADDRESS.missing, MESSAGE.ping).sent).map(({ id }) => id.endsWith('-question')), 'a ping to a name nobody has asks first').toEqual([true, false]);
  });

  it('02-13: every send of the incident that goes by name has the resolver in its shown list', () => {
    const shown = incident.shown ?? [];
    expect(shown).toEqual(FAILURES_PIECES);
    expect(everySend).toHaveLength(incident.send.from.length * incident.send.to.length * incident.send.message.length);
    expect(incident.send.to.every(({ address }) => /[a-z]/i.test(address)), 'every address of the incident is a name').toBe(true);
    for (const origin of incident.send.from) {
      const resolverId = resolverIdOf(origin.endpoint.id);
      expect(resolverId, `${origin.id} has a resolver in the world`).toBeDefined();
      expect(shown, `${origin.id} asks ${resolverId}`).toContain(resolverId);
    }
    expect(resolverIdOf(DEVICE.you.id)).toBe(SERVER.resolver.id);
    expect(everySend.flatMap(everythingRead).filter((text) => text.includes(SERVER.fresh.name)), 'servidor-nuevo answers a ping to www and is not drawn, so no text names it').toEqual([]);
    expect(resolverIdOf(DEVICE.andres.id), 'the resolver of laptop-andres is the printer, which has no DNS service').toBe(DEVICE.printer.id);
    for (const session of everySend) {
      for (const sent of drawnSends(session.sent).filter(({ id, trace }) => id.endsWith('-question') || trace.dns?.viaDig)) expect(sent.by.filter((id) => !shown.includes(id)), `${sent.id} is a question and its resolver is drawn`).toEqual([]);
    }
  });

  it('02-13: draws the failed site, the printer that is a resolver and the router the questions cross', () => {
    expect(drawnLabels(start)).toEqual(
      [
        `device:${DEVICE.you.name}`,
        `device:${DEVICE.andres.name}`,
        `device:${DEVICE.printer.name}`,
        `device:${SERVER.resolver.name}`,
        `device:${SERVER.authoritative.name}`,
        `device:${SERVER.news.name}`,
        `device:${SERVER.internet.name}`,
        `edge:${ROUTER.office.name}`,
        `firewall:firewall ${DEVICE.you.name}`,
        'internet:internet',
      ].sort(),
    );
    expect(drawnLabels(startSession(INCIDENTS, PREVIOUS_INCIDENT))).not.toContain(`device:${SERVER.news.name}`);
    expect(pieceViews(start).find(({ id }) => id === PIECE_ID.actor(SERVER.news.id))).toMatchObject({ locked: true, configurable: false });
    expect(pieceCard(start, PIECE_ID.actor(SERVER.news.id)), 'the failed server opens no card').toBeFalsy();
    expect(pieceCard(start, PIECE_ID.device(DEVICE.andres.id))?.tabs.map(({ id }) => id)).toEqual(['terminal', 'settings', 'routes']);
    expect(everythingRead(start).filter((text) => /caído|apagado|desconectado/i.test(text)), 'the failure is told by the report and the boxes, not by a mark').toEqual([]);
  });

  it('02-13: the right option is the second and is not the longest of the three', () => {
    expectRightOptionAt(incident, 1);
    const [wrongOne, right, wrongTwo] = optionsOf(incident).map(({ text }) => plain(text).length);
    expect(Math.min(wrongOne, wrongTwo)).toBeLessThan(right);
    expect(Math.max(wrongOne, wrongTwo)).toBeGreaterThan(right);
    expect(optionsOf(incident).map(({ feedback }) => plain(feedback)).filter((text) => /^(?:No[.:]|No es eso\.|Eso es\b|Correcto\.)/.test(text))).toEqual([]);
    expect(plain(optionsOf(incident)[0].feedback)).toContain(`${DEVICE.you.name} tiene un solo resolver, ${SERVER.resolver.name}: el dig le preguntó a él. El ping ni siquiera hizo una consulta DNS.`);
    expect(closed.sent).toHaveLength(5);
  });
});

describe('02-14, on call', () => {
  const ON_CALL = '02-14';
  const PREVIOUS_INCIDENT = '02-13';
  const CASE_COUNT = 7;
  const [WWW_CASE, TYPO_CASE, SHOP_CASE, WAY_CASE, LOOP_CASE, FIREWALL_CASE, PRINTER_CASE] = [1, 2, 3, 4, 5, 6, 7];
  const FIRST_PORT = 51514;
  const FIRST_PUBLIC_PORT = 40001;
  const REPLIED = 'replied';
  const UNREACHABLE = 'unreachable';
  const DNS_FIELD = 'DNS';
  const HANDSHAKE_FIELD = 'Saludo de tres pasos';
  const TRANSLATION_FIELD = 'Traducción';
  const TRANSLATED_PORT = /:\d+ → .+:\d+$/;
  const ROUTERS_THAT_WARN_BY_TTL = [[ROUTER.office, IP.router], [ROUTER.provider, IP.provider], [ROUTER.office, IP.router]] as const;
  const PORTS_OF_THE_FOUR = [FIRST_PORT, FIRST_PORT + 1, FIRST_PORT + 2, FIRST_PORT + 3];
  const RIGHT_PLACES = [1, 2, 0, 2, 0, 1, 2];
  const SWITCHED_OFF_OR_DOWN = /apagad|ca[ií]d[oa]|encendid|prendid|desconectad/i;
  const WEB_VERBS = /\b(abr\w+|entr\w+|carg\w+|naveg\w+|visit\w+|ingres\w+|acced\w+)\b/i;
  const A_TEST_THAT_DOES_NOT_COME_BACK = [/\b(ping|nc|dig)\b.*\b(no vuelve|no vuelven|no conecta|no obtiene respuesta)\b/i, /\bning[uú]n ping\b.*\bvuelv/i];
  const NAME_OF_A_PIECE = /\[\[([^\]]+)\]\]/g;
  const FIRST_SENTENCE_OF_THE_STEPS = 'Haz tres pruebas, en orden';
  const incident = INCIDENTS.find((candidate) => candidate.id === ON_CALL);
  if (incident?.mechanic !== 'diagnose') throw new Error(`${ON_CALL} is not a diagnose incident`);
  const { cases } = incident.diagnose;
  const before = solvedWorld(INCIDENTS, PREVIOUS_INCIDENT);
  const startOfTheWatch = startWorld(INCIDENTS, ON_CALL);
  const start = startSession(INCIDENTS, ON_CALL);

  const caseOf = (session: Session): CaseSpec => {
    const spec = currentCase(session);
    if (!spec) throw new Error('the session is not on a case');
    return spec;
  };
  const rightPlace = (spec: CaseSpec): number => spec.cause.options.findIndex(({ correct }) => correct);
  const nameRight = (session: Session): Session => sessionReducer(session, { type: 'nameCause', index: rightPlace(caseOf(session)) });
  const repaired = (session: Session): Session => (caseOf(session).fix?.solution ?? []).reduce(sessionReducer, session);
  const closeCase = (session: Session): Session => sessionReducer(nameRight(repaired(session)), { type: 'nextCase' });
  const atCase = (number: number): Session => Array.from({ length: number - 1 }).reduce<Session>(closeCase, start);
  const worldOfCase = (number: number): Network => caseWorld(startOfTheWatch, cases[number - 1]);
  const sendAll = (session: Session): Session => sendCombinations(caseOf(session)).reduce((sent, { fromId, toId, messageId }) => sendingFrom(sent, fromId, toId, messageId), session);
  const outcomesOf = (session: Session): string[] => session.sent.map((run) => run.trace.outcome);
  const youSend = (session: Session, address: { id: string }, message: { id: string }): Session => sendingFrom(session, ORIGIN.you.id, address.id, message.id);
  const printed = (session: Session, address: { id: string }, message: { id: string }): string[] => printedFrom(session, ORIGIN.you.id, address.id, message.id);
  const stopCodesOf = (session: Session): string => [...new Set(session.sent.filter((run) => !run.replied).map((run) => stopStep(run.trace)?.reason.code ?? 'no-stop'))].sort().join(',');
  const testsOf = (session: Session): string[] => (caseCard(session)?.origins ?? []).flatMap((origin) => origin.tests.map((test) => plain(test.line)));
  const translatedBy = (session: Session): string[] => drawnSends(session.sent).flatMap(({ pieceId }) => (inspect(session, pieceId)?.fields ?? []).filter(({ label }) => plain(label) === TRANSLATION_FIELD).map(({ lines }) => plain(lines[0])).filter((line) => TRANSLATED_PORT.test(line)));
  const textsOf = (spec: CaseSpec): string[] => [spec.report, ...spec.hints, spec.cause.question, ...spec.cause.options.flatMap((option) => [option.text, option.feedback])];
  const rightFeedbackOf = (spec: CaseSpec): string[] => spec.cause.options.filter(({ correct }) => correct).map(({ feedback }) => feedback);
  const resolverIdOf = (session: Session, originId: string): string | undefined => {
    const dnsServer = session.world.devices.find((device) => device.id === originId)?.dnsServer;
    return [...session.world.devices.map(({ id, privateIp }) => ({ id, ip: privateIp })), ...session.world.actors.map(({ id, ip }) => ({ id, ip }))].find(({ ip }) => ip === dnsServer)?.id;
  };
  const hostsOf = (world: Network, deviceId: string) => world.devices.find((device) => device.id === deviceId)?.hosts;
  const recordNamesOf = (world: Network): string[] => world.actors.flatMap((actor) => (actor.kind === 'server' ? (actor.dns?.zones ?? []).flatMap((zone) => zone.records.map(({ name }) => name)) : []));
  const routesOf = (world: Network, routerId: string) => world.routers?.find(({ id }) => id === routerId)?.routes;
  const serviceOf = (world: Network, ownerId: string, port: number) => world.actors.flatMap((actor) => (actor.kind === 'server' && actor.id === ownerId ? (actor.services ?? []) : [])).find((service) => service.port === port);

  it('02-14: case 1 shows the three tests in order and the third is refused', () => {
    const first = atCase(WWW_CASE);
    expect(testsOf(first)).toEqual([`dig ${HOSTNAME.www}`, `ping ${HOSTNAME.www}`, `nc -vz -w 3 ${HOSTNAME.www} ${PORT.web}`]);
    const report = plain(cases[0].report);
    expect([report.indexOf('dig'), report.indexOf('ping', report.indexOf(FIRST_SENTENCE_OF_THE_STEPS)), report.lastIndexOf('nc')].every((place, index, places) => place > 0 && (index === 0 || place > places[index - 1]))).toBe(true);
    const tested = [MESSAGE.dig, MESSAGE.ping, MESSAGE.ncWeb].reduce((session, message) => youSend(session, ADDRESS.www, message), first);
    expect(outcomesOf(tested)).toEqual([REPLIED, REPLIED, 'refused']);
    const [dig, ping, nc] = tested.sent;
    expect(dig.trace.dns).toMatchObject({ name: HOSTNAME.www, status: 'NOERROR', viaDig: true });
    expect(dig.trace.dns?.answers.map(({ value }) => value)).toEqual([IP.freshServer]);
    expect([ping.trace.destinationId, nc.trace.destinationId]).toEqual([SERVER.fresh.id, SERVER.fresh.id]);
    expect(nc).toMatchObject({ replied: false, reached: true, blocked: false, warning: null, by: [SERVER.fresh.id] });
    expect(lastBox(tested)[HANDSHAKE_FIELD]).toEqual([`1. SYN, de ${DEVICE.you.name} a ${SERVER.fresh.name}`, `2. RST, de ${SERVER.fresh.name} a ${DEVICE.you.name}`]);
    expect(printed(tested, ADDRESS.www, MESSAGE.ncWeb).at(-1)).toBe('Ncat: Connection refused.');
    expect(serviceOf(tested.world, SERVER.fresh.id, PORT.web)).toMatchObject({ protocol: 'tcp', listen: 'loopback' });
    expect(caseCard(tested)?.origins[0].tests.every((test) => test.sent)).toBe(true);
  });

  it('02-14: case 1 numbers the dig, the question of the ping, the question of the nc and the nc from 51514 to 51517, and each leaves its row from 40001', () => {
    const tested = [MESSAGE.dig, MESSAGE.ping, MESSAGE.ncWeb].reduce((session, message) => youSend(session, ADDRESS.www, message), atCase(WWW_CASE));
    expect(drawnSends(tested.sent).flatMap(({ trace }) => trace.header?.request.sourcePort ?? [])).toEqual(PORTS_OF_THE_FOUR);
    expect(translatedBy(tested)).toEqual(PORTS_OF_THE_FOUR.map((port, step) => `${IP.you}:${port} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT + step}`));
  });

  it('02-14: case 2 ends in NXDOMAIN, the question goes to the resolver and nothing goes to the server', () => {
    const tested = [MESSAGE.dig, MESSAGE.ncWeb].reduce((session, message) => youSend(session, ADDRESS.mistyped, message), atCase(TYPO_CASE));
    const [dig, nc] = tested.sent;
    expect(outcomesOf(tested)).toEqual([REPLIED, 'unresolved']);
    expect(dig.trace.dns).toMatchObject({ name: HOSTNAME.typo, status: DNS_STATUS.nonexistent, answers: [], viaDig: true });
    expect(printed(tested, ADDRESS.mistyped, MESSAGE.dig).join('\n')).toContain(`status: ${DNS_STATUS.nonexistent}`);
    expect(nc.trace.dns).toMatchObject({ status: DNS_STATUS.nonexistent });
    expect(nc.question?.trace.destinationId, 'the question of the nc goes to the resolver').toBe(SERVER.resolver.id);
    expect(nc.question?.by).toEqual([SERVER.resolver.id]);
    expect([nc.replied, nc.reached, nc.trace.destinationId, nc.trace.header, nc.trace.hops]).toEqual([false, false, null, undefined, undefined]);
    expect(drawnSends(tested.sent).filter(({ trace }) => trace.destinationId !== null).map(({ trace }) => trace.destinationId), 'only the resolver is ever the destination of a packet').toEqual([SERVER.resolver.id, SERVER.resolver.id]);
    expect(tested.sent.flatMap((run) => [run, ...(run.question ? [run.question] : [])]).filter((run) => run.trace.destinationId === SERVER.fresh.id || run.trace.destinationId === SERVER.internet.id), 'nothing goes to a server of the site').toEqual([]);
    expect(lastBox(tested)['Resultado']).toEqual(['No salió: el nombre no se pudo convertir en una IP.']);
  });

  it('02-14: case 3 gets the good ip from dig and sends the ping to the one in the hosts file', () => {
    const tested = [MESSAGE.dig, MESSAGE.ping].reduce((session, message) => youSend(session, ADDRESS.shop, message), atCase(SHOP_CASE));
    const [dig, ping] = tested.sent;
    expect(dig.trace.dns?.answers.map(({ value }) => value)).toEqual([IP.server]);
    expect(ping.trace.dns).toMatchObject({ name: HOSTNAME.shop, usedHostsFile: true, viaDig: false });
    expect([ping.trace.outcome, ping.trace.header?.request.destination, ping.trace.notice?.kind, ping.warning?.term]).toEqual([UNREACHABLE, IP.staleHost, 'host-unreachable', 'host-unreachable']);
    expect(ping.by, 'a router of the internet warns: nobody has the old IP').toEqual([ROUTER.destination.id]);
    expect(lastBox(tested)[DNS_FIELD]).toEqual([`Antes de mandar el paquete, ${DEVICE.you.name} averigua la IP de ${HOSTNAME.shop}.`, `${DEVICE.you.name} encontró ${HOSTNAME.shop} en su archivo hosts: es ${IP.staleHost}. No preguntó a nadie.`]);
    expect(hostsOf(tested.world, DEVICE.you.id)).toEqual([{ name: HOSTNAME.shop, ip: IP.staleHost }]);
    expect(recordNamesOf(tested.world)).toContain(HOSTNAME.shop);
    expect(tested.world.devices.some(({ privateIp }) => privateIp === IP.staleHost) || tested.world.actors.some(({ ip }) => ip === IP.staleHost), 'nobody has the old IP').toBe(false);
  });

  it('02-14: case 4 warns Destination Net Unreachable from router-oficina', () => {
    const tested = sendAll(atCase(WAY_CASE));
    const [server, branch] = tested.sent;
    expect(outcomesOf(tested)).toEqual([UNREACHABLE, REPLIED]);
    expect(server.trace.notice).toMatchObject({ kind: 'net-unreachable', fromId: ROUTER.office.id, fromIp: IP.router });
    expect(server).toMatchObject({ replied: false, reached: false, blocked: false, by: [ROUTER.office.id], warning: { term: 'net-unreachable' } });
    expect(branch).toMatchObject({ replied: true, by: [DEVICE.branchPrinter.id] });
    expect(routesOf(tested.world, ROUTER.office.id)).toEqual([{ to: BRANCH_LAN.cidr, next: ROUTER.branch.id }]);
    expect(routesOf(before, ROUTER.office.id)?.map(({ to }) => to)).toContain('default');
    expect(tested.world.firewalls.find(({ id }) => id === FIREWALL.you)?.outbound.map(({ what }) => what.kind), 'the firewall of your laptop lets everything out').toEqual(['all']);
  });

  it('02-14: case 5 alternates two routers in its Time Exceeded and closes only with the cause named and the fix done', () => {
    const looped = atCase(LOOP_CASE);
    const byTtl = ([1, 2, 3] as const).map((ttl) => youSend(looped, ADDRESS.server, PING_WITH_TTL[ttl]).sent[0].trace.notice);
    expect(byTtl).toEqual(ROUTERS_THAT_WARN_BY_TTL.map(([router, ip]) => ({ kind: 'time-exceeded', fromId: router.id, fromIp: ip })));
    const traced = youSend(looped, ADDRESS.server, MESSAGE.traceroute).sent[0];
    const ips = traced.route?.lines.map((line) => line.ip);
    expect(new Set(ips)).toEqual(new Set([IP.router, IP.provider]));
    expect(ips?.every((ip, index) => ip !== ips[index - 1])).toBe(true);
    const pinged = youSend(looped, ADDRESS.server, MESSAGE.ping);
    expect(pinged.sent[0]).toMatchObject({ replied: false, trace: { outcome: 'ttl-exceeded' } });
    const taskIsDone = (session: Session) => caseCard(session)?.repair?.tasks.map(({ done }) => done);
    expect(taskIsDone(pinged), 'the task of the fix fails before the solution').toEqual([false]);
    expect(caseCard(pinged)?.repair?.tables.map(({ title }) => plain(title))).toEqual([`Tabla de rutas de ${ROUTER.provider.name}`]);
    expect(routesOf(looped.world, ROUTER.provider.id)).toEqual([{ to: 'default', next: ROUTER.office.id }]);
    const namedOnly = nameRight(pinged);
    expect([caseClosed(namedOnly), taskIsDone(namedOnly)]).toEqual([false, [false]]);
    const fixedOnly = repaired(looped);
    expect([caseClosed(fixedOnly), taskIsDone(fixedOnly)]).toEqual([false, [true]]);
    expect(routesOf(fixedOnly.world, ROUTER.provider.id)).toEqual([{ to: SERVER_RANGE, next: ROUTER.destination.id }]);
    expect([caseClosed(nameRight(fixedOnly)), caseClosed(repaired(namedOnly))]).toEqual([true, true]);
    expect(nameRight(fixedOnly).sent[0]).toMatchObject({ replied: true, by: [SERVER.internet.id] });
  });

  it('02-14: case 5 is not repaired by a route that keeps sending the servers back to router-oficina', () => {
    const looped = atCase(LOOP_CASE);
    const sendBack = sessionReducer(looped, routeMove(PROVIDER_ROUTES_FIX.to.servers, PROVIDER_ROUTES_FIX.via.office, PROVIDER_ROUTES_FIX.table));
    expect(routesOf(sendBack.world, ROUTER.provider.id)?.map(({ to }) => to)).toEqual(['default', SERVER_RANGE]);
    expect(youSend(sendBack, ADDRESS.server, MESSAGE.ping).sent[0].trace.outcome).toBe('ttl-exceeded');
    expect(caseClosed(nameRight(youSend(sendBack, ADDRESS.server, MESSAGE.ping)))).toBe(false);
    const toTheServers = sessionReducer(looped, routeMove(PROVIDER_ROUTES_FIX.to.servers, PROVIDER_ROUTES_FIX.via.destination, PROVIDER_ROUTES_FIX.table));
    expect(youSend(toTheServers, ADDRESS.server, MESSAGE.ping).sent[0].replied, 'the block of the servers towards router-destino also ends the loop for them, with the default route kept').toBe(true);
  });

  it('02-14: case 6 is silent towards one port only and the firewall of laptop-lucia is visible', () => {
    const tested = [MESSAGE.ncSsh, MESSAGE.ncApp].reduce((session, message) => youSend(session, ADDRESS.lucia, message), atCase(FIREWALL_CASE));
    const [ssh, app] = tested.sent;
    expect(outcomesOf(tested)).toEqual([REPLIED, 'timeout']);
    expect(ssh).toMatchObject({ replied: true, by: [DEVICE.lucia.id] });
    expect(app).toMatchObject({ replied: false, reached: false, blocked: true, warning: null, by: [FIREWALL.lucia] });
    expect(stopStep(app.trace)).toMatchObject({ stage: 'firewall-in', at: DEVICE.lucia.id, verdict: 'drop' });
    expect(lastBox(tested)['Dónde y por qué se detuvo']).toEqual([`Se queda en el firewall de ${DEVICE.lucia.name}: ninguna regla lo deja entrar.`]);
    expect(drawnLabels(tested)).toContain(`firewall:firewall ${DEVICE.lucia.name}`);
    expect(tested.world.firewalls.find(({ id }) => id === FIREWALL.lucia)?.inbound.map(({ what }) => what)).toEqual([{ kind: 'tcp', fromPort: PORT.ssh, toPort: PORT.ssh }]);
    expect(serviceOf({ ...tested.world, actors: [] }, DEVICE.lucia.id, PORT.app), 'the actors are not devices').toBeUndefined();
    expect(tested.world.devices.find(({ id }) => id === DEVICE.lucia.id)?.host.services).toContainEqual({ protocol: 'tcp', port: PORT.app, listen: 'all' });
  });

  it('02-14: case 7 ends in Port Unreachable from the printer', () => {
    const tested = sendingFrom(atCase(PRINTER_CASE), ORIGIN.andres.id, ADDRESS.www.id, MESSAGE.dig.id);
    const [dig] = tested.sent;
    expect([dig.trace.outcome, dig.by, dig.trace.destinationId]).toEqual([UNREACHABLE, [DEVICE.printer.id], DEVICE.printer.id]);
    expect(dig.trace.notice).toMatchObject({ kind: 'port-unreachable', fromId: DEVICE.printer.id, fromIp: IP.printer });
    expect(dig.warning).toEqual({ term: 'port-unreachable', by: 'host' });
    expect(worldOfCase(PRINTER_CASE).devices.find(({ id }) => id === DEVICE.andres.id)?.dnsServer).toBe(IP.printer);
    expect(worldOfCase(PRINTER_CASE).devices.find(({ id }) => id === DEVICE.printer.id)?.host.services.some(({ protocol, port }) => protocol === 'udp' && port === PORT.dns)).toBe(false);
    expect(lastBox(tested)['Dónde y por qué se detuvo']).toEqual([`Llega por UDP al puerto ${PORT.dns}, pero ningún programa escucha ahí: ${DEVICE.printer.name} avisa con Port Unreachable.`]);
    expect(printedFrom(tested, ORIGIN.andres.id, ADDRESS.www.id, MESSAGE.dig.id).at(-1)).toBe(';; no servers could be reached');
    expect(lastBox(tested)[DNS_FIELD]).toEqual([`${DEVICE.printer.name} no contestó como un resolver.`]);
    expect((inspect(tested, PIECE_ID.device(DEVICE.printer.id))?.fields ?? []).find(({ label }) => plain(label) === 'Servicios')?.lines.map(plain), 'nothing listens in the printer').toEqual(['Ninguno.']);
  });

  it('02-14: naming the right cause of the seven cases earns three stars', () => {
    const finished = Array.from({ length: CASE_COUNT }).reduce<Session>(closeCase, start);
    expect(finished.phase).toBe('explaining');
    expect(finished.caseResults).toHaveLength(CASE_COUNT);
    expect(starsOf(finished)).toEqual({ closed: true, middle: true, explained: true });
    expect(caseSummary(finished)).toEqual({ total: CASE_COUNT, missed: [] });
    expect(sessionReducer(finished, { type: 'showResult' }).phase).toBe('result');
    expect(starsOf(Array.from({ length: CASE_COUNT }).reduce<Session>((session) => sessionReducer(nameRight(session), { type: 'nextCase' }), start)), 'without the fix of case 5 the watch does not end').toMatchObject({ closed: false });
  });

  it('02-14: a wrong name first costs the explained star and a hint costs the middle one, but neither stops the close', () => {
    const wrongFirst = (session: Session) => sessionReducer(session, { type: 'nameCause', index: caseOf(session).cause.options.findIndex(({ correct }) => !correct) });
    const play = (slip: (number: number, session: Session) => Session) => Array.from({ length: CASE_COUNT }).reduce<Session>((session, _, index) => closeCase(slip(index + 1, session)), start);
    expect(starsOf(play((number, session) => (number === LOOP_CASE ? wrongFirst(session) : session)))).toEqual({ closed: true, middle: true, explained: false });
    expect(starsOf(play((number, session) => (number === WWW_CASE ? sessionReducer(session, { type: 'showHint' }) : session)))).toEqual({ closed: true, middle: false, explained: true });
  });

  it('02-14: each case has a different cause', () => {
    const stops = Array.from({ length: CASE_COUNT }, (_, index) => stopCodesOf(sendAll(atCase(index + 1))));
    expect(stops.filter((codes) => codes === '')).toEqual([]);
    expect(new Set(stops).size, stops.join(' | ')).toBe(CASE_COUNT);
    const rights = cases.map((spec) => plain(spec.cause.options[rightPlace(spec)].text));
    expect(new Set(rights).size).toBe(CASE_COUNT);
    expect(cases.map((spec) => spec.id)).toEqual(Array.from({ length: CASE_COUNT }, (_, index) => `case-${index + 1}`));
  });

  it('02-14: each case starts from the world before the incident plus its own changes, not from the case before', () => {
    expect(incident.changes).toEqual([]);
    expect(startOfTheWatch).toEqual(before);
    expect(solvedWorld(INCIDENTS, ON_CALL)).toEqual(startOfTheWatch);
    const worlds = cases.map((_, index) => worldOfCase(index + 1));
    expect(worlds).toEqual(cases.map((spec) => (spec.changes ?? []).reduce(applyAction, before)));
    expect(worlds.map((world) => changedNames(before, world))).toEqual([[SERVER.fresh.name], [], [SERVER.authoritative.name, DEVICE.you.name], [ROUTER.office.name], [ROUTER.provider.name], [], []]);
    expect(cases.map((spec) => spec.changes)).toEqual([[SITE_ON_LOOPBACK], undefined, STALE_SHOP, [DEFAULT_ROUTE_LOST], LOOP, undefined, undefined]);
    expect(serviceOf(worlds[1], SERVER.fresh.id, PORT.web)?.listen, 'case 2 does not keep the loopback of case 1').toBe('all');
    expect(hostsOf(worlds[3], DEVICE.you.id), 'case 4 does not keep the hosts line of case 3').toEqual(hostsOf(before, DEVICE.you.id));
    expect(recordNamesOf(worlds[3])).toEqual(recordNamesOf(before));
    expect(routesOf(worlds[4], ROUTER.office.id), 'case 5 does not keep the lost default route of case 4').toEqual(routesOf(before, ROUTER.office.id));
    expect(routesOf(worlds[5], ROUTER.provider.id), 'case 6 does not keep the loop of case 5').toEqual(routesOf(before, ROUTER.provider.id));
    expect(worlds.flatMap((world) => networkSchema.safeParse(world).error?.issues.map((issue) => issue.message) ?? [])).toEqual([]);
  });

  it('02-14: no report and no correct option names a switched-off device as the cause', () => {
    const spoken = cases.flatMap((spec) => [spec.report, ...spec.cause.options.filter(({ correct }) => correct).flatMap((option) => [option.text, option.feedback])]).map(plain);
    expect(spoken.filter((text) => SWITCHED_OFF_OR_DOWN.test(text))).toEqual([]);
    expect(['Porque servidor-internet está caído.', 'Porque la impresora está apagada.', 'Porque el router está desconectado.'].every((text) => SWITCHED_OFF_OR_DOWN.test(text))).toBe(true);
    const everyText = [...incidentTexts(incident), ...Array.from({ length: CASE_COUNT }, (_, index) => everythingRead(sendAll(atCase(index + 1)))).flat()].map(plain);
    expect(everyText.filter((text) => /apagad|desconectad/i.test(text))).toEqual([]);
  });

  it('02-14: every case report names a ping, an nc or a dig that does not come back and none uses a verb of the web', () => {
    const reports = cases.map((spec) => plain(spec.report));
    expect(reports).toHaveLength(CASE_COUNT);
    expect(reports.filter((report) => !A_TEST_THAT_DOES_NOT_COME_BACK.some((pattern) => pattern.test(report)))).toEqual([]);
    expect(reports.filter((report) => WEB_VERBS.test(report))).toEqual([]);
    expect(WEB_VERBS.test('Abre la página.') && WEB_VERBS.test('No carga el sitio.')).toBe(true);
    expect(plain(incident.report)).not.toMatch(WEB_VERBS);
  });

  it('02-14: every change a case makes is named in its report or in the feedback of its right cause', () => {
    for (const [index, spec] of cases.entries()) {
      const after = worldOfCase(index + 1);
      expect(unnamedChanges(before, after, [spec.report, ...rightFeedbackOf(spec)]), spec.id).toEqual([]);
    }
    const [loopback, , shop, way, loop] = cases.map((spec) => [spec.report, ...rightFeedbackOf(spec)].map(plain).join(' '));
    expect(loopback).toContain(`Alguien cambió la configuración de ${SERVER.fresh.name}: su servicio del puerto ${PORT.web} ahora tiene como dirección de escucha 127.0.0.1.`);
    expect(shop).toContain(`Alguien agregó a ${SERVER.authoritative.name} un registro A de ese nombre. Y alguien cambió la configuración de ${DEVICE.you.name}.`);
    expect(way).toContain(`Alguien cambió la configuración de ${ROUTER.office.name}: le quitó la ruta por defecto y solo conserva la ruta a ${BRANCH_LAN.cidr}`);
    expect(loop).toContain(`Alguien cambió la configuración de ${ROUTER.provider.name}: ahora todo lo que recibe se lo devuelve a ${ROUTER.office.name}.`);
    expect(LOOP).toEqual(cases[LOOP_CASE - 1].changes);
  });

  it('02-14: case 1 draws the dig and the question of the ping and of the nc by name, each with its stamp at the resolver', () => {
    const tested = [MESSAGE.dig, MESSAGE.ping, MESSAGE.ncWeb].reduce((session, message) => youSend(session, ADDRESS.www, message), atCase(WWW_CASE));
    const drawn = drawnSends(tested.sent);
    expect(drawn.map(({ id }) => id.replace(`sent-you-${ADDRESS.www.id}-`, ''))).toEqual(['dig', 'ping-question', 'ping', 'nc-80-question', 'nc-80']);
    expect(drawn.filter(({ trace }) => trace.destinationId === SERVER.resolver.id).map(({ id }) => id.replace(`sent-you-${ADDRESS.www.id}-`, '')), 'three stamps at the resolver: the dig and the two questions').toEqual(['dig', 'ping-question', 'nc-80-question']);
    expect(drawn.filter(({ after }) => after !== undefined).map(({ after, id }) => [after, id.replace('sent-you-name-www-', '')])).toEqual([
      ['sent-you-name-www-ping-question', 'ping'],
      ['sent-you-name-www-nc-80-question', 'nc-80'],
    ]);
    expect(drawn.find(({ id }) => id.endsWith('-ping'))?.trace.destinationId).toBe(SERVER.fresh.id);
    expect(drawn.find(({ id }) => id.endsWith('-nc-80'))?.trace.destinationId).toBe(SERVER.fresh.id);
    expect(drawn.map(({ trace }) => trace.dns?.fromCache)).toEqual([false, true, true, true, true]);
    expect(youSend(atCase(WWW_CASE), ADDRESS.www, MESSAGE.ping).sent[0].question?.trace.header?.request.sourcePort, 'asked first, the ping question takes the first port').toBe(FIRST_PORT);
  });

  it('02-14: case 2 draws the question and its answer and the nc stays at its doorstep without a port', () => {
    const tested = [MESSAGE.dig, MESSAGE.ncWeb].reduce((session, message) => youSend(session, ADDRESS.mistyped, message), atCase(TYPO_CASE));
    const drawn = drawnSends(tested.sent);
    expect(drawn.map(({ id }) => id.replace('sent-you-name-mistyped-', ''))).toEqual(['dig', 'nc-80-question', 'nc-80']);
    expect(drawn.map(({ trace }) => trace.destinationId)).toEqual([SERVER.resolver.id, SERVER.resolver.id, null]);
    expect(drawn[0].trace.header?.request).toMatchObject({ sourcePort: FIRST_PORT, destinationPort: PORT.dns });
    expect(drawn[1].trace.header?.request).toMatchObject({ sourcePort: FIRST_PORT + 1, destinationPort: PORT.dns });
    expect(drawn[2].trace.header, 'the nc never got a port').toBeUndefined();
    expect(drawn[2].after).toBe(drawn[1].id);
    expect(translatedBy(tested)).toEqual([0, 1].map((step) => `${IP.you}:${FIRST_PORT + step} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT + step}`));
  });

  it('02-14: case 3 draws a question for the dig and none for the ping, which the hosts file answered', () => {
    const digged = youSend(atCase(SHOP_CASE), ADDRESS.shop, MESSAGE.dig);
    const pinged = youSend(atCase(SHOP_CASE), ADDRESS.shop, MESSAGE.ping);
    expect([drawnSends(digged.sent), drawnSends(pinged.sent)].map((sends) => sends.length), 'a dig is the question itself and a ping that the hosts file answers asks none').toEqual([1, 1]);
    expect([drawnSends(digged.sent)[0].trace.destinationId, drawnSends(digged.sent)[0].after]).toEqual([SERVER.resolver.id, undefined]);
    expect([drawnSends(pinged.sent)[0].trace.question, pinged.sent[0].question, drawnSends(pinged.sent)[0].trace.header?.request.sourcePort]).toEqual([undefined, undefined, undefined]);
    expect(translatedBy(digged)).toEqual([`${IP.you}:${FIRST_PORT} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT}`]);
    expect(translatedBy(pinged), 'and the ping leaves none').toEqual([]);
    expect(drawnSends(youSend(digged, ADDRESS.shop, MESSAGE.ping).sent).map(({ trace }) => trace.destinationId)).toEqual([SERVER.resolver.id, null]);
  });

  it('02-14: every case that sends by name has the resolver in its shown list', () => {
    const byName = cases.map((spec, index) => ({ spec, session: atCase(index + 1) })).filter(({ spec }) => spec.send.to.some(({ address }) => /[a-z]/i.test(address)));
    expect(byName.map(({ spec }) => spec.id)).toEqual(['case-1', 'case-2', 'case-3', 'case-7']);
    for (const { spec, session } of byName) {
      const resolverIds = spec.send.from.map((origin) => resolverIdOf(session, origin.endpoint.id));
      expect(resolverIds.filter((id) => id === undefined), spec.id).toEqual([]);
      for (const id of resolverIds) expect(spec.shown, `${spec.id} asks ${id}`).toContain(id);
      const sent = sendAll(session);
      for (const run of drawnSends(sent.sent).filter(({ id, trace }) => id.endsWith('-question') || trace.dns?.viaDig)) expect(run.by.filter((id) => !spec.shown?.includes(id)), `${spec.id}: ${run.id}`).toEqual([]);
    }
    expect(resolverIdOf(atCase(PRINTER_CASE), DEVICE.andres.id), 'the resolver of laptop-andres is the printer').toBe(DEVICE.printer.id);
  });

  it('02-14: each case draws only the pieces it uses', () => {
    expect(incident.shown).toBeUndefined();
    expect(cases.map((spec) => spec.shown?.length)).not.toContain(undefined);
    const drawn = Array.from({ length: CASE_COUNT }, (_, index) => drawnLabels(atCase(index + 1)));
    const device = (...names: string[]) => names.map((name) => `device:${name}`);
    const youAndTheRouter = [...device(DEVICE.you.name, SERVER.resolver.name), `edge:${ROUTER.office.name}`, `firewall:firewall ${DEVICE.you.name}`];
    expect(drawn).toEqual(
      [
        [...youAndTheRouter, ...device(SERVER.fresh.name), 'internet:internet'],
        [...youAndTheRouter, 'internet:internet'],
        [...youAndTheRouter, ...device(SERVER.authoritative.name, SERVER.internet.name), 'internet:internet'],
        [...device(DEVICE.you.name, DEVICE.branchPrinter.name, SERVER.internet.name), `edge:${ROUTER.office.name}`, `edge:${ROUTER.branch.name}`, `firewall:firewall ${DEVICE.you.name}`, 'internet:internet'],
        [...device(DEVICE.you.name, SERVER.internet.name), `edge:${ROUTER.office.name}`, `edge:${ROUTER.provider.name}`, `edge:${ROUTER.destination.name}`, `firewall:firewall ${DEVICE.you.name}`, 'internet:internet'],
        [...device(DEVICE.you.name, DEVICE.lucia.name), `firewall:firewall ${DEVICE.you.name}`, `firewall:firewall ${DEVICE.lucia.name}`],
        [...device(DEVICE.andres.name, DEVICE.printer.name), `edge:${ROUTER.office.name}`],
      ].map((labels) => [...labels].sort()),
    );
  });

  it('02-14: every piece a text of a case names is drawn in that case', () => {
    for (const [index, spec] of cases.entries()) {
      const drawnNames = drawnLabels(atCase(index + 1)).map((label) => label.slice(label.indexOf(':') + 1));
      const named = textsOf(spec).flatMap((text) => [...text.matchAll(NAME_OF_A_PIECE)].map(([, name]) => name));
      expect(named.filter((name) => !drawnNames.includes(name)), spec.id).toEqual([]);
      expect(named.length, spec.id).toBeGreaterThan(0);
    }
  });

  it('02-14: the routers that the traceroute of case 5 crosses are in its list of shown pieces, and case 5 is the only case that offers a traceroute', () => {
    const shown = cases[LOOP_CASE - 1].shown ?? [];
    const crossed = routersCrossedByTraceroutes(cases[LOOP_CASE - 1], worldOfCase(LOOP_CASE));
    expect(crossed).toEqual([ROUTER.office.id, ROUTER.provider.id]);
    expect(crossed.filter((id) => !shown.includes(id))).toEqual([]);
    expect(shown, 'the chips of the fix name router-destino').toContain(ROUTER.destination.id);
    expect(cases.filter((spec) => spec.send.message.some((chip) => chip.command === 'traceroute')).map((spec) => spec.id)).toEqual(['case-5']);
  });

  it('02-14: the fix of case 5 fails before its reference solution and holds after it, and only case 5 has a fix', () => {
    const { fix } = cases[LOOP_CASE - 1];
    expect(fix).toEqual(LOOP_FIX);
    expect(cases.filter((spec) => spec.fix).map((spec) => spec.id)).toEqual(['case-5']);
    expect(fix?.tables.map(({ ownerId, kind }) => [ownerId, kind])).toEqual([[ROUTER.provider.id, 'routes']]);
    const looped = youSend(atCase(LOOP_CASE), ADDRESS.server, MESSAGE.ping);
    expect(fix?.tasks.every((task) => !taskHolds(task, looped.runs, looped.sent))).toBe(true);
    const solved = repaired(atCase(LOOP_CASE));
    expect(fix?.tasks.every((task) => taskHolds(task, solved.runs, solved.sent))).toBe(true);
    expect(solved.history, 'the solution ends with the ping, because every change of the world clears the sends').toHaveLength(1);
  });

  it('02-14: the right option is where its sheet puts it and between the other two by length', () => {
    expect(cases.map(rightPlace)).toEqual(RIGHT_PLACES);
    for (const spec of cases) {
      const lengths = spec.cause.options.map(({ text }) => plain(text).length);
      const right = lengths[rightPlace(spec)];
      const others = lengths.filter((_, index) => index !== rightPlace(spec));
      expect([Math.min(...others) < right, right < Math.max(...others)], `${spec.id}: ${lengths.join(', ')}`).toEqual([true, true]);
      expect(spec.cause.options.map(({ feedback }) => plain(feedback)).filter((text) => /^(?:No[.:]|No es eso\.|Eso es\b|Correcto\.)/.test(text)), spec.id).toEqual([]);
      expect(plain(spec.cause.question).match(/\?/g), spec.id).toHaveLength(1);
      expect(spec.hints, spec.id).toHaveLength(2);
    }
  });

  it('02-14: introduces no term and uses none that is later', () => {
    expect(incident.introduces).toEqual([]);
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, ON_CALL))).toEqual([]);
    expect(laterTermLeaks([incident])).toEqual([]);
  });
});

describe('the marks of the servers of names on the map of chapter 2', () => {
  const marksOf = (incidentId: string): Record<string, string | undefined> =>
    Object.fromEntries(pieceViews(startSession(INCIDENTS, incidentId)).filter((piece) => piece.variant === 'internet-server').map((piece) => [plain(piece.label), piece.role]));

  it('chapter 2: servidor-dns wears the resolver mark and servidor-autoritativo the authoritative one', () => {
    const { resolver, authoritative, news, fresh } = SERVER;
    expect(marksOf('02-10')[resolver.name]).toBe('resolver');
    expect(marksOf('02-11')).toMatchObject({ [resolver.name]: 'resolver', [authoritative.name]: 'authoritative' });
    expect(marksOf('02-12')).toMatchObject({ [resolver.name]: 'resolver', [authoritative.name]: 'authoritative', [fresh.name]: undefined });
    expect(marksOf('02-13')).toMatchObject({ [resolver.name]: 'resolver', [authoritative.name]: 'authoritative', [news.name]: 'authoritative' });
    expect(marksOf('02-14')[resolver.name]).toBe('resolver');
    expect(Object.values(marksOf('02-10')).filter((role) => role === 'authoritative')).toEqual([]);
  });
});

