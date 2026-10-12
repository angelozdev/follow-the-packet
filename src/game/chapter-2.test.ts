import { describe, expect, it } from 'vitest';
import { TERMS, toPlainText, type TermId } from '@/copy';
import { applyAction, ipInCidr, isLoopbackIpv4, networkSchema, type Network } from '@/engine';
import { INCIDENTS, solvedWorld, type Incident } from '@/levels';
import { incidentTexts, namedTerms } from '@/levels/ladder';
import { APP_ON_LOOPBACK, CLIENT, DEVICE, DOMAIN, FLOORS_PIECES, HOSTNAME, IP, LUCIA_SERVICES, PORT, REFUSAL_PIECES, ROUTER, SERVER, SERVICES_PIECES, SSH_AND_FIREWALL, SSH_PIECES } from '@/levels/02-ports-and-names/shared';
import { CHAPTER_1_TERMS, sendIncident } from '@/testing';

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
