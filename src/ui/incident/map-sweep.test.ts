import { describe, expect, it } from 'vitest';
import { isProblemStamp, stampOf } from '@/copy';
import { classifiedBlock, isIntruding, pieceViews, sessionReducer, startSession, type Session } from '@/game';
import { runFlows } from '@/game/flow-runs';
import { INCIDENTS, caseWorld, sendCombinations, solvedWorld, type Incident, type SendOwner } from '@/levels';
import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import { LABEL_GAP, fanBox, overlaps } from '@/scene/map2d/layout/arrange/geometry';
import { blockTabBoxes, captionBoxes } from '@/scene/map2d/layout/captions';
import { route } from '@/scene/map2d/layout/graph';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { LABEL_HEIGHT, labelWidth } from '@/scene/map2d/layout/metrics';
import { station, stationsFor } from '@/scene/map2d/layout/stations';
import { crowds, holds } from '@/scene/map2d/marks/boxes';
import { collisions } from '@/scene/map2d/marks/collisions';
import { placeTags, type PacketTag, type PlacedTag } from '@/scene/map2d/marks/packet-tags';
import { readingOrder } from '@/scene/map2d/marks/reading-order';
import { fanStamps, type Fan, type StampSource } from '@/scene/map2d/marks/stamp-fan';

const WIDTHS = [360, 390, 768, 900, 1060, 1280, 1440];
const HUNDRED = 100;
const DOORSTEP = 'doorstep:';

type Run = Session['runs'][number] | Session['sent'][number];

interface State {
  incident: string;
  name: string;
  session: Session;
}

function ownersOf(incident: Incident, session: Session): { owner: SendOwner; session: Session }[] {
  if (incident.mechanic === 'send') return [{ owner: incident, session }];
  if (incident.mechanic !== 'diagnose') return [];
  return incident.diagnose.cases.map((spec, caseIndex) => {
    const world = caseWorld(session.start, spec);
    return { owner: spec, session: { ...session, caseIndex, world, runs: runFlows(world, incident.flows, session.known) } };
  });
}

function solvedSession(incident: Incident, session: Session): Session {
  const world = solvedWorld(INCIDENTS, incident.id);
  return { ...session, world, runs: runFlows(world, incident.flows, session.known), sent: [], history: [] };
}

function sendAll(owner: SendOwner, session: Session): Session {
  return sendCombinations(owner).reduce((sent, combination) => sessionReducer(sent, { type: 'sendPacket', ...combination }), session);
}

function wrongRuleStates(incident: Incident, start: Session): State[] {
  if (incident.mechanic !== 'filter') return [];
  const firewallIds = [...new Set(incident.solution.map(({ firewallId }) => firewallId))];
  const inbound = incident.chips.from.map(({ id }) => ({ fromId: id }));
  const outbound = (incident.chips.to ?? []).map(({ id }) => ({ toId: id, direction: 'outbound' as const }));
  return firewallIds.flatMap((firewallId) =>
    incident.chips.what.flatMap(({ id: whatId }) =>
      [...inbound, ...outbound].flatMap((peer) => {
        const session = sessionReducer(start, { type: 'placeRule', firewallId, whatId, ...peer });
        const from = 'fromId' in peer ? `from ${peer.fromId}` : `to ${peer.toId}`;
        return isIntruding(session) ? [{ incident: incident.id, name: `a rule on ${firewallId} lets the intruder in: ${whatId} ${from}`, session }] : [];
      }),
    ),
  );
}

function statesOf(incident: Incident): State[] {
  const start = startSession(INCIDENTS, incident.id);
  const solved = incident.mechanic === 'diagnose' ? [] : [{ incident: incident.id, name: 'solved', session: solvedSession(incident, start) }];
  const sending = ownersOf(incident, start).flatMap(({ owner, session }, index) => {
    const label = incident.mechanic === 'diagnose' ? `case ${index + 1}` : 'start';
    const single = sendCombinations(owner).map(({ fromId, toId, messageId }) => ({ incident: incident.id, name: `${label}, only ${fromId} to ${toId} with ${messageId}`, session: sessionReducer(session, { type: 'sendPacket', fromId, toId, messageId }) }));
    const everything = [{ incident: incident.id, name: `${label}, every combination`, session: sendAll(owner, session) }];
    const afterTheFix = incident.mechanic === 'send' ? [{ incident: incident.id, name: 'solved, every combination', session: sendAll(owner, solvedSession(incident, start)) }] : [];
    return [...single, ...everything, ...afterTheFix];
  });
  return [{ incident: incident.id, name: 'start', session: start }, ...solved, ...wrongRuleStates(incident, start), ...sending];
}

