import { describe, expect, it } from 'vitest';
import { ACTOR_ROLE_TEXT, INSPECTION_TEXT, TERMS, toPlainText, type TermId } from '@/copy';
import { TRACEROUTE_MAX_HOPS } from '@/engine';
import { INCIDENTS } from '@/levels';
import { unknownTerms } from '@/levels/ladder';
import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { OFFICE, OFFICE_FLOORS, officeNet, officeTwoFloorsNet, outboundFilterIncident, routedSendIncident, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { firewallCard } from './cards/firewall-card';
import { inspect, type Inspection } from './inspection';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const WHAT_IS = 'Qué es';
const ECHO_REQUEST = ['Mensaje', 'ICMP · Echo Request'];
const ATTACKER_BLOCKED = ['Resultado', 'timeout: pasó el tiempo de espera y no volvió nada.'];
const WAITED_FOR_NOTHING = ['Resultado', 'Pasó el tiempo de espera y no volvió nada.'];
const REQUEST_HEADER = 'Encabezado del Echo Request';
const LOCAL_HEADER = 'Encabezado (en tu red local)';
const LOCAL_REQUEST_HEADER = 'Encabezado del Echo Request (en tu red local)';
const LOCAL_REPLY_HEADER = 'Encabezado del Echo Reply (en tu red local)';
const HEADER_CHANGES = 'Fuera de la oficina el encabezado cambia: lo verás en el capítulo 2.';
const ATTACKER_PUBLIC_IP = '203.0.113.66';
const first = startSession(INCIDENTS, '04-01');
const office: Session = { ...first, world: withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] }) };
const fixed = sessionReducer(first, { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id });

function plain(inspection: Inspection | null) {
  return inspection && { title: toPlainText(inspection.title), fields: inspection.fields.map((f) => [toPlainText(f.label), ...f.lines.map(toPlainText)]) };
}

function knowing(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set([...session.known, ...terms]) };
}

function knowingOnly(session: Session, ...terms: TermId[]): Session {
  return { ...session, known: new Set(terms) };
}

function whatIs(term: TermId): string[] {
  return [WHAT_IS, TERMS[term].definition];
}

