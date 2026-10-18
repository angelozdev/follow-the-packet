import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { applyAction, simulate, type Network } from '@/engine';
import { INCIDENTS, solvedWorld, startWorld } from '@/levels';
import { lengthOf, route, type Point } from '@/scene/map2d/layout/graph';
import { LINE_END, mainLine, startsOnMap, station, stationsFor } from '@/scene/map2d/layout/stations';
import { NAME_SERVERS, OFFICE_FLOORS, actor, device, lab03Net, officeNet, officeTwoFloorsNet, officeWithNames, ping } from '@/testing';
import { graphOf } from './assemble';
import {
  BAR_AT,
  BAR_THICKNESS,
  COMPACT,
  ICON,
  LABEL_GAP,
  MARK_BACK,
  NORMAL,
  OUTER,
  TRUNK_PITCH,
  fanBox,
  overlaps,
  type Box,
  type Density,
  type PieceKind,
  type RowLayout,
  type RowPiece,
} from './geometry';
import { layoutRow } from './row';

const piece = (kind: PieceKind, anchorId: string, extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal', ...extras });
const devicePieces = (...ids: string[]) => ids.map((id) => piece('device', id));
const firewallOf = (id: string) => piece('firewall', id, { label: MAP_TEXT.firewall['security-group'](id) });
const centerOf = ({ x, y, width, height }: Box): Point => [x + width / 2, y + height / 2];
const edgeOf = (world: Network) => piece('edge', 'edge', { label: MAP_TEXT.edge[world.edge] });

const FLOORS = officeTwoFloorsNet();
const { officeRouter, provider, backbone, server, floor1 } = OFFICE_FLOORS;
const FLOOR_1_DEVICES = devicePieces('your-laptop', 'lucia-laptop', 'marta-laptop', 'printer');
const ANDRES = piece('device', 'andres-laptop');
const ROUTERS = [officeRouter, provider, backbone].map((router) => piece('edge', router.id, { inOffice: router.id === officeRouter.id }));
const GLOBE = piece('internet', 'internet', { label: MAP_TEXT.internet });
const SERVER_PIECE = piece('device', server.id);
const OFFICE_AND_ROAD = [...FLOOR_1_DEVICES, ANDRES, ...ROUTERS, GLOBE, SERVER_PIECE];
const layoutOf = (...pieces: RowPiece[]) => layoutRow(FLOORS, pieces, NORMAL);
const groupOf = (layout: RowLayout, id: string) => layout.groups.find((group) => group.id === id)?.box;

const HOME = { id: 'casa-lucia', name: 'casa-lucia', ip: '192.0.2.77', kind: 'home' } as const;
const NAMED = applyAction(officeWithNames(), { type: 'addActor', actor: HOME });
const NAME_PIECES = [NAME_SERVERS.resolver, NAME_SERVERS.authoritative, NAME_SERVERS.down].map(({ id }) => piece('device', id));
const WITH_NAMES = [...FLOOR_1_DEVICES, ROUTERS[0], GLOBE, ...NAME_PIECES, SERVER_PIECE, piece('actor', HOME.id)];

const OTHER_OFFICE = startWorld(INCIDENTS, '02-07');
const [OFFICE_02, PROVIDER_02, BRANCH_02] = ['office-router', 'provider-router', 'branch-router'];
const BRANCH_DEVICES = devicePieces('your-laptop', 'branch-printer', 'branch-laptop');
const WITH_BRANCH = [...BRANCH_DEVICES, piece('edge', OFFICE_02, { inOffice: true }), piece('edge', BRANCH_02, { inOffice: true }), piece('edge', PROVIDER_02), GLOBE, piece('device', 'internet-server')];

interface Scene {
  name: string;
  world: Network;
  pieces: RowPiece[];
}

const SCENES: Scene[] = [
  { name: 'the office of chapter 1', world: officeNet(), pieces: [...devicePieces('your-laptop', 'lucia-laptop', 'printer'), firewallOf('lucia-laptop'), edgeOf(officeNet()), GLOBE, piece('actor', 'attacker')] },
  { name: 'the VPC of chapter 4', world: lab03Net(), pieces: [...devicePieces('servidor1', 'servidor2'), firewallOf('servidor1'), firewallOf('servidor2'), edgeOf(lab03Net()), GLOBE, piece('actor', 'you'), piece('actor', 'attacker')] },
  { name: 'two floors with the whole road', world: FLOORS, pieces: [...OFFICE_AND_ROAD, ...devicePieces('guest-laptop'), firewallOf('your-laptop'), firewallOf('lucia-laptop')] },
  { name: 'two floors with the routers out of sight', world: FLOORS, pieces: [...FLOOR_1_DEVICES, ANDRES, GLOBE, SERVER_PIECE] },
  { name: 'the office alone', world: FLOORS, pieces: FLOOR_1_DEVICES },
  { name: 'an office and a server, with no internet', world: FLOORS, pieces: [...FLOOR_1_DEVICES, SERVER_PIECE] },
  { name: 'the names of chapter 2 and a client', world: NAMED, pieces: WITH_NAMES },
  { name: 'the other office of 02-07', world: OTHER_OFFICE, pieces: WITH_BRANCH },
  { name: 'a road with no office', world: FLOORS, pieces: [...ROUTERS, GLOBE] },
];
const DENSITIES: Density[] = [NORMAL, COMPACT];
const TAIL_MIDS = /^mid:(bus:|door:)|^mid:.*-(door:|line-end$)|^line-end$/;
const TAIL_SPACING = /^mid:(bus:|door:)|^mid:.*-line-end$|^line-end$/;

describe('layoutRow', () => {
  it('lays out the drawn routers along the main line between the office and the internet, in order', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    const [office, inProvider, inBackbone, globe] = [...ROUTERS, GLOBE].map(({ id }) => centerOf(layout.icons[id]));
    const yMain = layout.stations.internet[1];
    expect([office[1], inProvider[1], inBackbone[1], globe[1]]).toEqual([yMain, yMain, yMain, yMain]);
    expect(office[0]).toBeLessThan(inProvider[0]);
    expect(inProvider[0]).toBeLessThan(inBackbone[0]);
    expect(inBackbone[0]).toBeLessThan(globe[0]);
    expect(layout.stations[station.router(officeRouter.id)]).toEqual(office);
    const skipping = layoutOf(...FLOOR_1_DEVICES, ROUTERS[0], ROUTERS[2], GLOBE);
    const [first, last] = [ROUTERS[0], ROUTERS[2]].map(({ id }) => centerOf(skipping.icons[id]));
    expect(last[0] - first[0]).toBe(inProvider[0] - office[0]);
    expect(Object.keys(skipping.icons).filter((id) => id.startsWith('edge:'))).toEqual([ROUTERS[0].id, ROUTERS[2].id]);
  });

  it('orders the routers from the one the pieces say is in the office outward, whatever order the world lists them', () => {
    const listedBackwards = { ...FLOORS, routers: [...(FLOORS.routers ?? [])].reverse() };
    const layout = layoutRow(listedBackwards, OFFICE_AND_ROAD, NORMAL);
    const [office, inProvider, inBackbone] = ROUTERS.map(({ id }) => layout.icons[id].x);
    expect(office).toBeLessThan(inProvider);
    expect(inProvider).toBeLessThan(inBackbone);
    expect(layout.drawn.routers).toEqual([officeRouter.id, provider.id, backbone.id]);
  });

  it('the router of the office stands on the border of the box of the office, inside it and outside it', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    const office = groupOf(layout, 'office');
    expect(office).toBeDefined();
    expect(centerOf(layout.icons[ROUTERS[0].id])[0]).toBe((office?.x ?? 0) + (office?.width ?? 0));
    const single = groupOf(layoutOf(...FLOOR_1_DEVICES, ROUTERS[0], GLOBE), floor1.id);
    expect(centerOf(layoutOf(...FLOOR_1_DEVICES, ROUTERS[0], GLOBE).icons[ROUTERS[0].id])[0]).toBe((single?.x ?? 0) + (single?.width ?? 0));
    const noRouter = layoutOf(...FLOOR_1_DEVICES, GLOBE);
    expect(centerOf(noRouter.icons[GLOBE.id])[0]).toBeGreaterThan((groupOf(noRouter, floor1.id)?.x ?? 0) + (groupOf(noRouter, floor1.id)?.width ?? 0));
  });

  it('a server of the internet stands past the last drawn router', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD);
    const lastRouter = Math.max(...ROUTERS.map(({ id }) => layout.icons[id].x));
    expect(layout.icons[SERVER_PIECE.id].x).toBeGreaterThan(lastRouter);
    expect(centerOf(layout.icons[SERVER_PIECE.id])[1]).toBe(layout.stations.internet[1]);
    const fewer = layoutOf(...FLOOR_1_DEVICES, ROUTERS[0], SERVER_PIECE);
    expect(fewer.icons[SERVER_PIECE.id].x).toBeGreaterThan(fewer.icons[ROUTERS[0].id].x);
    expect(Object.keys(fewer.drawn.devices)).not.toContain(server.id);
    expect(fewer.drawn.servers).toEqual([server.id]);
  });

  it('a device that is not connected stands outside the boxes and its cable reaches no bus', () => {
    const layout = layoutOf(...FLOOR_1_DEVICES, ...devicePieces('guest-laptop', 'andres-laptop'));
    const guest = layout.icons['device:guest-laptop'];
    expect(layout.groups.some(({ box }) => overlaps(box, guest))).toBe(false);
    const cable = layout.links.filter(({ from }) => from === station.door('guest-laptop') || from === station.doorstep('guest-laptop') || from === station.firewall('guest-laptop'));
    expect(cable.map(({ kind }) => kind)).toEqual(['unplugged', 'unplugged', 'unplugged']);
    expect(layout.links.some(({ from, to, kind }) => kind === 'bus' && [from, to].includes(station.road('guest-laptop')))).toBe(false);
    expect(layout.drawn.devices['guest-laptop']).toBe(floor1.id);
  });

  it('gives a spot only to the pieces it is given', () => {
    const layout = layoutOf(piece('device', 'your-laptop'), ROUTERS[0], SERVER_PIECE);
    const given = ['device:your-laptop', ROUTERS[0].id, SERVER_PIECE.id];
    expect(Object.keys(layout.icons).sort()).toEqual([...given].sort());
    expect(Object.keys(layout.labels).sort()).toEqual([...given].sort());
    expect(layout.drawn).toEqual({ devices: { 'your-laptop': floor1.id }, clients: [], servers: [server.id], routers: [officeRouter.id], gateways: [], edge: false, internet: false });
    expect(Object.keys(layout.stations).filter((name) => name.startsWith('door:')).sort()).toEqual([station.door('your-laptop'), station.door(server.id)].sort());
    expect(layout.groups.map(({ id }) => id)).toEqual([floor1.id]);
    const attacker = { id: 'attacker', name: 'Atacante', ip: '203.0.113.66', kind: 'attacker' } as const;
    const visited = layoutRow({ ...FLOORS, actors: [attacker, ...FLOORS.actors] }, [piece('device', 'your-laptop'), piece('actor', attacker.id)], NORMAL);
    expect(visited.drawn).toMatchObject({ clients: [attacker.id], servers: [] });
    expect(Object.keys(visited.icons)).toEqual(['device:your-laptop', 'actor:attacker']);
  });

  it('the place of the office depends only on the pieces its incident draws', () => {
    const pieces = [...FLOOR_1_DEVICES, ROUTERS[0], GLOBE];
    const grown: Network = { ...FLOORS, devices: [...FLOORS.devices, { ...FLOORS.devices[0], id: 'extra', name: 'extra', privateIp: '192.168.1.200' }] };
    expect(layoutRow(grown, pieces, NORMAL)).toEqual(layoutOf(...pieces));
    const alone = groupOf(layoutOf(...FLOOR_1_DEVICES), floor1.id);
    const withRoad = groupOf(layoutOf(...pieces), floor1.id);
    expect(withRoad?.x).toBe(alone?.x);
    expect(withRoad?.y).toBe(alone?.y);
    expect(alone?.x).toBe(OUTER);
  });

  it('the office keeps the size of a row and an icon in every incident, whichever pieces it draws', () => {
    const [whole, pair] = [layoutOf(...OFFICE_AND_ROAD), layoutOf(...devicePieces('your-laptop', 'lucia-laptop'))];
    const pitch = (layout: RowLayout) => layout.icons['device:lucia-laptop'].y - layout.icons['device:your-laptop'].y;
    expect(pitch(whole)).toBe(100);
    expect(pitch(pair)).toBe(100);
    expect([whole, pair].map((layout) => [layout.icons['device:your-laptop'].width, layout.icons['device:your-laptop'].height])).toEqual([[ICON, ICON], [ICON, ICON]]);
  });

  it('a floor of eight devices makes a map 878 px tall, as the prototype of the spec measured', () => {
    const base = officeNet();
    const ids = Array.from({ length: 8 }, (_, index) => `device-${index}`);
    const world = { ...base, devices: ids.map((id, index) => ({ ...base.devices[0], id, name: id, privateIp: `192.168.1.${100 + index}` })) };
    expect(layoutRow(world, devicePieces(...ids), NORMAL).size.height).toBe(878);
  });

  it('servers and clients are lanes of 100 px centered on the main line', () => {
    for (const density of DENSITIES) {
      const layout = layoutRow(NAMED, WITH_NAMES, density);
      const ids = [...layout.drawn.servers, ...layout.drawn.clients];
      expect(ids).toHaveLength(5);
      const pieceOfLane = (id: string) => WITH_NAMES.find(({ anchorId }) => anchorId === id) ?? ROUTERS[0];
      const centers = ids.map((id) => centerOf(layout.icons[pieceOfLane(id).id]));
      const yMain = layout.stations.internet[1];
      expect(centers.map(([, y], index) => y - (centers[index - 1]?.[1] ?? y))).toEqual([0, 100, 100, 100, 100]);
      expect((centers[0][1] + centers[4][1]) / 2).toBe(yMain);
      expect(new Set(centers.map(([x]) => x)).size).toBe(1);
      for (const id of ids) {
        const icon = layout.icons[pieceOfLane(id).id];
        const lane = layout.links.find(({ kind, to }) => kind === 'lane' && to === station.door(id));
        expect(lengthOf(lane?.points ?? []).at(-1)).toBe(density.lane);
        expect(layout.stations[station.door(id)][0]).toBe(icon.x);
        expect(layout.labels[pieceOfLane(id).id].x).toBe(icon.x + ICON + LABEL_GAP);
      }
    }
  });

  it('the bus of the servers stands clear of the label of the last stop, however long its name is', () => {
    const wide = piece('edge', officeRouter.id, { inOffice: true, label: nameTag('router-de-la-sucursal-norte'), locked: true });
    const layout = layoutOf(...FLOOR_1_DEVICES, wide, SERVER_PIECE);
    const label = layout.labels[wide.id];
    const bus = layout.stations[station.door(server.id)][0] - NORMAL.lane;
    expect(bus).toBeGreaterThanOrEqual(label.x + label.width + 8);
    expect(bus - layout.stations[station.router(officeRouter.id)][0]).toBeGreaterThan(72);
  });

  it('the labels of two stops stand 8 px apart or more, however long their names are', () => {
    const named = (id: string, name: string) => piece('edge', id, { label: nameTag(name), inOffice: id === officeRouter.id });
    const layout = layoutOf(...FLOOR_1_DEVICES, named(officeRouter.id, 'router-de-la-sucursal-norte'), named(provider.id, 'router-del-proveedor-de-internet'), GLOBE);
    const [first, second, third] = [`edge:${officeRouter.id}`, `edge:${provider.id}`, GLOBE.id].map((id) => layout.labels[id]);
    expect(second.x - (first.x + first.width)).toBeGreaterThanOrEqual(8);
    expect(third.x - (second.x + second.width)).toBeGreaterThanOrEqual(8);
    expect(layout.icons[`edge:${provider.id}`].x - layout.icons[`edge:${officeRouter.id}`].x).toBeGreaterThan(172);
  });

  it('a lone edge, the internet and a client still lay out as in a network with no routers', () => {
    const world = { ...officeNet(), actors: [{ id: 'home', name: 'Casa', ip: '203.0.113.7', kind: 'home' } as const] };
    const layout = layoutRow(world, [...devicePieces('your-laptop'), edgeOf(world), GLOBE, piece('actor', 'home')], NORMAL);
    const [edge, globe, home] = [edgeOf(world), GLOBE, piece('actor', 'home')].map(({ id }) => layout.icons[id]);
    expect(layout.drawn).toMatchObject({ edge: true, routers: [], clients: ['home'], internet: true });
    expect(edge.x).toBeLessThan(globe.x);
    expect(globe.x).toBeLessThan(home.x);
    expect(layout.stations.edge).toEqual(centerOf(edge));
    expect(layout.groups.map(({ id }) => id)).toEqual(['office']);
  });

  it('the label of a device stands left of its icon, that of a firewall under its link past the bar, and that of a stop above it', () => {
    const layout = layoutOf(...OFFICE_AND_ROAD, firewallOf('your-laptop'));
    const [icon, label] = [layout.icons['device:your-laptop'], layout.labels['device:your-laptop']];
    expect(label.x + label.width + LABEL_GAP).toBe(icon.x);
    expect(centerOf(label)[1]).toBe(centerOf(icon)[1]);
    const [bar, firewallLabel] = [layout.icons['firewall:your-laptop'], layout.labels['firewall:your-laptop']];
    expect(bar).toMatchObject({ x: icon.x + ICON + BAR_AT - BAR_THICKNESS / 2, width: BAR_THICKNESS });
    expect(firewallLabel.y).toBeGreaterThan(centerOf(icon)[1]);
    expect(firewallLabel.x).toBeGreaterThan(bar.x + bar.width);
    expect(firewallLabel.height).toBe(36);
    const [router, routerLabel] = [layout.icons[ROUTERS[1].id], layout.labels[ROUTERS[1].id]];
    expect(centerOf(routerLabel)[0]).toBe(centerOf(router)[0]);
    expect(routerLabel.y + routerLabel.height + LABEL_GAP).toBe(router.y);
    const [office, officeLabel] = [layout.icons[ROUTERS[0].id], layout.labels[ROUTERS[0].id]];
    expect(officeLabel.x).toBeGreaterThanOrEqual(layout.stations[station.bus(floor1.id)][0]);
    expect(officeLabel.y + officeLabel.height + LABEL_GAP).toBe(office.y);
  });

  it('the compact row differs from the normal one only in the trunk and in the lane', () => {
    const [normal, compact] = DENSITIES.map((density) => layoutRow(FLOORS, OFFICE_AND_ROAD, density));
    expect(normal.size.width - compact.size.width).toBe(NORMAL.trunk - COMPACT.trunk + NORMAL.lane - COMPACT.lane);
    expect(compact.size.height).toBe(normal.size.height);
    for (const id of ['device:your-laptop', 'device:andres-laptop']) expect(compact.icons[id]).toEqual(normal.icons[id]);
    expect(normal.icons[ROUTERS[0].id].x - compact.icons[ROUTERS[0].id].x).toBe(NORMAL.trunk - COMPACT.trunk);
    expect(normal.icons[GLOBE.id].x - compact.icons[GLOBE.id].x).toBe(NORMAL.trunk - COMPACT.trunk);
    expect(normal.icons[SERVER_PIECE.id].x - compact.icons[SERVER_PIECE.id].x).toBe(NORMAL.trunk - COMPACT.trunk + NORMAL.lane - COMPACT.lane);
    const [officeOnly, officeOnlyCompact] = DENSITIES.map((density) => layoutRow(FLOORS, FLOOR_1_DEVICES, density));
    expect(officeOnlyCompact).toEqual(officeOnly);
  });

  describe.each(SCENES)('in $name', ({ world, pieces }) => {
    const layouts = DENSITIES.map((density) => layoutRow(world, pieces, density));

    it('the map holds everything it draws, with the margin of the drawing', () => {
      for (const layout of layouts) {
        const boxes = [...layout.groups.map(({ box }) => box), ...Object.values(layout.labels), ...Object.values(layout.icons), ...layout.marks.map(({ point, axis, casillas }) => fanBox(point, axis, casillas))];
        for (const { x, y, width, height } of boxes) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x + width).toBeLessThanOrEqual(layout.size.width);
          expect(y + height).toBeLessThanOrEqual(layout.size.height);
        }
        for (const [x, y] of layout.links.flatMap(({ points }) => points)) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(layout.size.width - OUTER);
          expect(y).toBeLessThanOrEqual(layout.size.height - OUTER);
        }
      }
    });

    it('no label and no icon covers another, and no fan of stamps covers one', () => {
      for (const layout of layouts) {
        const boxes = Object.entries({ ...layout.labels, ...Object.fromEntries(Object.entries(layout.icons).map(([id, box]) => [`icon ${id}`, box])) });
        const clashes = boxes.flatMap(([id, box], index) => boxes.slice(index + 1).filter(([, other]) => overlaps(box, other)).map(([otherId]) => `${id} / ${otherId}`));
        expect(clashes.slice(0, 8)).toEqual([]);
        const covered = layout.marks.filter(({ station: name }) => !name.startsWith('mid:bus:')).flatMap(({ station: name, point, axis, casillas }) => boxes.filter(([, box]) => overlaps(fanBox(point, axis, casillas), box)).map(([id]) => `${name} / ${id}`));
        expect(covered.slice(0, 8)).toEqual([]);
      }
    });

    it('two marks of one link are at least 40 px apart', () => {
      for (const layout of layouts) {
        const spaced = layout.links
          .filter(({ kind }) => kind !== 'trunk')
          .flatMap(({ from, to, points }) => {
            const walked = lengthOf(points);
            const along = layout.marks.filter(({ station: name }) => !TAIL_SPACING.test(name)).flatMap(({ station: name, point }) => {
              const segment = points.slice(1).findIndex((end, at) => onSegment(point, points[at], end));
              return segment < 0 ? [] : [{ name, at: walked[segment] + Math.hypot(point[0] - points[segment][0], point[1] - points[segment][1]) }];
            });
            const sorted = [...along].sort((a, b) => a.at - b.at);
            return sorted.flatMap((mark, index) => (index > 0 && mark.at - sorted[index - 1].at < 40 - 1e-6 ? [`${from} - ${to}: ${sorted[index - 1].name} / ${mark.name}`] : []));
          });
        expect(spaced.slice(0, 8)).toEqual([]);
      }
    });

    it('the fans of two marks never overlap, but the ones at the end of a bus, at the end of the line, in the tails of the line and at the first stop, whose trunk is shorter than a fan', () => {
      for (const layout of layouts) {
        const [first] = mainLine(layout.drawn);
        const fans = layout.marks.filter(({ station: name }) => !TAIL_MIDS.test(name) && !name.startsWith('bus-end:') && name !== first).map(({ station: name, point, axis, casillas }) => [name, fanBox(point, axis, casillas)] as const);
        const clashes = fans.flatMap(([name, fan], index) => fans.slice(index + 1).filter(([, other]) => overlaps(fan, other)).map(([other]) => `${name} / ${other}`));
        expect(clashes.slice(0, 8)).toEqual([]);
      }
    });

    it('every mark says the axis along which its fan opens and how many casillas fit', () => {
      for (const layout of layouts) {
        expect(layout.marks.length).toBeGreaterThan(0);
        for (const { station: name, point, axis, casillas } of layout.marks) {
          expect(['x', 'y'], name).toContain(axis);
          expect([1, 2, 3], name).toContain(casillas);
          const link = layout.links.find(({ points }) => points.slice(1).some((end, at) => onSegment(point, points[at], end)));
          expect(link, name).toBeDefined();
        }
        const stations = layout.marks.map(({ station: name }) => name);
        expect(new Set(stations).size).toBe(stations.length);
      }
    });

    it('each mid stands half way between its two stops, on the line', () => {
      for (const layout of layouts) {
        const graph = graphOf(layout);
        const wayLength = (...names: string[]) => lengthOf(route(graph, names)).at(-1) ?? 0;
        for (const [before, after] of legsOf(layout.drawn)) {
          const middle = station.mid(before, after);
          expect(layout.stations[middle], middle).toBeDefined();
          expect(wayLength(before, middle), middle).toBeCloseTo(wayLength(middle, after), 6);
          expect(wayLength(before, middle) + wayLength(middle, after), middle).toBeCloseTo(wayLength(before, after), 6);
        }
      }
    });

    it('the stub at the end of the line stands inside the map and is drawn', () => {
      for (const layout of layouts) {
        const [x, y] = layout.stations[LINE_END];
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThanOrEqual(layout.size.width - OUTER);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThanOrEqual(layout.size.height - OUTER);
        const drawn = layout.links.filter(({ from, to }) => from === LINE_END || to === LINE_END);
        expect(drawn.length).toBeGreaterThan(0);
        expect(Math.max(...drawn.map(({ points }) => lengthOf(points).at(-1) ?? 0))).toBeGreaterThan(0);
        expect(layout.marks.map(({ station: name }) => name)).toContain(LINE_END);
      }
    });

    it('every station that stationsFor names has a point and a way joins the ones it names in a row', () => {
      const [layout] = layouts;
      const graph = graphOf(layout);
      const failures = packetsOf(world).flatMap((packet) => {
        if (!startsOnMap(packet, layout.drawn)) return [];
        const trace = simulate(world, packet);
        return [false, true].flatMap((hiddenStop) => {
          const stations = stationsFor(trace, packet, layout.drawn, { hiddenStop });
          try {
            route(graph, stations);
            return [];
          } catch (error) {
            return [`${JSON.stringify(packet)} ${hiddenStop}: ${error instanceof Error ? error.message : error}`];
          }
        });
      });
      expect(failures).toEqual([]);
    });
  });
});

