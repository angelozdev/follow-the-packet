import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { facesALan, isClientActor, simulate, type Network } from '@/engine';
import { INCIDENTS, startWorld } from '@/levels';
import { COMPACT, NORMAL, fanBox, type Box, type Mark, type PieceKind, type RowLayout, type RowPiece } from '@/scene/map2d/layout/arrange/geometry';
import { layoutRow } from '@/scene/map2d/layout/arrange/row';
import { layoutStack } from '@/scene/map2d/layout/arrange/stack';
import { LINE_END, startsOnMap, station, stationsFor } from '@/scene/map2d/layout/stations';
import { actor, device, officeTwoFloorsNet, officeWithNames, ping } from '@/testing';
import { collisions, type Entry } from './collisions';
import type { PlacedTag } from './packet-tags';
import { fanStamps, type Fan, type StampSource } from './stamp-fan';

const boxAt = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
const stampsOf = (count: number, prefix = 's'): StampSource[] => Array.from({ length: count }, (_, index) => ({ id: `${prefix}${index + 1}`, problem: false, send: index + 1 }));
const markAt = (stationName: string, point: [number, number], casillas = 3): Mark => ({ station: stationName, point, axis: 'y', casillas });
const tagAt = (id: string, box: Box): PlacedTag => ({ id, at: [box.x + box.width / 2, box.y + box.height / 2], box, clear: true });
const pairsOf = (found: ReturnType<typeof collisions>) => found.map(({ first, second }) => [first.kind, first.id, second.kind, second.id]);

describe('collisions', () => {
  const layout = { labels: { 'device:lucia': boxAt(60, 62, 100, 20) }, icons: {} };

  it('collisions lists a stamp over a label and ignores two stamps of one fan', () => {
    const fans = fanStamps({ place: stampsOf(3) }, [markAt('place', [100, 100])]);
    const [fan] = fans;
    const [first, second] = fan.stamps;
    expect(first.box.y + first.box.height).toBeGreaterThan(second.box.y);
    expect(pairsOf(collisions(layout, fans, []))).toEqual([['label', 'device:lucia', 'stamp', 's1']]);
    expect(collisions({ labels: {}, icons: {} }, fans, [])).toEqual([]);
  });

  it('lists a stamp over the stamp of another fan, a stamp that strays from its own fan and boxes over one another', () => {
    const near = fanStamps({ a: stampsOf(1, 'a'), b: stampsOf(1, 'b') }, [markAt('a', [100, 100]), markAt('b', [100, 120])]);
    expect(pairsOf(collisions({ labels: {}, icons: {} }, near, []))).toEqual([['stamp', 'a1', 'stamp', 'b1']]);
    const apart = fanStamps({ a: stampsOf(1, 'a'), b: stampsOf(1, 'b') }, [markAt('a', [100, 100]), markAt('b', [100, 136])]);
    expect(collisions({ labels: {}, icons: {} }, apart, [])).toEqual([]);
    const [fan] = fanStamps({ a: stampsOf(2, 'a') }, [markAt('a', [100, 100])]);
    const strayed: Fan = { ...fan, box: boxAt(88, 90, 24, 24) };
    expect(collisions({ labels: {}, icons: {} }, [strayed], []).map(({ first, second }) => [first.id, second.id])).toEqual([['a1', 'a2']]);
    const found = collisions({ labels: { piece: boxAt(0, 0, 100, 20) }, icons: { piece: boxAt(90, 0, 40, 40) } }, [], [tagAt('one', boxAt(100, 30, 60, 20)), tagAt('two', boxAt(150, 40, 60, 20)), tagAt('three', boxAt(160, 50, 60, 20))]);
    expect(pairsOf(found)).toEqual([
      ['label', 'piece', 'icon', 'piece'],
      ['icon', 'piece', 'tag', 'one'],
      ['tag', 'one', 'tag', 'two'],
      ['tag', 'two', 'tag', 'three'],
    ]);
  });

  it('does not list boxes that only touch, and says which fan a stamp belongs to', () => {
    const fans = fanStamps({ place: stampsOf(1) }, [markAt('place', [100, 100])]);
    expect(collisions({ labels: { right: boxAt(118, 82, 50, 36) }, icons: { below: boxAt(82, 118, 36, 20) } }, fans, [tagAt('above', boxAt(82, 62, 36, 20))])).toEqual([]);
    const over: Entry[] = collisions({ labels: { inside: boxAt(90, 90, 10, 10) }, icons: {} }, fans, []).flatMap(({ first, second }) => [first, second]);
    expect(over).toEqual([
      { kind: 'label', id: 'inside' },
      { kind: 'stamp', id: 's1', fan: 'place' },
    ]);
    const crowded = fanStamps({ place: stampsOf(4) }, [markAt('place', [100, 100])]);
    const onTheMore = collisions({ labels: { low: boxAt(90, 130, 20, 10) }, icons: {} }, crowded, []);
    expect(onTheMore.flatMap(({ first, second }) => [first, second])).toEqual([
      { kind: 'label', id: 'low' },
      { kind: 'stamp', id: 'more:place', fan: 'place' },
    ]);
  });

  it('lists the name of a group, when the layout has it, between the icons and the stamps, and lists nothing for a layout that has none', () => {
    const fans = fanStamps({ place: stampsOf(1) }, [markAt('place', [100, 100])]);
    const captions = { floor: boxAt(60, 82, 120, 18) };
    expect(pairsOf(collisions({ labels: { piece: boxAt(150, 90, 20, 20) }, icons: { piece: boxAt(170, 84, 40, 40) }, captions }, fans, []))).toEqual([
      ['label', 'piece', 'caption', 'floor'],
      ['icon', 'piece', 'caption', 'floor'],
      ['caption', 'floor', 'stamp', 's1'],
    ]);
    expect(collisions({ labels: {}, icons: {}, captions: { floor: boxAt(60, 20, 120, 18) } }, fans, [tagAt('over', boxAt(100, 24, 36, 20))]).map(({ first, second }) => [first.kind, second.kind])).toEqual([['caption', 'tag']]);
    expect(collisions({ labels: {}, icons: {} }, fans, [])).toEqual([]);
  });
});