describe('inspect', () => {
  it('every piece with a term, and every packet, starts with what it is', () => {
    const ids = [...pieceViews(first).filter((piece) => piece.term !== null).map((piece) => piece.id), ...first.runs.map((run) => run.pieceId)];
    expect(ids.map((id) => inspect(first, id)?.fields[0]?.label)).toEqual(ids.map(() => WHAT_IS));
  });

  it('an instance shows what an EC2 instance is, its private and its public IP and its Security Group, and nothing of later terms', () => {
    expect(plain(inspect(first, PIECE_ID.device(S2.id)))).toEqual({
      title: 'servidor2',
      fields: [whatIs('ec2-instance'), ['IP privada', S2.private], ['IP pública', S2.public], ['Security Groups', 'Security Group servidor2']],
    });
  });

  it('with the term IP pública known the box of an instance and of an actor shows its IP', () => {
    expect(first.known.has('public-ip')).toBe(true);
    expect(plain(inspect(knowingOnly(first, 'ec2-instance', 'public-ip'), PIECE_ID.device(S2.id)))?.fields).toEqual([whatIs('ec2-instance'), ['IP pública', S2.public]]);
    expect(plain(inspect(knowingOnly(first, 'ec2-instance'), PIECE_ID.device(S2.id)))?.fields).toEqual([whatIs('ec2-instance')]);
    expect(plain(inspect(knowingOnly(first, 'public-ip'), PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)], ['IP pública', ATTACKER_PUBLIC_IP]]);
    expect(plain(inspect(knowingOnly(first), PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)]]);
  });

  it('a device of an office shows no public IP whatever the player knows, because how a packet leaves the office is a black box', () => {
    const labels = (session: Session) => plain(inspect(session, PIECE_ID.device('lucia-laptop')))?.fields.map(([label]) => label);
    expect(labels(knowingOnly(office, 'device', 'private-ip', 'public-ip'))).toEqual([WHAT_IS, 'IP privada']);
    expect(labels(knowingOnly({ ...office, world: officeTwoFloorsNet() }, 'device', 'private-ip', 'public-ip', 'network'))).toEqual([WHAT_IS, 'IP privada', 'Conexión']);
  });

  it('titles a piece with its own name marked as a name, and keeps the entity plain', () => {
    expect(inspect(first, PIECE_ID.device(S2.id))?.title).toBe('[[servidor2]]');
    expect(inspect(first, PIECE_ID.firewall(SG.servidor2))?.title).toBe('{{security-group}} [[servidor2]]');
    expect(inspect(first, PIECE_ID.actor('attacker'))?.title).toBe('[[Atacante]]');
  });

  it('later terms add their fields', () => {
    const fields = plain(inspect(knowing(first, 'dns'), PIECE_ID.device(S2.id)))?.fields.map(([label]) => label);
    expect(fields).toEqual([WHAT_IS, 'IP privada', 'IP pública', 'Nombres DNS', 'Security Groups']);
  });

  it('a Security Group without rules says it lets nothing in', () => {
    expect(plain(inspect(first, PIECE_ID.firewall(SG.servidor2)))?.fields).toEqual([whatIs('security-group'), ['Reglas de entrada', 'Ninguna: no deja entrar nada.']]);
  });

  it('a Security Group lists its inbound rules as chips', () => {
    expect(plain(inspect(startSession(INCIDENTS, '04-02'), PIECE_ID.firewall(SG.servidor2)))?.fields).toEqual([
      whatIs('security-group'),
      ['Reglas de entrada', 'ICMP · Echo Reply ← Anywhere-IPv4 (0.0.0.0/0)'],
    ]);
  });

  it('a blocked packet says what it is, and where and why it stopped', () => {
    expect(plain(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id)))).toEqual({
      title: 'ping de Atacante a servidor2',
      fields: [
        whatIs('echo-request'),
        ECHO_REQUEST,
        ATTACKER_BLOCKED,
        ['Dónde y por qué se detuvo', 'Se queda en el Security Group de servidor2: ninguna regla de entrada lo deja entrar.'],
      ],
    });
  });

  it('a packet that gets its reply has no stop', () => {
    expect(plain(inspect(fixed, PIECE_ID.packet(FLOWS.pingToServer2.id)))?.fields).toEqual([whatIs('echo-request'), ECHO_REQUEST, ['Resultado', 'Llegó y volvió la respuesta.']]);
  });

  it('a packet whose term is not known yet leaves out what it is', () => {
    const unaware: Session = { ...first, known: new Set<TermId>() };
    expect(plain(inspect(unaware, PIECE_ID.packet(FLOWS.attackerPing.id)))?.fields[0]).toEqual(WAITED_FOR_NOTHING);
  });

  it('the attacker says who it is and shows its public IP, which chapter 1 teaches before 04-01', () => {
    expect(plain(inspect(first, PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)], ['IP pública', ATTACKER_PUBLIC_IP]]);
  });

  it('the box of the server of the internet says it is a device and shows its IP, with no actor role', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    const serverBox = (session: Session) => inspect(session, PIECE_ID.actor(OFFICE_FLOORS.server.id));
    const box = serverBox(knowingOnly(floors, 'device', 'ip-address'));
    expect(box?.entity).toEqual({ kind: 'device', variant: 'internet-server' });
    expect(plain(box)).toEqual({ title: 'servidor-internet', fields: [whatIs('device'), ['dirección IP', OFFICE_FLOORS.server.ip]] });
    expect(plain(box)?.fields.map(([label]) => label)).not.toContain('Quién es');
    expect(plain(serverBox(knowingOnly(floors, 'device', 'ip-address', 'private-ip')))?.fields).toEqual([whatIs('device'), ['dirección IP', OFFICE_FLOORS.server.ip]]);
  });

  it('the box of the server of the internet calls its IP IP pública once that term is known', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    const fields = plain(inspect(knowingOnly(floors, 'device', 'ip-address', 'private-ip', 'public-ip'), PIECE_ID.actor(OFFICE_FLOORS.server.id)))?.fields;
    expect(fields).toEqual([whatIs('device'), ['IP pública', OFFICE_FLOORS.server.ip]]);
    expect(plain(inspect(floors, PIECE_ID.actor(OFFICE_FLOORS.server.id)))?.fields.at(-1)).toEqual(['IP pública', OFFICE_FLOORS.server.ip]);
  });

  it('a router of the world says what a router is under its own name, and nothing that only holds for the router of the office', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    expect(plain(inspect(floors, PIECE_ID.router(OFFICE_FLOORS.provider.id)))).toEqual({ title: OFFICE_FLOORS.provider.id, fields: [whatIs('router')] });
    expect(inspect(floors, PIECE_ID.router('ghost'))).toBeNull();
  });

  it('the box of the router of the office shows its IP on each floor it faces, and the one of a router that faces no floor shows none', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    const box = plain(inspect(floors, PIECE_ID.router(OFFICE_FLOORS.officeRouter.id)));
    expect(box?.fields).toEqual([whatIs('router'), ['IP en Piso 1', OFFICE_FLOORS.floor1.gateway], ['IP en Piso 2', OFFICE_FLOORS.floor2.gateway]]);
    expect(JSON.stringify(box)).not.toContain(OFFICE_FLOORS.officeRouter.uplink);
    expect(plain(inspect(floors, PIECE_ID.router(OFFICE_FLOORS.provider.id)))?.fields).toEqual([whatIs('router')]);
  });

  it('the inspection of a piece that the incident does not show is null', () => {
    const only = { ...office, world: officeTwoFloorsNet(), incident: { ...office.incident, shown: ['your-laptop', OFFICE_FLOORS.officeRouter.id] } };
    expect(inspect(only, PIECE_ID.device('your-laptop'))).not.toBeNull();
    expect(inspect(only, PIECE_ID.router(OFFICE_FLOORS.officeRouter.id))).not.toBeNull();
    expect(inspect(only, PIECE_ID.device('printer'))).toBeNull();
    expect(inspect(only, PIECE_ID.router(OFFICE_FLOORS.provider.id))).toBeNull();
    expect(inspect(only, PIECE_ID.actor(OFFICE_FLOORS.server.id))).toBeNull();
  });

  it('the Internet gateway says what it is and what it does', () => {
    expect(plain(inspect(first, PIECE_ID.edge))).toEqual({
      title: 'Internet gateway',
      fields: [whatIs('internet-gateway'), ['Qué hace', 'Por aquí entra y sale el tráfico entre la VPC e internet.']],
    });
  });

  it('a laptop of the office says what a device is, and shows its IP and its firewall', () => {
    expect(plain(inspect(office, PIECE_ID.device('lucia-laptop')))).toEqual({
      title: 'lucia-laptop',
      fields: [whatIs('device'), ['IP privada', '192.168.1.11'], ['Conexión', 'Conectado a la red.'], ['firewall', 'firewall lucia-laptop']],
    });
  });

  it('a laptop with no cable keeps its IP and says it is not part of the network, and the rest of the office says it is connected', () => {
    const floors: Session = { ...first, world: officeTwoFloorsNet() };
    const connection = (deviceId: string) => plain(inspect(floors, PIECE_ID.device(deviceId)))?.fields.filter(([label]) => label === 'IP privada' || label === 'Conexión');
    expect(connection('guest-laptop')).toEqual([['IP privada', OFFICE_FLOORS.floor1.guest], ['Conexión', 'No está conectado: no forma parte de la red.']]);
    expect(connection('printer')).toEqual([['IP privada', OFFICE_FLOORS.floor1.printer], ['Conexión', 'Conectado a la red.']]);
  });

  it('shows the connection of a device only in an office and once the term network is known', () => {
    const floors: Session = { ...first, world: officeTwoFloorsNet() };
    const labels = (session: Session, deviceId: string) => plain(inspect(session, PIECE_ID.device(deviceId)))?.fields.map(([label]) => label);
    expect(labels(knowingOnly(floors, 'device', 'ip-address'), 'printer')).toEqual([WHAT_IS, 'dirección IP']);
    expect(labels(first, 'servidor1')).not.toContain('Conexión');
  });

  it('calls the IP of a device dirección IP until the term IP privada is known', () => {
    const early = knowingOnly(office, 'device', 'ip-address');
    expect(plain(inspect(early, PIECE_ID.device('printer')))?.fields).toEqual([whatIs('device'), ['dirección IP', '192.168.1.20']]);
  });

  it('defines a packet as a packet until the term of its message is known', () => {
    const early = knowingOnly(first, 'packet');
    expect(plain(inspect(early, PIECE_ID.packet(FLOWS.attackerPing.id)))?.fields[0]).toEqual(whatIs('packet'));
  });

  it('a host firewall says what a firewall is and lists its rules, named after its device and without the name of the later inbound rule', () => {
    const beforeInAndOut: Session = {
      ...office,
      known: new Set([...office.known].filter((term) => term !== 'inbound' && term !== 'outbound')),
      parts: { ...office.parts, outboundRules: { 'host-firewall': false, 'security-group': false } },
    };
    expect(plain(inspect(beforeInAndOut, PIECE_ID.firewall('fw-lucia')))).toEqual({
      title: 'firewall lucia-laptop',
      fields: [whatIs('firewall'), ['Reglas para lo que llega', 'Ninguna.']],
    });
  });

  it('the empty inbound line of a host firewall claims nothing about what comes in, while a Security Group keeps its own wording', () => {
    const empty = (session: Session, firewallId: string) => plain(inspect(session, PIECE_ID.firewall(firewallId)))?.fields.find(([label]) => /^(Reglas para lo que llega|Entrada|Reglas de entrada)$/.test(label))?.slice(1);
    expect(empty(office, 'fw-lucia')).toEqual(['Ninguna.']);
    expect(empty(first, SG.servidor2)).toEqual(['Ninguna: no deja entrar nada.']);
  });

  it('a host firewall with its outbound rules open lists the rules of each direction, named by the chips of each', () => {
    const outbound = outboundFilterIncident();
    const start = startSession([outbound], outbound.id);
    const firewall = PIECE_ID.firewall('fw-you');
    expect(plain(inspect(start, firewall))).toEqual({
      title: 'firewall tu-laptop',
      fields: [whatIs('firewall'), ['Entrada', 'Ninguna.'], ['Salida', 'Ninguna.']],
    });
    const placed = [
      { type: 'placeRule', firewallId: 'fw-you', whatId: 'echo-request', fromId: 'from-printer' },
      { type: 'placeRule', firewallId: 'fw-you', whatId: 'echo-request', toId: 'to-lucia', direction: 'outbound' },
    ] as const;
    expect(plain(inspect(placed.reduce(sessionReducer, start), firewall))?.fields.slice(1)).toEqual([
      ['Entrada', 'ICMP · Echo Request ← printer'],
      ['Salida', 'ICMP · Echo Request → lucia-laptop'],
    ]);
  });

  describe('a firewall with rules that no chip names, in an incident that offers no rule chips', () => {
    const LUCIA_ECHO = { id: 'in-echo', what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE.lucia}/32` } } as const;
    const withRules = (introduced: TermId[], inbound: typeof LUCIA_ECHO[] = []): Session => {
      const base = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
      const open = { ...base, firewalls: base.firewalls.map((firewall) => ({ ...firewall, inbound })) };
      return startSession([{ ...sendIncident(), base: open, introduces: introduced }], sendIncident().id);
    };
    const FIREWALL = PIECE_ID.firewall('fw-lucia');
    const KNOWN: TermId[] = ['firewall', 'traffic', 'rule', 'inbound', 'outbound'];

    it('a host firewall whose outbound is open to everything is inspected and carded without a destination chip', () => {
      const session = withRules(KNOWN);
      expect(plain(inspect(session, FIREWALL))).toEqual({
        title: 'firewall lucia-laptop',
        fields: [whatIs('firewall'), ['Entrada', 'Ninguna.'], ['Salida', 'deja salir todo el tráfico']],
      });
      expect(firewallCard(session, FIREWALL)).toMatchObject({ rules: [], kind: 'host-firewall' });
      expect(firewallCard(session, FIREWALL)).not.toHaveProperty('outbound');
    });

    it('words the open outbound with only the terms the player knows', () => {
      const withoutTraffic = withRules(['firewall', 'rule', 'inbound', 'outbound']);
      expect(plain(inspect(withoutTraffic, FIREWALL))?.fields.at(-1)).toEqual(['Salida', 'deja salir todo']);
      const withoutOutbound = withRules(['firewall', 'traffic', 'rule']);
      expect(plain(inspect(withoutOutbound, FIREWALL))?.fields).toEqual([whatIs('firewall'), ['Reglas para lo que llega', 'Ninguna.']]);
    });

    it('writes an inbound rule that no Source chip names from the rule itself', () => {
      const session = withRules(['firewall', 'rule', 'inbound', 'outbound', 'icmp', 'echo-request'], [LUCIA_ECHO]);
      expect(plain(inspect(session, FIREWALL))?.fields.slice(1)).toEqual([
        ['Entrada', 'ICMP · Echo Request ← lucia-laptop'],
        ['Salida', 'deja salir todo'],
      ]);
      expect(firewallCard(session, FIREWALL)?.rules.map((row) => ({ id: row.id, text: 'text' in row ? toPlainText(row.text) : null }))).toEqual([{ id: LUCIA_ECHO.id, text: 'ICMP · Echo Request ← lucia-laptop' }]);
    });
  });

  it('the router of an office says what a router is and what it does', () => {
    expect(plain(inspect(office, PIECE_ID.edge))).toEqual({
      title: 'router',
      fields: [whatIs('router'), ['Qué hace', 'Conecta la red de la oficina con internet.']],
    });
  });

  it('the firewall, the edge and the internet show nothing until their terms are known, as they are not on the map, whoever is outside', () => {
    const early = knowingOnly(office, 'device', 'ip-address');
    const alone: Session = { ...office, world: { ...office.world, actors: [] } };
    for (const id of [PIECE_ID.firewall('fw-lucia'), PIECE_ID.edge, PIECE_ID.internet]) expect(inspect(early, id)).toBeNull();
    for (const id of [PIECE_ID.edge, PIECE_ID.internet]) expect(inspect(alone, id)).not.toBeNull();
    expect(inspect(knowing(early, 'firewall'), PIECE_ID.firewall('fw-lucia'))).not.toBeNull();
  });

  it('the device does not list its firewall until the firewall is known', () => {
    const fields = (session: Session) => plain(inspect(session, PIECE_ID.device('lucia-laptop')))?.fields;
    expect(fields(knowingOnly(office, 'device', 'private-ip'))).toEqual([whatIs('device'), ['IP privada', '192.168.1.11']]);
    expect(fields(knowingOnly(office, 'device', 'private-ip', 'firewall'))).toEqual([whatIs('device'), ['IP privada', '192.168.1.11'], ['firewall', 'firewall lucia-laptop']]);
  });

  it('a packet the player sent is inspected like a flow: an Echo Reply names its message and says it arrived and nobody answers it', () => {
    const sending = sendIncident();
    const start = startSession([sending], sending.id);
    const sent = sessionReducer(start, { type: 'sendPacket', fromId: 'you', toId: 'lucia', messageId: 'reply' });
    const [packet] = sent.sent;
    expect(plain(inspect(sent, packet.pieceId))).toEqual({
      title: 'Echo Reply de your-laptop a lucia-laptop',
      fields: [
        whatIs('echo-reply'),
        ['Mensaje', 'ICMP · Echo Reply'],
        ['Resultado', 'Llegó, pero nadie contestó.'],
        ['Dónde y por qué se detuvo', 'Un Echo Reply es una respuesta: llegó, y nadie lo contesta.'],
      ],
    });
    expect(inspect(sent, packet.pieceId)?.entity).toEqual({ kind: 'packet', variant: 'echo-reply', intruder: false });
  });

  it('the internet says what it is and what it does', () => {
    expect(plain(inspect(first, PIECE_ID.internet))).toEqual({ title: 'internet', fields: [whatIs('internet'), ['Qué hace', 'Lleva cada paquete de una red a otra.']] });
  });

  it('says which entity it shows, so the box can draw its icon: an intruder packet is told apart from a legitimate one', () => {
    expect(inspect(first, PIECE_ID.device(S2.id))?.entity).toEqual({ kind: 'device', variant: 'ec2-instance' });
    expect(inspect(office, PIECE_ID.edge)?.entity).toEqual({ kind: 'edge', variant: 'router' });
    expect(inspect(first, PIECE_ID.packet(FLOWS.attackerPing.id))?.entity).toEqual({ kind: 'packet', variant: 'echo-request', intruder: true });
    expect(inspect(first, PIECE_ID.packet(FLOWS.pingToServer2.id))?.entity).toEqual({ kind: 'packet', variant: 'echo-request', intruder: false });
  });

  it('an id that names nothing shows nothing', () => {
    expect(inspect(first, PIECE_ID.device('ghost'))).toBeNull();
    expect(inspect(first, 'nonsense')).toBeNull();
  });

  describe('a packet that a firewall stops', () => {
    const guarded = withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    const sentTo = (toId: string, ...introduced: TermId[]) => {
      const incident = { ...sendIncident(), base: guarded, introduces: [...sendIncident().introduces, ...introduced] };
      const session = sessionReducer(startSession([incident], incident.id), { type: 'sendPacket', fromId: 'you', toId, messageId: 'ping' });
      return { session, pieceId: session.sent[0].pieceId };
    };
    const text = (inspection: Inspection | null) => JSON.stringify(plain(inspection)).toLowerCase();

    it('a packet dropped by a firewall the player does not know yet says only that nothing came back', () => {
      const { session, pieceId } = sentTo('lucia');
      expect(session.sent[0].trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop' }));
      expect(plain(inspect(session, pieceId))?.fields).toEqual([
        whatIs('echo-request'),
        ECHO_REQUEST,
        WAITED_FOR_NOTHING,
        ['Dónde y por qué se detuvo', 'No volvió ninguna respuesta.'],
      ]);
      expect(text(inspect(session, pieceId))).not.toMatch(/firewall|regla|descart/);
    });

    it('says that the firewall dropped it, without any rule, once the firewall is known and its rules are not', () => {
      const { session, pieceId } = sentTo('lucia', 'firewall');
      expect(plain(inspect(session, pieceId))?.fields.at(-1)).toEqual(['Dónde y por qué se detuvo', 'El firewall de lucia-laptop descartó el paquete sin avisar.']);
      expect(text(inspect(session, pieceId))).not.toMatch(/regla/);
    });

    it('names the missing rule once the firewall and its rules are known', () => {
      const { session, pieceId } = sentTo('lucia', 'firewall', 'rule');
      expect(plain(inspect(session, pieceId))?.fields.at(-1)).toEqual(['Dónde y por qué se detuvo', 'Se queda en el firewall de lucia-laptop: ninguna regla lo deja entrar.']);
    });

    it('the outcome text of a packet says only that it arrived while Echo Reply is not a known term', () => {
      const { session, pieceId } = sentTo('printer');
      const result = (known: ReadonlySet<TermId>) => plain(inspect({ ...session, known }, pieceId))?.fields.find(([label]) => label === 'Resultado');
      expect(session.sent[0].replied).toBe(true);
      expect(result(new Set<TermId>(['ping', 'echo-request']))).toEqual(['Resultado', 'Llegó a printer.']);
      expect(result(new Set<TermId>(['ping', 'echo-request', 'echo-reply']))).toEqual(['Resultado', 'Llegó y volvió la respuesta.']);
    });
  });
});

describe('a packet of an office with routers', () => {
  const { officeRouter, provider, backbone, server } = OFFICE_FLOORS;
  const ROUTED = routedSendIncident();
  const start = startSession([ROUTED], ROUTED.id);
  const sentTo = (session: Session, toId: string, messageId = 'ping') => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId });
  const lastBox = (session: Session) => plain(inspect(session, session.sent.at(-1)!.pieceId));
  const field = (session: Session, label: string) => lastBox(session)?.fields.find(([name]) => name === label);
  const without = (session: Session, ...terms: TermId[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) });
  const drawing = (session: Session, ...ids: string[]): Session => ({ ...session, incident: { ...session.incident, shown: ids } });
  const ROUND_TRIP = 'Tiempo de ida y vuelta';
  const EXAMPLE = 'Cifra de ejemplo.';

  it('a packet that came back shows its round trip time once the term is known', () => {
    expect(field(sentTo(start, 'printer'), ROUND_TRIP)).toEqual([ROUND_TRIP, '2 ms', EXAMPLE]);
    expect(field(sentTo(start, 'server'), ROUND_TRIP)).toEqual([ROUND_TRIP, '84 ms', EXAMPLE]);
    expect(field(sentTo(start, 'loopback'), ROUND_TRIP)).toEqual([ROUND_TRIP, '0,05 ms', EXAMPLE]);
    expect(field(sentTo(without(start, 'rtt'), 'printer'), ROUND_TRIP)).toBeUndefined();
  });

  it('a packet that came back shows its time after the result, and a warning that came back shows it too', () => {
    const labels = (session: Session) => lastBox(session)?.fields.map(([name]) => name);
    expect(labels(sentTo(start, 'printer'))).toEqual(['Qué es', 'Mensaje', REQUEST_HEADER, 'Encabezado del Echo Reply', 'Resultado', ROUND_TRIP]);
    const expired = sentTo(start, 'server', 'ping-2');
    expect(expired.sent[0].trace.outcome).toBe('ttl-exceeded');
    expect(labels(expired)?.slice(-3)).toEqual(['Resultado', ROUND_TRIP, 'Dónde y por qué se detuvo']);
    expect(field(expired, ROUND_TRIP)?.[1]).toBe('20 ms');
  });

  it('a packet that never came back shows no time', () => {
    const silence = sentTo(start, 'private');
    const own = sentTo(start, 'nobody');
    expect(silence.sent[0].trace).toMatchObject({ outcome: 'timeout' });
    expect(own.sent[0].trace).toMatchObject({ outcome: 'unreachable', notice: { fromId: 'your-laptop' } });
    expect(silence.sent[0].trace.rttMs).toBeUndefined();
    expect(own.sent[0].trace.rttMs).toBeUndefined();
    expect(field(silence, ROUND_TRIP)).toBeUndefined();
    expect(field(own, ROUND_TRIP)).toBeUndefined();
  });

  it('a warning the player does not know yet leaves no time either, since the packet is seen as one that nobody answered', () => {
    const expired = sentTo(start, 'server', 'ping-2');
    expect(field(expired, ROUND_TRIP)).toBeDefined();
    expect(field(sentTo(without(start, 'time-exceeded'), 'server', 'ping-2'), ROUND_TRIP)).toBeUndefined();
  });

  it('the path of a packet names only the routers its incident draws, and writes outside the office for the stretch through routers that are not drawn', () => {
    const drawn = sentTo(start, 'server');
    expect(field(drawn, 'Saltos')).toEqual(['Saltos', 'router-office (192.168.1.1)', 'router-provider (203.0.113.1)', 'router-backbone (203.0.113.2)']);
    const partly = sentTo(drawing(start, 'your-laptop', officeRouter.id, server.id), 'server');
    expect(field(partly, 'Saltos')).toEqual(['Saltos', 'router-office (192.168.1.1)', 'fuera de la oficina']);
    const hidden = sentTo(drawing(start, 'your-laptop', server.id), 'server');
    expect(field(hidden, 'Saltos')).toEqual(['Saltos', 'dentro de la oficina', 'fuera de la oficina']);
    const text = JSON.stringify(lastBox(partly));
    for (const id of [provider.id, backbone.id, provider.towardOffice, backbone.towardProvider]) expect(text).not.toContain(id);
  });

  it('the reason a packet stopped does not name a router that is not drawn either', () => {
    const lost = sentTo(drawing(start, 'your-laptop', officeRouter.id), 'private');
    const stop = field(lost, 'Dónde y por qué se detuvo');
    expect(stop?.[1]).toBe('10.0.0.10 es una IP privada: se repite en muchas redes y internet no la entrega. Un router, ya fuera de la oficina, descarta el paquete sin avisar.');
    expect(stop?.[1]).not.toContain(provider.id);
    expect(field(sentTo(start, 'private'), 'Dónde y por qué se detuvo')?.[1]).toContain(provider.id);
  });

  it('the path of a packet is worded without hops until the term hop is known', () => {
    const passed = sentTo(without(start, 'hop'), 'server');
    expect(field(passed, 'Pasó por')).toEqual(['Pasó por', 'router-office (192.168.1.1)', 'router-provider (203.0.113.1)', 'router-backbone (203.0.113.2)']);
    expect(field(passed, 'Saltos')).toBeUndefined();
    expect(field(sentTo(start, 'server'), 'Pasó por')).toBeUndefined();
  });

  it('a packet that crossed no router has no path', () => {
    const direct = sentTo(start, 'printer');
    expect(field(direct, 'Saltos')).toBeUndefined();
    expect(field(direct, 'Pasó por')).toBeUndefined();
  });

  it('the header of a packet shows the source and the destination IP once the term header is known', () => {
    const printer = sentTo(start, 'printer');
    expect(field(printer, REQUEST_HEADER)).toEqual([REQUEST_HEADER, 'IP de origen: 192.168.1.10', 'IP de destino: 192.168.1.21', 'TTL al salir: 64']);
    expect(field(sentTo(without(start, 'ttl'), 'printer'), REQUEST_HEADER)).toEqual([REQUEST_HEADER, 'IP de origen: 192.168.1.10', 'IP de destino: 192.168.1.21']);
    expect(field(sentTo(without(start, 'header'), 'printer'), REQUEST_HEADER)).toBeUndefined();
    expect(field(sentTo(start, 'server', 'ping-2'), LOCAL_HEADER)?.at(-1)).toBe('TTL al salir: 2');
  });

  it('the header of the request is called the header of the Echo Request only while the reply header is shown beside it', () => {
    expect(field(sentTo(start, 'printer'), 'Encabezado')).toBeUndefined();
    expect(field(sentTo(without(start, 'echo-reply'), 'printer'), 'Encabezado')?.slice(1, 3)).toEqual(['IP de origen: 192.168.1.10', 'IP de destino: 192.168.1.21']);
    expect(field(sentTo(without(start, 'echo-reply'), 'printer'), REQUEST_HEADER)).toBeUndefined();
    expect(field(sentTo(start, 'private'), LOCAL_HEADER)?.slice(1, 3)).toEqual(['IP de origen: 192.168.1.10', 'IP de destino: 10.0.0.10']);
    expect(field(sentTo(start, 'private'), REQUEST_HEADER)).toBeUndefined();
  });

  it('the header of the reply swaps the source and the destination, and waits for the term Echo Reply', () => {
    const printer = sentTo(start, 'printer');
    expect(field(printer, 'Encabezado del Echo Reply')).toEqual(['Encabezado del Echo Reply', 'IP de origen: 192.168.1.21', 'IP de destino: 192.168.1.10']);
    expect(field(sentTo(without(start, 'echo-reply'), 'printer'), 'Encabezado del Echo Reply')).toBeUndefined();
    expect(field(sentTo(start, 'private'), 'Encabezado del Echo Reply')).toBeUndefined();
  });

  it('keeps the private source of the header across the routers', () => {
    expect(field(sentTo(start, 'server'), LOCAL_REQUEST_HEADER)?.slice(1, 3)).toEqual(['IP de origen: 192.168.1.10', `IP de destino: ${server.ip}`]);
  });

  it('the header of a trip that leaves the office is labelled as seen in the local network', () => {
    const notes = (session: Session, label: string) => inspect(session, session.sent[0].pieceId)?.fields.filter((candidate) => toPlainText(candidate.label) === label).flatMap((candidate) => (candidate.notes ?? []).map((note) => toPlainText(note)));
    const answered = sentTo(start, 'server');
    expect(field(answered, LOCAL_REQUEST_HEADER)).toEqual([LOCAL_REQUEST_HEADER, 'IP de origen: 192.168.1.10', `IP de destino: ${server.ip}`, 'TTL al salir: 64']);
    expect(field(answered, LOCAL_REPLY_HEADER)).toEqual([LOCAL_REPLY_HEADER, `IP de origen: ${server.ip}`, 'IP de destino: 192.168.1.10']);
    expect(field(answered, REQUEST_HEADER)).toBeUndefined();
    expect(notes(answered, LOCAL_REQUEST_HEADER)).toEqual([]);
    expect(notes(answered, LOCAL_REPLY_HEADER)).toEqual([HEADER_CHANGES]);
    const lost = sentTo(start, 'private');
    expect(notes(lost, LOCAL_HEADER)).toEqual([HEADER_CHANGES]);
    expect(lastBox(answered)?.fields.flat().join(' ')).not.toMatch(/NAT|pública/);
    expect(JSON.stringify(inspect(answered, answered.sent[0].pieceId))).not.toMatch(/NAT|pública/);
  });

  it('the header of a trip inside the office is not relabelled and has no note, and neither is one that stays in the device', () => {
    for (const to of ['printer', 'loopback', 'nobody'] as const) {
      const session = sentTo(start, to);
      const box = inspect(session, session.sent[0].pieceId);
      expect(box?.fields.flatMap((candidate) => candidate.notes ?? []), to).toEqual([]);
      expect(box?.fields.map((candidate) => toPlainText(candidate.label)).filter((label) => label.includes('red local')), to).toEqual([]);
    }
  });

  it('writes the local network of the header label as a term only once it is known', () => {
    const early = sentTo(without(start, 'lan'), 'server');
    expect(unknownTerms(inspect(early, early.sent[0].pieceId)?.fields.flatMap((candidate) => [candidate.label, ...candidate.lines, ...(candidate.notes ?? [])]) ?? [], early.known)).toEqual([]);
    expect(plain(inspect(early, early.sent[0].pieceId))?.fields.map(([label]) => label)).toContain(LOCAL_REQUEST_HEADER);
  });

  it('names the lines of the header by the terms IP de origen and IP de destino only once they are known, and by plain words before', () => {
    const plainWords = without(start, 'source-ip', 'destination-ip');
    expect(field(sentTo(plainWords, 'printer'), REQUEST_HEADER)?.slice(1, 3)).toEqual(['Origen: 192.168.1.10', 'Destino: 192.168.1.21']);
    expect(field(sentTo(without(start, 'source-ip'), 'printer'), REQUEST_HEADER)?.slice(1, 3)).toEqual(['Origen: 192.168.1.10', 'IP de destino: 192.168.1.21']);
  });

  it('tags only the terms the player knows in the fields of the header, the path and the time, whichever of their terms is missing', () => {
    const OWN_FIELDS = ['Encabezado', REQUEST_HEADER, 'Encabezado del Echo Reply', LOCAL_HEADER, LOCAL_REQUEST_HEADER, LOCAL_REPLY_HEADER, 'Saltos', 'Pasó por', ROUND_TRIP];
    for (const missing of ['header', 'ttl', 'echo-reply', 'hop', 'rtt', 'time-exceeded', 'router', 'lan'] as const) {
      const unaware = without(start, missing);
      for (const [to, message] of [['printer', 'ping'], ['server', 'ping'], ['server', 'ping-2'], ['nobody', 'ping']] as const) {
        const session = sentTo(unaware, to, message);
        const fields = session.sent.flatMap((run) => inspect(session, run.pieceId)?.fields ?? []).filter((candidate) => OWN_FIELDS.includes(toPlainText(candidate.label)));
        expect(unknownTerms(fields.flatMap((candidate) => [candidate.label, ...candidate.lines, ...(candidate.notes ?? [])]), unaware.known), `${missing} / ${to} / ${message}`).toEqual([]);
      }
    }
  });

  it('a traceroute packet is inspected as a traceroute: it is defined as one, has no TTL of its own and lists the hops of the last probe it sent', () => {
    const traced = sentTo(start, 'server', 'trace');
    expect(lastBox(traced)?.title).toBe('traceroute de tu-laptop a servidor-internet');
    expect(lastBox(traced)?.fields[0]).toEqual(['Qué es', TERMS.traceroute.definition]);
    expect(JSON.stringify(lastBox(traced))).not.toContain(TERMS.ping.definition);
    expect(field(traced, LOCAL_REQUEST_HEADER)).toEqual([LOCAL_REQUEST_HEADER, 'IP de origen: 192.168.1.10', `IP de destino: ${server.ip}`]);
    expect(field(traced, 'Saltos')).toEqual(['Saltos', 'router-office (192.168.1.1)', 'router-provider (203.0.113.1)', 'router-backbone (203.0.113.2)']);
    expect(field(traced, ROUND_TRIP)?.[1]).toBe('84 ms');
    expect(field(sentTo(start, 'server'), 'Qué es')?.[1]).toBe(TERMS['echo-request'].definition);
  });
});

describe('a packet that goes round a loop', () => {
  const looping = startSession(INCIDENTS, '01-09');
  const hopsOf = (session: Session, messageId: string): string[] => {
    const sent = sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId: 'ip-server', messageId });
    return plain(inspect(sent, sent.sent[0].pieceId))?.fields.find(([label]) => label === 'Saltos')?.slice(1) ?? [];
  };

  it('lists the first hops, as many as a traceroute prints, and counts the rest', () => {
    const lines = hopsOf(looping, 'ping-ttl-64');
    expect(lines).toHaveLength(TRACEROUTE_MAX_HOPS + 1);
    expect(lines.slice(0, 4)).toEqual(['router-oficina (192.168.1.1)', 'router-proveedor (203.0.113.1)', 'router-oficina (192.168.1.1)', 'router-proveedor (203.0.113.1)']);
    expect(lines.at(-1)).toBe(`y ${64 - TRACEROUTE_MAX_HOPS} saltos más`);
  });

  it('counts one hop more in the singular', () => {
    expect(INSPECTION_TEXT.moreHops(1)).toBe('y 1 {{hop|salto}} más');
    expect(INSPECTION_TEXT.moreHops(2)).toBe('y 2 {{hop|saltos}} más');
  });

  it('lists every hop of a packet that crossed no more than that, with no line that counts', () => {
    expect(hopsOf(looping, 'ping-ttl-5')).toHaveLength(5);
    expect(hopsOf(looping, 'ping-ttl-5').join(' ')).not.toMatch(/más/);
  });
});