describe('a map with the gateway of another office', () => {
  const lanOf = (id: string) => OTHER_OFFICE.devices.find((each) => each.id === id)?.lanId ?? '';
  const [joined, without] = [WITH_BRANCH, WITH_BRANCH.filter(({ anchorId }) => ![BRANCH_02, 'branch-printer', 'branch-laptop'].includes(anchorId))].map((pieces) => layoutRow(OTHER_OFFICE, pieces, NORMAL));
  const iconOf = (layout: RowLayout, anchorId: string) => layout.icons[`${anchorId === 'internet' ? 'internet' : 'edge'}:${anchorId}`];

  it('a router after the first that faces a box the map draws stands in a second group below the office', () => {
    expect(joined.drawn).toMatchObject({ routers: [OFFICE_02, PROVIDER_02], gateways: [BRANCH_02] });
    const gateway = centerOf(iconOf(joined, BRANCH_02));
    const office = centerOf(iconOf(joined, OFFICE_02));
    const [officeBox, branchBox] = [groupOf(joined, lanOf('your-laptop')), groupOf(joined, lanOf('branch-printer'))];
    expect(branchBox?.y).toBeGreaterThanOrEqual((officeBox?.y ?? 0) + (officeBox?.height ?? 0));
    expect(gateway[0]).toBe(office[0]);
    expect((branchBox?.x ?? 0) + (branchBox?.width ?? 0)).toBe(gateway[0]);
    expect(branchBox?.x).toBe(officeBox?.x);
    expect(gateway[1]).toBeGreaterThan(branchBox?.y ?? Infinity);
    expect(gateway[1]).toBeLessThan((branchBox?.y ?? 0) + (branchBox?.height ?? 0));
    expect(centerOf(joined.icons['device:branch-printer'])[1]).toBeGreaterThan(branchBox?.y ?? Infinity);
    const way = route(graphOf(joined), [station.router(OFFICE_02), station.router(BRANCH_02)]);
    expect(new Set(way.map(([x]) => x))).toEqual(new Set([office[0]]));
    expect(joined.links.filter(({ kind }) => kind === 'private').length).toBeGreaterThan(0);
  });

  it('the gateway takes no place on the main line: the routers, the internet and the server stand where they would without it', () => {
    const stops = [`edge:${OFFICE_02}`, `edge:${PROVIDER_02}`, 'internet:internet', 'device:internet-server'].map((id) => [joined.icons[id], without.icons[id]]);
    const shift = stops[0][0].x - stops[0][1].x;
    for (const [withGateway, alone] of stops) {
      expect(withGateway.x - alone.x).toBe(shift);
      expect(withGateway.y).toBe(alone.y);
    }
    expect(joined.stations.internet[1]).toBe(without.stations.internet[1]);
    expect(joined.size.width - without.size.width).toBe(shift);
  });

  it('a router that faces a box but comes first stays on the main line, as the router of the office does', () => {
    const alone = layoutRow(OTHER_OFFICE, [...BRANCH_DEVICES, piece('edge', BRANCH_02, { inOffice: true }), GLOBE], NORMAL);
    expect(alone.drawn).toMatchObject({ routers: [BRANCH_02], gateways: [] });
    expect(centerOf(iconOf(alone, BRANCH_02))[1]).toBe(alone.stations.internet[1]);
  });

  it('a router that faces no box the map draws stays on the main line, whatever the pieces', () => {
    const noBox = layoutRow(OTHER_OFFICE, [piece('device', 'your-laptop'), piece('edge', OFFICE_02, { inOffice: true }), piece('edge', BRANCH_02, { inOffice: true }), piece('edge', PROVIDER_02), GLOBE], NORMAL);
    expect(noBox.drawn).toMatchObject({ routers: [OFFICE_02, BRANCH_02, PROVIDER_02], gateways: [] });
    for (const id of [OFFICE_02, BRANCH_02, PROVIDER_02]) expect(centerOf(iconOf(noBox, id))[1]).toBe(noBox.stations.internet[1]);
  });

  it('a packet to the other office goes to the gateway and back to the device along links', () => {
    const solved = solvedWorld(INCIDENTS, '02-07');
    const packet = ping(device('your-laptop'), '10.0.0.10');
    const layout = layoutRow(solved, WITH_BRANCH, NORMAL);
    const stations = stationsFor(simulate(solved, packet), packet, layout.drawn);
    expect(stations).toContain(station.router(BRANCH_02));
    expect(stations.at(-1)).toBe(station.door('branch-printer'));
    expect(route(graphOf(layout), stations).length).toBeGreaterThan(stations.length);
  });
});

