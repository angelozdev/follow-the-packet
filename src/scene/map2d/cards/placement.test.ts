import { describe, expect, it } from 'vitest';
import { MAP_TEXT, nameTag } from '@/copy';
import { facesALan, isClientActor, type Network } from '@/engine';
import { fanBox, type Box, type PieceKind, type RowPiece } from '@/scene/map2d/layout/arrange/geometry';
import type { Point } from '@/scene/map2d/layout/graph';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { crowds } from '@/scene/map2d/marks/boxes';
import { lab03Net, officeNet, officeTwoFloorsNet, officeWithNames } from '@/testing';
import { CARD_WIDTH, LABEL_REACH, TITLE_BAR, cardPlacement, cardSpan, cardTop, dockHeight, dockOffset, dockRoom, reachPoints, sideHeight, terminalSide, type CardPlacement, type CardPosition } from './placement';

interface MapSize {
  window: string;
  width: number;
  height: number;
}

interface Hazard {
  name: string;
  box: Box;
}

const MAPS: MapSize[] = [
  { window: '1280×800', width: 900, height: 800 },
  { window: '1440×900', width: 1060, height: 900 },
];
const FULL_HD: MapSize = { window: '1920×1080', width: 1540, height: 1080 };
const TERMINAL_HEIGHT = { office: 321, yours: 468, home: 495 };
const DOCK_MARGIN = 6;
const FEET = 16;
const ROOM_UNDER_THE_DRAWING = 200 + DOCK_MARGIN + FEET;
const piece = (kind: PieceKind, anchorId: string, label: RowPiece['label'] = nameTag(anchorId)): RowPiece => ({ id: `${kind}:${anchorId}`, kind, anchorId, label, locked: false, state: 'normal' });
const YOUR_LAPTOP = piece('device', 'your-laptop');
const HOME = piece('actor', 'attacker');

function piecesOf(net: Network, outside: boolean): RowPiece[] {
  const routers = net.routers ?? [];
  const guards = net.firewalls.flatMap(({ id, name, kind }) => net.devices.filter(({ firewallIds }) => firewallIds.includes(id)).slice(0, 1).map((owner) => piece('firewall', owner.id, MAP_TEXT.firewall[kind](name))));
  const way = routers.length > 0 ? routers.map((router) => ({ ...piece('edge', router.id, nameTag(router.name)), inOffice: facesALan(net, router) })) : [piece('edge', 'edge', MAP_TEXT.edge[net.edge])];
  const strangers = net.actors.map((actor) => piece(isClientActor(actor) ? 'actor' : 'device', actor.id, nameTag(actor.name)));
  const outer = outside ? [...way, piece('internet', 'internet', MAP_TEXT.internet), ...strangers] : [];
  return [...net.devices.map(({ id }) => piece('device', id)), ...guards, ...outer];
}

