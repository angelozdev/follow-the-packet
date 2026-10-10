import { describe, expect, it } from 'vitest';
import { warningOf } from './packet-labels';
import { ENTITY_REFS, ENTITY_TERMS, TERMS, TERM_ENTITY, entityTerm, isTermId, type EntityRef, type Term, type TermId } from './terms';

const MAX_DEFINITION_LENGTH = 120;
const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OFFICIAL_NAMES: [TermId, string][] = [
  ['ec2-instance', 'instancia EC2'],
  ['vpc', 'VPC'],
  ['security-group', 'Security Group'],
  ['inbound-rule', 'regla de entrada'],
  ['icmp', 'ICMP'],
  ['echo-request', 'Echo Request'],
  ['echo-reply', 'Echo Reply'],
  ['anywhere-ipv4', 'Anywhere-IPv4'],
  ['internet-gateway', 'Internet gateway'],
  ['icmp-echo-ignore-all', 'icmp_echo_ignore_all'],
  ['rtt', 'RTT'],
  ['ttl', 'TTL'],
  ['time-exceeded', 'Time Exceeded'],
  ['host-unreachable', 'Destination Host Unreachable'],
];
const RETIRED_IDS = ['server', 'linux-ignore-ping', 'request', 'response'];
const PING_TERMS: TermId[] = ['protocol', 'icmp', 'ping', 'echo-request', 'echo-reply'];
const RETIRED_WORDS = /solicitud|respuesta/i;
const TERMS_OF_THE_FOURTEEN: TermId[] = [
  'header',
  'loopback',
  'localhost',
  'rtt',
  'timeout',
  'host-unreachable',
  'lan',
  'default-gateway',
  'hop',
  'ttl',
  'time-exceeded',
  'traceroute',
  'drop',
  'allow',
  'deny',
  'default-deny',
  'inbound',
  'outbound',
];

describe('term registry', () => {
  it.each(Object.entries(TERMS))('%s has a name and a short definition', (_id, term) => {
    expect(term.name.trim()).not.toBe('');
    expect(term.definition.trim()).not.toBe('');
    expect(term.definition.length).toBeLessThanOrEqual(MAX_DEFINITION_LENGTH);
  });

  it('ids are English kebab-case', () => {
    for (const id of Object.keys(TERMS)) expect(id).toMatch(KEBAB_CASE);
  });

  it('registers the terms the engine and the cards need from the start', () => {
    expect(TERMS_OF_THE_FOURTEEN).toHaveLength(18);
    expect(TERMS_OF_THE_FOURTEEN.filter((id) => !isTermId(id))).toEqual([]);
  });

  it('registers the IP de origen and the IP de destino, which the definitions of the packet and the header name', () => {
    expect(TERMS['source-ip'].name).toBe('IP de origen');
    expect(TERMS['destination-ip'].name).toBe('IP de destino');
    for (const term of ['packet', 'header'] as const) {
      expect(TERMS[term].definition).toContain(TERMS['source-ip'].name);
      expect(TERMS[term].definition).toContain(TERMS['destination-ip'].name);
    }
  });

  it('a device is also called a host, and the packet is told apart from its header', () => {
    expect(TERMS.device.definition).toContain('host');
    expect(TERMS.packet.definition).toContain(TERMS.header.name);
  });

  it('the default gateway is a saved setting that should be a router, the LAN says packets inside it are delivered directly, the router forwards towards the network of the destination IP, and no one of them quotes an operating system', () => {
    const [lan, router, gateway] = [TERMS.lan, TERMS.router, TERMS['default-gateway']];
    expect(gateway.definition).toMatch(/^Un ajuste guardado: la IP a la que un dispositivo manda.*Debe ser la de un router\.$/);
    expect(lan.definition).toContain('se entregan directo');
    expect(router.definition).toContain('los reenvía hacia la red de su IP de destino');
    for (const { definition } of [lan, router, gateway]) expect(definition).not.toMatch(/macOS|Windows|Linux/);
  });

  it('recognizes registered ids only', () => {
    expect(isTermId('security-group')).toBe(true);
    expect(isTermId('puerta')).toBe(false);
    expect(isTermId('toString')).toBe(false);
  });

  it.each(OFFICIAL_NAMES)('%s is called «%s», its official name', (id, name) => {
    expect(TERMS[id].name).toBe(name);
  });

  it('drops the ids named after retired plain words', () => {
    expect(RETIRED_IDS.filter(isTermId)).toEqual([]);
  });

  it('the terms of the ping do not call a message a solicitud or a respuesta, which stopped being terms', () => {
    expect(PING_TERMS.filter((id) => RETIRED_WORDS.test(TERMS[id].definition))).toEqual([]);
  });

  it('the ping, the Echo Request and the Echo Reply are defined by each other and by ICMP', () => {
    expect(TERMS.ping.definition).toContain(TERMS['echo-request'].name);
    expect(TERMS.ping.definition).toContain(TERMS['echo-reply'].name);
    expect(TERMS['echo-request'].definition).toContain(TERMS['echo-reply'].name);
    expect(TERMS['echo-reply'].definition).toContain(TERMS['echo-request'].name);
    for (const id of ['echo-request', 'echo-reply'] as const) expect(TERMS[id].definition).toContain(TERMS.icmp.name);
  });

  it('a Security Group is the virtual firewall of an instance, shortened SG', () => {
    const securityGroup: Term = TERMS['security-group'];
    expect(securityGroup.definition).toMatch(/^Un firewall virtual de una instancia EC2/);
    expect(securityGroup.short).toBe('SG');
  });

  it('only the IP address and the Security Group have a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['ip-address', 'security-group']);
  });
});

