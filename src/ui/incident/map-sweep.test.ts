import { describe, expect, it } from 'vitest';
import { INSPECTION_TEXT, isProblemStamp, stampOf, toPlainText } from '@/copy';
import { PIECE_ID, classifiedBlock, inspect, isIntruding, pieceViews, sessionReducer, startSession, type Session } from '@/game';
import { runFlows } from '@/game/flow-runs';
import { INCIDENTS, caseWorld, sendCombinations, solvedWorld, type Incident, type SendOwner } from '@/levels';
import { LABEL_GAP, STAMP, fanBox, overlaps } from '@/scene/map2d/layout/arrange/geometry';
import { blockTabBoxes, captionBoxes } from '@/scene/map2d/layout/captions';
import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { LABEL_HEIGHT, labelWidth } from '@/scene/map2d/layout/metrics';
import { startsOnMap, station, stationsFor } from '@/scene/map2d/layout/stations';
import { crowds, grown, holds } from '@/scene/map2d/marks/boxes';
import { collisions } from '@/scene/map2d/marks/collisions';
import { changeDistance, legTextAt, type PlacedTag } from '@/scene/map2d/marks/packet-tags';
import { readingOrder } from '@/scene/map2d/marks/reading-order';
import { fanStamps, stampsByPlace, type Fan, type StampsByPlace } from '@/scene/map2d/marks/stamp-fan';
import { stillPackets, translationAt, wayOf, type StillPacket } from '@/scene/map2d/marks/still-packets';
import { flightPlan, flowCycles, keyframes, labelRide, motionOf, routeOf, sendCycle } from '@/scene/map2d/traffic/flight-plan';

const WIDTHS = [360, 390, 768, 900, 1060, 1280, 1440];
const HUNDRED = 100;
const SAME_POINT = 1e-6;
const STAMP_FACE = 32;
const STAMP_TILT = (8 * Math.PI) / 180;
const TILT_OVERHANG = (STAMP_FACE * (Math.cos(STAMP_TILT) + Math.sin(STAMP_TILT)) - STAMP) / 2;

const isShare = (value: number) => Number.isFinite(value) && value >= 0 && value <= 1;
const isOrdered = (values: readonly number[]) => values.every((value, index) => isShare(value) && (index === 0 || value >= values[index - 1]));
const isCycle = (times: readonly number[]) => times[0] === 0 && times[times.length - 1] === 1 && isOrdered(times);

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
  stamped: StampsByPlace;
  packets: StillPacket[];
  tags: { id: string; stamp: string; staysInDevice: boolean }[];
  placed: PlacedTag[];
}

