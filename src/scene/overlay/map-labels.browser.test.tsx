import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import type { TermId } from '@/copy';
import { officeTwoFloorsNet } from '@/testing/fixtures';
import { FLOORS_LABEL_PIECES } from '@/testing/map-pieces';
import { LABEL_GAP, type Box } from '@/scene/layout/arrange/geometry';
import { layoutMap } from '@/scene/layout/map-layout';
import { LABEL_HEIGHT, LINE_HEIGHT } from '@/scene/layout/metrics';
import { MapStage } from '@/scene/map-stage';
import { pieceDomId } from '@/scene/overlay/piece-label';

const WORLD = officeTwoFloorsNet();
const PIECES = FLOORS_LABEL_PIECES;
const INITIAL_VIEWPORT = { width: window.innerWidth, height: window.innerHeight };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const WIDE = 1500;
const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();
const HALF_A_PIXEL = 0.5;
const MODEL_SLACK = 2;
const PLEX_STACK = ["'IBM Plex Mono'", 'Menlo', 'Consolas', 'monospace'];
const GLOBAL_STACK = "'IBM Plex Mono', ui-monospace, monospace";

const plainLabels = PIECES.filter(({ locked, state }) => !locked && state !== 'intruded');

async function mountStage(width: number, activePieceId: string | null = null) {
  const view = render(
    <div data-testid="box" style={{ width, position: 'relative' }}>
      <MapStage world={WORLD} pieces={PIECES} known={NOTHING_KNOWN} blockName={null} activePieceId={activePieceId} still flows={[]} sent={[]} inspectTrigger={() => ({})} inspectStampsTrigger={() => ({})} onActivate={() => undefined} />
    </div>,
  );
  const box = view.getByTestId('box');
  await expect.poll(() => box.querySelectorAll('button.map-button').length).toBe(PIECES.length);
  const origin = (box.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
  const layout = layoutMap(WORLD, PIECES, { width });
  const rectOf = (target: Element) => {
    const shape = target.getBoundingClientRect();
    return { x: shape.left - origin.left, y: shape.top - origin.top, width: shape.width, height: shape.height } satisfies Box;
  };
  const labelOf = (id: string) => box.querySelector(`#${pieceDomId(id)}`) as HTMLElement;
  return { box, layout, rectOf, labelOf };
}

describe('the labels of the 2D map', () => {
  afterEach(async () => {
    await page.viewport(INITIAL_VIEWPORT.width, INITIAL_VIEWPORT.height);
  });

  it('a label stands where the layout puts it, with its width', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { layout, rectOf, labelOf } = await mountStage(WIDE);
    expect(plainLabels.length).toBeGreaterThan(3);
    for (const { id } of PIECES) {
      const [shape, model] = [rectOf(labelOf(id)), layout.labels[id]];
      expect(shape.x, id).toBeCloseTo(model.x, 0);
      expect(Math.abs(shape.y - model.y), id).toBeLessThanOrEqual(HALF_A_PIXEL);
      expect(shape.height, id).toBe(model.height);
    }
    for (const { id } of plainLabels) {
      const [shape, model] = [rectOf(labelOf(id)), layout.labels[id]];
      expect(shape.width, id).toBeLessThanOrEqual(model.width + HALF_A_PIXEL);
      expect(shape.width, id).toBeGreaterThanOrEqual(model.width - MODEL_SLACK);
    }
  });

  it('the label of a firewall is in two lines: its term and its resource', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { rectOf, labelOf } = await mountStage(WIDE);
    const firewall = labelOf('firewall:your-firewall');
    const [term, resource] = [firewall.firstChild as Text, firewall.querySelector('.name-tag') as HTMLElement];
    const termLine = document.createRange();
    termLine.selectNodeContents(term);
    expect(termLine.getBoundingClientRect().bottom).toBeLessThanOrEqual(resource.getBoundingClientRect().top + HALF_A_PIXEL);
    expect(termLine.getBoundingClientRect().left).toBeCloseTo(resource.getBoundingClientRect().left, 0);
    expect(rectOf(firewall).height).toBe(LABEL_HEIGHT + LINE_HEIGHT);
    expect(rectOf(labelOf('device:marta-laptop')).height).toBe(LABEL_HEIGHT);
  });

  it('the monospaced font of the map has no ui-monospace and the global token is the one it was', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const { box, labelOf } = await mountStage(WIDE);
    const inTheMap = getComputedStyle(box.querySelector('.map-stage') as Element).getPropertyValue('--font-mono');
    expect(inTheMap).not.toContain('ui-monospace');
    expect(inTheMap.split(',').map((family) => family.trim().replaceAll('"', "'"))).toEqual(PLEX_STACK);
    expect(getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()).toBe(GLOBAL_STACK);
    for (const { id } of PIECES) {
      const family = getComputedStyle(labelOf(id)).fontFamily;
      expect(family, id).not.toContain('ui-monospace');
      expect(family, id).toContain('IBM Plex Mono');
    }
  });

  it('a selected device keeps its label outside its mat, and every label keeps its own gap to its icon', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    const selected = 'device:marta-laptop';
    const { box, layout, rectOf, labelOf } = await mountStage(WIDE, selected);
    const mat = rectOf(box.querySelector(`[data-piece="${selected}"] .map-piece__mat`) as Element);
    const label = rectOf(labelOf(selected));
    const [icon, model] = [layout.icons[selected], layout.labels[selected]];
    expect(label.x + label.width).toBeLessThanOrEqual(mat.x + HALF_A_PIXEL);
    expect(icon.x - (model.x + model.width)).toBe(LABEL_GAP);
  });
});
