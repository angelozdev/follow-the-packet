import { describe, expect, it } from 'vitest';
import { TASK_CARD_TEXT, TERMS, parseTermText, termsIn, toPlainText, unofficialNames, type TermId } from '@/copy';
import { ipInCidr, lansOf } from '@/engine';
import { diagnoseIncident, filterIncident, gatewayIncident } from '@/testing';
import { IP } from './01-first-day/shared';
import { FROM } from './04-iaas/shared';
import { isGuided, type Incident, type SendIncident } from './contract/incident';
import { RULES_TERM, chipLabels, configurableParts, incidentTexts, knownTerms, namedTerms, unknownTerms } from './ladder';
import { INCIDENTS } from './registry';
import { startWorld } from './world';

const CLOSED = { 'host-firewall': false, 'security-group': false };
const NOTHING = { inboundRules: CLOSED, outboundRules: CLOSED, hostSettings: false };
const HOST_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': false } };
const HOST_RULES_IN_AND_OUT = { ...HOST_RULES, outboundRules: { 'host-firewall': true, 'security-group': false } };
const INBOUND_RULES = { ...NOTHING, inboundRules: { 'host-firewall': true, 'security-group': true }, outboundRules: { 'host-firewall': true, 'security-group': false } };
const DECLARED_LEAKS = ['icmp → internet'];
const ALL_TERMS = Object.keys(TERMS) as TermId[];
const BY_INCIDENT = INCIDENTS.map((i): [string, Incident] => [i.id, i]);
const OWN_TERMS_OF_04_01 = ['ec2-instance', 'vpc', 'security-group', 'inbound-rule', 'anywhere-ipv4', 'internet-gateway'];
const CHAPTER_1_TERMS_BEFORE_THE_FOURTEEN = [
  'device',
  'network',
  'ip-address',
  'ipv4',
  'packet',
  'ping',
  'protocol',
  'icmp',
  'echo-request',
  'echo-reply',
  'internet',
  'router',
  'private-ip',
  'firewall',
  'traffic',
  'rule',
];
const EMPTY_BRIDGE: string[] = [];
const PRIVATE_RANGE_OF_OTHER_OFFICE = '10.0.0.0/8';
const TERMS_OF_THE_APPROVED_DESIGN: string[][] = [
  ['network', 'device', 'ip-address', 'ipv4'],
  ['packet', 'header', 'source-ip', 'destination-ip'],
  ['protocol', 'icmp', 'ping', 'echo-request', 'echo-reply'],
  ['loopback', 'localhost', 'rtt'],
  ['timeout', 'host-unreachable'],
  ['lan', 'router'],
  ['default-gateway'],
  ['internet', 'private-ip', 'public-ip'],
  ['hop', 'ttl', 'time-exceeded'],
  ['traceroute'],
  ['firewall', 'traffic', 'drop'],
  ['rule', 'allow', 'deny', 'default-deny', 'least-privilege'],
  ['inbound', 'outbound'],
  [],
];
const LATER_TOPICS = /\b(puertos?|TCP|UDP|CIDR|m[aá]scaras?|NAT|DNS|ARP|MAC|switch(?:es)?|IPv6|HTTPS?|clientes?|stateful|stateless)\b/;
const CHAPTER_1_BUILT = ['01-01', '01-02', '01-03', '01-04', '01-05', '01-06', '01-07', '01-08', '01-09', '01-10', '01-11', '01-12', '01-13', '01-14'];
const BEFORE_THE_RULES = CHAPTER_1_BUILT.slice(0, 11);
const TERMS_OF_CHAPTER_2: TermId[][] = [
  ['service', 'port', 'listen', 'ip-port', 'destination-port', 'nc'],
  ['client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port'],
  ['closed-port', 'rst', 'connection-refused', 'filtered-port', 'listen-address'],
  ['bit', 'prefix', 'cidr', 'subnet-mask'],
  ['port-range', 'ssh', 'well-known-ports'],
  ['route', 'routing-table', 'connected-route', 'default-route'],
  ['next-hop', 'net-unreachable', 'most-specific-route'],
  ['nat', 'napt', 'translation-table'],
  ['port-forwarding'],
  ['domain-name', 'dns', 'dns-query', 'resolver', 'udp', 'dig', 'dhcp'],
  ['authoritative-server', 'dns-record', 'a-record', 'cname-record'],
  ['dns-cache', 'dns-ttl'],
  ['nxdomain', 'servfail', 'port-unreachable', 'hosts-file'],
];
const SIZES_OF_CHAPTER_2 = [6, 6, 5, 4, 3, 4, 3, 3, 1, 7, 4, 2, 4];
const SUBCHAPTER_OF = { cidr: 4, nat: 8, dns: 10 };
const TERMS_OF_CHAPTER_1 = INCIDENTS.filter((incident) => incident.chapter === 1).flatMap((incident) => incident.introduces);

