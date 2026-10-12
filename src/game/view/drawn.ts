import { entityTerm, type EntityRef, type TermId } from '@/copy';
import { revealsRoutersByTraceroute, shownOf } from '@/levels';
import { currentCase, type Session } from '@/game/session';
import { revealedRouterIds } from './revealed-routers';

export const ROUTER_ENTITY = { kind: 'edge', variant: 'router' } as const;

/** True when the map draws a piece of this entity: its term is known, or it has none. A device and an actor are the base of every map and are always drawn; the firewall, the edge and the internet wait for their terms. */
export function isDrawn(known: ReadonlySet<TermId>, entity: EntityRef): boolean {
  const term = entityTerm(entity);
  return term === null || known.has(term);
}

/** Returns the ids of the world the incident draws, or those of the case a diagnose is on when it has its own list; undefined when there is no list and the whole world is drawn. */
export function shownIds(session: Session): string[] | undefined {
  return shownOf(session.incident, currentCase(session));
}

/** True when the screen draws the world thing with this id: its list names it, or it has no list and draws the whole world. The list is the incident's, or, in a case of a diagnose that has its own, the case's. A firewall is not listed, it is drawn with its device. */
export function isShown(session: Session, id: string): boolean {
  const shown = shownIds(session);
  return shown === undefined || shown.includes(id);
}

/** True when the incident keeps this router out of sight until a traceroute names it, and none has. */
export function waitsForTraceroute(session: Session, routerId: string): boolean {
  return revealsRoutersByTraceroute(session.incident) && !revealedRouterIds(session).has(routerId);
}

/** True when the map draws the router with this id: the incident shows it, the term router is known and, in an incident whose routers wait for a traceroute, a traceroute the player sent names it. A text that names a router must agree with this. */
export function drawsRouter(session: Session, routerId: string): boolean {
  return isShown(session, routerId) && isDrawn(session.known, ROUTER_ENTITY) && !waitsForTraceroute(session, routerId);
}
