import { describe, expect, it } from 'vitest';
import { INSPECTION_TEXT, toPlainText, type TermText } from '@/copy';
import { stopStep } from '@/engine';
import { INCIDENTS, sendCombinations, type SendIncident } from '@/levels';
import { ADDRESS, MESSAGE, ORIGIN } from '@/levels/01-first-day/shared';
import { NAME_SERVER_PIECES, OFFICE, OFFICE_FLOORS, device, namesSendIncident, ping, repairableDiagnoseIncident, sendIncident } from '@/testing';
import { drawnSends } from '@/game/flow-runs';
import { restartNotice, sendingOf, sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { recordsCard } from '@/game/view/cards/table-card';
import { inspect } from '@/game/view/inspection';
import { PIECE_ID } from '@/game/view/piece-id';
import { printedText, registryLines, registryRows, type PacketLine, type RegistryLine } from './lines';

const WHEN_IT_DOES_NOT_COME_BACK = '01-05';
const SEEING_THE_PATH = '01-10';
const FILTER_WITH_FLOWS = '04-01';
const NAMES = namesSendIncident();
const { zone, authoritative } = NAME_SERVER_PIECES;
const { provider, officeRouter, server } = OFFICE_FLOORS;
const pingFrom01 = (toId: string): SessionAction => ({ type: 'sendPacket', fromId: ORIGIN.you.id, toId, messageId: MESSAGE.ping.id });
const nameSend = (toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId: 'you', toId, messageId });
const DIG = nameSend('www', 'dig');
const PING = nameSend('lucia', 'ping');
const placeRoute: SessionAction = { type: 'placeEntry', tableId: 'routes', picks: { destination: 'default', nextHop: officeRouter.id } };
const noResolver: SessionAction = { type: 'setSetting', deviceId: 'your-laptop', settingId: 'resolver', chipId: 'none' };
const ambient = (id: string, to: string) => ({ id, kind: 'ambient' as const, packet: ping(device('your-laptop'), to) });
const NOISY: SendIncident = { ...sendIncident(), flows: [ambient('hum', OFFICE.printer), ambient('noise', OFFICE.lucia)] };
const TRACING: SendIncident = { ...NAMES, send: { ...NAMES.send, message: [...NAMES.send.message, { id: 'trace', label: '{{traceroute}}', command: 'traceroute', icmpType: 8 }] } };
const ECHOING: SendIncident = { ...NAMES, flows: [ambient('hum', OFFICE_FLOORS.floor1.lucia), ambient('noise', OFFICE_FLOORS.floor1.lucia)] };
const refuseRecord: SessionAction = { type: 'placeEntry', tableId: 'records', picks: { name: `www.${zone}`, type: 'CNAME', value: server.ip } };
const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([NAMES], NAMES.id));
const playIn = (id: string, ...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession(INCIDENTS, id));
const kinds = (session: Session) => registryLines(session).map(({ kind }) => kind);
const packets = (session: Session) => registryLines(session).filter((line): line is PacketLine => line.kind === 'packet');
const lineOf = (field: TermText[] | undefined) => field?.[0];

function boxField(session: Session, pieceId: string, label: string): TermText[] | undefined {
  return inspect(session, pieceId)?.fields.find((field) => toPlainText(field.label) === label)?.lines;
}

function sendEveryCombination(session: Session): Session {
  const offers = sendingOf(session);
  const moves = offers ? sendCombinations(offers) : [];
  return moves.reduce((current, move) => sessionReducer(current, { type: 'sendPacket', ...move }), session);
}

