import { BLOCK_TAB, CAPTION, GROUP_PAD, type Box, type Group } from './arrange/geometry';
import { characterCount, labelWidth } from './metrics';

export const CAPTION_CELL = 10;
export const CAPTION_SEPARATOR = ' ';

/** Takes the parts of the name of a group; returns the text that sets the width of its box: every part, whether or not the player knows its term yet, joined by a space, so the box is as wide as the name can ever be. */
function widestName({ name }: Pick<Group, 'name'>): string {
  return name.map(({ text }) => text).join(CAPTION_SEPARATOR);
}

/** Takes the groups of a map; returns, by the id of each group that has a name, the box where its name stands: in the top left corner of the group, 14 px (`GROUP_PAD`) from both edges, in the strip of 18 px (`CAPTION`) that the group keeps over its first row. The box is as wide as every part of the name joined by a space takes at 10 px a character (`CAPTION_CELL`), which is a ceiling, not a measure: the caption is bold capitals in the body font, whose advance the browser decides, and the text of the name is the one of Task M11. A group with no name (the outline of a block) has no box. */
export function captionBoxes(groups: readonly Group[]): Record<string, Box> {
  const named = groups.filter(({ name }) => name.length > 0);
  return Object.fromEntries(named.map((group): [string, Box] => [group.id, { x: group.box.x + GROUP_PAD, y: group.box.y + GROUP_PAD, width: Math.ceil(characterCount(widestName(group)) * CAPTION_CELL), height: CAPTION }]));
}

/** Takes the groups of a map and the name of the block the player is classifying in; returns, by the id of each outline of a block, the box of its tab: in the top left corner of the outline, standing over its top edge, 18 px tall (`BLOCK_TAB`) and as wide as the name is as a label. The room over the outline is the layout's when it is asked for (`blockTab`), so the tab stands under the name of its floor. A group that is not the outline of a block has none. */
export function blockTabBoxes(groups: readonly Group[], name: string): Record<string, Box> {
  const width = labelWidth(name);
  return Object.fromEntries(groups.filter(({ kind }) => kind === 'block').map(({ id, box }): [string, Box] => [id, { x: box.x, y: box.y - BLOCK_TAB, width, height: BLOCK_TAB }]));
}