const piece = (kind: PieceKind, anchorId: string, label: RowPiece['label'] = nameTag(anchorId), inOffice = false): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label, locked: false, state: 'normal', inOffice });

function everythingOf(world: Network): RowPiece[] {
  const routers = world.routers ?? [];
  const guards = world.firewalls.flatMap((firewall) => world.devices.filter(({ firewallIds }) => firewallIds.includes(firewall.id)).slice(0, 1).map(({ id }) => piece('firewall', id, MAP_TEXT.firewall[firewall.kind](firewall.name))));
  return [
    ...world.devices.map(({ id }) => piece('device', id)),
    ...world.actors.map((actor) => piece(isClientActor(actor) ? 'actor' : 'device', actor.id)),
    ...guards,
    ...routers.map((router) => piece('edge', router.id, nameTag(router.name), facesALan(world, router))),
    ...(routers.length === 0 ? [piece('edge', 'edge', MAP_TEXT.edge[world.edge])] : []),
    piece('internet', 'internet', MAP_TEXT.internet),
  ];
}

const BRANCH_OFFICE = startWorld(INCIDENTS, '02-07');
const BRANCH_PIECES = [
  ...['your-laptop', 'branch-printer', 'branch-laptop', 'internet-server'].map((id) => piece('device', id)),
  ...['office-router', 'branch-router'].map((id) => piece('edge', id, nameTag(id), true)),
  piece('edge', 'provider-router'),
  piece('internet', 'internet', MAP_TEXT.internet),
];
const SCENES: { world: Network; pieces: RowPiece[] }[] = [
  ...[...INCIDENTS.map(({ id }) => startWorld(INCIDENTS, id)), officeTwoFloorsNet(), officeWithNames()].map((world) => ({ world, pieces: everythingOf(world) })),
  { world: BRANCH_OFFICE, pieces: BRANCH_PIECES },
];
const LAID_OUT = SCENES.flatMap(({ world, pieces }) => [layoutRow(world, pieces, NORMAL), layoutRow(world, pieces, COMPACT), layoutStack(world, pieces, 390), layoutStack(world, pieces, 900)].map((layout) => ({ world, layout })));
const LAYOUTS: RowLayout[] = LAID_OUT.map(({ layout }) => layout);

const fullFans = (layout: RowLayout): Fan[] => fanStamps(Object.fromEntries(layout.marks.map(({ station: place, casillas }) => [place, stampsOf(casillas + 1, `${place}#`)])), layout.marks);
const placeOf = (entry: Entry) => entry.fan ?? '';

