import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ROLES } from '@/copy';
import { ICON, type Box } from '@/scene/layout/arrange/geometry';
import { PieceShape } from '@/scene/pieces';

const FRAME = 120;
const BOX: Box = { x: 20, y: 20, width: ICON, height: ICON };
const PAPER = '.map-piece__paper';

const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const rgbOf = (hex: string): string => `rgb(${[1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16)).join(', ')})`;

function towerOf(role: (typeof ROLES)[number]): SVGSVGElement {
  const svg = render(
    <svg width={FRAME} height={FRAME} viewBox={`0 0 ${FRAME} ${FRAME}`}>
      <PieceShape piece={{ kind: 'device', variant: 'internet-server', state: 'normal', role }} box={BOX} selected={false} still />
    </svg>,
  ).container.querySelector('svg');
  if (!svg) throw new Error('nothing drawn');
  return svg;
}

describe('the colours of the mark of a role in a real browser', () => {
  it('the face of the tower takes the tint of its role and the pictogram stays in ink', () => {
    const ink = rgbOf(token('--color-ink'));
    for (const role of ROLES) {
      const tower = towerOf(role);
      const face = tower.querySelector('.role-face') as SVGElement;
      expect(getComputedStyle(face).fill, `${role}: the face`).toBe(rgbOf(token(`--role-${role}-tint`)));
      const shapes = [...tower.querySelectorAll<SVGElement>('.role-mark *')];
      expect(shapes.length, role).toBeGreaterThan(0);
      for (const shape of shapes) {
        const { fill, stroke } = getComputedStyle(shape);
        const onPaper = shape.matches(PAPER);
        expect(stroke, `${role}: a stroke of the pictogram`).toBe(onPaper ? rgbOf(token('--color-page')) : ink);
        expect(['none', ink], `${role}: a fill of the pictogram`).toContain(fill);
        expect([fill, stroke], `${role}: the strong colour is not in the pictogram`).not.toContain(rgbOf(token(`--role-${role}`)));
      }
    }
  });

  it('the pictogram sits inside the face of the tower', () => {
    for (const role of ROLES) {
      const tower = towerOf(role);
      const face = tower.querySelector('.role-face') as SVGRectElement;
      const { x, y, width, height } = face.getBBox();
      const mark = (tower.querySelector('.role-mark') as SVGGElement).getBBox();
      expect(mark.x, role).toBeGreaterThan(x);
      expect(mark.y, role).toBeGreaterThan(y);
      expect(mark.x + mark.width, role).toBeLessThan(x + width);
      expect(mark.y + mark.height, role).toBeLessThan(y + height);
    }
  });
});
