import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { applyAction, facesALan, isClientActor, simulate, type Network } from '@/engine';
import { INCIDENTS, caseWorld, solvedWorld, startWorld } from '@/levels';
import { lengthOf, route, type Point } from '@/scene/map2d/layout/graph';
import { characterCount, labelWidth } from '@/scene/map2d/layout/metrics';
import { LINE_END, startsOnMap, station, stationsFor } from '@/scene/map2d/layout/stations';
import { NAME_SERVERS, lab03Net, officeNet, officeTwoFloorsNet, officeWithNames } from '@/testing';
import { graphOf } from './arrange/assemble';
import { COMPACT, MIN_WIDTH, NORMAL, OUTER, SNAKE_LABEL_WALL, fanBox, overlaps, type Box, type MapMode, type RowLayout, type RowPiece } from './arrange/geometry';
import { SERVERS, layoutRow } from './arrange/row';
import { layoutStack } from './arrange/stack';
import { layoutMap } from './map-layout';

const make = (kind: RowPiece['kind'], anchorId: string, label: RowPiece['label'], extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label, locked: true, state: 'normal', ...extras });

function drawnWhole(world: Network): RowPiece[] {
  const owners = world.firewalls.flatMap((firewall) => world.devices.filter((device) => device.firewallIds.includes(firewall.id)).slice(0, 1).map((owner) => make('firewall', owner.id, MAP_TEXT.firewall[firewall.kind](firewall.name))));
  const routers = (world.routers ?? []).map((router) => make('edge', router.id, nameTag(router.name), { inOffice: facesALan(world, router) }));
  const lone = routers.length === 0 ? [make('edge', 'edge', MAP_TEXT.edge[world.edge])] : [];
  const actors = world.actors.map((actor) => (isClientActor(actor) ? make('actor', actor.id, nameTag(actor.name), { locked: false }) : make('device', actor.id, nameTag(actor.name))));
  return [...world.devices.map((device) => make('device', device.id, nameTag(device.name), { state: 'intruded' })), ...owners, ...routers, ...lone, make('internet', 'internet', MAP_TEXT.internet, { locked: false }), ...actors];
}

function registeredWorlds(): { id: string; world: Network }[] {
  return INCIDENTS.flatMap((incident) => {
    const start = startWorld(INCIDENTS, incident.id);
    const cases = incident.mechanic === 'diagnose' ? incident.diagnose.cases.map((spec) => caseWorld(start, spec)) : [];
    return [start, solvedWorld(INCIDENTS, incident.id), ...cases].map((world) => ({ id: incident.id, world }));
  });
}

const FLOORS = officeTwoFloorsNet();
const HOME = { id: 'casa-lucia', name: 'casa-lucia', ip: '192.0.2.77', kind: 'home' } as const;
const NAMED = applyAction(officeWithNames(), { type: 'addActor', actor: HOME });
const NAMED_OPENING_A_CARD = drawnWhole(NAMED).map((each) => (each.anchorId === NAME_SERVERS.down.id ? { ...each, locked: false } : each));
const OTHER_OFFICE = startWorld(INCIDENTS, '02-07');
const hosts = (world: Network, ...ids: string[]) => drawnWhole(world).filter(({ kind, anchorId }) => kind !== 'device' || ids.includes(anchorId));
const withoutKinds = (pieces: RowPiece[], ...kinds: RowPiece['kind'][]) => pieces.filter(({ kind }) => !kinds.includes(kind));
const guarded = (world: Network, ...ids: string[]) => [...drawnWhole(world), ...ids.map((id) => make('firewall', id, MAP_TEXT.firewall['host-firewall'](id)))];

const SCENES: { name: string; world: Network; pieces: RowPiece[] }[] = [
  { name: 'the office of chapter 1', world: officeNet(), pieces: drawnWhole(officeNet()) },
  { name: 'the VPC of chapter 4', world: lab03Net(), pieces: drawnWhole(lab03Net()) },
  { name: 'two floors with the whole road', world: FLOORS, pieces: guarded(FLOORS, 'your-laptop', 'lucia-laptop') },
  { name: 'two floors with the routers out of sight', world: FLOORS, pieces: withoutKinds(drawnWhole(FLOORS), 'edge') },
  { name: 'the office alone', world: FLOORS, pieces: withoutKinds(hosts(FLOORS, 'your-laptop', 'lucia-laptop', 'marta-laptop', 'printer'), 'edge', 'internet', 'actor') },
  { name: 'an office and a server with no internet', world: FLOORS, pieces: withoutKinds(drawnWhole(FLOORS), 'edge', 'internet') },
  { name: 'the names of chapter 2 and a client', world: NAMED, pieces: drawnWhole(NAMED).filter(({ anchorId }) => anchorId !== NAME_SERVERS.down.id) },
  { name: 'the other office of 02-07', world: OTHER_OFFICE, pieces: drawnWhole(OTHER_OFFICE) },
  { name: 'the other office alone', world: OTHER_OFFICE, pieces: drawnWhole(OTHER_OFFICE).filter(({ kind, anchorId }) => kind !== 'device' || /^(branch-|internet-server)/.test(anchorId)) },
  { name: 'a road with no office', world: FLOORS, pieces: drawnWhole(FLOORS).filter(({ kind }) => kind === 'edge' || kind === 'internet') },
];
const WIDTHS = [360, 390, 768, 900, 1060, 1280, 1440];

