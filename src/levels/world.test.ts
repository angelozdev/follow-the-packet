import { describe, expect, it } from 'vitest';
import { RECORD_TTL, applyAction, networkSchema, simulate, type Network, type NetworkAction, type PacketSpec, type ServerActor } from '@/engine';
import { NAME_SERVERS, OFFICE_FLOORS, diagnoseIncident, gatewayIncident, namesSendIncident, officeNet, outboundFilterIncident, tcpService } from '@/testing';
import { DEVICE, IP } from './01-first-day/shared';
import { DAY_SHIFT_RULE, FROM, SG, WHAT } from './04-iaas/shared';
import { chipsOfRule } from './contract/chips';
import { ruleIdFor, type Incident, type PlaceEntryMove, type PlayerMove, type SettingMove, type TableSpec } from './contract/incident';
import { recordEntryId, routeEntryId } from './contract/tables';
import { INCIDENTS } from './registry';
import { applyMove, caseWorld, placementProblem, settingValue, solvedWorld, startWorld, worldBeforeChanges } from './world';

function incident(id: string): Incident {
  const found = INCIDENTS.find((i) => i.id === id);
  if (!found) throw new Error(`missing incident ${id}`);
  return found;
}

function inbound(world: Network, firewallId: string) {
  return world.firewalls.find((f) => f.id === firewallId)?.inbound ?? [];
}

const IDS = INCIDENTS.map((i) => [i.id]);
const FILTER_IDS = INCIDENTS.filter((i) => i.mechanic === 'filter').map((i) => [i.id]);

describe('the world that grows', () => {
  it('04-01 starts from the base world: Security Groups with no inbound rules', () => {
    const start = startWorld(INCIDENTS, '04-01');
    expect(inbound(start, SG.servidor1)).toEqual([]);
    expect(inbound(start, SG.servidor2)).toEqual([]);
  });

  it('04-02 starts from the solution of 04-01 plus its own changes', () => {
    const start = startWorld(INCIDENTS, '04-02');
    expect(start).toEqual((incident('04-02').changes ?? []).reduce(applyAction, solvedWorld(INCIDENTS, '04-01')));
    expect(inbound(start, SG.servidor2)).toEqual([DAY_SHIFT_RULE]);
  });

  it('worldBeforeChanges is the base world of the incident that opens a chapter and the solution of the incident before it for the rest', () => {
    expect(worldBeforeChanges(INCIDENTS, '04-01')).toBe(incident('04-01').base);
    expect(worldBeforeChanges(INCIDENTS, '04-02')).toEqual(solvedWorld(INCIDENTS, '04-01'));
    expect((incident('04-02').changes ?? []).reduce(applyAction, worldBeforeChanges(INCIDENTS, '04-02'))).toEqual(startWorld(INCIDENTS, '04-02'));
  });

  it.each(IDS)('%s starts and ends with a valid network, and so does every case of a diagnose', (id) => {
    const found = incident(id);
    const cases = found.mechanic === 'diagnose' ? found.diagnose.cases.map((spec) => caseWorld(startWorld(INCIDENTS, id), spec)) : [];
    for (const world of [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id), ...cases]) expect(networkSchema.safeParse(world).success).toBe(true);
  });

  it.each(FILTER_IDS)('%s can name every rule of its firewalls with its chips', (id) => {
    for (const world of [startWorld(INCIDENTS, id), solvedWorld(INCIDENTS, id)]) {
      for (const firewall of world.firewalls) {
        for (const rule of firewall.inbound) expect(chipsOfRule(incident(id), rule), `${firewall.id}/${rule.id}`).not.toBeNull();
      }
    }
  });
});

