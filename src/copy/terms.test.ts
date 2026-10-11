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
  ['net-unreachable', 'Destination Net Unreachable'],
  ['port-unreachable', 'Port Unreachable'],
  ['connection-refused', 'Connection refused'],
  ['nxdomain', 'NXDOMAIN'],
  ['servfail', 'SERVFAIL'],
];
const RETIRED_IDS = ['server', 'linux-ignore-ping', 'request', 'response'];
const PING_TERMS: TermId[] = ['protocol', 'icmp', 'ping', 'echo-request', 'echo-reply'];
const RETIRED_WORDS = /solicitud|respuesta/i;
const TRACEROUTE_LISTS = 'lista los routers que avisan en un camino';
const DISCOVERS_THE_PATH = /descubre/i;
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
const TERMS_BEFORE_CHAPTER_2 = 56;
const IDS_OF_CHAPTER_2: TermId[] = [
  'service', 'port', 'listen', 'ip-port', 'destination-port', 'nc', 'client-server', 'tcp', 'connection', 'handshake', 'source-port', 'ephemeral-port',
  'closed-port', 'rst', 'connection-refused', 'filtered-port', 'listen-address', 'bit', 'prefix', 'subnet-mask', 'port-range', 'ssh',
  'well-known-ports', 'route', 'routing-table', 'connected-route', 'default-route', 'next-hop', 'net-unreachable', 'most-specific-route', 'napt',
  'translation-table', 'port-forwarding', 'domain-name', 'dns-query', 'resolver', 'udp', 'dig', 'dhcp', 'authoritative-server', 'dns-record',
  'a-record', 'cname-record', 'dns-cache', 'dns-ttl', 'nxdomain', 'servfail', 'port-unreachable', 'hosts-file',
];
const DEFINITIONS_BEFORE_CHAPTER_2: [TermId, string][] = [
  ['cidr', 'Una notación para un rango de IPs, IP/número: /32 es una sola IP; /16, 65 536; 0.0.0.0/0, todas las IPv4.'],
  ['dns', 'Domain Name System: el sistema que traduce un nombre a una IP.'],
  ['nat', 'Network Address Translation: al salir por el Internet gateway, la IP privada del remitente se cambia por su IP pública.'],
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

  it('the traceroute lists the routers that warn, not every router of the path, as a router may forward a packet and not warn', () => {
    expect(TERMS.traceroute.definition).toContain(TRACEROUTE_LISTS);
    expect(TERMS.traceroute.definition).not.toMatch(DISCOVERS_THE_PATH);
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

  it('registers the 49 new ids of chapter 2 and rewrites cidr, dns and nat', () => {
    expect(IDS_OF_CHAPTER_2).toHaveLength(49);
    expect(new Set(IDS_OF_CHAPTER_2).size).toBe(IDS_OF_CHAPTER_2.length);
    expect(IDS_OF_CHAPTER_2.filter((id) => !isTermId(id))).toEqual([]);
    expect(Object.keys(TERMS)).toHaveLength(TERMS_BEFORE_CHAPTER_2 + IDS_OF_CHAPTER_2.length);
    for (const [id, before] of DEFINITIONS_BEFORE_CHAPTER_2) expect(TERMS[id].definition, id).not.toBe(before);
    expect(TERMS.cidr.definition).toContain('IP/prefijo');
    expect(TERMS.dns.definition).toContain('Usa el puerto 53');
  });

  it('the NAT is defined for the one who changes the private source IP, a router or the Internet gateway, so it names neither', () => {
    expect(TERMS.nat.definition).toMatch(/^Network Address Translation: cambia la IP privada de origen por una pública al salir de la red/);
    expect(TERMS.nat.definition).not.toMatch(/router|Internet gateway/i);
  });

  it('the glossary says a port goes from 1 to 65535', () => {
    expect(TERMS.port.definition).toContain('de 1 a 65535');
    expect(TERMS.port.definition).not.toMatch(/0 a 65535/);
  });

  it('no term of chapter 2 names an entity of the map or has a short form', () => {
    const named = Object.values(ENTITY_TERMS).flatMap((variants) => Object.values(variants));
    for (const id of IDS_OF_CHAPTER_2) {
      expect(named, id).not.toContain(id);
      expect(TERM_ENTITY[id], id).toBeUndefined();
      expect(TERMS[id], id).not.toHaveProperty('short');
    }
  });

  it('only the IP address and the Security Group have a short form', () => {
    expect(Object.entries(TERMS).filter(([, term]) => 'short' in term).map(([id]) => id)).toEqual(['ip-address', 'security-group']);
  });
});

describe('the terms of the firewall rules', () => {
  const RULE_TERMS: TermId[] = ['rule', 'allow', 'deny', 'default-deny', 'least-privilege', 'inbound', 'outbound'];
  const NAMES_THE_COLUMNS_OF_A_LATER_ONE = /entrada|salida/i;
  const SAYS_A_SIDE_CLOSES_BY_ITSELF = /por defecto|de fábrica|normalmente|siempre|cierra su|cierra la/i;
  const OFFERS_A_RULE_THAT_DENIES = /regla (de|que) (deneg|prohib|bloque|rechaz)/i;

  it('the rule is a permission with a Type and a Source, and says nothing of the two directions that 01-13 presents', () => {
    expect(TERMS.rule.definition).toContain('(Type)');
    expect(TERMS.rule.definition).toContain('(Source)');
    expect(TERMS.rule.definition).toContain(TERMS['source-ip'].name);
    expect(TERMS.rule.definition).not.toMatch(NAMES_THE_COLUMNS_OF_A_LATER_ONE);
    expect(TERMS.rule.definition).not.toMatch(/desde dónde/);
  });

  it('the entrada tells what its rules name, a Source, and the salida what its rules name, a Destination', () => {
    expect(TERMS.inbound.definition).toContain('(Source)');
    expect(TERMS.outbound.definition).toContain('(Destination)');
    expect(TERMS.outbound.definition).toContain(TERMS['destination-ip'].name);
  });

  it('what no rule allows is denied: the denegación por defecto needs no rule of its own', () => {
    expect(TERMS['default-deny'].definition).toMatch(/^Todo lo que ninguna regla permite queda denegado/);
    expect(TERMS['default-deny'].definition).not.toMatch(OFFERS_A_RULE_THAT_DENIES);
  });

  it('no definition offers a rule that denies, and none says that a side of a firewall closes by itself', () => {
    for (const id of RULE_TERMS) {
      expect(TERMS[id].definition, id).not.toMatch(OFFERS_A_RULE_THAT_DENIES);
      expect(TERMS[id].definition, id).not.toMatch(SAYS_A_SIDE_CLOSES_BY_ITSELF);
    }
  });

  it('the least privilege is giving only what a task needs', () => {
    expect(TERMS['least-privilege'].definition).toMatch(/^Dar solo los permisos necesarios para una tarea/);
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