function analyze(state: State, width: number): Analysis {
  const { session } = state;
  const layout = layoutMap(session.world, pieceViews(session), { width, blockTab: classifiedBlock(session) !== null });
  const runs: Run[] = [...session.runs, ...session.sent];
  const stations = runs.map((run) => stationsFor(run.trace, run.packet, layout.drawn, { hiddenStop: run.hiddenStop }));
  const stamped = stampsByPlace(runs, layout.drawn);
  const fans = fanStamps(stamped, layout.marks);
  const packets = stillPackets(runs, layout, fans);
  const labelled = packets.flatMap(({ id, label }) => (label ? [{ id, label }] : []));
  const tags = labelled.map(({ id, label }) => ({ id, stamp: id, staysInDevice: label.staysInDevice }));
  const placed = labelled.flatMap(({ label }) => (label.place ? [label.place] : []));
  return { state, width, layout, runs, stations, stamped, fans, packets, tags, placed };
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

  it('in every state of every registered incident no label of a packet touches the box a stamp draws once it is tilted, at seven widths', () => {
    let compared = 0;
    for (const analysis of sweep().analyses) {
      const stamps = analysis.fans.flatMap(({ stamps: drawn, more }) => [...drawn.map(({ box }) => box), ...(more ? [more.box] : [])]);
      for (const { id, box } of analysis.placed) {
        expect(stamps.filter((stamp) => crowds(box, grown(stamp, TILT_OVERHANG))).length, `${id}, ${where(analysis)}`).toBe(0);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(0);
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

  it('in every state of every registered incident each packet that starts on the map is drawn with its shape halfway, and no label of a packet stands over a shape, at seven widths', () => {
    const seen = { going: 0, answer: 0, appears: 0, labels: 0 };
    for (const analysis of sweep().analyses) {
      const { runs, packets, layout } = analysis;
      expect(packets.map(({ id }) => id), where(analysis)).toEqual(runs.filter((run) => startsOnMap(run.packet, layout.drawn)).map(({ id }) => id));
      const shapes = packets.flatMap(({ glyphs }) => glyphs.map(({ box }) => box));
      for (const packet of packets) {
        const roles = packet.glyphs.map(({ role }) => role);
        expect(roles.includes('going') !== (packet.end === 'self-warned'), `${packet.id}, ${where(analysis)}`).toBe(true);
        for (const role of roles) seen[role]++;
        const box = packet.label?.place?.box;
        if (box === undefined) continue;
        seen.labels++;
        expect(shapes.filter((shape) => crowds(box, shape)), `${packet.id}, ${where(analysis)}`).toEqual([]);
      }
    }
    expect(seen.going).toBeGreaterThan(0);
    expect(seen.answer).toBeGreaterThan(0);
    expect(seen.appears).toBeGreaterThan(0);
    expect(seen.labels).toBeGreaterThan(0);
  });

  it('in every state of every registered incident every label of a packet lies inside the drawing, at seven widths', () => {
    let inside = 0;
    for (const analysis of sweep().analyses) {
      const { width, height } = analysis.layout.size;
      for (const { id, label } of analysis.packets) {
        const box = label?.place?.box;
        if (box === undefined) continue;
        inside++;
        expect([box.x >= 0, box.y >= 0, box.x + box.width <= width, box.y + box.height <= height], `${id}, ${where(analysis)}`).toEqual([true, true, true, true]);
      }
    }
    expect(inside).toBeGreaterThan(0);
  });

  it('in every state of every registered incident the flight of every packet has times a browser takes and its label rides inside the drawing, at seven widths', () => {
    const seen = { flights: 0, labelled: 0, copies: 0 };
    for (const analysis of sweep().analyses) {
      const { layout } = analysis;
      const graph = graphOf(layout);
      const sizeOfTheDrawing = { width: layout.size.width, height: layout.size.height };
      for (const run of analysis.runs.filter(({ packet }) => startsOnMap(packet, layout.drawn))) {
        const way = wayOf(run, layout, graph);
        const changesAt = translationAt(run, way.path, layout);
        const plan = flightPlan(way.path, way.look.end, 0, changesAt);
        const at = `${run.id}, ${where(analysis)}`;
        seen.flights++;
        for (const { period } of [...flowCycles(plan, 0), sendCycle(plan)]) {
          const motion = motionOf(plan, period);
          expect([isCycle(motion.keyTimes), isOrdered(motion.keyPoints), motion.keyPoints.length === motion.keyTimes.length], at).toEqual([true, true, true]);
          for (const span of Object.values(plan.glyphs)) expect(isCycle(keyframes(period, [[0, 0], [span.from, 1], [span.to, 0]]).keyTimes), at).toBe(true);
          const legs = run.ports?.legs;
          if (legs === undefined || plan.labels.length === 0) continue;
          const texts = plan.labels.map(({ distance, back }) => legTextAt(legs, changesAt, distance, back));
          const size = { width: Math.max(...texts.map((text) => labelWidth(text))), height: LABEL_HEIGHT };
          const ride = labelRide(routeOf(way.path, plan.end), size, sizeOfTheDrawing, period);
          expect([isCycle(ride.keyTimes), isOrdered(ride.keyPoints), ride.keyPoints.length === ride.keyTimes.length], at).toEqual([true, true, true]);
          for (const [x, y] of ride.centers) {
            expect([x - size.width / 2 >= 0, x + size.width / 2 <= layout.size.width, y - size.height / 2 >= 0, y + size.height / 2 <= layout.size.height], at).toEqual([true, true, true, true]);
          }
          seen.labelled++;
        }
        seen.copies += flowCycles(plan, 0).length;
      }
    }
    expect(seen.flights).toBeGreaterThan(0);
    expect(seen.labelled).toBeGreaterThan(0);
    expect(seen.copies).toBeGreaterThan(seen.flights);
  });

  it('in every state of every registered incident no two shapes of packets stand on one point, at seven widths', () => {
    let shapes = 0;
    for (const analysis of sweep().analyses) {
      const points = analysis.packets.flatMap(({ id, glyphs }) => glyphs.map(({ role, point }) => ({ at: `${id} ${role}`, point })));
      shapes += points.length;
      const together = points.flatMap((first, index) => points.slice(index + 1).filter((second) => Math.abs(first.point[0] - second.point[0]) <= SAME_POINT && Math.abs(first.point[1] - second.point[1]) <= SAME_POINT).map((second) => `${first.at} with ${second.at}`));
      expect(together, where(analysis)).toEqual([]);
    }
    expect(shapes).toBeGreaterThan(0);
  });

  it('in every state of every registered incident the router that translates the ports of a packet stands on its path', () => {
    let translated = 0;
    for (const analysis of sweep().analyses) {
      const { runs, packets, layout } = analysis;
      for (const packet of packets) {
        const ports = runs.find(({ id }) => id === packet.id)?.ports;
        if (ports === undefined || ports.legs.length < 2) continue;
        translated++;
        expect(ports.changesAt, `${packet.id}, ${where(analysis)}`).toBeDefined();
        expect(changeDistance(packet.path, layout.stations[station.router(ports.changesAt as string)]), `${packet.id}, ${where(analysis)}`).toBeDefined();
      }
    }
    expect(translated).toBeGreaterThan(0);
  });

  it('the text of every label the still map leaves out is in the box of its packet, and in the list of its «+N» when its stamp went into one, and a label of the second leg has its ports in the box', () => {
    const leftOut = { hidden: 0, staying: 0, secondLeg: 0 };
    for (const analysis of sweep().analyses) {
      const hidden = new Map(analysis.fans.flatMap((fan) => fan.hidden.map((id) => [id, fan.more?.ids ?? []] as const)));
      for (const { id, label } of analysis.packets) {
        if (label === undefined || label.place !== undefined) continue;
        const seen = `${id}, ${where(analysis)}`;
        const box = inspect(analysis.state.session, PIECE_ID.packet(id));
        const read = [box?.title ?? '', ...(box?.fields ?? []).flatMap((field) => [field.label, ...field.lines])].map(toPlainText).join('\n');
        expect(label.text.match(/\d+/g)?.every((figure) => read.includes(figure)), seen).toBe(true);
        const firstLeg = analysis.runs.find((run) => run.id === id)?.ports?.legs[0].request ?? '';
        const isFirstLeg = toPlainText(firstLeg) === label.text;
        if (!isFirstLeg) leftOut.secondLeg++;
        else expect(toPlainText(box?.title ?? '').startsWith(label.text), seen).toBe(true);
        const ids = hidden.get(id);
        if (ids === undefined) leftOut.staying++;
        else {
          leftOut.hidden++;
          const list = inspect(analysis.state.session, PIECE_ID.stamps(ids));
          if (isFirstLeg) expect(list?.fields.some((field) => toPlainText(field.label).startsWith(label.text)), seen).toBe(true);
        }
      }
    }
    expect(leftOut.hidden).toBeGreaterThan(0);
    expect(leftOut.staying).toBeGreaterThan(0);
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

  it('the «+N» of every state opens the list of its place: the title that counts its packets and one field for each of them', () => {
    let opened = 0;
    for (const analysis of sweep().analyses) {
      for (const { more } of analysis.fans) {
        if (more === undefined) continue;
        const list = inspect(analysis.state.session, PIECE_ID.stamps(more.ids));
        expect(list, `${more.id}, ${where(analysis)}`).not.toBeNull();
        expect(list?.title, `${more.id}, ${where(analysis)}`).toBe(INSPECTION_TEXT.stampsTitle(more.ids.length));
        expect(list?.fields, `${more.id}, ${where(analysis)}`).toHaveLength(more.ids.length);
        opened++;
      }
    }
    expect(opened).toBeGreaterThan(0);
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
        const mine = [...fan.stamps.map(({ id }) => `stamp:${id}`), ...(fan.more ? [`more:${fan.more.id}`] : [])];
        const at = order.map(({ kind, id }) => `${kind}:${id}`);
        const first = at.indexOf(mine[0]);
        expect(at.slice(first, first + mine.length), `${fan.station}, ${where(analysis)}`).toEqual(mine);
        expect(order[first - 1]?.kind === 'piece' || order[first - 1]?.kind === 'stamp' || order[first - 1]?.kind === 'more', where(analysis)).toBe(true);
      }
      for (const fan of fans.filter(({ station }) => /^(door:|router:)/.test(station) || station === 'internet')) {
        const at = order.map(({ kind, id }) => `${kind}:${id}`);
        const first = at.indexOf(fan.stamps[0] ? `stamp:${fan.stamps[0].id}` : `more:${fan.more?.id}`);
        const before = order.slice(0, first).filter(({ kind }) => kind === 'piece').at(-1);
        expect(before?.id.split(':').at(-1), `${fan.station}, ${where(analysis)}`).toBe(fan.station.split(':').at(-1));
      }
      expect(order, where(analysis)).toHaveLength(pieces.length + fans.reduce((total, { stamps, more }) => total + stamps.length + (more ? 1 : 0), 0));
    }
  });
});
