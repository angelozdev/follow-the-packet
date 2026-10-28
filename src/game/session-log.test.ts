import { describe, expect, it } from 'vitest';
import { INCIDENTS } from '@/levels';
import { NAME_SERVER_PIECES, OFFICE_FLOORS, namesSendIncident, repairableDiagnoseIncident } from '@/testing';
import { caseClosed, sessionReducer, startSession, type Session, type SessionAction } from './session';

const NAMES = namesSendIncident();
const { zone } = NAME_SERVER_PIECES;
const { provider, officeRouter, server } = OFFICE_FLOORS;
const send = (toId: string, messageId: string): SessionAction => ({ type: 'sendPacket', fromId: 'you', toId, messageId });
const DIG = send('www', 'dig');
const PING = send('lucia', 'ping');
const placeRoute: SessionAction = { type: 'placeEntry', tableId: 'routes', picks: { destination: 'default', nextHop: officeRouter.id } };
const refuseRecord: SessionAction = { type: 'placeEntry', tableId: 'records', picks: { name: `www.${zone}`, type: 'CNAME', value: server.ip } };
const noResolver: SessionAction = { type: 'setSetting', deviceId: 'your-laptop', settingId: 'resolver', chipId: 'none' };
const playing = (...actions: SessionAction[]): Session => actions.reduce(sessionReducer, startSession([NAMES], NAMES.id));
const ROUTES_CHANGED = { kind: 'routes', ownerId: provider.id } as const;
const RESOLVER_CHANGED = { kind: 'dns-server', ownerId: 'your-laptop' } as const;
const CNAME_REFUSED = { tableId: 'records', code: 'cname-with-other-records' } as const;

describe('the log of a session: what changed the world and what the engine refused', () => {
  it('starts empty', () => {
    expect(playing().log).toEqual([]);
    expect(startSession(INCIDENTS, '04-01').log).toEqual([]);
  });

  it('a change that empties sends that were not empty is kept with the sends made until then', () => {
    expect(playing(DIG, PING, placeRoute).log).toEqual([{ kind: 'change', restart: ROUTES_CHANGED, sends: 2 }]);
  });

  it('a change with no sends before is no line, and the one already kept stays', () => {
    expect(playing(placeRoute).log).toEqual([]);
    expect(playing(DIG, placeRoute, noResolver).log).toEqual([{ kind: 'change', restart: ROUTES_CHANGED, sends: 1 }]);
  });

  it('the next send leaves the change in the log, though the notice of the card is gone', () => {
    const changed = playing(DIG, placeRoute);
    const sent = sessionReducer(changed, PING);
    expect(sent.restart).toBeNull();
    expect(sent.log).toBe(changed.log);
  });

  it('a change that empties sends again starts the log again with itself', () => {
    expect(playing(DIG, placeRoute, PING, noResolver).log).toEqual([{ kind: 'change', restart: RESOLVER_CHANGED, sends: 2 }]);
  });

  it('a refused entry is kept with the sends made until then, and once while no send comes between', () => {
    const refused = playing(DIG, refuseRecord);
    expect(refused.log).toEqual([{ kind: 'rejection', problem: CNAME_REFUSED, sends: 1 }]);
    expect(sessionReducer(refused, refuseRecord)).toBe(refused);
    expect(sessionReducer(sessionReducer(refused, PING), refuseRecord).log).toEqual([...refused.log, { kind: 'rejection', problem: CNAME_REFUSED, sends: 2 }]);
  });

  it('an entry the incident does not offer leaves no line', () => {
    expect(playing(DIG, { type: 'placeEntry', tableId: 'ghost', picks: {} }).log).toEqual([]);
    expect(playing(DIG, { type: 'placeEntry', tableId: 'routes', picks: { destination: 'default' } }).log).toEqual([]);
  });

  it('a change takes the refusals before it away, and a refusal after it stays behind it', () => {
    const changed = playing(DIG, refuseRecord, placeRoute);
    expect(changed.log).toEqual([{ kind: 'change', restart: ROUTES_CHANGED, sends: 1 }]);
    expect(sessionReducer(changed, refuseRecord).log).toEqual([...changed.log, { kind: 'rejection', problem: CNAME_REFUSED, sends: 1 }]);
    expect(playing(refuseRecord, placeRoute).log).toEqual([]);
  });

  it('a send, a wait and a hint add nothing to the log', () => {
    const refused = playing(DIG, refuseRecord);
    for (const action of [PING, { type: 'wait', seconds: 60 }, { type: 'showHint' }] as const) expect(sessionReducer(refused, action).log, action.type).toBe(refused.log);
  });
});

describe('the log of a case with a fix', () => {
  const REPAIRABLE = repairableDiagnoseIncident();
  const { cases } = REPAIRABLE.diagnose;
  const fixed = cases.findIndex(({ fix }) => fix);
  const solution = cases[fixed].fix!.solution;
  const nameRight = (index: number): SessionAction => ({ type: 'nameCause', index: cases[index].cause.options.findIndex((option) => option.correct) });
  const closing = cases.slice(0, fixed).flatMap((spec, at): SessionAction[] => [...(spec.fix?.solution ?? []), nameRight(at), { type: 'nextCase' }]);
  const test: SessionAction = { type: 'sendPacket', fromId: 'origin', toId: 'server', messageId: 'ping' };
  const atTheFix = (...actions: SessionAction[]): Session => [...closing, ...actions].reduce(sessionReducer, startSession([REPAIRABLE], REPAIRABLE.id));

  it('each case of a diagnose starts its log again', () => {
    const closed = atTheFix(test, ...solution, nameRight(fixed));
    expect(caseClosed(closed)).toBe(true);
    expect(closed.log).toEqual([{ kind: 'change', restart: ROUTES_CHANGED, sends: 1 }]);
    expect(sessionReducer(closed, { type: 'nextCase' }).log).toEqual([]);
  });
});
