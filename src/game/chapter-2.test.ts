import { describe, expect, it } from 'vitest';
import { TERMS, toPlainText, type TermId } from '@/copy';
import { applyAction, ipInCidr, isLoopbackIpv4, networkSchema, type Network } from '@/engine';
import { INCIDENTS, isGuided, solvedWorld, startWorld, type Incident } from '@/levels';
import { changedNames } from '@/levels/contract/changes';
import { incidentTexts, knownTerms, namedTerms, unknownTerms } from '@/levels/ladder';
import { ADDRESS, APP_ON_LOOPBACK, CLIENT, DEVICE, DOMAIN, FLOORS_PIECES, HOSTNAME, IP, LUCIA_SERVICES, MESSAGE, ORIGIN, PORT, REFUSAL_PIECES, ROUTER, SERVER, SERVICES_PIECES, SSH_AND_FIREWALL, SSH_PIECES, TASK } from '@/levels/02-ports-and-names/shared';
import { CHAPTER_1_TERMS, sendIncident } from '@/testing';
import { sessionReducer, startSession, starsOf, type Session } from './session';
import { taskHolds } from './tasks';
import { terminalLine } from './view/cards/terminal/terminal-card';
import { toolOutput } from './view/cards/terminal/output-card';
import { inspect } from './view/inspection';
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

/** Sends this message from your laptop to laptop-lucia. */
const sending = (session: Session, messageId: string): Session => sessionReducer(session, { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.lucia.id, messageId });

/** Returns the ids of the tasks of a guided incident that do not hold yet. */
const stillOpen = ({ incident, runs, sent, answers }: Session): string[] => (isGuided(incident) ? incident.tasks.filter((task) => !taskHolds(task, runs, sent, answers)).map(({ id }) => id) : []);

/** Returns the box of the last packet sent, by the plain text of each field label, with the plain text of its lines. */
const lastBox = (session: Session): Record<string, string[]> => {
  const box = inspect(session, session.sent.at(-1)!.pieceId);
  return Object.fromEntries((box?.fields ?? []).map(({ label, lines }) => [toPlainText(label), lines.map((line) => toPlainText(line))]));
};

/** Returns the lines the output card prints for the message sent from your laptop to laptop-lucia. */
const printedBy = (session: Session, messageId: string): string[] =>
  (toolOutput(session, { from: ORIGIN.you.id, to: ADDRESS.lucia.id, message: messageId })?.segments ?? []).flatMap((segment) => (segment.kind === 'line' ? [segment.text] : segment.lines));

const plain = (text: string): string => toPlainText(text);

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
  const boxTexts = (session: Session): string[] =>
    session.sent.flatMap((run) => inspect(session, run.pieceId)?.fields ?? []).flatMap((field) => [field.label, ...field.lines, ...(field.notes ?? [])]).map(plain);
  const everythingRead = (session: Session): string[] => [
    ...incidentTexts(session.incident).map(plain),
    ...boxTexts(session),
    ...session.sent.flatMap((run) => printedBy(session, run.messageId)),
    ...session.incident.introduces.map((term) => TERMS[term].definition),
  ];

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