describe('the lines of the registry', () => {
  it('a send is the newest line with its label, its result and the reason it stopped, in the words of the box', () => {
    const sent = playIn(WHEN_IT_DOES_NOT_COME_BACK, pingFrom01(ADDRESS.nobody.id));
    const [run] = sent.sent;
    const [newest] = registryLines(sent);
    expect(newest).toEqual({
      kind: 'packet',
      pieceId: run.pieceId,
      label: run.label,
      result: lineOf(boxField(sent, run.pieceId, INSPECTION_TEXT.result)),
      reason: lineOf(boxField(sent, run.pieceId, INSPECTION_TEXT.stoppedAt)),
    });
    expect(inspect(sent, run.pieceId)?.title).toBe(run.label);
    expect(newest).toMatchObject({ reason: expect.any(String) });
    const second = sessionReducer(sent, pingFrom01(ADDRESS.printer.id));
    expect(registryLines(second).map((line) => line.kind === 'packet' && line.pieceId).slice(0, 2)).toEqual([second.sent[1].pieceId, run.pieceId]);
  });

  it('a live flow is a line, in the order inspect lists the flows', () => {
    const start = startSession(INCIDENTS, FILTER_WITH_FLOWS);
    const lines = registryLines(start);
    expect(start.runs.length).toBeGreaterThan(1);
    expect(lines).toHaveLength(start.runs.length);
    const listed = inspect(start, PIECE_ID.stamps(start.runs.map(({ id }) => id)));
    expect(lines.map((line) => line.kind === 'packet' && line.label)).toEqual(listed?.fields.map(({ label }) => label));
  });

  it('a flow is older than every send, so the sends come first', () => {
    const sent = sendEveryCombination(startSession([NOISY], NOISY.id));
    const lines = packets(sent);
    const flowIds = sent.runs.map(({ pieceId }) => pieceId);
    expect(flowIds).toHaveLength(2);
    expect(lines.slice(-flowIds.length).map(({ pieceId }) => pieceId)).toEqual([...flowIds].reverse());
    expect(lines.slice(0, -flowIds.length)).toHaveLength(sent.history.length);
    expect(lines.slice(0, -flowIds.length).map(({ pieceId }) => pieceId)).not.toContain(flowIds[0]);
  });

  it('a change that emptied the sends is a line with the notice and the next send becomes the newest', () => {
    const changed = playing(DIG, placeRoute);
    const [first] = registryLines(changed);
    expect(first).toEqual({ kind: 'change', notice: restartNotice(changed) });
    expect(toPlainText((first as { notice: TermText }).notice)).toBe(`Cambiaste la tabla de rutas de ${provider.id}: las pruebas de antes eran con la red anterior. Vuelve a mandarlas.`);
    expect(kinds(changed)).toEqual(['change', ...changed.runs.map(() => 'packet')]);
    expect(kinds(sessionReducer(changed, PING)).slice(0, 2)).toEqual(['packet', 'change']);
  });

  it('a change with no sends before leaves no line', () => {
    expect(kinds(playing(placeRoute))).toEqual(playing().runs.map(() => 'packet'));
    expect(kinds(playing(DIG, placeRoute, noResolver)).filter((kind) => kind === 'change')).toHaveLength(1);
  });

  it('a table rejection is a line and the table still shows its problem', () => {
    const refused = playing(DIG, refuseRecord);
    const [first, second] = registryLines(refused);
    const problem = recordsCard(refused, PIECE_ID.actor(authoritative.id))?.problem;
    expect(problem).toBeTruthy();
    expect(first).toEqual({ kind: 'rejection', text: problem });
    expect(second.kind).toBe('packet');
    expect(kinds(sessionReducer(refused, PING)).slice(0, 3)).toEqual(['packet', 'rejection', 'packet']);
  });

  it('each case of a diagnose starts its lines again', () => {
    const REPAIRABLE = repairableDiagnoseIncident();
    const { cases } = REPAIRABLE.diagnose;
    const fixed = cases.findIndex(({ fix }) => fix);
    const nameRight = (index: number): SessionAction => ({ type: 'nameCause', index: cases[index].cause.options.findIndex((option) => option.correct) });
    const closing = cases.slice(0, fixed).flatMap((spec, at): SessionAction[] => [...(spec.fix?.solution ?? []), nameRight(at), { type: 'nextCase' }]);
    const test: SessionAction = { type: 'sendPacket', fromId: 'origin', toId: 'server', messageId: 'ping' };
    const start = startSession([REPAIRABLE], REPAIRABLE.id);
    const repaired = [...closing, test, ...cases[fixed].fix!.solution, nameRight(fixed)].reduce(sessionReducer, start);
    expect(kinds(repaired)).toContain('change');
    expect(kinds(repaired)).toContain('packet');
    const next = sessionReducer(repaired, { type: 'nextCase' });
    expect(registryLines(next)).toHaveLength(next.runs.length);
    expect(kinds(next)).not.toContain('change');
  });

  it('the lines have one entry for each packet the map draws, in every registered incident', () => {
    for (const { id } of INCIDENTS) {
      const sent = sendEveryCombination(startSession(INCIDENTS, id));
      const drawn = [...sent.runs, ...drawnSends(sent.sent)].map(({ pieceId }) => pieceId);
      const listed = registryLines(sent).map((line: RegistryLine) => line.kind === 'packet' && line.pieceId);
      expect(listed.sort(), id).toEqual(drawn.sort());
    }
  });

  it('a packet whose stop the player cannot place says nothing of where it died', () => {
    const hiddenFirewall = playIn(WHEN_IT_DOES_NOT_COME_BACK, pingFrom01(ADDRESS.marta.id));
    const hiddenRouter = playIn(SEEING_THE_PATH, pingFrom01(ADDRESS.server.id));
    for (const session of [hiddenFirewall, hiddenRouter]) {
      const [run] = session.sent;
      expect(run.hiddenStop).toBe(true);
      expect(stopStep(run.trace)).toBeDefined();
      expect(registryLines(session)[0]).toMatchObject({ pieceId: run.pieceId, reason: null });
    }
    for (const { id } of INCIDENTS) {
      const sent = sendEveryCombination(startSession(INCIDENTS, id));
      const hidden = [...sent.runs, ...sent.history].filter((run) => run.hiddenStop).map(({ pieceId }) => pieceId);
      for (const line of packets(sent).filter(({ pieceId }) => hidden.includes(pieceId))) expect(line.reason, `${id} ${toPlainText(line.label)}`).toBeNull();
    }
  });
});

