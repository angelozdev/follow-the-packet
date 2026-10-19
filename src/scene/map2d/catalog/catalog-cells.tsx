import type { ReactNode } from 'react';
import { CATALOG_TEXT, entityName, replyShape, toPlainText, type EntityRef, type EntityVariants, type PacketShape, type StampState } from '@/copy';
import { GroupBoxes } from '@/scene/map2d/entities/group-boxes';
import { MORE_SPECIMENS, StampButton, StampMore, type MoreSpecimen } from '@/scene/map2d/entities/stamp';
import { BAR_LENGTH, BAR_THICKNESS, BLOCK_TAB, CASILLAS, ICON, type Box, type Group, type GroupKind } from '@/scene/map2d/layout/arrange/geometry';
import type { Point } from '@/scene/map2d/layout/graph';
import { GLYPH_BOX, REPLY_MARK_DISTANCE, type GlyphRole, type StillGlyph, type StillPacket } from '@/scene/map2d/marks/still-packets';
import { PieceShape, type PieceLook } from '@/scene/map2d/pieces';
import { PacketGlyph, StillTrace } from '@/scene/map2d/traffic/still-trace';
import type { TriggerProps } from '@/scene/overlay/inspect-trigger';
import { PieceLabel, type MapPiece, type MapPieceKind } from '@/scene/overlay/piece-label';
import type { FlowLook } from '@/scene/traffic/flow-look';

export interface CatalogCell {
  id: string;
  caption: string;
  art?: (still: boolean) => ReactNode;
  html?: ReactNode;
}

type PieceEntity = Extract<EntityRef, { kind: MapPieceKind }>;
type PieceState = 'normal' | 'locked' | 'configurable' | 'selected' | 'alert' | 'blocking';
type Ending = [stamp: StampState, end: Extract<FlowLook['end'], keyof typeof CATALOG_TEXT.state>, message: PacketShape, intruder: boolean];

interface Appearance {
  selected: boolean;
  locked: boolean;
  mark: MapPiece['state'];
}

export const STAGE = { width: 208, height: 120 };
export const LABEL_TOP = 8;

const MIDDLE: Point = [STAGE.width / 2, STAGE.height / 2];
const PIECE_TOP = 52;
const ICON_BOX: Box = { x: (STAGE.width - ICON) / 2, y: PIECE_TOP, width: ICON, height: ICON };
const BAR_BOX: Box = { x: (STAGE.width - BAR_THICKNESS) / 2, y: PIECE_TOP + (ICON - BAR_LENGTH) / 2, width: BAR_THICKNESS, height: BAR_LENGTH };
const LINE_MARGIN = 28;
const LINK = `M${LINE_MARGIN} ${PIECE_TOP + ICON / 2}H${STAGE.width - LINE_MARGIN}`;
const ON_THE_LINE: readonly MapPieceKind[] = ['firewall', 'edge', 'internet'];
const OUTER_BOX: Box = { x: 16, y: 12, width: 176, height: 96 };
const INNER_BOX: Box = { x: 30, y: 44, width: 148, height: 52 };
const BLOCK_BOX: Box = { x: 36, y: 38, width: 136, height: 56 };
const BLOCK_TAB_BOX: Box = { x: BLOCK_BOX.x, y: BLOCK_BOX.y - BLOCK_TAB, width: 96, height: BLOCK_TAB };
const TRACE_START: Point = [LINE_MARGIN, MIDDLE[1]];
const TRACE_END: Point = [STAGE.width - LINE_MARGIN, MIDDLE[1]];
const TRACE_LENGTH = TRACE_END[0] - TRACE_START[0];
const DEVICE_STATES: readonly PieceState[] = ['normal', 'locked', 'selected', 'alert'];
const FIREWALL_STATES: readonly PieceState[] = ['locked', 'configurable', 'selected', 'blocking'];
const APPEARANCE: Record<PieceState, Appearance> = {
  normal: { selected: false, locked: false, mark: 'normal' },
  locked: { selected: false, locked: true, mark: 'normal' },
  configurable: { selected: false, locked: false, mark: 'normal' },
  selected: { selected: true, locked: false, mark: 'normal' },
  alert: { selected: false, locked: false, mark: 'intruded' },
  blocking: { selected: false, locked: false, mark: 'blocking' },
};
const ENDINGS: Ending[] = [
  ['arrived', 'replied', 'echo-request', false],
  ['arrived', 'arrived', 'echo-reply', false],
  ['blocked', 'blocked', 'echo-request', false],
  ['lost', 'lost', 'echo-request', false],
  ['intruder', 'arrived', 'echo-request', true],
];
const WARNED_ENDING: Ending = ['warned', 'warned', 'echo-request', false];
const TRANSPORT_PAIRS: [PacketShape, PacketShape][] = [['tcp-request', 'tcp-reply'], ['udp-request', 'udp-reply']];
const ECHO_PAIR: [PacketShape, PacketShape] = ['echo-request', 'echo-reply'];
const NETWORK_VARIANTS: EntityVariants['network'][] = ['office', 'vpc', 'block'];
const NO_TRIGGER: TriggerProps = {};
const ignore = () => {};