function terminalOnMap(net: Network, outside: boolean, container: MapSize, origin: RowPiece, spare = 0) {
  const pieces = piecesOf(net, outside);
  const layout = layoutMap(net, pieces, { width: container.width });
  const map = { ...container, height: Math.max(container.height, layout.size.height + TITLE_BAR + spare) };
  const shift: Point = [(map.width - layout.size.width) / 2, TITLE_BAR];
  const moved = (box: Box): Box => ({ ...box, x: box.x + shift[0], y: box.y + shift[1] });
  const placement = cardPlacement(origin, pieces.filter(({ id }) => id !== origin.id), layout);
  const anchor: Point = [placement.anchor[0] + shift[0], placement.anchor[1] + shift[1]];
  const labels: Hazard[] = Object.entries(layout.labels).map(([id, box]) => ({ name: `${id} label`, box: moved(box) }));
  const stamps: Hazard[] = layout.marks.map(({ station, point, axis, casillas }) => ({ name: `stamp ${station}`, box: moved(fanBox(point, axis, casillas)) }));
  const side = terminalSide(anchor[0], (placement.avoid ?? []).map((x) => x + shift[0]), map.width, placement.gap);
  const room = dockRoom(placement.pieces.map(({ x, bottom }) => ({ x: x + shift[0], bottom: bottom + shift[1] })), map);
  const cardFor = (position: CardPosition, height: number): Box => {
    if (position === 'dock') {
      const [toLeft, toBottom] = dockOffset(anchor, map);
      return { x: anchor[0] + toLeft, y: anchor[1] + toBottom - height, width: CARD_WIDTH, height };
    }
    const tall = Math.min(height, sideHeight(map));
    const lowest = map.height - DOCK_MARGIN - tall;
    const top = Math.min(Math.max(anchor[1] - tall / 2, anchor[1] + cardTop(anchor)), lowest);
    return { x: cardSpan(position, anchor[0], placement.gap)[0], y: top, width: CARD_WIDTH, height: tall };
  };
  const touchedBy = (position: CardPosition, height: number, among = [...labels, ...stamps]) => among.filter(({ box }) => crowds(cardFor(position, height), box)).map(({ name }) => name);
  const labelsTouched = (position: CardPosition, height: number) => touchedBy(position, height, labels);
  const fits = (position: CardPosition, height: number) => {
    const { x, y, width, height: tall } = cardFor(position, height);
    return x >= 0 && y >= 0 && x + width <= map.width && y + tall <= map.height && touchedBy(position, height).length === 0;
  };
  const dockedHeight = (height: number) => Math.min(height, room ?? dockHeight(map));
  return { map, side, anchor, placement, room, cardFor, touchedBy, labelsTouched, fits, dockedHeight };
}

describe('the terminal card in the office with no outside drawn', () => {
  const office = { ...officeNet(), actors: [] };
  const { office: tall } = TERMINAL_HEIGHT;

  it.each(MAPS)('at $window it opens to the left of tu-laptop: inside the map, clear of every label and every possible stamp', (size) => {
    const scene = terminalOnMap(office, false, size, YOUR_LAPTOP);
    const card = scene.cardFor(scene.side, tall);
    expect(scene.side).toBe('right');
    expect(card.x).toBeGreaterThan(scene.anchor[0]);
    expect(card.x + card.width).toBeLessThanOrEqual(size.width);
    expect(card.y).toBeGreaterThanOrEqual(0);
    expect(card.y + card.height).toBeLessThanOrEqual(scene.map.height);
    expect(scene.labelsTouched(scene.side, tall)).toEqual([]);
    expect(scene.placement.gap).toBeLessThan(CARD_WIDTH);
  });

  it.each(MAPS)('at $window the right side, where a card opens today, would cover the laptop-lucia and the impresora', (size) => {
    const scene = terminalOnMap(office, false, size, YOUR_LAPTOP);
    expect(scene.side).not.toBe('left');
    expect(scene.labelsTouched('left', tall)).toEqual(expect.arrayContaining(['device:your-laptop label', 'device:lucia-laptop label']));
  });
});