describe('term ladder', () => {
  it('a term is introduced by one incident at most', () => {
    const introduced = INCIDENTS.flatMap((i) => i.introduces);
    expect(introduced.filter((term, index) => introduced.indexOf(term) !== index)).toEqual([]);
    expect(INCIDENTS.filter((incident) => incident.introduces.includes('least-privilege')).map((incident) => incident.id)).toEqual(['01-12']);
  });

  it('04-02 no longer introduces least-privilege, which 01-12 presents, and still knows it', () => {
    const second = INCIDENTS.find((incident) => incident.id === '04-02');
    expect(second?.introduces).toEqual([]);
    expect(knownTerms(INCIDENTS, '04-02').has('least-privilege')).toBe(true);
    expect(knownTerms(INCIDENTS, '04-01').has('least-privilege')).toBe(true);
  });

  it.each(BY_INCIDENT)('%s only uses terms introduced in it or before', (id, incident) => {
    expect(unknownTerms(incidentTexts(incident), knownTerms(INCIDENTS, id))).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s defines its new terms without naming a term the player does not know yet', (id, incident) => {
    const known = knownTerms(INCIDENTS, id);
    const unknown = ALL_TERMS.filter((term) => !known.has(term));
    const leaks = incident.introduces.flatMap((term) => namedTerms(TERMS[term].definition, unknown).map((other) => `${term} → ${other}`));
    expect(leaks.filter((leak) => !DECLARED_LEAKS.includes(leak))).toEqual([]);
  });

  it('the official name of ICMP says Internet before the term internet arrives: the one declared leak', () => {
    expect(namedTerms(TERMS.icmp.definition, ['internet'])).toEqual(['internet']);
    expect(INCIDENTS.findIndex((incident) => incident.introduces.includes('icmp'))).toBeLessThan(INCIDENTS.findIndex((incident) => incident.introduces.includes('internet')));
  });

  it('the private IP of the other office is not inside any LAN of the office', () => {
    const world = startWorld(INCIDENTS, '01-08');
    expect(ipInCidr(IP.otherOfficePrinter, PRIVATE_RANGE_OF_OTHER_OFFICE)).toBe(true);
    expect(ipInCidr(IP.otherOfficePrinter, world.cidr)).toBe(false);
    expect(lansOf(world).filter((lan) => ipInCidr(IP.otherOfficePrinter, lan.cidr))).toEqual([]);
    expect(world.devices.filter((device) => device.privateIp === IP.otherOfficePrinter)).toEqual([]);
  });

  it('finds a term in a definition by whole words, ignoring case', () => {
    expect(namedTerms('Amazon Redshift guarda datos.', ['network'])).toEqual([]);
    expect(namedTerms('Una Red de la oficina.', ['network'])).toEqual(['network']);
    expect(namedTerms('Las IPs privadas de la VPC.', ['private-ip', 'vpc'])).toEqual(['vpc']);
  });

  it('also finds the Spanish plural of a term, made with s or es', () => {
    expect(namedTerms('Amazon Redshift guarda datos en sus redes.', ['network'])).toEqual(['network']);
    expect(namedTerms('Los paquetes llegan a los dispositivos.', ['packet', 'device'])).toEqual(['packet', 'device']);
    expect(namedTerms('Dos routers y cinco reglas.', ['router', 'rule'])).toEqual(['router', 'rule']);
    expect(namedTerms('Tres Redshifts y un redshift.', ['network'])).toEqual([]);
  });

  it('every mention of a term an incident introduces, in its report and its tasks, is tagged, so the first one wears the nuevo mark', () => {
    const untaggedWords = (text: string) =>
      parseTermText(text)
        .flatMap((segment) => (segment.kind === 'text' ? [segment.text] : []))
        .join(' ');
    const untagged = INCIDENTS.flatMap((incident) => {
      const texts = [incident.report, ...(isGuided(incident) ? incident.tasks.map((task) => task.text) : [])];
      return texts.flatMap((text) => namedTerms(untaggedWords(text), incident.introduces).map((term) => `${incident.id}: ${term}`));
    });
    expect(untagged).toEqual([]);
  });

  it('introduces, incident by incident, the terms of the approved design', () => {
    const chapter1 = INCIDENTS.filter((incident) => incident.chapter === 1);
    expect(chapter1.length).toBeGreaterThan(0);
    for (const incident of chapter1) expect([...incident.introduces].sort(), incident.id).toEqual([...TERMS_OF_THE_APPROVED_DESIGN[incident.order - 1]].sort());
  });

  it('04-01 bridges exactly the chapter 1 terms that no chapter 1 incident introduces yet', () => {
    const introduced = INCIDENTS.filter((incident) => incident.chapter === 1).flatMap((incident) => incident.introduces as string[]);
    const bridge = (INCIDENTS.find((incident) => incident.id === '04-01')?.introduces as string[]).filter((term) => !OWN_TERMS_OF_04_01.includes(term));
    expect([...EMPTY_BRIDGE].sort()).toEqual(CHAPTER_1_TERMS_BEFORE_THE_FOURTEEN.filter((term) => !introduced.includes(term)).sort());
    expect([...bridge].sort()).toEqual([...EMPTY_BRIDGE].sort());
  });

  it('names no topic of the chapters that come later, in any text of chapter 1', () => {
    const chapter1 = INCIDENTS.filter((incident) => incident.chapter === 1);
    const definitions = chapter1.flatMap((incident) => incident.introduces.map((term) => TERMS[term].definition));
    for (const text of [...chapter1.flatMap(incidentTexts).map(toPlainText), ...definitions]) expect(text).not.toMatch(LATER_TOPICS);
  });

  it.each(CHAPTER_1_BUILT)('%s names no term of a later incident in plain words either', (id) => {
    const incident = INCIDENTS.find((candidate) => candidate.id === id);
    const known = knownTerms(INCIDENTS, id);
    const later = ALL_TERMS.filter((term) => !known.has(term));
    const named = incidentTexts(incident as Incident).flatMap((text) => namedTerms(toPlainText(text), later));
    expect(named).toEqual([]);
  });

  it.each(BY_INCIDENT)('%s names each chip after a term, by its official name', (_id, incident) => {
    const labels = chipLabels(incident);
    expect(labels.filter((label) => termsIn(label).length === 0)).toEqual([]);
    expect(unofficialNames(labels)).toEqual([]);
  });

  it('the Destination chips of an outbound filter are chips the ladder checks, like the Type and Source ones', () => {
    const outbound = filterIncident('01-13');
    const destinations = (outbound.chips.to ?? []).map((chip) => chip.label);
    expect(destinations).toHaveLength(2);
    expect(chipLabels(outbound)).toEqual([...outbound.chips.what, ...outbound.chips.from, ...(outbound.chips.to ?? [])].map((chip) => chip.label));
    expect(incidentTexts(outbound)).toEqual(expect.arrayContaining(destinations));
  });

  it('marks the resource name in the Security Group chip, apart from its term', () => {
    expect(FROM.sgServidor1.label).toBe('{{security-group|SG}} [[servidor1]]');
  });

  it('catches a text that uses a later term', () => {
    const early = { ...filterIncident('04-01'), report: 'El {{security-group}} es {{stateful}}.' };
    expect(unknownTerms(incidentTexts(early), knownTerms(INCIDENTS, early.id))).toEqual(['stateful']);
  });

  it('each incident also knows the terms of the ones before it', () => {
    expect([...knownTerms(INCIDENTS, INCIDENTS[0].id)]).toEqual(INCIDENTS[0].introduces);
    expect([...knownTerms(INCIDENTS, INCIDENTS[1].id)]).toEqual([...INCIDENTS[0].introduces, ...INCIDENTS[1].introduces]);
  });

  it('the rules of a host firewall open with the term rule (01-12), and those of a Security Group with inbound rule (chapter 4)', () => {
    const parts = Object.fromEntries(INCIDENTS.map((incident) => [incident.id, configurableParts(knownTerms(INCIDENTS, incident.id))]));
    expect(parts).toEqual({
      ...Object.fromEntries(BEFORE_THE_RULES.map((id) => [id, NOTHING])),
      '01-12': HOST_RULES,
      '01-13': HOST_RULES_IN_AND_OUT,
      '01-14': HOST_RULES_IN_AND_OUT,
      '04-01': INBOUND_RULES,
      '04-02': INBOUND_RULES,
    });
    expect(configurableParts(new Set<TermId>(['rule']))).toEqual(HOST_RULES);
  });

  it('outbound rules and the host setting open with their own terms', () => {
    const later = new Set<TermId>(['inbound-rule', 'outbound-rule', 'icmp-echo-ignore-all']);
    expect(configurableParts(later)).toEqual({ inboundRules: { 'host-firewall': false, 'security-group': true }, outboundRules: { 'host-firewall': false, 'security-group': true }, hostSettings: true });
  });

  it('outbound rules open with the term outbound for a host firewall and with outbound-rule for a Security Group', () => {
    expect(RULES_TERM.outbound).toEqual({ 'host-firewall': 'outbound', 'security-group': 'outbound-rule' });
    expect(configurableParts(new Set<TermId>(['outbound'])).outboundRules).toEqual({ 'host-firewall': true, 'security-group': false });
    expect(configurableParts(new Set<TermId>(['outbound-rule'])).outboundRules).toEqual({ 'host-firewall': false, 'security-group': true });
    expect(configurableParts(new Set<TermId>(['outbound', 'outbound-rule'])).outboundRules).toEqual({ 'host-firewall': true, 'security-group': true });
    expect(configurableParts(new Set<TermId>(['rule', 'inbound-rule'])).outboundRules).toEqual(CLOSED);
  });

  it('a tab is named after a term by its official name: entrada and salida for a host firewall, regla de entrada and regla de salida for a Security Group', () => {
    const names = { 'host-firewall': { inbound: 'entrada', outbound: 'salida' }, 'security-group': { inbound: 'regla de entrada', outbound: 'regla de salida' } };
    const terms = { 'host-firewall': { inbound: 'inbound', outbound: 'outbound' }, 'security-group': { inbound: 'inbound-rule', outbound: 'outbound-rule' } } as const;
    for (const kind of ['host-firewall', 'security-group'] as const) {
      for (const direction of ['inbound', 'outbound'] as const) {
        const label = TASK_CARD_TEXT.tabs[kind][direction];
        expect(termsIn(label), `${kind}/${direction}`).toEqual([terms[kind][direction]]);
        expect(unofficialNames([label]), `${kind}/${direction}`).toEqual([]);
        expect(toPlainText(label), `${kind}/${direction}`).toBe(names[kind][direction]);
        expect(TERMS[terms[kind][direction]].name).toBe(names[kind][direction]);
      }
      expect(termsIn(TASK_CARD_TEXT.tabs[kind].outbound)).toEqual([RULES_TERM.outbound[kind]]);
    }
  });
});