const spreads = (boxes: readonly { name: string; box: Box }[]) => boxes.flatMap((first, index) => boxes.slice(index + 1).filter((second) => overlaps(first.box, second.box)).map((second): [string, string] => [first.name, second.name]));

function distanceAlong(points: readonly Point[], [x, y]: Point): number | undefined {
  const walked = lengthOf(points);
  const found = points.slice(1).findIndex(([endX, endY], index) => {
    const [startX, startY] = points[index];
    const span = Math.hypot(endX - startX, endY - startY);
    if (span === 0) return Math.hypot(x - startX, y - startY) < 1e-6;
    const cross = (x - startX) * (endY - startY) - (y - startY) * (endX - startX);
    const dot = (x - startX) * (endX - startX) + (y - startY) * (endY - startY);
    return Math.abs(cross) < 1e-6 * span && dot > -1e-6 && dot < span ** 2 + 1e-6;
  });
  return found < 0 ? undefined : walked[found] + Math.hypot(x - points[found][0], y - points[found][1]);
}

function problemsOf(layout: RowLayout): string[] {
  const { size, drawn } = layout;
  const fans = layout.marks.map((mark) => ({ name: mark.station, box: fanBox(mark.point, mark.axis, mark.casillas) }));
  const solids = [...Object.entries(layout.labels).map(([id, box]) => ({ name: `label ${id}`, box })), ...Object.entries(layout.icons).map(([id, box]) => ({ name: `icon ${id}`, box }))];
  const everything = [...solids, ...layout.groups.map(({ id, box }) => ({ name: `group ${id}`, box })), ...fans.map(({ name, box }) => ({ name: `fan ${name}`, box }))];
  const leaving = everything.filter(({ box }) => box.x < 0 || box.y < 0 || box.x + box.width > size.width || box.y + box.height > size.height).map(({ name }) => `${name} leaves the map`);
  const straying = layout.links.filter(({ points }) => points.some(([x, y]) => x < 0 || y < 0 || x > size.width - OUTER || y > size.height - OUTER)).map(({ from, to }) => `the link ${from} / ${to} leaves the map`);
  const buses = new Set(Object.values(drawn.devices)).size;
  const trunkMid = (name: string) => buses > 1 && name.startsWith('mid:bus:');
  const doors = new Set([...drawn.servers, ...drawn.clients].map((id) => `door:${id}`));
  const onLaneBus = (name: string) => /^mid:(door:|.*-door:|.*-line-end$)/.test(name) || doors.has(name) || name === LINE_END;
  const mayTouch = (a: string, b: string) => trunkMid(a) || trunkMid(b) || (onLaneBus(a) && onLaneBus(b)) || (/^bus-end:/.test(a) && /^road:/.test(b)) || (/^bus-end:/.test(b) && /^road:/.test(a));
  const crowded = layout.links.flatMap(({ from, to, points }) => {
    const along = layout.marks.flatMap(({ station: name, point }) => (trunkMid(name) ? [] : [{ name, at: distanceAlong(points, point) }])).flatMap(({ name, at: distance }) => (distance === undefined ? [] : [{ name, at: distance }]));
    const ordered = [...along].sort((a, b) => a.at - b.at);
    return ordered.flatMap((mark, index) => (index > 0 && mark.at - ordered[index - 1].at < 40 - 1e-6 ? [`${ordered[index - 1].name} / ${mark.name} on ${from} - ${to}`] : []));
  });
  const stops = [...(drawn.edge ? ['edge'] : []), ...drawn.routers.map((id) => `router:${id}`), ...(drawn.internet ? ['internet'] : [])];
  const mids = stops.slice(1).map((after, index) => `mid:${stops[index]}-${after}`);
  return [
    ...leaving,
    ...straying,
    ...spreads(solids).map(([first, second]) => `${first} / ${second} touch`),
    ...fans.filter(({ name }) => !trunkMid(name)).flatMap(({ name, box }) => solids.filter((solid) => overlaps(box, solid.box)).map((solid) => `fan ${name} covers ${solid.name}`)),
    ...spreads(fans).filter(([first, second]) => !mayTouch(first, second)).map(([first, second]) => `fans ${first} / ${second} overlap`),
    ...crowded.map((pair) => `marks ${pair} are under 40 px apart`),
    ...layout.marks.filter(({ station: name, casillas }) => (stops.includes(name) || mids.includes(name)) && casillas < 3).map(({ station: name, casillas }) => `${name} holds ${casillas} casillas`),
  ];
}

