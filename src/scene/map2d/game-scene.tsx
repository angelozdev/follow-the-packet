import type { ReactNode } from 'react';
import type { TermId } from '@/copy';
import type { Network } from '@/engine';
import type { InspectTrigger } from '@/scene/overlay/inspect-trigger';
import type { MapPiece } from '@/scene/overlay/piece-label';
import type { DrawnRun, InspectStampsTrigger, SentRun } from './overlay/map-stamps';
import { MapStage } from './map-stage';

export interface GameSceneProps {
  world: Network;
  pieces: MapPiece[];
  flows: DrawnRun[];
  sent: SentRun[];
  still: boolean;
  blockName?: string | null;
  activePieceId: string | null;
  overlay: ReactNode;
  inspectTrigger: InspectTrigger;
  onActivate: (pieceId: string) => void;
}

export interface GameScene2DProps extends GameSceneProps {
  known?: ReadonlySet<TermId>;
  inspectStampsTrigger: InspectStampsTrigger;
}

const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

/** The map of the game: it takes the world, the pieces, the packets and the card the screen gives it and, besides, the terms the player knows, so a name shows only what the player has met (none known when the screen gives none). From those props it draws the world, the pieces with their labels, the name of the block and the piece whose card is open and the flows and the packets sent: in a still scene their traces and labels and, with animations on, their flight; and, when the screen opens a card (`overlay`), the card beside the piece whose id is `activePieceId`. */
export function GameScene2D({ world, pieces, flows, sent, known = NOTHING_KNOWN, blockName = null, activePieceId, still, overlay, inspectTrigger, inspectStampsTrigger, onActivate }: GameScene2DProps) {
  return <MapStage world={world} pieces={pieces} flows={flows} sent={sent} known={known} blockName={blockName} activePieceId={activePieceId} still={still} overlay={overlay} inspectTrigger={inspectTrigger} inspectStampsTrigger={inspectStampsTrigger} onActivate={onActivate} />;
}
