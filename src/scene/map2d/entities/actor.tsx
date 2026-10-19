import type { ReactNode } from 'react';
import type { ClientActor } from '@/engine';
import type { Box } from '@/scene/map2d/layout/arrange/geometry';

const CUBE = 'M24 6l16 9v18l-16 9-16-9V15z';
const CUBE_EDGES = 'M8 15l16 9 16-9M24 24v18';
const SCREEN = '12,21.25 20,25.75 20,35.75 12,31.25';
const MASK = 'M11 23.5l8 4.5M29 28.2l8-4.5';
const HOUSE = 'M8 22l16-14 16 14v18H8z';
const HOUSE_DOOR = 'M20 40V30h8v10';

const ACTOR_FRONT: Record<ClientActor['kind'], ReactNode> = {
  you: (
    <>
      <path d={CUBE} />
      <path className="map-piece__line map-piece__thin" d={CUBE_EDGES} />
      <polygon className="map-piece__shade map-piece__thin" points={SCREEN} />
    </>
  ),
  attacker: (
    <>
      <path className="map-piece__ink" d={CUBE} />
      <path className="map-piece__line map-piece__thin map-piece__paper" d={CUBE_EDGES} />
      <path className="map-piece__line map-piece__bold map-piece__paper" d={MASK} />
    </>
  ),
  home: (
    <>
      <path d={HOUSE} />
      <path className="map-piece__shade" d={HOUSE_DOOR} />
    </>
  ),
};

/** Takes the box of a client of the internet and its variant; returns its piece, each with a mark of its own: a cube with a screen on its left face for you, a cube of ink with edges of paper and a mask of two slots for the attacker, and the front of a cube under a gabled roof with a door for a home. */
export function ActorPiece({ box, variant }: { box: Box; variant: ClientActor['kind'] }) {
  return <g transform={`translate(${box.x} ${box.y})`}>{ACTOR_FRONT[variant]}</g>;
}
