// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LABEL_HEIGHT, LABEL_PAD, labelWidth } from '@/scene/map2d/layout/metrics';
import { PacketTag } from './packet-tag';

const TEXT = 'TCP 51514 → 80';
const BOX = { x: 120, y: 80, width: labelWidth(TEXT), height: LABEL_HEIGHT };

function draw(text = TEXT, box = BOX) {
  const view = render(
    <svg>
      <PacketTag id="run-1" text={text} box={box} />
    </svg>,
  );
  return view.container.querySelector('g.packet-tag') as SVGGElement;
}

describe('PacketTag', () => {
  it('a packet with ports wears a label in SVG, in a group with the class packet-tag, whose text length is its computed width', () => {
    const group = draw();
    const rect = group.querySelector('rect') as SVGRectElement;
    const text = group.querySelector('text') as SVGTextElement;
    expect(group.closest('svg')).not.toBeNull();
    expect(group.getAttribute('data-packet')).toBe('run-1');
    expect([rect.getAttribute('x'), rect.getAttribute('y'), rect.getAttribute('width'), rect.getAttribute('height')]).toEqual(['120', '80', String(labelWidth(TEXT)), String(LABEL_HEIGHT)]);
    expect(text.textContent).toBe(TEXT);
    expect(Number(text.getAttribute('textLength'))).toBe(labelWidth(TEXT) - LABEL_PAD);
  });

  it('puts the text inside the rectangle, half the padding from its left edge and halfway down', () => {
    const text = draw().querySelector('text') as SVGTextElement;
    expect(Number(text.getAttribute('x'))).toBe(BOX.x + LABEL_PAD / 2);
    expect(Number(text.getAttribute('y'))).toBe(BOX.y + LABEL_HEIGHT / 2);
  });

  it('reads as the label and nothing else, so the words of the group are the words of the label', () => {
    const group = draw();
    expect(group.textContent).toBe(TEXT);
    expect(group.querySelector('title, desc')).toBeNull();
  });

  it('takes its text length from its text and the rectangle from its box', () => {
    const wide = { ...BOX, width: 300 };
    const group = draw('TCP 40001 → 3306', wide);
    expect((group.querySelector('rect') as SVGRectElement).getAttribute('width')).toBe('300');
    expect(Number((group.querySelector('text') as SVGTextElement).getAttribute('textLength'))).toBe(labelWidth('TCP 40001 → 3306') - LABEL_PAD);
  });
});