describe('the term ladder of chapter 2', () => {
  const ids = TERMS_OF_CHAPTER_2.flat();

  const subchapterName = (index: number) => String(index + 1).padStart(2, '0');

  /** Returns, for each definition of the table, the terms it names that are not known yet at its subchapter: the terms of chapter 1 and those of the table up to it, against the whole registry. */
  const laterTermsNamed = (definitionOf: (id: TermId) => string): string[] =>
    TERMS_OF_CHAPTER_2.flatMap((subchapter, index) => {
      const known = new Set<TermId>([...TERMS_OF_CHAPTER_1, ...TERMS_OF_CHAPTER_2.slice(0, index + 1).flat()]);
      const unknown = ALL_TERMS.filter((term) => !known.has(term));
      return subchapter.flatMap((id) => namedTerms(definitionOf(id), unknown).map((other) => `${id} (${subchapterName(index)}) → ${other}`));
    });

  it('the table has the 52 terms of the approved design, in 13 subchapters, and puts cidr, nat and dns where they are presented', () => {
    expect(TERMS_OF_CHAPTER_1).toHaveLength(38);
    expect(new Set(TERMS_OF_CHAPTER_1).size).toBe(TERMS_OF_CHAPTER_1.length);
    expect(TERMS_OF_CHAPTER_2.map((subchapter) => subchapter.length)).toEqual(SIZES_OF_CHAPTER_2);
    expect(ids).toHaveLength(52);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !ALL_TERMS.includes(id))).toEqual([]);
    expect(ids.filter((id) => TERMS_OF_CHAPTER_1.includes(id))).toEqual([]);
    for (const [id, subchapter] of Object.entries(SUBCHAPTER_OF)) expect(TERMS_OF_CHAPTER_2[subchapter - 1], id).toContain(id);
  });

  it('every definition of chapter 2 names only terms that are known at its incident, in the approved order', () => {
    expect(laterTermsNamed((id) => TERMS[id].definition)).toEqual([]);
  });

  it('catches a definition of chapter 2 that names a term of a later subchapter', () => {
    const early = (id: TermId) => (id === 'nc' ? 'Prueba un servicio por TCP.' : TERMS[id].definition);
    expect(laterTermsNamed(early)).toEqual(['nc (01) → tcp']);
  });
});

