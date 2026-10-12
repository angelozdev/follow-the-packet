import { describe, expect, it } from 'vitest';
import { TERMS, toPlainText, type TermId } from '@/copy';
import { applyAction, ipInCidr, isLoopbackIpv4, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, namedTerms, unknownTerms } from '@/levels/ladder';
import { ADDRESS, APP_LISTEN, APP_ON_LOOPBACK, CLIENT, DEVICE, DOMAIN, FIREWALL, FLOORS_PIECES, HOSTNAME, IP, LUCIA_SERVICES, MESSAGE, ORIGIN, PORT, REFUSAL_PIECES, ROUTER, SERVER, SERVICES_PIECES, SSH_AND_FIREWALL, SSH_PIECES, TASK } from '@/levels/02-ports-and-names/shared';
import { CHAPTER_1_TERMS, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';
import { terminalLine } from './view/cards/terminal/terminal-card';
import { pieceCard } from './view/cards/piece-card';
import { servicesCard } from './view/cards/settings-card';
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
