import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tokenColor } from '@/testing/token-color';
import { LABEL_HEIGHT, LABEL_PAD, labelWidth } from '@/scene/map2d/layout/metrics';
import { PacketTag } from './packet-tag';

const TEXT = 'TCP 51514 → 80';
const SAME_LENGTH_WITHOUT_THE_ARROW = 'TCP 51514 - 80';
const BOX = { x: 20, y: 10, width: labelWidth(TEXT), height: LABEL_HEIGHT };
const HALF_A_PIXEL = 0.5;
const FEW_PIXELS = 2;
const FONTS = ["'IBM Plex Mono', Menlo, Consolas, monospace", 'serif', 'sans-serif', "'Times New Roman', Georgia, serif", 'cursive', 'fantasy'];

function draw(text: string) {
  const view = render(
    <div className="map-stage">
      <svg width={400} height={60}>
        <PacketTag id="run-1" text={text} box={{ ...BOX, width: labelWidth(text) }} />
      </svg>
    </div>,
  );
  const svg = view.container.querySelector('svg') as SVGSVGElement;
  return { svg, group: svg.querySelector('g.packet-tag') as SVGGElement, rect: svg.querySelector('rect') as SVGRectElement, text: svg.querySelector('text') as SVGTextElement };
}

function drawnWidth(text: SVGTextElement): number {
  return text.getEndPositionOfChar(text.getNumberOfChars() - 1).x - text.getStartPositionOfChar(0).x;
}

describe('PacketTag in a browser', () => {
  it('the label of a packet is as wide as the model says whatever font draws the arrow', () => {
    const { rect, text } = draw(TEXT);
    const modelText = labelWidth(TEXT) - LABEL_PAD;
    const natural: number[] = [];
    for (const font of FONTS) {
      text.style.fontFamily = font;
      natural.push(text.getComputedTextLength());
      expect(Math.abs(drawnWidth(text) - modelText), font).toBeLessThanOrEqual(HALF_A_PIXEL);
      expect(Math.abs(text.getBoundingClientRect().width - modelText), font).toBeLessThanOrEqual(HALF_A_PIXEL);
    }
    expect(Math.max(...natural) - Math.min(...natural), 'the fonts of the test do not write the same width on their own').toBeGreaterThan(FEW_PIXELS);
    expect(rect.getBoundingClientRect().width).toBeCloseTo(labelWidth(TEXT), 0);
  });

  it('a label with the arrow is as wide as one of the same characters without it, in every font', () => {
    const withArrow = draw(TEXT).text;
    const without = draw(SAME_LENGTH_WITHOUT_THE_ARROW).text;
    for (const font of FONTS) {
      withArrow.style.fontFamily = font;
      without.style.fontFamily = font;
      expect(Math.abs(drawnWidth(withArrow) - drawnWidth(without)), font).toBeLessThanOrEqual(HALF_A_PIXEL);
    }
  });

  it('stands on its box, with the text inside the rectangle, whatever the global rule of the label of the 3D map does', () => {
    const { svg, group, rect, text } = draw(TEXT);
    const origin = svg.getBoundingClientRect();
    const box = rect.getBoundingClientRect();
    expect(box.left - origin.left).toBeCloseTo(BOX.x, 1);
    expect(box.top - origin.top).toBeCloseTo(BOX.y, 1);
    expect([box.width, box.height]).toEqual([BOX.width, BOX.height]);
    expect(group.getBoundingClientRect().width).toBeCloseTo(box.width, 0);
    const written = text.getBoundingClientRect();
    expect(written.left).toBeGreaterThanOrEqual(box.left);
    expect(written.right).toBeLessThanOrEqual(box.right);
    expect(written.top).toBeGreaterThanOrEqual(box.top);
    expect(written.bottom).toBeLessThanOrEqual(box.bottom);
    expect(Math.abs((written.top + written.bottom) / 2 - (box.top + box.bottom) / 2)).toBeLessThanOrEqual(FEW_PIXELS);
  });

  it('is written in the monospaced font of the map at 12 px, in ink on a paper rectangle', () => {
    const { rect, text } = draw(TEXT);
    const style = getComputedStyle(text);
    expect(style.fontFamily).toMatch(/IBM Plex Mono/);
    expect(style.fontSize).toBe('12px');
    expect(style.fill).toBe(tokenColor('--color-ink'));
    expect(getComputedStyle(rect).fill).toBe(tokenColor('--color-surface'));
    expect(getComputedStyle(rect).stroke).toBe(tokenColor('--color-ink'));
  });
});