describe('the marks', () => {
  const layout = layoutOf(...OFFICE_AND_ROAD, firewallOf('your-laptop'));
  const BACK: [RegExp, number][] = [[/^door:/, MARK_BACK], [/^firewall:/, BAR_THICKNESS / 2 + MARK_BACK], [/^(router:|internet$|edge$)/, ICON / 2 + MARK_BACK]];
  const markOf = (name: string) => layout.marks.find(({ station: found }) => found === name)?.point ?? [NaN, NaN];

  it('a mark stands 22 px before the piece where a packet ends and on the point where it ends on a link', () => {
    for (const { station: name, point } of layout.marks) {
      const back = BACK.find(([pattern]) => pattern.test(name))?.[1] ?? 0;
      expect(Math.hypot(point[0] - layout.stations[name][0], point[1] - layout.stations[name][1]), name).toBeLessThanOrEqual(back + 1e-6);
      expect(Math.hypot(point[0] - layout.stations[name][0], point[1] - layout.stations[name][1]), name).toBeGreaterThanOrEqual(back - TRUNK_PITCH);
    }
    const door = layout.stations[station.door('your-laptop')];
    expect(markOf(station.door('your-laptop'))).toEqual([door[0] + 22, door[1]]);
    expect(markOf(station.doorstep('your-laptop'))).toEqual(layout.stations[station.doorstep('your-laptop')]);
    const globe = layout.stations.internet;
    expect(markOf('internet')).toEqual([globe[0] - 24 - 22, globe[1]]);
    const lane = layout.stations[station.door(server.id)];
    expect(markOf(station.door(server.id))).toEqual([lane[0] - 22, lane[1]]);
    expect(layout.marks.map(({ station: name }) => name)).toEqual(expect.arrayContaining([station.busEnd(floor1.id), station.road('your-laptop'), station.mid('internet', station.door(server.id))]));
  });

  it('the doorstep stands 62 px from the edge of its device, on its link, nearer than its firewall', () => {
    for (const id of ['your-laptop', 'andres-laptop']) {
      const [door, doorstep, firewall, road] = [station.door(id), station.doorstep(id), station.firewall(id), station.road(id)].map((name) => layout.stations[name]);
      expect(doorstep).toEqual([door[0] + 62, door[1]]);
      expect(firewall[0]).toBeGreaterThan(doorstep[0]);
      expect(road[0]).toBeGreaterThan(firewall[0]);
      expect(layout.links.find(({ from }) => from === station.door(id))).toMatchObject({ kind: 'device', to: station.doorstep(id) });
    }
  });

  it('the middle of the link to the first server stands 40 px from the mark of its door, with a lane of either length', () => {
    for (const density of DENSITIES) {
      const dense = layoutRow(FLOORS, OFFICE_AND_ROAD, density);
      const [middle, door] = [station.mid('internet', station.door(server.id)), station.door(server.id)].map((name) => dense.marks.find(({ station: found }) => found === name)?.point ?? [NaN, NaN]);
      expect(door[0] - middle[0]).toBeGreaterThanOrEqual(40);
    }
  });

  it('the mark of a firewall stands on the side of the bus, where a packet that reaches the device comes from', () => {
    const [bar, mark, road] = [layout.stations[station.firewall('your-laptop')], markOf(station.firewall('your-laptop')), layout.stations[station.road('your-laptop')]];
    expect(mark[0]).toBeGreaterThan(bar[0]);
    expect(mark[0]).toBeLessThan(road[0]);
  });

  it('the axis of a fan is across the link: along y on a link that runs left to right and along x on the end of a bus', () => {
    const axisOf = (name: string) => layout.marks.find(({ station: found }) => found === name)?.axis;
    for (const name of [station.door('your-laptop'), station.doorstep('your-laptop'), station.firewall('your-laptop'), station.road('your-laptop'), 'internet', station.door(server.id)]) expect(axisOf(name), name).toBe('y');
    expect(axisOf(station.busEnd(floor1.id))).toBe('x');
    expect(layout.marks.filter(({ casillas }) => casillas === 3).length).toBeGreaterThan(layout.marks.length / 2);
  });
});

