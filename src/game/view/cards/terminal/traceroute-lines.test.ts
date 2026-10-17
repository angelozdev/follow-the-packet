import { describe, expect, it } from 'vitest';
import type { TermId } from '@/copy';
import { ROUTE_DEFAULT, applyAction } from '@/engine';
import { unknownTerms } from '@/levels/ladder';
import { EVERY_TERM, OFFICE_FLOORS, routedSendIncident, withDevice } from '@/testing';
import { sessionReducer, startSession, type Session } from '@/game/session';
import { tracerouteLines, type RouteLine } from './traceroute-lines';

const { officeRouter, server } = OFFICE_FLOORS;
const ROUTED = routedSendIncident();
const start = startSession([ROUTED], ROUTED.id);
const picks = (to: string, message = 'trace') => ({ from: 'you', to, message });
const sent = (session: Session, to: string, message = 'trace') => sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId: to, messageId: message });
const linesOf = (session: Session, to: string) => tracerouteLines(session, picks(to));
const without = (session: Session, ...terms: TermId[]): Session => ({ ...session, known: new Set([...session.known].filter((term) => !terms.includes(term))) });
const drawing = (session: Session, ...ids: string[]): Session => ({ ...session, incident: { ...session.incident, shown: ids } });
const hop = (number: number, address: string, time: string | null = null, mark: string | null = null): RouteLine => ({ hop: number, address, time, mark });
const STAR = (number: number) => hop(number, '*');
const NOTE = { silent: '«*» es un salto que no contestó a tiempo.', net: '«!N»: el equipo con esa IP avisó que no pudo llegar a la red de destino.', times: 'Los tiempos son cifras de ejemplo.' };

describe('tracerouteLines', () => {
  it('a traceroute lists its hops with the IP and the time, and a star for a silent hop', () => {
    expect(linesOf(sent(start, 'server'), 'server')).toEqual({
      lines: [hop(1, '192.168.1.1', '4 ms'), hop(2, '203.0.113.1', '20 ms'), hop(3, '203.0.113.2', '44 ms'), hop(4, server.ip, '84 ms')],
      notes: [NOTE.times],
      error: null,
    });
    expect(linesOf(sent(start, 'private'), 'private')).toEqual({
      lines: [hop(1, '192.168.1.1', '4 ms'), hop(2, '203.0.113.1', '20 ms'), STAR(3), STAR(4), STAR(5), STAR(6), STAR(7), STAR(8)],
      notes: [NOTE.silent, NOTE.times],
      error: null,
    });
  });

  it('is null until that traceroute was sent, and for a ping or an incomplete choice', () => {
    expect(linesOf(start, 'server')).toBeNull();
    expect(linesOf(sent(start, 'server'), 'printer')).toBeNull();
    expect(tracerouteLines(sent(start, 'server', 'ping'), picks('server', 'ping'))).toBeNull();
    expect(tracerouteLines(sent(start, 'server'), { from: 'you', to: 'server' })).toBeNull();
  });

  it('a traceroute that reaches a device in the same network has one line and no router', () => {
    expect(linesOf(sent(start, 'printer'), 'printer')?.lines).toEqual([hop(1, '192.168.1.21', '2 ms')]);
  });

  it('ends at the first warning that the destination cannot be reached, with its mark and a note in plain words', () => {
    const own = linesOf(sent(start, 'nobody'), 'nobody');
    expect(own).toEqual({
      lines: [hop(1, '192.168.1.10', null, '!H')],
      notes: ['«!H»: el equipo con esa IP avisó con {{host-unreachable}} que no pudo llegar al dispositivo de destino.'],
      error: null,
    });
    const router = linesOf(sent(start, 'no-server'), 'no-server');
    expect(router?.lines.at(-1)).toEqual(hop(4, '203.0.113.2', '44 ms', '!H'));
    expect(router?.lines).toHaveLength(4);
    expect(router?.notes).toEqual([own?.notes[0], NOTE.times]);
  });

  it('ends at a router with no route with its mark and a note in plain words, whether or not net-unreachable is known, and the note names no host', () => {
    const withoutDefaultRoute: Session = { ...start, world: applyAction(start.world, { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT }) };
    for (const session of [withoutDefaultRoute, without(withoutDefaultRoute, 'net-unreachable')]) {
      const view = linesOf(sent(session, 'server'), 'server');
      expect(view?.lines.at(-1)).toMatchObject({ address: '192.168.1.1', mark: '!N' });
      expect(view?.notes).toContain(NOTE.net);
    }
    expect(NOTE.net).not.toMatch(/host|dispositivo/i);
  });

  it('shows the line of a router with no route as a star until the first warning term is known, as for any other warning', () => {
    const withoutDefaultRoute: Session = { ...start, world: applyAction(start.world, { type: 'removeRoute', routerId: officeRouter.id, to: ROUTE_DEFAULT }) };
    const view = linesOf(sent(without(withoutDefaultRoute, 'net-unreachable', 'host-unreachable'), 'server'), 'server');
    expect(view?.lines.at(-1)).toEqual(STAR(2));
  });

  it('shows the time only once the term RTT is known, and then says that the figures are examples', () => {
    const early = linesOf(sent(without(start, 'rtt'), 'server'), 'server');
    expect(early?.lines.map((line) => line.time)).toEqual([null, null, null, null]);
    expect(early?.notes).toEqual([]);
  });

  it('shows a router that warned as a star while the warning is not a known term, as the map shows no warning', () => {
    const unaware = linesOf(sent(without(start, 'time-exceeded'), 'private'), 'private');
    expect(unaware?.lines.map((line) => line.address)).toEqual(Array(8).fill('*'));
    expect(linesOf(sent(without(start, 'host-unreachable'), 'nobody'), 'nobody')?.lines).toEqual([STAR(1)]);
  });

  it('names only the routers its incident draws, and says outside the office for one that is not', () => {
    const lines = linesOf(sent(drawing(start, 'your-laptop', officeRouter.id, server.id), 'server'), 'server');
    expect(lines?.lines.map((line) => line.address)).toEqual(['192.168.1.1', 'fuera de la oficina', 'fuera de la oficina', server.ip]);
    expect(lines?.lines.map((line) => line.time)).toEqual(['4 ms', '20 ms', '44 ms', '84 ms']);
    const hidden = linesOf(sent(drawing(start, 'your-laptop', server.id), 'server'), 'server');
    expect(hidden?.lines.map((line) => line.address)).toEqual(['dentro de la oficina', 'fuera de la oficina', 'fuera de la oficina', server.ip]);
  });

  it('a sender that cannot send at all has no lines and says why', () => {
    const cut = sent({ ...start, world: withDevice(start.world, 'your-laptop', { gateway: undefined }) }, 'server');
    expect(linesOf(cut, 'server')).toEqual({ lines: [], notes: [], error: 'No salió del dispositivo: no tiene por dónde sacar el paquete.' });
  });

  it('tags only the terms the player knows, whichever term is missing', () => {
    for (const missing of EVERY_TERM) {
      const unaware = without(start, missing);
      for (const to of ['server', 'private', 'nobody', 'no-server']) {
        const view = linesOf(sent(unaware, to), to);
        const texts = [...(view?.notes ?? []), ...(view?.error ? [view.error] : [])];
        expect(unknownTerms(texts, unaware.known), `${missing} / ${to}`).toEqual([]);
      }
    }
  });

  it('the lines of a new send replace the old ones', () => {
    const again = sent(sent(start, 'server'), 'server');
    expect(again.sent).toHaveLength(1);
    expect(linesOf(again, 'server')?.lines).toHaveLength(4);
  });
});
