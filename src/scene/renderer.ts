export type MapRenderer = '2d' | '3d';

export const MAP_RENDERER: MapRenderer = import.meta.env.VITE_MAP_RENDERER === '3d' ? '3d' : '2d';
