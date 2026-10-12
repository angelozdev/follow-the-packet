import { describe, expect, it } from 'vitest';
import { TERMS, toPlainText, type TermId } from '@/copy';
import { applyAction, extraOpenings, ipInCidr, isLoopbackIpv4, maskOf, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, namedTerms, unknownTerms } from '@/levels/ladder';
import {
  ADDRESS,
  APP_LISTEN,
  APP_ON_LOOPBACK,
  BLOCK,
  BLOCK_CARD,
  BRANCH_LAN,
  CLIENT,
  DEVICE,
  DOMAIN,
  FIREWALL,
  FLOORS_PIECES,
  HOSTNAME,
  IP,
  LUCIA_SERVICES,
  MESSAGE,
  OFFICE_ROUTES,
  ORIGIN,
  OTHER_OFFICE,
  OUTSIDE_PIECES,
  PORT,
  REFUSAL_PIECES,
  ROUTER,
  ROUTES_LOST,
  ROUTES_PIECES,
  SERVER,
  SERVICES_PIECES,
  SSH_AND_FIREWALL,
  SSH_FLOW,
  SSH_FROM,
  SSH_PIECES,
  SSH_WHAT,
  TASK,
  TRANSLATION_PIECES,
  routeMove,
} from '@/levels/02-ports-and-names/shared';
import { CHAPTER_1_TERMS, sendIncident } from '@/testing';
import { isIntruding, sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';
import { terminalLine } from './view/cards/terminal/terminal-card';
import { identifyCard } from './view/cards/identify-card';
import { classifiedBlock, classifyCard } from './view/cards/identify/classify-card';
import { pieceCard } from './view/cards/piece-card';
import { servicesCard } from './view/cards/settings-card';
import type { TableCard } from './view/cards/table-card';
import { toolOutput } from './view/cards/terminal/output-card';
import { inspect } from './view/inspection';
import { PIECE_ID } from './view/piece-id';
import { pieceViews } from './view/pieces';

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
    expect(yours[TRANSLATION]).toEqual([
      `${IP.you}:${FIRST_PORT} → ${IP.officeUplink}:${FIRST_PUBLIC_PORT}`,
      'Cambió la IP y el puerto de origen (traducción de puertos).',
      'Es una fila nueva de la tabla de traducciones.',
    ]);
    const hers = lastBox(both);
    expect(hers[LOCAL_HEADER]).toEqual([`${IP.lucia}:${FIRST_PORT} → ${IP.server}:${PORT.web}`, 'TTL al salir: 64']);
    expect(hers[INTERNET_HEADER]).toEqual([`${IP.officeUplink}:${SECOND_PUBLIC_PORT} → ${IP.server}:${PORT.web}`]);
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
    expect(translationsOf(unmapped)?.rows).toEqual([]);
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
    expect(translationsOf(forwarded)?.rows).toEqual([]);
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
