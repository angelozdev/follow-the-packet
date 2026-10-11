import { describe, expect, it } from 'vitest';
import { toPlainText, type TermId } from '@/copy';
import { applyAction } from '@/engine';
import { OFFICE_FLOORS, officeTwoFloorsNet, routedSendIncident } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { tracerouteLines } from '@/game/view/cards/terminal/traceroute-lines';
import { inspect } from './inspection';
import { pieceViews } from './pieces';
import { revealedRouterIds } from './revealed-routers';

const { range, officeRouter, provider, backbone, server } = OFFICE_FLOORS;
const SILENT_PROVIDER = applyAction(officeTwoFloorsNet(), { type: 'updateRouter', routerId: provider.id, routes: [{ to: range, next: officeRouter.id }], sendsUnreachable: false });
const WAITING = { ...routedSendIncident(), base: SILENT_PROVIDER, shown: ['your-laptop', officeRouter.id, provider.id, backbone.id, server.id], revealRoutersByTraceroute: true };
const NOT_WAITING = { ...WAITING, revealRoutersByTraceroute: undefined };
const TRACEROUTE_PICKS = { from: 'you', to: 'server', message: 'trace' };
const STAR = '*';
const ROUTERS_THAT_ANSWER = [officeRouter.id, provider.id].sort();
const PATH_LABEL = 'Saltos';
const STOPPED_LABEL = 'Dónde y por qué se detuvo';

const send = (session: Session, toId: string, messageId = 'ping'): Session => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId });
const routersDrawn = (session: Session): string[] => pieceViews(session).flatMap((piece) => (piece.kind === 'edge' ? [piece.anchorId] : []));
const fieldOf = (session: Session, label: string, messageId = 'ping'): string[] | undefined => {
  const field = inspect(session, session.sent.find((run) => run.messageId === messageId)?.pieceId ?? '')?.fields.find((candidate) => toPlainText(candidate.label) === label);
  return field?.lines.map((line) => toPlainText(line));
};
const unaware = (session: Session, term: TermId): Session => ({ ...session, known: new Set([...session.known].filter((known) => known !== term)) });

describe('routers that wait for a traceroute', () => {
  const start = startSession([WAITING], WAITING.id);
  const traced = send(start, 'server', 'trace');

  it('draws no router before a traceroute, whatever else the player sends', () => {
    expect(routersDrawn(start)).toEqual([]);
    expect(routersDrawn(send(start, 'server'))).toEqual([]);
    expect(routersDrawn(send(start, 'server', 'ping-2'))).toEqual([]);
    expect(routersDrawn(send(start, 'printer'))).toEqual([]);
  });

  it('draws the routers the lines of a traceroute name, and no other', () => {
    expect(tracerouteLines(traced, TRACEROUTE_PICKS)?.lines.filter((line) => line.address !== STAR)).toHaveLength(ROUTERS_THAT_ANSWER.length);
    expect([...revealedRouterIds(traced)].sort()).toEqual(ROUTERS_THAT_ANSWER);
    expect(routersDrawn(traced).sort()).toEqual(ROUTERS_THAT_ANSWER);
  });

  it('keeps the routers drawn when the player sends anything else afterwards', () => {
    expect(routersDrawn(send(traced, 'server'))).toEqual(routersDrawn(traced));
    expect(routersDrawn(send(send(traced, 'server'), 'printer'))).toEqual(routersDrawn(traced));
  });

  it('reveals nothing from a traceroute whose warning the player cannot name yet, since its lines are stars', () => {
    const blind = send(send(unaware(start, 'time-exceeded'), 'server'), 'server', 'trace');
    expect(tracerouteLines(blind, TRACEROUTE_PICKS)?.lines.every((line) => line.address === STAR)).toBe(true);
    expect(routersDrawn(blind)).toEqual([]);
    expect(blind.sent.find((run) => run.messageId === 'ping')?.hiddenStop).toBe(true);
  });

  it('does not make any router wait in an incident that does not set the flag', () => {
    const open = startSession([NOT_WAITING], NOT_WAITING.id);
    expect(routersDrawn(open).sort()).toEqual([officeRouter.id, provider.id, backbone.id].sort());
    expect(send(open, 'server').sent[0].hiddenStop).toBe(false);
    expect(fieldOf(send(open, 'server'), PATH_LABEL)).toBeDefined();
  });
});

describe('the stop of a ping that a router dropped without a warning', () => {
  const start = startSession([WAITING], WAITING.id);
  const lost = send(start, 'server');

  it('is hidden: the sender cannot know where it died', () => {
    expect(lost.sent[0]).toMatchObject({ hiddenStop: true, blocked: false, reached: false, replied: false, trace: { outcome: 'timeout' } });
    expect(lost.sent[0].trace.steps.at(-1)).toMatchObject({ stage: 'forward', at: provider.id, verdict: 'drop' });
  });

  it('stays hidden once a traceroute has drawn that router, in the run the player sent before and in the one it sends after: a ping alone never reveals where it died', () => {
    const ping = (session: Session) => session.sent.find((run) => run.messageId === 'ping');
    expect(routersDrawn(send(lost, 'server', 'trace'))).toEqual(ROUTERS_THAT_ANSWER);
    expect(ping(send(lost, 'server', 'trace'))?.hiddenStop).toBe(true);
    expect(ping(send(send(start, 'server', 'trace'), 'server'))?.hiddenStop).toBe(true);
  });

  it('is not hidden for a packet a router warned about, which is seen coming back, nor for a traceroute, which names its routers itself', () => {
    expect(send(start, 'server', 'ping-2').sent[0]).toMatchObject({ hiddenStop: false, trace: { outcome: 'ttl-exceeded' } });
    expect(send(start, 'server', 'trace').sent[0].hiddenStop).toBe(false);
  });

  it('is not hidden when the incident does not set the flag, or when the packet reaches its destination', () => {
    expect(send(startSession([NOT_WAITING], NOT_WAITING.id), 'server').sent[0].hiddenStop).toBe(false);
    expect(send(start, 'printer').sent[0]).toMatchObject({ hiddenStop: false, replied: true });
  });

  it('leaves the box of the packet saying only that nothing came back: no hops and no place, before and after a traceroute', () => {
    const traced = send(lost, 'server', 'trace');
    for (const session of [lost, sessionReducer(traced, { type: 'sendPacket', fromId: 'you', toId: 'server', messageId: 'ping' })]) {
      expect(fieldOf(session, PATH_LABEL)).toBeUndefined();
      expect(fieldOf(session, STOPPED_LABEL)).toBeUndefined();
      expect(fieldOf(session, 'Resultado')).toEqual(['timeout: pasó el tiempo de espera y no volvió nada.']);
    }
  });

  it('keeps the box of a packet that a router warned about as it was, and gives the box of the traceroute its hops and no place where it stopped', () => {
    expect(fieldOf(send(start, 'server', 'ping-2'), PATH_LABEL, 'ping-2')).toBeDefined();
    expect(fieldOf(send(start, 'server', 'ping-2'), STOPPED_LABEL, 'ping-2')).toBeDefined();
    expect(fieldOf(send(start, 'server', 'trace'), PATH_LABEL, 'trace')).toBeDefined();
    expect(fieldOf(send(start, 'server', 'trace'), STOPPED_LABEL, 'trace')).toBeUndefined();
  });
});