describe('the world across chapters', () => {
  const { floor1 } = OFFICE_FLOORS;
  const withoutGateway = (deviceId: string): NetworkAction => ({ type: 'setGateway', deviceId });
  const gatewayOf = (world: Network, deviceId: string) => world.devices.find((device) => device.id === deviceId)?.gateway;
  const FIRST = gatewayIncident();
  const LAST_OF_CHAPTER = { ...FIRST, id: '09-02', order: 2, base: undefined, changes: [withoutGateway('andres-laptop')] };
  const AFTER_A_GAP = { ...FIRST, id: '11-01', chapter: 11, order: 1, base: undefined, changes: [withoutGateway('marta-laptop')] };
  const CHAIN = [FIRST, LAST_OF_CHAPTER, AFTER_A_GAP];

  it('an incident with changes and no previous incident in its chapter starts from the solved world of the last incident of the chapter before', () => {
    const before = worldBeforeChanges(CHAIN, AFTER_A_GAP.id);
    expect(before).toEqual(solvedWorld(CHAIN, LAST_OF_CHAPTER.id));
    expect(before).not.toEqual(FIRST.base);
    expect(gatewayOf(before, 'your-laptop')).toBe(floor1.gateway);
    expect(gatewayOf(before, 'andres-laptop')).toBeUndefined();
    const start = startWorld(CHAIN, AFTER_A_GAP.id);
    expect(start).toEqual(AFTER_A_GAP.changes.reduce(applyAction, before));
    expect(gatewayOf(start, 'marta-laptop')).toBeUndefined();
  });

  it('an incident with a base world still starts from its base', () => {
    const opening = { ...AFTER_A_GAP, base: officeNet(), changes: undefined };
    expect(worldBeforeChanges([FIRST, LAST_OF_CHAPTER, opening], opening.id)).toBe(opening.base);
    expect(worldBeforeChanges(CHAIN, FIRST.id)).toBe(FIRST.base);
  });

  it('a first incident with changes and nothing before it still fails with a clear message', () => {
    const message = `${AFTER_A_GAP.id} has changes but no previous incident`;
    expect(() => worldBeforeChanges([AFTER_A_GAP], AFTER_A_GAP.id)).toThrow(message);
    expect(() => worldBeforeChanges([AFTER_A_GAP, { ...FIRST, id: '12-01', chapter: 12 }], AFTER_A_GAP.id)).toThrow(message);
  });
});

describe('applyMove', () => {
  const first = incident('04-01');
  const start = startWorld(INCIDENTS, first.id);
  const place: PlayerMove = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };

  it('builds the rule from the chips', () => {
    expect(inbound(applyMove(start, first, place), SG.servidor2)).toEqual([
      { id: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id), what: WHAT.echoRequest.what, peer: FROM.sgServidor1.peer },
    ]);
  });

  it('placing the same rule twice changes nothing', () => {
    const once = applyMove(start, first, place);
    expect(applyMove(once, first, place)).toBe(once);
  });

  it('placing chips that equal a rule already on the Security Group, with another id, changes nothing', () => {
    const second = incident('04-02');
    const dayShift = startWorld(INCIDENTS, second.id);
    const sameAsDayShift: PlayerMove = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoReply.id, fromId: FROM.anywhere.id };
    expect(ruleIdFor(WHAT.echoReply.id, FROM.anywhere.id)).not.toBe(DAY_SHIFT_RULE.id);
    expect(applyMove(dayShift, second, sameAsDayShift)).toBe(dayShift);
  });

  it('a chip the incident does not offer, or an unknown Security Group, changes nothing', () => {
    expect(applyMove(start, first, { ...place, whatId: WHAT.echoReply.id })).toBe(start);
    expect(applyMove(start, first, { ...place, firewallId: 'sg-ghost' })).toBe(start);
  });

  it('removes a rule by its id, and an unknown id changes nothing', () => {
    const once = applyMove(start, first, place);
    const removed = applyMove(once, first, { type: 'removeRule', firewallId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.sgServidor1.id) });
    expect(inbound(removed, SG.servidor2)).toEqual([]);
    expect(applyMove(once, first, { type: 'removeRule', firewallId: SG.servidor2, ruleId: 'ghost' })).toBe(once);
  });
});

