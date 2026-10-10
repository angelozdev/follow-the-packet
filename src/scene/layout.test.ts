import { OrthographicCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, withDevice, withInbound } from '@/testing';
import type { Firewall } from '@/engine';
import type { MapPieceKind } from './overlay/piece-label';
import { simulate } from '@/engine/simulation/simulate';
import {
  CAMERA_ZOOM,
  CARD_WIDTH,
  LABEL_REACH,
  cameraPosition,
  cardAnchorPosition,
  cardPlacement,
  cardSpan,
  computeLayout,
  cumulativeLengths,
  dockOffset,
  labelPosition,
  layoutCenter,
  pathFor,
  pathLength,
  pointAt,
  roundTrip,
  sideForNdc,
  spreadStamps,
  terminalSide,
  type CardPosition,
  type Layout,
  type Vec2,
  type Vec3,
} from './layout';

const S2 = { private: '172.31.38.97', public: '34.244.254.100' };

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net(), true);

  it('puts one column per subnet and each instance inside its own', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.devices.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.devices.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the firewall and the road sit in front of the device (greater z, toward the camera)', () => {
    const spot = layout.devices.servidor2;
    expect(spot.firewall[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.firewall[1]);
  });

  it('the edge, then the internet, then the actors sit on the left of the sheet, and the road starts at the edge', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
    expect(layout.roadFromX).toBe(layout.edge[0]);
  });
});

describe('computeLayout for an office', () => {
  const layout = computeLayout(officeNet(), true);
  const spots = ['your-laptop', 'lucia-laptop', 'printer'].map((id) => layout.devices[id]);

  it('puts every device in one row on the sheet, with no subnet', () => {
    expect(layout.subnets).toEqual({});
    expect(spots.map((spot) => spot.z)).toEqual([spots[0].z, spots[0].z, spots[0].z]);
    expect(spots[0].x).toBeLessThan(spots[1].x);
    expect(spots[1].x).toBeLessThan(spots[2].x);
    for (const spot of spots) expect(Math.abs(spot.x)).toBeLessThan(layout.sheet.width / 2);
  });

  it('puts the router, the internet and the actor on the left, like a VPC', () => {
    expect(layout.edge[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.internet[0]).toBeLessThan(layout.edge[0]);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.internet[0]);
  });

  it('without the outside, the road stays on the sheet and the camera looks at the sheet only', () => {
    const inside = computeLayout(officeNet(), false);
    expect(inside.roadFromX).toBeGreaterThan(-inside.sheet.width / 2);
    expect(layoutCenter(inside)).toEqual([0, 0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net, true);

  it('step 3: ends at the firewall of servidor2', () => {
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.firewall);
  });

  it('step 5: reaches the door of servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(device('servidor1'), S2.private);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.devices.servidor2.door);
  });

  it('a ping from the internet to a public IP crosses the internet and the edge before the firewall', () => {
    const packet = ping(actor('attacker'), S2.public);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet, layout.edge, layout.devices.servidor2.road, layout.devices.servidor2.firewall]);
  });

  it('a private IP from the internet is lost in the internet, before the edge', () => {
    const packet = ping(actor('attacker'), S2.private);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([layout.actors.attacker, layout.internet]);
  });
});

