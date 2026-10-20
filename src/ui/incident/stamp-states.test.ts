import { describe, expect, it } from 'vitest';
import { stampLabel, toPlainText, type TermId } from '@/copy';
import { pieceViews, sessionReducer, startSession, type Session } from '@/game';
import { INCIDENTS } from '@/levels';
import { ADDRESS, DEVICE, GATEWAY, IP, MESSAGE, ORIGIN, ROUTER } from '@/levels/01-first-day/shared';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { layoutMap } from '@/scene/layout/map-layout';
import { INTERNET, station, stationsFor } from '@/scene/layout/stations';
import { flowLook } from '@/scene/traffic/flow-look';
import { EVERY_TERM, OFFICE_FLOORS, officeNet, officeTwoFloorsNet, sendIncident, withDevice } from '@/testing';
import type { Firewall } from '@/engine';

type Run = Session['runs'][number] | Session['sent'][number];

const drawn = (run: Run) => {
  const look = flowLook(run);
  return { look, name: stampLabel(toPlainText(run.label), look.stamp) };
};

const MAP_WIDTH = 1060;

const placed = (session: Session, run: Run) => {
  const layout = layoutMap(session.world, pieceViews(session), { width: MAP_WIDTH, blockTab: false });
  return { layout, stations: stationsFor(run.trace, run.packet, layout.drawn, { hiddenStop: run.hiddenStop }) };
};

const wholeWorld = (session: Session): Session => ({ ...session, known: EVERY_TERM });

const sendFrom = (session: Session, toId: string) => {
  const sent = sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId: 'ping' }).sent;
  expect(sent).toHaveLength(1);
  return sent[0];
};

const officeSession = (base = officeNet(), ...introduced: TermId[]) => {
  const incident = { ...sendIncident(), base, introduces: [...sendIncident().introduces, ...introduced] };
  return startSession([incident], incident.id);
};

const FIREWALL_OF_YOU: Firewall = { id: 'fw-you', name: 'tu-laptop', kind: 'host-firewall', inbound: [], outbound: [] };
const guardedLucia = () => withDevice(officeNet(), 'lucia-laptop', { firewallIds: ['fw-lucia'] });
const guardedYou = () => withDevice({ ...officeNet(), firewalls: [FIREWALL_OF_YOU] }, 'your-laptop', { firewallIds: [FIREWALL_OF_YOU.id] });

