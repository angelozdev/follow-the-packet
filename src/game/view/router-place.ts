import type { PlaceOf, RouterPlace } from '@/copy';
import { facesALan } from '@/engine';
import type { Session } from '@/game/session';
import { drawsRouter } from './drawn';

/** Returns where a router stands for the player: named when the map draws it, and otherwise inside the office when one of its interfaces faces a local network, or outside it. An id that is not a router of the world stands for itself and is named. */
export function routerPlace(session: Session, routerId: string): RouterPlace {
  const router = (session.world.routers ?? []).find((candidate) => candidate.id === routerId);
  if (!router || drawsRouter(session, router.id)) return 'named';
  return facesALan(session.world, router) ? 'inside' : 'outside';
}

/** Returns `routerPlace` of this session as the function the texts ask. */
export function placesOf(session: Session): PlaceOf {
  return (routerId) => routerPlace(session, routerId);
}