describe('the rows of the registry', () => {
  it('grouped lines never cross a line of change', () => {
    const session = [PING, placeRoute, PING].reduce(sessionReducer, startSession([ECHOING], ECHOING.id));
    const lines = registryLines(session);
    expect(kinds(session)).toEqual(['packet', 'change', 'packet', 'packet']);
    expect(printedText(lines[0])).toBe(printedText(lines[2]));
    expect(printedText(lines[2])).toBe(printedText(lines[3]));
    expect(registryRows(lines).map(({ line, older }) => [line.kind, older.length])).toEqual([
      ['packet', 0],
      ['change', 0],
      ['packet', 1],
    ]);
  });
});

describe('the row of a send in its table of routes', () => {
  const YOU = PIECE_ID.device('your-laptop');
  const ROUTER = PIECE_ID.router(officeRouter.id);
  const rowOfTheNewest = (session: Session) => (registryLines(session)[0] as PacketLine).row;
  const without = (session: Session, term: 'router' | 'routing-table'): Session => ({ ...session, known: new Set([...session.known].filter((known) => known !== term)) });

  it('a send line names the first router of its route decisions that the map draws and its send number, and its question, a traceroute and a flow name none', () => {
    const sent = playing(PING, nameSend('server', 'ping'));
    expect(sent.history.map(({ send }) => send)).toEqual([1, 2]);
    expect(sent.history[1].trace.routes?.map(({ holderId }) => holderId)[0]).toBe('your-laptop');
    expect(packets(sent).slice(0, 2).map(({ row }) => row)).toEqual([{ pieceId: ROUTER, send: 2 }, { pieceId: YOU, send: 1 }]);
    expect(packets(sent).slice(2).every(({ row }) => row === undefined)).toBe(true);
    const byName = playing(nameSend('www', 'ping'));
    const [packet, question] = packets(byName);
    expect(packet.row).toEqual({ pieceId: ROUTER, send: 1 });
    expect(question.row).toBeUndefined();
    const tracing = [nameSend('server', 'trace')].reduce(sessionReducer, startSession([TRACING], TRACING.id));
    expect(tracing.history[0].route).toBeDefined();
    expect(rowOfTheNewest(tracing)).toBeUndefined();
  });

  it('the device whose decision it is when the decisions hold no router, and nothing when they hold routers and the map draws none', () => {
    const insideTheLan = playing(PING);
    expect(insideTheLan.history[0].trace.routes?.map(({ holderId }) => holderId)).toEqual(['your-laptop']);
    expect(rowOfTheNewest(insideTheLan)).toEqual({ pieceId: YOU, send: 1 });
    expect(rowOfTheNewest(without(insideTheLan, 'router'))).toEqual({ pieceId: YOU, send: 1 });
    const crossing = playing(nameSend('server', 'ping'));
    expect(rowOfTheNewest(crossing)).toEqual({ pieceId: ROUTER, send: 1 });
    expect(crossing.history[0].trace.routes?.some(({ holderId }) => holderId === officeRouter.id)).toBe(true);
    expect(rowOfTheNewest(without(crossing, 'router'))).toBeUndefined();
  });

  it('is hidden for a send that never left, with the routing table unknown and once the incident is over', () => {
    expect(rowOfTheNewest(playing(noResolver, DIG))).toBeUndefined();
    const left = playing(PING);
    expect(rowOfTheNewest(left)).toBeDefined();
    expect(rowOfTheNewest(without(left, 'routing-table'))).toBeUndefined();
    expect(rowOfTheNewest({ ...left, phase: 'result' })).toBeUndefined();
  });
});
