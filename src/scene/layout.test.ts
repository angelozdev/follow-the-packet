import { OrthographicCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { OFFICE, actor, device, echoFrom, lab03Net, officeNet, ping, withInbound } from '@/testing';
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
  labelPosition,
  layoutCenter,
  pathFor,
  pathLength,
  pointAt,
  roundTrip,
  sideForNdc,
  spreadStamps,
  terminalSide,
  type CardSide,
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
  from: number;
  to: number;
}

const STAMP_RADIUS = 16;
const STAMP_HEIGHT = 0.9;
const MAPS: MapSize[] = [
  { window: '1280×800', width: 900, height: 800 },
  { window: '1440×900', width: 1060, height: 900 },
];

function terminalOnMap(net: ReturnType<typeof officeNet>, outside: boolean, map: MapSize) {
  const layout: Layout = computeLayout(net, outside);
  const camera = new OrthographicCamera(-map.width / 2, map.width / 2, map.height / 2, -map.height / 2, 0.1, 500);
  const [cx, cz] = layoutCenter(layout);
  camera.zoom = CAMERA_ZOOM;
  camera.position.set(...cameraPosition(layout));
  camera.lookAt(cx, 0, cz);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  const pixelX = (point: Vec3) => ((new Vector3(...point).project(camera).x + 1) / 2) * map.width;
  const origin = { kind: 'device', anchorId: 'your-laptop' } as const;
  const others = [
    ...net.devices.filter((other) => other.id !== origin.anchorId).map((other) => ({ kind: 'device' as const, anchorId: other.id })),
    ...(outside ? [{ kind: 'edge' as const, anchorId: 'edge' }, { kind: 'internet' as const, anchorId: 'internet' }, { kind: 'actor' as const, anchorId: 'attacker' }] : []),
  ];
  const placement = cardPlacement(origin, others, layout);
  const anchorX = pixelX(placement.position);
  const labels: Hazard[] = others.map((other) => {
    const x = pixelX(labelPosition(other, layout));
    return { name: `${other.anchorId} label`, from: x - LABEL_REACH, to: x + LABEL_REACH };
  });
  const ends = [OFFICE.printer, OFFICE.lucia, OFFICE.nobody].map((address) => {
    const packet = ping(device('your-laptop'), address);
    const path = pathFor(simulate(net, packet), packet, layout);
    return path[path.length - 1];
  });
  const stamps: Hazard[] = spreadStamps(ends).map(([x, z], index) => {
    const stampX = pixelX([x, STAMP_HEIGHT, z]);
    return { name: `stamp ${index + 1}`, from: stampX - STAMP_RADIUS, to: stampX + STAMP_RADIUS };
  });
  const side = terminalSide(anchorX, (placement.avoid ?? []).map(pixelX), map.width, placement.gap);
  const covered = (cardSide: CardSide) => {
    const [near, far] = cardSpan(cardSide, anchorX, placement.gap);
    return [...labels, ...stamps].filter(({ from, to }) => from <= far && to >= near).map(({ name }) => name);
  };
  return { side, anchorX, placement, span: cardSpan(side, anchorX, placement.gap), covered };
}

describe('the terminal card in the office of 01-01 and 01-02', () => {
  const office = { ...officeNet(), actors: [] };

  it.each(MAPS)('at $window it opens to the left of tu-laptop: inside the map, clear of every label and every possible stamp', (map) => {
    const { side, anchorX, placement, span, covered } = terminalOnMap(office, false, map);
    expect(side).toBe('left');
    expect(span[0]).toBeGreaterThanOrEqual(0);
    expect(span[1]).toBeLessThanOrEqual(map.width);
    expect(span[1]).toBeLessThan(anchorX - LABEL_REACH);
    expect(covered(side)).toEqual([]);
    expect(placement.gap).toBeLessThan(CARD_WIDTH);
  });

  it.each(MAPS)('at $window the right side, where a card opens today, would cover the laptop-lucia and the impresora', (map) => {
    const { covered } = terminalOnMap(office, false, map);
    expect(covered('right')).toEqual(expect.arrayContaining(['lucia-laptop label', 'printer label']));
  });
});

describe('the terminal card with the outside drawn (01-03)', () => {
  it('falls back to the side with more room when neither side is clear', () => {
    const [map] = MAPS;
    const { side, anchorX, covered } = terminalOnMap(officeNet(), true, map);
    expect(covered('left')).not.toEqual([]);
    expect(covered('right')).not.toEqual([]);
    expect(side).toBe(sideForNdc((anchorX / map.width) * 2 - 1));
  });
});

describe('where a card opens', () => {
  const GAP = 68;

  it.each([
    { name: 'the side with more room when both are clear', anchorX: 600, avoidXs: [], room: 900, expected: 'left' },
    { name: 'the other side when the one with more room covers a label', anchorX: 450, avoidXs: [700], room: 900, expected: 'left' },
    { name: 'the side with more room when it covers a label and the other leaves the map', anchorX: 200, avoidXs: [350], room: 900, expected: 'right' },
    { name: 'the side with more room when the map is too narrow for the card', anchorX: 300, avoidXs: [], room: 600, expected: 'right' },
  ] satisfies { name: string; anchorX: number; avoidXs: number[]; room: number; expected: CardSide }[])('a terminal takes $name', ({ anchorX, avoidXs, room, expected }) => {
    expect(terminalSide(anchorX, avoidXs, room, GAP)).toBe(expected);
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
