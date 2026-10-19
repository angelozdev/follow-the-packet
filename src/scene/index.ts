import { GameScene as GameScene3D } from './game-scene';
import { GameScene2D } from './map2d/game-scene';
import { MAP_RENDERER } from './renderer';

export const GameScene = MAP_RENDERER === '2d' ? GameScene2D : GameScene3D;
export { CatalogScene } from './catalog/catalog-scene';
export { EntityIcon, StampIcon } from './entities';
export { MAP_CARD, MAP_MARKS } from './html-layer';
export { InkIcon } from './ink';
export { MAP_RENDERER } from './renderer';
export type { GameSceneProps } from './game-scene';
export { pieceDomId } from './overlay/piece-label';
