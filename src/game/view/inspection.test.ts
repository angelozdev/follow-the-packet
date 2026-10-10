import { describe, expect, it } from 'vitest';
import { ACTOR_ROLE_TEXT, TERMS, toPlainText, type TermId } from '@/copy';
import { INCIDENTS } from '@/levels';
import { FLOWS, FROM, S2, SG, WHAT } from '@/levels/04-iaas/shared';
import { OFFICE_FLOORS, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { inspect, type Inspection } from './inspection';
import { PIECE_ID } from './piece-id';
import { pieceViews } from './pieces';

const WHAT_IS = 'Qué es';
const ECHO_REQUEST = ['Mensaje', 'ICMP · Echo Request'];
const ATTACKER_BLOCKED = ['Resultado', 'No llegó: no volvió ninguna respuesta.'];
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

  it('an instance shows what an EC2 instance is, its private IP and its Security Group, and nothing of later terms', () => {
    expect(plain(inspect(first, PIECE_ID.device(S2.id)))).toEqual({
      title: 'servidor2',
      fields: [whatIs('ec2-instance'), ['IP privada', S2.private], ['Security Groups', 'Security Group servidor2']],
    });
  });

  it('titles a piece with its own name marked as a name, and keeps the entity plain', () => {
    expect(inspect(first, PIECE_ID.device(S2.id))?.title).toBe('[[servidor2]]');
    expect(inspect(first, PIECE_ID.firewall(SG.servidor2))?.title).toBe('{{security-group}} [[servidor2]]');
    expect(inspect(first, PIECE_ID.actor('attacker'))?.title).toBe('[[Atacante]]');
  });

  it('later terms add their fields', () => {
    const fields = plain(inspect(knowing(first, 'public-ip', 'dns'), PIECE_ID.device(S2.id)))?.fields.map(([label]) => label);
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
    expect(plain(inspect(unaware, PIECE_ID.packet(FLOWS.attackerPing.id)))?.fields[0]).toEqual(ATTACKER_BLOCKED);
  });

  it('the attacker says who it is, but not its IP yet', () => {
    expect(plain(inspect(first, PIECE_ID.actor('attacker')))?.fields).toEqual([['Quién es', toPlainText(ACTOR_ROLE_TEXT.attacker)]]);
  });

  it('the box of the server of the internet says it is a device and shows its IP, with no actor role', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    const box = inspect(floors, PIECE_ID.actor(OFFICE_FLOORS.server.id));
    expect(box?.entity).toEqual({ kind: 'device', variant: 'internet-server' });
    expect(plain(box)).toEqual({ title: 'servidor-internet', fields: [whatIs('device'), ['dirección IP', OFFICE_FLOORS.server.ip]] });
    expect(plain(box)?.fields.map(([label]) => label)).not.toContain('Quién es');
    expect(plain(inspect(knowing(floors, 'private-ip', 'public-ip'), PIECE_ID.actor(OFFICE_FLOORS.server.id)))?.fields).toEqual([whatIs('device'), ['dirección IP', OFFICE_FLOORS.server.ip]]);
  });

  it('a router of the world says what a router is under its own name, and nothing that only holds for the router of the office', () => {
    const floors: Session = { ...office, world: officeTwoFloorsNet() };
    expect(plain(inspect(floors, PIECE_ID.router(OFFICE_FLOORS.provider.id)))).toEqual({ title: OFFICE_FLOORS.provider.id, fields: [whatIs('router')] });
    expect(inspect(floors, PIECE_ID.router('ghost'))).toBeNull();
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
      fields: [whatIs('device'), ['IP privada', '192.168.1.11'], ['firewall', 'firewall lucia-laptop']],
    });
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
    expect(plain(inspect(office, PIECE_ID.firewall('fw-lucia')))).toEqual({
      title: 'firewall lucia-laptop',
      fields: [whatIs('firewall'), ['Reglas', 'Ninguna: no deja entrar nada.']],
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
        ['Resultado', 'No llegó: no volvió ninguna respuesta.'],
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
      expect(result(new Set<TermId>(['ping', 'echo-request']))).toEqual(['Resultado', 'Llegó.']);
      expect(result(new Set<TermId>(['ping', 'echo-request', 'echo-reply']))).toEqual(['Resultado', 'Llegó y volvió la respuesta.']);
    });
  });
});