function legsOf(drawn: RowLayout['drawn']): [string, string][] {
  const line = mainLine(drawn);
  const buses = [...new Set(Object.values(drawn.devices))].map((bus) => [station.bus(bus), line[0] ?? LINE_END] as [string, string]);
  const along = line.slice(1).map((after, index) => [line[index], after] as [string, string]);
  return [...buses, ...along, ...(line.length > 0 ? [[line[line.length - 1], LINE_END] as [string, string]] : [])];
}

function packetsOf(world: Network) {
  const ips = new Set([...world.devices.flatMap((each) => [each.privateIp, ...(each.publicIp ? [each.publicIp] : [])]), ...world.actors.map(({ ip }) => ip), ...(world.routers ?? []).flatMap(({ interfaces }) => interfaces.map(({ ip }) => ip)), '8.8.8.8', '127.0.0.1']);
  const senders = [...world.devices.map(({ id }) => device(id)), ...world.actors.map(({ id }) => actor(id))];
  return senders.flatMap((from) => [...ips].map((ip) => ping(from, ip)));
}

function onSegment([x, y]: Point, [startX, startY]: Point, [endX, endY]: Point): boolean {
  const squared = (endX - startX) ** 2 + (endY - startY) ** 2;
  if (squared === 0) return Math.abs(x - startX) <= 1e-6 && Math.abs(y - startY) <= 1e-6;
  const across = Math.abs((x - startX) * (endY - startY) - (y - startY) * (endX - startX));
  const along = (x - startX) * (endX - startX) + (y - startY) * (endY - startY);
  return across <= 1e-6 * Math.sqrt(squared) && along >= -1e-6 && along <= squared + 1e-6;
}