describe('the stamp of a packet the game computed', () => {
  const attacker = (session: Session) => {
    const run = session.runs.find((other) => other.kind === 'forbidden');
    if (!run) throw new Error('04-01 has no forbidden flow');
    return run;
  };
  const opened = sessionReducer(startSession(INCIDENTS, '04-01'), { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id });

  it('the attacker of 04-01 is an intruder that the Security Group blocks, and it leaves ✕', () => {
    const run = attacker(startSession(INCIDENTS, '04-01'));
    expect(run).toMatchObject({ intruder: true, blocked: true, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ intruder: true, end: 'blocked', stamp: 'blocked' });
    expect(name).toMatch(/Bloqueado\.$/);
  });

  it('the attacker of 04-01 leaves the stamp of an intruder once a rule lets it in', () => {
    const run = attacker(opened);
    expect(run).toMatchObject({ intruder: true, blocked: false, reached: true });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ intruder: true, stamp: 'intruder' });
    expect(name).toMatch(/Entró y no debía\.$/);
  });

  it('a ping to an address no device has is lost, not blocked, and its stamp says so', () => {
    const run = sendFrom(officeSession(), 'nobody');
    expect(run).toMatchObject({ intruder: false, blocked: false, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(name).toMatch(/Perdido\.$/);
  });

  it('a ping to a laptop whose firewall has no rules is blocked by that firewall, and its stamp says so', () => {
    const run = sendFrom(officeSession(guardedLucia(), 'firewall'), 'lucia');
    expect(run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop', at: 'lucia-laptop' }));
    expect(run).toMatchObject({ intruder: false, blocked: true, reached: false });
    const { look, name } = drawn(run);
    expect(look).toMatchObject({ end: 'blocked', stamp: 'blocked' });
    expect(name).toMatch(/Bloqueado\.$/);
  });

  it('the same ping to that laptop with no firewall on it arrives, so the block comes from the firewall', () => {
    const run = sendFrom(officeSession(), 'lucia');
    expect(run).toMatchObject({ blocked: false, reached: true });
    expect(drawn(run).look).toMatchObject({ stamp: 'arrived' });
  });
});

describe('a packet that a firewall the player does not know yet stops', () => {
  const lostAt = (session: Session, toId: string) => {
    const run = sendFrom(session, toId);
    return { run, ...placed(wholeWorld(session), run), ...drawn(run) };
  };

  it('a packet dropped by a firewall the player does not know yet leaves a lost stamp, not a blocked one', () => {
    const { run, look, name } = lostAt(officeSession(guardedLucia()), 'lucia');
    expect(run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-in', verdict: 'drop', at: 'lucia-laptop' }));
    expect(run).toMatchObject({ blocked: false, reached: false });
    expect(look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(name).toMatch(/Perdido\.$/);
    expect(name).not.toMatch(/firewall|Bloqueado/i);
  });

  it('a packet stopped by a firewall the player does not know yet ends at the door of its device, with the lost stamp', () => {
    const coming = lostAt(officeSession(guardedLucia()), 'lucia');
    expect(coming.stations.at(-1)).toBe(station.door('lucia-laptop'));
    expect(coming.look.stamp).toBe('lost');
    const going = lostAt(officeSession(guardedYou()), 'lucia');
    expect(going.run.trace.steps).toContainEqual(expect.objectContaining({ stage: 'firewall-out', verdict: 'drop', at: 'your-laptop' }));
    expect(going.stations).toEqual([station.door('your-laptop'), station.doorstep('your-laptop')]);
    expect(going.look.stamp).toBe('lost');
  });

  it('is drawn in front of the firewall, with the blocked stamp, once the firewall is a known term', () => {
    const known = lostAt(officeSession(guardedLucia(), 'firewall'), 'lucia');
    expect(known.stations.at(-1)).toBe(station.firewall('lucia-laptop'));
    expect(known.look).toMatchObject({ end: 'blocked', stamp: 'blocked' });
  });
});

describe('the ping to laptop-marta, before and after the incident that shows its firewall', () => {
  const stampedAt = (incidentId: string) => {
    const session = startSession(INCIDENTS, incidentId);
    const run = sendFrom(session, ADDRESS.marta.id);
    return { run, ...placed(session, run), ...drawn(run) };
  };

  it('01-05 leaves a lost stamp at the door of laptop-marta and 01-11 a blocked stamp in front of its firewall', () => {
    const before = stampedAt('01-05');
    expect(before.stations.at(-1)).toBe(station.door(DEVICE.marta.id));
    expect(before.look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(before.name).not.toMatch(/firewall|Bloqueado/i);
    const after = stampedAt('01-11');
    expect(after.stations.at(-1)).toBe(station.firewall(DEVICE.marta.id));
    expect(after.look).toMatchObject({ end: 'blocked', stamp: 'blocked' });
    expect(after.name).toBe(`Paquete: ping de ${DEVICE.you.name} a ${DEVICE.marta.name}. Bloqueado.`);
  });
});

describe('a warning that comes back to the sender', () => {
  const { floor1, officeRouter, server } = OFFICE_FLOORS;
  const WARNINGS: TermId[] = ['host-unreachable', 'time-exceeded'];
  const floorsSession = (...introduced: TermId[]) => {
    const base = sendIncident();
    const incident = {
      ...base,
      base: officeTwoFloorsNet(),
      introduces: [...base.introduces, ...introduced],
      send: {
        ...base.send,
        to: [...base.send.to, { id: 'nobody-here', address: floor1.nobody }, { id: 'server', address: server.ip }],
        message: [...base.send.message, { id: 'ping-1', label: '{{ping}}', icmpType: 8 as const, command: 'ping' as const, ttl: 1 }],
      },
    };
    return startSession([incident], incident.id);
  };
  const sendOver = (session: Session, toId: string, messageId = 'ping') => {
    const run = sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId, messageId }).sent[0];
    return { run, ...placed(wholeWorld(session), run), ...drawn(run) };
  };

  it('a warning that the sender itself generates leaves the stamp of a warning at its own doorstep, and nothing travels back', () => {
    const { run, stations, look, name } = sendOver(floorsSession(...WARNINGS), 'nobody-here');
    expect(run.trace.notice).toMatchObject({ kind: 'host-unreachable', fromId: 'your-laptop' });
    expect(run.warning).toEqual({ term: 'host-unreachable', by: 'sender' });
    expect(look).toMatchObject({ end: 'self-warned', stamp: 'warned' });
    expect(stations).toEqual([station.door('your-laptop'), station.doorstep('your-laptop')]);
    expect(name).toMatch(/Apareció un aviso\.$/);
  });

  it('a warning from a router travels back from that router and leaves the stamp of a warning where the router stands', () => {
    const { run, stations, look, name } = sendOver(floorsSession(...WARNINGS), 'server', 'ping-1');
    expect(run.trace.notice).toMatchObject({ kind: 'time-exceeded', fromId: officeRouter.id });
    expect(look).toMatchObject({ end: 'warned', stamp: 'warned' });
    expect(stations.at(-1)).toBe(station.router(officeRouter.id));
    expect(name).toMatch(/Apareció un aviso\.$/);
  });

  it('a warning whose term the player does not know yet leaves the lost stamp, as a packet nobody answered does, at the same place', () => {
    const own = sendOver(floorsSession(), 'nobody-here');
    expect(own.run.trace.notice).toBeDefined();
    expect(own.look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(own.name).toMatch(/Perdido\.$/);
    expect(own.stations).toEqual([station.door('your-laptop'), station.doorstep('your-laptop')]);
    const routed = sendOver(floorsSession('host-unreachable'), 'server', 'ping-1');
    expect(routed.look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(routed.stations.at(-1)).toBe(station.router(officeRouter.id));
  });
});

describe('the stamp of a ping that dies at a router the map does not draw', () => {
  const session = startSession(INCIDENTS, '01-08');
  const sent = sessionReducer(session, { type: 'sendPacket', fromId: 'you', toId: ADDRESS.otherOffice.id, messageId: 'ping' });
  const [run] = sent.sent;
  const { layout, stations } = placed(sent, run);

  it('01-08: the lost ping to 10.0.0.10 ends on the road between the office router and the internet, with the lost stamp', () => {
    expect(run.trace.steps.at(-1)).toMatchObject({ at: ROUTER.provider.id, verdict: 'drop', reason: { code: 'forward-private-dropped', ip: IP.otherOfficePrinter } });
    expect(layout.drawn.routers).not.toContain(ROUTER.provider.id);
    expect(layout.drawn.routers).toContain(ROUTER.office.id);
    expect(stations.at(-1)).toBe(station.mid(station.router(ROUTER.office.id), INTERNET));
    expect(stations.slice(0, -1)).not.toContain(INTERNET);
    expect(drawn(run).look).toMatchObject({ end: 'lost', stamp: 'lost' });
    expect(drawn(run).name).toMatch(/Perdido\.$/);
  });
});

describe('the path of a ping that a device cannot send or hands to a gateway that is not a router, in the incidents of chapter 1', () => {
  const watch = INCIDENTS.find((incident) => incident.id === '01-14');
  const rightCause = (session: Session) => (watch?.mechanic === 'diagnose' ? watch.diagnose.cases[session.caseIndex].cause.options.findIndex((option) => option.correct) : -1);
  const atCase = (number: number) =>
    Array.from({ length: number - 1 }).reduce<Session>((session) => sessionReducer(sessionReducer(session, { type: 'nameCause', index: rightCause(session) }), { type: 'nextCase' }), startSession(INCIDENTS, '01-14'));
  const pingFrom = (session: Session, fromId: string, toId: string) => {
    const sent = sessionReducer(session, { type: 'sendPacket', fromId, toId, messageId: MESSAGE.ping.id });
    const run = sent.sent.at(-1);
    if (!run) throw new Error('nothing was sent');
    return { run, ...placed(sent, run) };
  };

  it('01-07: with no gateway the ping to laptop-andres never leaves the doorstep of tu-laptop', () => {
    const { run, stations } = pingFrom(startSession(INCIDENTS, '01-07'), ORIGIN.you.id, ADDRESS.andres.id);
    expect(run.trace.outcome).toBe('no-route');
    expect(stations).toEqual([station.door(DEVICE.you.id), station.doorstep(DEVICE.you.id)]);
  });

  it('01-07: with the printer as the gateway the ping ends at the door of the printer, which is drawn', () => {
    const picked = sessionReducer(startSession(INCIDENTS, '01-07'), { type: 'setSetting', deviceId: DEVICE.you.id, settingId: GATEWAY.setting, chipId: GATEWAY.printer });
    const { run, layout, stations } = pingFrom(picked, ORIGIN.you.id, ADDRESS.andres.id);
    expect(run.trace.steps.at(-1)).toMatchObject({ at: DEVICE.printer.id, reason: { code: 'route-gateway-not-a-router' } });
    expect(layout.drawn.devices).toHaveProperty([DEVICE.printer.id]);
    expect(stations.at(-1)).toBe(station.door(DEVICE.printer.id));
  });

  it('01-14: the pings of case 1 and case 3 that have no gateway to leave by never leave the doorstep of the sender', () => {
    const [first, third] = [pingFrom(atCase(1), ORIGIN.you.id, ADDRESS.server.id), pingFrom(atCase(3), ORIGIN.andres.id, ADDRESS.printer.id)];
    for (const [{ run, stations }, sender] of [[first, DEVICE.you.id], [third, DEVICE.andres.id]] as const) {
      expect(run.trace.steps.map((step) => step.reason.code)).toContain('route-no-gateway');
      expect(stations).toEqual([station.door(sender), station.doorstep(sender)]);
    }
  });
});
