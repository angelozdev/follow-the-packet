import { CatalogScene as CatalogScene3D } from './catalog/catalog-scene';
import { GameScene as GameScene3D } from './game-scene';
import { CatalogScene2D } from './map2d/catalog/catalog-scene';
import { GameScene2D } from './map2d/game-scene';
import { MAP_RENDERER } from './renderer';

export const GameScene = MAP_RENDERER === '2d' ? GameScene2D : GameScene3D;
export const CatalogScene = MAP_RENDERER === '2d' ? CatalogScene2D : CatalogScene3D;
export { EntityIcon, StampIcon } from './entities';
export { MAP_CARD, MAP_MARKS } from './html-layer';
export { InkIcon } from './ink';
export { MAP_RENDERER } from './renderer';
export type { GameSceneProps } from './game-scene';
export { pieceDomId } from './overlay/piece-label';
