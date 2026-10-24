import { describe, expect, it } from 'vitest';
import { INCIDENTS, type SendIncident } from '@/levels';
import { MESSAGE, ORDER_BODY, ORDER_URL, ORIGIN, TASK, bodyTask } from '@/levels/03-the-web-inside/shared';
import { sessionReducer, startSession, type Session, type SessionAction } from '@/game/session';
import { failingTaskIds } from '@/game/tasks';

interface Reached {
  session: Session;
  path: string[];
}

const BUILT_INCIDENTS = ['03-01', '03-02', '03-03', '03-04', '03-05', '03-06'];
const DEPTH = 3;
const MOVE_SEPARATOR = ' / ';

const openTasks = ({ incident, runs, history, answers }: Session): string[] => failingTaskIds(incident.mechanic === 'send' ? incident.tasks : [], runs, history, answers);

/** Returns every combination of one chip of each tray, as the picks of a placement. */
const picksOf = (trays: [string, { id: string }[]][]): Record<string, string>[] =>
  trays.reduce<Record<string, string>[]>((all, [tray, chips]) => all.flatMap((picks) => chips.map(({ id }) => ({ ...picks, [tray]: id }))), [{}]);

/** Returns every move a player can make in a send incident from the chips it offers: each message from each origin to each address, each rule of its rules card and each placement in its tables. */
function offeredMoves({ send }: SendIncident): SessionAction[] {
  const sends = send.from.flatMap((origin) => send.to.flatMap((address) => send.message.map((message): SessionAction => ({ type: 'sendPacket', fromId: origin.id, toId: address.id, messageId: message.id }))));
  const rules = send.rules ? send.rules.what.flatMap(({ id: whatId }) => send.rules!.from.map(({ id: fromId }): SessionAction => ({ type: 'placeRule', firewallId: send.rules!.firewallId, whatId, fromId }))) : [];
  const entries = (send.tables ?? []).flatMap((table) => picksOf(Object.entries<{ id: string }[]>(table.trays)).map((picks): SessionAction => ({ type: 'placeEntry', tableId: table.id, picks })));
  return [...sends, ...rules, ...entries];
}

const describeMove = (move: SessionAction): string => (move.type === 'sendPacket' ? `${move.fromId} ${move.messageId} ${move.toId}` : JSON.stringify(move));

/** Returns the start and every session the player can reach by up to `depth` moves, each with the moves that led to it; a move the session refuses leads nowhere. */
function reachedWithin(start: Session, moves: SessionAction[], depth: number): Reached[] {
  const levels: Reached[][] = [[{ session: start, path: [] }]];
  for (let level = 0; level < depth; level++) {
    levels.push(levels[level].flatMap(({ session, path }) => moves.flatMap((move) => {
      const next = sessionReducer(session, move);
      return next === session ? [] : [{ session: next, path: [...path, describeMove(move)] }];
    })));
  }
  return levels.flat();
}

/** Returns the moves a player can make in the incident, how many sessions up to `depth` of them reach, and the dead ends among them: the sessions from which playing the solution leaves a task open, written as the moves that led there and the tasks left open. Only the first move into a dead end is listed. */
function explore(start: Session, depth: number): { moves: SessionAction[]; states: number; deadEnds: string[] } {
  const { incident } = start;
  if (incident.mechanic !== 'send') return { moves: [], states: 0, deadEnds: [] };
  const moves = offeredMoves(incident);
  const reached = reachedWithin(start, moves, depth);
  const stuck = reached
    .map((state) => ({ ...state, open: openTasks(incident.solution.reduce<Session>(sessionReducer, state.session)) }))
    .filter(({ open }) => open.length > 0);
  const stuckPaths = new Set(stuck.map(({ path }) => path.join(MOVE_SEPARATOR)));
  const first = stuck.filter(({ path }) => path.length === 0 || !stuckPaths.has(path.slice(0, -1).join(MOVE_SEPARATOR)));
  return { moves, states: reached.length, deadEnds: first.map(({ path, open }) => `${path.join(MOVE_SEPARATOR) || 'start'} -> ${open.join(', ')}`) };
}

describe('the built incidents of chapter 3 have no dead end', () => {
  it.each(BUILT_INCIDENTS)(`%s: from the start and from every state up to ${DEPTH} moves away, playing the solution closes every task`, (id) => {
    const { moves, states, deadEnds } = explore(startSession(INCIDENTS, id), DEPTH);
    expect(states).toBeGreaterThan(moves.length);
    expect(deadEnds).toEqual([]);
  });

  it('the search finds the dead end of a GET task that expects the body of an order a PUT can change', () => {
    const bodyOfTheOrder = INCIDENTS.map((incident) => (incident.id === '03-02' && incident.mechanic === 'send' ? { ...incident, tasks: [bodyTask(TASK.getEight, 'x', ORDER_URL.eight.id, ORDER_BODY.eight), ...incident.tasks.slice(1)] } : incident));
    const putOfTheOrder = `${ORIGIN.lucia.id} ${MESSAGE.curlPut.id} ${ORDER_URL.eight.id} -> ${TASK.getEight}`;
    expect(explore(startSession(bodyOfTheOrder, '03-02'), 1).deadEnds).toEqual([putOfTheOrder]);
  });

  it('03-02: a post to the address of an order creates an order, and the posts task holds after two posts to the orders whatever that shifted', () => {
    const posting = (session: Session, toId: string) => sessionReducer(session, { type: 'sendPacket', fromId: ORIGIN.lucia.id, toId, messageId: MESSAGE.curlPost.id });
    const bodyOfLast = (session: Session) => session.history.at(-1)?.trace.app?.response?.body;
    const first = posting(startSession(INCIDENTS, '03-02'), ORDER_URL.seven.id);
    expect(bodyOfLast(first)).toBe(ORDER_BODY.nine);
    const strays = posting(first, ORDER_URL.eight.id);
    expect(bodyOfLast(strays)).toBe(ORDER_BODY.ten);
    const once = posting(strays, ORDER_URL.all.id);
    expect(openTasks(once)).toContain(TASK.posts);
    expect(openTasks(posting(once, ORDER_URL.all.id))).not.toContain(TASK.posts);
  });
});
