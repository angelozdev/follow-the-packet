import { describe, expect, it } from 'vitest';
import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '@/testing';
import { simulate } from '@/engine/simulation/simulate';
import { cardAnchorPosition, computeLayout, cumulativeLengths, labelPosition, layoutCenter, pathFor, pathLength, pointAt, roundTrip, sideForNdc, spreadStamps } from './layout';

const S2 = '172.31.38.97';

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net());

  it('puts one column per subnet and each instance inside its own', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.instances.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.instances.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('the barrier and the road sit in front of the building (greater z, toward the camera)', () => {
    const spot = layout.instances.servidor2;
    expect(spot.barrier[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.barrier[1]);
  });

  it('the internet gateway and the actors sit on the left of the sheet', () => {
    expect(layout.igw[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.igw[0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net);

  it('step 3: ends at the barrier of servidor2', () => {
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.barrier);
  });

  it('step 5: reaches the door of servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.door);
  });

  it('a private IP from the internet ends at the internet gateway', () => {
    const packet = ping(actor('attacker'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.igw);
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
  const layout = computeLayout(lab03Net());

  it('the camera looks at the middle of everything drawn, actors included', () => {
    const [x] = layoutCenter(layout);
    const left = Math.min(...Object.values(layout.actors).map(([actorX]) => actorX));
    expect(x - left).toBeCloseTo(layout.sheet.width / 2 - x);
  });

  it('a Security Group label sits in front of its barrier, and a server label above its building', () => {
    const spot = layout.instances.servidor2;
    expect(labelPosition({ kind: 'barrier', anchorId: 'servidor2' }, layout)[2]).toBeGreaterThan(spot.barrier[1]);
    expect(labelPosition({ kind: 'server', anchorId: 'servidor2' }, layout)[1]).toBeGreaterThan(1);
    expect(cardAnchorPosition('servidor2', layout)[0]).toBe(spot.barrier[0]);
  });

  it('a card opens on the side of the screen with more room', () => {
    expect(sideForNdc(0.4)).toBe('left');
    expect(sideForNdc(-0.4)).toBe('right');
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
});