describe('pathFor in an office', () => {
  const net = officeNet();
  const layout = computeLayout(net, true);
  const you = layout.devices['your-laptop'];

  it('a ping to its own IP stays at its own doorstep: it never reaches its firewall or the road', () => {
    const packet = ping(device('your-laptop'), OFFICE.you);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([you.door, you.doorstep]);
    expect(you.doorstep[1]).toBeLessThan(you.firewall[1]);
  });

  it('a ping to an IP that no device has runs to the far end of the road and stops there', () => {
    const packet = ping(device('your-laptop'), OFFICE.nobody);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path).toEqual([you.door, you.firewall, you.road, [layout.roadToX, layout.roadZ]]);
  });

  it('a ping between two laptops runs along the road from one door to the other', () => {
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const lucia = layout.devices['lucia-laptop'];
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('a ping from the internet to a private IP of the office is lost in the internet, before the router', () => {
    const packet = ping(actor('attacker'), OFFICE.you);
    expect(pathFor(simulate(net, packet), packet, layout)).toEqual([layout.actors.attacker, layout.internet]);
  });

  it('while the map does not show the outside, a packet never travels to the edge it does not draw', () => {
    const alone = { ...net, actors: [] };
    const inside = computeLayout(alone, false);
    const packet = ping(device('your-laptop'), '8.8.8.8');
    const path = pathFor(simulate(alone, packet), packet, inside);
    expect(path).not.toContainEqual(inside.edge);
    expect(path.at(-1)).toEqual(inside.devices['your-laptop'].road);
  });
});

describe('pathFor when a firewall the player does not know stops the packet', () => {
  const base = officeNet();
  const layout = computeLayout(base, true);
  const you = layout.devices['your-laptop'];
  const lucia = layout.devices['lucia-laptop'];
  const outbound: Firewall = { id: 'fw-you', name: 'your-laptop', kind: 'host-firewall', inbound: [], outbound: [] };

  it('ends at the door of the device that guards the way in, where a delivered packet ends, and not in front of the firewall', () => {
    const guarded = withDevice(base, 'lucia-laptop', { firewallIds: ['fw-lucia'] });
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const trace = simulate(guarded, packet);
    expect(pathFor(trace, packet, layout).at(-1)).toEqual(lucia.firewall);
    expect(pathFor(trace, packet, layout, true)).toEqual([you.door, you.firewall, you.road, lucia.road, lucia.firewall, lucia.door]);
  });

  it('stays at the doorstep of the device that guards the way out, as a packet to its own IP does', () => {
    const guarded = withDevice({ ...base, firewalls: [outbound] }, 'your-laptop', { firewallIds: ['fw-you'] });
    const packet = ping(device('your-laptop'), OFFICE.lucia);
    const trace = simulate(guarded, packet);
    expect(pathFor(trace, packet, layout)).toEqual([you.door, you.firewall]);
    expect(pathFor(trace, packet, layout, true)).toEqual([you.door, you.doorstep]);
  });

  it('changes nothing for a packet that no firewall stopped', () => {
    const packet = ping(device('your-laptop'), OFFICE.nobody);
    const trace = simulate(base, packet);
    expect(pathFor(trace, packet, layout, true)).toEqual(pathFor(trace, packet, layout));
  });
});

describe('path interpolation', () => {
  it('pointAt walks the segments in order', () => {
    const path: [number, number][] = [[0, 0], [2, 0], [2, 2]];
    const lengths = cumulativeLengths(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(pointAt(path, lengths, 1)).toEqual([1, 0]);
    expect(pointAt(path, lengths, 3)).toEqual([2, 1]);
    expect(pointAt(path, lengths, 99)).toEqual([2, 2]);
  });
});

describe('anchors', () => {
  const layout = computeLayout(lab03Net(), true);

  it('the camera looks at the middle of everything drawn, actors included', () => {
    const [x] = layoutCenter(layout);
    const left = Math.min(...Object.values(layout.actors).map(([actorX]) => actorX));
    expect(x - left).toBeCloseTo(layout.sheet.width / 2 - x);
  });

  it('a Security Group label sits in front of its firewall, and a device label above it', () => {
    const spot = layout.devices.servidor2;
    expect(labelPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.firewall[1]);
    expect(labelPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition({ kind: 'firewall', anchorId: 'servidor2' }, layout)[0]).toBe(spot.firewall[0]);
  });

  it('a card can open beside a device or an actor too', () => {
    const [x, , z] = cardAnchorPosition({ kind: 'actor', anchorId: 'attacker' }, layout);
    expect([x, z]).toEqual(layout.actors.attacker);
    expect(cardAnchorPosition({ kind: 'device', anchorId: 'servidor2' }, layout)[0]).toBe(layout.devices.servidor2.x);
  });

  it('the internet label floats above the internet', () => {
    const [x, y, z] = labelPosition({ kind: 'internet', anchorId: 'internet' }, layout);
    expect([x, z]).toEqual(layout.internet);
    expect(y).toBeGreaterThan(1);
  });

  it('a card opens on the side of the screen with more room', () => {
    expect(sideForNdc(0.4)).toBe('left');
    expect(sideForNdc(-0.4)).toBe('right');
  });
});

interface MapSize {
  window: string;
  width: number;
  height: number;
}

interface Hazard {
  name: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

type Piece = { kind: MapPieceKind; anchorId: string };

const STAMP_RADIUS = 16;
const STAMP_HEIGHT = 0.9;
const LABEL_HALF_HEIGHT = 11;
const MAPS: MapSize[] = [
  { window: '1280×800', width: 900, height: 800 },
  { window: '1440×900', width: 1060, height: 900 },
];
const YOUR_LAPTOP: Piece = { kind: 'device', anchorId: 'your-laptop' };
const HOME: Piece = { kind: 'actor', anchorId: 'attacker' };
const TERMINAL_HEIGHT = { office: 321, yours: 468, home: 495 };

function boxAround(name: string, [x, y]: Vec2, halfWidth: number, halfHeight: number): Hazard {
  return { name, x0: x - halfWidth, x1: x + halfWidth, y0: y - halfHeight, y1: y + halfHeight };
}

function hits(a: Hazard, b: Hazard): boolean {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
}

function terminalOnMap(net: ReturnType<typeof officeNet>, outside: boolean, map: MapSize, origin: Piece) {
  const layout: Layout = computeLayout(net, outside);
  const camera = new OrthographicCamera(-map.width / 2, map.width / 2, map.height / 2, -map.height / 2, 0.1, 500);
  const [cx, cz] = layoutCenter(layout);
  camera.zoom = CAMERA_ZOOM;
  camera.position.set(...cameraPosition(layout));
  camera.lookAt(cx, 0, cz);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const pixel = (point: Vec3): Vec2 => {
    const { x, y } = new Vector3(...point).project(camera);
    return [((x + 1) / 2) * map.width, ((1 - y) / 2) * map.height];
  };
  const pieces: Piece[] = [
    ...net.devices.map((other) => ({ kind: 'device' as const, anchorId: other.id })),
    ...(outside ? [{ kind: 'edge' as const, anchorId: 'edge' }, { kind: 'internet' as const, anchorId: 'internet' }, ...net.actors.map((other) => ({ kind: 'actor' as const, anchorId: other.id }))] : []),
  ];
  const others = pieces.filter((piece) => piece.anchorId !== origin.anchorId);
  const placement = cardPlacement(origin, others, layout);
  const anchor = pixel(placement.position);
  const labels = [...others, origin].map((other) => boxAround(`${other.anchorId} label`, pixel(labelPosition(other, layout)), LABEL_REACH, LABEL_HALF_HEIGHT));
  const senders = [device('your-laptop'), ...(outside ? [actor('attacker')] : [])];
  const ends = senders.flatMap((from) =>
    [OFFICE.printer, OFFICE.lucia, OFFICE.nobody, OFFICE.you].map((address) => {
      const packet = ping(from, address);
      const path = pathFor(simulate(net, packet), packet, layout);
      return path[path.length - 1];
    }),
  );
  const stamps = spreadStamps(ends).map(([x, z], index) => boxAround(`stamp ${index + 1}`, pixel([x, STAMP_HEIGHT, z]), STAMP_RADIUS, STAMP_RADIUS));
  const side = terminalSide(anchor[0], (placement.avoid ?? []).map((point) => pixel(point)[0]), map.width, placement.gap);
  const cardAt = (position: CardPosition, height: number): Hazard => {
    if (position === 'dock') {
      const [dx, dy] = dockOffset(anchor, map);
      return { name: 'card', x0: anchor[0] + dx, x1: anchor[0] + dx + CARD_WIDTH, y0: anchor[1] + dy - height, y1: anchor[1] + dy };
    }
    const [near, far] = cardSpan(position, anchor[0], placement.gap);
    return { name: 'card', x0: near, x1: far, y0: anchor[1] - height / 2, y1: anchor[1] + height / 2 };
  };
  const covered = (position: CardPosition, height: number) => [...labels, ...stamps].filter((hazard) => hits(cardAt(position, height), hazard)).map(({ name }) => name);
  const clearOf = (position: CardPosition, height: number) => {
    const card = cardAt(position, height);
    return card.x0 >= 0 && card.x1 <= map.width && card.y0 >= 0 && card.y1 <= map.height && covered(position, height).length === 0;
  };
  return { side, anchor, placement, cardAt, covered, clearOf };
}

describe('the terminal card in the office of 01-01 and 01-02', () => {
  const office = { ...officeNet(), actors: [] };
  const { office: height } = TERMINAL_HEIGHT;

  it.each(MAPS)('at $window it opens to the left of tu-laptop: inside the map, clear of every label and every possible stamp', (map) => {
    const { side, anchor, placement, cardAt, covered } = terminalOnMap(office, false, map, YOUR_LAPTOP);
    const card = cardAt(side, height);
    expect(side).toBe('left');
    expect(Math.min(card.x0, card.y0)).toBeGreaterThanOrEqual(0);
    expect(card.x1).toBeLessThanOrEqual(map.width);
    expect(card.y1).toBeLessThanOrEqual(map.height);
    expect(card.x1).toBeLessThan(anchor[0] - LABEL_REACH);
    expect(covered(side, height)).toEqual([]);
    expect(placement.gap).toBeLessThan(CARD_WIDTH);
  });

  it.each(MAPS)('at $window the right side, where a card opens today, would cover the laptop-lucia and the impresora', (map) => {
    const { covered } = terminalOnMap(office, false, map, YOUR_LAPTOP);
    expect(covered('right', height)).toEqual(expect.arrayContaining(['lucia-laptop label', 'printer label']));
  });
});

describe('the terminal card with the outside drawn (01-03)', () => {
  const origins = [
    { name: 'tu-laptop', origin: YOUR_LAPTOP, height: TERMINAL_HEIGHT.yours },
    { name: 'Casa de Lucía', origin: HOME, height: TERMINAL_HEIGHT.home },
  ];
  const cases = MAPS.flatMap((map) => origins.map((origin) => ({ map, ...origin })));

  it.each(cases)('at $map.window, for $name, no side is clear, so the terminal docks in the bottom left corner of the map', ({ map, origin, height }) => {
    const { side, cardAt, clearOf } = terminalOnMap(officeNet(), true, map, origin);
    const card = cardAt(side, height);
    expect((['left', 'right'] as const).filter((position) => clearOf(position, height))).toEqual([]);
    expect(side).toBe('dock');
    expect([card.x0, card.x1]).toEqual([6, 6 + CARD_WIDTH]);
    expect(card.y1).toBe(map.height - 6);
    expect(card.y0).toBeGreaterThan(0);
  });

  it.each(cases.filter(({ map, name }) => map.width > 900 || name === 'tu-laptop'))('at $map.window, for $name, the docked terminal covers no label and no possible stamp', ({ map, origin, height }) => {
    const { side, covered } = terminalOnMap(officeNet(), true, map, origin);
    expect(covered(side, height)).toEqual([]);
  });

  it('at 1280×800 the terminal of Casa de Lucía, 495 px tall because its title takes two lines, is 6 px too tall for the free strip: it covers the bottom of the lost stamps and no label', () => {
    const [map] = MAPS;
    const { side, covered } = terminalOnMap(officeNet(), true, map, HOME);
    const names = covered(side, TERMINAL_HEIGHT.home);
    expect(names.filter((name) => name.endsWith('label'))).toEqual([]);
    expect(names.filter((name) => name.startsWith('stamp'))).not.toEqual([]);
  });

  it('at 1920×1080 the terminal of Casa de Lucía does not open to its left, where it would cover the label of the house: it docks', () => {
    const { side, covered } = terminalOnMap(officeNet(), true, { window: '1920×1080', width: 1540, height: 1080 }, HOME);
    expect(covered('left', TERMINAL_HEIGHT.home)).toContain('attacker label');
    expect(side).toBe('dock');
    expect(covered(side, TERMINAL_HEIGHT.home)).toEqual([]);
  });

  it('a map too narrow to hold the card keeps the side with more room', () => {
    expect(terminalSide(100, [], CARD_WIDTH + 10, 68)).toBe('right');
  });
});

describe('where a card opens', () => {
  const GAP = 68;

  it.each([
    { name: 'the side with more room when both are clear', anchorX: 600, avoidXs: [], room: 900, expected: 'left' },
    { name: 'the other side when the one with more room covers a label', anchorX: 450, avoidXs: [700], room: 900, expected: 'left' },
    { name: 'the dock when both sides cover a label', anchorX: 450, avoidXs: [300, 700], room: 900, expected: 'dock' },
    { name: 'the dock when the side with more room covers a label and the other leaves the map', anchorX: 200, avoidXs: [350], room: 900, expected: 'dock' },
    { name: 'the dock when neither side stays inside the map', anchorX: 300, avoidXs: [], room: 600, expected: 'dock' },
  ] satisfies { name: string; anchorX: number; avoidXs: number[]; room: number; expected: CardPosition }[])('a terminal takes $name', ({ anchorX, avoidXs, room, expected }) => {
    expect(terminalSide(anchorX, avoidXs, room, GAP)).toBe(expected);
  });

  it('a docked card hangs its bottom left corner from the bottom left corner of the map, whatever the height of the card', () => {
    expect(dockOffset([400, 250], { width: 900, height: 800 })).toEqual([-394, 544]);
  });

  it('the card of a firewall keeps its wide gap and its width, and only the screen decides its side', () => {
    const placement = cardPlacement({ kind: 'firewall', anchorId: 'servidor2' }, [{ kind: 'device', anchorId: 'servidor1' }], computeLayout(lab03Net(), true));
    expect(placement).toMatchObject({ gap: 110, avoid: null });
    expect(CARD_WIDTH).toBe(300);
  });
});

describe('paths and stamps', () => {
  it('a round trip goes and comes back along the same points', () => {
    expect(roundTrip([[0, 0], [2, 0], [2, 2]])).toEqual([[0, 0], [2, 0], [2, 2], [2, 0], [0, 0]]);
    expect(pathLength([[0, 0], [3, 0], [3, 4]])).toBe(7);
  });

  it('stamps on the same point spread apart along the screen, the rest stay', () => {
    const [a, b, c] = spreadStamps([[1, 1], [1, 1], [5, 5]]);
    expect(a[0] + b[0]).toBeCloseTo(2);
    expect(a[0]).toBeLessThan(b[0]);
    expect(a[0] - 1).toBeCloseTo(-(a[1] - 1));
    expect(c).toEqual([5, 5]);
  });

  const minimumGap = 0.8;
  const gaps = (stamps: Vec2[]) => stamps.flatMap((stamp, index) => stamps.slice(index + 1).map((other) => Math.hypot(stamp[0] - other[0], stamp[1] - other[1])));

  it('chains close points into one group: A near B and B near C spread together, although A is far from C', () => {
    const points: Vec2[] = [[0, 0], [0.9, 0], [1.8, 0]];
    for (const gap of gaps(spreadStamps(points))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('a spread group that comes close to another stamp takes it in, so no two stamps end up closer than the minimum', () => {
    for (const gap of gaps(spreadStamps([[0, 0], [0, 0], [1, 0]]))) expect(gap).toBeGreaterThanOrEqual(minimumGap);
  });

  it('moves apart stamps whose points are close but not the same, such as the door, the doorstep and the firewall of one device', () => {
    const { door, doorstep, firewall } = computeLayout(officeNet(), false).devices['your-laptop'];
    const stamps = spreadStamps([door, doorstep, firewall]);
    stamps.forEach((stamp, index) => {
      for (const other of stamps.slice(index + 1)) expect(Math.hypot(stamp[0] - other[0], stamp[1] - other[1])).toBeGreaterThanOrEqual(minimumGap);
    });
  });

  it('keeps each spread stamp on its own side of the screen, whatever the order of the points', () => {
    const { door, firewall } = computeLayout(lab03Net(), true).devices.servidor2;
    const screenX = (point: Vec2) => point[0] - point[1];
    const [doorStamp, firewallStamp] = spreadStamps([door, firewall]);
    expect(screenX(firewall)).toBeLessThan(screenX(door));
    expect(screenX(firewallStamp)).toBeLessThan(screenX(doorStamp));
    expect(Math.hypot(doorStamp[0] - door[0], doorStamp[1] - door[1])).toBeLessThan(0.45);
    expect(Math.hypot(firewallStamp[0] - firewall[0], firewallStamp[1] - firewall[1])).toBeLessThan(0.45);
  });
});
