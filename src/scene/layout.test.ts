import { describe, expect, it } from 'vitest';
import { actor, echoFrom, inst, lab03Net, ping, withInbound } from '@/testing';
import { simulate } from '@/engine/simulation/simulate';
import { checkpointPosition, computeLayout, cumulativeLengths, pathFor, pointAt } from './layout';

const S2 = '172.31.38.97';

describe('computeLayout', () => {
  const layout = computeLayout(lab03Net());

  it('pone una columna por subred y cada instancia dentro de la suya', () => {
    const a = layout.subnets['subnet-a'];
    const b = layout.subnets['subnet-b'];
    expect(a.x).toBeLessThan(b.x);
    expect(Math.abs(layout.instances.servidor1.x - a.x)).toBeLessThan(a.width / 2);
    expect(Math.abs(layout.instances.servidor2.x - b.x)).toBeLessThan(b.width / 2);
  });

  it('la barrera y la carretera quedan delante del edificio (z mayor, hacia la cámara)', () => {
    const spot = layout.instances.servidor2;
    expect(spot.barrier[1]).toBeGreaterThan(spot.z);
    expect(layout.roadZ).toBeGreaterThan(spot.barrier[1]);
  });

  it('el internet gateway y los actores quedan a la izquierda de la hoja', () => {
    expect(layout.igw[0]).toBeLessThan(-layout.sheet.width / 2);
    expect(layout.actors.attacker[0]).toBeLessThan(layout.igw[0]);
  });
});

describe('pathFor', () => {
  const net = lab03Net();
  const layout = computeLayout(net);

  it('paso 3: termina en la barrera de servidor2', () => {
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.barrier);
  });

  it('paso 5: llega hasta la puerta de servidor2', () => {
    const solved = withInbound(net, 'sg-servidor2', echoFrom('echo', 'sg-servidor1'));
    const packet = ping(inst('servidor1'), S2);
    const path = pathFor(simulate(solved, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.instances.servidor2.door);
  });

  it('una IP privada desde internet termina en el internet gateway', () => {
    const packet = ping(actor('attacker'), S2);
    const path = pathFor(simulate(net, packet), packet, layout);
    expect(path.at(-1)).toEqual(layout.igw);
  });
});

describe('interpolación del recorrido', () => {
  it('pointAt recorre los tramos en orden', () => {
    const path: [number, number][] = [[0, 0], [2, 0], [2, 2]];
    const lengths = cumulativeLengths(path);
    expect(lengths).toEqual([0, 2, 4]);
    expect(pointAt(path, lengths, 1)).toEqual([1, 0]);
    expect(pointAt(path, lengths, 3)).toEqual([2, 1]);
    expect(pointAt(path, lengths, 99)).toEqual([2, 2]);
  });
});

describe('checkpointPosition', () => {
  it('sitúa cada punto de control en su pieza', () => {
    const layout = computeLayout(lab03Net());
    expect(checkpointPosition({ stage: 'sg-in', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.barrier);
    expect(checkpointPosition({ stage: 'linux', at: 'servidor2' }, layout)).toEqual(layout.instances.servidor2.door);
    expect(checkpointPosition({ stage: 'route', at: 'igw' }, layout)).toEqual(layout.igw);
  });

  it('el punto "llega y vuelve" queda fuera del edificio, a la vista', () => {
    const layout = computeLayout(lab03Net());
    const spot = layout.instances.servidor2;
    const [x, z] = checkpointPosition({ stage: 'reply', at: 'servidor2' }, layout);
    // Edificio: medio ancho 0.8 y medio fondo 0.6; anillo de radio 0.55.
    expect(Math.abs(x - spot.x) >= 0.8 + 0.55 || Math.abs(z - spot.z) >= 0.6 + 0.55).toBe(true);
  });
});
