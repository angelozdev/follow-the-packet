import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { INCIDENTS, startWorld } from '@/levels';
import { route, type Point } from '@/scene/map2d/layout/graph';
import { station } from '@/scene/map2d/layout/stations';
import { OFFICE_FLOORS, officeTwoFloorsNet } from '@/testing';
import { graphOf } from './assemble';
import { BOX_GAP, FAN_HALF, ICON, LINE_PITCH, MIN_WIDTH, NORMAL, OUTER, SNAKE_LABEL_WALL, SNAKE_LANE, STOP_LABEL_RISE, STOP_PITCH, TRUNK_PITCH, overlaps, type Box, type PieceKind, type RowLayout, type RowPiece } from './geometry';
import { layoutRow } from './row';
import { layoutStack } from './stack';

const piece = (kind: PieceKind, anchorId: string, extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal', ...extras });
const devices = (...ids: string[]) => ids.map((id) => piece('device', id));
const guard = (id: string) => piece('firewall', id, { label: MAP_TEXT.firewall['host-firewall'](id) });

const WORLD = officeTwoFloorsNet();
const { officeRouter, provider, backbone, server, floor1, floor2 } = OFFICE_FLOORS;
const ROUTERS = [officeRouter, provider, backbone].map(({ id }) => piece('edge', id, { inOffice: id === officeRouter.id }));
const GLOBE = piece('internet', 'internet', { label: MAP_TEXT.internet });
const SERVER = piece('device', server.id);
const FLOOR_ONE = devices('your-laptop', 'lucia-laptop', 'marta-laptop', 'printer');
const WHOLE_ROAD = [...FLOOR_ONE, ...devices('andres-laptop'), ...ROUTERS, GLOBE, SERVER];
const OTHER_OFFICE = startWorld(INCIDENTS, '02-07');
const WITH_BRANCH = [...devices('your-laptop', 'branch-printer', 'branch-laptop'), piece('edge', 'office-router', { inOffice: true }), piece('edge', 'branch-router', { inOffice: true }), piece('edge', 'provider-router'), GLOBE, piece('device', 'internet-server')];

const centerOf = ({ x, y, width, height }: Box): Point => [x + width / 2, y + height / 2];
const centerAt = (layout: RowLayout, id: string) => centerOf(layout.icons[id]);
const groupBox = (layout: RowLayout, id: string) => layout.groups.find((group) => group.id === id)?.box ?? { x: NaN, y: NaN, width: NaN, height: NaN };
const wayOf = (layout: RowLayout, ...names: string[]) => route(graphOf(layout), names);
const doorY = (layout: RowLayout, id: string) => layout.stations[station.door(id)][1];
const pointOf = (layout: RowLayout, name: string): Point => layout.nodes.find((node) => node.name === name)?.point ?? [NaN, NaN];

describe('layoutStack', () => {
  it('the snake runs the way out from right to left under the office', () => {
    const layout = layoutStack(WORLD, WHOLE_ROAD, 900);
    const stops = [...ROUTERS, GLOBE].map(({ id }) => centerAt(layout, id));
    expect(new Set(stops.map(([, y]) => y)).size).toBe(1);
    const line = stops[0][1];
    expect(line - ICON / 2).toBeGreaterThan(groupBox(layout, 'office').y + groupBox(layout, 'office').height);
    stops.slice(1).forEach(([x], index) => expect(x).toBeLessThan(stops[index][0]));
    for (const id of ['your-laptop', 'printer', 'andres-laptop']) expect(doorY(layout, id), id).toBeLessThan(line);
    const [leave, ...rest] = wayOf(layout, station.bus(floor2.id), 'join:head');
    expect(rest[0][0]).toBeGreaterThan(leave[0]);
    expect(rest[rest.length - 1]).toEqual(pointOf(layout, 'join:head'));
    expect(rest[rest.length - 1][1]).toBe(line);
    const lane = layout.stations[station.door(server.id)];
    const bus = pointOf(layout, 'join:servers');
    expect(bus[0]).toBeLessThan(stops[3][0]);
    expect(bus[1]).toBe(line);
    expect(lane[0]).toBeGreaterThan(bus[0]);
    expect(lane[1]).toBeGreaterThan(line);
  });

  it('with two floors their trunks run in parallel, 8 px apart, to the router', () => {
    const layout = layoutStack(WORLD, WHOLE_ROAD, 900);
    const [first, second] = [floor1.id, floor2.id].map((floor) => wayOf(layout, station.bus(floor), 'join:head'));
    const drop = (way: Point[]) => Math.max(...way.map(([x]) => x));
    const lane = (way: Point[]) => Math.max(...way.filter(([x]) => x === drop(way)).map(([, y]) => y));
    expect(first[first.length - 1]).toEqual(second[second.length - 1]);
    expect(drop(first) - drop(second)).toBe(TRUNK_PITCH);
    expect(lane(first) - lane(second)).toBe(TRUNK_PITCH);
    const joined = layout.links.filter(({ kind, to }) => kind === 'trunk' && to === 'join:head');
    expect(joined).toHaveLength(2);
  });

  it('a device wears its name over its icon, a row is as tall as its firewall asks and the label of a firewall stands under the fans of its link', () => {
    const layout = layoutStack(WORLD, [...WHOLE_ROAD, guard('your-laptop')], 390);
    const [icon, name] = [layout.icons['device:your-laptop'], layout.labels['device:your-laptop']];
    expect(name.x).toBe(icon.x);
    expect(name.y + name.height + STOP_LABEL_RISE).toBe(doorY(layout, 'your-laptop'));
    const [bar, label] = [layout.icons['firewall:your-laptop'], layout.labels['firewall:your-laptop']];
    expect(label.y).toBe(doorY(layout, 'your-laptop') + FAN_HALF + 4);
    expect(label.x).toBeGreaterThanOrEqual(icon.x + ICON);
    expect(label.x).toBeLessThanOrEqual(bar.x);
    expect(label.x + label.width).toBeLessThanOrEqual(layout.stations[station.road('your-laptop')][0]);
    const around = layout.marks.filter(({ station: where }) => where.endsWith(':your-laptop'));
    expect(around.map(({ station: where }) => where.split(':')[0]).sort()).toEqual(['door', 'doorstep', 'firewall', 'road']);
    for (const mark of around) expect(mark.casillas, mark.station).toBe(3);
    const rows = FLOOR_ONE.map(({ anchorId }) => doorY(layout, anchorId));
    expect(rows.slice(1).map((y, index) => y - rows[index])).toEqual([158, 118, 118]);
  });

  it('a stop the line has no room for goes on the next line, which runs the other way', () => {
    const pieces = [...FLOOR_ONE, ...ROUTERS.slice(0, 2), GLOBE];
    const [wide, narrow] = [900, MIN_WIDTH].map((width) => layoutStack(WORLD, pieces, width));
    const [first, second, third] = [ROUTERS[0], ROUTERS[1], GLOBE].map(({ id }) => centerAt(narrow, id));
    expect(new Set([ROUTERS[0], ROUTERS[1], GLOBE].map(({ id }) => centerAt(wide, id)[1])).size).toBe(1);
    expect(first[0] - second[0]).toBeGreaterThanOrEqual(STOP_PITCH);
    expect((third[1] - first[1]) % LINE_PITCH).toBe(0);
    expect(third[1]).toBeGreaterThan(first[1]);
    const lines = new Set([first, second, third].map(([, y]) => y));
    expect(lines.size).toBeGreaterThan(1);
    for (const id of [ROUTERS[0].id, ROUTERS[1].id, GLOBE.id]) {
      const label = narrow.labels[id];
      expect(label.x, id).toBeGreaterThanOrEqual(OUTER);
      expect(label.x + label.width, id).toBeLessThanOrEqual(MIN_WIDTH - OUTER);
    }
    const way = wayOf(narrow, station.router(provider.id), 'internet');
    expect(way.length).toBeGreaterThan(3);
    expect(Math.max(...way.map(([x]) => x)) - Math.min(...way.map(([x]) => x))).toBeGreaterThan(STOP_PITCH);
  });

  it('the lanes hang from their bus on the side where the line comes from, with the name of the server on the far side of its icon', () => {
    const sides = [900, MIN_WIDTH].map((width) => {
      const layout = layoutStack(WORLD, [...FLOOR_ONE, ...ROUTERS, GLOBE, SERVER], width);
      const bus = pointOf(layout, 'join:servers');
      const [door, icon, label] = [layout.stations[station.door(server.id)], layout.icons[`device:${server.id}`], layout.labels[`device:${server.id}`]];
      const side = Math.sign(door[0] - bus[0]);
      expect(Math.abs(door[0] - bus[0])).toBe(SNAKE_LANE);
      expect(overlaps(icon, label)).toBe(false);
      expect(Math.sign(centerOf(label)[0] - centerOf(icon)[0])).toBe(side);
      expect(label.x).toBeGreaterThanOrEqual(SNAKE_LABEL_WALL);
      expect(label.x + label.width).toBeLessThanOrEqual(width - SNAKE_LABEL_WALL);
      return side;
    });
    expect(sides[0]).toBe(1);
    const [narrow, wide] = [MIN_WIDTH, 400].map((width) => layoutStack(OTHER_OFFICE, WITH_BRANCH, width));
    expect(narrow.stations[station.door('internet-server')][0]).toBeGreaterThan(pointOf(narrow, 'join:servers')[0]);
    expect(wide.stations[station.door('internet-server')][0]).toBeLessThan(pointOf(wide, 'join:servers')[0]);
  });

  it('draws the stations, the pieces and the marks the row draws', () => {
    const pieces = [...WHOLE_ROAD, guard('your-laptop'), piece('device', 'guest-laptop')];
    const [row, snake] = [layoutRow(WORLD, pieces, NORMAL), layoutStack(WORLD, pieces, MIN_WIDTH)];
    expect(Object.keys(row.stations).length).toBeGreaterThan(40);
    expect(Object.keys(snake.stations).sort()).toEqual(Object.keys(row.stations).sort());
    expect(snake.drawn).toEqual(row.drawn);
    expect(Object.keys(snake.icons).sort()).toEqual(Object.keys(row.icons).sort());
    expect(Object.keys(snake.labels).sort()).toEqual(Object.keys(row.labels).sort());
    expect(snake.marks.map(({ station: name }) => name).sort()).toEqual(row.marks.map(({ station: name }) => name).sort());
    expect(snake.groups.map(({ id }) => id).sort()).toEqual(row.groups.map(({ id }) => id).sort());
  });

  it('the other office stands under the first one, and its gateway above the first router, joined to it by the private link', () => {
    const layout = layoutStack(OTHER_OFFICE, WITH_BRANCH, MIN_WIDTH);
    const [first, gateway] = ['office-router', 'branch-router'].map((id) => centerAt(layout, `edge:${id}`));
    expect(gateway[0]).toBe(first[0]);
    expect(first[1] - gateway[1]).toBe(LINE_PITCH);
    expect(layout.labels['edge:branch-router'].x + layout.labels['edge:branch-router'].width).toBeLessThan(gateway[0]);
    const floors = layout.groups.filter(({ kind }) => kind === 'floor').map(({ box }) => box);
    expect(floors).toHaveLength(2);
    const [above, below] = [...floors].sort((a, b) => a.y - b.y);
    expect(below.y).toBeGreaterThan(above.y + above.height);
    expect(gateway[1] - ICON / 2 - (below.y + below.height)).toBe(BOX_GAP);
    const way = wayOf(layout, station.router('office-router'), station.router('branch-router'));
    expect(new Set(way.map(([x]) => x))).toEqual(new Set([first[0]]));
    expect(layout.links.some(({ kind }) => kind === 'private')).toBe(true);
  });

  it('the outline of the block surrounds the rows marked inside, with their names and their firewalls, and no other row', () => {
    const named = piece('device', 'your-laptop', { label: nameTag('laptop-de-la-recepcion-principal'), locked: true });
    const guarded = piece('firewall', 'marta-laptop', { label: MAP_TEXT.firewall['security-group']('servidor-de-app-01'), locked: true });
    const inside = (each: RowPiece) => (['your-laptop', 'marta-laptop'].includes(each.anchorId) && each.kind === 'device' ? { ...each, insideBlock: true } : each);
    const covers = (outline: Box, inner: Box) => inner.x >= outline.x && inner.y >= outline.y && inner.x + inner.width <= outline.x + outline.width && inner.y + inner.height <= outline.y + outline.height;
    const partsOf = (layout: RowLayout, id: string) => [`device:${id}`, `firewall:${id}`].flatMap((key) => [layout.icons[key], layout.labels[key]]).filter(Boolean);
    const outlinesOf = (layout: RowLayout) => layout.groups.filter(({ kind }) => kind === 'block').map(({ box }) => box);
    const surrounding = (layout: RowLayout, id: string) => outlinesOf(layout).filter((outline) => partsOf(layout, id).every((part) => covers(outline, part))).length;
    const touched = (layout: RowLayout, id: string) => outlinesOf(layout).filter((outline) => partsOf(layout, id).some((part) => overlaps(outline, part))).length;
    const [longName, wideFirewall] = [[named, ...WHOLE_ROAD.slice(1), guard('lucia-laptop')], [...WHOLE_ROAD, guard('lucia-laptop'), guarded]].map((pieces) => layoutStack(WORLD, pieces.map(inside), MIN_WIDTH));
    for (const layout of [longName, wideFirewall]) {
      expect(outlinesOf(layout)).toHaveLength(2);
      expect(['your-laptop', 'marta-laptop'].map((id) => surrounding(layout, id))).toEqual([1, 1]);
      expect(['lucia-laptop', 'printer'].map((id) => touched(layout, id))).toEqual([0, 0]);
    }
    expect(longName.labels['device:your-laptop'].width).toBeGreaterThan(250);
    expect(wideFirewall.labels['firewall:marta-laptop'].width).toBe(166);
  });

  it('the labels of two stops keep 8 px apart on a line, however long their names are', () => {
    const named = (id: string, name: string) => piece('edge', id, { label: nameTag(name), inOffice: id === officeRouter.id });
    const long = [named(officeRouter.id, 'router-de-la-sucursal-norte'), named(provider.id, 'router-del-proveedor-de-internet'), GLOBE];
    const layout = layoutStack(WORLD, [...FLOOR_ONE, ...long], 1440);
    const [first, second, third] = long.map(({ id }) => layout.labels[id]);
    expect(first.y).toBe(second.y);
    expect(first.x - (second.x + second.width)).toBeGreaterThanOrEqual(8);
    expect(second.x - (third.x + third.width)).toBeGreaterThanOrEqual(8);
    expect(centerAt(layout, long[0].id)[0] - centerAt(layout, long[1].id)[0]).toBeGreaterThan(STOP_PITCH);
  });

  it('the name of a device never crosses its bus, and a snake too narrow for it widens', () => {
    const wide = piece('device', 'your-laptop', { label: nameTag('laptop-de-la-recepcion-principal'), locked: true, state: 'intruded' });
    const layout = layoutStack(WORLD, [wide, ...FLOOR_ONE.slice(1), ...ROUTERS, GLOBE], MIN_WIDTH);
    const name = layout.labels[wide.id];
    expect(name.x + name.width).toBeLessThanOrEqual(layout.stations[station.road('your-laptop')][0]);
    expect(layout.size.width).toBeGreaterThan(MIN_WIDTH);
    expect(name.x + name.width).toBeLessThanOrEqual(layout.size.width - OUTER);
  });

  it('is as wide as the width it is given and no narrower than 360 px', () => {
    for (const width of [200, MIN_WIDTH, 390, 900, 1500]) expect(layoutStack(WORLD, WHOLE_ROAD, width).size.width).toBe(Math.max(width, MIN_WIDTH));
    expect(layoutStack(WORLD, WHOLE_ROAD, MIN_WIDTH).size.height).toBeGreaterThan(layoutRow(WORLD, WHOLE_ROAD, NORMAL).size.height);
  });
});
