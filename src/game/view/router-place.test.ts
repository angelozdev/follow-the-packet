import { describe, expect, it } from 'vitest';
import { OFFICE_FLOORS, routedSendIncident } from '@/testing';
import { startSession, type Session } from '@/game/session';
import { placesOf, routerPlace } from './router-place';

const { officeRouter, provider, backbone } = OFFICE_FLOORS;
const ROUTED = routedSendIncident();
const start = startSession([ROUTED], ROUTED.id);
const showing = (...ids: string[]): Session => ({ ...start, incident: { ...start.incident, shown: ids } });

describe('routerPlace', () => {
  it('names every router the map draws', () => {
    expect([officeRouter, provider, backbone].map((router) => routerPlace(start, router.id))).toEqual(['named', 'named', 'named']);
    expect(routerPlace(showing(officeRouter.id, provider.id), provider.id)).toBe('named');
  });

  it('puts a router the incident does not show outside the office when none of its interfaces faces a local network, and inside when one does', () => {
    const session = showing('your-laptop');
    expect(routerPlace(session, provider.id)).toBe('outside');
    expect(routerPlace(session, backbone.id)).toBe('outside');
    expect(routerPlace(session, officeRouter.id)).toBe('inside');
  });

  it('does not draw a router while the term router is unknown, so it is not named either', () => {
    const unaware: Session = { ...start, known: new Set([...start.known].filter((term) => term !== 'router')) };
    expect(routerPlace(unaware, officeRouter.id)).toBe('inside');
    expect(routerPlace(unaware, provider.id)).toBe('outside');
  });

  it('names an id that is not a router of the world, since it stands for itself', () => {
    expect(routerPlace(start, 'your-laptop')).toBe('named');
    expect(routerPlace(start, 'ghost')).toBe('named');
  });

  it('is the function the texts ask for the places of a session', () => {
    expect(placesOf(showing('your-laptop'))(provider.id)).toBe('outside');
  });
});
