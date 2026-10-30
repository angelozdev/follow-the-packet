import { useElementSize, useMergedRef } from '@mantine/hooks';
import type { Ref } from 'react';
import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import { GroupBoxes } from '@/scene/entities/group-boxes';
import { LinkLines, MarkDots } from '@/scene/entities/links';
import { Pieces } from '@/scene/pieces';
import type { Size } from '@/scene/camera/camera-view';
import { CameraButtons } from '@/scene/camera/camera-buttons';
import { useCamera, type CameraControls } from '@/scene/camera/use-camera';
import type { MapLayout } from '@/scene/layout/arrange/geometry';
import { blockTabBoxes } from '@/scene/layout/captions';
import { layoutMap } from '@/scene/layout/map-layout';
import { fanStamps, stampsByPlace } from '@/scene/marks/stamp-fan';
import { BlockNames, GroupCaptions } from '@/scene/overlay/group-captions';
import { MapLabels } from '@/scene/overlay/map-labels';
import { stampButtons, type DrawnRun, type InspectStampsTrigger, type SentRun } from '@/scene/overlay/map-stamps';
import { FlightLabels, Traffic, useSendsInTheAir } from '@/scene/traffic/traffic';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import type { MapPiece } from '@/scene/overlay/piece-label';
import { frameOf, type Frame } from './frame';

export interface MapStageProps {
  world: Network;
  pieces: readonly MapPiece[];
  known: ReadonlySet<TermId>;
  blockName: string | null;
  activePieceId: string | null;
  still: boolean;
  inspectTrigger: InspectTrigger;
  onActivate: (pieceId: string) => void;
  flows: readonly DrawnRun[];
  sent: readonly SentRun[];
  inspectStampsTrigger: InspectStampsTrigger;
  gap?: Size;
  startPieceId?: string | null;
  controls?: Ref<CameraControls>;
  onCameraMove?: () => void;
}

function Drawing({ pieces, flows, sent, known, blockName, activePieceId, still, inspectTrigger, inspectStampsTrigger, onActivate, layout, frame }: Omit<MapStageProps, 'world' | 'gap' | 'startPieceId' | 'controls' | 'onCameraMove'> & { layout: MapLayout; frame: Frame }) {
  const { size } = layout;
  const runs = [...flows, ...sent];
  const inTheAir = useSendsInTheAir(sent, layout, still);
  const fans = fanStamps(stampsByPlace(runs, layout.drawn), layout.marks);
  const tab = blockName !== null && known.has('cidr') ? { name: blockName, boxes: blockTabBoxes(layout.groups, blockName) } : undefined;
  return (
    <>
      <svg className="map-stage__svg" aria-hidden="true" viewBox={`0 0 ${size.width} ${size.height}`} width={size.width} height={size.height} style={{ marginLeft: frame.x, marginTop: frame.y }}>
        <GroupBoxes groups={layout.groups} tabs={tab?.boxes} />
        <LinkLines links={layout.links} />
        <MarkDots marks={layout.marks} />
        <Pieces pieces={pieces} icons={layout.icons} activePieceId={activePieceId} still={still} />
        <Traffic flows={flows} sent={sent} inTheAir={inTheAir} layout={layout} fans={fans} still={still} />
      </svg>
      <div className="html-layer">
        <GroupCaptions groups={layout.groups} known={known} frame={frame} />
        {tab && <BlockNames tabs={tab.boxes} name={tab.name} frame={frame} />}
        <MapLabels pieces={pieces} layout={layout} frame={frame} inspectTrigger={inspectTrigger} onActivate={onActivate} fans={fans} stamp={stampButtons({ fans, runs, frame, inspectTrigger, inspectStampsTrigger })} />
      </div>
      {!still && (
        <svg className="map-stage__flight-labels" aria-hidden="true" viewBox={`0 0 ${size.width} ${size.height}`} width={size.width} height={size.height} style={{ left: frame.x, top: frame.y }}>
          <FlightLabels flows={flows} inTheAir={inTheAir} layout={layout} />
        </svg>
      )}
    </>
  );
}

export function MapStage({ gap, startPieceId, controls, onCameraMove, ...props }: MapStageProps) {
  const stage = useElementSize();
  const room = gap ?? stage;
  const layout = Number.isFinite(room.width) && room.width > 0 ? layoutMap(props.world, props.pieces, { width: room.width, blockTab: props.blockName !== null }) : null;
  const frame = layout && frameOf(room.width, layout.size);
  const icon = layout && startPieceId ? layout.icons[startPieceId] : undefined;
  const start = icon && frame ? { x: frame.x + icon.x + icon.width / 2, y: frame.y + icon.y + icon.height / 2 } : undefined;
  const camera = useCamera({ stage, gap, drawing: layout && frame && { ...frame, ...layout.size }, start, controls, onMove: onCameraMove });
  const stageRef = useMergedRef(stage.ref, camera.stageRef);
  return (
    <>
      <div ref={stageRef} className={gap ? 'map-stage map-stage--under-panels' : 'map-stage'} onPointerDown={camera.onPointerDown} onKeyDown={camera.onKeyDown} onClickCapture={camera.onClickCapture}>
        <div ref={camera.sheet} className="map-stage__sheet" style={{ minWidth: layout?.size.width }}>
          {layout && frame && <Drawing {...props} inspectTrigger={camera.quietly(props.inspectTrigger)} inspectStampsTrigger={camera.quietly(props.inspectStampsTrigger)} layout={layout} frame={frame} />}
        </div>
      </div>
      <CameraButtons onZoomIn={camera.zoomIn} onZoomOut={camera.zoomOut} onFit={camera.fit} />
    </>
  );
}
