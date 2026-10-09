import { ContactShadows, MapControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useState, type ReactNode } from 'react';
import type { Network } from '@/engine';
import { HtmlLayerContext } from './html-layer';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter } from './layout';
import { CardAnchor } from './overlay/card-anchor';
import type { OnInspect } from './overlay/inspect-handlers';
import { PieceAnchor } from './overlay/piece-anchor';
import type { MapPiece } from './overlay/piece-label';
import { ActorMark, Barrier, Building, Gateway, Road, Sheet } from './pieces';
import { Traffic, type MapFlow } from './traffic/traffic';

const CAMERA_OFFSET = 14;
const CAMERA_ZOOM = 38;

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  flows: MapFlow[];
  intrudedDeviceIds: ReadonlySet<string>;
  still: boolean;
  activePieceId: string | null;
  overlay: ReactNode;
  onInspect: OnInspect;
  onActivate: (pieceId: string) => void;
}

export function GameScene({ world, pieces, flows, intrudedDeviceIds, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world);
  const [cx, cz] = layoutCenter(layout);
  const [htmlLayer, setHtmlLayer] = useState<HTMLDivElement | null>(null);
  const active = pieces.find((piece) => piece.id === activePieceId);
  return (
    <>
      <Canvas
        orthographic
        camera={{ position: [cx + CAMERA_OFFSET, CAMERA_OFFSET, cz + CAMERA_OFFSET], zoom: CAMERA_ZOOM, near: 0.1, far: 500 }}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <HtmlLayerContext.Provider value={htmlLayer}>
          <ambientLight intensity={1.2} />
          <directionalLight position={[8, 14, 6]} intensity={1.1} />
          <MapControls target={[cx, 0, cz]} enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
          <Sheet layout={layout} />
          <Road layout={layout} />
          <Gateway position={layout.edge} />
          {world.devices.map((device) => (
            <Building key={device.id} spot={layout.devices[device.id]} shaking={intrudedDeviceIds.has(device.id)} still={still} />
          ))}
          {pieces
            .filter((piece) => piece.kind === 'firewall')
            .map((piece) => (
              <Barrier key={piece.id} spot={layout.devices[piece.anchorId]} active={piece.id === activePieceId} still={still} />
            ))}
          {world.actors.map((actor) => (
            <ActorMark key={actor.id} position={layout.actors[actor.id]} actor={actor} />
          ))}
          {pieces.map((piece) => (
            <PieceAnchor key={piece.id} piece={piece} position={labelPosition(piece, layout)} onInspect={onInspect} onActivate={onActivate} />
          ))}
          <Traffic flows={flows} layout={layout} still={still} onInspect={onInspect} />
          {active && overlay && <CardAnchor position={cardAnchorPosition(active.anchorId, layout)}>{overlay}</CardAnchor>}
          <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
        </HtmlLayerContext.Provider>
      </Canvas>
      <div ref={setHtmlLayer} className="html-layer" />
    </>
  );
}
