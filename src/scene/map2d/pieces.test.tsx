// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ENTITY_REFS, nameTag, type EntityRef } from '@/copy';
import { officeNet } from '@/testing/fixtures';
import type { MapPiece } from '@/scene/overlay/piece-label';
import { CatalogIcon } from '@/scene/map2d/entities/device';
import { GroupBoxes } from '@/scene/map2d/entities/group-boxes';
import { NetworkPiece } from '@/scene/map2d/entities/network';
import { BAR_LENGTH, BAR_THICKNESS, ICON, type Box, type Group, type GroupKind } from '@/scene/map2d/layout/arrange/geometry';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { PieceShape, Pieces } from './pieces';

const ICON_BOX: Box = { x: 0, y: 0, width: ICON, height: ICON };
const BAR_BOX: Box = { x: 0, y: 0, width: BAR_THICKNESS, height: BAR_LENGTH };
const GROUP_BOX: Box = { x: 10, y: 10, width: 220, height: 116 };
const INSIDE_BOX: Box = { x: 20, y: 50, width: 200, height: 66 };
const TAB_BOX: Box = { x: 20, y: 32, width: 100, height: 18 };
const SHAPE_ATTRIBUTES = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'fill', 'stroke-width'];
const SHAPES = 'path, rect, circle, ellipse, polygon, polyline, line';
const NO_NAME: Group['name'] = [];

function boxOf(entity: EntityRef): Box {
  if (entity.kind === 'firewall') return BAR_BOX;
  return entity.kind === 'network' ? GROUP_BOX : ICON_BOX;
}

function pieceOf(entity: EntityRef): ReactElement {
  const box = boxOf(entity);
  if (entity.kind === 'network') return <NetworkPiece group={{ id: entity.variant, kind: entity.variant, box, name: NO_NAME }} walled={entity.variant === 'office'} />;
  if (entity.kind === 'packet') return <CatalogIcon entity={entity} box={box} />;
  return <PieceShape piece={{ ...entity, state: 'normal' }} box={box} selected={false} still />;
}

function drawn(element: ReactElement): SVGSVGElement {
  const svg = render(<svg>{element}</svg>).container.querySelector('svg');
  if (!svg) throw new Error('nothing drawn');
  return svg;
}

function shapesOf(svg: Element): string {
  return [...svg.querySelectorAll(SHAPES)]
    .map((shape) => [shape.tagName, ...SHAPE_ATTRIBUTES.map((name) => shape.getAttribute(name))].join('|'))
    .sort()
    .join(';');
}

const group = (id: string, kind: GroupKind, box: Box): Group => ({ id, kind, box, name: NO_NAME });
const groupsOf = (...groups: Group[]) => drawn(<GroupBoxes groups={groups} />);
const wallsOf = (svg: Element) => svg.querySelectorAll('.map-wall').length;

describe('the pieces of the 2D map', () => {
  it('every entity of the catalog has a 2D piece in every variant', () => {
    for (const entity of ENTITY_REFS) {
      const svg = drawn(pieceOf(entity));
      expect(svg.querySelectorAll(SHAPES).length, JSON.stringify(entity)).toBeGreaterThan(0);
      if (entity.kind === 'network') expect(svg.querySelector(`.map-group[data-kind="${entity.variant}"]`), JSON.stringify(entity)).not.toBeNull();
      else if (entity.kind !== 'packet') expect(svg.querySelector(`.map-piece[data-kind="${entity.kind}"][data-variant="${entity.variant}"]`), JSON.stringify(entity)).not.toBeNull();
    }
  });

  it('no two variants of the catalog draw the same 2D piece', () => {
    const shapes = ENTITY_REFS.map((entity) => shapesOf(drawn(pieceOf(entity))));
    const repeated = shapes.flatMap((each, index) => (shapes.indexOf(each) === index ? [] : [JSON.stringify(ENTITY_REFS[index])]));
    expect(repeated).toEqual([]);
  });

  it('the router and the Internet gateway differ by their antennas', () => {
    const antennasOf = (variant: 'router' | 'internet-gateway') => drawn(pieceOf({ kind: 'edge', variant })).querySelectorAll('.map-antenna').length;
    expect(antennasOf('router')).toBe(2);
    expect(antennasOf('internet-gateway')).toBe(0);
  });

  it('every piece is hidden from screen readers: its label is what they read', () => {
    const pieces = ENTITY_REFS.filter((entity) => entity.kind !== 'network' && entity.kind !== 'packet');
    expect(pieces.length).toBeGreaterThan(0);
    for (const entity of pieces) {
      const piece = drawn(pieceOf(entity)).querySelector('.map-piece');
      expect(piece?.getAttribute('aria-hidden'), JSON.stringify(entity)).toBe('true');
      expect(piece?.querySelectorAll('text, title, desc, a, button, [role], [aria-label], [aria-labelledby], [tabindex]'), JSON.stringify(entity)).toHaveLength(0);
    }
  });
});