interface Analysis {
  state: State;
  width: number;
  layout: ReturnType<typeof layoutMap>;
  runs: Run[];
  stations: string[][];
  fans: Fan[];
  stamped: Record<string, StampSource[]>;
  tags: PacketTag[];
  placed: PlacedTag[];
}

function stampOfRun(run: Run): StampSource {
  return { id: run.id, problem: isProblemStamp(stampOf(run)), ...('send' in run ? { send: run.send } : {}) };
}

function tagOf(run: Run, stations: readonly string[], graph: ReturnType<typeof graphOf>): PacketTag[] {
  if (run.ports === undefined) return [];
  const texts = run.ports.legs.flatMap(({ request, reply }) => [request, reply]);
  const stays = stations.at(-1)?.startsWith(DOORSTEP) === true;
  return [{ id: run.id, stamp: run.id, path: route(graph, stations), size: { width: Math.max(...texts.map((text) => labelWidth(text))), height: LABEL_HEIGHT }, ...(stays ? { staysInDevice: true } : {}) }];
}

function analyze(state: State, width: number): Analysis {
  const { session } = state;
  const layout = layoutMap(session.world, pieceViews(session), { width });
  const runs: Run[] = [...session.runs, ...session.sent];
  const stations = runs.map((run) => stationsFor(run.trace, run.packet, layout.drawn, { hiddenStop: run.hiddenStop }));
  const stamped: Record<string, StampSource[]> = {};
  runs.forEach((run, index) => {
    const place = stations[index].at(-1);
    if (place !== undefined) stamped[place] = [...(stamped[place] ?? []), stampOfRun(run)];
  });
  const fans = fanStamps(stamped, layout.marks);
  const graph = graphOf(layout);
  const tags = runs.flatMap((run, index) => tagOf(run, stations[index], graph));
  const stamps = fans.flatMap(({ stamps: drawn, more }) => [...drawn.map(({ box }) => box), ...(more ? [more.box] : [])]);
  const obstacles = [...Object.values(layout.labels), ...Object.values(layout.icons), ...Object.values(captionBoxes(layout.groups)), ...stamps];
  return { state, width, layout, runs, stations, stamped, fans, tags, placed: placeTags(tags, obstacles, fans) };
}

let swept: { states: State[]; analyses: Analysis[]; seconds: number } | undefined;

function sweep() {
  if (swept) return swept;
  const started = performance.now();
  const states = INCIDENTS.flatMap(statesOf);
  const analyses = states.flatMap((state) => WIDTHS.map((width) => analyze(state, width)));
  swept = { states, analyses, seconds: (performance.now() - started) / 1000 };
  return swept;
}

const where = ({ state, width }: Analysis) => `${state.incident}, ${state.name}, at ${width} px`;

