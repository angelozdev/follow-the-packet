import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, device, officeTwoFloorsNet, ping, tcp } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES, mapRun, mapRunWithPorts, type MapRunFixture } from '@/testing/map-pieces';
import { graphOf } from '@/scene/layout/arrange/assemble';
import { lengthOf, positionAt, route, type Point } from '@/scene/layout/graph';
import { layoutMap } from '@/scene/layout/map-layout';
import { stationsFor } from '@/scene/layout/stations';
import { crowds } from './boxes';
import { fanStamps, stampsByPlace } from './stamp-fan';
import { GLYPH_BOX, REPLY_MARK_DISTANCE, stillPackets, type StillPacket } from './still-packets';

const WORLD = officeTwoFloorsNet();
const LAYOUT = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 1280 });
const { floor1, officeRouter, server } = OFFICE_FLOORS;
const YOU = device('your-laptop');
const SHIFT = 12;
const NAT_FIRST_LEG = 'TCP 51514 → 80';
const NAT_SECOND_LEG = 'TCP 40001 → 80';

const toLucia = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.lucia), id, extras);
const toNobody = (id: string, extras: Partial<MapRunFixture> = {}) => mapRun(WORLD, ping(YOU, floor1.nobody), id, extras);
const toItself = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, floor1.you, 80), id);
const toTheServer = (id: string) => mapRunWithPorts(WORLD, tcp(YOU, server.ip, 80), id, officeRouter.id);

function draw(runs: readonly MapRunFixture[], layout = LAYOUT): StillPacket[] {
  return stillPackets(runs, layout, fanStamps(stampsByPlace(runs, layout.drawn), layout.marks));
}

function pathOf(run: MapRunFixture, layout = LAYOUT): Point[] {
  return route(graphOf(layout), stationsFor(run.trace, run.packet, layout.drawn, { hiddenStop: run.hiddenStop }));
}

const along = (path: readonly Point[], distance: number): Point => positionAt(path, lengthOf(path), distance);
const lengthOfPath = (path: readonly Point[]) => lengthOf(path).at(-1) ?? 0;
const glyphOf = (packet: StillPacket, role: string) => packet.glyphs.find((glyph) => glyph.role === role);

