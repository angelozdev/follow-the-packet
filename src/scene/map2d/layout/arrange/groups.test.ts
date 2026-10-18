import { describe, expect, it } from 'vitest';
import { nameTag } from '@/copy';
import type { Network } from '@/engine';
import type { Point } from '@/scene/map2d/layout/graph';
import { OFFICE_FLOORS, lab03Net, officeTwoFloorsNet } from '@/testing';
import { BOX_GAP, CAPTION, GROUP_PAD, ICON, ROW_HEIGHT, TRUNK_LEAD, type Box, type Group, type PieceKind, type RowPiece } from './geometry';
import { floorsOf, shownParts, stackFloors, trunkLane, trunkOf, type BusSpan, type StackSpec } from './groups';
import { classify } from './pieces';

const piece = (kind: PieceKind, anchorId: string, extras: Partial<RowPiece> = {}): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label: nameTag(anchorId), locked: false, state: 'normal', ...extras });

const FLOORS = officeTwoFloorsNet();
const { floor1, floor2 } = OFFICE_FLOORS;
const devicePieces = (...ids: string[]) => ids.map((id) => piece('device', id));
const FLOOR_1 = devicePieces('your-laptop', 'lucia-laptop', 'marta-laptop', 'printer');
const BOTH_FLOORS = [...FLOOR_1, ...devicePieces('andres-laptop')];
const SPEC: StackSpec = { top: 16, left: 16, right: 470, busX: 400, floorRight: 414, outer: { id: 'office', kind: 'office', name: [] }, inside: new Set() };

const stackOf = (pieces: RowPiece[], extras: Partial<StackSpec> = {}, world: Network = FLOORS) => {
  const floors = floorsOf(world, classify(world, pieces).devices);
  return { floors, stack: stackFloors(floors, { ...SPEC, ...extras }) };
};
const groupsOf = (groups: Group[], kind: Group['kind']) => groups.filter((group) => group.kind === kind);
const iconAt = (y: number): Box => ({ x: 0, y: y - ICON / 2, width: ICON, height: ICON });
const inside = (inner: Box, outer: Box) => inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;

describe('floorsOf', () => {
  it('lays out one column per LAN that has a drawn piece', () => {
    const { floors, stack } = stackOf(BOTH_FLOORS);
    expect(floors.map(({ id }) => id)).toEqual([floor1.id, floor2.id]);
    const [first, second] = groupsOf(stack.groups, 'floor');
    expect([first.id, second.id]).toEqual([floor1.id, floor2.id]);
    expect(first.box.y).toBeLessThan(second.box.y);
    for (const id of ['your-laptop', 'lucia-laptop', 'marta-laptop', 'printer']) expect(inside(iconAt(stack.rows[id]), { ...first.box, x: 0, width: ICON }), id).toBe(true);
    expect(inside(iconAt(stack.rows['andres-laptop']), { ...second.box, x: 0, width: ICON })).toBe(true);
    expect(stackOf(devicePieces('andres-laptop')).floors.map(({ id }) => id)).toEqual([floor2.id]);
    expect(stackOf(devicePieces('your-laptop')).floors.map(({ id }) => id)).toEqual([floor1.id]);
  });

  it('a floor with no drawn piece has no box and no name', () => {
    const { floors, stack } = stackOf([...devicePieces('andres-laptop'), piece('edge', OFFICE_FLOORS.officeRouter.id)]);
    expect(floors.map(({ id }) => id)).toEqual([floor2.id]);
    expect(stack.groups.map(({ id }) => id)).toEqual([floor2.id]);
    expect(stackOf([piece('edge', OFFICE_FLOORS.officeRouter.id)]).stack.groups).toEqual([]);
  });

  it('gives each floor the name of its LAN and the block of IPs of its LAN, and an office with no floors the block of the world', () => {
    const { floors } = stackOf(BOTH_FLOORS);
    expect(floors.map(({ name }) => name)).toEqual([
      [{ text: floor1.name }, { text: floor1.cidr, term: 'cidr' }],
      [{ text: floor2.name }, { text: floor2.cidr, term: 'cidr' }],
    ]);
    const vpc = lab03Net();
    const { floors: subnets } = stackOf([piece('device', 'servidor1')], {}, vpc);
    expect(subnets).toMatchObject([{ id: 'subnet-a', kind: 'subnet', name: [{ text: 'subnet-a', term: 'vpc' }, { text: '172.31.16.0/20', term: 'cidr' }] }]);
  });

  it('the name of a floor shows its block only when cidr is known', () => {
    const [floor] = stackOf(devicePieces('your-laptop')).floors;
    expect(shownParts(floor.name, new Set())).toEqual([floor1.name]);
    expect(shownParts(floor.name, new Set(['cidr']))).toEqual([floor1.name, floor1.cidr]);
    expect(shownParts(floor.name, new Set(['router']))).toEqual([floor1.name]);
  });
});

