import type { TermId } from '@/copy';
import type { GameSceneProps } from '@/scene/game-scene';
import { MapStage } from './map-stage';

export interface GameScene2DProps extends GameSceneProps {
  known?: ReadonlySet<TermId>;
}

const NOTHING_KNOWN: ReadonlySet<TermId> = new Set();

/** The 2D map of the game, behind the build flag: it takes what the 3D scene takes and, besides, the terms the player knows, so a name shows only what the player has met (none known when the screen gives none). The world and the pieces are all it draws so far. */
export function GameScene2D({ world, pieces, known = NOTHING_KNOWN }: GameScene2DProps) {
  return <MapStage world={world} pieces={pieces} known={known} />;
}
