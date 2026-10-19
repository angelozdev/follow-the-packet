import { useElementSize } from '@mantine/hooks';
import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { GroupBoxes } from '@/scene/map2d/entities/group-boxes';
import { LinkLines, MarkDots } from '@/scene/map2d/entities/links';
import type { RowPiece } from '@/scene/map2d/layout/arrange/geometry';
import { layoutMap } from '@/scene/map2d/layout/map-layout';
import { GroupCaptions } from '@/scene/map2d/overlay/group-captions';
import { frameOf } from './frame';

export interface MapStageProps {
  world: Network;
  pieces: readonly RowPiece[];
  known: ReadonlySet<TermId>;
}

function Drawing({ world, pieces, known, width }: MapStageProps & { width: number }) {
  const layout = layoutMap(world, pieces, { width });
  const { size } = layout;
  const frame = frameOf(width, size);
  return (
    <>
      <svg className="map-stage__svg" aria-hidden="true" viewBox={`0 0 ${size.width} ${size.height}`} width={size.width} height={size.height} style={{ marginLeft: frame.x, marginTop: frame.y }}>
        <GroupBoxes groups={layout.groups} />
        <LinkLines links={layout.links} />
        <MarkDots marks={layout.marks} />
      </svg>
      <div className="html-layer">
        <GroupCaptions groups={layout.groups} known={known} frame={frame} />
      </div>
    </>
  );
}

/** Takes the world, the pieces the map draws and the terms the player knows; returns the map at the width of its box: a sheet that measures its own width (`useElementSize`), draws nothing until it has a width above 0 and then lays the map out at that width (`layoutMap`) and draws it at one unit to the pixel, an SVG for the art that screen readers skip and the HTML layer above it for what the player reads and presses, centered under the title bar. The stage fills the box that holds it: on a phone it is as tall as its drawing, and above 900 px the box scrolls down when the drawing is taller. */
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