function packetFailures(world: Network, layout: RowLayout): string[] {
  const ips = new Set([...world.devices.map(({ privateIp }) => privateIp), ...world.actors.map(({ ip }) => ip), ...(world.routers ?? []).flatMap(({ interfaces }) => interfaces.map(({ ip }) => ip)), '8.8.8.8']);
  const senders = [...world.devices.map(({ id }) => ({ kind: 'device', id }) as const), ...world.actors.map(({ id }) => ({ kind: 'actor', id }) as const)];
  const graph = graphOf(layout);
  return senders.flatMap((from) =>
    [...ips].flatMap((to) => {
      const packet = { from, to, protocol: 'icmp', icmpType: 8 } as const;
      if (!startsOnMap(packet, layout.drawn)) return [];
      const trace = simulate(world, packet);
      return [false, true].flatMap((hiddenStop) => {
        try {
          route(graph, stationsFor(trace, packet, layout.drawn, { hiddenStop }));
          return [];
        } catch (error) {
          return [`${from.id} to ${to} (hidden ${hiddenStop}): ${error instanceof Error ? error.message : error}`];
        }
      });
    }),
  );
}

function sceneOf(name: string) {
  const found = SCENES.find((scene) => scene.name === name);
  if (found === undefined) throw new Error(`There is no scene named ${name}`);
  return found;
}
const WHOLE_ROAD = sceneOf('two floors with the whole road');

