import { ContactShadows, MapControls } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Network } from '@/engine';
import { ActorPiece, DevicePiece, EdgePiece, FirewallPiece, InternetPiece, NetworkPiece } from './entities';
import { cardAnchorPosition, computeLayout, labelPosition, layoutCenter, piecePosition, type Layout } from './layout';
import { MapCanvas } from './map-canvas';
import { CardAnchor } from './overlay/card-anchor';
import type { OnInspect } from './overlay/inspect-handlers';
import { PieceAnchor } from './overlay/piece-anchor';
import type { MapPiece } from './overlay/piece-label';
import { Road } from './road';
import { Traffic, type MapFlow } from './traffic/traffic';

const CAMERA_OFFSET = 14;
const CAMERA_ZOOM = 38;

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  flows: MapFlow[];
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

export function GameScene({ world, pieces, flows, still, activePieceId, overlay, onInspect, onActivate }: GameSceneProps) {
  const layout = computeLayout(world, pieces.some((piece) => piece.kind === 'edge'));
  const [cx, cz] = layoutCenter(layout);
  const active = pieces.find((piece) => piece.id === activePieceId);
  return (
    <MapCanvas camera={[cx + CAMERA_OFFSET, CAMERA_OFFSET, cz + CAMERA_OFFSET]} zoom={CAMERA_ZOOM}>
      <MapControls target={[cx, 0, cz]} enableRotate={false} minZoom={18} maxZoom={110} screenSpacePanning />
      <NetworkPiece variant={world.kind} width={layout.sheet.width} depth={layout.sheet.depth} />
      <Road layout={layout} />
      {pieces.map((piece) => (
        <PieceShape key={piece.id} piece={piece} layout={layout} selected={piece.id === activePieceId} still={still} />
      ))}
      {pieces.map((piece) => (
        <PieceAnchor key={piece.id} piece={piece} position={labelPosition(piece, layout)} onInspect={onInspect} onActivate={onActivate} />
      ))}
      <Traffic flows={flows} layout={layout} still={still} onInspect={onInspect} />
      {active && overlay && <CardAnchor position={cardAnchorPosition(active.anchorId, layout)}>{overlay}</CardAnchor>}
      <ContactShadows position={[0, 0.005, 0]} opacity={0.22} scale={60} blur={2.5} far={4} />
    </MapCanvas>
  );
}