const group = (id: string, kind: GroupKind, box: Box): Group => ({ id, kind, box, name: [] });
const NETWORKS: Record<EntityVariants['network'], { groups: Group[]; tabs: Record<string, Box> }> = {
  office: { groups: [group('office', 'office', OUTER_BOX), group('floor', 'floor', INNER_BOX)], tabs: {} },
  vpc: { groups: [group('vpc', 'vpc', OUTER_BOX), group('subnet', 'subnet', INNER_BOX)], tabs: {} },
  block: { groups: [group('block', 'block', BLOCK_BOX)], tabs: { block: BLOCK_TAB_BOX } },
};

const plainName = (entity: EntityRef) => toPlainText(entityName(entity));

function stampAt([x, y]: Point, children: ReactNode): ReactNode {
  return (
    <div className="map-stamp" style={{ left: x, top: y }}>
      {children}
    </div>
  );
}

function glyphAt(role: GlyphRole, variant: StillGlyph['variant'], intruder: boolean, [x, y]: Point): StillGlyph {
  return { role, variant, intruder, point: [x, y], box: { x: x - GLYPH_BOX / 2, y: y - GLYPH_BOX / 2, width: GLYPH_BOX, height: GLYPH_BOX } };
}

function networkCell(variant: EntityVariants['network']): CatalogCell {
  const { groups, tabs } = NETWORKS[variant];
  return { id: `network-${variant}`, caption: plainName({ kind: 'network', variant }), art: () => <GroupBoxes groups={groups} tabs={tabs} /> };
}

function pieceCell(entity: PieceEntity, state: PieceState): CatalogCell {
  const id = `${entity.kind}-${entity.variant}-${state}`;
  const { selected, locked, mark } = APPEARANCE[state];
  const look: PieceLook = { ...entity, state: mark, id };
  const piece: MapPiece = { ...entity, id, anchorId: id, label: entityName(entity), locked, state: mark };
  return {
    id,
    caption: `${plainName(entity)} · ${CATALOG_TEXT.state[state]}`,
    art: (still) => (
      <>
        {ON_THE_LINE.includes(entity.kind) && <path className="map-link" d={LINK} />}
        <PieceShape piece={look} box={entity.kind === 'firewall' ? BAR_BOX : ICON_BOX} selected={selected} still={still} />
      </>
    ),
    html: (
      <div className="catalog2d__label" style={{ top: LABEL_TOP }}>
        <PieceLabel piece={piece} trigger={NO_TRIGGER} onActivate={ignore} />
      </div>
    ),
  };
}

function statesRow(entity: PieceEntity, states: readonly PieceState[]): CatalogCell[] {
  return states.map((state) => pieceCell(entity, state));
}

