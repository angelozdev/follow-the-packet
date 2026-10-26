// @vitest-environment jsdom
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { ROLES, type Role } from '@/copy';
import { EntityIcon } from '@/scene/entities/icons/entity-icon';
import { ICON, type Box } from '@/scene/layout/arrange/geometry';
import { PieceShape, type PieceLook } from '@/scene/pieces';

const BOX: Box = { x: 0, y: 0, width: ICON, height: ICON };
const SHAPES = 'path, rect, circle, ellipse, polygon, polyline, line';
const SERVER: PieceLook = { kind: 'device', variant: 'internet-server', state: 'normal' };
const ANTENNA = 'M12 6V2';

const towerOf = (role?: Role, state: PieceLook['state'] = 'normal'): Element => {
  const piece: PieceLook = { ...SERVER, state, ...(role && { role }) };
  const svg = render(<svg><PieceShape piece={piece} box={BOX} selected={false} still /></svg>).container.querySelector('.map-piece');
  if (!svg) throw new Error('nothing drawn');
  return svg;
};

const drawnIcon = (element: ReactElement): Element => {
  const icon = render(<svg>{element}</svg>).container.querySelector('.entity-icon');
  if (!icon) throw new Error('nothing drawn');
  return icon;
};

const attributes = (element: Element | null, names: string[]) => names.map((name) => element?.getAttribute(name));

describe('the mark of the role of a server on its tower', () => {
  it('every role of a server has a pictogram and a tint', () => {
    for (const role of ROLES) {
      const tower = towerOf(role);
      expect(tower.querySelectorAll(`.role-mark[data-role="${role}"] ${SHAPES}`).length, role).toBeGreaterThan(0);
      expect(tower.querySelector(`.role-face[data-role="${role}"]`), role).not.toBeNull();
    }
  });

  it('no two roles draw the same pictogram, whatever their tint', () => {
    const pictograms = ROLES.map((role) => towerOf(role).querySelector('.role-mark')?.innerHTML);
    expect(pictograms.every((pictogram) => pictogram !== undefined && pictogram !== '')).toBe(true);
    expect(new Set(pictograms).size).toBe(ROLES.length);
  });

  it('a server with a role keeps the silhouette and the antenna of the tower', () => {
    const bare = towerOf();
    for (const role of ROLES) {
      const marked = towerOf(role);
      expect(attributes(marked.querySelector('.role-face'), ['x', 'y', 'width', 'height']), role).toEqual(attributes(bare.querySelector('.entity-icon rect'), ['x', 'y', 'width', 'height']));
      expect(bare.querySelector('.entity-icon path')?.getAttribute('d'), role).toMatch(new RegExp(`${ANTENNA}$`));
      expect(marked.querySelector(`.entity-icon > path[d="${ANTENNA}"]`), role).not.toBeNull();
      expect(attributes(marked.querySelector('.map-piece__icon'), ['x', 'y', 'width', 'height']), role).toEqual(attributes(bare.querySelector('.map-piece__icon'), ['x', 'y', 'width', 'height']));
    }
  });

  it('the border of an alert is the same around the tower with a mark', () => {
    const border = (role?: Role) => attributes(towerOf(role, 'intruded').querySelector('.map-piece__border'), ['x', 'y', 'width', 'height']);
    for (const role of ROLES) expect(border(role), role).toEqual(border());
  });

  it('a server with no role is drawn as the bare tower', () => {
    const bare = towerOf();
    expect(bare.querySelector('.role-face, .role-mark')).toBeNull();
    expect(bare).not.toHaveAttribute('data-role');
    expect(bare.querySelector('.entity-icon')?.innerHTML).toBe(drawnIcon(<EntityIcon entity={{ kind: 'device', variant: 'internet-server' }} />).innerHTML);
  });

  it('a mark is hidden from screen readers: the roles are told by the description of the button', () => {
    for (const role of ROLES) {
      const tower = towerOf(role);
      expect(tower.getAttribute('aria-hidden'), role).toBe('true');
      expect(tower.querySelectorAll('text, title, desc, a, button, [role], [aria-label], [aria-labelledby], [tabindex]'), role).toHaveLength(0);
    }
  });

  it('the proxy mark is drawn on the tower from a piece of test', () => {
    const tower = towerOf('proxy');
    expect(tower).toHaveAttribute('data-variant', 'internet-server');
    expect(tower).toHaveAttribute('data-role', 'proxy');
    expect(tower.querySelector('.entity-icon > .role-mark[data-role="proxy"]')).not.toBeNull();
    expect(tower.querySelector('.role-face')).toHaveAttribute('data-role', 'proxy');
  });
});
