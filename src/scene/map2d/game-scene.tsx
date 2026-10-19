import type { TermId } from '@/copy';
import type { GameSceneProps } from '@/scene/game-scene';
import { MapStage } from './map-stage';

export interface GameScene2DProps extends GameSceneProps {
  known?: ReadonlySet<TermId>;
}

const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

/** The 2D map of the game, behind the build flag: it takes what the 3D scene takes and, besides, the terms the player knows, so a name shows only what the player has met (none known when the screen gives none). From those props it draws the world, the pieces with their labels, the name of the block and the piece whose card is open; the flows, the packets sent and the card are for the tasks that draw them. */
export function GameScene2D({ world, pieces, known = NOTHING_KNOWN, blockName = null, activePieceId, still, inspectTrigger, onActivate }: GameScene2DProps) {
  return <MapStage world={world} pieces={pieces} known={known} blockName={blockName} activePieceId={activePieceId} still={still} inspectTrigger={inspectTrigger} onActivate={onActivate} />;
}