describe('applyMove of an outbound rule', () => {
  const OUTBOUND = outboundFilterIncident();
  const start = startWorld([OUTBOUND], OUTBOUND.id);
  const FIREWALL = 'fw-you';
  const ECHO = 'echo-request';
  const outboundPlace: PlayerMove = { type: 'placeRule', firewallId: FIREWALL, whatId: ECHO, toId: 'to-lucia', direction: 'outbound' };
  const inboundPlace: PlayerMove = { type: 'placeRule', firewallId: FIREWALL, whatId: ECHO, fromId: 'from-lucia' };
  const listsOf = (world: Network) => {
    const firewall = world.firewalls.find((f) => f.id === FIREWALL);
    return { inbound: firewall?.inbound ?? [], outbound: firewall?.outbound ?? [] };
  };

  it('places an outbound rule on the firewall', () => {
    const placed = applyMove(start, OUTBOUND, outboundPlace);
    expect(listsOf(placed)).toEqual({
      inbound: [],
      outbound: [{ id: ruleIdFor(ECHO, 'to-lucia', 'outbound'), what: { kind: 'icmp', icmpType: 8 }, peer: { kind: 'cidr', cidr: `${OFFICE_FLOORS.floor1.lucia}/32` } }],
    });
    expect(placed).toEqual(applyAction(start, { type: 'addRule', firewallId: FIREWALL, direction: 'outbound', rule: listsOf(placed).outbound[0] }));
  });

  it('a rule that already exists in the other direction is not a duplicate', () => {
    const inbound = applyMove(start, OUTBOUND, inboundPlace);
    expect(listsOf(inbound).inbound).toHaveLength(1);
    const both = applyMove(inbound, OUTBOUND, outboundPlace);
    expect(both).not.toBe(inbound);
    expect(listsOf(both).inbound).toEqual(listsOf(inbound).inbound);
    expect(listsOf(both).outbound).toHaveLength(1);
    expect(listsOf(both).outbound[0].peer).toEqual(listsOf(both).inbound[0].peer);
  });

  it('placing the same outbound rule twice changes nothing', () => {
    const once = applyMove(start, OUTBOUND, outboundPlace);
    expect(applyMove(once, OUTBOUND, outboundPlace)).toBe(once);
  });

  it('an outbound move with an inbound chip, a destination chip the incident does not offer or an unknown firewall changes nothing', () => {
    expect(applyMove(start, OUTBOUND, { ...outboundPlace, toId: 'from-lucia' })).toBe(start);
    expect(applyMove(start, OUTBOUND, { ...outboundPlace, toId: 'to-ghost' })).toBe(start);
    expect(applyMove(start, OUTBOUND, { ...outboundPlace, firewallId: 'fw-ghost' })).toBe(start);
  });

  it('removes an outbound rule by its id from the outbound list only', () => {
    const both = applyMove(applyMove(start, OUTBOUND, inboundPlace), OUTBOUND, outboundPlace);
    const outboundId = ruleIdFor(ECHO, 'to-lucia', 'outbound');
    const removed = applyMove(both, OUTBOUND, { type: 'removeRule', firewallId: FIREWALL, ruleId: outboundId, direction: 'outbound' });
    expect(listsOf(removed)).toEqual({ inbound: listsOf(both).inbound, outbound: [] });
    expect(applyMove(both, OUTBOUND, { type: 'removeRule', firewallId: FIREWALL, ruleId: outboundId })).toBe(both);
  });

  it('can name every outbound rule of a firewall with its destination chips', () => {
    const solved = solvedWorld([OUTBOUND], OUTBOUND.id);
    for (const rule of listsOf(solved).outbound) expect(chipsOfRule(OUTBOUND, rule, 'outbound'), rule.id).not.toBeNull();
    expect(listsOf(solved).outbound).toHaveLength(1);
  });
});

