import type { Group } from '@/scene/map2d/layout/arrange/geometry';

const GROUP_RADIUS = 14;

/** Draws the box of every group of the layout in SVG: a dashed outline with rounded corners, in the units of the layout. The name of a group is not here: it is text on the HTML layer. */
export function GroupBoxes({ groups }: { groups: readonly Group[] }) {
  return (
    <g>
      {groups.map(({ id, kind, box }) => (
        <rect key={id} className="map-group" data-group={id} data-kind={kind} x={box.x} y={box.y} width={box.width} height={box.height} rx={GROUP_RADIUS} />
      ))}
    </g>
  );
}