describe('layoutMap', () => {
  it('chooses the row when its natural width fits, the compact row when only that fits and the snake otherwise', () => {
    const { world, pieces } = WHOLE_ROAD;
    const [normal, compact] = [layoutRow(world, pieces, NORMAL), layoutRow(world, pieces, COMPACT)];
    expect(normal.size.width).toBeGreaterThan(compact.size.width);
    expect(layoutMap(world, pieces, { width: normal.size.width })).toEqual({ ...normal, mode: 'row' });
    expect(layoutMap(world, pieces, { width: normal.size.width + 200 })).toEqual({ ...normal, mode: 'row' });
    expect(layoutMap(world, pieces, { width: normal.size.width - 1 })).toEqual({ ...compact, mode: 'row-compact' });
    expect(layoutMap(world, pieces, { width: compact.size.width })).toEqual({ ...compact, mode: 'row-compact' });
    expect(layoutMap(world, pieces, { width: compact.size.width - 1 })).toEqual({ ...layoutStack(world, pieces, compact.size.width - 1), mode: 'stack' });
    const bare = sceneOf('the office alone');
    const natural = layoutRow(bare.world, bare.pieces, NORMAL).size.width;
    expect(layoutRow(bare.world, bare.pieces, COMPACT).size.width).toBe(natural);
    expect(natural).toBeGreaterThan(MIN_WIDTH);
    expect(layoutMap(bare.world, bare.pieces, { width: natural }).mode).toBe('row');
    expect(layoutMap(bare.world, bare.pieces, { width: natural - 1 }).mode).toBe('stack');
  });

  it('the same world and the same width give the same layout', () => {
    for (const { world, pieces } of SCENES) {
      for (const width of [MIN_WIDTH, 700, 1500]) {
        const first = layoutMap(world, pieces, { width });
        expect(first.marks.length).toBeGreaterThan(0);
        expect(layoutMap(structuredClone(world), structuredClone(pieces), { width })).toEqual(first);
        expect(layoutMap(world, pieces, { width })).toEqual(first);
      }
    }
  });

  it('below 360 px the layout keeps 360 px wide', () => {
    for (const { world, pieces } of SCENES) {
      const kept = layoutMap(world, pieces, { width: MIN_WIDTH });
      for (const width of [359, 340, 320, 200, 0]) expect(layoutMap(world, pieces, { width }), `${width}`).toEqual(kept);
    }
    const { world, pieces } = WHOLE_ROAD;
    expect(layoutMap(world, pieces, { width: 300 })).toMatchObject({ mode: 'stack', size: { width: MIN_WIDTH } });
    const small = [make('internet', 'internet', MAP_TEXT.internet)];
    const natural = layoutRow(officeNet(), small, NORMAL);
    expect(natural.size.width).toBeLessThan(MIN_WIDTH);
    expect(layoutMap(officeNet(), small, { width: 100 })).toEqual({ ...natural, mode: 'row' });
  });

  it('the mode flips only where the natural width of the row is', () => {
    for (const scene of SCENES) {
      const [normal, compact] = [NORMAL, COMPACT].map((density) => layoutRow(scene.world, scene.pieces, density).size.width);
      const widths = [...new Set([...Array.from({ length: 15 }, (_, index) => MIN_WIDTH + index * 100), normal - 1, normal, normal + 1, compact - 1, compact, compact + 1])].filter((width) => width >= MIN_WIDTH).sort((a, b) => a - b);
      const modes = widths.map((width): MapMode => layoutMap(scene.world, scene.pieces, { width }).mode);
      const flips = widths.flatMap((width, index) => (index > 0 && modes[index] !== modes[index - 1] ? [[width, modes[index]]] : []));
      const expected = [...(compact > MIN_WIDTH ? [[compact, normal > compact ? 'row-compact' : 'row']] : []), ...(normal > compact ? [[normal, 'row']] : [])];
      expect(flips, scene.name).toEqual(expected);
      expect(modes[0], scene.name).toBe(compact > MIN_WIDTH ? 'stack' : 'row');
    }
  });

  it('at 360 px no label, piece, box or mark of any registered incident leaves the map', () => {
    const worlds = registeredWorlds();
    expect(worlds.length).toBeGreaterThanOrEqual(INCIDENTS.length * 2);
    const failures = worlds.flatMap(({ id, world }) => {
      const pieces = drawnWhole(world);
      const layout = layoutMap(world, pieces, { width: MIN_WIDTH });
      const missing = pieces.filter(({ id: pieceId }) => layout.icons[pieceId] === undefined || layout.labels[pieceId] === undefined).map(({ id: pieceId }) => `${pieceId} is not drawn`);
      return [...(layout.size.width > MIN_WIDTH ? [`${layout.size.width} px wide`] : []), ...missing, ...problemsOf(layout)].map((problem) => `${id}: ${problem}`);
    });
    expect([...new Set(failures)]).toEqual([]);
  });

  it('the longest name of the registered worlds fits a lane of the snake at 360 px', () => {
    const named = registeredWorlds().flatMap(({ world }) => world.actors.map((actor) => ({ world, actor })));
    const longest = named.reduce((best, each) => (characterCount(each.actor.name) > characterCount(best.actor.name) ? each : best));
    expect(characterCount(longest.actor.name)).toBeGreaterThan(10);
    const layout = layoutStack(longest.world, drawnWhole(longest.world), MIN_WIDTH);
    const lane = layout.labels[`${isClientActor(longest.actor) ? 'actor' : 'device'}:${longest.actor.id}`];
    expect(lane.width).toBe(labelWidth(longest.actor.name, { locked: !isClientActor(longest.actor) }));
    expect(lane.x).toBeGreaterThanOrEqual(SNAKE_LABEL_WALL);
    expect(lane.x + lane.width).toBeLessThanOrEqual(MIN_WIDTH - SNAKE_LABEL_WALL);
    expect(problemsOf(layout)).toEqual([]);
  });

  it('a name of 30 characters, in the server of names that opens a card, fits the snake at 360 px: 24 + 48 + 44 + 6 + 230, and 8 px to the wall', () => {
    const layout = layoutStack(NAMED, NAMED_OPENING_A_CARD, MIN_WIDTH);
    const [name, icon, door, bus] = [layout.labels[`device:${NAME_SERVERS.down.id}`], layout.icons[`device:${NAME_SERVERS.down.id}`], layout.stations[station.door(NAME_SERVERS.down.id)], layout.nodes.find((node) => node.name === SERVERS)?.point ?? [NaN, NaN]];
    const side = Math.sign(door[0] - bus[0]);
    expect(layout.size.width).toBe(MIN_WIDTH);
    expect(characterCount(NAME_SERVERS.down.id)).toBe(30);
    expect(name.width).toBe(230);
    expect(side === 1 ? bus[0] : MIN_WIDTH - bus[0]).toBe(24);
    expect(Math.abs(door[0] - bus[0])).toBe(44);
    expect(icon.width).toBe(48);
    expect(side === 1 ? name.x - (icon.x + icon.width) : icon.x - (name.x + name.width)).toBe(6);
    expect(side === 1 ? MIN_WIDTH - (name.x + name.width) : name.x).toBe(8);
    expect(problemsOf(layout)).toEqual([]);
    expect(packetFailures(NAMED, layout)).toEqual([]);
  });

  it('the lane of a name of 30 characters comes within 8 px of the wall on whichever side it hangs, and the snake holds at every width', () => {
    const nearest = new Map<number, number>();
    for (let width = MIN_WIDTH; width <= 520; width += 2) {
      const layout = layoutStack(NAMED, NAMED_OPENING_A_CARD, width);
      const [name, door, bus] = [layout.labels[`device:${NAME_SERVERS.down.id}`], layout.stations[station.door(NAME_SERVERS.down.id)], layout.nodes.find((node) => node.name === SERVERS)?.point ?? [NaN, NaN]];
      const side = Math.sign(door[0] - bus[0]);
      nearest.set(side, Math.min(nearest.get(side) ?? Infinity, side === 1 ? width - (name.x + name.width) : name.x));
      expect(layout.size.width, `at ${width}`).toBe(width);
      expect(problemsOf(layout), `at ${width}`).toEqual([]);
    }
    expect([...nearest.entries()].sort()).toEqual([[-1, 8], [1, 8]]);
  });

  it('a name of 30 characters with its lock, which no registered world has, widens the snake past 360 px instead of leaving the map', () => {
    const pieces = drawnWhole(NAMED);
    const narrow = layoutStack(NAMED, pieces, MIN_WIDTH);
    const name = narrow.labels[`device:${NAME_SERVERS.down.id}`];
    expect(characterCount(NAME_SERVERS.down.id)).toBe(30);
    expect(name.width).toBe(labelWidth(NAME_SERVERS.down.id, { locked: true }));
    expect(narrow.size.width).toBeGreaterThan(MIN_WIDTH);
    expect(narrow.size.width).toBeLessThanOrEqual(name.x + name.width + OUTER + 8);
    expect(problemsOf(narrow)).toEqual([]);
    expect(layoutStack(NAMED, pieces, narrow.size.width).size.width).toBe(narrow.size.width);
  });

  it('a world drawn whole keeps the size and the place of everything else', () => {
    for (const { name, world, pieces } of SCENES.filter(({ pieces: drawn }) => drawn.some(({ kind }) => kind === 'device'))) {
      for (const width of [MIN_WIDTH, 1500]) {
        const plain = layoutMap(world, pieces, { width });
        expect(plain.groups.filter(({ kind }) => kind === 'block'), name).toEqual([]);
        const marked = pieces.map((each, index) => (each.kind === 'device' && index < 2 ? { ...each, insideBlock: true } : each));
        const outlined = layoutMap(world, marked, { width });
        expect(outlined.groups.some(({ kind }) => kind === 'block'), name).toBe(true);
        expect({ ...outlined, groups: outlined.groups.filter(({ kind }) => kind !== 'block') }, name).toEqual(plain);
      }
    }
  });

  it('as a snake, in every scene and at every width, holds everything, keeps the marks apart and routes every packet', () => {
    for (const { name, world, pieces } of SCENES) {
      for (const width of WIDTHS) {
        const snake = layoutStack(world, pieces, width);
        expect(snake.marks.length, `${name} at ${width}`).toBeGreaterThan(0);
        expect(snake.size.width, `${name} at ${width}`).toBe(Math.max(width, MIN_WIDTH));
        expect(problemsOf(snake).slice(0, 6), `${name} at ${width}`).toEqual([]);
        expect(packetFailures(world, snake).slice(0, 4), `${name} at ${width}`).toEqual([]);
      }
    }
  });

  it('in every registered incident the map holds at every width from 390 to 1440 px', () => {
    const distinct = [...new Map(registeredWorlds().map((each) => [JSON.stringify(each.world), each])).values()];
    const failures = distinct.flatMap(({ id, world }) =>
      WIDTHS.slice(1).flatMap((width) => {
        const layout = layoutMap(world, drawnWhole(world), { width });
        return problemsOf(layout).map((problem) => `${id} at ${width} (${layout.mode}): ${problem}`);
      }),
    );
    expect([...new Set(failures)]).toEqual([]);
  });
});
