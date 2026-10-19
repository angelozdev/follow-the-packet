import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import type { EntityVariants } from '@/copy';
import { GroupBoxes } from '@/scene/map2d/entities/group-boxes';
import { BAR_LENGTH, BAR_THICKNESS, ICON, LABEL_GAP, type Box, type Group, type GroupKind } from '@/scene/map2d/layout/arrange/geometry';
import { PieceShape, type PieceLook } from './pieces';

const FRAME = 320;
const BOX: Box = { x: 40, y: 40, width: ICON, height: ICON };
const BAR_BOX: Box = { x: 40, y: 40, width: BAR_THICKNESS, height: BAR_LENGTH };
const OUTER_BOX: Box = { x: 10, y: 10, width: 220, height: 100 };
const INNER_BOX: Box = { x: 24, y: 40, width: 192, height: 60 };
const FIREWALLS: EntityVariants['firewall'][] = ['host-firewall', 'security-group'];
const DEVICES: EntityVariants['device'][] = ['laptop', 'printer', 'ec2-instance', 'internet-server'];
const ACTORS: EntityVariants['actor'][] = ['you', 'attacker', 'home'];
const ICON_GRID = 24;
const TOLERANCE = 1;
const SHAKE_SAMPLES = [0.25, 0.75];

type Layers = { selected?: boolean; still?: boolean };

const MAP_PIECES: PieceLook[] = [
  ...DEVICES.map((variant): PieceLook => ({ kind: 'device', variant, state: 'intruded' })),
  ...FIREWALLS.map((variant): PieceLook => ({ kind: 'firewall', variant, state: 'blocking' })),
  { kind: 'edge', variant: 'router', state: 'normal' },
  { kind: 'edge', variant: 'internet-gateway', state: 'normal' },
  { kind: 'internet', variant: 'internet', state: 'normal' },
  ...ACTORS.map((variant): PieceLook => ({ kind: 'actor', variant, state: 'normal' })),
];

function drawn(element: ReactElement): SVGSVGElement {
  const svg = render(
    <svg width={FRAME} height={FRAME} viewBox={`0 0 ${FRAME} ${FRAME}`}>
      {element}
    </svg>,
  ).container.querySelector('svg');
  if (!svg) throw new Error('nothing drawn');
  return svg;
}

function pieceDrawn(piece: PieceLook, { selected = false, still = true }: Layers = {}): SVGSVGElement {
  return drawn(<PieceShape piece={piece} box={piece.kind === 'firewall' ? BAR_BOX : BOX} selected={selected} still={still} />);
}

function colorOf(role: string): string {
  const probe = document.createElement('i');
  probe.style.color = `var(${role})`;
  document.body.append(probe);
  const { color } = getComputedStyle(probe);
  probe.remove();
  return color;
}

function widthOf(role: string): string {
  const probe = document.createElement('i');
  probe.style.display = 'block';
  probe.style.width = `var(${role})`;
  document.body.append(probe);
  const { width } = getComputedStyle(probe);
  probe.remove();
  return width;
}

function barOf(svg: SVGSVGElement): SVGPathElement {
  const bar = svg.querySelector<SVGPathElement>('.map-bar');
  if (!bar) throw new Error('no bar drawn');
  return bar;
}

function animationOf(svg: SVGSVGElement, type: string): SVGAnimationElement {
  const animation = svg.querySelector<SVGAnimationElement>(`animateTransform[type="${type}"]`);
  if (!animation) throw new Error(`no ${type} animated`);
  return animation;
}

function atFraction(svg: SVGSVGElement, animation: SVGAnimationElement, fraction: number) {
  svg.pauseAnimations();
  svg.setCurrentTime(animation.getSimpleDuration() * fraction);
}

const iconOf = (svg: SVGSVGElement) => svg.querySelector('.map-piece__icon') as SVGSVGElement;
const rectOf = (element: Element) => element.getBoundingClientRect();
const BOX_EDGES = { left: BOX.x, top: BOX.y, right: BOX.x + BOX.width, bottom: BOX.y + BOX.height };

function edgesOf(svg: SVGSVGElement, element: Element) {
  const [rect, origin] = [rectOf(element), rectOf(svg)];
  return { left: rect.left - origin.left, top: rect.top - origin.top, right: rect.right - origin.left, bottom: rect.bottom - origin.top };
}
const devicesIn = (state: PieceLook['state']) => DEVICES.map((variant): PieceLook => ({ kind: 'device', variant, state }));
const group = (id: string, kind: GroupKind, box: Box): Group => ({ id, kind, box, name: [] });