describe('the terminal card in the office with the outside drawn', () => {
  const origins = [
    { name: 'tu-laptop', origin: YOUR_LAPTOP, tall: TERMINAL_HEIGHT.yours },
    { name: 'Casa de Lucía', origin: HOME, tall: TERMINAL_HEIGHT.home },
  ];
  const cases = origins.flatMap((each) => MAPS.map((map) => ({ ...each, map })));
  const dockedOnes = cases.filter(({ map, name }) => name === 'tu-laptop' || map.width > MAPS[0].width);

  it.each(cases)('at $map.window, for $name, no side is clear, so the terminal docks in the bottom left corner of the map', ({ map, origin, tall }) => {
    const scene = terminalOnMap(officeNet(), true, map, origin);
    const card = scene.cardFor(scene.side, tall);
    expect(scene.fits('left', tall) || scene.fits('right', tall)).toBe(false);
    expect(scene.side).toBe('dock');
    expect(card).toMatchObject({ x: DOCK_MARGIN, width: CARD_WIDTH });
    expect(card.y + card.height).toBe(scene.map.height - DOCK_MARGIN);
    expect(card.y).toBeGreaterThan(0);
  });

  it.each(dockedOnes)('at $map.window, for $name, the docked terminal covers no label and no possible stamp', ({ map, origin, tall }) => {
    const scene = terminalOnMap(officeNet(), true, map, origin);
    expect(scene.side).toBe('dock');
    expect(scene.touchedBy('dock', scene.dockedHeight(tall))).toEqual([]);
  });

  it('at 1280×800 the terminal of Casa de Lucía, 495 px tall because its title takes two lines, is 6 px too tall for the free strip: it covers the bottom of the lost stamps and no label', () => {
    const scene = terminalOnMap(officeNet(), true, MAPS[0], HOME);
    const { home } = TERMINAL_HEIGHT;
    expect(scene.room).toBeLessThan(home);
    expect(scene.labelsTouched(scene.side, home).length).toBeGreaterThan(0);
    expect(scene.touchedBy(scene.side, scene.dockedHeight(home))).toEqual([]);
  });

  it('at 1920×1080 the terminal of Casa de Lucía does not open to its left, where it would cover the label of the house: it docks', () => {
    const scene = terminalOnMap(officeNet(), true, FULL_HD, HOME);
    const { home } = TERMINAL_HEIGHT;
    expect(scene.labelsTouched('left', home).length).toBeGreaterThan(0);
    expect(scene.side).toBe('dock');
    expect(scene.touchedBy('dock', scene.dockedHeight(home))).toEqual([]);
  });

  it('a map too narrow to hold the card keeps the side with more room', () => {
    const narrow = CARD_WIDTH + 10;
    expect(terminalSide(narrow / 3, [], narrow, 68)).toBe('right');
  });
});

describe('the room of a card docked in the corner', () => {
  const roomUnder = (lowest: number, map = { height: 800 }) => map.height - DOCK_MARGIN - lowest - FEET;
  const standing = (x: number, bottom: number) => ({ x, bottom });

  it('is the height from the corner up to the feet of the lowest piece that the card spans', () => {
    expect(dockRoom([standing(220, 380), standing(100, 300)], { height: 800 })).toBe(roomUnder(380));
    expect(dockRoom([standing(20, 450)], { height: 900 })).toBe(roomUnder(450, { height: 900 }));
  });

  it('ignores a piece that stands beside the card, out of its span', () => {
    const beside = standing(600, 700);
    expect(dockRoom([beside, standing(100, 300)], { height: 800 })).toBe(roomUnder(300));
    expect(dockRoom([beside], { height: 800 })).toBeNull();
  });

  it('never leaves less than a card that can be used, whatever the window', () => {
    expect(dockRoom([standing(100, 700)], { height: 800 })).toBe(200);
  });

  it('is, with no piece above the card, the height of the map less the margin at its top and at its bottom, and never less than a card that can be used', () => {
    expect([dockHeight({ height: 800 }), dockHeight({ height: 120 })]).toEqual([800 - 2 * DOCK_MARGIN, 200]);
  });

  it.each(MAPS)('at $window a terminal docked in the map where 01-10 draws the road takes a height that covers no label', (size) => {
    const scene = terminalOnMap(officeTwoFloorsNet(), true, size, piece('device', 'your-laptop'), ROOM_UNDER_THE_DRAWING);
    expect(scene.side).toBe('dock');
    expect(scene.room).not.toBeNull();
    expect(scene.labelsTouched('dock', scene.dockedHeight(TERMINAL_HEIGHT.yours))).toEqual([]);
  });
});