function packetCell(variant: PacketShape, role: GlyphRole, intruder: boolean): CatalogCell {
  return {
    id: `packet-${variant}-${intruder}`,
    caption: plainName({ kind: 'packet', variant, intruder }),
    art: () => <PacketGlyph glyph={glyphAt(role, variant, intruder, MIDDLE)} />,
  };
}

function packetRow([request, reply]: [PacketShape, PacketShape]): CatalogCell[] {
  return [packetCell(request, 'going', false), packetCell(reply, 'answer', false), packetCell(request, 'going', true), packetCell(reply, 'answer', true)];
}

function traceCell([stamp, end, message, intruder]: Ending): CatalogCell {
  const id = `trace-${end}-${stamp}`;
  const answered = end === 'replied' || end === 'warned';
  const going = glyphAt('going', message, intruder, [TRACE_START[0] + TRACE_LENGTH / 2, MIDDLE[1]]);
  const answer = glyphAt('answer', end === 'warned' ? 'warning' : replyShape(message), end !== 'warned' && intruder, [TRACE_START[0] + Math.min(REPLY_MARK_DISTANCE, TRACE_LENGTH / 4), MIDDLE[1]]);
  const packet: StillPacket = { id, path: [TRACE_START, TRACE_END], end, glyphs: answered ? [going, answer] : [going] };
  return {
    id,
    caption: intruder ? CATALOG_TEXT.intruder : CATALOG_TEXT.state[end],
    art: () => <StillTrace packet={packet} />,
    html: stampAt(TRACE_END, <StampButton state={stamp} name={plainName({ kind: 'packet', variant: message, intruder })} trigger={NO_TRIGGER} />),
  };
}

function moreCell({ hidden, hidesProblem }: MoreSpecimen): CatalogCell {
  return {
    id: `more-${hidden}-${hidesProblem}`,
    caption: hidesProblem ? CATALOG_TEXT.more.stampsWithProblem(hidden) : CATALOG_TEXT.more.stamps(hidden),
    html: stampAt(MIDDLE, <StampMore hidden={hidden} total={hidden + CASILLAS - 1} hidesProblem={hidesProblem} trigger={NO_TRIGGER} />),
  };
}

/** Every entity of the map in every variant and state, one row per entity or variant in the order of the catalog of the chapter 1 design, with the packets of TCP and UDP and the «+N» last, so the cells of the rows above keep their place; the widest row sets the columns. */
export const CATALOG_ROWS: CatalogCell[][] = [
  NETWORK_VARIANTS.map(networkCell),
  statesRow({ kind: 'device', variant: 'laptop' }, DEVICE_STATES),
  statesRow({ kind: 'device', variant: 'printer' }, DEVICE_STATES),
  [...statesRow({ kind: 'device', variant: 'ec2-instance' }, DEVICE_STATES), pieceCell({ kind: 'device', variant: 'internet-server' }, 'normal')],
  statesRow({ kind: 'firewall', variant: 'host-firewall' }, FIREWALL_STATES),
  statesRow({ kind: 'firewall', variant: 'security-group' }, FIREWALL_STATES),
  [pieceCell({ kind: 'edge', variant: 'router' }, 'locked'), pieceCell({ kind: 'edge', variant: 'internet-gateway' }, 'locked'), pieceCell({ kind: 'internet', variant: 'internet' }, 'normal')],
  (['attacker', 'you', 'home'] as const).map((variant) => pieceCell({ kind: 'actor', variant }, 'normal')),
  [...packetRow(ECHO_PAIR), traceCell(WARNED_ENDING)],
  ENDINGS.map(traceCell),
  ...TRANSPORT_PAIRS.map(packetRow),
  MORE_SPECIMENS.map(moreCell),
];

export const CATALOG_COLUMNS = Math.max(...CATALOG_ROWS.map((row) => row.length));