const KNOWN_LIMITS = {
  sharedTrunk: (layout: RowLayout, place: string) => place.startsWith('mid:bus:') && new Set(Object.values(layout.drawn.devices)).size > 1,
  laneBus: (layout: RowLayout, place: string) => /^mid:(door:|.*-door:|.*-line-end$)/.test(place) || place === LINE_END || [...layout.drawn.servers, ...layout.drawn.clients].map(station.door).includes(place),
  busEndAgainstRoad: (_: RowLayout, place: string, other: string) => [place, other].sort().join(' ').startsWith('bus-end:') && [place, other].some((name) => name.startsWith('road:')),
};
const limitOf = (layout: RowLayout, first: string, second: string) =>
  [first, second].some((place) => KNOWN_LIMITS.sharedTrunk(layout, place))
    ? 'sharedTrunk'
    : KNOWN_LIMITS.laneBus(layout, first) && KNOWN_LIMITS.laneBus(layout, second)
      ? 'laneBus'
      : KNOWN_LIMITS.busEndAgainstRoad(layout, first, second)
        ? 'busEndAgainstRoad'
        : undefined;

describe('the fans of the registered worlds', () => {
  const found = LAYOUTS.map((layout) => ({ layout, clashes: collisions(layout, fullFans(layout), []) }));

  it('fills every mark of every map with a full fan, so the sweeps below are not empty', () => {
    expect(LAYOUTS.length).toBeGreaterThan(100);
    for (const layout of LAYOUTS) {
      const fans = fullFans(layout);
      expect(fans).toHaveLength(layout.marks.length);
      expect(fans.every(({ more }) => more !== undefined)).toBe(true);
    }
    expect(found.every(({ layout }) => collisions(layout, [], []).length === 0)).toBe(true);
  });

  it('every place where a ping can end has a mark, so a stamp never has to be dropped', () => {
    let ends = 0;
    for (const { world, layout } of LAID_OUT) {
      const addresses = new Set([...world.devices.flatMap(({ privateIp, publicIp }) => [privateIp, publicIp ?? privateIp]), ...world.actors.map(({ ip }) => ip), ...(world.routers ?? []).flatMap(({ interfaces }) => interfaces.map(({ ip }) => ip)), '8.8.8.8', '127.0.0.1']);
      const senders = [...world.devices.map(({ id }) => device(id)), ...world.actors.map(({ id }) => actor(id))];
      const marked = new Set(layout.marks.map(({ station: place }) => place));
      for (const from of senders) {
        for (const address of addresses) {
          const packet = ping(from, address);
          if (!startsOnMap(packet, layout.drawn)) continue;
          for (const hiddenStop of [false, true]) {
            const stops = stationsFor(simulate(world, packet), packet, layout.drawn, { hiddenStop });
            const namesAnUndrawnBar = stops.some((stop) => stop.startsWith('firewall:') && !marked.has(stop));
            if (stops.length === 0 || namesAnUndrawnBar) continue;
            ends++;
            expect(marked.has(stops[stops.length - 1]), `${from.id} to ${address}: ${stops.join(' ')}`).toBe(true);
          }
        }
      }
    }
    expect(ends).toBeGreaterThan(1000);
  });

  it('two stamps of different marks of one link never come closer than their own boxes', () => {
    const between = found.flatMap(({ layout, clashes }) => clashes.filter(({ first, second }) => first.kind === 'stamp' && second.kind === 'stamp' && first.fan !== second.fan).map(({ first, second }) => ({ layout, first, second })));
    expect(between.length).toBeGreaterThan(0);
    const strays = between.filter(({ layout, first, second }) => limitOf(layout, placeOf(first), placeOf(second)) === undefined);
    expect(strays.slice(0, 8).map(({ first, second }) => `${placeOf(first)} / ${placeOf(second)}`)).toEqual([]);
  });

  it('a full fan covers no label and no icon, but at the marks that M4 exempts', () => {
    const covered = found.flatMap(({ layout, clashes }) => clashes.filter(({ first, second }) => first.kind !== 'stamp' || second.kind !== 'stamp').map(({ first, second }) => ({ layout, first, second })));
    expect(covered.length).toBeGreaterThan(0);
    const strays = covered.filter(({ layout, first, second }) => ![first, second].some((entry) => entry.kind === 'stamp' && KNOWN_LIMITS.sharedTrunk(layout, placeOf(entry))));
    expect(strays.slice(0, 8).map(({ first, second }) => `${first.kind} ${first.id} / ${second.kind} ${second.id}`)).toEqual([]);
  });

  it('collisions reports each of the three places that M4 exempts, and no other', () => {
    const seen = new Set(found.flatMap(({ layout, clashes }) => clashes.filter(({ first, second }) => first.kind === 'stamp' && second.kind === 'stamp' && first.fan !== second.fan).map(({ first, second }) => limitOf(layout, placeOf(first), placeOf(second)))));
    expect([...seen].sort()).toEqual(['busEndAgainstRoad', 'laneBus', 'sharedTrunk']);
    expect(fanBox([0, 0], 'y', 3).height).toBe(86);
  });
});