describe('stackFloors', () => {
  it('puts a box under each floor, with a gap between boxes, and the box of the office around them when there are two or more', () => {
    const { stack } = stackOf(BOTH_FLOORS);
    const [office] = groupsOf(stack.groups, 'office');
    const [first, second] = groupsOf(stack.groups, 'floor').map(({ box }) => box);
    expect(second.y - (first.y + first.height)).toBe(BOX_GAP);
    expect(first.height).toBe(GROUP_PAD + CAPTION + 4 * ROW_HEIGHT + GROUP_PAD);
    expect(second.height).toBe(GROUP_PAD + CAPTION + ROW_HEIGHT + GROUP_PAD);
    expect(office.box).toEqual({ x: SPEC.left, y: SPEC.top, width: SPEC.right - SPEC.left, height: GROUP_PAD + CAPTION + first.height + BOX_GAP + second.height + GROUP_PAD });
    expect(first.x).toBe(office.box.x + GROUP_PAD);
    expect(first.x + first.width).toBe(SPEC.floorRight);
    expect(first.y).toBe(office.box.y + GROUP_PAD + CAPTION);
    const alone = stackOf(FLOOR_1).stack.groups;
    expect(alone.map(({ id, kind }) => [id, kind])).toEqual([[floor1.id, 'floor']]);
    expect(alone[0].box).toMatchObject({ x: SPEC.left, y: SPEC.top, width: SPEC.right - SPEC.left });
  });

  it('a subnet always stands inside the box of its VPC, even a lone one', () => {
    const vpc = lab03Net();
    const { stack } = stackOf([piece('device', 'servidor1')], { outer: { id: 'vpc', kind: 'vpc', name: [] } }, vpc);
    expect(stack.groups.map(({ id, kind }) => [id, kind])).toEqual([
      ['vpc', 'vpc'],
      ['subnet-a', 'subnet'],
    ]);
  });

  it('every row of a floor is 100 px tall, one under the other, and the bus spans from the first row to the last', () => {
    const { stack } = stackOf(BOTH_FLOORS);
    const centers = FLOOR_1.map(({ anchorId }) => stack.rows[anchorId]);
    expect(centers.map((y, index) => y - (centers[index - 1] ?? y))).toEqual([0, ROW_HEIGHT, ROW_HEIGHT, ROW_HEIGHT]);
    const [first, second] = stack.buses;
    expect(first).toEqual({ id: floor1.id, x: SPEC.busX, top: centers[0], bottom: centers[3] });
    expect(second).toEqual({ id: floor2.id, x: SPEC.busX, top: stack.rows['andres-laptop'], bottom: stack.rows['andres-laptop'] });
    expect(stack.center).toBe((centers[0] + stack.rows['andres-laptop']) / 2);
  });

  it('a device that is not connected stands outside the boxes', () => {
    const { stack } = stackOf([...FLOOR_1, ...devicePieces('guest-laptop', 'andres-laptop')]);
    const boxes = stack.groups.map(({ box }) => box);
    const lowest = Math.max(...boxes.map(({ y, height }) => y + height));
    expect(stack.rows['guest-laptop'] - ICON / 2).toBeGreaterThan(lowest);
    expect(boxes.some((box) => inside(iconAt(stack.rows['guest-laptop']), { ...box, x: 0, width: ICON }))).toBe(false);
    expect(stack.bottom).toBe(stack.rows['guest-laptop'] + ROW_HEIGHT / 2);
    expect(stack.rows['your-laptop']).toBeLessThan(lowest);
  });

  it('the size of the office does not depend on what is drawn on it', () => {
    const [whole, pair, single] = [BOTH_FLOORS, devicePieces('your-laptop', 'lucia-laptop'), devicePieces('your-laptop')].map((pieces) => stackOf(pieces).stack);
    expect(whole.rows['lucia-laptop'] - whole.rows['your-laptop']).toBe(ROW_HEIGHT);
    expect(pair.rows['lucia-laptop'] - pair.rows['your-laptop']).toBe(ROW_HEIGHT);
    const box = (stack: typeof whole) => groupsOf(stack.groups, 'floor')[0].box;
    expect(box(single).height).toBe(GROUP_PAD + CAPTION + ROW_HEIGHT + GROUP_PAD);
    expect(box(pair).height).toBe(box(single).height + ROW_HEIGHT);
    expect(box(pair).width).toBe(box(single).width);
  });
});

