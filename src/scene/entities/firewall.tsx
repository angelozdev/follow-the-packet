import type { ReactNode } from 'react';
import type { FirewallKind } from '@/engine';
import type { Box } from '@/scene/layout/arrange/geometry';

const PULSE_SCALE = 1.35;
const PULSE_DURATION = '0.8s';
const BRICK_COURSES = 5;
const POST_STEM = 6;
const POST_CAP = 4;
const POST_LENGTH = 16;

function wall({ x, y, width, height }: Box): string {
  return `M${x} ${y}h${width}v${height}h${-width}z`;
}

function posts({ x, y, width, height }: Box): string {
  const inset = (width - POST_STEM) / 2;
  const top = `M${x + inset} ${y}h${POST_STEM}v${POST_LENGTH - POST_CAP}h${inset}v${POST_CAP}H${x}v${-POST_CAP}h${inset}z`;
  const bottom = `M${x + inset} ${y + height}h${POST_STEM}V${y + height - POST_LENGTH + POST_CAP}h${inset}v${-POST_CAP}H${x}v${POST_CAP}h${inset}z`;
  return top + bottom;
}

function brickJoints({ x, y, width, height }: Box): string {
  const course = height / BRICK_COURSES;
  const courses = Array.from({ length: BRICK_COURSES }, (_, index) => index);
  const beds = courses.slice(1).map((index) => `M${x} ${y + index * course}h${width}`);
  const heads = courses.flatMap((index) => (index % 2 === 0 ? [width / 2] : [width / 4, (3 * width) / 4]).map((offset) => `M${x + offset} ${y + index * course}v${course}`));
  return [...beds, ...heads].join('');
}

function Pulse({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="scale" values={`1;${PULSE_SCALE};1`} dur={PULSE_DURATION} repeatCount="indefinite" />
        <g transform={`translate(${-x} ${-y})`}>{children}</g>
      </g>
    </g>
  );
}

/** Takes the box of a bar, its variant, whether its card is open, whether it stops a packet and whether animations are off; returns the bar that crosses the link of its device: a wall of bricks for the firewall of a laptop and two posts in a T that face each other, with a passage for the link, for a Security Group. The bar turns to danger while it stops a packet and keeps its shape; while selected it is drawn with a thicker line, or, with animations, it pulses. */
export function FirewallPiece({ box, variant, selected, blocking, still }: { box: Box; variant: FirewallKind; selected: boolean; blocking: boolean; still: boolean }) {
  const className = ['map-bar', blocking && 'map-bar--blocking', selected && still && 'map-bar--selected'].filter(Boolean).join(' ');
  const bar = (
    <>
      <path className={className} d={variant === 'host-firewall' ? wall(box) : posts(box)} />
      {variant === 'host-firewall' && <path className="map-piece__line map-piece__thin" d={brickJoints(box)} />}
    </>
  );
  return selected && !still ? (
    <Pulse x={box.x + box.width / 2} y={box.y + box.height / 2}>
      {bar}
    </Pulse>
  ) : (
    bar
  );
}
