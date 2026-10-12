import { ContactShadows, MapControls } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Network } from '@/engine';
import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, InternetPiece, NetworkPiece } from './entities';
import { CAMERA_ZOOM, cameraPosition, cardPlacement, computeLayout, labelPosition, layoutCenter, piecePosition, type Layout } from './layout';
import { MapCanvas } from './map-canvas';
import { CardAnchor } from './overlay/card-anchor';
import { FloorLabel } from './overlay/floor-label';
import type { OnInspect } from './overlay/inspect-handlers';
import { PieceAnchor } from './overlay/piece-anchor';
import type { MapPiece } from './overlay/piece-label';
import { Road } from './road';
import { Traffic, type MapFlow, type MapSent } from './traffic/traffic';

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  flows: MapFlow[];
  sent: MapSent[];
  still: boolean;
  activePieceId: string | null;
  overlay: ReactNode;
  onInspect: OnInspect;
  onActivate: (pieceId: string) => void;
}

function PieceShape({ piece, layout, selected, still }: { piece: MapPiece; layout: Layout; selected: boolean; still: boolean }) {
  const position = piecePosition(piece, layout);
  switch (piece.kind) {
    case 'device':
      return <DevicePiece position={position} variant={piece.variant} selected={selected} intruded={piece.state === 'intruded'} still={still} />;
    case 'firewall':
      return <FirewallPiece position={position} variant={piece.variant} selected={selected} blocking={piece.state === 'blocking'} still={still} />;
    case 'edge':
      return <EdgePiece position={position} variant={piece.variant} />;
    case 'internet':
      return <InternetPiece position={position} />;
    case 'actor':
      return <ActorPiece position={position} variant={piece.variant} />;
  }
}

export function GameScene({ world, pieces, flows, sent, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world, pieces);
  const floors = Object.entries(layout.floors);
  const [cx, cz] = layoutCenter(layout);
  const active = pieces.find((piece) => piece.id === activePieceId);
  const placement = active && cardPlacement(active, pieces.filter((piece) => piece.id !== active.id), layout);
  return (
    <MapCanvas camera={cameraPosition(layout)} target={[cx, 0, cz]} zoom={CAMERA_ZOOM}>
      <MapControls target={[cx, 0, cz]} enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
      {floors.length === 0 && layout.sheet.width > 0 && <NetworkPiece variant={world.kind} width={layout.sheet.width} depth={layout.sheet.depth} />}
      {floors.map(([id, floor]) => (
        <NetworkPiece key={id} variant={world.kind} x={floor.x} width={floor.width} depth={floor.depth} />
      ))}
      {floors.map(([id, floor]) => (
        <FloorLabel key={id} position={floor.label} name={world.lans?.find((lan) => lan.id === id)?.name ?? id} />
      ))}
      {layout.blocks.map((block) => (
        <NetworkPiece key={`${block.x}`} variant="block" x={block.x} z={block.z} width={block.width} depth={block.depth} />
      ))}
      <Road layout={layout} />
      {pieces.map((piece) => (
        <PieceShape key={piece.id} piece={piece} layout={layout} selected={piece.id === activePieceId} still={still} />
      ))}
      {pieces.map((piece) => (
        <PieceAnchor key={piece.id} piece={piece} position={labelPosition(piece, layout)} onInspect={onInspect} onActivate={onActivate} />
      ))}
      <Traffic flows={flows} sent={sent} layout={layout} still={still} onInspect={onInspect} />
      {placement && overlay && <CardAnchor placement={placement}>{overlay}</CardAnchor>}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
    </MapCanvas>
  );
}