describe('the settings of a send incident', () => {
  const NO_VALUE = 'Ninguna';
  const GATEWAY = gatewayIncident();
  const WITH_SETTINGS = [GATEWAY, ...INCIDENTS].filter((incident): incident is SendIncident => incident.mechanic === 'send' && incident.send.settings !== undefined);
  const settings = WITH_SETTINGS.flatMap((incident) => incident.send.settings ?? []);

  it('a setting chip names its value, and its tray names a term', () => {
    expect(settings.length).toBeGreaterThan(0);
    for (const setting of settings) {
      expect(parseTermText(setting.name).map((segment) => segment.kind)).toEqual(['term']);
      expect(unofficialNames([setting.name])).toEqual([]);
      for (const chip of setting.chips) expect(chip.label).toBe(chip.value ?? NO_VALUE);
    }
  });

  it('the gateway tray is called by the official name of the default gateway', () => {
    const [gateway] = GATEWAY.send.settings ?? [];
    expect(termsIn(gateway.name)).toEqual(['default-gateway']);
    expect(gateway.name).toBe(`{{default-gateway|${TERMS['default-gateway'].name}}}`);
  });

  it('the texts of the settings are texts the player reads, so the ladder catches them before their term is known', () => {
    const [gateway] = GATEWAY.send.settings ?? [];
    expect(incidentTexts(GATEWAY)).toEqual(expect.arrayContaining([gateway.name, ...gateway.chips.map((chip) => chip.label)]));
    expect(unknownTerms(incidentTexts(GATEWAY), new Set())).toContain('default-gateway');
    expect(unknownTerms(incidentTexts(GATEWAY), knownTerms([GATEWAY], GATEWAY.id))).toEqual([]);
  });
});

describe('the cases of a diagnose incident', () => {
  const DIAGNOSE = diagnoseIncident();
  const { cases } = DIAGNOSE.diagnose;

  it('the texts of every case are texts the player reads, so the ladder catches them', () => {
    const texts = incidentTexts(DIAGNOSE);
    for (const spec of cases) expect(texts).toEqual(expect.arrayContaining([spec.report, ...spec.hints, spec.cause.question, ...spec.cause.options.flatMap((option) => [option.text, option.feedback])]));
    expect(texts).toEqual(expect.arrayContaining([DIAGNOSE.report, DIAGNOSE.takeaway]));
  });

  it('the message chips of every case are chips the ladder checks', () => {
    expect(chipLabels(DIAGNOSE)).toEqual(cases.flatMap((spec) => spec.send.message.map((chip) => chip.label)));
  });

  it('a term used in a case is unknown until an incident introduces it', () => {
    const early = { ...DIAGNOSE, introduces: [] };
    expect(unknownTerms(incidentTexts(early), knownTerms([early], early.id))).toContain('ping');
    expect(unknownTerms(incidentTexts(DIAGNOSE), knownTerms([DIAGNOSE], DIAGNOSE.id))).toEqual([]);
  });
});
