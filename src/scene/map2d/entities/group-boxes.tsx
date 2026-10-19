import type { Group } from '@/scene/map2d/layout/arrange/geometry';
import { NetworkPiece } from './network';

const OUTER_KINDS: readonly Group['kind'][] = ['office', 'vpc'];

function holds({ box: outer }: Group, { box: inner }: Group): boolean {
  return outer.x <= inner.x && outer.y <= inner.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
}

function standsAsOffice(group: Group, groups: readonly Group[]): boolean {
  if (group.kind === 'office') return true;
  return group.kind === 'floor' && !groups.some((other) => other !== group && OUTER_KINDS.includes(other.kind) && holds(other, group));
}

/** Takes the groups of a layout; returns the box of every one drawn as the network piece it is, in the units of the layout: an office with its wall, a floor inside an office without it (a floor that no office holds is the office), a VPC with its waves, a subnet as a floor and a block with square corners. The name of a group is not here: it is text on the HTML layer. */
export function GroupBoxes({ groups }: { groups: readonly Group[] }) {
  return (
    <g>
      {groups.map((group) => (
        <NetworkPiece key={group.id} group={group} walled={standsAsOffice(group, groups)} />
      ))}
    </g>
  );
}
