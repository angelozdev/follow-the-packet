import type { TermId } from '@/copy';
import type { Group } from '@/scene/map2d/layout/arrange/geometry';
import { shownParts } from '@/scene/map2d/layout/arrange/groups';
import { CAPTION_SEPARATOR, captionBoxes } from '@/scene/map2d/layout/captions';
import type { Frame } from '@/scene/map2d/frame';

/** Takes the groups of a layout, the terms the player knows and where the drawing stands in its layer; returns the name of every group that has something to say, as plain text in the caption style at the box that `captionBoxes` keeps for it. A part of a name whose term the player does not know is left out, and a group left with no part has no caption. */
export function GroupCaptions({ groups, known, frame }: { groups: readonly Group[]; known: ReadonlySet<TermId>; frame: Frame }) {
  const boxes = captionBoxes(groups);
  return groups.flatMap(({ id, name }) => {
    const text = shownParts(name, known).join(CAPTION_SEPARATOR);
    const box = boxes[id];
    if (box === undefined || text === '') return [];
    return [
      <span key={id} className="caption" data-group={id} style={{ left: frame.x + box.x, top: frame.y + box.y, height: box.height }}>
        {text}
      </span>,
    ];
  });
}