describe('the layer of the pieces', () => {
  const piece = (kind: MapPiece['kind'], variant: MapPiece['variant'], anchorId: string, id: string): MapPiece => ({ id, kind, variant, anchorId, label: nameTag(anchorId), locked: false, state: 'normal' }) as MapPiece;
  const PIECES = [
    piece('device', 'laptop', 'your-laptop', 'device:your-laptop'),
    piece('firewall', 'host-firewall', 'your-laptop', 'firewall:your-laptop'),
    piece('device', 'printer', 'printer', 'device:printer'),
    piece('edge', 'router', 'edge', 'edge:edge'),
    piece('internet', 'internet', 'internet', 'internet:internet'),
    piece('actor', 'attacker', 'attacker', 'actor:attacker'),
  ];

  it('draws every piece the layout holds a box for, and only the active one selected', () => {
    const { icons } = layoutMap(officeNet(), PIECES, { width: 1000 });
    const svg = drawn(<Pieces pieces={[...PIECES, piece('device', 'laptop', 'lucia-laptop', 'device:not-drawn')]} icons={icons} activePieceId="device:printer" still />);
    expect([...svg.querySelectorAll('[data-piece]')].map((each) => each.getAttribute('data-piece'))).toEqual(PIECES.map(({ id }) => id));
    expect([...svg.querySelectorAll('.map-piece__mat')].map((mat) => mat.closest('[data-piece]')?.getAttribute('data-piece'))).toEqual(['device:printer']);
  });
});

describe('the boxes of the networks', () => {
  it('an office draws a wall over its top edge, a floor inside it draws none, and a floor on its own is the office', () => {
    expect(wallsOf(groupsOf(group('office', 'office', GROUP_BOX), group('floor', 'floor', INSIDE_BOX)))).toBe(1);
    expect(wallsOf(groupsOf(group('floor', 'floor', GROUP_BOX)))).toBe(1);
    expect(wallsOf(groupsOf(group('vpc', 'vpc', GROUP_BOX), group('subnet', 'subnet', INSIDE_BOX)))).toBe(0);
  });

  it('a VPC draws a wavy top edge as a path and an office, a floor and a subnet draw a rounded rectangle', () => {
    const boxes = groupsOf(group('office', 'office', GROUP_BOX), group('floor', 'floor', INSIDE_BOX), group('vpc', 'vpc', GROUP_BOX), group('subnet', 'subnet', INSIDE_BOX), group('block', 'block', INSIDE_BOX));
    const shapeOf = (id: string) => boxes.querySelector(`.map-group[data-group="${id}"]`);
    expect(['office', 'floor', 'subnet'].map((id) => shapeOf(id)?.tagName)).toEqual(['rect', 'rect', 'rect']);
    expect(shapeOf('vpc')?.tagName).toBe('path');
    expect(shapeOf('vpc')?.getAttribute('d')).toMatch(/a[\d.]+ [\d.]+ 0 0 0 -[\d.]+ 0/);
    expect(['office', 'floor', 'subnet'].map((id) => shapeOf(id)?.getAttribute('rx'))).not.toContain('0');
    expect(shapeOf('block')?.getAttribute('rx')).toBe('0');
  });

  it('a block draws a filled tab only when it has one to draw', () => {
    const block = group('block', 'block', INSIDE_BOX);
    expect(drawn(<NetworkPiece group={block} walled={false} />).querySelector('.map-tab')).toBeNull();
    const tab = drawn(<NetworkPiece group={block} walled={false} tab={TAB_BOX} />).querySelector('.map-tab');
    expect([tab?.getAttribute('x'), tab?.getAttribute('y'), tab?.getAttribute('width'), tab?.getAttribute('height')]).toEqual(['20', '32', '100', '18']);
  });
});