describe('applyMove of a setting', () => {
  const GATEWAY = gatewayIncident();
  const start = startWorld([GATEWAY], GATEWAY.id);
  const set = (chipId: string, patch: Partial<SettingMove> = {}): PlayerMove => ({ type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId, ...patch });
  const gatewayOf = (world: Network, deviceId = 'your-laptop') => world.devices.find((device) => device.id === deviceId)?.gateway;
  const withoutLaptop = (world: Network) => ({ ...world, devices: world.devices.filter((device) => device.id !== 'your-laptop') });

  it('a setting move sets the gateway of the device and nothing else', () => {
    expect(gatewayOf(start)).toBeUndefined();
    const after = applyMove(start, GATEWAY, set('router'));
    expect(gatewayOf(after)).toBe('192.168.1.1');
    expect(after).toEqual(applyAction(start, { type: 'setGateway', deviceId: 'your-laptop', gateway: '192.168.1.1' }));
    expect(withoutLaptop(after)).toEqual(withoutLaptop(start));
    expect(after.devices.find((device) => device.id === 'your-laptop')).toEqual({ ...start.devices.find((device) => device.id === 'your-laptop'), gateway: '192.168.1.1' });
  });

  it('a chip with no value takes the gateway away', () => {
    const set192 = applyMove(start, GATEWAY, set('router'));
    const cleared = applyMove(set192, GATEWAY, set('none'));
    expect(cleared).toEqual(start);
    expect(cleared.devices.find((device) => device.id === 'your-laptop')).not.toHaveProperty('gateway');
  });

  it('a chip that is already in effect, an unknown chip, setting or device change nothing', () => {
    expect(applyMove(start, GATEWAY, set('none'))).toBe(start);
    const router = applyMove(start, GATEWAY, set('router'));
    expect(applyMove(router, GATEWAY, set('router'))).toBe(router);
    for (const patch of [{ chipId: 'ghost' }, { settingId: 'ghost' }, { deviceId: 'ghost' }]) expect(applyMove(start, GATEWAY, set('router', patch))).toBe(start);
  });

  it('only a send incident has settings', () => {
    const first = incident('04-01');
    const world = startWorld(INCIDENTS, first.id);
    expect(applyMove(world, first, set('router'))).toBe(world);
  });

  it('the reference solution sets the gateway the incident asks for', () => {
    expect(gatewayOf(solvedWorld([GATEWAY], GATEWAY.id))).toBe('192.168.1.1');
  });
});

describe('the worlds of a diagnose incident', () => {
  const { floor1, floor2 } = OFFICE_FLOORS;
  const GATEWAY = gatewayIncident();
  const DIAGNOSE = { ...diagnoseIncident(), base: undefined, changes: [] };
  const CHAIN = [GATEWAY, DIAGNOSE];
  const before = solvedWorld(CHAIN, GATEWAY.id);
  const start = startWorld(CHAIN, DIAGNOSE.id);
  const cases = DIAGNOSE.diagnose.cases;
  const worlds = cases.map((spec) => caseWorld(start, spec));
  const gatewayOf = (world: Network, deviceId: string) => world.devices.find((device) => device.id === deviceId)?.gateway;

  it('each case starts from the world before the incident plus its own changes, not from the case before', () => {
    expect(start).toEqual(before);
    expect(gatewayOf(start, 'your-laptop')).toBe(floor1.gateway);
    cases.forEach((spec, index) => expect(worlds[index]).toEqual((spec.changes ?? []).reduce(applyAction, start)));
    expect(gatewayOf(worlds[0], 'your-laptop')).toBeUndefined();
    expect(gatewayOf(worlds[1], 'your-laptop')).toBe(floor1.gateway);
    expect(gatewayOf(worlds[2], 'andres-laptop')).toBeUndefined();
    expect(gatewayOf(worlds[3], 'andres-laptop')).toBe(floor2.gateway);
    expect(gatewayOf(worlds[3], 'your-laptop')).toBe(floor1.gateway);
  });

  it('a case with no changes is the world before the incident itself', () => {
    expect(cases[1].changes).toBeUndefined();
    expect(worlds[1]).toBe(start);
    expect(caseWorld(start, {})).toBe(start);
  });

  it('every case world is a valid network', () => {
    worlds.forEach((world) => expect(networkSchema.safeParse(world).success).toBe(true));
  });

  it('a diagnose incident ends as it started, because the player only names causes', () => {
    expect(solvedWorld(CHAIN, DIAGNOSE.id)).toEqual(start);
    expect(applyMove(start, DIAGNOSE, { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'none' })).toBe(start);
  });
});

