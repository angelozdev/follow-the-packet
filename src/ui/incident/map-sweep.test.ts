import { describe, expect, it } from 'vitest';
import { INSPECTION_TEXT, OUTCOME_TEXT, isProblemStamp, stampOf, toPlainText } from '@/copy';
import { PIECE_ID, classifiedBlock, drawnSends, inspect, isIntruding, pieceViews, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { runFlows } from '@/game/flow-runs';
import { applyAction, type NetworkAction } from '@/engine';
import { INCIDENTS, caseWorld, sendCombinations, solvedWorld, type Incident, type SendOwner } from '@/levels';
import { NAME_SERVERS, OFFICE_FLOORS, namesSendIncident } from '@/testing';
import { DOORSTEP, FAN_PITCH, LABEL_GAP, MIN_WIDTH, STAMP, fanBox, overlaps, type Box } from '@/scene/layout/arrange/geometry';
import { blockTabBoxes, captionBoxes } from '@/scene/layout/captions';
import { graphOf } from '@/scene/layout/arrange/assemble';
import { lengthOf, route } from '@/scene/layout/graph';
import { layoutMap } from '@/scene/layout/map-layout';
import { LABEL_HEIGHT, labelWidth } from '@/scene/layout/metrics';
import { startsOnMap, station, stationsFor } from '@/scene/layout/stations';
import { crowds, grown, holds } from '@/scene/marks/boxes';
import { collisions } from '@/scene/marks/collisions';
import { changeDistance, legTextAt, type PlacedTag } from '@/scene/marks/packet-tags';
import { readingOrder } from '@/scene/marks/reading-order';
import { fanStamps, stampsByPlace, type Fan, type StampsByPlace } from '@/scene/marks/stamp-fan';
import { stillPackets, translationAt, wayOf, type StillPacket } from '@/scene/marks/still-packets';
import { flightPlan, flowCycles, keyframes, labelRide, motionOf, routeOf, sendCycle } from '@/scene/traffic/flight/flight-plan';

const WIDTHS = [360, 390, 768, 900, 1060, 1280, 1440];
const HUNDRED = 100;
const SAME_POINT = 1e-6;
const OVERHANGING_SHAPE = { incident: '01-14', width: 360, shape: 'going of sent-you-ip-server-ping', overhang: 4 };
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
  const runs: Run[] = [...session.runs, ...drawnSends(session.sent)];
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

function captionsOf({ layout, state }: Analysis): Record<string, Box> {
  const block = classifiedBlock(state.session);
  return { ...captionBoxes(layout.groups), ...(block === null ? {} : blockTabBoxes(layout.groups, block)) };
}

function clashesOf(analysis: Analysis): string[] {
  const { layout, fans, placed } = analysis;
  return collisions({ ...layout, captions: captionsOf(analysis) }, fans, placed).map(({ first, second }) => `${first.kind} ${first.id} with ${second.kind} ${second.id}`);
}

function straysOf(analysis: Analysis): string[] {
  const { layout, fans, packets, width } = analysis;
  const whole: Box = { x: 0, y: 0, width: layout.size.width, height: layout.size.height };
  const named = (kind: string, boxes: Record<string, Box>) => Object.entries(boxes).map(([id, box]) => ({ name: `${kind} ${id}`, box }));
  const shown = fans.flatMap(({ stamps, more }) => [...stamps, ...(more ? [more] : [])]);
  const boxes = [
    ...named('label', layout.labels),
    ...named('icon', layout.icons),
    ...named('name', captionsOf(analysis)),
    ...layout.groups.map(({ id, box }) => ({ name: `group ${id}`, box })),
    ...shown.map(({ id, box }) => ({ name: `stamp ${id}`, box })),
    ...packets.flatMap(({ id, glyphs, label }) => [...glyphs.map(({ role, box }) => ({ name: `${role} of ${id}`, box })), ...(label?.place ? [{ name: `label of ${id}`, box: label.place.box }] : [])]),
  ];
  const outside = boxes.filter(({ box }) => !holds(whole, box)).map(({ name }) => name);
  return layout.size.width > Math.max(width, MIN_WIDTH) ? ['the drawing is wider than its width', ...outside] : outside;
}

function overhangOf({ layout, packets }: Analysis, shape: string): number {
  const found = packets.flatMap(({ id, glyphs }) => glyphs.map(({ role, box }) => ({ name: `${role} of ${id}`, box }))).find(({ name }) => name === shape);
  const { x, y, width, height } = found?.box ?? { x: 0, y: 0, width: 0, height: 0 };
  return Math.max(0, -x, -y, x + width - layout.size.width, y + height - layout.size.height);
}

function lostStampsOf({ fans, stamped }: Analysis): string[] {
  return fans.filter((fan) => fan.stamps.length + fan.hidden.length !== stamped[fan.station].length).map((fan) => fan.station);
}

function expectClear(analysis: Analysis) {
  const seen = where(analysis);
  expect(analysis.placed.filter(({ clear }) => !clear).map(({ id }) => id), seen).toEqual([]);
  expect(clashesOf(analysis), seen).toEqual([]);
  expect(straysOf(analysis), seen).toEqual([]);
  expect(lostStampsOf(analysis), seen).toEqual([]);
  expect(analysis.fans.reduce((total, fan) => total + fan.stamps.length + fan.hidden.length, 0), seen).toBe(analysis.packets.length);
}

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
      expect(analysis.placed.filter(({ clear }) => !clear).map(({ id }) => id), where(analysis)).toEqual([]);
      expect(clashesOf(analysis), where(analysis)).toEqual([]);
    }
  });

  it('in every state of every registered incident the drawing is no wider than its width and every label, icon, name, group, stamp and packet lies inside it, at seven widths, but for one shape at 360 px', () => {
    const { analyses } = sweep();
    expect(analyses.filter(({ layout, width }) => layout.size.width === Math.max(width, MIN_WIDTH)).length).toBeGreaterThan(0);
    expect(analyses.filter(({ layout, width }) => layout.size.width < Math.max(width, MIN_WIDTH)).length).toBeGreaterThan(0);
    const tolerated: { state: string; overhang: number }[] = [];
    for (const analysis of analyses) {
      const strays = straysOf(analysis);
      const isTheKnownShape = (name: string) => analysis.state.incident === OVERHANGING_SHAPE.incident && analysis.width === OVERHANGING_SHAPE.width && name === OVERHANGING_SHAPE.shape;
      tolerated.push(...strays.filter(isTheKnownShape).map(() => ({ state: analysis.state.name, overhang: overhangOf(analysis, OVERHANGING_SHAPE.shape) })));
      expect(strays.filter((name) => !isTheKnownShape(name)), where(analysis)).toEqual([]);
    }
    const states = ['case 4, only you to ip-server with ping', 'case 4, every combination'];
    expect(tolerated).toEqual(states.map((state) => ({ state, overhang: expect.closeTo(OVERHANGING_SHAPE.overhang, 6) })));
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

const WINDOW_AREAS = [900, 1060];
const YOU = 'your-laptop';
const OFFICE_ROUTER = 'office-router';
const FOUR_TESTS = 4;
const SEVEN_CASES = 7;
const A_ROUTER_OF_THE_PATH = /router-(oficina|proveedor|destino)|(?<!\d)(192\.168\.1\.1|203\.0\.113\.\d+)(?!\d)/;
const A_HOP = /salto|pasó por/i;
const PRIVATE_IP_WHY = '10.0.0.10 es una IP privada: se repite en muchas redes y internet no la entrega';
const DROPPED_OUTSIDE_WHY = 'Un router, ya fuera de la oficina, descartó el paquete y no avisó';

const sending = (toId: string, messageId = 'ping', fromId = 'you'): SessionAction => ({ type: 'sendPacket', fromId, toId, messageId });
const placing = (deviceId: string, bin: string): SessionAction => ({ type: 'answerCard', deviceId, picks: { bin } });
const played = (incidentId: string, moves: readonly SessionAction[]): Session => moves.reduce(sessionReducer, startSession(INCIDENTS, incidentId));
const stateOf = (incident: string, name: string, session: Session): State => ({ incident, name, session });
const atTheWindows = (states: readonly State[]): Analysis[] => states.flatMap((state) => WINDOW_AREAS.map((width) => analyze(state, width)));
const incidentOf = (id: string): Incident => INCIDENTS.find((incident) => incident.id === id) as Incident;

function boxText(session: Session, packetId: string): string {
  const box = inspect(session, PIECE_ID.packet(packetId));
  return [box?.title ?? '', ...(box?.fields ?? []).flatMap((field) => [field.label, ...field.lines])].map(toPlainText).join('\n');
}

function distanceToBox([x, y]: readonly number[], box: Box): number {
  return Math.hypot(Math.max(box.x - x, 0, x - (box.x + box.width)), Math.max(box.y - y, 0, y - (box.y + box.height)));
}

function expectAtTheDoorstep({ layout, fans }: Analysis, packetId: string, deviceId: string, seen: string) {
  const fan = fans.find(({ station: at }) => at === station.doorstep(deviceId));
  expect(fan?.stamps.map(({ id }) => id), seen).toContain(packetId);
  const stamp = fan?.stamps.find(({ id }) => id === packetId);
  expect(stamp?.point, seen).toEqual(layout.stations[station.doorstep(deviceId)]);
  expect(distanceToBox(stamp?.point ?? [], layout.icons[`device:${deviceId}`]), seen).toBeCloseTo(DOORSTEP, 6);
}

function namesOfTheRouters(session: Session, ids: readonly string[]): string[] {
  const names = new Map(pieceViews(session).map(({ id, label }) => [id, toPlainText(label)]));
  return ids.filter((id) => id.startsWith('router:')).map((id) => names.get(id) ?? id);
}

function wayToTheOtherOffice() {
  const incident = incidentOf('02-07');
  if (incident.mechanic !== 'send') throw new Error('02-07 is a send incident');
  const table = incident.send.tables?.find(({ kind }) => kind === 'routes');
  if (table?.kind !== 'routes') throw new Error('02-07 offers a table of routes');
  const [toProvider, toBranch] = incident.solution.flatMap((move) => (move.type === 'placeEntry' ? [move] : []));
  const defaultToBranch: SessionAction = { ...toProvider, picks: { ...toProvider.picks, nextHop: toBranch.picks.nextHop } };
  const defaultRoute = table.trays.destination.find(({ id }) => id === toProvider.picks.destination);
  const removeDefault: SessionAction = { type: 'removeEntry', tableId: table.id, entryId: String(defaultRoute?.value) };
  const pings = [sending('ip-server'), sending('ip-other-office'), sending('ip-other-office-laptop')];
  return {
    nothingSent: stateOf('02-07', 'nothing sent', played('02-07', [])),
    noRoutes: stateOf('02-07', 'the three pings with no route', played('02-07', pings)),
    onlyTheDefault: stateOf('02-07', 'the three pings with only the default route', played('02-07', [toProvider, ...pings])),
    bothRoutes: stateOf('02-07', 'the three pings with both routes', played('02-07', [toProvider, toBranch, ...pings])),
    defaultToTheBranch: stateOf('02-07', 'the three pings with the default route handed to router-sucursal', played('02-07', [toProvider, toBranch, removeDefault, defaultToBranch, ...pings])),
  };
}

describe('the states the geometry tests of the chapters played, as the player reaches them', () => {
  it('in 05 the warning for 192.168.1.50 appears at the doorstep of your own laptop and does not travel', () => {
    const session = played('01-05', [sending('ip-nobody')]);
    for (const analysis of atTheWindows([stateOf('01-05', 'the ping to 192.168.1.50', session)])) {
      const { runs, stations, fans, packets } = analysis;
      const seen = where(analysis);
      expect(runs.map((run) => stampOf(run)), seen).toEqual(['warned']);
      expect(stations, seen).toEqual([[station.door(YOU), station.doorstep(YOU)]]);
      expect(fans.map(({ station: at, stamps, hidden }) => [at, stamps.length, hidden.length]), seen).toEqual([[station.doorstep(YOU), 1, 0]]);
      expect(packets.map(({ glyphs }) => glyphs.map(({ role }) => role)), seen).toEqual([['appears']]);
      expectAtTheDoorstep(analysis, runs[0].id, YOU, seen);
      expectClear(analysis);
    }
  });

  it('after the pings of 08 the lost ping stands between the router and the internet, and no label or stamp overlaps', () => {
    const session = played('01-08', [sending('ip-server'), sending('ip-other-office')]);
    for (const analysis of atTheWindows([stateOf('01-08', 'the pings to the server and to 10.0.0.10', session)])) {
      const { layout, runs, stations, fans } = analysis;
      const seen = where(analysis);
      const [, lost] = runs;
      const router = station.router(OFFICE_ROUTER);
      const between = station.mid(router, 'internet');
      const along = (stops: string[]) => lengthOf(route(graphOf(layout), stops)).at(-1) ?? 0;
      expect(runs.map((run) => stampOf(run)), seen).toEqual(['arrived', 'lost']);
      expect(stations[1].at(-1), seen).toBe(between);
      expect(fans.find(({ station: at }) => at === between)?.stamps.map(({ id, point }) => [id, point]), seen).toEqual([[lost.id, layout.stations[between]]]);
      expect(along([router, between, 'internet']), seen).toBeCloseTo(along([router, 'internet']), 6);
      expect(Math.min(along([router, between]), along([between, 'internet'])), seen).toBeGreaterThan(0);
      expect(boxText(session, lost.id), seen).toContain(PRIVATE_IP_WHY);
      expect(boxText(session, lost.id), seen).toContain(DROPPED_OUTSIDE_WHY);
      expect(boxText(session, lost.id), seen).not.toContain('router-proveedor');
      expectClear(analysis);
    }
  });

  it('after the four tests of case 1 of 14 no stamp lies over a label or covers another beyond the step of the fan', () => {
    const incident = incidentOf('01-14');
    const [firstCase] = ownersOf(incident, startSession(INCIDENTS, incident.id));
    const session = sendAll(firstCase.owner, firstCase.session);
    expect(session.sent).toHaveLength(FOUR_TESTS);
    for (const analysis of atTheWindows([stateOf('01-14', 'case 1, the four tests', session)])) {
      const seen = where(analysis);
      const shown = analysis.fans.flatMap(({ stamps, hidden }) => [...stamps.map(({ id }) => id), ...hidden]);
      expect(shown.sort(), seen).toEqual(session.sent.map(({ id }) => id).sort());
      for (const { stamps } of analysis.fans) {
        stamps.slice(1).forEach(({ point }, index) => expect(Math.hypot(point[0] - stamps[index].point[0], point[1] - stamps[index].point[1]), seen).toBeCloseTo(FAN_PITCH, 6));
      }
      expectClear(analysis);
    }
  });

  it('in 01-10, before the traceroute, the lost ping stands at the doorstep of tu-laptop and the routers wait for a traceroute', () => {
    const before = stateOf('01-10', 'only the ping', played('01-10', [sending('ip-server')]));
    const after = stateOf('01-10', 'the ping and the traceroute', played('01-10', [sending('ip-server'), sending('ip-server', 'traceroute')]));
    const routersOnTheMap = ({ layout, fans, state }: Analysis) => namesOfTheRouters(state.session, readingOrder(layout, fans).map(({ id }) => id)).sort();
    const expectTheLostPing = (analysis: Analysis) => {
      const seen = where(analysis);
      const [ping] = analysis.runs;
      const text = boxText(analysis.state.session, ping.id);
      expect(stampOf(ping), seen).toBe('lost');
      expect(analysis.stations[0], seen).toEqual([station.door(YOU), station.doorstep(YOU)]);
      expectAtTheDoorstep(analysis, ping.id, YOU, seen);
      expect(text, seen).toContain(toPlainText(OUTCOME_TEXT.timeout));
      expect([A_ROUTER_OF_THE_PATH, A_HOP].filter((pattern) => pattern.test(text)), seen).toEqual([]);
      expect(Object.keys(analysis.layout.labels).filter((id) => id.startsWith('router:')), seen).toHaveLength(routersOnTheMap(analysis).length);
      expectClear(analysis);
    };
    for (const analysis of atTheWindows([before])) {
      expectTheLostPing(analysis);
      expect(routersOnTheMap(analysis), where(analysis)).toEqual([]);
    }
    for (const analysis of atTheWindows([after])) {
      expectTheLostPing(analysis);
      expect(routersOnTheMap(analysis), where(analysis)).toEqual([expect.stringMatching(/^router-oficina/), expect.stringMatching(/^router-proveedor/)]);
    }
  });

  it('in 02-04 placing a device inside the block moves the outline by the distance between rows, and moving it out takes it back', () => {
    const [printer, andres] = ['printer', 'andres-laptop'];
    const placed = [placing(printer, 'inside'), placing(andres, 'inside'), placing(andres, 'outside'), placing(printer, 'outside')];
    const outlinesOf = ({ layout }: Analysis) => layout.groups.filter(({ kind }) => kind === 'block');
    const tabsOf = ({ layout, state }: Analysis) => Object.values(blockTabBoxes(layout.groups, classifiedBlock(state.session) as string));
    const rowOf = ({ layout }: Analysis, deviceId: string) => layout.icons[`device:${deviceId}`].y;
    for (const width of WINDOW_AREAS) {
      const at = (moves: readonly SessionAction[]) => analyze(stateOf('02-04', `after ${moves.length} placements`, played('02-04', moves)), width);
      const [alone, withPrinter, withBoth, withoutAndres, withoutPrinter] = [0, 1, 2, 3, 4].map((count) => at(placed.slice(0, count)));
      const seen = `at ${width} px`;
      const [home] = outlinesOf(alone);
      expect(outlinesOf(alone), seen).toHaveLength(1);
      expect(outlinesOf(withPrinter), seen).toHaveLength(1);
      const [taller] = outlinesOf(withPrinter);
      expect([taller.box.x, taller.box.y, taller.box.width], seen).toEqual([home.box.x, home.box.y, home.box.width]);
      expect(taller.box.y + taller.box.height - (home.box.y + home.box.height), seen).toBeCloseTo(rowOf(withPrinter, printer) - rowOf(withPrinter, YOU), 6);
      expect(tabsOf(withPrinter), seen).toEqual(tabsOf(alone));
      const [onFloorOne, onFloorTwo] = outlinesOf(withBoth);
      expect(outlinesOf(withBoth), seen).toHaveLength(2);
      expect(onFloorOne, seen).toEqual(taller);
      expect(onFloorTwo.box.y - onFloorOne.box.y, seen).toBeCloseTo(rowOf(withBoth, andres) - rowOf(withBoth, YOU), 6);
      const [tabOne, tabTwo] = tabsOf(withBoth);
      expect(tabTwo.y - tabOne.y, seen).toBeCloseTo(rowOf(withBoth, andres) - rowOf(withBoth, YOU), 6);
      expect(withoutAndres.layout.groups, seen).toEqual(withPrinter.layout.groups);
      expect(withoutPrinter.layout, seen).toEqual(alone.layout);
      expect(tabsOf(withoutPrinter), seen).toHaveLength(1);
    }
  });

  it('in 02-07 the map fits the area at 1060 px and at 900 px, with nothing sent and with the three pings', () => {
    const { nothingSent, noRoutes, onlyTheDefault, bothRoutes } = wayToTheOtherOffice();
    for (const analysis of atTheWindows([nothingSent, noRoutes, onlyTheDefault, bothRoutes])) {
      expect(straysOf(analysis), where(analysis)).toEqual([]);
    }
  });

  it('after the pings of 02-07 no label or stamp overlaps, with no route, with only the default route, with both and with the default route handed to router-sucursal', () => {
    const { nothingSent, noRoutes, onlyTheDefault, bothRoutes, defaultToTheBranch } = wayToTheOtherOffice();
    for (const analysis of atTheWindows([nothingSent, noRoutes, onlyTheDefault, bothRoutes, defaultToTheBranch])) expectClear(analysis);
    for (const analysis of atTheWindows([defaultToTheBranch])) expect(analysis.runs.map((run) => stampOf(run))[0], where(analysis)).toBe('warned');
  });

  it('in 02-09 and 02-10 no label or stamp overlaps, with the stamps that show and the ones that «+N» counts', () => {
    const fromHome = (messageId: string) => sending('ip-office-public', messageId, 'home');
    const nothing = played('02-09', []);
    const unmapped = played('02-09', [fromHome('nc-40009')]);
    const both = played('02-09', [fromHome('nc-40009'), fromHome('nc-3000')]);
    const analyses = atTheWindows([stateOf('02-09', 'nothing sent', nothing), stateOf('02-09', 'the nc to 40009', unmapped), stateOf('02-09', 'the nc to 40009 and the nc to 3000', both)]);
    for (const analysis of analyses) expectClear(analysis);
  });

  it('in 01-09 and 01-10 no label or stamp overlaps once the player has sent its messages, the four pings with a TTL of 01-09 and the ping and the traceroute of 01-10', () => {
    const pingsWithTtl = ['ping-ttl-1', 'ping-ttl-2', 'ping-ttl-3', 'ping-ttl-64'].map((message) => sending('ip-server', message));
    const states = [stateOf('01-09', 'the four pings with a TTL', played('01-09', pingsWithTtl)), stateOf('01-10', 'the ping and the traceroute', played('01-10', [sending('ip-server'), sending('ip-server', 'traceroute')]))];
    for (const analysis of atTheWindows(states)) {
      expect(analysis.runs.filter((run) => 'send' in run), where(analysis)).toHaveLength(analysis.state.incident === '01-09' ? pingsWithTtl.length : 2);
      expectClear(analysis);
    }
  });

  it('in 06, 08 and 10 the whole map and its labels fit the area of the map, at 900 px and at 1060 px, once the player has sent its messages', () => {
    const states = [
      stateOf('01-06', 'the ping to laptop-andres', played('01-06', [sending('ip-andres')])),
      stateOf('01-08', 'the pings to the server and to 10.0.0.10', played('01-08', [sending('ip-server'), sending('ip-other-office')])),
      stateOf('01-10', 'the ping and the traceroute', played('01-10', [sending('ip-server'), sending('ip-server', 'traceroute')])),
    ];
    for (const analysis of atTheWindows(states)) expect(straysOf(analysis), where(analysis)).toEqual([]);
  });

  it('in 10, before the traceroute, the whole map and its labels fit the area of the map, at 900 px and at 1060 px, with nothing sent and with the ping sent', () => {
    const states = [stateOf('01-10', 'nothing sent', played('01-10', [])), stateOf('01-10', 'only the ping', played('01-10', [sending('ip-server')]))];
    for (const analysis of atTheWindows(states)) expect(straysOf(analysis), where(analysis)).toEqual([]);
  });

  it('in 14 the whole map and its labels fit the area of the map, at 900 px and at 1060 px, in each of its seven cases', () => {
    const incident = incidentOf('01-14');
    const cases = ownersOf(incident, startSession(INCIDENTS, incident.id));
    expect(cases).toHaveLength(SEVEN_CASES);
    const states = cases.map(({ owner, session }, index) => stateOf('01-14', `case ${index + 1}, every test sent`, sendAll(owner, session)));
    for (const analysis of atTheWindows(states)) expect(straysOf(analysis), where(analysis)).toEqual([]);
  });

  it('in 02-01 no piece label, floor name, stamp or packet label of the still map overlaps another, with the ping and the nc to 3000 sent and then with the nc to 5432 too', () => {
    const first = [sending('ip-lucia'), sending('ip-lucia', 'nc-3000')];
    const states = [stateOf('02-01', 'the ping and the nc to 3000', played('02-01', first)), stateOf('02-01', 'and the nc to 5432', played('02-01', [...first, sending('ip-lucia', 'nc-5432')]))];
    for (const analysis of atTheWindows(states)) {
      expect(analysis.placed, where(analysis)).toHaveLength(analysis.state.name.includes('5432') ? 2 : 1);
      expectClear(analysis);
    }
  });

  it('in 02-02 no piece label, floor name, stamp or packet label of the still map overlaps another once the labels say TCP and both ports, with the nc to 3000 and the nc to 5432 sent', () => {
    const session = played('02-02', [sending('ip-lucia', 'nc-3000'), sending('ip-lucia', 'nc-5432')]);
    for (const analysis of atTheWindows([stateOf('02-02', 'the nc to 3000 and the nc to 5432', session)])) {
      expect(analysis.placed, where(analysis)).toHaveLength(2);
      expectClear(analysis);
    }
  });

  it('in 02-04 no piece label, floor name or name of the outline of the still map overlaps another, with only your laptop inside, with the printer too and with laptop-andres too', () => {
    const inside = ['printer', 'andres-laptop'].map((device) => placing(device, 'inside'));
    const states = [stateOf('02-04', 'only your laptop inside', played('02-04', [])), stateOf('02-04', 'the printer too', played('02-04', inside.slice(0, 1))), stateOf('02-04', 'laptop-andres too', played('02-04', inside))];
    for (const analysis of atTheWindows(states)) expectClear(analysis);
  });
});

describe('the sweep of the sends by name', () => {
  const { zone, resolver, authoritative } = NAME_SERVERS;
  const base = namesSendIncident();
  const shown = ['your-laptop', 'lucia-laptop', 'printer', OFFICE_FLOORS.officeRouter.id, OFFICE_FLOORS.provider.id, resolver.id, OFFICE_FLOORS.server.id];
  const NAMES = { ...base, shown, send: { ...base.send, message: base.send.message.filter(({ command }) => command !== 'dig'), to: [...base.send.to, { id: 'apex', address: zone }] } };
  const closedOut: NetworkAction = { type: 'addFirewall', deviceId: 'your-laptop', firewall: { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] } };
  const WORLDS: [string, NetworkAction[]][] = [
    ['a resolver that answers', []],
    ['an authoritative server that fails', [{ type: 'setDns', ownerId: authoritative.id, dns: { role: 'authoritative', zones: [], failing: true } }]],
    ['an address with no resolver behind it', [{ type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.floor1.printer }]],
    ['an address nobody has', [{ type: 'setDnsServer', deviceId: 'your-laptop', server: OFFICE_FLOORS.server.nobody }]],
    ['a firewall that stops the question', [closedOut, { type: 'setDnsServer', deviceId: 'your-laptop', server: resolver.ip }]],
    ['a hosts file that answers', [{ type: 'setHosts', deviceId: 'your-laptop', hosts: [{ name: `www.${zone}`, ip: OFFICE_FLOORS.server.ip }] }]],
  ];
  const SEND_SETS = [
    ['a ping to www and a ping to lucia', [['www', 'ping'], ['lucia', 'ping']]],
    ['an nc to www', [['www', 'nc']]],
    ['a ping to a name that does not exist', [['missing', 'ping']]],
    ['an nc to a name that does not exist', [['missing', 'nc']]],
    ['a ping to a name with no address', [['apex', 'ping']]],
    ['an nc to a name with no address', [['apex', 'nc']]],
  ] as const;
  const TOGETHER = ['three sends by name together', [['www', 'ping'], ['www', 'nc'], ['missing', 'ping']]] as const;
  const stateOf = ([world, actions]: (typeof WORLDS)[number], [sends, combinations]: readonly [string, readonly (readonly [string, string])[]]): State => {
    const start = startSession([NAMES], NAMES.id);
    const edited = { ...start, world: actions.reduce(applyAction, start.world) };
    const session = combinations.reduce((sent, [toId, messageId]) => sessionReducer(sent, { type: 'sendPacket', fromId: 'you', toId, messageId }), edited);
    return { incident: NAMES.id, name: `${world}, ${sends}`, session };
  };
  const states = [...WORLDS.flatMap((world) => SEND_SETS.map((sends) => stateOf(world, sends))), stateOf(WORLDS[0], TOGETHER)];
  const analyses = states.flatMap((state) => WIDTHS.map((width) => analyze(state, width)));
  const questionsOf = ({ runs }: Analysis) => runs.filter(({ id }) => id.endsWith('-question'));

  it('draws the question of every send by name before its packet, in every world, and none for a send by IP or by hosts', () => {
    expect(states).toHaveLength(WORLDS.length * SEND_SETS.length + 1);
    for (const analysis of analyses) {
      const seen = where(analysis);
      const ids = analysis.runs.map(({ id }) => id);
      const byName = ids.filter((id) => /-(www|missing|apex)-(ping|nc)$/.test(id));
      const asked = analysis.state.name.startsWith('a hosts file that answers') ? byName.filter((id) => !id.includes('-www-')) : byName;
      expect(questionsOf(analysis).map(({ id }) => id), seen).toEqual(asked.map((id) => `${id}-question`));
      for (const id of asked) expect(ids.indexOf(`${id}-question`), seen).toBe(ids.indexOf(id) - 1);
    }
  });

  it('the packet of a lookup that failed stays at the doorstep of tu-laptop and the question that was answered ends at the resolver, in every world and at seven widths', () => {
    let stuck = 0;
    let answered = 0;
    for (const analysis of analyses) {
      analysis.runs.forEach((run, index) => {
        const seen = `${run.id}, ${where(analysis)}`;
        const stations = analysis.stations[index];
        if (!run.id.endsWith('-question') && run.trace.steps.some((step) => step.reason.code.startsWith('dns-') && step.verdict === 'drop' && step.reason.code !== 'dns-unresolved')) {
          expect(stations, seen).toEqual([station.door('your-laptop'), station.doorstep('your-laptop')]);
          stuck++;
        }
        if (run.id.endsWith('-question') && run.trace.outcome === 'replied') {
          expect(stations.at(-1), seen).toBe(station.door(resolver.id));
          answered++;
        }
      });
    }
    expect(stuck).toBeGreaterThan(0);
    expect(answered).toBeGreaterThan(0);
  });

  it('no label, stamp, packet label, name of a box or piece overlaps another, nothing leaves the drawing and no stamp is lost, in every world, at seven widths', () => {
    expect(analyses).toHaveLength(states.length * WIDTHS.length);
    for (const analysis of analyses) expectClear(analysis);
    expect(analyses.some(({ packets }) => packets.some(({ id }) => id.endsWith('-question')))).toBe(true);
  });
});
