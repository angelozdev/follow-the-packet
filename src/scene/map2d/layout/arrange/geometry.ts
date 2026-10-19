import type { TermId, TermText } from '@/copy';
import type { GraphNode, Point } from '@/scene/map2d/layout/graph';
import { LABEL_HEIGHT } from '@/scene/map2d/layout/metrics';
import type { Drawn } from '@/scene/map2d/layout/stations';

export type PieceKind = 'device' | 'firewall' | 'edge' | 'internet' | 'actor';
export type PieceState = 'normal' | 'intruded' | 'blocking';

export interface RowPiece {
  id: string;
  kind: PieceKind;
  anchorId: string;
  label: TermText;
  locked: boolean;
  state: PieceState;
  inOffice?: boolean;
  insideBlock?: boolean;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RowExtent {
  above: number;
  below: number;
}

export interface Density {
  trunk: number;
  lane: number;
}

export const NORMAL: Density = { trunk: 44, lane: 66 };
export const COMPACT: Density = { trunk: 32, lane: 52 };

export type GroupKind = 'office' | 'floor' | 'vpc' | 'subnet' | 'block';

export interface NamePart {
  text: string;
  term?: TermId;
}

export interface Group {
  id: string;
  kind: GroupKind;
  box: Box;
  name: readonly NamePart[];
  gateway?: string;
}

export type LinkKind = 'device' | 'unplugged' | 'bus' | 'trunk' | 'line' | 'lane' | 'private' | 'stub';

export interface Link {
  from: string;
  to: string;
  kind: LinkKind;
  points: Point[];
}

export type FanAxis = 'x' | 'y';

export interface Mark {
  station: string;
  point: Point;
  axis: FanAxis;
  casillas: number;
}

export interface RowLayout {
  size: { width: number; height: number };
  groups: Group[];
  links: Link[];
  nodes: GraphNode[];
  stations: Record<string, Point>;
  marks: Mark[];
  labels: Record<string, Box>;
  icons: Record<string, Box>;
  drawn: Drawn;
}

export interface TabRoom {
  blockTab?: boolean;
}

export type MapMode = 'row' | 'row-compact' | 'stack';

export interface MapLayout extends RowLayout {
  mode: MapMode;
}

export const MIN_WIDTH = 360;
export const OUTER = 16;
export const GROUP_PAD = 14;
export const CAPTION = 18;
export const BOX_GAP = 14;
export const ICON = 48;
export const ROW_HEIGHT = 100;
export const LANE_HEIGHT = 100;
export const LABEL_GAP = 6;
export const BAR_THICKNESS = 14;
export const BAR_LENGTH = 40;
export const STAMP = 36;
export const FAN_PITCH = 25;
export const CASILLAS = 3;
export const MARK_BACK = 22;
export const MARK_SPACING = 40;
export const FAN_CLEARANCE = 4;
export const LABEL_SEP = 8;
export const STUB = MARK_SPACING;
export const DOORSTEP = MARK_BACK + MARK_SPACING;
export const TRUNK_PITCH = 8;
export const TRUNK_LEAD = 8;
export const BLOCK_INSET_X = 6;
export const BLOCK_INSET_Y = 2;
export const BLOCK_TAB = 18;
export const FIREWALL_LABEL_DROP = 10;
export const HELPER_PREFIX = 'join:';

export const LINK_MIN = DOORSTEP + MARK_SPACING;
export const BAR_AT = DOORSTEP + STAMP / 2 + FAN_CLEARANCE + BAR_THICKNESS / 2;
export const BAR_MARK_BACK = BAR_THICKNESS / 2 + MARK_BACK;
export const FIREWALL_MARK_AT = BAR_AT + BAR_MARK_BACK;
export const FIREWALL_LABEL_AT = FIREWALL_MARK_AT + STAMP / 2 + FAN_CLEARANCE;
export const BLOCK_BUS_GAP = STAMP / 2 + FAN_CLEARANCE;
export const ICON_MARK_BACK = ICON / 2 + MARK_BACK;
export const STOP_PITCH = 2 * (ICON_MARK_BACK + MARK_SPACING);
export const LINE_END_REACH = 2 * ICON_MARK_BACK;
export const SERVERS_GAP = 2 * (MARK_SPACING + MARK_BACK) - COMPACT.lane;
export const FAN_HALF = (STAMP + FAN_PITCH * (CASILLAS - 1)) / 2;
export const STOP_LABEL_RISE = FAN_HALF + FAN_CLEARANCE;
export const LINE_PITCH = STOP_LABEL_RISE + LABEL_HEIGHT + FAN_HALF + FAN_CLEARANCE;
export const NAME_ABOVE = STOP_LABEL_RISE + LABEL_HEIGHT;
export const DROP_GAP = 6;
export const GATEWAY_DROP = BOX_GAP + ICON / 2;
export const SNAKE_LANE = 44;
export const SNAKE_BUS_WALL = 24;
export const SNAKE_LABEL_WALL = 8;

/** Returns the box of a fan of `casillas` stamps centered on a point and opening along `axis`: as long as the fan on that axis and one stamp across. */
export function fanBox([x, y]: Point, axis: FanAxis, casillas: number): Box {
  const along = STAMP + FAN_PITCH * (casillas - 1);
  return axis === 'y' ? { x: x - STAMP / 2, y: y - along / 2, width: STAMP, height: along } : { x: x - along / 2, y: y - STAMP / 2, width: along, height: STAMP };
}

/** True when two boxes share any area; boxes that only touch do not overlap. */
export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}