describe('the pieces of the 2D map in the browser', () => {
  it('a firewall bar turns to danger while it blocks and keeps its shape', () => {
    for (const variant of FIREWALLS) {
      const calm = barOf(pieceDrawn({ kind: 'firewall', variant, state: 'normal' }));
      const blocking = barOf(pieceDrawn({ kind: 'firewall', variant, state: 'blocking' }));
      expect(getComputedStyle(calm).fill, variant).toBe(colorOf('--color-shade'));
      expect(getComputedStyle(blocking).fill, variant).toBe(colorOf('--color-danger'));
      expect(getComputedStyle(blocking).stroke, variant).toBe(getComputedStyle(calm).stroke);
      expect(blocking.getAttribute('d'), variant).toBe(calm.getAttribute('d'));
      expect([rectOf(blocking).width, rectOf(blocking).height], variant).toEqual([BAR_THICKNESS, BAR_LENGTH]);
    }
  });

  it('a selected firewall draws a thicker bar without animations and pulses with them', () => {
    for (const variant of FIREWALLS) {
      const look: PieceLook = { kind: 'firewall', variant, state: 'normal' };
      const [unselected, selectedStill, selectedMoving] = [pieceDrawn(look), pieceDrawn(look, { selected: true }), pieceDrawn(look, { selected: true, still: false })];
      expect(getComputedStyle(barOf(unselected)).strokeWidth, variant).toBe(widthOf('--stroke-regular'));
      expect(getComputedStyle(barOf(selectedStill)).strokeWidth, variant).toBe(widthOf('--stroke-heavy'));
      expect(selectedStill.querySelector('animateTransform'), variant).toBeNull();
      expect(pieceDrawn(look, { still: false }).querySelector('animateTransform'), variant).toBeNull();
      expect(getComputedStyle(barOf(selectedMoving)).strokeWidth, variant).toBe(widthOf('--stroke-regular'));
      const pulse = animationOf(selectedMoving, 'scale');
      atFraction(selectedMoving, pulse, 0);
      const resting = rectOf(barOf(selectedMoving));
      atFraction(selectedMoving, pulse, 0.5);
      const swollen = rectOf(barOf(selectedMoving));
      expect(swollen.width, variant).toBeGreaterThan(resting.width + TOLERANCE);
      expect(swollen.height, variant).toBeGreaterThan(resting.height + TOLERANCE);
    }
  });

  it('a Security Group leaves a passage for the link and a host firewall covers it with its wall', () => {
    const covered = (variant: EntityVariants['firewall']) => {
      const svg = pieceDrawn({ kind: 'firewall', variant, state: 'normal' });
      const origin = svg.getBoundingClientRect();
      return document.elementsFromPoint(origin.left + BAR_BOX.x + BAR_BOX.width / 2, origin.top + BAR_BOX.y + BAR_BOX.height / 2).some((each) => each.classList.contains('map-bar'));
    };
    expect(covered('host-firewall')).toBe(true);
    expect(covered('security-group')).toBe(false);
  });

  it('a selected device stands on a shaded mat', () => {
    for (const look of devicesIn('normal')) {
      expect(pieceDrawn(look).querySelector('.map-piece__mat'), look.variant).toBeNull();
      const svg = pieceDrawn(look, { selected: true });
      const mat = svg.querySelector('.map-piece__mat');
      if (!mat) throw new Error('no mat');
      expect(getComputedStyle(mat).fill, look.variant).toBe(colorOf('--color-shade'));
      expect(mat.compareDocumentPosition(iconOf(svg)) & Node.DOCUMENT_POSITION_FOLLOWING, look.variant).toBeTruthy();
      const around = edgesOf(svg, mat);
      const reaches = [BOX_EDGES.left - around.left, BOX_EDGES.top - around.top, around.right - BOX_EDGES.right, around.bottom - BOX_EDGES.bottom];
      expect(reaches.map((reach) => reach > 0 && reach <= LABEL_GAP), look.variant).toEqual([true, true, true, true]);
    }
  });

  it('a device with a forbidden packet drawn without animations has a double border', () => {
    for (const look of devicesIn('intruded')) {
      const svg = pieceDrawn(look);
      const border = svg.querySelector('.map-piece__border');
      if (!border) throw new Error('no border');
      const around = edgesOf(svg, border);
      expect([around.left > BOX_EDGES.left, around.top > BOX_EDGES.top, around.right < BOX_EDGES.right, around.bottom < BOX_EDGES.bottom], look.variant).toEqual([true, true, true, true]);
      const shapes = [...svg.querySelectorAll('.map-piece__icon :is(path, rect)')].map((each) => edgesOf(svg, each));
      expect(Math.min(...shapes.map(({ left }) => left)) - around.left, look.variant).toBeGreaterThan(0);
      expect(Math.min(...shapes.map(({ top }) => top)) - around.top, look.variant).toBeGreaterThan(0);
      expect(Math.max(...shapes.map(({ right }) => right)) - around.right, look.variant).toBeLessThan(0);
      expect(Math.max(...shapes.map(({ bottom }) => bottom)) - around.bottom, look.variant).toBeLessThan(0);
      expect(svg.querySelector('animateTransform'), look.variant).toBeNull();
      expect(pieceDrawn({ ...look, state: 'normal' }).querySelector('.map-piece__border'), look.variant).toBeNull();
      expect(pieceDrawn(look, { still: false }).querySelector('.map-piece__border'), look.variant).toBeNull();
    }
  });

  it('a device with a forbidden packet shakes with animations', () => {
    for (const look of devicesIn('intruded')) {
      const svg = pieceDrawn(look, { still: false });
      const shake = animationOf(svg, 'translate');
      atFraction(svg, shake, 0);
      const resting = rectOf(iconOf(svg)).left;
      const shifts = SHAKE_SAMPLES.map((fraction) => {
        atFraction(svg, shake, fraction);
        return rectOf(iconOf(svg)).left - resting;
      });
      expect(shifts[0], look.variant).toBeGreaterThan(TOLERANCE);
      expect(shifts[1], look.variant).toBeLessThan(-TOLERANCE);
      expect(Math.max(...shifts.map(Math.abs)), look.variant).toBeLessThan(LABEL_GAP);
      expect(pieceDrawn({ ...look, state: 'normal' }, { still: false }).querySelector('animateTransform'), look.variant).toBeNull();
    }
  });

  it('every piece draws inside the box the layout holds for it, and its state layers inside the gap to its label', () => {
    for (const look of MAP_PIECES) {
      const box = look.kind === 'firewall' ? BAR_BOX : BOX;
      const svg = pieceDrawn(look, { selected: true });
      const { left, top, right, bottom } = rectOf(svg.querySelector('.map-piece') as Element);
      const origin = svg.getBoundingClientRect();
      const reach = [box.x - (left - origin.left), box.y - (top - origin.top), right - origin.left - (box.x + box.width), bottom - origin.top - (box.y + box.height)];
      const allowed = look.kind === 'device' ? LABEL_GAP : TOLERANCE;
      expect(Math.max(...reach), JSON.stringify(look)).toBeLessThanOrEqual(allowed);
    }
  });

  it('a device and the internet draw the icon of the catalog twice as large as the catalog does', () => {
    for (const look of MAP_PIECES.filter(({ kind }) => kind === 'device' || kind === 'internet')) {
      const icon = pieceDrawn(look).querySelector('.entity-icon') as SVGSVGElement;
      const [drawnSize, ownSize] = [rectOf(icon), icon.getBBox()];
      expect([drawnSize.width / ownSize.width, drawnSize.height / ownSize.height], JSON.stringify(look)).toEqual([ICON / ICON_GRID, ICON / ICON_GRID]);
    }
  });

  it('a box of a network is dotted with a thick wall for an office, dashed with waves for a VPC and thin and square for a block', () => {
    const svg = drawn(<GroupBoxes groups={[group('office', 'office', OUTER_BOX), group('floor', 'floor', INNER_BOX), group('vpc', 'vpc', { ...OUTER_BOX, y: 130 }), group('block', 'block', INNER_BOX)]} />);
    const [office, floor, vpc, block] = ['office', 'floor', 'vpc', 'block'].map((id) => getComputedStyle(svg.querySelector(`.map-group[data-group="${id}"]`) as Element));
    expect(office.strokeDasharray).toBe(floor.strokeDasharray);
    expect(office.strokeLinecap).toBe('round');
    expect(new Set([office.strokeDasharray, vpc.strokeDasharray, block.strokeDasharray]).size).toBe(3);
    expect(parseFloat(vpc.strokeWidth)).toBeGreaterThan(parseFloat(block.strokeWidth));
    expect(getComputedStyle(svg.querySelector('.map-wall') as Element).strokeWidth).toBe(widthOf('--stroke-double'));
    expect(block.stroke).toBe(colorOf('--color-ink'));
    expect(office.stroke).toBe(colorOf('--color-ink-soft'));
  });
});