describe('where a card opens', () => {
  const GAP = 68;
  const opens = (name: string, anchorX: number, avoidXs: number[], room: number, expected: CardPosition) => ({ name, anchorX, avoidXs, room, expected });
  const OPENS = [
    opens('the side with more room when both are clear', 600, [], 900, 'left'),
    opens('the other side when the one with more room covers a label', 450, [700], 900, 'left'),
    opens('the dock when both sides cover a label', 450, [300, 700], 900, 'dock'),
    opens('the dock when the side with more room covers a label and the other leaves the map', 200, [350], 900, 'dock'),
    opens('the dock when neither side stays inside the map', 300, [], 600, 'dock'),
  ];

  it.each(OPENS)('a terminal takes $name', ({ anchorX, avoidXs, room, expected }) => {
    expect(terminalSide(anchorX, avoidXs, room, GAP)).toBe(expected);
  });

  it('a docked card hangs its bottom left corner from the bottom left corner of the map, whatever the height of the card', () => {
    const anchor: Point = [400, 250];
    const [toLeft, toBottom] = dockOffset(anchor, { width: 900, height: 800 });
    expect([anchor[0] + toLeft, anchor[1] + toBottom]).toEqual([DOCK_MARGIN, 800 - DOCK_MARGIN]);
  });

  it('a card beside its anchor may rise up to the title bar of the map and no higher, whatever its height', () => {
    const [low, high]: Point[] = [[400, 250], [400, 30]];
    expect([low[1] + cardTop(low), high[1] + cardTop(high)]).toEqual([TITLE_BAR, TITLE_BAR]);
  });

  it('a card beside its anchor may be as tall as the map between its title bar and its bottom margin, and never less than a docked card may be', () => {
    expect([sideHeight({ height: 800 }), sideHeight({ height: 120 })]).toEqual([800 - TITLE_BAR - DOCK_MARGIN, 200]);
  });

  it('the card of a firewall keeps its wide gap and its width, and only the screen decides its side', () => {
    const net = lab03Net();
    const layout = layoutMap(net, piecesOf(net, true), { width: 900 });
    const placement = cardPlacement({ id: 'firewall:servidor2', kind: 'firewall' }, [{ id: 'device:servidor1' }], layout);
    expect(placement).toMatchObject({ gap: 110, avoid: null });
    expect(CARD_WIDTH).toBe(300);
  });

  it('the card of a firewall docks, like a terminal, when neither side stays inside a map as narrow as a phone', () => {
    expect([terminalSide(195, [], 390, 110), terminalSide(600, [], 900, 110)]).toEqual(['dock', 'left']);
  });

  it('every card knows the label and the foot of every piece it may cover when it docks, a firewall card included', () => {
    const net = lab03Net();
    const pieces = piecesOf(net, true);
    const layout = layoutMap(net, pieces, { width: 900 });
    const firewall = pieces.find(({ kind }) => kind === 'firewall') as RowPiece;
    const terminal = piece('device', 'servidor2');
    const guard = cardPlacement(firewall, pieces.filter(({ id }) => id !== firewall.id), layout);
    const opened = cardPlacement(terminal, pieces.filter(({ id }) => id !== terminal.id), layout);
    const byPlace = (list: CardPlacement['pieces']) => [...list].sort((a, b) => a.x - b.x || a.bottom - b.bottom);
    expect(guard.pieces.length).toBeGreaterThanOrEqual(pieces.length);
    expect(byPlace(guard.pieces)).toEqual(byPlace(opened.pieces));
    expect(opened.avoid?.length).toBeGreaterThanOrEqual(pieces.length);
  });
});

