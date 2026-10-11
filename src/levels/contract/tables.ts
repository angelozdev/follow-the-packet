import { RECORD_TTL, isIpv4, type AnswerRecord, type Network, type NetworkAction, type Route, type ServerActor } from '@/engine';
import type { Incident, TableSpec } from './incident';

type RecordKey = Pick<AnswerRecord, 'name' | 'type' | 'value'>;
type Placement = Extract<NetworkAction, { type: 'addRoute' | 'addRecord' }>;
type Removal = Extract<NetworkAction, { type: 'removeRoute' | 'removeRecord' }>;

const ENTRY_ID_JOINER = '|';

/** Returns the id of a row of a table of routes: its destination, since a table holds one route to each. */
export function routeEntryId({ to }: Pick<Route, 'to'>): string {
  return to;
}

/** Returns the id of a row of a table of records: its name, type and value, which are what tell one record from another. */
export function recordEntryId({ name, type, value }: RecordKey): string {
  return [name, type, value].join(ENTRY_ID_JOINER);
}

/** Returns the table the player edits that has this id in a send incident; none for any other incident or for an id it does not offer. */
export function tableOf(incident: Incident, tableId: string): TableSpec | undefined {
  return incident.mechanic === 'send' ? incident.send.tables?.find((table) => table.id === tableId) : undefined;
}

function recordOf(name: string, type: AnswerRecord['type'], value: string): AnswerRecord | null {
  if (type === 'A') return isIpv4(value) ? { name, type, value, ttl: RECORD_TTL } : null;
  return { name, type, value, ttl: RECORD_TTL };
}

/** Returns the action that places the entry the chips of a table stand for, one chip picked in each tray: a route of the router that owns a table of routes, or a record, with the time to live of the game, in the zone of the server that owns a table of records. Null when a tray has no pick or the pick is not one of its chips, and when the chips do not make a record (an address record whose value is not an IP). */
export function placementOf(table: TableSpec, picks: Readonly<Record<string, string>>): Placement | null {
  const pick = <Value extends string>(chips: readonly { id: string; value: Value }[], trayName: string): Value | undefined => chips.find((chip) => chip.id === picks[trayName])?.value;
  if (table.kind === 'routes') {
    const [to, next] = [pick(table.trays.destination, 'destination'), pick(table.trays.nextHop, 'nextHop')];
    return to !== undefined && next !== undefined ? { type: 'addRoute', routerId: table.ownerId, route: { to, next } } : null;
  }
  const [name, type, value] = [pick(table.trays.name, 'name'), pick(table.trays.type, 'type'), pick(table.trays.value, 'value')];
  const record = name !== undefined && type !== undefined && value !== undefined ? recordOf(name, type, value) : null;
  return record ? { type: 'addRecord', serverId: table.ownerId, record } : null;
}

function serverOf(world: Network, id: string): ServerActor | undefined {
  return world.actors.find((actor): actor is ServerActor => actor.kind === 'server' && actor.id === id);
}

/** Returns the action that removes the row of the table that has this id in the world, or null when the owner has no such row. The records of the zone itself (the NS and the SOA) are not rows of a table: the player neither places nor removes them. */
export function removalOf(world: Network, table: TableSpec, entryId: string): Removal | null {
  if (table.kind === 'routes') {
    const route = (world.routers ?? []).find((router) => router.id === table.ownerId)?.routes.find((held) => routeEntryId(held) === entryId);
    return route ? { type: 'removeRoute', routerId: table.ownerId, to: route.to } : null;
  }
  const records = (serverOf(world, table.ownerId)?.dns?.zones ?? []).flatMap((zone) => zone.records).filter((held): held is AnswerRecord => held.type === 'A' || held.type === 'CNAME');
  const record = records.find((held) => recordEntryId(held) === entryId);
  return record ? { type: 'removeRecord', serverId: table.ownerId, record: { name: record.name, type: record.type, value: record.value } } : null;
}