describe('the sweep of the registered incidents', () => {
  it('visits every registered incident, the start and the solved world of each, and every combination its chips offer, at seven widths', () => {
    const { states, analyses } = sweep();
    expect(new Set(states.map(({ incident }) => incident))).toEqual(new Set(INCIDENTS.map(({ id }) => id)));
    expect(analyses).toHaveLength(states.length * WIDTHS.length);
    for (const incident of INCIDENTS) {
      const names = states.filter((state) => state.incident === incident.id).map(({ name }) => name);
      expect(names, incident.id).toContain('start');
      if (incident.mechanic !== 'diagnose') expect(names, incident.id).toContain('solved');
      const owners = incident.mechanic === 'send' ? [incident] : incident.mechanic === 'diagnose' ? incident.diagnose.cases : [];
      const combinations = owners.reduce((total, owner) => total + sendCombinations(owner).length, 0);
      expect(names.filter((name) => name.includes(', only ')), incident.id).toHaveLength(combinations);
    }
    expect(states.length).toBeGreaterThan(150);
    expect(states.some(({ session }) => pieceViews(session).some(({ state }) => state === 'intruded'))).toBe(true);
    expect(analyses.some(({ fans }) => fans.some(({ more }) => more !== undefined))).toBe(true);
  });

  it('every station that stationsFor names is a station of the layout, in every state of every registered incident', () => {
    for (const analysis of sweep().analyses) {
      const missing = analysis.stations.flat().filter((name) => !(name in analysis.layout.stations));
      expect(missing, where(analysis)).toEqual([]);
    }
  });

  it('no stamp is lost between a run and its fan: each place draws or counts every stamp that ends there, for the flows and for the sends', () => {
    const { analyses } = sweep();
    expect(analyses.some(({ runs }) => runs.some((run) => !('send' in run)))).toBe(true);
    expect(analyses.some(({ runs }) => runs.some((run) => 'send' in run))).toBe(true);
    for (const analysis of analyses) {
      const { fans, stamped } = analysis;
      expect(fans.map(({ station }) => station).sort(), where(analysis)).toEqual(Object.keys(stamped).sort());
      for (const fan of fans) expect(fan.stamps.length + fan.hidden.length, `${fan.station}, ${where(analysis)}`).toBe(stamped[fan.station].length);
    }
  });

  it('in no registered incident does any label, stamp, packet label, name of a box or piece overlap another, at 360, 390, 768, 900, 1060, 1280 and 1440 px', () => {
    for (const analysis of sweep().analyses) {
      const { layout, fans, placed } = analysis;
      expect(placed.filter(({ clear }) => !clear).map(({ id }) => id), where(analysis)).toEqual([]);
      const clashes = collisions({ ...layout, captions: captionBoxes(layout.groups) }, fans, placed);
      expect(
        clashes.map(({ first, second }) => `${first.kind} ${first.id} with ${second.kind} ${second.id}`),
        where(analysis),
      ).toEqual([]);
    }
  });

  it('every label of a packet is placed, or left out because its stamp went into a «+N» or because its packet never leaves its device and finds no place', () => {
    const left = { hidden: 0, staying: 0, placedStaying: 0, placed: 0 };
    for (const analysis of sweep().analyses) {
      const hidden = new Set(analysis.fans.flatMap((fan) => fan.hidden));
      const placedIds = new Set(analysis.placed.map(({ id }) => id));
      for (const tag of analysis.tags) {
        const seen = `${tag.id}, ${where(analysis)}`;
        if (tag.stamp !== undefined && hidden.has(tag.stamp)) {
          expect(placedIds.has(tag.id), seen).toBe(false);
          left.hidden++;
        } else if (placedIds.has(tag.id)) {
          left.placed++;
          if (tag.staysInDevice) left.placedStaying++;
        } else {
          const stations = analysis.stations[analysis.runs.findIndex(({ id }) => id === tag.id)];
          const device = stations[0].replace(/^door:/, '');
          expect(tag.staysInDevice, seen).toBe(true);
          expect(stations, seen).toEqual([station.door(device), station.doorstep(device)]);
          left.staying++;
        }
      }
      expect(analysis.placed, where(analysis)).toHaveLength(analysis.tags.filter((tag) => placedIds.has(tag.id)).length);
    }
    expect(left.hidden).toBeGreaterThan(0);
    expect(left.staying).toBeGreaterThan(0);
    expect(left.placedStaying).toBeGreaterThan(0);
    expect(left.placed).toBeGreaterThan(left.staying);
  });

  it('in no registered incident does sending every combination its chips offer hide a stamp with a problem in «+N» without showing it', () => {
    let hiding = 0;
    for (const analysis of sweep().analyses.filter(({ state }) => state.name.endsWith('every combination'))) {
      const problems = new Set(analysis.runs.filter((run) => isProblemStamp(stampOf(run))).map(({ id }) => id));
      for (const fan of analysis.fans) {
        const hidden = fan.hidden.filter((id) => problems.has(id));
        expect(fan.more?.hidesProblem === true, `${fan.station}: ${hidden.join(', ')}, ${where(analysis)}`).toBe(hidden.length > 0);
        if (hidden.length > 0) hiding++;
      }
    }
    expect(hiding).toBeGreaterThan(0);
  });

  it('the name of every group lies inside its group, in every state of every registered incident', () => {
    for (const { layout, state, width } of sweep().analyses) {
      const captions = captionBoxes(layout.groups);
      for (const group of layout.groups.filter(({ name }) => name.length > 0)) expect(holds(group.box, captions[group.id]), `${group.id} in ${state.incident}, ${state.name}, at ${width} px`).toBe(true);
    }
  });

  it('with the room for its tab, the outline of a block has its tab inside its floor and clear of every label, icon, name and mark, and placing a device inside moves nothing else, at seven widths', () => {
    const owners = INCIDENTS.map(({ id }) => startSession(INCIDENTS, id)).filter((session) => classifiedBlock(session) !== null);
    expect(owners.length).toBeGreaterThan(0);
    const placements = (session: Session): Session[] => {
      const ids = pieceViews(session).filter(({ kind }) => kind === 'device').map(({ anchorId }) => anchorId);
      return Array.from({ length: 2 ** ids.length }, (_, mask) => ids.filter((_id, bit) => (mask >> bit) % 2 === 1).reduce((placed, deviceId) => sessionReducer(placed, { type: 'answerCard', deviceId, picks: { bin: 'inside' } }), session));
    };
    let outlines = 0;
    for (const session of owners.flatMap(placements)) {
      for (const width of WIDTHS) {
        const layout = layoutMap(session.world, pieceViews(session), { width, blockTab: true });
        const unmarked = layoutMap(session.world, pieceViews(session).map((piece) => ({ ...piece, insideBlock: undefined })), { width, blockTab: true });
        const withoutOutlines = (each: typeof layout) => ({ ...each, groups: each.groups.filter(({ kind }) => kind !== 'block') });
        expect(withoutOutlines(layout), `${session.incident.id}, at ${width} px`).toEqual(withoutOutlines(unmarked));
        const tabs = blockTabBoxes(layout.groups, classifiedBlock(session) as string);
        const seen = `${session.incident.id}, ${Object.keys(tabs).length} outlines, at ${width} px`;
        const solids = [...Object.values(layout.labels), ...Object.values(layout.icons), ...Object.values(captionBoxes(layout.groups)), ...layout.marks.map(({ point, axis, casillas }) => fanBox(point, axis, casillas))];
        const floors = layout.groups.filter(({ kind }) => kind === 'floor' || kind === 'subnet');
        for (const tab of Object.values(tabs)) {
          outlines++;
          expect(solids.filter((solid) => overlaps(tab, solid)), seen).toEqual([]);
          expect(floors.some(({ box }) => holds(box, tab)), seen).toBe(true);
        }
        expect(collisions({ ...layout, captions: { ...captionBoxes(layout.groups), ...tabs } }, [], []), seen).toEqual([]);
      }
    }
    expect(outlines).toBeGreaterThan(owners.length * WIDTHS.length);
  });

  it('in every state of every registered incident no label stands in the mat of a device, whichever device is selected, at seven widths', () => {
    let mats = 0;
    for (const { layout, state, width } of sweep().analyses) {
      for (const [id, icon] of Object.entries(layout.icons).filter(([key]) => key.startsWith('device:'))) {
        const mat = { x: icon.x - LABEL_GAP, y: icon.y - LABEL_GAP, width: icon.width + 2 * LABEL_GAP, height: icon.height + 2 * LABEL_GAP };
        mats++;
        for (const [labelId, label] of Object.entries(layout.labels)) expect(crowds(mat, label), `${labelId} in the mat of ${id}, ${state.incident}, ${state.name}, at ${width} px`).toBe(false);
      }
    }
    expect(mats).toBeGreaterThan(1000);
  });

  it('in no registered incident does a place hide a hundred stamps or more', () => {
    const hidden = sweep().analyses.flatMap(({ fans }) => fans.map(({ hidden: ids }) => ids.length));
    expect(Math.max(...hidden)).toBeGreaterThan(0);
    expect(Math.max(...hidden)).toBeLessThan(HUNDRED);
    for (const { fans } of sweep().analyses) for (const { more } of fans) expect(more?.count ?? 0).toBeLessThan(HUNDRED);
  });

  it('the reading order of the map is top to bottom and left to right, by piece, with its stamps beside it', () => {
    for (const analysis of sweep().analyses) {
      const { layout, fans } = analysis;
      const order = readingOrder(layout, fans);
      const pieces = order.filter(({ kind }) => kind === 'piece').map(({ id }) => id);
      const centers = pieces.map((id) => [layout.icons[id].x + layout.icons[id].width / 2, layout.icons[id].y + layout.icons[id].height / 2]);
      expect([...pieces].sort(), where(analysis)).toEqual(Object.keys(layout.labels).sort());
      centers.slice(1).forEach(([x, y], index) => expect(y > centers[index][1] || (y === centers[index][1] && x >= centers[index][0]), `${pieces[index + 1]} after ${pieces[index]}, ${where(analysis)}`).toBe(true));
      expect(order.length === 0 || order[0].kind === 'piece', where(analysis)).toBe(true);
      for (const fan of fans) {
        const mine = [...fan.stamps.map(({ id }) => `stamp:${id}`), ...(fan.more ? [`more:${fan.station}`] : [])];
        const at = order.map(({ kind, id }) => `${kind}:${id}`);
        const first = at.indexOf(mine[0]);
        expect(at.slice(first, first + mine.length), `${fan.station}, ${where(analysis)}`).toEqual(mine);
        expect(order[first - 1]?.kind === 'piece' || order[first - 1]?.kind === 'stamp' || order[first - 1]?.kind === 'more', where(analysis)).toBe(true);
      }
      for (const fan of fans.filter(({ station }) => /^(door:|router:)/.test(station) || station === 'internet')) {
        const at = order.map(({ kind, id }) => `${kind}:${id}`);
        const first = at.indexOf(fan.stamps[0] ? `stamp:${fan.stamps[0].id}` : `more:${fan.station}`);
        const before = order.slice(0, first).filter(({ kind }) => kind === 'piece').at(-1);
        expect(before?.id.split(':').at(-1), `${fan.station}, ${where(analysis)}`).toBe(fan.station.split(':').at(-1));
      }
      expect(order, where(analysis)).toHaveLength(pieces.length + fans.reduce((total, { stamps, more }) => total + stamps.length + (more ? 1 : 0), 0));
    }
  });
});
