import { useElementSize } from '@mantine/hooks';
import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { GroupBoxes } from '@/scene/map2d/entities/group-boxes';
import { LinkLines, MarkDots } from '@/scene/map2d/entities/links';
import { Pieces } from '@/scene/map2d/pieces';
import { blockTabBoxes } from '@/scene/map2d/layout/captions';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { BlockNames, GroupCaptions } from '@/scene/map2d/overlay/group-captions';
import { MapLabels } from '@/scene/map2d/overlay/map-labels';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import type { MapPiece } from '@/scene/overlay/piece-label';
import { frameOf } from './frame';

export interface MapStageProps {
  world: Network;
  pieces: readonly MapPiece[];
  known: ReadonlySet<TermId>;
  blockName: string | null;
  activePieceId: string | null;
  still: boolean;
  inspectTrigger: InspectTrigger;
  onActivate: (pieceId: string) => void;
}

function Drawing({ world, pieces, known, blockName, activePieceId, still, inspectTrigger, onActivate, width }: MapStageProps & { width: number }) {
  const layout = layoutMap(world, pieces, { width, blockTab: blockName !== null });
  const { size } = layout;
  const frame = frameOf(width, size);
  const tab = blockName !== null && known.has('cidr') ? { name: blockName, boxes: blockTabBoxes(layout.groups, blockName) } : undefined;
  return (
    <>
      <svg className="map-stage__svg" aria-hidden="true" viewBox={`0 0 ${size.width} ${size.height}`} width={size.width} height={size.height} style={{ marginLeft: frame.x, marginTop: frame.y }}>
        <GroupBoxes groups={layout.groups} tabs={tab?.boxes} />
        <LinkLines links={layout.links} />
        <MarkDots marks={layout.marks} />
        <Pieces pieces={pieces} icons={layout.icons} activePieceId={activePieceId} still={still} />
      </svg>
      <div className="html-layer">
        <GroupCaptions groups={layout.groups} known={known} frame={frame} />
        {tab && <BlockNames tabs={tab.boxes} name={tab.name} frame={frame} />}
        <MapLabels pieces={pieces} layout={layout} frame={frame} inspectTrigger={inspectTrigger} onActivate={onActivate} />
      </div>
    </>
  );
}

/** Takes the world, the pieces the map draws, the terms the player knows, the block the player is classifying in (null when the incident has none), the piece whose card is open, whether animations are off, what inspects a piece and what the screen does when one is activated; returns the map at the width of its box: a sheet that measures its own width (`useElementSize`), draws nothing until it has a width above 0 and then lays the map out at that width (`layoutMap`, with room for the tab of an outline of a block when there is a block to name) and draws it at one unit to the pixel, an SVG for the art that screen readers skip (the boxes of the groups, the links, the marks and the pieces) and the HTML layer above it for what the player reads and presses (the names of the groups, the tab of a block once `cidr` is known, and the label of every piece), centered under the title bar. The stage fills the box that holds it: on a phone it is as tall as its drawing, and above 900 px the box scrolls down when the drawing is taller. */
export function MapStage(props: MapStageProps) {
  const { ref, width } = useElementSize();
  return (
    <div className="map-stage">
      <div ref={ref} className="map-stage__sheet">
        {Number.isFinite(width) && width > 0 && <Drawing {...props} width={width} />}
      </div>
    </div>
  );
}