describe('the cards of the placement against the boxes of the layout', () => {
  const SCENES: { net: Network; outside: boolean }[] = [
    { net: officeNet(), outside: true },
    { net: lab03Net(), outside: true },
    { net: officeTwoFloorsNet(), outside: true },
    { net: officeWithNames(), outside: true },
    { net: { ...officeNet(), actors: [] }, outside: false },
  ];
  const WIDE = [768, 900, 1060, 1280, 1440];
  const TALL = TERMINAL_HEIGHT.yours;
  const origins = SCENES.flatMap((scene) => piecesOf(scene.net, scene.outside).filter(({ kind }) => kind !== 'firewall').map((origin) => ({ ...scene, origin })));

  it('a card opens on the side with more room and never covers a label', () => {
    let opened = 0;
    for (const { net, outside, origin } of origins) {
      for (const width of WIDE) {
        const scene = terminalOnMap(net, outside, { window: `${width}`, width, height: 900 }, origin);
        if (scene.side === 'dock') continue;
        const [preferred, other]: CardPosition[] = scene.anchor[0] * 2 > width ? ['left', 'right'] : ['right', 'left'];
        const wrong = scene.side === other && scene.fits(preferred, TALL);
        expect(wrong, `${origin.id} at ${width}`).toBe(false);
        expect(scene.labelsTouched(scene.side, TALL), `${origin.id} at ${width}`).toEqual([]);
        opened++;
      }
    }
    expect(opened).toBeGreaterThan(20);
  });

  it('a card docks in the corner when neither side keeps it inside the map', () => {
    for (const { net, outside, origin } of origins) {
      const scene = terminalOnMap(net, outside, { window: '390', width: 390, height: 900 }, origin);
      expect(scene.side, origin.id).toBe('dock');
      expect(scene.cardFor('dock', TALL)).toMatchObject({ x: DOCK_MARGIN, width: CARD_WIDTH });
    }
    expect(terminalSide(150, [], CARD_WIDTH + 2 * DOCK_MARGIN - 1, 70)).toBe('right');
    expect(terminalSide(150, [], CARD_WIDTH + 2 * DOCK_MARGIN, 70)).toBe('dock');
  });

  it('the card of a firewall keeps its wide gap and its width', () => {
    const net = officeTwoFloorsNet();
    const guard = piece('firewall', 'your-laptop');
    const pieces = [...piecesOf(net, true), guard];
    const placement = cardPlacement(guard, pieces, layoutMap(net, pieces, { width: 1280 }));
    const [near, far] = cardSpan('right', placement.anchor[0], placement.gap);
    expect(placement.avoid).toBeNull();
    expect([placement.gap, near - placement.anchor[0], far - near]).toEqual([110, 110, CARD_WIDTH]);
  });

  it('a card keeps clear of the whole box of a label wider than twice the reach, and not only of its middle', () => {
    const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });
    const layout = {
      labels: { 'device:a': box(20, 110, 50, 20), wide: box(190, 400, 230, 20) },
      icons: { 'device:a': box(296, 100, 48, 48), wide: box(100, 390, 48, 48) },
      marks: [],
    };
    const placement = cardPlacement({ id: 'device:a', kind: 'device' }, [{ id: 'wide' }], layout);
    const [near, far] = cardSpan('right', placement.anchor[0], placement.gap);
    expect(near).toBeGreaterThan(190 + 230 / 2 + LABEL_REACH);
    expect(near).toBeLessThan(190 + 230);
    expect(far).toBeLessThan(900 - 12);
    expect(terminalSide(placement.anchor[0], placement.avoid ?? [], 900, placement.gap)).toBe('dock');
  });

  it('feeds the labels as wide as they are: a name wider than twice the reach is covered by several places', () => {
    expect(reachPoints({ x: 100, width: 101 })).toEqual([150.5]);
    expect(reachPoints({ x: 100, width: 128 })).toEqual([164]);
    expect(reachPoints({ x: 100, width: 170 })).toEqual([164, 206]);
    const wide = reachPoints({ x: 0, width: 300 });
    expect([wide[0], wide.at(-1)]).toEqual([LABEL_REACH, 300 - LABEL_REACH]);
    expect(wide.every((x, index) => index === 0 || x - wide[index - 1] <= 2 * LABEL_REACH)).toBe(true);
  });

  it('the places of a label cover all of its box, whatever its width', () => {
    for (let width = 1; width <= 400; width += 7) {
      const points = reachPoints({ x: 30, width });
      for (let x = 30; x <= 30 + width; x += 1) expect(points.some((point) => Math.abs(point - x) <= LABEL_REACH), `${width} at ${x}`).toBe(true);
    }
  });
});
