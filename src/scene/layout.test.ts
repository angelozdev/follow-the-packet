import { describe, expect, it } from 'vitest';
import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '@/testing';
import { simulate } from '@/engine/simulation/simulate';
import { checkpointPosition, computeLayout, cumulativeLengths, pathFor, pointAt } from './layout';

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

describe('checkpointPosition', () => {
  it('places each checkpoint on its piece', () => {
    const layout = computeLayout(lab03Net());
    expect(checkpointPosition({ stage: 'sg-in', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.barrier);
    expect(checkpointPosition({ stage: 'linux', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.door);
    expect(checkpointPosition({ stage: 'route', at: 'igw' }, layout)).toEqual(layout.igw);
  });

  it('the "arrives and returns" point sits outside the building, in view', () => {
    const layout = computeLayout(lab03Net());
    const spot = layout.instances.servidor2;
    const [x, z] = checkpointPosition({ stage: 'reply', at: 'servidor2' }, layout);
    expect(Math.abs(x - spot.x) >= 0.8 + 0.55 || Math.abs(z - spot.z) >= 0.6 + 0.55).toBe(true);
  });
});