describe('the outline of the block', () => {
  const marked = (id: string): RowPiece => piece('device', id, { insideBlock: true });
  const row = (...ids: [string, boolean][]) => {
    const pieces = ids.map(([id, isInside]) => (isInside ? marked(id) : piece('device', id)));
    const inside = new Set(pieces.filter((each) => each.insideBlock).map(({ anchorId }) => anchorId));
    return stackOf(pieces, { inside }).stack;
  };
  const blocks = (stack: ReturnType<typeof row>) => groupsOf(stack.groups, 'block').map(({ box }) => box);

  it('the outline of the block surrounds exactly the rows marked inside and no other row', () => {
    const stack = row(['your-laptop', true], ['lucia-laptop', false], ['marta-laptop', true], ['printer', false]);
    const surrounded = Object.keys(stack.rows).filter((id) => blocks(stack).some((block) => inside({ ...iconAt(stack.rows[id]), x: block.x + 1 }, block)));
    expect(surrounded).toEqual(['your-laptop', 'marta-laptop']);
    expect(blocks(stack)).toHaveLength(2);
    expect(row(['your-laptop', false]).groups.filter(({ kind }) => kind === 'block')).toEqual([]);
  });

  it('the rows marked next to each other share one outline', () => {
    const stack = row(['your-laptop', true], ['lucia-laptop', true], ['marta-laptop', false], ['printer', false]);
    expect(blocks(stack)).toHaveLength(1);
    expect(blocks(stack)[0].y).toBeLessThan(stack.rows['your-laptop'] - ICON / 2);
    expect(blocks(stack)[0].y + blocks(stack)[0].height).toBeGreaterThan(stack.rows['lucia-laptop'] + ICON / 2);
    expect(blocks(stack)[0].y + blocks(stack)[0].height).toBeLessThan(stack.rows['marta-laptop'] - ICON / 2);
  });

  it('the outline grows when a piece is marked inside and shrinks when it is not', () => {
    const heightOf = (...flags: boolean[]) => blocks(row(['your-laptop', flags[0]], ['lucia-laptop', flags[1]], ['marta-laptop', false])).reduce((total, block) => total + block.height, 0);
    const one = heightOf(true, false);
    const two = heightOf(true, true);
    expect(two).toBe(one + ROW_HEIGHT);
    expect(heightOf(true, false)).toBe(one);
    expect(heightOf(false, false)).toBe(0);
  });

  it('draws no outline for a world drawn with nothing marked, and keeps the place of everything else', () => {
    const plain = row(['your-laptop', false], ['lucia-laptop', false]);
    const outlined = row(['your-laptop', true], ['lucia-laptop', false]);
    expect({ ...outlined, groups: outlined.groups.filter(({ kind }) => kind !== 'block') }).toEqual(plain);
  });

  it('a mark never joins two floors: the outline of a floor stops at its own box', () => {
    const pieces = [marked('printer'), marked('andres-laptop')];
    const stack = stackOf(pieces, { inside: new Set(['printer', 'andres-laptop']) }).stack;
    expect(blocks(stack)).toHaveLength(2);
  });
});

describe('trunkOf', () => {
  const span = (id: string, top: number, bottom: number): BusSpan => ({ id, x: 400, top, bottom });
  const HEAD: Point = [444, 300];

  it('with several floors the trunks run in parallel, 8 px apart, and join at the head', () => {
    const lanes = [0, 1].map((index) => trunkLane(index, 2, HEAD[1]));
    expect(lanes).toEqual([HEAD[1] - 4, HEAD[1] + 4]);
    const above = trunkOf(span('upper', 100, 250), lanes[0], HEAD);
    const below = trunkOf(span('lower', 340, 380), lanes[1], HEAD);
    expect(above.leave).toEqual([400, 250]);
    expect(below.leave).toEqual([400, 340]);
    expect(above.bends).toEqual([[400 + TRUNK_LEAD, 250], [400 + TRUNK_LEAD, lanes[0]], [HEAD[0], lanes[0]]]);
    expect(below.bends).toEqual([[400 + TRUNK_LEAD, 340], [400 + TRUNK_LEAD, lanes[1]], [HEAD[0], lanes[1]]]);
  });

  it('a lone floor whose bus reaches the line leaves straight along it, and a trunk that starts on its lane has no bend but the one that meets the head', () => {
    expect(trunkLane(0, 1, HEAD[1])).toBe(HEAD[1]);
    expect(trunkOf(span('only', 200, 400), HEAD[1], HEAD)).toEqual({ leave: [400, 300], bends: [] });
    expect(trunkOf(span('only', 200, 400), HEAD[1] - 4, HEAD)).toEqual({ leave: [400, 296], bends: [[HEAD[0], 296]] });
  });
});
