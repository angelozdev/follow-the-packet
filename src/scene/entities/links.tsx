import type { Link, Mark } from '@/scene/layout/arrange/geometry';

const MARK_RADIUS = 3;

/** Draws every link of the layout in SVG as a thick soft line through its points, whatever its kind, the stub of the line end included. */
export function LinkLines({ links }: { links: readonly Link[] }) {
  return (
    <g>
      {links.map(({ from, to, kind, points }, index) => (
        <polyline key={`${from}>${to}:${index}`} className="map-link" data-kind={kind} points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
      ))}
    </g>
  );
}

/** Draws a soft dot on every place where a stamp can stand, so the place shows whether or not it has stamps. */
export function MarkDots({ marks }: { marks: readonly Mark[] }) {
  return (
    <g>
      {marks.map(({ station, point: [x, y] }) => (
        <circle key={station} className="map-mark" data-station={station} cx={x} cy={y} r={MARK_RADIUS} />
      ))}
    </g>
  );
}
