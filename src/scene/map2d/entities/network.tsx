import type { Box, Group } from '@/scene/map2d/layout/arrange/geometry';

const CORNER_RADIUS = 14;
const WAVE_LENGTH = 44;
const WAVE_DEPTH = 10;

function wallOf({ x, y, width }: Box): string {
  return `M${x} ${y + CORNER_RADIUS}A${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${x + CORNER_RADIUS} ${y}H${x + width - CORNER_RADIUS}A${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 1 ${x + width} ${y + CORNER_RADIUS}`;
}

function wavesOf({ x, y, width, height }: Box): string {
  const waves = Math.max(2, Math.round(width / WAVE_LENGTH));
  const chord = width / waves;
  const radius = (chord ** 2 / 4 + WAVE_DEPTH ** 2) / (2 * WAVE_DEPTH);
  const bottom = y + height - CORNER_RADIUS;
  const sides = `M${x} ${y + WAVE_DEPTH}V${bottom}a${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${CORNER_RADIUS} ${CORNER_RADIUS}H${x + width - CORNER_RADIUS}a${CORNER_RADIUS} ${CORNER_RADIUS} 0 0 0 ${CORNER_RADIUS} ${-CORNER_RADIUS}V${y + WAVE_DEPTH}`;
  return `${sides}${`a${radius} ${radius} 0 0 0 ${-chord} 0`.repeat(waves)}z`;
}

/** Takes the box of a group, its kind, whether it wears the wall of an office and, for a block that has a name, the box of its tab; returns the box of that network as a piece of its own: a dotted rounded box for an office, a floor and a subnet (an office also draws a thick wall over its top edge), a dashed box with a wavy top edge for a VPC, and a square box with a thin dashed line and a filled tab for a block. */
export function NetworkPiece({ group: { id, kind, box }, walled, tab }: { group: Group; walled: boolean; tab?: Box }) {
  const mark = { className: 'map-group', 'data-group': id, 'data-kind': kind };
  return (
    <>
      {kind === 'vpc' ? <path {...mark} d={wavesOf(box)} /> : <rect {...mark} x={box.x} y={box.y} width={box.width} height={box.height} rx={kind === 'block' ? 0 : CORNER_RADIUS} />}
      {walled && <path className="map-wall" d={wallOf(box)} />}
      {tab && <rect className="map-tab" {...tab} />}
    </>
  );
}