describe('stillPackets', () => {
  it('gives each packet that starts on the map the path of its stations and its shape halfway', () => {
    const runs = [toLucia('to-lucia'), toNobody('to-nobody')];
    const packets = draw(runs);
    expect(packets.map(({ id }) => id)).toEqual(['to-lucia', 'to-nobody']);
    runs.forEach((run, index) => {
      const path = pathOf(run);
      expect(packets[index].path).toEqual(path);
      expect(glyphOf(packets[index], 'going')?.point).toEqual(along(path, lengthOfPath(path) / 2));
    });
  });

  it('leaves out a packet that starts at a piece the map does not draw', () => {
    const fromThePrinter = mapRun(WORLD, ping(device('printer'), floor1.lucia), 'from-the-printer');
    expect(draw([fromThePrinter, toLucia('to-lucia')]).map(({ id }) => id)).toEqual(['to-lucia']);
  });

  it('draws the shape of the protocol of each packet and tells how its run ends', () => {
    const blocked = toLucia('blocked', { replied: false, reached: false, blocked: true });
    const packets = draw([toLucia('answered'), blocked, toNobody('lost')]);
    expect(packets.map(({ end }) => end)).toEqual(['replied', 'blocked', 'lost']);
    expect(packets.map((packet) => glyphOf(packet, 'going')?.variant)).toEqual(['echo-request', 'echo-request', 'echo-request']);
    const tcpPacket = draw([toTheServer('nat')])[0];
    expect(glyphOf(tcpPacket, 'going')?.variant).toBe('tcp-request');
  });

  it('marks an intruder on its shape and never on a warning', () => {
    const [intruder, warned] = draw([toLucia('intruder', { intruder: true }), toLucia('warned', { replied: false, intruder: true, warning: { term: 'time-exceeded', by: 'router' } })]);
    expect(glyphOf(intruder, 'going')?.intruder).toBe(true);
    expect(glyphOf(intruder, 'answer')?.intruder).toBe(true);
    expect(glyphOf(warned, 'going')?.intruder).toBe(true);
    expect(glyphOf(warned, 'answer')).toMatchObject({ variant: 'warning', intruder: false });
  });

  it('puts the ring of the protocol near the start of a packet that was answered and nothing near the start of one that was not', () => {
    const answered = toLucia('answered');
    const [packet, lost] = draw([answered, toNobody('lost')]);
    const path = pathOf(answered);
    expect(glyphOf(packet, 'answer')).toMatchObject({ variant: 'echo-reply', point: along(path, REPLY_MARK_DISTANCE) });
    expect(lost.glyphs.map(({ role }) => role)).toEqual(['going']);
  });

  it('puts no ring near the start of a packet that arrived and was not answered, a refused connection for example', () => {
    const refused = mapRun(WORLD, tcp(YOU, floor1.lucia, 3000), 'refused');
    expect(refused.reached).toBe(true);
    expect(refused.replied).toBe(false);
    expect(draw([refused])[0].glyphs.map(({ role }) => role)).toEqual(['going']);
  });

  it('draws every shape in a box of 40 px and puts the ring 24 px from the start of a long path', () => {
    const answered = toLucia('answered');
    const path = pathOf(answered);
    const [packet] = draw([answered]);
    expect(GLYPH_BOX).toBe(40);
    expect(packet.glyphs.map(({ box }) => [box.width, box.height])).toEqual([[40, 40], [40, 40]]);
    expect(glyphOf(packet, 'answer')?.point).toEqual(along(path, 24));
  });

  it('puts the ring a quarter of the way along a path shorter than four rings', () => {
    const own = mapRun(WORLD, ping(YOU, floor1.you), 'own');
    const path = pathOf(own);
    expect(lengthOfPath(path)).toBeLessThan(4 * REPLY_MARK_DISTANCE);
    expect(glyphOf(draw([own])[0], 'answer')?.point).toEqual(along(path, lengthOfPath(path) / 4));
  });

  it('draws the warning of a router coming back near the start of the path and the warning of the sender\'s own device at the end of it, without a shape halfway', () => {
    const fromARouter = toNobody('router', { warning: { term: 'time-exceeded', by: 'router' } });
    const fromTheSender = toNobody('sender', { warning: { term: 'host-unreachable', by: 'sender' } });
    const [router, sender] = draw([fromARouter, fromTheSender]);
    expect(router.end).toBe('warned');
    expect(router.glyphs.map(({ role, variant }) => [role, variant])).toEqual([['going', 'echo-request'], ['answer', 'warning']]);
    expect(sender.end).toBe('self-warned');
    expect(sender.glyphs.map(({ role, variant }) => [role, variant])).toEqual([['appears', 'warning']]);
    const path = pathOf(fromTheSender);
    expect(sender.glyphs[0].point).toEqual(along(path, lengthOfPath(path)));
  });

  it('moves a shape that falls on the point of another 12 px along its own path', () => {
    const first = toLucia('first');
    const [one, two] = draw([first, toLucia('second')]);
    const path = pathOf(first);
    const middle = lengthOfPath(path) / 2;
    expect(glyphOf(one, 'going')?.point).toEqual(along(path, middle));
    expect(glyphOf(two, 'going')?.point).toEqual(along(path, middle + SHIFT));
    expect(glyphOf(two, 'answer')?.point).toEqual(along(path, REPLY_MARK_DISTANCE + SHIFT));
  });

  it('gives every shape a box of its own size around its point', () => {
    for (const { glyphs } of draw([toLucia('to-lucia'), toNobody('to-nobody')])) {
      for (const { point, box } of glyphs) expect(box).toEqual({ x: point[0] - GLYPH_BOX / 2, y: point[1] - GLYPH_BOX / 2, width: GLYPH_BOX, height: GLYPH_BOX });
    }
  });

  it('gives no label to a packet with no ports', () => {
    expect(draw([toLucia('to-lucia'), toNobody('to-nobody')]).map(({ label }) => label)).toEqual([undefined, undefined]);
  });

  it('the label of a packet is the one of the leg where the packet stands', () => {
    const [nat] = draw([toTheServer('nat')]);
    const path = pathOf(toTheServer('nat'));
    const router = LAYOUT.stations['router:router-office'];
    const routerAt = lengthOf(path)[path.findIndex(([x, y]) => x === router[0] && y === router[1])];
    expect(routerAt).toBeGreaterThan(lengthOfPath(path) / 2);
    expect(nat.label?.text).toBe(NAT_FIRST_LEG);

    const nearer = { ...LAYOUT, stations: { ...LAYOUT.stations, 'router:router-office': LAYOUT.stations['road:your-laptop'] } };
    const [translated] = draw([toTheServer('nat')], nearer);
    expect(translated.label?.text).toBe(NAT_SECOND_LEG);

    const [stays] = draw([mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000), 'inside')]);
    expect(stays.label?.text).toBe('TCP 51514 → 3000');
  });

  it('sizes the box of a label as the text of the leg where the packet stands', () => {
    const [nat] = draw([toTheServer('nat')]);
    const [first, second] = [NAT_FIRST_LEG, NAT_SECOND_LEG].map((text) => text.length);
    expect(first).toBe(second);
    const box = nat.label?.place?.box;
    expect(box?.width).toBe(Math.ceil(NAT_FIRST_LEG.length * 7.2) + 14);
    expect(box?.height).toBe(20);
  });

  it('keeps every label clear of every shape, its own included', () => {
    const runs = [toTheServer('nat'), toLucia('to-lucia'), toNobody('to-nobody'), mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000), 'inside'), mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3001), 'inside-again')];
    const packets = draw(runs);
    const boxes = packets.flatMap(({ glyphs }) => glyphs.map(({ box }) => box));
    const placed = packets.flatMap(({ label }) => (label?.place ? [label.place] : []));
    expect(placed).toHaveLength(3);
    for (const { box, clear } of placed) {
      expect(clear).toBe(true);
      expect(boxes.filter((glyph) => crowds(box, glyph))).toEqual([]);
    }
  });

  it('keeps every label inside the drawing, also where the link of its packet runs along an edge of it', () => {
    const narrow = layoutMap(WORLD, FLOORS_LABEL_PIECES, { width: 360 });
    const runs = [mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000), 'inside'), mapRunWithPorts(WORLD, tcp(YOU, floor1.marta, 3306), 'other'), toTheServer('nat')];
    const [inside] = draw([runs[0]], narrow);
    const crowded = draw(runs, narrow);
    const boxes = [inside, ...crowded].flatMap(({ label }) => (label?.place ? [label.place.box] : []));
    expect(boxes.length).toBeGreaterThan(3);
    for (const { x, y, width, height } of boxes) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + width).toBeLessThanOrEqual(narrow.size.width);
      expect(y + height).toBeLessThanOrEqual(narrow.size.height);
    }
    expect(draw(runs, narrow).flatMap(({ label }) => (label?.place ? [label.place.clear] : []))).not.toContain(false);
  });

  it('leaves out the label of a packet whose stamp went into a «+N», and keeps its text for the list', () => {
    const runs = Array.from({ length: 5 }, (_, index) => mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000 + index), `run-${index + 1}`));
    const fans = fanStamps(stampsByPlace(runs, LAYOUT.drawn), LAYOUT.marks);
    const hidden = new Set(fans.flatMap((fan) => fan.hidden));
    expect(hidden.size).toBe(3);
    const packets = stillPackets(runs, LAYOUT, fans);
    expect(packets.filter(({ label }) => label?.place === undefined).map(({ id }) => id)).toEqual(runs.map(({ id }) => id).filter((id) => hidden.has(id)));
    expect(packets.every(({ label }) => label?.text.startsWith('TCP 51514 → 300'))).toBe(true);
  });

  it('says a label stays in its device when the last station of its packet is its doorstep, and not when the packet failed on the road', () => {
    const blocked = mapRunWithPorts(WORLD, tcp(YOU, floor1.lucia, 3000), 'blocked', undefined, { reached: false, blocked: true });
    const [itself, onTheRoad] = draw([toItself('itself'), blocked]);
    expect(itself.label?.staysInDevice).toBe(true);
    expect(onTheRoad.label?.staysInDevice).toBe(false);
  });

  it('leaves out the label of a packet that never leaves its device when no place clears it, and every other label keeps its place', () => {
    const crowd = Array.from({ length: 10 }, (_, index) => mapRunWithPorts(WORLD, tcp(YOU, floor1.you, 80 + index), `itself-${index + 1}`));
    const packets = draw([...crowd, toTheServer('nat')]);
    const gone = packets.filter(({ label }) => label !== undefined && label.place === undefined);
    expect(gone.length).toBeGreaterThan(0);
    expect(gone.every(({ label }) => label?.staysInDevice)).toBe(true);
    expect(packets.find(({ id }) => id === 'nat')?.label?.place?.clear).toBe(true);
  });
});