describe('entity terms', () => {
  it('names each variant by its term: the office ones by the general terms of chapter 1, the AWS ones by their official names', () => {
    expect(entityTerm({ kind: 'device', variant: 'ec2-instance' })).toBe('ec2-instance');
    expect(entityTerm({ kind: 'firewall', variant: 'security-group' })).toBe('security-group');
    expect(entityTerm({ kind: 'edge', variant: 'internet-gateway' })).toBe('internet-gateway');
    expect(entityTerm({ kind: 'network', variant: 'vpc' })).toBe('vpc');
    expect(entityTerm({ kind: 'network', variant: 'office' })).toBe('network');
    expect(entityTerm({ kind: 'device', variant: 'laptop' })).toBe('device');
    expect(entityTerm({ kind: 'device', variant: 'printer' })).toBe('device');
    expect(entityTerm({ kind: 'firewall', variant: 'host-firewall' })).toBe('firewall');
    expect(entityTerm({ kind: 'edge', variant: 'router' })).toBe('router');
    expect(entityTerm({ kind: 'internet', variant: 'internet' })).toBe('internet');
  });

  it('the internet-server variant is named by the term device', () => {
    expect(entityTerm({ kind: 'device', variant: 'internet-server' })).toBe('device');
    expect(TERM_ENTITY.device).toEqual({ kind: 'device', variant: 'laptop' });
  });

  it('every packet variant is named by a term or by none, and the warnings are named by host-unreachable and time-exceeded', () => {
    expect(Object.keys(ENTITY_TERMS.packet).sort()).toEqual(['echo-reply', 'echo-request', 'warning']);
    for (const term of Object.values(ENTITY_TERMS.packet)) expect(term === null || isTermId(term)).toBe(true);
    expect(entityTerm({ kind: 'packet', variant: 'warning' })).toBeNull();
    const from = { kind: 'device', id: 'your-laptop' } as const;
    const named = (['host-unreachable', 'net-unreachable', 'time-exceeded'] as const).map((kind) => warningOf({ kind, fromId: 'router', fromIp: '192.168.1.1' }, { from }).term);
    expect(named).toEqual(['host-unreachable', 'host-unreachable', 'time-exceeded']);
    for (const term of new Set(named)) expect(TERM_ENTITY[term]).toEqual({ kind: 'packet', variant: 'warning' });
  });

  it('a warning is never an intruder: only the messages a sender sends are listed as an intruder too', () => {
    const packets = ENTITY_REFS.filter((entity) => entity.kind === 'packet');
    expect(packets.filter((entity) => 'intruder' in entity && entity.intruder).map((entity) => entity.variant).sort()).toEqual(['echo-reply', 'echo-request']);
    expect(packets.filter((entity) => entity.variant === 'warning')).toEqual([{ kind: 'packet', variant: 'warning' }]);
  });

  it('gives a character no term: an actor is a person, not a piece of the network', () => {
    expect(entityTerm({ kind: 'actor', variant: 'attacker' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'you' })).toBeNull();
    expect(entityTerm({ kind: 'actor', variant: 'home' })).toBeNull();
  });
});

describe('term icons', () => {
  const GENERAL_TERMS: TermId[] = ['packet', 'host-unreachable', 'time-exceeded'];

  it('every term that names a variant shows the entity of one of the variants it names as its icon', () => {
    const named = Object.entries(ENTITY_TERMS).flatMap(([kind, variants]) =>
      Object.entries(variants).flatMap(([, term]) => (term === null ? [] : [{ term, kind }])),
    );
    for (const { term, kind } of named) {
      const icon = TERM_ENTITY[term as TermId];
      expect(icon?.kind, term).toBe(kind);
      expect(icon && entityTerm(icon), term).toBe(term);
    }
  });

  it('every icon belongs to the term that names its entity, or to a term that names every variant of it', () => {
    for (const [term, entity] of Object.entries(TERM_ENTITY)) {
      if (!GENERAL_TERMS.includes(term as TermId)) expect(entityTerm(entity as EntityRef), term).toBe(term);
    }
    expect(TERM_ENTITY.packet).toEqual({ kind: 'packet', variant: 'echo-request' });
  });

  it('a term with no entity, like least-privilege, has no icon', () => {
    expect(TERM_ENTITY['least-privilege']).toBeUndefined();
  });
});