describe('the world chapter 2 starts from', () => {
  const OFFICE_ROUTER = 'office-router';
  const TO_PROVIDER = [`${OFFICE_ROUTER}:63`, 'provider-router:62'];
  const TO_DESTINATION = [...TO_PROVIDER, 'destination-router:61'];
  const AT_THE_OFFICE_ROUTER = [`${OFFICE_ROUTER}:63`];
  type Trip = [outcome: string, hops: string[] | undefined, rttMs: number | undefined, notice: string | undefined];
  const YOUR_LAPTOP: [string, Trip][] = [
    [IP.server, ['replied', TO_DESTINATION, 84, undefined]],
    [IP.otherOfficePrinter, ['timeout', TO_PROVIDER, undefined, undefined]],
    [IP.printer, ['replied', undefined, 2, undefined]],
    [IP.lucia, ['replied', undefined, 2, undefined]],
    [IP.andres, ['replied', AT_THE_OFFICE_ROUTER, 6, undefined]],
    [IP.router, ['replied', undefined, 4, undefined]],
    [IP.routerSecondFloor, ['replied', undefined, 4, undefined]],
    [IP.officeUplink, ['replied', undefined, 4, undefined]],
    [IP.provider, ['replied', AT_THE_OFFICE_ROUTER, 20, undefined]],
    [IP.providerOnward, ['replied', AT_THE_OFFICE_ROUTER, 20, undefined]],
    [IP.destination, ['replied', TO_PROVIDER, 44, undefined]],
    [IP.destinationServer, ['replied', TO_PROVIDER, 44, undefined]],
    [IP.nobody, ['unreachable', undefined, undefined, 'host-unreachable']],
    [IP.loopback, ['replied', undefined, 0.05, undefined]],
    ['localhost', ['replied', undefined, 0.05, undefined]],
    ['8.8.8.8', ['unreachable', TO_PROVIDER, 20, 'net-unreachable']],
  ];
  const FROM_ANDRES: [string, Trip][] = [
    [IP.server, ['replied', TO_DESTINATION, 84, undefined]],
    [IP.otherOfficePrinter, ['timeout', TO_PROVIDER, undefined, undefined]],
    [IP.printer, ['replied', AT_THE_OFFICE_ROUTER, 6, undefined]],
    [IP.andres, ['replied', undefined, 0.05, undefined]],
    [IP.nobody, ['unreachable', AT_THE_OFFICE_ROUTER, 4, 'host-unreachable']],
    ['8.8.8.8', ['unreachable', TO_PROVIDER, 20, 'net-unreachable']],
  ];
  const BY_TTL: [number, Trip][] = [
    [1, ['ttl-exceeded', [`${OFFICE_ROUTER}:0`], 4, 'time-exceeded']],
    [2, ['ttl-exceeded', [`${OFFICE_ROUTER}:1`, 'provider-router:0'], 20, 'time-exceeded']],
    [3, ['ttl-exceeded', [`${OFFICE_ROUTER}:2`, 'provider-router:1', 'destination-router:0'], 44, 'time-exceeded']],
    [4, ['replied', [`${OFFICE_ROUTER}:3`, 'provider-router:2', 'destination-router:1'], 84, undefined]],
  ];
  const ping = (fromId: string, to: string, ttl?: number): PacketSpec => ({ from: { kind: 'device', id: fromId }, to, protocol: 'icmp', icmpType: 8, ...(ttl && { ttl }) });
  const tripOf = (world: Network, packet: PacketSpec): Trip => {
    const trace = simulate(world, packet);
    return [trace.outcome, trace.hops?.map(({ routerId, ttlLeft }) => `${routerId}:${ttlLeft}`), trace.rttMs, trace.notice?.kind];
  };

  it('the pings of chapter 1 give the same outcome, hops and times in the world chapter 2 starts from', () => {
    const world = solvedWorld(INCIDENTS, '01-14');
    expect(world.routers?.map((router) => router.id)).toEqual([OFFICE_ROUTER, 'provider-router', 'destination-router']);
    for (const [to, trip] of YOUR_LAPTOP) expect(tripOf(world, ping(DEVICE.you.id, to)), `your laptop to ${to}`).toEqual(trip);
    for (const [to, trip] of FROM_ANDRES) expect(tripOf(world, ping(DEVICE.andres.id, to)), `Andrés's laptop to ${to}`).toEqual(trip);
    for (const [ttl, trip] of BY_TTL) expect(tripOf(world, ping(DEVICE.you.id, IP.server, ttl)), `ttl ${ttl}`).toEqual(trip);
  });

  it('a ping that leaves the office is translated and still shows the private IP as its source', () => {
    const world = solvedWorld(INCIDENTS, '01-14');
    const toServer = simulate(world, ping(DEVICE.you.id, IP.server));
    expect(toServer.translation).toEqual({ protocol: 'icmp', inside: { ip: IP.you }, outside: { ip: IP.officeUplink }, isNew: false, fixed: false });
    expect([toServer.effectiveSource, toServer.header?.request.source]).toEqual([IP.you, IP.you]);
    for (const to of [IP.printer, IP.andres, IP.router, IP.officeUplink, IP.nobody, IP.loopback]) expect(simulate(world, ping(DEVICE.you.id, to)), to).not.toHaveProperty('translation');
  });
});

