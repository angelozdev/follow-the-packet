import type { TermId } from '@/copy';
import type { GameSceneProps } from '@/scene/game-scene';
import type { InspectStampsTrigger } from './overlay/map-stamps';
import { MapStage } from './map-stage';

export interface GameScene2DProps extends GameSceneProps {
  known?: ReadonlySet<TermId>;
  inspectStampsTrigger: InspectStampsTrigger;
}

const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

/** The 2D map of the game, behind the build flag: it takes what the 3D scene takes and, besides, the terms the player knows, so a name shows only what the player has met (none known when the screen gives none). From those props it draws the world, the pieces with their labels, the name of the block and the piece whose card is open and the flows and the packets sent: in a still scene their traces and labels and, with animations on, their flight; and, when the screen opens a card (`overlay`), the card beside the piece whose id is `activePieceId`. */
export function GameScene2D({ world, pieces, flows, sent, known = NOTHING_KNOWN, blockName = null, activePieceId, still, overlay, inspectTrigger, inspectStampsTrigger, onActivate }: GameScene2DProps) {
  return <MapStage world={world} pieces={pieces} flows={flows} sent={sent} known={known} blockName={blockName} activePieceId={activePieceId} still={still} overlay={overlay} inspectTrigger={inspectTrigger} inspectStampsTrigger={inspectStampsTrigger} onActivate={onActivate} />;
}
