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
  known?: ReadonlySet<TermId>;
  blockName?: string | null;
  activePieceId: string | null;
  inspectTrigger: InspectTrigger;
  inspectStampsTrigger: InspectStampsTrigger;
  onActivate: (pieceId: string) => void;
  onCameraMove?: () => void;
}

const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

/** The map of the game: it takes the world, the pieces and the packets the screen gives it and, besides, the terms the player knows, so a name shows only what the player has met (none known when the screen gives none). From those props it draws the world, the pieces with their labels, the name of the block and the piece the player chose (`activePieceId`) and the flows and the packets sent: in a still scene their traces and labels and, with animations on, their flight. */
export function GameScene({ world, pieces, flows, sent, known = NOTHING_KNOWN, blockName = null, activePieceId, still, inspectTrigger, inspectStampsTrigger, onActivate, onCameraMove }: GameSceneProps) {
  return <MapStage world={world} pieces={pieces} flows={flows} sent={sent} known={known} blockName={blockName} activePieceId={activePieceId} still={still} inspectTrigger={inspectTrigger} inspectStampsTrigger={inspectStampsTrigger} onActivate={onActivate} onCameraMove={onCameraMove} />;
}