describe('applyMove of the tables, the clock and the settings of chapter 2', () => {
  const NAMES = namesSendIncident();
  const { zone, authoritative, resolver } = NAME_SERVERS;
  const { provider, range, server, floor1 } = OFFICE_FLOORS;
  const WWW = `www.${zone}`;
  const start = startWorld([NAMES], NAMES.id);
  const tableOf = (kind: TableSpec['kind']) => NAMES.send.tables!.find((table) => table.kind === kind)!;
  const placeRoute = (destination: string, nextHop: string = OFFICE_FLOORS.officeRouter.id): PlaceEntryMove => ({ type: 'placeEntry', tableId: tableOf('routes').id, picks: { destination, nextHop } });
  const placeRecord = (name: string, type: string, value: string): PlaceEntryMove => ({ type: 'placeEntry', tableId: tableOf('records').id, picks: { name, type, value } });
  const routesOf = (world: Network, routerId = provider.id) => world.routers?.find((router) => router.id === routerId)?.routes ?? [];
  const serverOf = (world: Network, id: string) => world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === id)!;
  const recordsOf = (world: Network) => serverOf(world, authoritative.id).dns?.zones?.[0].records ?? [];
  const deviceOf = (world: Network, id: string) => world.devices.find((device) => device.id === id)!;
  const withTables = (...tables: TableSpec[]) => ({ ...NAMES, send: { ...NAMES.send, tables } });
  const OTHER_IP = '198.51.100.51';
  const chips = <Value extends string>(...values: Value[]) => values.map((value) => ({ id: value, label: value, value }));
  const MORE_RECORDS = withTables({ id: 'records', kind: 'records', ownerId: authoritative.id, trays: { name: chips(WWW), type: chips('A', 'CNAME'), value: chips(server.ip, OTHER_IP) } });

  it('placeEntry of a route adds it to the table of its owner and nothing else', () => {
    const without = applyMove(start, NAMES, { type: 'removeEntry', tableId: tableOf('routes').id, entryId: routeEntryId({ to: range }) });
    expect(routesOf(without)).toHaveLength(routesOf(start).length - 1);
    const added = applyMove(without, NAMES, placeRoute(range));
    expect(added).toEqual(applyAction(without, { type: 'addRoute', routerId: provider.id, route: { to: range, next: OFFICE_FLOORS.officeRouter.id } }));
    expect(routesOf(added).at(-1)).toEqual({ to: range, next: OFFICE_FLOORS.officeRouter.id });
    expect(networkSchema.safeParse(added).success).toBe(true);
  });

  it('placeEntry of a record adds it with the time to live of the game to the zone of its server', () => {
    const added = applyMove(start, MORE_RECORDS, placeRecord(WWW, 'A', OTHER_IP));
    expect(recordsOf(added).at(-1)).toEqual({ name: WWW, type: 'A', value: OTHER_IP, ttl: RECORD_TTL });
    expect(recordsOf(added)).toHaveLength(recordsOf(start).length + 1);
    expect(networkSchema.safeParse(added).success).toBe(true);
  });

  it('applyMove returns the same world when an entry is already in the table', () => {
    expect(applyMove(start, NAMES, placeRoute(range))).toBe(start);
    expect(applyMove(start, NAMES, placeRoute('default'))).not.toBe(start);
    expect(applyMove(start, NAMES, placeRecord(WWW, 'A', server.ip))).toBe(start);
  });

  it('a placement the engine refuses, or one the incident does not offer, changes nothing', () => {
    const blog = `blog.${zone}`;
    const odd = withTables({ id: 'records', kind: 'records', ownerId: authoritative.id, trays: { name: [{ id: 'blog', label: blog, value: blog }, { id: 'www', label: WWW, value: WWW }, { id: 'shop', label: `tienda.${zone}`, value: `tienda.${zone}` }], type: [{ id: 'a', label: 'A', value: 'A' }, { id: 'cname', label: 'CNAME', value: 'CNAME' }], value: [{ id: 'ip', label: server.ip, value: server.ip }, { id: 'name', label: WWW, value: WWW }] } });
    const place = (name: string, type: string, value: string): PlayerMove => ({ type: 'placeEntry', tableId: 'records', picks: { name, type, value } });
    expect(applyMove(start, odd, place('blog', 'a', 'ip'))).toBe(start);
    expect(applyMove(start, odd, place('www', 'a', 'name'))).toBe(start);
    expect(applyMove(start, odd, place('www', 'cname', 'name'))).toBe(start);
    expect(recordsOf(applyMove(start, odd, place('shop', 'cname', 'name'))).at(-1)).toEqual({ name: `tienda.${zone}`, type: 'CNAME', value: WWW, ttl: RECORD_TTL });
    const wanted: PlayerMove[] = [{ ...placeRoute(range), tableId: 'ghost' }, placeRoute('ghost'), placeRoute(range, 'ghost'), { ...placeRoute(range), picks: { destination: range } }];
    for (const move of wanted) expect(applyMove(start, NAMES, move), JSON.stringify(move)).toBe(start);
  });

  it('removeEntry removes the row it names, from a table of routes and from one of records', () => {
    const route = { to: range, next: OFFICE_FLOORS.officeRouter.id };
    const noRoute = applyMove(start, NAMES, { type: 'removeEntry', tableId: tableOf('routes').id, entryId: routeEntryId(route) });
    expect(routesOf(noRoute)).toEqual(routesOf(start).filter(({ to }) => to !== range));
    expect(noRoute).toEqual(applyAction(start, { type: 'removeRoute', routerId: provider.id, to: range }));
    const www = { name: WWW, type: 'A' as const, value: server.ip };
    const noRecord = applyMove(start, NAMES, { type: 'removeEntry', tableId: tableOf('records').id, entryId: recordEntryId(www) });
    expect(recordsOf(noRecord).filter((record) => record.name === WWW)).toEqual([]);
    expect(recordsOf(noRecord)).toHaveLength(recordsOf(start).length - 1);
    expect(networkSchema.safeParse(noRecord).success).toBe(true);
  });

  it('an entry id that names no row, a record of the zone itself and an unknown table change nothing', () => {
    const remove = (tableId: string, entryId: string): PlayerMove => ({ type: 'removeEntry', tableId, entryId });
    const apex = recordsOf(start).find((record) => record.type === 'SOA')!;
    expect(applyMove(start, NAMES, remove(tableOf('routes').id, 'ghost'))).toBe(start);
    expect(applyMove(start, NAMES, remove(tableOf('records').id, recordEntryId({ name: WWW, type: 'A', value: '198.51.100.51' })))).toBe(start);
    expect(applyMove(start, NAMES, remove(tableOf('records').id, recordEntryId({ name: apex.name, type: 'A', value: server.ip })))).toBe(start);
    expect(applyMove(start, NAMES, remove('ghost', routeEntryId({ to: range })))).toBe(start);
  });

  it('names a route by its destination and a record by its name, type and value', () => {
    expect(routeEntryId({ to: range })).toBe(range);
    const ids = [recordEntryId({ name: WWW, type: 'A', value: server.ip }), recordEntryId({ name: WWW, type: 'CNAME', value: server.ip }), recordEntryId({ name: `blog.${zone}`, type: 'A', value: server.ip }), recordEntryId({ name: WWW, type: 'A', value: '198.51.100.51' })];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only a send incident has tables to edit, and a wait changes no world', () => {
    const first = incident('04-01');
    const world = startWorld(INCIDENTS, first.id);
    expect(applyMove(world, first, placeRoute(range))).toBe(world);
    expect(applyMove(world, first, { type: 'removeEntry', tableId: 'routes', entryId: range })).toBe(world);
    expect(applyMove(start, NAMES, { type: 'wait', seconds: 60 })).toBe(start);
  });

  it('placementProblem says why the engine refuses a placement the incident offers', () => {
    expect(placementProblem(start, NAMES, placeRoute(range))).toBe('destination-has-route');
    expect(placementProblem(start, NAMES, placeRecord(WWW, 'A', server.ip))).toBe('already-there');
    expect(placementProblem(start, NAMES, placeRoute('default'))).toBeUndefined();
    expect(placementProblem(start, NAMES, { ...placeRoute(range), tableId: 'ghost' })).toBeUndefined();
    expect(placementProblem(start, NAMES, placeRoute('ghost'))).toBeUndefined();
  });

  it('a setting move sets the DNS server of a device, and a chip with no value takes it away', () => {
    const set = (chipId: string): PlayerMove => ({ type: 'setSetting', deviceId: 'your-laptop', settingId: 'resolver', chipId });
    expect(deviceOf(start, 'your-laptop').dnsServer).toBe(resolver.ip);
    const cleared = applyMove(start, NAMES, set('none'));
    expect(cleared).toEqual(applyAction(start, { type: 'setDnsServer', deviceId: 'your-laptop' }));
    expect(deviceOf(cleared, 'your-laptop')).not.toHaveProperty('dnsServer');
    const again = applyMove(cleared, NAMES, set('resolver'));
    expect(again).toEqual(start);
    expect(applyMove(start, NAMES, set('resolver'))).toBe(start);
    expect(applyMove(cleared, NAMES, set('none'))).toBe(cleared);
    expect(deviceOf(cleared, 'your-laptop').gateway).toBe(floor1.gateway);
  });

  it('a setting move sets the listen address of the service it names, and nothing else', () => {
    const serving = applyAction(start, { type: 'setServices', ownerId: 'lucia-laptop', services: [tcpService(3000), tcpService(22)] });
    const set = (chipId: string): PlayerMove => ({ type: 'setSetting', deviceId: 'lucia-laptop', settingId: 'app', chipId });
    const loopback = applyMove(serving, NAMES, set('loopback'));
    expect(deviceOf(loopback, 'lucia-laptop').host.services).toEqual([tcpService(3000, 'loopback'), tcpService(22)]);
    expect(applyMove(loopback, NAMES, set('all'))).toEqual(serving);
    expect(applyMove(loopback, NAMES, set('loopback'))).toBe(loopback);
    expect(applyMove(serving, NAMES, set('all'))).toBe(serving);
    expect(applyMove(start, NAMES, set('loopback'))).toBe(start);
  });

  it('settingValue reads the value a setting has in the world, by its kind', () => {
    const [resolverSetting, listenSetting] = NAMES.send.settings!;
    const serving = applyAction(start, { type: 'setServices', ownerId: 'lucia-laptop', services: [tcpService(3000, 'loopback')] });
    expect(settingValue(start, resolverSetting)).toBe(resolver.ip);
    expect(settingValue(applyAction(start, { type: 'setDnsServer', deviceId: 'your-laptop' }), resolverSetting)).toBeNull();
    expect(settingValue(serving, listenSetting)).toBe('loopback');
    expect(settingValue(start, listenSetting)).toBeNull();
    expect(settingValue(start, { ...listenSetting, deviceId: 'ghost' })).toBeNull();
    const gateway = gatewayIncident();
    expect(settingValue(startWorld([gateway], gateway.id), gateway.send.settings![0])).toBeNull();
    expect(settingValue(applyMove(startWorld([gateway], gateway.id), gateway, { type: 'setSetting', deviceId: 'your-laptop', settingId: 'gateway', chipId: 'router' }), gateway.send.settings![0])).toBe(floor1.gateway);
  });
});
